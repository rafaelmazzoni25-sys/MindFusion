<?php
/**
 * Mind Map Connections API
 * Handles CRUD operations for node connections
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
        case 'GET':
            $query = "SELECT * FROM connections WHERE workspace_id = ?";
            $stmt = $db->prepare($query);
            $stmt->execute([$workspaceId]);
            $connections = $stmt->fetchAll();
            
            $formatted = array_map(function($conn) {
                return [
                    'id' => $conn['connection_id'],
                    'from' => $conn['from_node'],
                    'to' => $conn['to_node']
                ];
            }, $connections);
            
            echo json_encode(['success' => true, 'connections' => $formatted]);
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents("php://input"));
            
            $query = "INSERT INTO connections (workspace_id, connection_id, from_node, to_node) VALUES (?, ?, ?, ?)";
            $stmt = $db->prepare($query);
            $stmt->execute([$workspaceId, $data->id, $data->from, $data->to]);
            
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Connection created']);
            break;
            
        case 'DELETE':
            $connId = $_GET['id'] ?? null;
            
            $query = "DELETE FROM connections WHERE workspace_id = ? AND connection_id = ?";
            $stmt = $db->prepare($query);
            $stmt->execute([$workspaceId, $connId]);
            
            echo json_encode(['success' => true, 'message' => 'Connection deleted']);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
	}
	
} catch (Exception $e) {
    error_log("Connections API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
?>
