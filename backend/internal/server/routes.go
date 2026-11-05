package server

import (
	"context"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/app/server"
	"github.com/cloudwego/hertz/pkg/protocol/consts"
)

func registerRoutes(h *server.Hertz) {
	h.GET("/healthz", health)
	h.GET("/readyz", readiness)
}

func health(_ context.Context, c *app.RequestContext) {
	c.JSON(consts.StatusOK, struct {
		Status  string `json:"status"`
		Service string `json:"service"`
	}{Status: "ok", Service: "renderly-api"})
}

func readiness(_ context.Context, c *app.RequestContext) {
	// Configuration was validated before startup. Dependency probes will be
	// wired with their adapters; an open TCP port alone is not application readiness.
	c.JSON(consts.StatusServiceUnavailable, struct {
		Status  string            `json:"status"`
		Service string            `json:"service"`
		Checks  map[string]string `json:"checks"`
	}{
		Status:  "not_ready",
		Service: "renderly-api",
		Checks: map[string]string{
			"config":   "ok",
			"postgres": "not_implemented",
			"redis":    "not_implemented",
			"storage":  "not_implemented",
		},
	})
}
