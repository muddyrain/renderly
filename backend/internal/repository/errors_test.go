package repository

import (
	"context"
	"errors"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/muddyrain/renderly/backend/internal/project"
	"testing"
)

func TestErrorNormalization(t *testing.T) {
	for _, tc := range []struct{ input, want error }{{pgx.ErrNoRows, project.ErrNotFound}, {context.Canceled, project.ErrUnavailable}, {context.DeadlineExceeded, project.ErrUnavailable}, {&pgconn.PgError{Code: "57P01", Message: "secret"}, project.ErrUnavailable}, {&pgconn.PgError{Code: "42601", Message: "secret SQL"}, project.ErrInternal}, {errors.New("secret connection string"), project.ErrInternal}} {
		if got := normalize(tc.input); got != tc.want {
			t.Fatal("unexpected normalized error")
		}
	}
}
