ALTER TABLE projects ADD COLUMN deleted_at TIMESTAMPTZ;
CREATE INDEX projects_active_workspace_order_idx ON projects(workspace_id, updated_at DESC, id DESC) WHERE deleted_at IS NULL;
