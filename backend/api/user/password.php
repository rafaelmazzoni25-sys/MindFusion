<?php
/**
 * User Password Change API
 * PUT /api/user/password.php
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: PUT, OPTIONS");
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
if (!$userId) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Invalid user data"]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

// PUT: Change password
if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"));
    
    // Validate input
    if (empty($data->old_password) || empty($data->new_password)) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Old password and new password are required"
        ]);
        exit();
    }
    
    // Validate new password length
    if (strlen($data->new_password) < 6) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "New password must be at least 6 characters long"
        ]);
        exit();
    }
    
    try {
        // Get current password hash
        $stmt = $db->prepare("SELECT password_hash FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "User not found"]);
            exit();
        }
        
        // Verify old password
        if (!password_verify($data->old_password, $user['password_hash'])) {
            http_response_code(401);
            echo json_encode([
                "success" => false,
                "message" => "Current password is incorrect"
            ]);
            exit();
        }
        
        // Hash new password
        $newPasswordHash = password_hash($data->new_password, PASSWORD_DEFAULT);
        
        // Update password
        $updateStmt = $db->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
        $updateStmt->execute([$newPasswordHash, $userId]);
        
        echo json_encode([
            "success" => true,
            "message" => "Password changed successfully"
        ]);
        
    } catch (Exception $e) {
        error_log("Password change error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Failed to change password"
        ]);
    }
}

else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
}
?>
