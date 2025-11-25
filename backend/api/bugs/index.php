<?php
/**
 * Bugs API
 * Handles CRUD operations for bug reports
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
            // Get all bugs
            $query = "SELECT * FROM bugs WHERE workspace_id = ? ORDER BY created_at DESC";
            $stmt = $db->prepare($query);
            $stmt->execute([$workspaceId]);
            $bugs = $stmt->fetchAll();
            
            $result = [];
            foreach ($bugs as $bug) {
                // Get labels
                $labelsQuery = "SELECT * FROM bug_labels WHERE bug_id = ?";
                $labelsStmt = $db->prepare($labelsQuery);
                $labelsStmt->execute([$bug['bug_id']]);
                $labels = $labelsStmt->fetchAll();
                
                // Get attachments
                $attachQuery = "SELECT * FROM bug_attachments WHERE bug_id = ?";
                $attachStmt = $db->prepare($attachQuery);
                $attachStmt->execute([$bug['bug_id']]);
                $attachments = $attachStmt->fetchAll();
                
                $result[] = [
                    'id' => $bug['bug_id'],
                    'summary' => $bug['summary'],
                    'description' => $bug['description'],
                    'reporterId' => $bug['reporter_id'],
                    'assigneeId' => $bug['assignee_id'],
                    'status' => $bug['status'],
                    'priority' => $bug['priority'],
                    'type' => $bug['type'],
                    'createdAt' => $bug['created_at'],
                    'labels' => array_map(function($l) {
                        return ['id' => $l['label_id'], 'text' => $l['text'], 'color' => $l['color']];
                    }, $labels),
                    'attachments' => array_map(function($a) {
                        return [
                            'id' => $a['attachment_id'],
                            'name' => $a['name'],
                            'url' => $a['url'],
                            'type' => $a['type'],
                            'size' => (int)$a['size']
                        ];
                    }, $attachments)
                ];
            }
            
            echo json_encode(['success' => true, 'bugs' => $result]);
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents("php://input"));
            
            $query = "INSERT INTO bugs (workspace_id, bug_id, summary, description, reporter_id, assignee_id, 
                      status, priority, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $db->prepare($query);
            $stmt->execute([
                $workspaceId,
                $data->id,
                $data->summary,
                $data->description,
                $data->reporterId,
                $data->assigneeId ?? null,
                $data->status ?? 'Open',
                $data->priority ?? 'medium',
                $data->type ?? 'Bug'
            ]);
            
            // Insert labels if provided
            if (!empty($data->labels)) {
                $labelQuery = "INSERT INTO bug_labels (bug_id, label_id, text, color) VALUES (?, ?, ?, ?)";
                $labelStmt = $db->prepare($labelQuery);
                foreach ($data->labels as $label) {
                    $labelStmt->execute([$data->id, $label->id, $label->text, $label->color]);
                }
            }
            
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Bug created']);
            break;
            
        case 'PUT':
            $data = json_decode(file_get_contents("php://input"));
            
            $updates = [];
            $params = [];
            
            if (isset($data->summary)) { $updates[] = "summary = ?"; $params[] = $data->summary; }
            if (isset($data->description)) { $updates[] = "description = ?"; $params[] = $data->description; }
            if (isset($data->reporterId)) { $updates[] = "reporter_id = ?"; $params[] = $data->reporterId; }
            if (isset($data->assigneeId)) { $updates[] = "assignee_id = ?"; $params[] = $data->assigneeId; }
            if (isset($data->status)) { $updates[] = "status = ?"; $params[] = $data->status; }
            if (isset($data->priority)) { $updates[] = "priority = ?"; $params[] = $data->priority; }
            if (isset($data->type)) { $updates[] = "type = ?"; $params[] = $data->type; }
            
            if (!empty($updates)) {
                $params[] = $workspaceId;
                $params[] = $data->id;
                
                $query = "UPDATE bugs SET " . implode(", ", $updates) . " WHERE workspace_id = ? AND bug_id = ?";
                $stmt = $db->prepare($query);
                $stmt->execute($params);
            }
            
            // Update labels if provided
            if (isset($data->labels)) {
                $db->prepare("DELETE FROM bug_labels WHERE bug_id = ?")->execute([$data->id]);
                if (!empty($data->labels)) {
                    $labelQuery = "INSERT INTO bug_labels (bug_id, label_id, text, color) VALUES (?, ?, ?, ?)";
                    $labelStmt = $db->prepare($labelQuery);
                    foreach ($data->labels as $label) {
                        $labelStmt->execute([$data->id, $label->id, $label->text, $label->color]);
                    }
                }
            }
            
            echo json_encode(['success' => true, 'message' => 'Bug updated']);
            break;
            
        case 'DELETE':
            $bugId = $_GET['id'] ?? null;
            
            $db->prepare("DELETE FROM bug_labels WHERE bug_id = ?")->execute([$bugId]);
            $db->prepare("DELETE FROM bug_attachments WHERE bug_id = ?")->execute([$bugId]);
            $db->prepare("DELETE FROM bugs WHERE workspace_id = ? AND bug_id = ?")->execute([$workspaceId, $bugId]);
            
            echo json_encode(['success' => true, 'message' => 'Bug deleted']);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    error_log("Bugs API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
?>
