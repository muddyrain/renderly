// Package server owns the Hertz HTTP transport. Application modules use
// context.Context and owned input/output values rather than RequestContext.
package server

import (
	"context"
	"errors"
	"log/slog"
	"time"

	"github.com/cloudwego/hertz/pkg/app/server"
	"github.com/cloudwego/hertz/pkg/network/standard"
	"github.com/muddyrain/renderly/backend/internal/config"
)

const ShutdownTimeout = 10 * time.Second

// ErrShutdownTimeout identifies exhaustion of the server's own drain budget.
// The returned error also matches context.DeadlineExceeded.
var ErrShutdownTimeout = errors.New("HTTP server shutdown deadline exceeded")

type Server struct {
	h *server.Hertz
}

// New validates configuration and registers middleware and routes without listening.
func New(cfg config.Config, logger *slog.Logger) (*Server, error) {
	if err := cfg.Validate(); err != nil {
		return nil, err
	}
	if logger == nil {
		logger = slog.Default()
	}
	h := server.New(
		server.WithHostPorts(cfg.APIAddr),
		server.WithTransport(standard.NewTransporter),
		server.WithReadTimeout(10*time.Second),
		server.WithWriteTimeout(30*time.Second),
		// Standard transport waits for idle keep-alive reads during shutdown.
		// Keep this below the drain budget so idle clients do not exhaust it.
		server.WithIdleTimeout(5*time.Second),
		server.WithExitWaitTime(ShutdownTimeout),
		server.WithMaxRequestBodySize(4<<20),
		server.WithDisablePreParseMultipartForm(true),
	)
	registerMiddleware(h, cfg, logger)
	registerRoutes(h)
	return &Server{h: h}, nil
}

func (s *Server) Run() error {
	return s.h.Run()
}

func (s *Server) Shutdown(ctx context.Context) error {
	// Own the deadline before Hertz derives its internal context. Hertz may
	// normalize that context's timeout to nil, so its return value alone cannot
	// tell us whether the drain completed. An earlier caller deadline still wins.
	ctx, cancel := context.WithTimeoutCause(ctx, s.h.GetOptions().ExitWaitTimeout, ErrShutdownTimeout)
	defer cancel()
	err := s.h.Shutdown(ctx)
	if context.Cause(ctx) == ErrShutdownTimeout {
		return errors.Join(err, ctx.Err(), ErrShutdownTimeout)
	}
	return errors.Join(err, ctx.Err())
}
