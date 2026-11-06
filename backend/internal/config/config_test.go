package config

import "testing"

func TestLoad(t *testing.T) {
	t.Setenv("API_ADDR", "")
	t.Setenv("WEB_ORIGIN", "")
	if got := Load(); got.APIAddr != ":8080" || got.WebOrigin != "http://localhost:3000" {
		t.Fatalf("unexpected defaults: %+v", got)
	}
	t.Setenv("API_ADDR", "127.0.0.1:9090")
	t.Setenv("WEB_ORIGIN", "https://renderly.example")
	if got := Load(); got.APIAddr != "127.0.0.1:9090" || got.WebOrigin != "https://renderly.example" {
		t.Fatalf("environment overrides were not loaded: %+v", got)
	}
}

func TestValidate(t *testing.T) {
	for _, tc := range []struct {
		name, addr, origin string
		valid              bool
	}{
		{"defaults", ":8080", "http://localhost:3000", true},
		{"IPv6", "[::1]:8080", "https://[::1]:3000", true},
		{"hostname", "localhost:8080", "https://renderly.example", true},
		{"missing port", "localhost", "http://localhost:3000", false},
		{"invalid host", "bad host:8080", "http://localhost:3000", false},
		{"non numeric port", ":api", "http://localhost:3000", false},
		{"zero port", ":0", "http://localhost:3000", false},
		{"port out of range", ":65536", "http://localhost:3000", false},
		{"missing origin", ":8080", "", false},
		{"wildcard origin", ":8080", "https://*.example.com", false},
		{"unsupported scheme", ":8080", "file://localhost", false},
		{"credentials", ":8080", "https://user:secret@example.com", false},
		{"origin path", ":8080", "https://example.com/path", false},
		{"origin query", ":8080", "https://example.com?secret=value", false},
		{"empty query", ":8080", "https://example.com?", false},
		{"empty fragment", ":8080", "https://example.com#", false},
		{"fragment", ":8080", "https://example.com#fragment", false},
		{"empty origin port", ":8080", "https://example.com:", false},
		{"origin port out of range", ":8080", "https://example.com:65536", false},
	} {
		t.Run(tc.name, func(t *testing.T) {
			err := (Config{APIAddr: tc.addr, WebOrigin: tc.origin}).Validate()
			if (err == nil) != tc.valid {
				t.Fatalf("Validate() error = %v, want valid=%v", err, tc.valid)
			}
		})
	}
}

func TestLocalIdentityGuard(t *testing.T) {
	base := Config{APIAddr: "127.0.0.1:8080", WebOrigin: "http://localhost:3000", AppEnv: "development", LocalIdentity: true, DatabaseURL: "postgres://example:example@127.0.0.1:5432/renderly", DevUserID: DevUserID, DevWorkspaceID: DevWorkspaceID}
	if err := base.Validate(); err != nil {
		t.Fatal(err)
	}
	for _, change := range []func(*Config){func(c *Config) { c.AppEnv = "production" }, func(c *Config) { c.AppEnv = "" }, func(c *Config) { c.APIAddr = ":8080" }, func(c *Config) { c.APIAddr = "0.0.0.0:8080" }, func(c *Config) { c.APIAddr = "localhost:8080" }, func(c *Config) { c.DatabaseURL = "" }, func(c *Config) { c.DatabaseURL = "postgres://u:p@localhost:${POSTGRES_PORT:-5432}/renderly" }, func(c *Config) { c.DevUserID = "bad" }, func(c *Config) { c.LocalIdentityValue = "yes" }} {
		copy := base
		change(&copy)
		if copy.Validate() == nil {
			t.Fatal("unsafe local identity config accepted")
		}
	}
}
