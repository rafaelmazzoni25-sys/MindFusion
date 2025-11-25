-- ============================================
-- WORKSPACE INVITES TABLE
-- For sending and managing workspace sharing invites
-- ============================================
CREATE TABLE IF NOT EXISTS workspace_invites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    invited_email VARCHAR(255) NOT NULL,
    invited_by_user_id INT NOT NULL,
    role ENUM('Admin', 'Editor', 'Viewer') DEFAULT 'Editor' NOT NULL,
    status ENUM('pending', 'accepted', 'rejected', 'cancelled') DEFAULT 'pending' NOT NULL,
    token VARCHAR(64) UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_email (invited_email),
    INDEX idx_workspace_status (workspace_id, status),
    UNIQUE KEY unique_pending_invite (workspace_id, invited_email, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
