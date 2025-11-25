<?php
/**
 * Workspace Permissions API
 * Get user permissions for a workspace
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, OPTIONS");
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

// GET: Get user permissions for a workspace
if ($method === 'GET') {
    $workspaceId = $_GET['workspace_id'] ?? null;
    
    if (!$workspaceId) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Workspace ID is required"]);
        exit();
    }
    
    $permissions = PermissionMiddleware::getUserPermissions($db, $workspaceId, $userId);
    
    if (!$permissions) {
        http_response_code(404);
        echo json_encode([
            "success" => false, 
            "message" => "Workspace not found or you don't have access"
        ]);
        exit();
    }
    
    echo json_encode([
        "success" => true,
        "permissions" => $permissions
    ]);
}

else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
}
?>
