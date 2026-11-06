.PHONY: help api worker web dev build lint typecheck test fmt
help:
	@echo "Targets: api worker web dev build lint typecheck test fmt"
api:
	cd backend && go run ./cmd/api
worker:
	cd backend && go run ./cmd/worker
web:
	pnpm dev
dev:
	pnpm dev
build:
	pnpm build
lint:
	pnpm lint
typecheck:
	pnpm typecheck
test:
	cd backend && go test ./...
fmt:
	cd backend && gofmt -w $$(find . -name '*.go' -type f)
