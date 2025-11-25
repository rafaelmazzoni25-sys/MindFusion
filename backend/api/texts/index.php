<?php
/**
 * Texts API
 * Handles CRUD operations for mind map text blocks
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
            // Get all texts for workspace
            $query = "SELECT * FROM texts WHERE workspace_id = ? ORDER BY created_at";
            $stmt = $db->prepare($query);
            $stmt->execute([$workspaceId]);
            $texts = $stmt->fetchAll();
            
            $result = array_map(function($text) {
                return [
                    'id' => $text['text_id'],
                    'text' => $text['text'],
                    'position' => ['x' => (float)$text['position_x'], 'y' => (float)$text['position_y']],
                    'width' => (float)$text['width'],
                    'fontSize' => (int)$text['font_size'],
                    'fontFamily' => $text['font_family'],
                    'color' => $text['color']
                ];
            }, $texts);
            
            echo json_encode(['success' => true, 'texts' => $result]);
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents("php://input"));
            
            $query = "INSERT INTO texts (workspace_id, text_id, text, position_x, position_y, width, font_size, font_family, color) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $db->prepare($query);
            $stmt->execute([
                $workspaceId,
                $data->id,
                $data->text,
                $data->position->x ?? 100,
                $data->position->y ?? 100,
                $data->width ?? 200,
                $data->fontSize ?? 16,
                $data->fontFamily ?? 'Inter',
                $data->color ?? '#374151'
            ]);
            
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Text created']);
            break;
            
        case 'PUT':
            $data = json_decode(file_get_contents("php://input"));
            
            $updates = [];
            $params = [];
            
            if (isset($data->text)) { $updates[] = "text = ?"; $params[] = $data->text; }
            if (isset($data->position)) {
                if (isset($data->position->x)) { $updates[] = "position_x = ?"; $params[] = $data->position->x; }
                if (isset($data->position->y)) { $updates[] = "position_y = ?"; $params[] = $data->position->y; }
            }
            if (isset($data->width)) { $updates[] = "width = ?"; $params[] = $data->width; }
            if (isset($data->fontSize)) { $updates[] = "font_size = ?"; $params[] = $data->fontSize; }
            if (isset($data->fontFamily)) { $updates[] = "font_family = ?"; $params[] = $data->fontFamily; }
            if (isset($data->color)) { $updates[] = "color = ?"; $params[] = $data->color; }
            
            if (!empty($updates)) {
                $params[] = $workspaceId;
                $params[] = $data->id;
                
                $query = "UPDATE texts SET " . implode(", ", $updates) . " WHERE workspace_id = ? AND text_id = ?";
                $stmt = $db->prepare($query);
                $stmt->execute($params);
            }
            
            echo json_encode(['success' => true, 'message' => 'Text updated']);
            break;
            
        case 'DELETE':
            $textId = $_GET['id'] ?? null;
            
            $db->prepare("DELETE FROM texts WHERE workspace_id = ? AND text_id = ?")->execute([$workspaceId, $textId]);
            
            echo json_encode(['success' => true, 'message' => 'Text deleted']);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    error_log("Texts API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
?>
