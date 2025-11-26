<?php
/**
 * Test script to check if database columns exist and endpoints work
 * Access this via http://localhost:8000/test-profile-setup.php
 */

header("Content-Type: text/html; charset=UTF-8");

echo "<h1>Profile API Setup Test</h1>";

require_once 'backend/config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    echo "<p style='color: green;'>✓ Database connection successful</p>";
    
    // Check if avatar and bio columns exist
    echo "<h2>Checking users table columns...</h2>";
    
    $stmt = $db->query("DESCRIBE users");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $hasAvatar = false;
    $hasBio = false;
    
    echo "<ul>";
    foreach ($columns as $column) {
        echo "<li>{$column['Field']} - {$column['Type']}</li>";
        if ($column['Field'] === 'avatar') $hasAvatar = true;
        if ($column['Field'] === 'bio') $hasBio = true;
    }
    echo "</ul>";
    
    if ($hasAvatar) {
        echo "<p style='color: green;'>✓ Avatar column exists</p>";
    } else {
        echo "<p style='color: red;'>✗ Avatar column MISSING - Run migration!</p>";
    }
    
    if ($hasBio) {
        echo "<p style='color: green;'>✓ Bio column exists</p>";
    } else {
        echo "<p style='color: red;'>✗ Bio column MISSING - Run migration!</p>";
    }
    
    // Check if user directory exists
    echo "<h2>Checking backend files...</h2>";
    
    if (file_exists('backend/api/user/profile.php')) {
        echo "<p style='color: green;'>✓ profile.php exists</p>";
    } else {
        echo "<p style='color: red;'>✗ profile.php MISSING</p>";
    }
    
    if (file_exists('backend/api/user/password.php')) {
        echo "<p style='color: green;'>✓ password.php exists</p>";
    } else {
        echo "<p style='color: red;'>✗ password.php MISSING</p>";
    }
    
    if (file_exists('backend/api/user/avatar.php')) {
        echo "<p style='color: green;'>✓ avatar.php exists</p>";
    } else {
        echo "<p style='color: red;'>✗ avatar.php MISSING</p>";
    }
    
    echo "<h2>Summary</h2>";
    if ($hasAvatar && $hasBio) {
        echo "<p style='color: green; font-weight: bold;'>✓ All database columns exist! Backend should work.</p>";
    } else {
        echo "<p style='color: red; font-weight: bold;'>✗ Database migration needed! Run the SQL script.</p>";
        echo "<pre>";
        echo "ALTER TABLE users ADD COLUMN avatar VARCHAR(500) DEFAULT NULL;\n";
        echo "ALTER TABLE users ADD COLUMN bio TEXT DEFAULT NULL;";
        echo "</pre>";
    }
    
} catch (Exception $e) {
    echo "<p style='color: red;'>Error: " . $e->getMessage() . "</p>";
}
?>
