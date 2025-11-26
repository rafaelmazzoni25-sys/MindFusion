<?php
/**
 * Debug Profile API Errors
 * Access via: http://localhost:8000/debug-profile.php
 */

// Enable error display
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header("Content-Type: text/html; charset=UTF-8");
echo "<h1>Profile API Debug</h1>";

try {
    require_once 'backend/config/database.php';
    require_once 'backend/middleware/auth.php';
    
    echo "<h2>✓ Files loaded successfully</h2>";
    
    $database = new Database();
    $db = $database->getConnection();
    echo "<p style='color: green;'>✓ Database connected</p>";
    
    // Check users table
    echo "<h3>Users table columns:</h3>";
    $stmt = $db->query("DESCRIBE users");
    echo "<ul>";
    while ($row = $stmt->fetch()) {
        echo "<li><strong>{$row['Field']}</strong> - {$row['Type']}</li>";
    }
    echo "</ul>";
    
    // Check if workspace_users table exists
    echo "<h3>Checking workspace_users table:</h3>";
    try {
        $stmt = $db->query("DESCRIBE workspace_users");
        echo "<p style='color: green;'>✓ workspace_users table exists</p>";
        echo "<ul>";
        while ($row = $stmt->fetch()) {
            echo "<li>{$row['Field']} - {$row['Type']}</li>";
        }
        echo "</ul>";
        
        // Count records
        $count = $db->query("SELECT COUNT(*) as cnt FROM workspace_users")->fetch();
        echo "<p>Total records: {$count['cnt']}</p>";
        
    } catch (Exception $e) {
        echo "<p style='color: red;'>✗ workspace_users table does NOT exist!</p>";
        echo "<p>Error: " . $e->getMessage() . "</p>";
        echo "<p><strong>This is likely causing the 500 error!</strong></p>";
        
        echo "<h4>You need to create this table:</h4>";
        echo "<pre>";
        echo "CREATE TABLE workspace_users (\n";
        echo "  id INT AUTO_INCREMENT PRIMARY KEY,\n";
        echo "  workspace_id INT NOT NULL,\n";
        echo "  user_id INT NOT NULL,\n";
        echo "  role ENUM('Owner', 'Admin', 'Editor', 'Viewer') DEFAULT 'Editor',\n";
        echo "  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n";
        echo "  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,\n";
        echo "  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE\n";
        echo ");";
        echo "</pre>";
    }
    
    // Test getting a user
    echo "<h3>Sample user test:</h3>";
    $userTest = $db->query("SELECT id, name, email, avatar, bio, created_at FROM users LIMIT 1")->fetch(PDO::FETCH_ASSOC);
    if ($userTest) {
        echo "<pre>" . print_r($userTest, true) . "</pre>";
    } else {
        echo "<p style='color: red;'>No users in database!</p>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'><strong>ERROR:</strong> " . $e->getMessage() . "</p>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}
?>
