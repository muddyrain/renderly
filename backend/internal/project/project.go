// Package project owns project validation and workspace-scoped use cases.
package project

import (
	"context"
	"encoding/hex"
	"errors"
	"strings"
	"time"
	"unicode/utf8"
)

var (
	ErrInvalid     = errors.New("invalid project input")
	ErrNotFound    = errors.New("project or workspace not found")
	ErrUnavailable = errors.New("project dependency unavailable")
	ErrInternal    = errors.New("project operation failed")
)

type Principal struct{ UserID string }
type Project struct {
	ID          string    `json:"id"`
	WorkspaceID string    `json:"workspace_id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedBy   string    `json:"created_by"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
type Patch struct {
	Name        *string
	Description *string
}
type Page struct {
	Items  []Project `json:"items"`
	Total  int64     `json:"total"`
	Limit  int32     `json:"limit"`
	Offset int32     `json:"offset"`
}
type Repository interface {
	Member(context.Context, string, string) (bool, error)
	Create(context.Context, Principal, string, string, string) (Project, error)
	List(context.Context, Principal, string, int32, int32) (Page, error)
	Get(context.Context, Principal, string, string) (Project, error)
	Update(context.Context, Principal, string, string, Patch) (Project, error)
	Delete(context.Context, Principal, string, string) error
}
type Service struct{ repo Repository }

func New(repo Repository) *Service { return &Service{repo: repo} }
func ValidID(id string) bool {
	if len(id) != 36 || id[8] != '-' || id[13] != '-' || id[18] != '-' || id[23] != '-' {
		return false
	}
	_, err := hex.DecodeString(strings.ReplaceAll(id, "-", ""))
	return err == nil
}
func ValidateText(name, description string) (string, string, error) {
	name, description = strings.TrimSpace(name), strings.TrimSpace(description)
	if !utf8.ValidString(name) || !utf8.ValidString(description) || utf8.RuneCountInString(name) < 1 || utf8.RuneCountInString(name) > 120 || utf8.RuneCountInString(description) > 1000 || strings.ContainsRune(name, 0) || strings.ContainsRune(description, 0) {
		return "", "", ErrInvalid
	}
	return name, description, nil
}
func (s *Service) authorize(ctx context.Context, p Principal, w string) error {
	if !ValidID(w) || !ValidID(p.UserID) {
		return ErrInvalid
	}
	ok, err := s.repo.Member(ctx, p.UserID, w)
	if err != nil {
		return err
	}
	if !ok {
		return ErrNotFound
	}
	return nil
}
func (s *Service) Create(ctx context.Context, p Principal, w, name, description string) (Project, error) {
	name, description, err := ValidateText(name, description)
	if err != nil {
		return Project{}, err
	}
	if err = s.authorize(ctx, p, w); err != nil {
		return Project{}, err
	}
	return s.repo.Create(ctx, p, w, name, description)
}
func (s *Service) List(ctx context.Context, p Principal, w string, limit, offset int32) (Page, error) {
	if limit < 1 || limit > 100 || offset < 0 {
		return Page{}, ErrInvalid
	}
	if err := s.authorize(ctx, p, w); err != nil {
		return Page{}, err
	}
	return s.repo.List(ctx, p, w, limit, offset)
}
func (s *Service) Get(ctx context.Context, p Principal, w, id string) (Project, error) {
	if !ValidID(id) {
		return Project{}, ErrInvalid
	}
	if err := s.authorize(ctx, p, w); err != nil {
		return Project{}, err
	}
	return s.repo.Get(ctx, p, w, id)
}
func (s *Service) Update(ctx context.Context, p Principal, w, id string, patch Patch) (Project, error) {
	if !ValidID(id) || (patch.Name == nil && patch.Description == nil) {
		return Project{}, ErrInvalid
	}
	name, description := "valid", ""
	if patch.Name != nil {
		name = *patch.Name
	}
	if patch.Description != nil {
		description = *patch.Description
	}
	name, description, err := ValidateText(name, description)
	if err != nil {
		return Project{}, err
	}
	if patch.Name != nil {
		patch.Name = &name
	}
	if patch.Description != nil {
		patch.Description = &description
	}
	if err = s.authorize(ctx, p, w); err != nil {
		return Project{}, err
	}
	return s.repo.Update(ctx, p, w, id, patch)
}
func (s *Service) Delete(ctx context.Context, p Principal, w, id string) error {
	if !ValidID(id) {
		return ErrInvalid
	}
	if err := s.authorize(ctx, p, w); err != nil {
		return err
	}
	return s.repo.Delete(ctx, p, w, id)
}
