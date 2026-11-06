package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"

	"github.com/muddyrain/renderly/backend/internal/config"
	"github.com/muddyrain/renderly/backend/internal/database"
	"github.com/muddyrain/renderly/backend/internal/project"
	"github.com/muddyrain/renderly/backend/internal/repository"
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
	if err := cfg.Validate(); err != nil {
		return err
	}
	deps := server.Dependencies{}
	if cfg.DatabaseURL != "" {
		pool, err := database.Open(context.Background(), cfg.DatabaseURL)
		if err != nil {
			return err
		}
		defer pool.Close() // HTTP run/drain finishes before database resources are released.
		deps.Projects = project.New(repository.NewProjects(pool))
		deps.Ready = database.Ready(pool, cfg)
	}
	api, err := server.New(cfg, slog.Default(), deps)
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
