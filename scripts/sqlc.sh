#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
binary="$root/.tools/sqlc-v1.28.0"
if [ ! -x "$binary" ]; then
  tool_dir="$(mktemp -d)"
  trap 'rm -rf "$tool_dir"' EXIT
  CGO_ENABLED=0 GOBIN="$tool_dir" go install github.com/sqlc-dev/sqlc/cmd/sqlc@v1.28.0
  mkdir -p "$root/.tools"
  mv "$tool_dir/sqlc" "$binary"
fi
cd "$root/backend"
exec "$binary" "$@"
