<?php
/**
 * Event Logger Helper
 * Logs workspace events for real-time synchronization
 */

class EventLogger {
    
    /**
     * Log an event to the workspace_events table
     */
    public static function log($db, $workspaceId, $eventType, $entityType, $entityId, $userId, $data) {
        try {
            $stmt = $db->prepare("
                INSERT INTO workspace_events (workspace_id, event_type, entity_type, entity_id, user_id, data)
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            
            $jsonData = is_string($data) ? $data : json_encode($data);
            
            $stmt->execute([
                $workspaceId,
                $eventType,
                $entityType,
                $entityId,
                $userId,
                $jsonData
            ]);
            
            return $db->lastInsertId();
        } catch (Exception $e) {
            error_log("EventLogger error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Get events since a given ID
     */
    public static function getEventsSince($db, $workspaceId, $lastEventId = 0) {
        $stmt = $db->prepare("
            SELECT 
                e.id,
                e.event_type,
                e.entity_type,
                e.entity_id,
                e.data,
                e.created_at,
                u.name as user_name
            FROM workspace_events e
            JOIN users u ON e.user_id = u.id
            WHERE e.workspace_id = ? AND e.id > ?
            ORDER BY e.id ASC
            LIMIT 50
        ");
        
        $stmt->execute([$workspaceId, $lastEventId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
