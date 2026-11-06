package config

import (
	"errors"
	"github.com/muddyrain/renderly/backend/internal/project"
	"net"
	"net/url"
	"os"
	"strconv"
	"strings"
)

const DevUserID = "11111111-1111-4111-8111-111111111111"
const DevWorkspaceID = "22222222-2222-4222-8222-222222222222"

type Config struct {
	AppEnv             string
	DatabaseURL        string
	LocalIdentity      bool
	LocalIdentityValue string
	DevUserID          string
	DevWorkspaceID     string
	APIAddr            string
	WebOrigin          string
}

func Load() Config {
	return Config{
		AppEnv: os.Getenv("APP_ENV"), DatabaseURL: os.Getenv("DATABASE_URL"),
		LocalIdentity: os.Getenv("RENDERLY_LOCAL_IDENTITY") == "true", LocalIdentityValue: os.Getenv("RENDERLY_LOCAL_IDENTITY"),
		DevUserID: get("DEV_USER_ID", DevUserID), DevWorkspaceID: get("DEV_WORKSPACE_ID", DevWorkspaceID),
		APIAddr:   get("API_ADDR", ":8080"),
		WebOrigin: get("WEB_ORIGIN", "http://localhost:3000"),
	}
}

// Validate checks transport settings without connecting to infrastructure.
func (c Config) Validate() error {
	host, port, err := net.SplitHostPort(c.APIAddr)
	if err != nil || strings.ContainsAny(host, " /\\\t\r\n") {
		return errors.New("API_ADDR must be a host:port address")
	}
	n, err := strconv.Atoi(port)
	if err != nil || n < 1 || n > 65535 {
		return errors.New("API_ADDR must specify a port between 1 and 65535")
	}
	origin, err := url.Parse(c.WebOrigin)
	if err != nil || (origin.Scheme != "http" && origin.Scheme != "https") ||
		origin.Hostname() == "" || strings.Contains(origin.Host, "*") || origin.User != nil ||
		strings.HasSuffix(origin.Host, ":") || origin.Path != "" || strings.ContainsAny(c.WebOrigin, "?#") {
		return errors.New("WEB_ORIGIN must be an HTTP(S) origin without credentials, path, query, or fragment")
	}
	if port := origin.Port(); port != "" {
		n, err := strconv.Atoi(port)
		if err != nil || n < 1 || n > 65535 {
			return errors.New("WEB_ORIGIN port must be between 1 and 65535")
		}
	}
	if c.LocalIdentityValue != "" && c.LocalIdentityValue != "true" && c.LocalIdentityValue != "false" {
		return errors.New("RENDERLY_LOCAL_IDENTITY must be true or false")
	}
	if c.DatabaseURL != "" {
		db, err := url.Parse(c.DatabaseURL)
		if err != nil || (db.Scheme != "postgres" && db.Scheme != "postgresql") || db.Hostname() == "" || db.Path == "" || strings.Contains(c.DatabaseURL, "${") {
			return errors.New("DATABASE_URL must be a literal PostgreSQL URL")
		}
	}
	if c.LocalIdentity {
		ip := net.ParseIP(host)
		if (c.AppEnv != "development" && c.AppEnv != "test") || ip == nil || !ip.IsLoopback() {
			return errors.New("local identity requires explicit development/test and loopback API_ADDR")
		}
		if c.DatabaseURL == "" || !project.ValidID(c.DevUserID) || !project.ValidID(c.DevWorkspaceID) {
			return errors.New("local identity requires database and valid configured IDs")
		}
	}
	return nil
}

func get(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
