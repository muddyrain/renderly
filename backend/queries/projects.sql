-- name: IsWorkspaceMember :one
SELECT EXISTS(SELECT 1 FROM workspace_members WHERE workspace_id = sqlc.arg(workspace_id) AND user_id = sqlc.arg(user_id));

-- name: CreateProject :one
INSERT INTO projects (workspace_id, name, description, created_by)
SELECT sqlc.arg(workspace_id), sqlc.arg(name), sqlc.arg(description), sqlc.arg(user_id)
WHERE EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = sqlc.arg(workspace_id) AND user_id = sqlc.arg(user_id))
RETURNING *;

-- name: ListProjects :many
SELECT p.* FROM projects p
WHERE p.workspace_id = sqlc.arg(workspace_id) AND p.deleted_at IS NULL
AND EXISTS (SELECT 1 FROM workspace_members m WHERE m.workspace_id=p.workspace_id AND m.user_id=sqlc.arg(user_id))
ORDER BY p.updated_at DESC, p.id DESC LIMIT sqlc.arg(page_limit) OFFSET sqlc.arg(page_offset);

-- name: CountProjects :one
SELECT count(*) FROM projects p WHERE p.workspace_id=sqlc.arg(workspace_id) AND p.deleted_at IS NULL
AND EXISTS (SELECT 1 FROM workspace_members m WHERE m.workspace_id=p.workspace_id AND m.user_id=sqlc.arg(user_id));

-- name: GetProject :one
SELECT p.* FROM projects p WHERE p.id=sqlc.arg(project_id) AND p.workspace_id=sqlc.arg(workspace_id) AND p.deleted_at IS NULL
AND EXISTS (SELECT 1 FROM workspace_members m WHERE m.workspace_id=p.workspace_id AND m.user_id=sqlc.arg(user_id));

-- name: UpdateProject :one
UPDATE projects p SET name=COALESCE(sqlc.narg(name),p.name), description=COALESCE(sqlc.narg(description),p.description), updated_at=clock_timestamp()
WHERE p.id=sqlc.arg(project_id) AND p.workspace_id=sqlc.arg(workspace_id) AND p.deleted_at IS NULL
AND EXISTS (SELECT 1 FROM workspace_members m WHERE m.workspace_id=p.workspace_id AND m.user_id=sqlc.arg(user_id)) RETURNING p.*;

-- name: DeleteProject :one
UPDATE projects p SET deleted_at=clock_timestamp(), updated_at=clock_timestamp()
WHERE p.id=sqlc.arg(project_id) AND p.workspace_id=sqlc.arg(workspace_id) AND p.deleted_at IS NULL
AND EXISTS (SELECT 1 FROM workspace_members m WHERE m.workspace_id=p.workspace_id AND m.user_id=sqlc.arg(user_id)) RETURNING p.id;
