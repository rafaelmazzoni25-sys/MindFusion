<?php
/**
 * Accept Workspace Invitation
 * Allow users to accept invitations and join workspaces
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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

$userId = $userData['user_id'] ?? null;
$userEmail = $userData['email'] ?? null;

if (!$userId || !$userEmail) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Invalid user data"]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

// POST: Accept invitation
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    $token = $data->token ?? null;
    
    if (!$token) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Token is required"]);
        exit();
    }
    
    // Get invitation
    $stmt = $db->prepare("
        SELECT id, workspace_id, invited_email, role, status, expires_at
        FROM workspace_invites
        WHERE token = ?
    ");
    $stmt->execute([$token]);
    $invite = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$invite) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Invalid invitation token"]);
        exit();
    }
    
    // Verify email matches
    if ($invite['invited_email'] !== $userEmail) {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "This invitation was sent to a different email address"]);
        exit();
    }
    
    // Check if already accepted
    if ($invite['status'] !== 'pending') {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "This invitation has already been " . $invite['status']]);
        exit();
    }
    
    // Check if expired
    if (strtotime($invite['expires_at']) < time()) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "This invitation has expired"]);
        exit();
    }
    
    // Check if user is already a member
    $memberCheck = $db->prepare("
        SELECT id FROM workspace_users 
        WHERE workspace_id = ? AND user_id = ?
    ");
    $memberCheck->execute([$invite['workspace_id'], $userId]);
    if ($memberCheck->fetch()) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "You are already a member of this workspace"]);
        exit();
    }
    
    // Begin transaction
    $db->beginTransaction();
    
    try {
        // Add user to workspace
        $getUserStmt = $db->prepare("SELECT name FROM users WHERE id = ?");
        $getUserStmt->execute([$userId]);
        $user = $getUserStmt->fetch(PDO::FETCH_ASSOC);
        
        $initials = getInitials($user['name']);
        $color = generateRandomColor();
        
        $addMemberStmt = $db->prepare("
            INSERT INTO workspace_users (workspace_id, user_id, name, initials, color, role)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $addMemberStmt->execute([
            $invite['workspace_id'],
            $userId,
            $user['name'],
            $initials,
            $color,
            $invite['role']
        ]);
        
        // Update invitation status
        $updateInviteStmt = $db->prepare("
            UPDATE workspace_invites 
            SET status = 'accepted', updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        ");
        $updateInviteStmt->execute([$invite['id']]);
        
        $db->commit();
        
        // Get workspace info
        $workspaceStmt = $db->prepare("SELECT id, name FROM workspaces WHERE id = ?");
        $workspaceStmt->execute([$invite['workspace_id']]);
        $workspace = $workspaceStmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode([
            "success" => true,
            "message" => "Successfully joined workspace",
            "workspace" => $workspace,
            "role" => $invite['role']
        ]);
        
    } catch (Exception $e) {
        $db->rollBack();
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Failed to accept invitation: " . $e->getMessage()
        ]);
    }
}

else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
}

// Helper function to get initials
function getInitials($name) {
    $parts = explode(' ', trim($name));
    $initials = '';
    foreach ($parts as $part) {
        if (!empty($part)) {
            $initials .= strtoupper(substr($part, 0, 1));
        }
    }
    return substr($initials, 0, 2);
}

// Helper function to generate random color
function generateRandomColor() {
    $colors = ['#60a5fa', '#34d399', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    return $colors[array_rand($colors)];
}
?>
