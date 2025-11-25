-- ============================================
-- ACTIVITY LOGS TABLE
-- Track all user actions in workspaces
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id INT NOT NULL,
    action_type ENUM(
        'created', 'updated', 'deleted', 
        'shared', 'commented', 'moved',
        'assigned', 'completed'
    ) NOT NULL,
    entity_type ENUM(
        'node', 'connection', 'task', 'bug', 
        'workspace', 'member', 'text', 'comment'
    ) NOT NULL,
    entity_id VARCHAR(100),
    entity_name VARCHAR(255),
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_workspace_created (workspace_id, created_at DESC),
    INDEX idx_user (user_id),
    INDEX idx_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Clean up old activity logs (keep last 1000 per workspace)
DELIMITER $$
CREATE EVENT IF NOT EXISTS cleanup_old_activities
ON SCHEDULE EVERY 1 DAY
DO
BEGIN
    DELETE a1 FROM activity_logs a1
    LEFT JOIN (
        SELECT id FROM activity_logs a2
        WHERE a2.workspace_id = a1.workspace_id
        ORDER BY created_at DESC
        LIMIT 1000
    ) a2 ON a1.id = a2.id
    WHERE a2.id IS NULL
    AND a1.created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
END$$
DELIMITER ;
