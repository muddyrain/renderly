package repository_test

import (
	"context"
	"errors"
	"github.com/golang-migrate/migrate/v4"
	"github.com/muddyrain/renderly/backend/internal/database"
	"github.com/muddyrain/renderly/backend/internal/project"
	"github.com/muddyrain/renderly/backend/internal/repository"
	"github.com/muddyrain/renderly/backend/internal/testdb"
	"sort"
	"testing"
	"time"
)

func TestPostgresPersistenceAndOwnership(t *testing.T) {
	pool, dsn, cfg := testdb.New(t)
	ctx := context.Background()
	service := project.New(repository.NewProjects(pool))
	p := project.Principal{UserID: cfg.DevUserID}
	w := cfg.DevWorkspaceID
	if err := database.Bootstrap(ctx, pool, cfg); err != nil {
		t.Fatal(err)
	}
	var users, workspaces, members int
	_ = pool.QueryRow(ctx, "SELECT (SELECT count(*) FROM users),(SELECT count(*) FROM workspaces),(SELECT count(*) FROM workspace_members)").Scan(&users, &workspaces, &members)
	if users != 1 || workspaces != 1 || members != 1 {
		t.Fatal("bootstrap not idempotent")
	}
	created, err := service.Create(ctx, p, w, "  远山 😀  ", "  第一行\n第二行  ")
	if err != nil || created.Name != "远山 😀" || created.Description != "第一行\n第二行" {
		t.Fatal("create/normalization failed", err)
	}
	peer, err := database.Open(ctx, dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer peer.Close()
	other := project.New(repository.NewProjects(peer))
	if got, err := other.Get(ctx, p, w, created.ID); err != nil || got.Name != created.Name {
		t.Fatal("independent connection did not observe saved data", err)
	}
	name := "新名称 🏔️"
	updated, err := service.Update(ctx, p, w, created.ID, project.Patch{Name: &name})
	if err != nil || updated.Description != created.Description {
		t.Fatal("PATCH cleared omitted description", err)
	}

	foreignUser := "33333333-3333-4333-8333-333333333333"
	foreignWorkspace := "44444444-4444-4444-8444-444444444444"
	for _, statement := range []string{
		"INSERT INTO users(id,email) VALUES ('33333333-3333-4333-8333-333333333333','foreign@renderly.local')",
		"INSERT INTO workspaces(id,name,owner_user_id) VALUES ('44444444-4444-4444-8444-444444444444','Foreign workspace','33333333-3333-4333-8333-333333333333')",
		"INSERT INTO workspace_members(workspace_id,user_id,role) VALUES ('44444444-4444-4444-8444-444444444444','33333333-3333-4333-8333-333333333333','owner')",
	} {
		if _, err = pool.Exec(ctx, statement); err != nil {
			t.Fatal("foreign fixture failed")
		}
	}
	foreign, err := service.Create(ctx, project.Principal{UserID: foreignUser}, foreignWorkspace, "Foreign project", "")
	if err != nil {
		t.Fatal(err)
	}
	if _, err = service.Get(ctx, p, w, foreign.ID); !errors.Is(err, project.ErrNotFound) {
		t.Fatal("wrong workspace ID read leaked", err)
	}
	if err = service.Delete(ctx, p, foreignWorkspace, foreign.ID); !errors.Is(err, project.ErrNotFound) {
		t.Fatal("foreign delete allowed", err)
	}
	if _, err = repository.NewProjects(peer).Update(ctx, p, foreignWorkspace, foreign.ID, project.Patch{Name: &name}); !errors.Is(err, project.ErrNotFound) {
		t.Fatal("SQL foreign update allowed", err)
	}
	if _, err = service.Get(ctx, project.Principal{UserID: "33333333-3333-4333-8333-333333333333"}, w, created.ID); !errors.Is(err, project.ErrNotFound) {
		t.Fatal("nonmember could read", err)
	}
	if _, err = repository.NewProjects(peer).Get(ctx, project.Principal{UserID: "33333333-3333-4333-8333-333333333333"}, w, created.ID); !errors.Is(err, project.ErrNotFound) {
		t.Fatal("SQL did not enforce membership", err)
	}
	if _, err = service.Update(ctx, p, "44444444-4444-4444-8444-444444444444", created.ID, project.Patch{Name: &name}); !errors.Is(err, project.ErrNotFound) {
		t.Fatal("cross-workspace update succeeded", err)
	}
	cancelled, cancel := context.WithCancel(ctx)
	cancel()
	if _, err = service.Create(cancelled, p, w, "不会保存", ""); !errors.Is(err, project.ErrUnavailable) {
		t.Fatal("cancellation not respected", err)
	}
	if err = service.Delete(ctx, p, w, created.ID); err != nil {
		t.Fatal(err)
	}
	for _, reader := range []*project.Service{service, other} {
		if _, err = reader.Get(ctx, p, w, created.ID); !errors.Is(err, project.ErrNotFound) {
			t.Fatal("deleted project visible", err)
		}
	}
	if err = service.Delete(ctx, p, w, created.ID); !errors.Is(err, project.ErrNotFound) {
		t.Fatal("repeated delete falsely succeeded", err)
	}
	var soft bool
	if err = pool.QueryRow(ctx, "SELECT deleted_at IS NOT NULL FROM projects WHERE id=$1", created.ID).Scan(&soft); err != nil || !soft {
		t.Fatal("row not retained as soft deleted", err)
	}
	page, err := service.List(ctx, p, w, 50, 0)
	if err != nil || page.Total != 0 || len(page.Items) != 0 {
		t.Fatal("deleted row listed", err)
	}
	m, err := database.Migrator(ctx, dsn)
	if err != nil {
		t.Fatal(err)
	}
	if err = m.Up(); !errors.Is(err, migrate.ErrNoChange) {
		t.Fatal("repeat up not stable", err)
	}
	if err = m.Down(); err != nil {
		t.Fatal("isolated test rollback failed", err)
	}
	if err = m.Up(); err != nil {
		t.Fatal("reapply failed", err)
	}
	m.Close()
}
func TestPaginationOrderAndTimeout(t *testing.T) {
	pool, _, cfg := testdb.New(t)
	ctx := context.Background()
	service := project.New(repository.NewProjects(pool))
	p := project.Principal{UserID: cfg.DevUserID}
	w := cfg.DevWorkspaceID
	ids := []string{}
	for i := 0; i < 105; i++ {
		row, err := service.Create(ctx, p, w, "排序项目", "")
		if err != nil {
			t.Fatal(err)
		}
		ids = append(ids, row.ID)
	}
	if _, err := pool.Exec(ctx, "UPDATE projects SET updated_at='2026-11-06T00:00:00Z'"); err != nil {
		t.Fatal(err)
	}
	sort.Sort(sort.Reverse(sort.StringSlice(ids)))
	got := []string{}
	for offset := int32(0); offset < 105; offset += 50 {
		page, err := service.List(ctx, p, w, 50, offset)
		if err != nil || page.Total != 105 {
			t.Fatal("pagination failed", err)
		}
		for _, row := range page.Items {
			got = append(got, row.ID)
		}
	}
	if len(got) != 105 {
		t.Fatal("pagination truncated")
	}
	for i := range ids {
		if ids[i] != got[i] {
			t.Fatal("tie order unstable")
		}
	}
	tx, err := pool.Begin(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer tx.Rollback(ctx)
	if _, err = tx.Exec(ctx, "UPDATE projects SET name='locked' WHERE id=$1", ids[0]); err != nil {
		t.Fatal(err)
	}
	query, cancel := context.WithTimeout(ctx, 50*time.Millisecond)
	defer cancel()
	name := "must not write"
	if _, err = service.Update(query, p, w, ids[0], project.Patch{Name: &name}); !errors.Is(err, project.ErrUnavailable) {
		t.Fatal("locked query cancellation failed", err)
	}
	tx.Rollback(ctx)
	row, err := service.Get(ctx, p, w, ids[0])
	if err != nil || row.Name != "排序项目" {
		t.Fatal("timed out write committed", err)
	}
}
