<?php
/**
 * Activity Logger Helper
 * Logs user activities for the activity dashboard
 */

class ActivityLogger {
    
    /**
     * Log an activity
     */
    public static function log($db, $workspaceId, $userId, $actionType, $entityType, $entityId, $entityName, $details = null) {
        try {
            $stmt = $db->prepare("
                INSERT INTO activity_logs (workspace_id, user_id, action_type, entity_type, entity_id, entity_name, details)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ");
            
            $jsonDetails = $details ? (is_string($details) ? $details : json_encode($details)) : null;
            
            $stmt->execute([
                $workspaceId,
                $userId,
                $actionType,
                $entityType,
                $entityId,
                $entityName,
                $jsonDetails
            ]);
            
            return $db->lastInsertId();
        } catch (Exception $e) {
            error_log("ActivityLogger error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get recent activities for a workspace
     */
    public static function getActivities($db, $workspaceId, $limit = 50, $offset = 0, $filters = []) {
        $where = ["a.workspace_id = ?"];
        $params = [$workspaceId];
        
        // Filter by action type
        if (!empty($filters['action_type'])) {
            $where[] = "a.action_type = ?";
            $params[] = $filters['action_type'];
        }
        
        // Filter by entity type
        if (!empty($filters['entity_type'])) {
            $where[] = "a.entity_type = ?";
            $params[] = $filters['entity_type'];
        }
        
        // Filter by user
        if (!empty($filters['user_id'])) {
            $where[] = "a.user_id = ?";
            $params[] = $filters['user_id'];
        }
        
        // Filter by date range
        if (!empty($filters['from_date'])) {
            $where[] = "a.created_at >= ?";
            $params[] = $filters['from_date'];
        }
        
        if (!empty($filters['to_date'])) {
            $where[] = "a.created_at <= ?";
            $params[] = $filters['to_date'];
        }
        
        $whereClause = implode(" AND ", $where);
        
        $stmt = $db->prepare("
            SELECT 
                a.id,
                a.action_type,
                a.entity_type,
                a.entity_id,
                a.entity_name,
                a.details,
                a.created_at,
                u.name as user_name,
                u.id as user_id
            FROM activity_logs a
            JOIN users u ON a.user_id = u.id
            WHERE {$whereClause}
            ORDER BY a.created_at DESC
            LIMIT ? OFFSET ?
        ");
        
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get activity count
     */
    public static function getActivityCount($db, $workspaceId, $filters = []) {
        $where = ["workspace_id = ?"];
        $params = [$workspaceId];
        
        if (!empty($filters['action_type'])) {
            $where[] = "action_type = ?";
            $params[] = $filters['action_type'];
        }
        
        if (!empty($filters['entity_type'])) {
            $where[] = "entity_type = ?";
            $params[] = $filters['entity_type'];
        }
        
        if (!empty($filters['user_id'])) {
            $where[] = "user_id = ?";
            $params[] = $filters['user_id'];
        }
        
        $whereClause = implode(" AND ", $where);
        
        $stmt = $db->prepare("SELECT COUNT(*) as count FROM activity_logs WHERE {$whereClause}");
        $stmt->execute($params);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result['count'];
    }
}
?>
