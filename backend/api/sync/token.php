<?php
/**
 * Generate Temporary SSE Token
 * Creates a short-lived token for SSE stream authentication
 */

require_once '../config/database.php';
require_once '../middleware/auth.php';

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"));
    $workspaceId = $data->workspace_id ?? null;
    
    if (!$workspaceId) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Workspace ID required"]);
        exit();
    }
    
    // Generate temporary token (valid for 5 minutes)
    $tempToken = bin2hex(random_bytes(32));
    $expiresAt = date('Y-m-d H:i:s', strtotime('+5 minutes'));
    
    // Store token in database
    $stmt = $db->prepare("
        INSERT INTO sse_tokens (token, user_id, workspace_id, expires_at)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            token = VALUES(token),
            expires_at = VALUES(expires_at),
            created_at = CURRENT_TIMESTAMP
    ");
    
    try {
        $stmt->execute([$tempToken, $userId, $workspaceId, $expiresAt]);
        
        // Clean up expired tokens
        $cleanupStmt = $db->prepare("DELETE FROM sse_tokens WHERE expires_at < NOW()");
        $cleanupStmt->execute();
        
        echo json_encode([
            "success" => true,
            "token" => $tempToken,
            "expires_at" => $expiresAt
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Failed to generate token: " . $e->getMessage()
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
}
?>
