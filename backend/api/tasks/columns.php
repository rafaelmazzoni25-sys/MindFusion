<?php
/**
 * Task Columns API
 * Handles CRUD for Kanban columns
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../middleware/auth.php';

$userData = AuthMiddleware::authenticate();
$userId = $userData['user_id'];

$database = new Database();
$db = $database->getConnection();
$workspaceId = AuthMiddleware::getWorkspaceId($db, $userId);

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'POST':
            $data = json_decode(file_get_contents("php://input"));
            
            $query = "INSERT INTO task_columns (workspace_id, column_id, title, position) VALUES (?, ?, ?, ?)";
            $stmt = $db->prepare($query);
            $stmt->execute([$workspaceId, $data->id, $data->title, $data->position ?? 0]);
            
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Column created']);
            break;
            
        case 'PUT':
            $data = json_decode(file_get_contents("php://input"));
            
            $query = "UPDATE task_columns SET title = ? WHERE workspace_id = ? AND column_id = ?";
            $stmt = $db->prepare($query);
            $stmt->execute([$data->title, $workspaceId, $data->id]);
            
            echo json_encode(['success' => true, 'message' => 'Column updated']);
            break;
            
        case 'DELETE':
            $colId = $_GET['id'] ?? null;
            
            // Delete all tasks in this column first
            $db->prepare("DELETE FROM tasks WHERE workspace_id = ? AND column_id = ?")->execute([$workspaceId, $colId]);
            
            // Delete column
            $db->prepare("DELETE FROM task_columns WHERE workspace_id = ? AND column_id = ?")->execute([$workspaceId, $colId]);
            
            echo json_encode(['success' => true, 'message' => 'Column deleted']);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    error_log("Columns API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
?>
