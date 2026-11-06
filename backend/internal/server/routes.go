package server

import (
	"context"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/app/server"
	"github.com/cloudwego/hertz/pkg/protocol/consts"
)

func registerRoutes(h *server.Hertz, deps Dependencies) {
	h.GET("/healthz", health)
	h.GET("/readyz", func(ctx context.Context, c *app.RequestContext) { readiness(ctx, c, deps) })
}

func health(_ context.Context, c *app.RequestContext) {
	c.JSON(consts.StatusOK, struct {
		Status  string `json:"status"`
		Service string `json:"service"`
	}{Status: "ok", Service: "renderly-api"})
}

func readiness(ctx context.Context, c *app.RequestContext, deps Dependencies) {
	// P1 readiness requires live PostgreSQL, migration and workspace checks.
	// The unconfigured default stays unavailable; future Redis/storage are explicit.
	checks := map[string]string{"config": "ok", "postgres": "not_connected", "migrations": "not_connected", "workspace": "not_connected", "redis": "not_required_not_connected", "storage": "not_required_not_connected"}
	if deps.Ready != nil {
		checks = deps.Ready(ctx)
	}
	status, label := 503, "not_ready"
	if checks["postgres"] == "ok" && checks["migrations"] == "ok" && checks["workspace"] == "ok" {
		status, label = 200, "ready"
	}
	c.Header("Cache-Control", "no-store")
	c.JSON(status, struct {
		Status  string            `json:"status"`
		Service string            `json:"service"`
		Checks  map[string]string `json:"checks"`
	}{
		Status:  label,
		Service: "renderly-api",
		Checks:  checks,
	})
}
