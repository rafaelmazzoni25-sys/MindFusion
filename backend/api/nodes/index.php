<?php
/**
 * Mind Map Nodes API
 * Handles CRUD operations for mind map nodes
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../middleware/auth.php';
require_once '../helpers/EventLogger.php';

// Authenticate user
$userData = AuthMiddleware::authenticate();
$userId = $userData['user_id'];

// Get database connection
$database = new Database();
$db = $database->getConnection();

// Get workspace ID
$workspaceId = AuthMiddleware::getWorkspaceId($db, $userId);

if (!$workspaceId) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Workspace not found']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Get all nodes for this workspace
            $query = "SELECT * FROM nodes WHERE workspace_id = ? ORDER BY created_at ASC";
            $stmt = $db->prepare($query);
            $stmt->execute([$workspaceId]);
            $nodes = $stmt->fetchAll();
            
            // Transform to frontend format
            $formattedNodes = array_map(function($node) {
                return [
                    'id' => $node['node_id'],
                    'text' => $node['text'],
                    'position' => [
                        'x' => (float)$node['position_x'],
                        'y' => (float)$node['position_y']
                    ],
                    'width' => (int)$node['width'],
                    'height' => (int)$node['height'],
                    'linkedTaskId' => $node['linked_task_id'],
                    'backgroundColor' => $node['background_color'],
                    'borderColor' => $node['border_color'],
                    'shape' => $node['shape'],
                    'imageUrl' => $node['image_url']
                ];
            }, $nodes);
            
            echo json_encode(['success' => true, 'nodes' => $formattedNodes]);
            break;
            
        case 'POST':
            // Create new node
            $data = json_decode(file_get_contents("php://input"));
            
            if (empty($data->id) || empty($data->text)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Node ID and text are required']);
                exit();
            }
            
            $query = "INSERT INTO nodes (workspace_id, node_id, text, position_x, position_y, width, height, 
                      background_color, border_color, shape, image_url, linked_task_id) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $db->prepare($query);
            $stmt->execute([
                $workspaceId,
                $data->id,
                $data->text,
                $data->position->x ?? 100,
                $data->position->y ?? 100,
                $data->width ?? 180,
                $data->height ?? 50,
                $data->backgroundColor ?? null,
                $data->borderColor ?? null,
                $data->shape ?? 'rounded',
                $data->imageUrl ?? null,
                $data->linkedTaskId ?? null
            ]);
            
            // Log event for sync
            EventLogger::log($db, $workspaceId, 'node_created', 'node', $data->id, $userId, $data);
            
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Node created']);
            break;
            
        case 'PUT':
            // Update node
            $data = json_decode(file_get_contents("php://input"));
            
            if (empty($data->id)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Node ID is required']);
                exit();
            }
            
            // Build dynamic update query
            $updates = [];
            $params = [];
            
            if (isset($data->text)) { $updates[] = "text = ?"; $params[] = $data->text; }
            if (isset($data->position)) {
                $updates[] = "position_x = ?"; $params[] = $data->position->x;
                $updates[] = "position_y = ?"; $params[] = $data->position->y;
            }
            if (isset($data->width)) { $updates[] = "width = ?"; $params[] = $data->width; }
            if (isset($data->height)) { $updates[] = "height = ?"; $params[] = $data->height; }
            if (isset($data->backgroundColor)) { $updates[] = "background_color = ?"; $params[] = $data->backgroundColor; }
            if (isset($data->borderColor)) { $updates[] = "border_color = ?"; $params[] = $data->borderColor; }
            if (isset($data->shape)) { $updates[] = "shape = ?"; $params[] = $data->shape; }
            if (isset($data->imageUrl)) { $updates[] = "image_url = ?"; $params[] = $data->imageUrl; }
            if (isset($data->linkedTaskId)) { $updates[] = "linked_task_id = ?"; $params[] = $data->linkedTaskId; }
            
            if (empty($updates)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'No fields to update']);
                exit();
            }
            
            $params[] = $workspaceId;
            $params[] = $data->id;
            
            $query = "UPDATE nodes SET " . implode(", ", $updates) . " WHERE workspace_id = ? AND node_id = ?";
            $stmt = $db->prepare($query);
            $stmt->execute($params);
            
            // Log event for sync
            EventLogger::log($db, $workspaceId, 'node_updated', 'node', $data->id, $userId, $data);
            
            echo json_encode(['success' => true, 'message' => 'Node updated']);
            break;
            
        case 'DELETE':
            // Delete node
            $nodeId = $_GET['id'] ?? null;
            
            if (empty($nodeId)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Node ID is required']);
                exit();
            }
            
            // Delete node and related connections
            $deleteNode = "DELETE FROM nodes WHERE workspace_id = ? AND node_id = ?";
            $stmtNode = $db->prepare($deleteNode);
            $stmtNode->execute([$workspaceId, $nodeId]);
            
            $deleteConns = "DELETE FROM connections WHERE workspace_id = ? AND (from_node = ? OR to_node = ?)";
            $stmtConns = $db->prepare($deleteConns);
            $stmtConns->execute([$workspaceId, $nodeId, $nodeId]);
            
            // Log event for sync
            EventLogger::log($db, $workspaceId, 'node_deleted', 'node', $nodeId, $userId, ['id' => $nodeId]);
            
            echo json_encode(['success' => true, 'message' => 'Node deleted']);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            break;
    }
    
} catch (Exception $e) {
    error_log("Nodes API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
?>
