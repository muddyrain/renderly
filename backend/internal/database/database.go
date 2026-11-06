// Package database owns PostgreSQL resources and explicit migration/bootstrap operations.
package database

import (
	"context"
	"errors"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/muddyrain/renderly/backend/internal/config"
	"github.com/muddyrain/renderly/backend/internal/db"
	"time"
)

const QueryTimeout = 3 * time.Second
const RequiredVersion = 2

func UUID(value string) pgtype.UUID { var result pgtype.UUID; _ = result.Scan(value); return result }
func Open(ctx context.Context, dsn string) (*pgxpool.Pool, error) {
	c, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, errors.New("invalid database configuration")
	}
	c.ConnConfig.ConnectTimeout = 3 * time.Second
	c.MaxConns = 8
	c.MinConns = 0
	c.ConnConfig.RuntimeParams["statement_timeout"] = "3000"
	pool, err := pgxpool.NewWithConfig(ctx, c)
	if err != nil {
		return nil, errors.New("cannot initialize database")
	}
	probe, cancel := context.WithTimeout(ctx, QueryTimeout)
	defer cancel()
	if err = pool.Ping(probe); err != nil {
		pool.Close()
		return nil, errors.New("database connection unavailable")
	}
	return pool, nil
}
func Bootstrap(ctx context.Context, pool *pgxpool.Pool, c config.Config) error {
	if !c.LocalIdentity {
		return errors.New("bootstrap requires explicit local identity")
	}
	ctx, cancel := context.WithTimeout(ctx, QueryTimeout)
	defer cancel()
	tx, err := pool.Begin(ctx)
	if err != nil {
		return errors.New("bootstrap unavailable")
	}
	defer tx.Rollback(ctx)
	q := db.New(tx)
	u, w := UUID(c.DevUserID), UUID(c.DevWorkspaceID)
	if err = q.BootstrapUser(ctx, u); err != nil {
		return errors.New("bootstrap user conflict or unavailable")
	}
	if err = q.BootstrapWorkspace(ctx, db.BootstrapWorkspaceParams{WorkspaceID: w, UserID: u}); err != nil {
		return errors.New("bootstrap workspace conflict or unavailable")
	}
	if err = q.BootstrapMembership(ctx, db.BootstrapMembershipParams{WorkspaceID: w, UserID: u}); err != nil {
		return errors.New("bootstrap membership unavailable")
	}
	ok, err := q.IsWorkspaceMember(ctx, db.IsWorkspaceMemberParams{WorkspaceID: w, UserID: u})
	if err != nil || !ok {
		return errors.New("bootstrap ownership conflict")
	}
	if err = tx.Commit(ctx); err != nil {
		return errors.New("bootstrap commit unavailable")
	}
	return nil
}
func Ready(pool *pgxpool.Pool, c config.Config) func(context.Context) map[string]string {
	return func(ctx context.Context) map[string]string {
		checks := map[string]string{"config": "ok", "postgres": "unavailable", "migrations": "unavailable", "workspace": "unavailable", "redis": "not_required_not_connected", "storage": "not_required_not_connected"}
		ctx, cancel := context.WithTimeout(ctx, time.Second)
		defer cancel()
		if err := pool.Ping(ctx); err != nil {
			return checks
		}
		checks["postgres"] = "ok"
		q := db.New(pool)
		version, err := q.SchemaVersion(ctx)
		if err == nil && version.Version == RequiredVersion && !version.Dirty {
			checks["migrations"] = "ok"
		} else {
			return checks
		}
		if !c.LocalIdentity {
			checks["workspace"] = "local_identity_disabled"
			return checks
		}
		ok, err := q.IsWorkspaceMember(ctx, db.IsWorkspaceMemberParams{WorkspaceID: UUID(c.DevWorkspaceID), UserID: UUID(c.DevUserID)})
		if err == nil && ok {
			checks["workspace"] = "ok"
		}
		return checks
	}
}
