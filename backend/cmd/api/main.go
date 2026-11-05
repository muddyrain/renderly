package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/muddyrain/renderly/backend/internal/config"
	"github.com/muddyrain/renderly/backend/internal/server"
)

func main() {
	if err := run(); err != nil {
		slog.Error("Renderly API stopped", "error", err)
		os.Exit(1)
	}
}

func run() error {
	cfg := config.Load()
	api, err := server.New(cfg, slog.Default())
	if err != nil {
		return fmt.Errorf("initialize HTTP server: %w", err)
	}
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	serveErr := make(chan error, 1)
	go func() { serveErr <- api.Run() }()
	select {
	case err := <-serveErr:
		return err
	case <-ctx.Done():
	}
	stop() // A second signal may terminate the process immediately.
	slog.Info("Renderly API shutting down")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), server.ShutdownTimeout)
	defer cancel()
	if err := api.Shutdown(shutdownCtx); err != nil {
		return fmt.Errorf("shutdown HTTP server: %w", err)
	}
	select {
	case err := <-serveErr:
		return err
	case <-shutdownCtx.Done():
		return shutdownCtx.Err()
	}
}
