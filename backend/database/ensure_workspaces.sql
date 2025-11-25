-- Script to ensure all users have at least one workspace
-- Run this if you're seeing "No workspaces yet"

-- Create workspace for all users that don't have one
INSERT INTO workspaces (user_id, name, created_at, updated_at)
SELECT 
    u.id, 
    'My Workspace',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM workspaces w WHERE w.user_id = u.id
);

-- Verify workspaces were created
SELECT 
    u.id as user_id,
    u.email,
    u.name as user_name,
    w.id as workspace_id,
    w.name as workspace_name
FROM users u
LEFT JOIN workspaces w ON w.user_id = u.id
ORDER BY u.id;
