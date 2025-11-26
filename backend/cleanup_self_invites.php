<?php
/**
 * Cleanup Script: Remove self-invites
 * This script removes invites where the invited email matches the inviter's email
 */

require_once __DIR__ . '/api/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "Checking for self-invites...
";

// Find self-invites (where invited email matches inviter's email)
$findSelfInvites = $db->prepare("
    SELECT 
        wi.id,
        wi.email as invited_email,
        u.email as inviter_email,
        u.name as inviter_name,
        w.name as workspace_name
    FROM workspace_invites wi
    JOIN users u ON wi.invited_by_user_id = u.id
    JOIN workspaces w ON wi.workspace_id = w.id
    WHERE LOWER(wi.email) = LOWER(u.email)
    AND wi.status = 'pending'
");

$findSelfInvites->execute();
$selfInvites = $findSelfInvites->fetchAll(PDO::FETCH_ASSOC);

if (count($selfInvites) === 0) {
    echo "✓ No self-invites found. Database is clean!
";
    exit(0);
}

echo "Found " . count($selfInvites) . " self-invite(s):
";
foreach ($selfInvites as $invite) {
    echo "  - ID: {$invite['id']} | {$invite['inviter_name']} invited themselves ({$invite['invited_email']}) to '{$workspace_name}'
";
}

echo "
Cancelling self-invites...
";

// Cancel (not delete) self-invites to preserve audit trail
$cancelStmt = $db->prepare("
    UPDATE workspace_invites 
    SET status = 'cancelled'
    WHERE id IN (
        SELECT wi.id 
        FROM workspace_invites wi
        JOIN users u ON wi.invited_by_user_id = u.id
        WHERE LOWER(wi.email) = LOWER(u.email)
        AND wi.status = 'pending'
    )
");

if ($cancelStmt->execute()) {
    echo "✓ Successfully cancelled " . count($selfInvites) . " self-invite(s)!
";
    echo "
These invites have been marked as 'cancelled' and will no longer appear in notifications.
";
} else {
    echo "✗ Failed to cancel self-invites.
";
    exit(1);
}
?>
