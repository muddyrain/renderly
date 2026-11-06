# Contributing

1. Open an issue or discuss substantial changes first.
2. Keep pull requests focused.
3. Add/update tests and docs.
4. Never commit secrets, generated private images, or personal data.

Local checks:
```bash
cd backend && go test ./...
pnpm lint && pnpm typecheck && pnpm build
```
