package main

import (
	"context"
	"errors"
	"fmt"
	"github.com/golang-migrate/migrate/v4"
	"github.com/muddyrain/renderly/backend/internal/config"
	"github.com/muddyrain/renderly/backend/internal/database"
	"os"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
func run() error {
	if len(os.Args) != 2 {
		return errors.New("usage: db up|status|bootstrap")
	}
	c := config.Load()
	if err := c.Validate(); err != nil {
		return err
	}
	if c.DatabaseURL == "" {
		return errors.New("DATABASE_URL is required")
	}
	ctx := context.Background()
	if os.Args[1] == "bootstrap" {
		pool, err := database.Open(ctx, c.DatabaseURL)
		if err != nil {
			return err
		}
		defer pool.Close()
		if err = database.Bootstrap(ctx, pool, c); err != nil {
			return err
		}
		fmt.Println("Local development identity ready (no sample projects created)")
		return nil
	}
	if os.Args[1] != "up" && os.Args[1] != "status" {
		return errors.New("usage: db up|status|bootstrap")
	}
	m, err := database.Migrator(ctx, c.DatabaseURL)
	if err != nil {
		return err
	}
	defer m.Close()
	if os.Args[1] == "up" {
		if err = m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
			return errors.New("migration failed; inspect version/dirty status before a forward repair")
		}
	}
	version, dirty, err := m.Version()
	if errors.Is(err, migrate.ErrNilVersion) {
		fmt.Println("version=none dirty=false")
		return nil
	}
	if err != nil {
		return errors.New("migration status unavailable")
	}
	fmt.Printf("version=%d dirty=%t\n", version, dirty)
	if dirty {
		return errors.New("dirty migration requires explicit repair")
	}
	return nil
}
