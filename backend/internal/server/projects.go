package server

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"github.com/cloudwego/hertz/pkg/app"
	"github.com/cloudwego/hertz/pkg/app/server"
	"github.com/muddyrain/renderly/backend/internal/config"
	"github.com/muddyrain/renderly/backend/internal/project"
	"io"
	"strconv"
	"time"
	"unicode/utf8"
)

type Dependencies struct {
	Projects *project.Service
	Ready    func(context.Context) map[string]string
}

func apiError(ctx context.Context, c *app.RequestContext, status int, code, message string) {
	c.JSON(status, map[string]string{"code": code, "message": message, "request_id": RequestID(ctx)})
}
func projectError(ctx context.Context, c *app.RequestContext, err error) {
	switch {
	case errors.Is(err, project.ErrInvalid):
		apiError(ctx, c, 400, "invalid_request", "项目名称需为 1–120 个字符，描述最多 1000 个字符；请检查参数。")
	case errors.Is(err, project.ErrNotFound):
		apiError(ctx, c, 404, "not_found", "项目或工作区不存在。")
	case errors.Is(err, project.ErrUnavailable):
		apiError(ctx, c, 503, "dependency_unavailable", "项目服务暂不可用，请稍后重新载入确认。")
	default:
		apiError(ctx, c, 500, "internal_error", "项目操作失败，请重新载入确认。")
	}
}
func parseFields(body []byte) (project.Patch, error) {
	if len(body) > 16<<10 || !utf8.Valid(body) {
		return project.Patch{}, project.ErrInvalid
	}
	decoder := json.NewDecoder(bytes.NewReader(body))
	var values map[string]json.RawMessage
	if err := decoder.Decode(&values); err != nil || values == nil {
		return project.Patch{}, project.ErrInvalid
	}
	var extra any
	if decoder.Decode(&extra) != io.EOF {
		return project.Patch{}, project.ErrInvalid
	}
	patch := project.Patch{}
	for key, value := range values {
		if key != "name" && key != "description" {
			return patch, project.ErrInvalid
		}
		if bytes.Equal(bytes.TrimSpace(value), []byte("null")) {
			return patch, project.ErrInvalid
		}
		var text string
		if json.Unmarshal(value, &text) != nil {
			return patch, project.ErrInvalid
		}
		if key == "name" {
			patch.Name = &text
		} else {
			patch.Description = &text
		}
	}
	return patch, nil
}
func pagination(c *app.RequestContext) (int32, int32, error) {
	parse := func(key string, fallback int64) (int32, error) {
		value, exists := c.GetQuery(key)
		if !exists {
			return int32(fallback), nil
		}
		n, err := strconv.ParseInt(value, 10, 32)
		if err != nil || n < 0 {
			return 0, project.ErrInvalid
		}
		return int32(n), nil
	}
	limit, err := parse("limit", 50)
	if err != nil {
		return 0, 0, err
	}
	offset, err := parse("offset", 0)
	if err != nil || limit < 1 || limit > 100 {
		return 0, 0, project.ErrInvalid
	}
	return limit, offset, nil
}
func registerProjects(h *server.Hertz, cfg config.Config, deps Dependencies) {
	handle := func(operation string) app.HandlerFunc {
		return func(ctx context.Context, c *app.RequestContext) {
			c.Header("Cache-Control", "no-store")
			if !cfg.LocalIdentity {
				apiError(ctx, c, 401, "identity_required", "项目 API 仅在显式本地开发身份模式下可用。")
				return
			}
			if deps.Projects == nil {
				projectError(ctx, c, project.ErrUnavailable)
				return
			}
			ctx, cancel := context.WithTimeout(ctx, 4*time.Second)
			defer cancel()
			principal := project.Principal{UserID: cfg.DevUserID}
			workspaceID := c.Param("workspaceID")
			id := c.Param("projectID")
			switch operation {
			case "list":
				limit, offset, err := pagination(c)
				if err != nil {
					projectError(ctx, c, err)
					return
				}
				result, err := deps.Projects.List(ctx, principal, workspaceID, limit, offset)
				if err != nil {
					projectError(ctx, c, err)
					return
				}
				c.JSON(200, result)
			case "get":
				result, err := deps.Projects.Get(ctx, principal, workspaceID, id)
				if err != nil {
					projectError(ctx, c, err)
					return
				}
				c.JSON(200, result)
			case "create", "update":
				if string(c.Request.Header.ContentType()) != "application/json" && !bytes.HasPrefix(c.Request.Header.ContentType(), []byte("application/json;")) {
					apiError(ctx, c, 400, "invalid_request", "请使用 application/json 请求体。")
					return
				}
				patch, err := parseFields(c.Request.Body())
				if err != nil {
					projectError(ctx, c, err)
					return
				}
				var result project.Project
				if operation == "create" {
					if patch.Name == nil {
						projectError(ctx, c, project.ErrInvalid)
						return
					}
					description := ""
					if patch.Description != nil {
						description = *patch.Description
					}
					result, err = deps.Projects.Create(ctx, principal, workspaceID, *patch.Name, description)
				} else {
					result, err = deps.Projects.Update(ctx, principal, workspaceID, id, patch)
				}
				if err != nil {
					projectError(ctx, c, err)
					return
				}
				status := 200
				if operation == "create" {
					status = 201
				}
				c.JSON(status, result)
			case "delete":
				if err := deps.Projects.Delete(ctx, principal, workspaceID, id); err != nil {
					projectError(ctx, c, err)
					return
				}
				c.Status(204)
			}
		}
	}
	base := "/api/v1/workspaces/:workspaceID/projects"
	h.GET(base, handle("list"))
	h.POST(base, handle("create"))
	h.GET(base+"/:projectID", handle("get"))
	h.PATCH(base+"/:projectID", handle("update"))
	h.DELETE(base+"/:projectID", handle("delete"))
}
