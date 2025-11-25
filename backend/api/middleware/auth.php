<?php
/**
 * Authentication Middleware
 * Validates JWT token for protected routes
 */

require_once __DIR__ . '/../config/jwt.php';

class AuthMiddleware {
    
    /**
     * Verify JWT token from Authorization header
     * Returns user data if valid, null otherwise
     */
    public static function authenticate() {
        $headers = getallheaders();
        
        if (!isset($headers['Authorization'])) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'No authorization token provided'
            ]);
            exit();
        }
        
        $authHeader = $headers['Authorization'];
        $token = str_replace('Bearer ', '', $authHeader);
        
        $decoded = JWT::decode($token);
        
        if (!$decoded) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid or expired token'
            ]);
            exit();
        }
        
        return $decoded;
    }
    
    /**
     * Get workspace_id for authenticated user
     * Reads from query parameter, verifies access, or falls back to first workspace
     */
    public static function getWorkspaceId($db, $userId) {
        try {
            // Get workspace_id from query parameter
            $workspaceId = $_GET['workspace_id'] ?? null;
            
            if ($workspaceId) {
                // Verify user owns this workspace
                $query = "SELECT id FROM workspaces WHERE id = ? AND user_id = ?";
                $stmt = $db->prepare($query);
                $stmt->execute([$workspaceId, $userId]);
                if ($stmt->fetch()) {
                    return (int)$workspaceId;
                }
                
                // Also check if user is a member
                $memberQuery = "SELECT workspace_id FROM workspace_users WHERE workspace_id = ? AND user_id = ?";
                $memberStmt = $db->prepare($memberQuery);
                $memberStmt->execute([$workspaceId, $userId]);
                if ($memberStmt->fetch()) {
                    return (int)$workspaceId;
                }
                
                // User doesn't have access to requested workspace
                error_log("User $userId attempted to access workspace $workspaceId without permission");
            }
            
            // Fallback: return first workspace
            $query = "SELECT id FROM workspaces WHERE user_id = ? LIMIT 1";
            $stmt = $db->prepare($query);
            $stmt->execute([$userId]);
            $workspace = $stmt->fetch();
            
            if (!$workspace) {
                // Create workspace if doesn't exist
                $createQuery = "INSERT INTO workspaces (user_id, name) VALUES (?, 'My Workspace')";
                $createStmt = $db->prepare($createQuery);
                $createStmt->execute([$userId]);
                return (int)$db->lastInsertId();
            }
            
            return (int)$workspace['id'];
        } catch (Exception $e) {
            error_log("getWorkspaceId error: " . $e->getMessage());
            return null;
        }
    }
}
?>
