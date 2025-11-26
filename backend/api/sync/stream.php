<?php
/**
 * Server-Sent Events (SSE) Stream
 * Real-time event streaming for workspace synchronization
 */

// Set headers for SSE
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');
header('Connection: keep-alive');
header('X-Accel-Buffering: no'); // Disable nginx buffering
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');

// Disable output buffering
if (ob_get_level()) ob_end_clean();

require_once '../config/database.php';
require_once '../middleware/auth.php';
require_once '../middleware/permissions.php';
require_once '../helpers/EventLogger.php';

$database = new Database();
$db = $database->getConnection();

// Get parameters
$workspaceId = $_GET['workspace_id'] ?? null;
$tempToken = $_GET['token'] ?? null;

if (!$workspaceId || !$tempToken) {
    echo "event: error\n";
    echo "data: {\"message\": \"Workspace ID and token required\"}\n\n";
    flush();
    exit();
}

// Validate temporary token
$stmt = $db->prepare("
    SELECT user_id, workspace_id, expires_at 
    FROM sse_tokens 
    WHERE token = ? AND workspace_id = ? AND expires_at > NOW()
");
$stmt->execute([$tempToken, $workspaceId]);
$tokenData = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$tokenData) {
    echo "event: error\n";
    echo "data: {\"message\": \"Invalid or expired token\"}\n\n";
    flush();
    exit();
}

$userId = $tokenData['user_id'];

// Verify access to workspace
try {
    PermissionMiddleware::requirePermission($db, $workspaceId, $userId, 'view');
} catch (Exception $e) {
    echo "event: error\n";
    echo "data: {\"message\": \"No access to workspace\"}\n\n";
    flush();
    exit();
}

// Get last event ID from client
$lastEventId = $_GET['lastEventId'] ?? $_SERVER['HTTP_LAST_EVENT_ID'] ?? 0;

// Send initial connection success
echo "event: connected\n";
echo "data: {\"message\": \"Connected to workspace {$workspaceId}\"}\n\n";
flush();

// Keep connection alive and send events
$maxIterations = 300; // 5 minutes (1 second per iteration)
$iteration = 0;

while ($iteration < $maxIterations) {
    // Check if connection is still alive
    if (connection_aborted()) {
        break;
    }
    
    // Get new events since last ID
    $events = EventLogger::getEventsSince($db, $workspaceId, $lastEventId);
    
    foreach ($events as $event) {
        // Don't send events triggered by the same user (they already have the update)
        // Actually, send all events - let the client decide to ignore its own
        
        echo "id: {$event['id']}\n";
        echo "event: {$event['event_type']}\n";
        
        $eventData = [
            'id' => $event['id'],
            'type' => $event['event_type'],
            'entity_type' => $event['entity_type'],
            'entity_id' => $event['entity_id'],
            'data' => json_decode($event['data'], true),
            'user_name' => $event['user_name'],
            'timestamp' => $event['created_at']
        ];
        
        echo "data: " . json_encode($eventData) . "\n\n";
        flush();
        
        $lastEventId = $event['id'];
    }
    
    // Send heartbeat every 15 seconds to keep connection alive
    if ($iteration % 15 === 0) {
        echo ": heartbeat\n\n";
        flush();
    }
    
    // Wait 1 second before checking for new events
    sleep(1);
    $iteration++;
}

// Connection closed
echo "event: close\n";
echo "data: {\"message\": \"Connection timeout\"}\n\n";
flush();
?>
