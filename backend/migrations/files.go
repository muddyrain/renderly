package migrations

import "embed"

// Files are used by the explicit migration command, never by API startup.
//
//go:embed *.sql
var Files embed.FS
