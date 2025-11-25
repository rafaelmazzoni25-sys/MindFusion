<?php
/**
 * Workspaces API
 * Manages user workspaces (list, create, switch, update)
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS");
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

// JWT returns 'user_id', not 'id'
$userId = $userData['user_id'] ?? null;
$userEmail = $userData['email'] ?? null;

if (!$userId) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Invalid user data"]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

// GET: List user's workspaces
if ($method === 'GET') {
    // Get workspaces where user is owner
    $ownedQuery = $db->prepare("
        SELECT 
            w.id,
            w.name,
            w.created_at,
            w.updated_at,
            TRUE as is_owner,
            'Admin' as role,
            NULL as owned_by
        FROM workspaces w
        WHERE w.user_id = ?
    ");
    $ownedQuery->execute([$userId]);
    $owned = $ownedQuery->fetchAll(PDO::FETCH_ASSOC);

    // Get workspaces where user is invited
    $invitedQuery = $db->prepare("
        SELECT 
            w.id,
            w.name,
            w.created_at,
            w.updated_at,
            FALSE as is_owner,
            wu.role,
            u.email as owned_by
        FROM workspace_users wu
        JOIN workspaces w ON wu.workspace_id = w.id
        JOIN users u ON w.user_id = u.id
        WHERE wu.user_id = ?
    ");
    $invitedQuery->execute([$userId]);
    $invited = $invitedQuery->fetchAll(PDO::FETCH_ASSOC);

    $workspaces = array_merge($owned, $invited);

    // Get current workspace from user session
    $currentWorkspaceId = null;
    if (count($workspaces) > 0) {
        $currentWorkspaceId = $workspaces[0]['id']; // Default to first
    }

    echo json_encode([
        "success" => true,
        "workspaces" => $workspaces,
        "current_workspace_id" => $currentWorkspaceId
    ]);
}

// POST: Create new workspace
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->name) || empty(trim($data->name))) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Workspace name is required"]);
        exit();
    }
    
    $name = trim($data->name);
    
    $stmt = $db->prepare("INSERT INTO workspaces (user_id, name) VALUES (?, ?)");
    
    if ($stmt->execute([$userId, $name])) {
        $workspaceId = $db->lastInsertId();
        
        $fetchStmt = $db->prepare("SELECT id, name, created_at, updated_at FROM workspaces WHERE id = ?");
        $fetchStmt->execute([$workspaceId]);
        $workspace = $fetchStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($workspace) {
            $workspace['is_owner'] = true;
            $workspace['role'] = 'Admin';
            $workspace['owned_by'] = null;
        }
        
        http_response_code(201);
        echo json_encode([
            "success" => true,
            "message" => "Workspace created successfully",
            "workspace" => $workspace
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to create workspace"]);
    }
}

// PUT: Update workspace (rename)
elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->workspace_id) || !isset($data->name)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Workspace ID and name are required"]);
        exit();
    }
    
    $workspaceId = $data->workspace_id;
    $name = trim($data->name);
    
    // Check if user owns this workspace
    $checkStmt = $db->prepare("SELECT id FROM workspaces WHERE id = ? AND user_id = ?");
    $checkStmt->execute([$workspaceId, $userId]);
    
    if (!$checkStmt->fetch()) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "You don't have permission to update this workspace"]);
        exit();
    }
    
    $stmt = $db->prepare("UPDATE workspaces SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
    
    if ($stmt->execute([$name, $workspaceId])) {
        echo json_encode([
            "success" => true,
            "message" => "Workspace updated successfully"
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to update workspace"]);
    }
}

// DELETE: Delete workspace
elseif ($method === 'DELETE') {
    $workspaceId = $_GET['id'] ?? null;
    
    if (!$workspaceId) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Workspace ID is required"]);
        exit();
    }
    
    // Check if user owns this workspace
    $checkStmt = $db->prepare("SELECT id FROM workspaces WHERE id = ? AND user_id = ?");
    $checkStmt->execute([$workspaceId, $userId]);
    
    if (!$checkStmt->fetch()) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "You don't have permission to delete this workspace"]);
        exit();
    }
    
    // Delete workspace (CASCADE will handle related data)
    $stmt = $db->prepare("DELETE FROM workspaces WHERE id = ?");
    
    if ($stmt->execute([$workspaceId])) {
        echo json_encode([
            "success" => true,
            "message" => "Workspace deleted successfully"
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to delete workspace"]);
    }
}

else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
}
?>
