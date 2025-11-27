<?php
/**
 * Workspace Members API
 * Manage workspace members (list, update role, remove)
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../middleware/auth.php';
require_once '../middleware/permissions.php';

$database = new Database();
$db = $database->getConnection();

// Get authenticated user
$userData = AuthMiddleware::authenticate();
if (!$userData) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit();
}

$userId = $userData['user_id'] ?? null;
if (!$userId) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Invalid user data"]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

// GET: List workspace members
if ($method === 'GET') {
    $workspaceId = $_GET['workspace_id'] ?? null;
    
    if (!$workspaceId) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Workspace ID is required"]);
        exit();
    }
    
    // Check if user has access to this workspace
    PermissionMiddleware::requirePermission($db, $workspaceId, $userId, 'view');
    
    // Get workspace owner
    $ownerStmt = $db->prepare("
        SELECT u.id, u.name, u.email, u.avatar, 'Owner' as role, w.created_at
        FROM workspaces w
        JOIN users u ON w.user_id = u.id
        WHERE w.id = ?
    ");
    $ownerStmt->execute([$workspaceId]);
    $owner = $ownerStmt->fetch(PDO::FETCH_ASSOC);
    
    // Get workspace members with user data
    $membersStmt = $db->prepare("
        SELECT wu.user_id as id, u.name, u.email, u.avatar, wu.role, wu.color, wu.initials, wu.created_at
        FROM workspace_users wu
        JOIN users u ON wu.user_id = u.id
        WHERE wu.workspace_id = ?
        ORDER BY wu.created_at ASC
    ");
    $membersStmt->execute([$workspaceId]);
    $members = $membersStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Combine owner and members
    $allMembers = $owner ? [$owner] : [];
    $allMembers = array_merge($allMembers, $members);
    
    echo json_encode([
        "success" => true,
        "members" => $allMembers
    ]);
}

// PUT: Update member role
elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"));
    
    $workspaceId = $data->workspace_id ?? null;
    $memberId = $data->member_id ?? null;
    $newRole = $data->role ?? null;
    
    if (!$workspaceId || !$memberId || !$newRole) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Workspace ID, member ID, and role are required"]);
        exit();
    }
    
    // Check permission to manage members
    PermissionMiddleware::requirePermission($db, $workspaceId, $userId, 'manage_members');
    
    // Don't allow changing owner
    $ownerCheck = $db->prepare("SELECT user_id FROM workspaces WHERE id = ?");
    $ownerCheck->execute([$workspaceId]);
    $workspace = $ownerCheck->fetch(PDO::FETCH_ASSOC);
    
    if ($workspace['user_id'] == $memberId) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Cannot change owner's role"]);
        exit();
    }
    
    // Update member role
    $stmt = $db->prepare("
        UPDATE workspace_users 
        SET role = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE workspace_id = ? AND user_id = ?
    ");
    
    if ($stmt->execute([$newRole, $workspaceId, $memberId])) {
        echo json_encode([
            "success" => true,
            "message" => "Member role updated successfully"
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to update member role"]);
    }
}

// DELETE: Remove member from workspace
elseif ($method === 'DELETE') {
    $workspaceId = $_GET['workspace_id'] ?? null;
    $memberId = $_GET['member_id'] ?? null;
    
    if (!$workspaceId || !$memberId) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Workspace ID and member ID are required"]);
        exit();
    }
    
    // Check permission to manage members
    PermissionMiddleware::requirePermission($db, $workspaceId, $userId, 'manage_members');
    
    // Don't allow removing owner
    $ownerCheck = $db->prepare("SELECT user_id FROM workspaces WHERE id = ?");
    $ownerCheck->execute([$workspaceId]);
    $workspace = $ownerCheck->fetch(PDO::FETCH_ASSOC);
    
    if ($workspace['user_id'] == $memberId) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Cannot remove workspace owner"]);
        exit();
    }
    
    // Remove member
    $stmt = $db->prepare("DELETE FROM workspace_users WHERE workspace_id = ? AND user_id = ?");
    
    if ($stmt->execute([$workspaceId, $memberId])) {
        echo json_encode([
            "success" => true,
            "message" => "Member removed successfully"
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to remove member"]);
    }
}

else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
}
?>
