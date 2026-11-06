package database

import (
	"context"
	"errors"
	"github.com/golang-migrate/migrate/v4"
	pgdriver "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/muddyrain/renderly/backend/migrations"
	"time"
)

func Migrator(ctx context.Context, dsn string) (*migrate.Migrate, error) {
	cfg, err := pgx.ParseConfig(dsn)
	if err != nil {
		return nil, errors.New("invalid database configuration")
	}
	cfg.ConnectTimeout = 3 * time.Second
	cfg.RuntimeParams["statement_timeout"] = "5000"
	cfg.RuntimeParams["lock_timeout"] = "5000"
	sqlDB := stdlib.OpenDB(*cfg)
	sqlDB.SetMaxOpenConns(1)
	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()
	var versioned, existing bool
	err = sqlDB.QueryRowContext(ctx, `SELECT to_regclass('schema_migrations') IS NOT NULL, EXISTS(SELECT 1 FROM pg_tables WHERE schemaname=current_schema() AND tablename<>'schema_migrations')`).Scan(&versioned, &existing)
	if err != nil {
		sqlDB.Close()
		return nil, errors.New("migration inspection unavailable")
	}
	if existing && !versioned {
		sqlDB.Close()
		return nil, errors.New("existing unversioned schema: automatic baseline refused")
	}
	driver, err := pgdriver.WithInstance(sqlDB, &pgdriver.Config{StatementTimeout: 5 * time.Second})
	if err != nil {
		sqlDB.Close()
		return nil, errors.New("migration initialization unavailable")
	}
	source, err := iofs.New(migrations.Files, ".")
	if err != nil {
		driver.Close()
		return nil, errors.New("migration sources unavailable")
	}
	m, err := migrate.NewWithInstance("iofs", source, "pgx5", driver)
	if err != nil {
		driver.Close()
		source.Close()
		return nil, errors.New("migration initialization failed")
	}
	m.LockTimeout = 5 * time.Second
	return m, nil
}
