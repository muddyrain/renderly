package database_test

import (
	"context"
	"github.com/muddyrain/renderly/backend/internal/database"
	"github.com/muddyrain/renderly/backend/internal/testdb"
	"strings"
	"testing"
)

func TestRealReadinessAndUnversionedGuard(t *testing.T) {
	pool, dsn, cfg := testdb.New(t)
	ctx := context.Background()
	ready := database.Ready(pool, cfg)
	if checks := ready(ctx); checks["postgres"] != "ok" || checks["migrations"] != "ok" || checks["workspace"] != "ok" || checks["redis"] != "not_required_not_connected" {
		t.Fatal("unexpected real readiness", checks)
	}
	if _, err := pool.Exec(ctx, "UPDATE schema_migrations SET dirty=true"); err != nil {
		t.Fatal(err)
	}
	if checks := ready(ctx); checks["migrations"] == "ok" {
		t.Fatal("dirty schema marked ready")
	}
	if _, err := pool.Exec(ctx, "UPDATE schema_migrations SET dirty=false"); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, "DELETE FROM workspace_members"); err != nil {
		t.Fatal(err)
	}
	if checks := ready(ctx); checks["workspace"] == "ok" {
		t.Fatal("missing membership marked ready")
	}
	if err := database.Bootstrap(ctx, pool, cfg); err != nil {
		t.Fatal(err)
	}
	if checks := ready(ctx); checks["workspace"] != "ok" {
		t.Fatal("bootstrap recovery not ready")
	}
	if _, err := pool.Exec(ctx, "DROP TABLE schema_migrations"); err != nil {
		t.Fatal(err)
	}
	if checks := ready(ctx); checks["migrations"] == "ok" {
		t.Fatal("missing version marked ready")
	}
	if m, err := database.Migrator(ctx, dsn); err == nil {
		m.Close()
		t.Fatal("unversioned schema silently baselined")
	} else if !strings.Contains(err.Error(), "unversioned") {
		t.Fatal("unexpected guard error", err)
	}
	var exists bool
	if err := pool.QueryRow(ctx, "SELECT to_regclass('schema_migrations') IS NOT NULL").Scan(&exists); err != nil || exists {
		t.Fatal("guard changed schema", err)
	}
}
