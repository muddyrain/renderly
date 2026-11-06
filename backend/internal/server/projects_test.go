package server

import (
	"context"
	"encoding/json"
	"errors"
	"github.com/cloudwego/hertz/pkg/common/ut"
	"github.com/muddyrain/renderly/backend/internal/config"
	"github.com/muddyrain/renderly/backend/internal/project"
	"github.com/muddyrain/renderly/backend/internal/repository"
	"github.com/muddyrain/renderly/backend/internal/testdb"
	"strings"
	"testing"
)

func TestProjectHTTPWithPostgres(t *testing.T) {
	pool, _, cfg := testdb.New(t)
	s, err := New(cfg, nil, Dependencies{Projects: project.New(repository.NewProjects(pool))})
	if err != nil {
		t.Fatal(err)
	}
	base := "/api/v1/workspaces/" + cfg.DevWorkspaceID + "/projects"
	request := func(method, path, body string) (int, []byte) {
		t.Helper()
		r := ut.PerformRequest(s.h.Engine, method, path, &ut.Body{Body: strings.NewReader(body), Len: len(body)}, ut.Header{Key: "Content-Type", Value: "application/json"}, ut.Header{Key: "X-User-ID", Value: "33333333-3333-4333-8333-333333333333"})
		if r.Header().Get("X-Request-ID") == "" {
			t.Fatal("missing correlation ID")
		}
		return r.Code, r.Body.Bytes()
	}
	status, body := request("POST", base, `{"name":" 数据库项目😀 ","description":"line1\nline2"}`)
	if status != 201 {
		t.Fatalf("create status %d %s", status, body)
	}
	var created project.Project
	if err = json.Unmarshal(body, &created); err != nil {
		t.Fatal(err)
	}
	if created.CreatedBy != config.DevUserID {
		t.Fatal("forged identity changed creator")
	}
	for _, bad := range []string{`{`, `[]`, `null`, `{"name":null}`, `{"name":3}`, `{"name":"  "}`, `{"name":"ok","created_by":"bad"}`, `{"name":"ok","workspace_id":"bad"}`, `{"name":"ok","deleted_at":null}`, `{"name":"ok"} true`, `{"name":"` + strings.Repeat("😀", 121) + `"}`, `{"name":"` + strings.Repeat("a", 16400) + `"}`} {
		if code, _ := request("POST", base, bad); code != 400 {
			t.Fatalf("invalid input status=%d", code)
		}
	}
	path := base + "/" + created.ID
	for _, patch := range []string{`{"description":null}`, `{}`, `{"updated_at":"fake"}`} {
		if code, _ := request("PATCH", path, patch); code != 400 {
			t.Fatal("invalid PATCH accepted")
		}
	}
	status, body = request("PATCH", path, `{"name":"改名"}`)
	if status != 200 {
		t.Fatal("patch failed", status)
	}
	var updated project.Project
	_ = json.Unmarshal(body, &updated)
	if updated.Description != created.Description {
		t.Fatal("omitted description cleared")
	}
	for _, query := range []string{"?limit=0", "?limit=101", "?offset=-1", "?limit=hello", "?limit=", "?offset=2147483648"} {
		if status, _ = request("GET", base+query, ""); status != 400 {
			t.Fatal("bad page accepted", status)
		}
	}
	if status, _ = request("GET", base+"/bad", ""); status != 400 {
		t.Fatal("bad UUID accepted")
	}
	if status, _ = request("GET", "/api/v1/workspaces/33333333-3333-4333-8333-333333333333/projects/"+created.ID, ""); status != 404 {
		t.Fatal("cross workspace exposed")
	}
	if status, _ = request("DELETE", path, ""); status != 204 {
		t.Fatal("delete failed")
	}
	if status, body = request("GET", path, ""); status != 404 {
		t.Fatal("deleted visible")
	}
	var failure map[string]string
	_ = json.Unmarshal(body, &failure)
	if failure["request_id"] == "" || failure["code"] != "not_found" {
		t.Fatal("error contract missing")
	}
	for _, method := range []string{"POST", "PATCH", "DELETE"} {
		r := ut.PerformRequest(s.h.Engine, "OPTIONS", base, nil, ut.Header{Key: "Origin", Value: cfg.WebOrigin}, ut.Header{Key: "Access-Control-Request-Method", Value: method}, ut.Header{Key: "Access-Control-Request-Headers", Value: "Content-Type"})
		if r.Code != 204 {
			t.Fatal("preflight rejected", method, r.Code)
		}
	}
	disabled := cfg
	disabled.LocalIdentity = false
	noIdentity, _ := New(disabled, nil, Dependencies{Projects: project.New(repository.NewProjects(pool))})
	if got := ut.PerformRequest(noIdentity.h.Engine, "GET", base, nil); got.Code != 401 {
		t.Fatal("disabled identity allowed")
	}
}

type errorRepository struct{ err error }

func (r errorRepository) Member(context.Context, string, string) (bool, error) { return false, r.err }
func (r errorRepository) Create(context.Context, project.Principal, string, string, string) (project.Project, error) {
	return project.Project{}, r.err
}
func (r errorRepository) List(context.Context, project.Principal, string, int32, int32) (project.Page, error) {
	return project.Page{}, r.err
}
func (r errorRepository) Get(context.Context, project.Principal, string, string) (project.Project, error) {
	return project.Project{}, r.err
}
func (r errorRepository) Update(context.Context, project.Principal, string, string, project.Patch) (project.Project, error) {
	return project.Project{}, r.err
}
func (r errorRepository) Delete(context.Context, project.Principal, string, string) error {
	return r.err
}
func TestProjectErrorAndReadinessContracts(t *testing.T) {
	cfg := config.Config{APIAddr: "127.0.0.1:8080", WebOrigin: "http://localhost:3000", AppEnv: "test", LocalIdentity: true, DatabaseURL: "postgres://example:example@127.0.0.1/test", DevUserID: config.DevUserID, DevWorkspaceID: config.DevWorkspaceID}
	for _, tc := range []struct {
		err    error
		status int
	}{{project.ErrUnavailable, 503}, {errors.New("secret SQL or DSN"), 500}, {project.ErrNotFound, 404}} {
		s, err := New(cfg, nil, Dependencies{Projects: project.New(errorRepository{tc.err})})
		if err != nil {
			t.Fatal(err)
		}
		response := ut.PerformRequest(s.h.Engine, "GET", "/api/v1/workspaces/"+cfg.DevWorkspaceID+"/projects", nil)
		if response.Code != tc.status || strings.Contains(response.Body.String(), "secret") {
			t.Fatal("error mapping/leak", response.Code)
		}
	}
	for _, healthy := range []bool{false, true} {
		s, _ := New(cfg, nil, Dependencies{Ready: func(context.Context) map[string]string {
			v := "unavailable"
			if healthy {
				v = "ok"
			}
			return map[string]string{"config": "ok", "postgres": v, "migrations": v, "workspace": v, "redis": "not_required_not_connected", "storage": "not_required_not_connected"}
		}})
		expected := 503
		if healthy {
			expected = 200
		}
		if r := ut.PerformRequest(s.h.Engine, "GET", "/readyz", nil); r.Code != expected {
			t.Fatal("readiness not dynamic")
		}
	}
}
