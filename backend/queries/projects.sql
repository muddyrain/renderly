-- name: CreateProject :one
INSERT INTO projects (workspace_id, name, description, created_by)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: ListProjectsByWorkspace :many
SELECT * FROM projects
WHERE workspace_id = $1
ORDER BY updated_at DESC;
