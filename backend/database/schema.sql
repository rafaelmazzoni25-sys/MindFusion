-- Mind-Task Fusion - Database Schema
-- MySQL/MariaDB Schema for Hostinger

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. WORKSPACES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS workspaces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) DEFAULT 'My Workspace',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. MIND MAP - NODES
-- ============================================
CREATE TABLE IF NOT EXISTS nodes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    node_id VARCHAR(50) NOT NULL,
    text VARCHAR(500) NOT NULL,
    position_x FLOAT NOT NULL,
    position_y FLOAT NOT NULL,
    width INT NOT NULL,
    height INT NOT NULL,
    linked_task_id VARCHAR(50) DEFAULT NULL,
    background_color VARCHAR(20) DEFAULT NULL,
    border_color VARCHAR(20) DEFAULT NULL,
    shape VARCHAR(50) DEFAULT 'rounded',
    image_url TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    UNIQUE KEY unique_node (workspace_id, node_id),
    INDEX idx_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. MIND MAP - CONNECTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS connections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    connection_id VARCHAR(50) NOT NULL,
    from_node VARCHAR(50) NOT NULL,
    to_node VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    UNIQUE KEY unique_connection (workspace_id, connection_id),
    INDEX idx_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. MIND MAP - TEXTS
-- ============================================
CREATE TABLE IF NOT EXISTS texts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    text_id VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    position_x FLOAT NOT NULL,
    position_y FLOAT NOT NULL,
    width INT NOT NULL,
    font_size INT DEFAULT 16,
    font_family VARCHAR(100) DEFAULT 'Inter',
    color VARCHAR(20) DEFAULT '#374151',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    UNIQUE KEY unique_text (workspace_id, text_id),
    INDEX idx_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. TASK BOARD - COLUMNS
-- ============================================
CREATE TABLE IF NOT EXISTS task_columns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    column_id VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    position INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    UNIQUE KEY unique_column (workspace_id, column_id),
    INDEX idx_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. TASK BOARD - TASKS
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    task_id VARCHAR(50) NOT NULL,
    column_id VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    description TEXT DEFAULT NULL,
    start_date DATETIME DEFAULT NULL,
    due_date DATETIME DEFAULT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    responsible_user_id VARCHAR(50) DEFAULT NULL,
    cover_image_url TEXT DEFAULT NULL,
    position INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    UNIQUE KEY unique_task (workspace_id, task_id),
    INDEX idx_workspace (workspace_id),
    INDEX idx_column (column_id),
    INDEX idx_due_date (due_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 8. TASK - LABELS
-- ============================================
CREATE TABLE IF NOT EXISTS task_labels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id VARCHAR(50) NOT NULL,
    label_id VARCHAR(50) NOT NULL,
    text VARCHAR(100) NOT NULL,
    color VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_task (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 9. TASK - CHECKLIST
-- ============================================
CREATE TABLE IF NOT EXISTS task_checklist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id VARCHAR(50) NOT NULL,
    item_id VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_task (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 10. TASK - ASSIGNED USERS
-- ============================================
CREATE TABLE IF NOT EXISTS task_assigned_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id VARCHAR(50) NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_task (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 11. TASK - DEPENDENCIES
-- ============================================
CREATE TABLE IF NOT EXISTS task_dependencies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id VARCHAR(50) NOT NULL,
    depends_on_task_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_task (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 12. TASK - ATTACHMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS task_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id VARCHAR(50) NOT NULL,
    attachment_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    type VARCHAR(100) NOT NULL,
    size INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_task (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 13. BUG TRACKER - BUGS
-- ============================================
CREATE TABLE IF NOT EXISTS bugs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    bug_id VARCHAR(50) NOT NULL,
    summary VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    reporter_id VARCHAR(50) NOT NULL,
    assignee_id VARCHAR(50) DEFAULT NULL,
    status VARCHAR(50) DEFAULT 'Open',
    priority VARCHAR(20) DEFAULT 'medium',
    type VARCHAR(50) DEFAULT 'Bug',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    UNIQUE KEY unique_bug (workspace_id, bug_id),
    INDEX idx_workspace (workspace_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 14. BUG - LABELS
-- ============================================
CREATE TABLE IF NOT EXISTS bug_labels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bug_id VARCHAR(50) NOT NULL,
    label_id VARCHAR(50) NOT NULL,
    text VARCHAR(100) NOT NULL,
    color VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_bug (bug_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 15. BUG - ATTACHMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS bug_attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bug_id VARCHAR(50) NOT NULL,
    attachment_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    type VARCHAR(100) NOT NULL,
    size INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_bug (bug_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 16. TEAM - USERS (workspace members)
-- ============================================
CREATE TABLE IF NOT EXISTS workspace_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    user_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    initials VARCHAR(5) NOT NULL,
    color VARCHAR(20) DEFAULT '#60a5fa',
    role VARCHAR(50) DEFAULT 'Editor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    UNIQUE KEY unique_workspace_user (workspace_id, user_id),
    INDEX idx_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 17. NODE TEMPLATES
-- ============================================
CREATE TABLE IF NOT EXISTS node_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace_id INT NOT NULL,
    template_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    text VARCHAR(500) NOT NULL,
    width INT NOT NULL,
    height INT NOT NULL,
    shape VARCHAR(50) DEFAULT 'rounded',
    background_color VARCHAR(20) DEFAULT NULL,
    border_color VARCHAR(20) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    UNIQUE KEY unique_template (workspace_id, template_id),
    INDEX idx_workspace (workspace_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INITIAL DATA - Create default admin user
-- ============================================
-- Password: admin123 (bcrypt hash)
INSERT INTO users (email, password_hash, name) VALUES 
('admin@mindtask.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin User');

-- Create default workspace for admin
INSERT INTO workspaces (user_id, name) VALUES 
(1, 'Admin Workspace');
