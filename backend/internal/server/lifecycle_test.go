package server

import (
	"bufio"
	"context"
	"errors"
	"io"
	"net"
	"net/http"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
)

func TestShutdownClosesIdleKeepAlive(t *testing.T) {
	s, _, base, serveErr := startTestServer(t, func(*Server) {})
	connection, err := net.DialTimeout("tcp", strings.TrimPrefix(base, "http://"), time.Second)
	if err != nil {
		t.Fatal(err)
	}
	defer connection.Close()
	if err := connection.SetDeadline(time.Now().Add(8 * time.Second)); err != nil {
		t.Fatal(err)
	}
	if _, err := io.WriteString(connection, "GET /healthz HTTP/1.1\r\nHost: localhost\r\n\r\n"); err != nil {
		t.Fatal(err)
	}
	r, err := http.ReadResponse(bufio.NewReader(connection), nil)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := io.Copy(io.Discard, r.Body); err != nil {
		t.Fatal(err)
	}
	r.Body.Close()
	if r.Close {
		t.Fatal("fixture did not establish a keep-alive connection")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 6*time.Second)
	defer cancel()
	if err := s.Shutdown(ctx); err != nil {
		t.Fatalf("idle keep-alive prevented graceful shutdown: %v", err)
	}
	if err := waitError(t, serveErr); err != nil {
		t.Fatal(err)
	}
}

func waitError(t *testing.T, result <-chan error) error {
	t.Helper()
	select {
	case err := <-result:
		return err
	case <-time.After(3 * time.Second):
		t.Fatal("operation did not finish")
		return nil
	}
}

func startTestServer(t *testing.T, configure func(*Server)) (*Server, *http.Client, string, <-chan error) {
	t.Helper()
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	addr := listener.Addr().String()
	if err := listener.Close(); err != nil {
		t.Fatal(err)
	}
	s := newTestServer(t, addr, io.Discard)
	configure(s)
	serveErr := make(chan error, 1)
	go func() { serveErr <- s.Run() }()
	client := &http.Client{Timeout: 3 * time.Second, Transport: &http.Transport{DisableKeepAlives: true}}
	t.Cleanup(func() {
		client.CloseIdleConnections()
		if s.h.IsRunning() {
			ctx, cancel := context.WithTimeout(context.Background(), time.Second)
			defer cancel()
			_ = s.Shutdown(ctx)
		}
	})
	base := "http://" + addr
	deadline := time.NewTimer(3 * time.Second)
	defer deadline.Stop()
	ticker := time.NewTicker(5 * time.Millisecond)
	defer ticker.Stop()
	for {
		r, err := client.Get(base + "/healthz")
		if err == nil {
			r.Body.Close()
			if r.StatusCode == http.StatusOK {
				return s, client, base, serveErr
			}
		}
		select {
		case err := <-serveErr:
			t.Fatalf("server exited before health check: %v", err)
		case <-deadline.C:
			t.Fatal("server did not start")
		case <-ticker.C:
		}
	}
}

func TestShutdown(t *testing.T) {
	for _, deadlineExpires := range []bool{false, true} {
		name := "drains active request"
		if deadlineExpires {
			name = "reports deadline"
		}
		t.Run(name, func(t *testing.T) {
			started, release := make(chan struct{}), make(chan struct{})
			var once sync.Once
			releaseHandler := func() { once.Do(func() { close(release) }) }
			defer releaseHandler()
			s, client, base, serveErr := startTestServer(t, func(s *Server) {
				s.h.GET("/blocked", func(_ context.Context, c *app.RequestContext) {
					close(started)
					<-release
					c.String(http.StatusOK, "finished")
				})
			})
			requestDone := make(chan error, 1)
			go func() {
				r, err := client.Get(base + "/blocked")
				if err == nil {
					defer r.Body.Close()
					body, readErr := io.ReadAll(r.Body)
					err = readErr
					if err == nil && (r.StatusCode != http.StatusOK || string(body) != "finished") {
						err = errors.New("in-flight response was not completed")
					}
				}
				requestDone <- err
			}()
			select {
			case <-started:
			case <-time.After(3 * time.Second):
				t.Fatal("request did not start")
			}
			timeout := 2 * time.Second
			if deadlineExpires {
				timeout = 30 * time.Millisecond
			}
			ctx, cancel := context.WithTimeout(context.Background(), timeout)
			defer cancel()
			shutdownDone := make(chan error, 1)
			go func() { shutdownDone <- s.Shutdown(ctx) }()
			if deadlineExpires {
				if err := waitError(t, shutdownDone); !errors.Is(err, context.DeadlineExceeded) {
					t.Fatalf("incomplete drain must report deadline, got %v", err)
				} else if errors.Is(err, ErrShutdownTimeout) {
					t.Fatal("short caller deadline was misreported as server budget exhaustion")
				}
			} else {
				select {
				case err := <-shutdownDone:
					t.Fatalf("shutdown returned before the active handler finished: %v", err)
				case <-time.After(50 * time.Millisecond):
				}
			}
			releaseHandler()
			if err := waitError(t, requestDone); err != nil {
				t.Fatal(err)
			}
			if !deadlineExpires {
				if err := waitError(t, shutdownDone); err != nil {
					t.Fatal(err)
				}
			}
			if err := waitError(t, serveErr); err != nil {
				t.Fatal(err)
			}
			if connection, err := net.DialTimeout("tcp", strings.TrimPrefix(base, "http://"), time.Second); err == nil {
				connection.Close()
				t.Fatal("listener still accepts connections after shutdown")
			}
		})
	}
}

func TestShutdownInternalTimeout(t *testing.T) {
	for _, name := range []string{"longer caller deadline", "background context"} {
		t.Run(name, func(t *testing.T) {
			started, release, finished := make(chan struct{}), make(chan struct{}), make(chan struct{})
			var once sync.Once
			releaseHandler := func() { once.Do(func() { close(release) }) }
			defer releaseHandler()
			s, client, base, serveErr := startTestServer(t, func(s *Server) {
				s.h.GET("/blocked", func(_ context.Context, c *app.RequestContext) {
					close(started)
					<-release
					c.String(http.StatusOK, "finished")
					close(finished)
				})
			})
			client.Timeout = ShutdownTimeout + 5*time.Second
			requestDone := make(chan error, 1)
			go func() {
				r, err := client.Get(base + "/blocked")
				if err == nil {
					defer r.Body.Close()
					body, readErr := io.ReadAll(r.Body)
					err = readErr
					if err == nil && (r.StatusCode != http.StatusOK || string(body) != "finished") {
						err = errors.New("blocked handler response was not completed after release")
					}
				}
				requestDone <- err
			}()
			select {
			case <-started:
			case <-time.After(3 * time.Second):
				t.Fatal("request did not start")
			}
			ctx := context.Background()
			if name == "longer caller deadline" {
				var cancel context.CancelFunc
				ctx, cancel = context.WithTimeout(ctx, ShutdownTimeout+2*time.Second)
				defer cancel()
			}
			start := time.Now()
			err := s.Shutdown(ctx)
			t.Logf("Shutdown elapsed=%s, caller error=%v, shutdown error=%v", time.Since(start), ctx.Err(), err)
			if err == nil || !errors.Is(err, context.DeadlineExceeded) {
				t.Fatalf("internal deadline must not report success: %v", err)
			}
			if !errors.Is(err, ErrShutdownTimeout) {
				t.Fatalf("internal deadline must identify server budget exhaustion: %v", err)
			}
			if ctx.Err() != nil {
				t.Fatalf("caller deadline expired before internal timeout was observed: %v", ctx.Err())
			}
			select {
			case <-finished:
				t.Fatal("blocked handler unexpectedly finished before release")
			default:
			}
			releaseHandler()
			if err := waitError(t, requestDone); err != nil {
				t.Fatal(err)
			}
			if err := waitError(t, serveErr); err != nil {
				t.Fatal(err)
			}
		})
	}
}

func TestShutdownRepeated(t *testing.T) {
	s, _, _, serveErr := startTestServer(t, func(*Server) {})
	if err := s.Shutdown(context.Background()); err != nil {
		t.Fatal(err)
	}
	if err := waitError(t, serveErr); err != nil {
		t.Fatal(err)
	}
	// Compare the public API's actual error, without matching its private message.
	frameworkErr := s.h.Shutdown(context.Background())
	if frameworkErr == nil {
		t.Fatal("expected Hertz to reject Shutdown after the engine has closed")
	}
	err := s.Shutdown(context.Background())
	if !errors.Is(err, frameworkErr) || errors.Is(err, context.DeadlineExceeded) || errors.Is(err, ErrShutdownTimeout) {
		t.Fatalf("repeated shutdown must preserve Hertz's state error, got %v", err)
	}
	t.Logf("Hertz repeated Shutdown: %T: %v", frameworkErr, frameworkErr)
}
