<?php
/**
 * Workspace Data API
 * Load and save all workspace data (nodes, tasks, bugs, etc.)
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../middleware/auth.php';

$database = new Database();
$db = $database->getConnection();

// Get authenticated user
$userData = AuthMiddleware::authenticate();
if (!$userData) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit();
}

// Extract user ID from JWT token
$userId = $userData['user_id'] ?? null;
if (!$userId) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Invalid user data"]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

// Helper function to check workspace access
function checkWorkspaceAccess($db, $workspaceId, $userId) {
    // Check if user owns workspace
    $ownedStmt = $db->prepare("SELECT id FROM workspaces WHERE id = ? AND user_id = ?");
    $ownedStmt->execute([$workspaceId, $userId]);
    if ($ownedStmt->fetch()) {
        return true;
    }
    
    // Check if user is member of workspace
    $memberStmt = $db->prepare("SELECT id FROM workspace_users WHERE workspace_id = ? AND user_id = ?");
    $memberStmt->execute([$workspaceId, $userId]);
    if ($memberStmt->fetch()) {
        return true;
    }
    
    return false;
}

// GET: Load all workspace data
if ($method === 'GET') {
    $workspaceId = $_GET['workspace_id'] ?? null;
    
    if (!$workspaceId) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Workspace ID is required"]);
        exit();
    }
    
    // Check access
    if (!checkWorkspaceAccess($db, $workspaceId, $userId)) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "You don't have access to this workspace"]);
        exit();
    }
    
    // Load workspace info
    $workspaceStmt = $db->prepare("SELECT id, name, created_at, updated_at FROM workspaces WHERE id = ?");
    $workspaceStmt->execute([$workspaceId]);
    $workspace = $workspaceStmt->fetch(PDO::FETCH_ASSOC);
    
    // Load nodes
    $nodesStmt = $db->prepare("SELECT * FROM nodes WHERE workspace_id = ? ORDER BY created_at");
    $nodesStmt->execute([$workspaceId]);
    $nodesData = $nodesStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Map node fields to frontend format
    $nodes = array_map(function($node) {
        return [
            'id' => $node['node_id'],
            'text' => $node['text'],
            'position' => ['x' => (float)$node['position_x'], 'y' => (float)$node['position_y']],
            'width' => (int)$node['width'],
            'height' => (int)$node['height'],
            'linkedTaskId' => $node['linked_task_id'],
            'backgroundColor' => $node['background_color'],
            'borderColor' => $node['border_color'],
            'shape' => $node['shape'],
            'imageUrl' => $node['image_url']
        ];
    }, $nodesData);
    
    // Load connections
    $connectionsStmt = $db->prepare("SELECT * FROM connections WHERE workspace_id = ? ORDER BY created_at");
    $connectionsStmt->execute([$workspaceId]);
    $connectionsData = $connectionsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Map connection fields to frontend format
    $connections = array_map(function($conn) {
        return [
            'id' => $conn['connection_id'],
            'from' => $conn['from_node'],
            'to' => $conn['to_node']
        ];
    }, $connectionsData);
    
    // Load texts
    $textsStmt = $db->prepare("SELECT * FROM texts WHERE workspace_id = ? ORDER BY created_at");
    $textsStmt->execute([$workspaceId]);
    $textsData = $textsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Map text fields to frontend format
    $texts = array_map(function($text) {
        return [
            'id' => $text['text_id'],
            'text' => $text['text'],
            'position' => ['x' => (float)$text['position_x'], 'y' => (float)$text['position_y']],
            'width' => (float)$text['width'],
            'fontSize' => (int)$text['font_size'],
            'fontFamily' => $text['font_family'],
            'color' => $text['color']
        ];
    }, $textsData);
    
    // Load task columns
    $columnsStmt = $db->prepare("SELECT * FROM task_columns WHERE workspace_id = ? ORDER BY position");
    $columnsStmt->execute([$workspaceId]);
    $columnsData = $columnsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format columns with their tasks
    $columns = [];
    foreach ($columnsData as $columnData) {
        $tasksStmt = $db->prepare("SELECT * FROM tasks WHERE workspace_id = ? AND column_id = ? ORDER BY position");
        $tasksStmt->execute([$workspaceId, $columnData['column_id']]);
        $tasksData = $tasksStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format each task
        $cards = [];
        foreach ($tasksData as $taskData) {
            $taskId = $taskData['task_id'];
            
            // Labels
            $labelsStmt = $db->prepare("SELECT * FROM task_labels WHERE task_id = ?");
            $labelsStmt->execute([$taskId]);
            $labels = $labelsStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Checklist
            $checklistStmt = $db->prepare("SELECT * FROM task_checklist WHERE task_id = ?");
            $checklistStmt->execute([$taskId]);
            $checklist = $checklistStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Attachments
            $attachmentsStmt = $db->prepare("SELECT * FROM task_attachments WHERE task_id = ?");
            $attachmentsStmt->execute([$taskId]);
            $attachments = $attachmentsStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Assigned users
            $assignedStmt = $db->prepare("SELECT user_id FROM task_assigned_users WHERE task_id = ?");
            $assignedStmt->execute([$taskId]);
            $assignedUserIds = array_column($assignedStmt->fetchAll(PDO::FETCH_ASSOC), 'user_id');
            
            // Dependencies
            $depsStmt = $db->prepare("SELECT depends_on_task_id FROM task_dependencies WHERE task_id = ?");
            $depsStmt->execute([$taskId]);
            $dependencies = array_column($depsStmt->fetchAll(PDO::FETCH_ASSOC), 'depends_on_task_id');
            
            // Format task to match frontend expectations
            $cards[] = [
                'id' => $taskId,
                'content' => $taskData['content'],
                'description' => $taskData['description'],
                'startDate' => $taskData['start_date'],
                'dueDate' => $taskData['due_date'],
                'priority' => $taskData['priority'],
                'responsibleUserId' => $taskData['responsible_user_id'],
                'coverImageUrl' => $taskData['cover_image_url'],
                'labels' => array_map(function($l) {
                    return ['id' => $l['label_id'], 'text' => $l['text'], 'color' => $l['color']];
                }, $labels),
                'checklist' => array_map(function($c) {
                    return ['id' => $c['item_id'], 'text' => $c['text'], 'completed' => (bool)$c['completed']];
                }, $checklist),
                'assignedUserIds' => $assignedUserIds,
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
        
        // Format column to match frontend expectations
        $columns[] = [
            'id' => $columnData['column_id'],
            'title' => $columnData['title'],
            'cards' => $cards
        ];
    }
    
    // Load bugs
    $bugsStmt = $db->prepare("SELECT * FROM bugs WHERE workspace_id = ? ORDER BY created_at DESC");
    $bugsStmt->execute([$workspaceId]);
    $bugsData = $bugsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Map bug fields to frontend format
    $bugs = [];
    foreach ($bugsData as $bugData) {
        $bugId = $bugData['bug_id'];
        
        // Labels
        $labelsStmt = $db->prepare("SELECT * FROM bug_labels WHERE bug_id = ?");
        $labelsStmt->execute([$bugId]);
        $labelsData = $labelsStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Attachments
        $attachmentsStmt = $db->prepare("SELECT * FROM bug_attachments WHERE bug_id = ?");
        $attachmentsStmt->execute([$bugId]);
        $attachmentsData = $attachmentsStmt->fetchAll(PDO::FETCH_ASSOC);
        
        $bugs[] = [
            'id' => $bugId,
            'summary' => $bugData['summary'],
            'description' => $bugData['description'],
            'reporterId' => $bugData['reporter_id'],
            'assigneeId' => $bugData['assignee_id'],
            'status' => $bugData['status'],
            'priority' => $bugData['priority'],
            'type' => $bugData['type'],
            'createdAt' => $bugData['created_at'],
            'labels' => array_map(function($l) {
                return ['id' => $l['label_id'], 'text' => $l['text'], 'color' => $l['color']];
            }, $labelsData),
            'attachments' => array_map(function($a) {
                return [
                    'id' => $a['attachment_id'],
                    'name' => $a['name'],
                    'url' => $a['url'],
                    'type' => $a['type'],
                    'size' => (int)$a['size']
                ];
            }, $attachmentsData)
        ];
    }
    
    
    // Load workspace users/team
    $usersStmt = $db->prepare("SELECT * FROM workspace_users WHERE workspace_id = ? ORDER BY created_at");
    $usersStmt->execute([$workspaceId]);
    $usersData = $usersStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Map user fields to frontend format
    $users = array_map(function($user) {
        return [
            'id' => $user['user_id'],
            'name' => $user['name'],
            'initials' => $user['initials'],
            'color' => $user['color'],
            'role' => $user['role']
        ];
    }, $usersData);
    
    // Load node templates
    $templatesStmt = $db->prepare("SELECT * FROM node_templates WHERE workspace_id = ? ORDER BY created_at");
    $templatesStmt->execute([$workspaceId]);
    $templatesData = $templatesStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Map template fields to frontend format
    $templates = array_map(function($template) {
        return [
            'id' => $template['template_id'],
            'name' => $template['name'],
            'text' => $template['text'],
            'width' => (int)$template['width'],
            'height' => (int)$template['height'],
            'shape' => $template['shape'],
            'backgroundColor' => $template['background_color'],
            'borderColor' => $template['border_color']
        ];
    }, $templatesData);
    
    echo json_encode([
        "success" => true,
        "workspace" => $workspace,
        "nodes" => $nodes,
        "connections" => $connections,
        "texts" => $texts,
        "columns" => $columns,
        "bugs" => $bugs,
        "users" => $users,
        "templates" => $templates
    ]);
}

// POST: This would be for bulk sync - not implementing full sync yet
// For now, individual endpoints (nodes/index.php, tasks/index.php, etc.) handle saves
else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed. Use individual endpoints for saving data."]);
}
?>
