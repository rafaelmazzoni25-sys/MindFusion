<?php
/**
 * User Profile API
 * GET/PUT /api/user/profile.php
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, PUT, OPTIONS");
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

// GET: Fetch user profile
if ($method === 'GET') {
    try {
        $stmt = $db->prepare("
            SELECT id, name, email, avatar, bio, created_at 
            FROM users 
            WHERE id = ?
        ");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "User not found"]);
            exit();
        }
        
        // Get user's role from workspace
        $roleStmt = $db->prepare("
            SELECT role FROM workspace_users 
            WHERE user_id = ? 
            LIMIT 1
        ");
        $roleStmt->execute([$userId]);
        $roleData = $roleStmt->fetch(PDO::FETCH_ASSOC);
        
        $profile = [
            "id" => (string)$user['id'],
            "name" => $user['name'],
            "email" => $user['email'],
            "avatar" => $user['avatar'],
            "bio" => $user['bio'],
            "role" => $roleData['role'] ?? 'Editor',
            "createdAt" => $user['created_at']
        ];
        
        echo json_encode([
            "success" => true,
            "profile" => $profile
        ]);
        
    } catch (Exception $e) {
        error_log("Profile GET error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to fetch profile"]);
    }
}

// PUT: Update user profile
elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"));
    
    try {
        $updates = [];
        $params = [];
        
        // Build dynamic update query
        if (isset($data->name)) {
            $updates[] = "name = ?";
            $params[] = $data->name;
        }
        
        if (isset($data->email)) {
            // Validate email
            if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Invalid email format"]);
                exit();
            }
            
            // Check if email is already taken by another user
            $emailCheck = $db->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
            $emailCheck->execute([$data->email, $userId]);
            if ($emailCheck->fetch()) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Email already in use"]);
                exit();
            }
            
            $updates[] = "email = ?";
            $params[] = $data->email;
        }
        
        if (isset($data->bio)) {
            $updates[] = "bio = ?";
            $params[] = $data->bio;
        }
        
        if (isset($data->avatar)) {
            $updates[] = "avatar = ?";
            $params[] = $data->avatar;
        }
        
        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "No fields to update"]);
            exit();
        }
        
        // Add user ID to params
        $params[] = $userId;
        
        // Execute update
        $sql = "UPDATE users SET " . implode(", ", $updates) . " WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        // Fetch updated profile
        $profileStmt = $db->prepare("
            SELECT id, name, email, avatar, bio, created_at 
            FROM users 
            WHERE id = ?
        ");
        $profileStmt->execute([$userId]);
        $user = $profileStmt->fetch(PDO::FETCH_ASSOC);
        
        // Get role
        $roleStmt = $db->prepare("
            SELECT role FROM workspace_users 
            WHERE user_id = ? 
            LIMIT 1
        ");
        $roleStmt->execute([$userId]);
        $roleData = $roleStmt->fetch(PDO::FETCH_ASSOC);
        
        $profile = [
            "id" => (string)$user['id'],
            "name" => $user['name'],
            "email" => $user['email'],
            "avatar" => $user['avatar'],
            "bio" => $user['bio'],
            "role" => $roleData['role'] ?? 'Editor',
            "createdAt" => $user['created_at']
        ];
        
        echo json_encode([
            "success" => true,
            "message" => "Profile updated successfully",
            "profile" => $profile
        ]);
        
    } catch (Exception $e) {
        error_log("Profile PUT error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to update profile"]);
    }
}

else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
}
?>
