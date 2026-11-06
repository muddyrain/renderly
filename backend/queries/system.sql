-- name: SchemaVersion :one
SELECT version, dirty FROM schema_migrations;

-- name: BootstrapUser :exec
INSERT INTO users(id,email,display_name) VALUES(sqlc.arg(user_id),'developer@renderly.local','Local developer') ON CONFLICT(id) DO NOTHING;

-- name: BootstrapWorkspace :exec
INSERT INTO workspaces(id,name,owner_user_id) VALUES(sqlc.arg(workspace_id),'Local workspace',sqlc.arg(user_id)) ON CONFLICT(id) DO NOTHING;

-- name: BootstrapMembership :exec
INSERT INTO workspace_members(workspace_id,user_id,role)
SELECT id,owner_user_id,'owner' FROM workspaces WHERE id=sqlc.arg(workspace_id) AND owner_user_id=sqlc.arg(user_id) ON CONFLICT DO NOTHING;
