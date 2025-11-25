<?php
/**
 * Permission Middleware
 * Role-based access control for workspace actions
 */

class PermissionMiddleware {
    
    // Permission matrix: role => allowed actions
    const PERMISSIONS = [
        'Owner' => ['view', 'create', 'edit', 'delete', 'manage_members', 'manage_workspace'],
        'Admin' => ['view', 'create', 'edit', 'delete', 'manage_members'],
        'Editor' => ['view', 'create', 'edit', 'delete'],
        'Viewer' => ['view']
    ];
    
    /**
     * Check if a role can perform an action
     */
    public static function can($role, $action) {
        return in_array($action, self::PERMISSIONS[$role] ?? []);
    }
    
    /**
     * Get user's role in a workspace
     */
    public static function getUserRole($db, $workspaceId, $userId) {
        // Check if user owns the workspace
        $ownerStmt = $db->prepare("SELECT id FROM workspaces WHERE id = ? AND user_id = ?");
        $ownerStmt->execute([$workspaceId, $userId]);
        if ($ownerStmt->fetch()) {
            return 'Owner';
        }
        
        // Check if user is a member
        $memberStmt = $db->prepare("SELECT role FROM workspace_users WHERE workspace_id = ? AND user_id = ?");
        $memberStmt->execute([$workspaceId, $userId]);
        $member = $memberStmt->fetch(PDO::FETCH_ASSOC);
        
        return $member ? $member['role'] : null;
    }
    
    /**
     * Require a specific permission for an action
     * Dies with 403 if permission denied
     */
    public static function requirePermission($db, $workspaceId, $userId, $action) {
        $role = self::getUserRole($db, $workspaceId, $userId);
        
        if (!$role) {
            http_response_code(404);
            echo json_encode([
                'success' => false, 
                'message' => 'Workspace not found or no access'
            ]);
            exit();
        }
        
        if (!self::can($role, $action)) {
            http_response_code(403);
            echo json_encode([
                'success' => false, 
                'message' => 'Insufficient permissions',
                'required' => $action,
                'your_role' => $role
            ]);
            exit();
        }
        
        return $role;
    }
    
    /**
     * Get user's permissions in a workspace
     */
    public static function getUserPermissions($db, $workspaceId, $userId) {
        $role = self::getUserRole($db, $workspaceId, $userId);
        
        if (!$role) {
            return null;
        }
        
        return [
            'role' => $role,
            'permissions' => self::PERMISSIONS[$role] ?? [],
            'can' => [
                'view' => self::can($role, 'view'),
                'create' => self::can($role, 'create'),
                'edit' => self::can($role, 'edit'),
                'delete' => self::can($role, 'delete'),
                'manage_members' => self::can($role, 'manage_members'),
                'manage_workspace' => self::can($role, 'manage_workspace')
            ]
        ];
    }
}
?>
