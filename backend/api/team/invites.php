<?php
/**
 * Team Invites API
 * Handles sending, listing, and canceling workspace invites
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

// Get user's workspace - for MVP, use first workspace
$workspaceStmt = $db->prepare("SELECT id FROM workspaces WHERE user_id = ? LIMIT 1");
$workspaceStmt->execute([$userId]);
$workspace = $workspaceStmt->fetch(PDO::FETCH_ASSOC);
$workspace_id = $workspace['id'] ?? null;

if (!$workspace_id) {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "No workspace found"]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

// POST: Send invite
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    
    if (!isset($data->email) || !filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Valid email is required"]);
        exit();
    }
    
    $email = trim(strtolower($data->email));
    $role = $data->role ?? 'Editor';
    
    // Validate: Cannot invite yourself
    if ($email === strtolower($userEmail)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "You cannot invite yourself"]);
        exit();
    }
    
    // Check if user is already a member
    $check_member = $db->prepare("SELECT id FROM workspace_users WHERE workspace_id = ? AND user_id IN (SELECT id FROM users WHERE LOWER(email) = ?)");
    $check_member->execute([$workspace_id, $email]);
    if ($check_member->fetch()) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "User is already a member of this workspace"]);
        exit();
    }
    
    // Check if there's already a pending invite
    $check_invite = $db->prepare("SELECT id FROM workspace_invites WHERE workspace_id = ? AND LOWER(email) = ? AND status = 'pending'");
    $check_invite->execute([$workspace_id, $email]);
    if ($check_invite->fetch()) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "An invite has already been sent to this email"]);
        exit();
    }
    
    // Generate unique token
    $token = bin2hex(random_bytes(32));
    
    // Set expiration (7 days from now)
    $expires_at = date('Y-m-d H:i:s', strtotime('+7 days'));
    
    // Insert invite
    $stmt = $db->prepare("INSERT INTO workspace_invites (workspace_id, email, role, invited_by_user_id, token, expires_at) VALUES (?, ?, ?, ?, ?, ?)");
    
    if ($stmt->execute([$workspace_id, $email, $role, $userId, $token, $expires_at])) {
        $invite_id = $db->lastInsertId();
        
        // Fetch the created invite
        $fetch = $db->prepare("SELECT id, email, role, status, created_at FROM workspace_invites WHERE id = ?");
        $fetch->execute([$invite_id]);
        $invite = $fetch->fetch(PDO::FETCH_ASSOC);
        
        http_response_code(201);
        echo json_encode([
            "success" => true,
            "message" => "Invite sent successfully",
            "invite" => $invite
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to send invite"]);
    }
}

// GET: List pending invites
elseif ($method === 'GET') {
    $stmt = $db->prepare("
        SELECT 
            wi.id,
            wi.email,
            wi.role,
            wi.status,
            wi.created_at,
            u.name as invited_by
        FROM workspace_invites wi
        LEFT JOIN users u ON wi.invited_by_user_id = u.id
        WHERE wi.workspace_id = ? AND wi.status = 'pending'
        ORDER BY wi.created_at DESC
    ");
    
    $stmt->execute([$workspace_id]);
    $invites = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        "success" => true,
        "invites" => $invites
    ]);
}

// DELETE: Cancel invite
elseif ($method === 'DELETE') {
    $invite_id = $_GET['id'] ?? null;
    
    if (!$invite_id) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invite ID is required"]);
        exit();
    }
    
    // Verify invite belongs to user's workspace
    $check = $db->prepare("SELECT id FROM workspace_invites WHERE id = ? AND workspace_id = ?");
    $check->execute([$invite_id, $workspace_id]);
    
    if (!$check->fetch()) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Invite not found"]);
        exit();
    }
    
    // Update status to cancelled instead of deleting
    $stmt = $db->prepare("UPDATE workspace_invites SET status = 'cancelled' WHERE id = ?");
    
    if ($stmt->execute([$invite_id])) {
        echo json_encode([
            "success" => true,
            "message" => "Invite cancelled successfully"
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to cancel invite"]);
    }
}

else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
}
?>
