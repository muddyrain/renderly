package server

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net"
	"net/http"
	"strings"
	"testing"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/common/ut"
	"github.com/muddyrain/renderly/backend/internal/config"
)

func newTestServer(t *testing.T, addr string, output io.Writer) *Server {
	t.Helper()
	s, err := New(config.Config{APIAddr: addr, WebOrigin: "http://localhost:3000"},
		slog.New(slog.NewTextHandler(output, nil)))
	if err != nil {
		t.Fatal(err)
	}
	return s
}

func TestNewRejectsInvalidConfig(t *testing.T) {
	if _, err := New(config.Config{APIAddr: ":8080", WebOrigin: "*"}, nil); err == nil {
		t.Fatal("expected configuration error")
	}
}

func TestProbeRoutes(t *testing.T) {
	s := newTestServer(t, ":8080", io.Discard)
	health := ut.PerformRequest(s.h.Engine, "GET", "/healthz", nil)
	if health.Code != http.StatusOK || !strings.HasPrefix(string(health.Header().ContentType()), "application/json") {
		t.Fatalf("health status=%d, content-type=%q", health.Code, health.Header().ContentType())
	}
	var body map[string]string
	if err := json.Unmarshal(health.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if len(body) != 2 || body["status"] != "ok" || body["service"] != "renderly-api" {
		t.Fatalf("unexpected health response: %v", body)
	}
	ready := ut.PerformRequest(s.h.Engine, "GET", "/readyz", nil)
	var readiness struct {
		Status  string            `json:"status"`
		Service string            `json:"service"`
		Checks  map[string]string `json:"checks"`
	}
	if err := json.Unmarshal(ready.Body.Bytes(), &readiness); err != nil {
		t.Fatal(err)
	}
	if ready.Code != http.StatusServiceUnavailable || readiness.Status != "not_ready" || readiness.Service != "renderly-api" {
		t.Fatalf("unimplemented dependencies must not report ready: %d %s", ready.Code, ready.Body)
	}
	if readiness.Checks["config"] != "ok" || len(readiness.Checks) != 4 {
		t.Fatalf("unexpected checks: %v", readiness.Checks)
	}
	for _, dependency := range []string{"postgres", "redis", "storage"} {
		if readiness.Checks[dependency] != "not_implemented" {
			t.Fatalf("%s check was misrepresented", dependency)
		}
	}
	if got := ut.PerformRequest(s.h.Engine, "GET", "/missing", nil); got.Code != http.StatusNotFound {
		t.Fatalf("unregistered route status=%d", got.Code)
	}
}

func TestRequestID(t *testing.T) {
	s := newTestServer(t, ":8080", io.Discard)
	s.h.GET("/context", func(ctx context.Context, c *app.RequestContext) {
		c.String(http.StatusOK, "%s", RequestID(ctx))
	})
	generated := make(map[string]bool)
	for _, input := range []string{"", "", "client-request_01.test", strings.Repeat("x", 129), "unsafe request/id"} {
		r := ut.PerformRequest(s.h.Engine, "GET", "/context", nil, ut.Header{Key: "X-Request-ID", Value: input})
		id := string(r.Header().Peek("X-Request-ID"))
		if !validRequestID(id) || r.Body.String() != id {
			t.Fatalf("request ID was not propagated into context and response: %q", id)
		}
		if validRequestID(input) {
			if id != input {
				t.Fatalf("valid client request ID was changed: %q", id)
			}
		} else {
			if len(id) != 32 || generated[id] {
				t.Fatalf("expected a fresh 128-bit request ID, got %q", id)
			}
			generated[id] = true
		}
	}
}

func TestCORS(t *testing.T) {
	s := newTestServer(t, ":8080", io.Discard)
	for _, tc := range []struct {
		name, method, origin string
		status               int
	}{
		{"without origin", "GET", "", 200},
		{"allowed origin", "GET", "http://localhost:3000", 200},
		{"blocked origin", "GET", "https://untrusted.example", 403},
		{"preflight", "OPTIONS", "http://localhost:3000", 204},
		{"blocked preflight", "OPTIONS", "https://untrusted.example", 403},
	} {
		t.Run(tc.name, func(t *testing.T) {
			r := ut.PerformRequest(s.h.Engine, tc.method, "/healthz", nil,
				ut.Header{Key: "Origin", Value: tc.origin},
				ut.Header{Key: "Access-Control-Request-Method", Value: "GET"},
				ut.Header{Key: "Access-Control-Request-Headers", Value: "X-Request-ID"})
			if r.Code != tc.status {
				t.Fatalf("status=%d, want %d", r.Code, tc.status)
			}
			allowed := string(r.Header().Peek("Access-Control-Allow-Origin"))
			if tc.origin == "http://localhost:3000" {
				if allowed != tc.origin {
					t.Fatalf("allowed origin=%q", allowed)
				}
			} else if allowed != "" {
				t.Fatalf("unexpected CORS grant: %q", allowed)
			}
			if len(r.Header().Peek("X-Request-ID")) == 0 {
				t.Fatal("request ID missing on middleware response")
			}
			if tc.status == http.StatusNoContent && !strings.Contains(string(r.Header().Peek("Access-Control-Allow-Methods")), "GET") {
				t.Fatal("preflight did not allow GET")
			}
		})
	}
}

func TestRecoveryAndAccessLogDoNotLeakRequestData(t *testing.T) {
	var output bytes.Buffer
	s := newTestServer(t, ":8080", &output)
	s.h.POST("/panic/:id", func(_ context.Context, c *app.RequestContext) {
		c.SetBodyString("secret-partial-response")
		panic("secret-panic-value")
	})
	const body = "secret-request-body"
	r := ut.PerformRequest(s.h.Engine, "POST", "/panic/secret-path?token=secret-query",
		&ut.Body{Body: strings.NewReader(body), Len: len(body)},
		ut.Header{Key: "Authorization", Value: "Bearer secret-auth-header"},
		ut.Header{Key: "X-Request-ID", Value: "review-request-1"})
	if r.Code != http.StatusInternalServerError || !strings.Contains(r.Body.String(), "internal_error") {
		t.Fatalf("panic was not recovered: %d %s", r.Code, r.Body)
	}
	for _, secret := range []string{body, "secret-path", "secret-query", "secret-auth-header", "secret-panic-value", "secret-partial-response"} {
		if strings.Contains(output.String(), secret) || strings.Contains(r.Body.String(), secret) {
			t.Fatalf("request data leaked: %s", secret)
		}
	}
	for _, field := range []string{"request panic", "request_id=review-request-1", "route=/panic/:id", "status=500", "duration="} {
		if !strings.Contains(output.String(), field) {
			t.Fatalf("access log field missing: %s", field)
		}
	}
}

func TestRunReportsBindFailure(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	s := newTestServer(t, listener.Addr().String(), io.Discard)
	if err := s.Run(); err == nil {
		t.Fatal("expected an error for an occupied port")
	}
}
