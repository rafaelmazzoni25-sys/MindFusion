<?php
/**
 * Workspace Invites API
 * Send and manage workspace sharing invitations
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, GET, DELETE, OPTIONS");
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

// POST: Send a new invitation
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    $workspaceId = $data->workspace_id ?? null;
    $invitedEmail = $data->email ?? null;
    $role = $data->role ?? 'Editor';
    
    if (!$workspaceId || !$invitedEmail) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Workspace ID and email are required"]);
        exit();
    }
    
    // Validate email
    if (!filter_var($invitedEmail, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid email address"]);
        exit();
    }
    
    // Validate: Cannot invite yourself
    $userEmail = $userData['email'] ?? null;
    if ($userEmail && strtolower($invitedEmail) === strtolower($userEmail)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "You cannot invite yourself"]);
        exit();
    }
    
    // Check permission to manage members
    PermissionMiddleware::requirePermission($db, $workspaceId, $userId, 'manage_members');
    
    // Check if user is already a member
    $memberCheck = $db->prepare("
        SELECT id FROM workspace_users 
        WHERE workspace_id = ? AND user_id = (SELECT id FROM users WHERE email = ?)
    ");
    $memberCheck->execute([$workspaceId, $invitedEmail]);
    if ($memberCheck->fetch()) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "User is already a member of this workspace"]);
        exit();
    }
    
    // Check if there's already a pending invite
    $pendingCheck = $db->prepare("
        SELECT id FROM workspace_invites 
        WHERE workspace_id = ? AND email = ? AND status = 'pending'
    ");
    $pendingCheck->execute([$workspaceId, $invitedEmail]);
    if ($pendingCheck->fetch()) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "There's already a pending invitation for this email"]);
        exit();
    }
    
    // Generate unique token
    $token = bin2hex(random_bytes(32));
    
    // Set expiration to 7 days from now
    $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));
    
    // Create invitation
    $stmt = $db->prepare("
        INSERT INTO workspace_invites (workspace_id, email, invited_by_user_id, role, token, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    
    if ($stmt->execute([$workspaceId, $invitedEmail, $userId, $role, $token, $expiresAt])) {
        $inviteId = $db->lastInsertId();
        
        // Get workspace name and inviter name
        $workspaceStmt = $db->prepare("SELECT name FROM workspaces WHERE id = ?");
        $workspaceStmt->execute([$workspaceId]);
        $workspace = $workspaceStmt->fetch(PDO::FETCH_ASSOC);
        
        $userStmt = $db->prepare("SELECT name FROM users WHERE id = ?");
        $userStmt->execute([$userId]);
        $inviter = $userStmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            "success" => true,
            "message" => "Invitation sent successfully",
            "invite" => [
                "id" => $inviteId,
                "workspace_id" => $workspaceId,
                "workspace_name" => $workspace['name'],
                "invited_email" => $invitedEmail,
                "invited_by" => $inviter['name'],
                "role" => $role,
                "token" => $token,
                "expires_at" => $expiresAt,
                "status" => "pending"
            ]
        ]);
        
        // TODO: Send email notification with accept link
        // acceptUrl = "http://yourapp.com/accept-invite?token=$token"
        
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to create invitation"]);
    }
}

// GET: List invitations
elseif ($method === 'GET') {
    $workspaceId = $_GET['workspace_id'] ?? null;
    
    if ($workspaceId) {
        // List invites for a workspace (requires manage_members permission)
        PermissionMiddleware::requirePermission($db, $workspaceId, $userId, 'manage_members');
        
        $stmt = $db->prepare("
            SELECT 
                wi.id,
                wi.email as invited_email,
                wi.role,
                wi.status,
                wi.created_at,
                wi.expires_at,
                u.name as invited_by_name
            FROM workspace_invites wi
            JOIN users u ON wi.invited_by_user_id = u.id
            WHERE wi.workspace_id = ?
            ORDER BY wi.created_at DESC
        ");
        $stmt->execute([$workspaceId]);
        $invites = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            "success" => true,
            "invites" => $invites
        ]);
    } else {
        // List invites for current user's email
        $userEmail = $userData['email'] ?? null;
        if (!$userEmail) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "User email not found"]);
            exit();
        }
        
        $stmt = $db->prepare("
            SELECT 
                wi.id,
                wi.token,
                wi.workspace_id,
                wi.email as invited_email,
                wi.invited_by_user_id as invited_by,
                wi.role,
                wi.status,
                wi.created_at,
                wi.expires_at,
                w.name as workspace_name,
                u.name as invited_by_name
            FROM workspace_invites wi
            JOIN workspaces w ON wi.workspace_id = w.id
            JOIN users u ON wi.invited_by_user_id = u.id
            WHERE wi.email = ? AND wi.status = 'pending' AND wi.expires_at > NOW()
            ORDER BY wi.created_at DESC
        ");
        $stmt->execute([$userEmail]);
        $invites = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            "success" => true,
            "invites" => $invites
        ]);
    }
}

// DELETE: Cancel an invitation
elseif ($method === 'DELETE') {
    $inviteId = $_GET['id'] ?? null;
    
    if (!$inviteId) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invite ID is required"]);
        exit();
    }
    
    // Get invite details
    $inviteStmt = $db->prepare("SELECT workspace_id, invited_by_user_id FROM workspace_invites WHERE id = ?");
    $inviteStmt->execute([$inviteId]);
    $invite = $inviteStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$invite) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Invitation not found"]);
        exit();
    }
    
    // Check if user can cancel (either invited_by user or has manage_members permission)
    if ($invite['invited_by_user_id'] != $userId) {
        PermissionMiddleware::requirePermission($db, $invite['workspace_id'], $userId, 'manage_members');
    }
    
    // Cancel the invitation
    $stmt = $db->prepare("UPDATE workspace_invites SET status = 'cancelled' WHERE id = ?");
    
    if ($stmt->execute([$inviteId])) {
        echo json_encode([
            "success" => true,
            "message" => "Invitation cancelled successfully"
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to cancel invitation"]);
    }
}

else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
}
?>
