<?php
/**
 * Activity Logs API
 * Retrieve activity logs for workspace dashboard
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
require_once '../helpers/ActivityLogger.php';

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

// GET: Get activities
if ($method === 'GET') {
    $workspaceId = $_GET['workspace_id'] ?? null;
    
    if (!$workspaceId) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Workspace ID is required"]);
        exit();
    }
    
    // Check if user has access to this workspace
    PermissionMiddleware::requirePermission($db, $workspaceId, $userId, 'view');
    
    // Get pagination params
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
    
    // Get filters
    $filters = [];
    if (!empty($_GET['action_type'])) {
        $filters['action_type'] = $_GET['action_type'];
    }
    if (!empty($_GET['entity_type'])) {
        $filters['entity_type'] = $_GET['entity_type'];
    }
    if (!empty($_GET['user_id'])) {
        $filters['user_id'] = $_GET['user_id'];
    }
    if (!empty($_GET['from_date'])) {
        $filters['from_date'] = $_GET['from_date'];
    }
    if (!empty($_GET['to_date'])) {
        $filters['to_date'] = $_GET['to_date'];
    }
    
    // Get activities
    $activities = ActivityLogger::getActivities($db, $workspaceId, $limit, $offset, $filters);
    $total = ActivityLogger::getActivityCount($db, $workspaceId, $filters);
    
    echo json_encode([
        "success" => true,
        "activities" => $activities,
        "total" => $total,
        "limit" => $limit,
        "offset" => $offset
    ]);
}

else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
}
?>
