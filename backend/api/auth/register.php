<?php
/**
 * User Registration Endpoint
 * POST /api/auth/register.php
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
if (empty($data->email) || empty($data->password) || empty($data->name)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Email, password and name are required'
    ]);
    exit();
}

// Validate email format
if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid email format'
    ]);
    exit();
}

// Validate password length
if (strlen($data->password) < 6) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Password must be at least 6 characters'
    ]);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Check if email already exists
    $checkQuery = "SELECT id FROM users WHERE email = ?";
    $checkStmt = $db->prepare($checkQuery);
    $checkStmt->execute([$data->email]);
    
    if ($checkStmt->fetch()) {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'message' => 'Email already registered'
        ]);
        exit();
    }

    // Hash password
    $passwordHash = password_hash($data->password, PASSWORD_BCRYPT);

    // Insert new user
    $insertQuery = "INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)";
    $insertStmt = $db->prepare($insertQuery);
    $insertStmt->execute([$data->email, $passwordHash, $data->name]);
    
    $userId = $db->lastInsertId();

    // Create default workspace for user
    $workspaceQuery = "INSERT INTO workspaces (user_id, name) VALUES (?, ?)";
    $workspaceStmt = $db->prepare($workspaceQuery);
    $workspaceStmt->execute([$userId, 'My Workspace']);
    $workspaceId = $db->lastInsertId();

    // Generate JWT token
    $payload = [
        'user_id' => $userId,
        'email' => $data->email,
        'name' => $data->name,
        'workspace_id' => $workspaceId,
        'exp' => time() + (86400 * 30) // 30 days expiration
    ];
    
    $token = JWT::encode($payload);

    // Return success with token
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'User registered successfully',
        'token' => $token,
        'user' => [
            'id' => $userId,
            'email' => $data->email,
            'name' => $data->name,
            'workspace_id' => $workspaceId
        ]
    ]);

} catch (Exception $e) {
    error_log("Registration error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Registration failed'
    ]);
}
?>
