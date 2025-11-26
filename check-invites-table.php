<?php
// Check workspace_invites table structure
require_once 'backend/config/database.php';

header("Content-Type: text/html");

$database = new Database();
$db = $database->getConnection();

echo "<h1>workspace_invites Table Structure</h1>";

$stmt = $db->query("DESCRIBE workspace_invites");
echo "<ul>";
while ($row = $stmt->fetch()) {
    echo "<li><strong>{$row['Field']}</strong> - {$row['Type']}</li>";
}
echo "</ul>";
?>
