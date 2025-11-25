<?php
/**
 * User Login Endpoint
 * POST /api/auth/login.php
 */

require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/jwt.php';

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Get posted data
$data = json_decode(file_get_contents("php://input"));

// Validate input
if (empty($data->email) || empty($data->password)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Email and password are required'
    ]);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Find user by email
    $query = "SELECT id, email, password_hash, name FROM users WHERE email = ?";
    $stmt = $db->prepare($query);
    $stmt->execute([$data->email]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid email or password'
        ]);
        exit();
    }

    // Verify password
    if (!password_verify($data->password, $user['password_hash'])) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid email or password'
        ]);
        exit();
    }

    // Get user's workspace
    $workspaceQuery = "SELECT id FROM workspaces WHERE user_id = ? LIMIT 1";
    $workspaceStmt = $db->prepare($workspaceQuery);
    $workspaceStmt->execute([$user['id']]);
    $workspace = $workspaceStmt->fetch();
    
    $workspaceId = $workspace ? $workspace['id'] : null;

    // If no workspace exists, create one
    if (!$workspaceId) {
        $createWorkspace = "INSERT INTO workspaces (user_id, name) VALUES (?, 'My Workspace')";
        $createStmt = $db->prepare($createWorkspace);
        $createStmt->execute([$user['id']]);
        $workspaceId = $db->lastInsertId();
    }

    // Generate JWT token
    $payload = [
        'user_id' => $user['id'],
        'email' => $user['email'],
        'name' => $user['name'],
        'workspace_id' => $workspaceId,
        'exp' => time() + (86400 * 30) // 30 days expiration
    ];
    
    $token = JWT::encode($payload);

    // Return success with token
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'email' => $user['email'],
            'name' => $user['name'],
            'workspace_id' => $workspaceId
        ]
    ]);

} catch (Exception $e) {
    error_log("Login error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Login failed'
    ]);
}
?>
