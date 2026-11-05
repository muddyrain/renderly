package server

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"log/slog"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/app/middlewares/server/recovery"
	"github.com/cloudwego/hertz/pkg/app/server"
	"github.com/cloudwego/hertz/pkg/protocol/consts"
	"github.com/hertz-contrib/cors"
	"github.com/muddyrain/renderly/backend/internal/config"
)

type requestIDKey struct{}

func registerMiddleware(h *server.Hertz, cfg config.Config, logger *slog.Logger) {
	h.Use(requestID(), accessLog(logger), recovery.Recovery(recovery.WithRecoveryHandler(
		func(ctx context.Context, c *app.RequestContext, _ interface{}, _ []byte) {
			// Panic values and request dumps may contain secrets.
			logger.ErrorContext(ctx, "request panic", "request_id", RequestID(ctx))
			c.Response.ResetBody()
			c.AbortWithStatusJSON(consts.StatusInternalServerError, map[string]string{
				"code": "internal_error", "message": "Internal server error",
			})
		},
	)), cors.New(cors.Config{
		AllowOrigins:  []string{cfg.WebOrigin},
		AllowMethods:  []string{"GET", "OPTIONS"},
		AllowHeaders:  []string{"Content-Type", "X-Request-ID"},
		ExposeHeaders: []string{"X-Request-ID"},
		MaxAge:        time.Hour,
	}))
}

// RequestID reads correlation metadata from the standard request context.
func RequestID(ctx context.Context) string {
	id, _ := ctx.Value(requestIDKey{}).(string)
	return id
}

func requestID() app.HandlerFunc {
	return func(ctx context.Context, c *app.RequestContext) {
		id := string(c.GetHeader("X-Request-ID"))
		if !validRequestID(id) {
			var b [16]byte
			if _, err := rand.Read(b[:]); err != nil {
				c.AbortWithStatus(consts.StatusInternalServerError)
				return
			}
			id = hex.EncodeToString(b[:])
		}
		c.Header("X-Request-ID", id)
		c.Next(context.WithValue(ctx, requestIDKey{}, id))
	}
}

func validRequestID(id string) bool {
	if len(id) == 0 || len(id) > 128 {
		return false
	}
	for _, ch := range id {
		if !((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') ||
			(ch >= '0' && ch <= '9') || ch == '-' || ch == '_' || ch == '.') {
			return false
		}
	}
	return true
}

func accessLog(logger *slog.Logger) app.HandlerFunc {
	return func(ctx context.Context, c *app.RequestContext) {
		start := time.Now()
		c.Next(ctx)
		route := c.FullPath()
		if route == "" {
			route = "<unmatched>"
		}
		// Log the route template, never raw URLs, query strings, headers or bodies.
		logger.InfoContext(ctx, "http request", "request_id", RequestID(ctx),
			"method", string(c.Method()), "route", route,
			"status", c.Response.StatusCode(), "duration", time.Since(start))
	}
}
