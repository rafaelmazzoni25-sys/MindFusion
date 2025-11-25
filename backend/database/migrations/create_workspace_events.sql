-- ============================================
-- WORKSPACE EVENTS TABLE
-- For real-time synchronization using Server-Sent Events
-- ============================================
CREATE TABLE IF NOT EXISTS workspace_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    event_type ENUM(
        'node_created', 'node_updated', 'node_deleted',
        'connection_created', 'connection_deleted',
        'task_created', 'task_updated', 'task_deleted', 'task_moved',
        'bug_created', 'bug_updated', 'bug_deleted',
        'text_created', 'text_updated', 'text_deleted',
        'member_added', 'member_removed', 'member_updated'
    ) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    user_id INT NOT NULL,
    data JSON NOT NULL,
    created_at TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_workspace_created (workspace_id, created_at DESC),
    INDEX idx_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Clean up old events (keep last 1000 per workspace)
-- This should be run periodically via cron
DELIMITER $$
CREATE EVENT IF NOT EXISTS cleanup_old_events
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
    DELETE e1 FROM workspace_events e1
    LEFT JOIN (
        SELECT id FROM workspace_events e2
        WHERE e2.workspace_id = e1.workspace_id
        ORDER BY created_at DESC
        LIMIT 1000
    ) e2 ON e1.id = e2.id
    WHERE e2.id IS NULL
    AND e1.created_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
END$$
DELIMITER ;
