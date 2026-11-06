package repository

import (
	"context"
	"errors"
	"fmt"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/muddyrain/renderly/backend/internal/database"
	"github.com/muddyrain/renderly/backend/internal/db"
	"github.com/muddyrain/renderly/backend/internal/project"
	"net"
	"strings"
	"time"
)

type Projects struct {
	q    *db.Queries
	pool *pgxpool.Pool
}

func NewProjects(pool *pgxpool.Pool) *Projects { return &Projects{q: db.New(pool), pool: pool} }
func normalize(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, pgx.ErrNoRows) {
		return project.ErrNotFound
	}
	var p *pgconn.PgError
	var network net.Error
	var connect *pgconn.ConnectError
	if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) || errors.As(err, &network) || errors.As(err, &connect) {
		return project.ErrUnavailable
	}
	if errors.As(err, &p) && (strings.HasPrefix(p.Code, "08") || p.Code == "53300" || p.Code == "42P01" || p.Code == "42703" || strings.HasPrefix(p.Code, "57")) {
		return project.ErrUnavailable
	}
	return project.ErrInternal
}
func identifier(v pgtype.UUID) string {
	b := v.Bytes
	return fmt.Sprintf("%x-%x-%x-%x-%x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
}
func owned(row db.Project) project.Project {
	return project.Project{ID: identifier(row.ID), WorkspaceID: identifier(row.WorkspaceID), Name: row.Name, Description: row.Description, CreatedBy: identifier(row.CreatedBy), CreatedAt: row.CreatedAt.Time.UTC(), UpdatedAt: row.UpdatedAt.Time.UTC()}
}
func (r *Projects) Member(ctx context.Context, u, w string) (bool, error) {
	ctx, cancel := context.WithTimeout(ctx, database.QueryTimeout)
	defer cancel()
	ok, err := r.q.IsWorkspaceMember(ctx, db.IsWorkspaceMemberParams{WorkspaceID: database.UUID(w), UserID: database.UUID(u)})
	return ok, normalize(err)
}
func (r *Projects) write(ctx context.Context, operation func(context.Context, *db.Queries) (project.Project, error)) (project.Project, error) {
	ctx, cancel := context.WithTimeout(ctx, database.QueryTimeout)
	defer cancel()
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return project.Project{}, normalize(err)
	}
	defer func() {
		cleanup, stop := context.WithTimeout(context.Background(), time.Second)
		defer stop()
		_ = tx.Rollback(cleanup)
	}()
	result, err := operation(ctx, db.New(tx))
	if err != nil {
		return project.Project{}, normalize(err)
	}
	if err = ctx.Err(); err != nil {
		return project.Project{}, normalize(err)
	}
	if err = tx.Commit(ctx); err != nil {
		return project.Project{}, normalize(err)
	}
	return result, nil
}
func (r *Projects) Create(ctx context.Context, p project.Principal, w, name, description string) (project.Project, error) {
	return r.write(ctx, func(ctx context.Context, q *db.Queries) (project.Project, error) {
		row, err := q.CreateProject(ctx, db.CreateProjectParams{WorkspaceID: database.UUID(w), UserID: database.UUID(p.UserID), Name: name, Description: description})
		return owned(row), err
	})
}
func (r *Projects) List(ctx context.Context, p project.Principal, w string, limit, offset int32) (project.Page, error) {
	ctx, cancel := context.WithTimeout(ctx, database.QueryTimeout)
	defer cancel()
	rows, err := r.q.ListProjects(ctx, db.ListProjectsParams{WorkspaceID: database.UUID(w), UserID: database.UUID(p.UserID), PageLimit: limit, PageOffset: offset})
	if err != nil {
		return project.Page{}, normalize(err)
	}
	total, err := r.q.CountProjects(ctx, db.CountProjectsParams{WorkspaceID: database.UUID(w), UserID: database.UUID(p.UserID)})
	if err != nil {
		return project.Page{}, normalize(err)
	}
	items := make([]project.Project, 0, len(rows))
	for _, row := range rows {
		items = append(items, owned(row))
	}
	return project.Page{Items: items, Total: total, Limit: limit, Offset: offset}, nil
}
func (r *Projects) Get(ctx context.Context, p project.Principal, w, id string) (project.Project, error) {
	ctx, cancel := context.WithTimeout(ctx, database.QueryTimeout)
	defer cancel()
	row, err := r.q.GetProject(ctx, db.GetProjectParams{WorkspaceID: database.UUID(w), UserID: database.UUID(p.UserID), ProjectID: database.UUID(id)})
	return owned(row), normalize(err)
}
func (r *Projects) Update(ctx context.Context, p project.Principal, w, id string, patch project.Patch) (project.Project, error) {
	return r.write(ctx, func(ctx context.Context, q *db.Queries) (project.Project, error) {
		args := db.UpdateProjectParams{WorkspaceID: database.UUID(w), UserID: database.UUID(p.UserID), ProjectID: database.UUID(id)}
		if patch.Name != nil {
			args.Name = pgtype.Text{String: *patch.Name, Valid: true}
		}
		if patch.Description != nil {
			args.Description = pgtype.Text{String: *patch.Description, Valid: true}
		}
		row, err := q.UpdateProject(ctx, args)
		return owned(row), err
	})
}
func (r *Projects) Delete(ctx context.Context, p project.Principal, w, id string) error {
	_, err := r.write(ctx, func(ctx context.Context, q *db.Queries) (project.Project, error) {
		_, err := q.DeleteProject(ctx, db.DeleteProjectParams{WorkspaceID: database.UUID(w), UserID: database.UUID(p.UserID), ProjectID: database.UUID(id)})
		return project.Project{}, err
	})
	return err
}
