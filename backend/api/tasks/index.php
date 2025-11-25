<?php
/**
 * Tasks API
 * Handles CRUD operations for tasks and columns
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
            // Get all columns with their tasks
            $colQuery = "SELECT * FROM task_columns WHERE workspace_id = ? ORDER BY position ASC";
            $colStmt = $db->prepare($colQuery);
            $colStmt->execute([$workspaceId]);
            $columns = $colStmt->fetchAll();
            
            $result = [];
            
            foreach ($columns as $column) {
                // Get tasks for this column
                $taskQuery = "SELECT * FROM tasks WHERE workspace_id = ? AND column_id = ? ORDER BY position ASC";
                $taskStmt = $db->prepare($taskQuery);
                $taskStmt->execute([$workspaceId, $column['column_id']]);
                $tasks = $taskStmt->fetchAll();
                
                // Format tasks
                $formattedTasks = [];
                foreach ($tasks as $task) {
                    // Get labels
                    $labelsQuery = "SELECT * FROM task_labels WHERE task_id = ?";
                    $labelsStmt = $db->prepare($labelsQuery);
                    $labelsStmt->execute([$task['task_id']]);
                    $labels = $labelsStmt->fetchAll();
                    
                    // Get checklist
                    $checklistQuery = "SELECT * FROM task_checklist WHERE task_id = ?";
                    $checklistStmt = $db->prepare($checklistQuery);
                    $checklistStmt->execute([$task['task_id']]);
                    $checklist = $checklistStmt->fetchAll();
                    
                    // Get assigned users
                    $usersQuery = "SELECT user_id FROM task_assigned_users WHERE task_id = ?";
                    $usersStmt = $db->prepare($usersQuery);
                    $usersStmt->execute([$task['task_id']]);
                    $assignedUsers = $usersStmt->fetchAll(PDO::FETCH_COLUMN);
                    
                    // Get dependencies
                    $depsQuery = "SELECT depends_on_task_id FROM task_dependencies WHERE task_id = ?";
                    $depsStmt = $db->prepare($depsQuery);
                    $depsStmt->execute([$task['task_id']]);
                    $dependencies = $depsStmt->fetchAll(PDO::FETCH_COLUMN);
                    
                    // Get attachments
                    $attachQuery = "SELECT * FROM task_attachments WHERE task_id = ?";
                    $attachStmt = $db->prepare($attachQuery);
                    $attachStmt->execute([$task['task_id']]);
                    $attachments = $attachStmt->fetchAll();
                    
                    $formattedTasks[] = [
                        'id' => $task['task_id'],
                        'content' => $task['content'],
                       'description' => $task['description'],
                        'startDate' => $task['start_date'],
                        'dueDate' => $task['due_date'],
                        'priority' => $task['priority'],
                        'responsibleUserId' => $task['responsible_user_id'],
                        'coverImageUrl' => $task['cover_image_url'],
                        'labels' => array_map(function($l) {
                            return ['id' => $l['label_id'], 'text' => $l['text'], 'color' => $l['color']];
                        }, $labels),
                        'checklist' => array_map(function($c) {
                            return ['id' => $c['item_id'], 'text' => $c['text'], 'completed' => (bool)$c['completed']];
                        }, $checklist),
                        'assignedUserIds' => $assignedUsers,
                        'dependencies' => $dependencies,
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
                
                $result[] = [
                    'id' => $column['column_id'],
                    'title' => $column['title'],
                    'cards' => $formattedTasks
                ];
            }
            
            echo json_encode(['success' => true, 'columns' => $result]);
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents("php://input"));
            
            // Create new task
            $query = "INSERT INTO tasks (workspace_id, task_id, column_id, content, description, start_date, due_date, 
                      priority, responsible_user_id, cover_image_url, position) 
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $db->prepare($query);
            $stmt->execute([
                $workspaceId,
                $data->id,
                $data->columnId,
                $data->content,
                $data->description ?? null,
                $data->startDate ?? null,
                $data->dueDate ?? null,
                $data->priority ?? 'medium',
                $data->responsibleUserId ?? null,
                $data->coverImageUrl ?? null,
                $data->position ?? 0
            ]);
            
            // Insert labels if provided
            if (!empty($data->labels)) {
                $labelQuery = "INSERT INTO task_labels (task_id, label_id, text, color) VALUES (?, ?, ?, ?)";
                $labelStmt = $db->prepare($labelQuery);
                foreach ($data->labels as $label) {
                    $labelStmt->execute([$data->id, $label->id, $label->text, $label->color]);
                }
            }
            
            // Insert assigned users if provided
            if (!empty($data->assignedUserIds)) {
                $userQuery = "INSERT INTO task_assigned_users (task_id, user_id) VALUES (?, ?)";
                $userStmt = $db->prepare($userQuery);
                foreach ($data->assignedUserIds as $userId) {
                    $userStmt->execute([$data->id, $userId]);
                }
            }
            
            http_response_code(201);
            echo json_encode(['success' => true, 'message' => 'Task created']);
            break;
            
        case 'PUT':
            $data = json_decode(file_get_contents("php://input"));
            
            // Update task
            $updates = [];
            $params = [];
            
            if (isset($data->content)) { $updates[] = "content = ?"; $params[] = $data->content; }
            if (isset($data->description)) { $updates[] = "description = ?"; $params[] = $data->description; }
            if (isset($data->columnId)) { $updates[] = "column_id = ?"; $params[] = $data->columnId; }
            if (isset($data->startDate)) { $updates[] = "start_date = ?"; $params[] = $data->startDate; }
            if (isset($data->dueDate)) { $updates[] = "due_date = ?"; $params[] = $data->dueDate; }
            if (isset($data->priority)) { $updates[] = "priority = ?"; $params[] = $data->priority; }
            if (isset($data->responsibleUserId)) { $updates[] = "responsible_user_id = ?"; $params[] = $data->responsibleUserId; }
            if (isset($data->coverImageUrl)) { $updates[] = "cover_image_url = ?"; $params[] = $data->coverImageUrl; }
            if (isset($data->position)) { $updates[] = "position = ?"; $params[] = $data->position; }
            
            if (!empty($updates)) {
                $params[] = $workspaceId;
                $params[] = $data->id;
                
                $query = "UPDATE tasks SET " . implode(", ", $updates) . " WHERE workspace_id = ? AND task_id = ?";
                $stmt = $db->prepare($query);
                $stmt->execute($params);
            }
            
            // Update labels if provided
            if (isset($data->labels)) {
                $db->prepare("DELETE FROM task_labels WHERE task_id = ?")->execute([$data->id]);
                if (!empty($data->labels)) {
                    $labelQuery = "INSERT INTO task_labels (task_id, label_id, text, color) VALUES (?, ?, ?, ?)";
                    $labelStmt = $db->prepare($labelQuery);
                    foreach ($data->labels as $label) {
                        $labelStmt->execute([$data->id, $label->id, $label->text, $label->color]);
                    }
                }
            }
            
            echo json_encode(['success' => true, 'message' => 'Task updated']);
            break;
            
        case 'DELETE':
            $taskId = $_GET['id'] ?? null;
            
            // Delete task and all related data
            $db->prepare("DELETE FROM task_labels WHERE task_id = ?")->execute([$taskId]);
            $db->prepare("DELETE FROM task_checklist WHERE task_id = ?")->execute([$taskId]);
            $db->prepare("DELETE FROM task_assigned_users WHERE task_id = ?")->execute([$taskId]);
            $db->prepare("DELETE FROM task_dependencies WHERE task_id = ?")->execute([$taskId]);
            $db->prepare("DELETE FROM task_attachments WHERE task_id = ?")->execute([$taskId]);
            $db->prepare("DELETE FROM tasks WHERE workspace_id = ? AND task_id = ?")->execute([$workspaceId, $taskId]);
            
            echo json_encode(['success' => true, 'message' => 'Task deleted']);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
    
} catch (Exception $e) {
    error_log("Tasks API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>
