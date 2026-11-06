// Package testdb creates disposable schemas only in an explicitly designated test database.
package testdb

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/muddyrain/renderly/backend/internal/config"
	"github.com/muddyrain/renderly/backend/internal/database"
	"net/url"
	"os"
	"strings"
	"testing"
	"time"
)

func New(t testing.TB) (*pgxpool.Pool, string, config.Config) {
	t.Helper()
	dsn := os.Getenv("RENDERLY_TEST_DATABASE_URL")
	if dsn == "" {
		if os.Getenv("RENDERLY_REQUIRE_DB_TESTS") == "1" {
			t.Fatal("RENDERLY_TEST_DATABASE_URL required for integration tests")
		}
		t.Skip("NOT RUN: dedicated test database not configured")
	}
	parsed, err := url.Parse(dsn)
	if err != nil || !strings.HasSuffix(parsed.Path, "_test") {
		t.Fatal("test DSN must name a dedicated *_test database")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	admin, err := pgx.Connect(ctx, dsn)
	if err != nil {
		t.Fatal("test database connection unavailable")
	}
	defer admin.Close(context.Background())
	if _, err = admin.Exec(ctx, "SELECT pg_advisory_lock(727001)"); err != nil {
		t.Fatal("test setup lock unavailable")
	}
	if _, err = admin.Exec(ctx, "CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public"); err != nil {
		t.Fatal("test extension setup failed")
	}
	_, _ = admin.Exec(ctx, "SELECT pg_advisory_unlock(727001)")
	var random [8]byte
	if _, err = rand.Read(random[:]); err != nil {
		t.Fatal(err)
	}
	schema := "p1_test_" + hex.EncodeToString(random[:])
	quoted := pgx.Identifier{schema}.Sanitize()
	if _, err = admin.Exec(ctx, "CREATE SCHEMA "+quoted); err != nil {
		t.Fatal("test schema setup failed")
	}
	query := parsed.Query()
	query.Set("search_path", schema)
	parsed.RawQuery = query.Encode()
	isolated := parsed.String()
	t.Cleanup(func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		c, err := pgx.Connect(ctx, dsn)
		if err != nil {
			t.Error("test schema cleanup connection failed")
			return
		}
		defer c.Close(ctx)
		if _, err = c.Exec(ctx, "DROP SCHEMA "+quoted+" CASCADE"); err != nil {
			t.Error("test schema cleanup failed")
		}
	})
	m, err := database.Migrator(ctx, isolated)
	if err != nil {
		t.Fatal(err)
	}
	if err = m.Up(); err != nil {
		t.Fatal("test migrations failed")
	}
	m.Close()
	pool, err := database.Open(context.Background(), isolated)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(pool.Close)
	cfg := config.Config{APIAddr: "127.0.0.1:8080", WebOrigin: "http://localhost:3000", AppEnv: "test", LocalIdentity: true, DatabaseURL: isolated, DevUserID: config.DevUserID, DevWorkspaceID: config.DevWorkspaceID}
	if err = database.Bootstrap(context.Background(), pool, cfg); err != nil {
		t.Fatal(err)
	}
	return pool, isolated, cfg
}
