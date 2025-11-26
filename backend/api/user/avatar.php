<?php
/**
 * User Avatar Upload API
 * POST /api/user/avatar.php
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

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

// POST: Upload avatar
if ($method === 'POST') {
    // Check if file was uploaded
    if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "No file uploaded or upload error"
        ]);
        exit();
    }
    
    $file = $_FILES['avatar'];
    
    // Validate file size (5MB max)
    $maxSize = 5 * 1024 * 1024; // 5MB
    if ($file['size'] > $maxSize) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "File size exceeds 5MB limit"
        ]);
        exit();
    }
    
    // Validate file type
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mimeType, $allowedTypes)) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed"
        ]);
        exit();
    }
    
    try {
        // Create uploads directory if it doesn't exist
        $uploadDir = __DIR__ . '/../uploads/avatars/';
        if (!file_exists($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        // Generate unique filename
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'avatar_' . $userId . '_' . time() . '.' . $extension;
        $targetPath = $uploadDir . $filename;
        
        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            throw new Exception("Failed to move uploaded file");
        }
        
        // Generate URL path (relative to API root)
        $avatarUrl = 'uploads/avatars/' . $filename;
        
        // Update user's avatar in database
        $stmt = $db->prepare("UPDATE users SET avatar = ? WHERE id = ?");
        $stmt->execute([$avatarUrl, $userId]);
        
        // Delete old avatar file if exists
        $oldAvatarStmt = $db->prepare("SELECT avatar FROM users WHERE id = ?");
        $oldAvatarStmt->execute([$userId]);
        $oldData = $oldAvatarStmt->fetch(PDO::FETCH_ASSOC);
        if ($oldData && $oldData['avatar'] && $oldData['avatar'] !== $avatarUrl) {
            $oldAvatarPath = __DIR__ . '/../' . $oldData['avatar'];
            if (file_exists($oldAvatarPath)) {
                @unlink($oldAvatarPath);
            }
        }
        
        echo json_encode([
            "success" => true,
            "message" => "Avatar uploaded successfully",
            "avatar_url" => $avatarUrl
        ]);
        
    } catch (Exception $e) {
        error_log("Avatar upload error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            "success" => false,
            "message" => "Failed to upload avatar"
        ]);
    }
}

else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
}
?>
