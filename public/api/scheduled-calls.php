<?php
require_once 'config/database.php';
require_once 'includes/functions.php';

// Handle different HTTP methods
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleScheduledCallsGet();
        break;
    case 'POST':
        handleScheduledCallsPost();
        break;
    default:
        sendError('Method not allowed', 405);
}

function handleScheduledCallsGet() {
    global $db;

    // Get the next upcoming scheduled call
    $stmt = $db->prepare("
        SELECT
            sc.id,
            sc.title,
            sc.description,
            sc.scheduled_at,
            sc.duration_minutes,
            sc.created_by,
            u.username as creator_username,
            u.display_name as creator_name
        FROM kfmn.scheduled_calls sc
        LEFT JOIN kfmn.users u ON sc.created_by = u.id
        WHERE sc.scheduled_at > (NOW() - INTERVAL '2 hours')
        AND sc.is_active = true
        ORDER BY sc.scheduled_at ASC
        LIMIT 1
    ");
    $stmt->execute();
    $call = $stmt->fetch();

    if (!$call) {
        sendJsonResponse(['scheduled_call' => null]);
        return;
    }

    // Check if call is clickable (within 15 minutes or already started)
    $scheduledTime = strtotime($call['scheduled_at']);
    $now = time();
    $timeDiff = $scheduledTime - $now;
    $isClickable = $timeDiff <= (15 * 60); // Within 15 minutes

    // Calculate countdown
    $countdown = '';
    if ($timeDiff <= 0) {
        $countdown = 'Jetzt live!';
    } else {
        $hours = floor($timeDiff / 3600);
        $minutes = floor(($timeDiff % 3600) / 60);
        $seconds = $timeDiff % 60;

        if ($hours > 0) {
            $countdown = "in {$hours} Std. {$minutes} Min.";
        } elseif ($minutes > 0) {
            $countdown = "in {$minutes} Min. {$seconds} Sek.";
        } else {
            $countdown = "in {$seconds} Sek.";
        }
    }

    sendJsonResponse([
        'scheduled_call' => [
            'id' => $call['id'],
            'title' => $call['title'],
            'scheduled_at' => $call['scheduled_at'],
            'duration_minutes' => $call['duration_minutes'],
            'creator_name' => $call['creator_name'] ?: $call['creator_username'],
            'is_clickable' => $isClickable,
            'countdown' => $countdown
        ]
    ]);
}

function handleScheduledCallsPost() {
    $user = requireAuth();
    global $db;

    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || empty($input['scheduled_at'])) {
        sendError('Scheduled time is required');
    }

    $title = sanitizeInput($input['title'] ?? 'Gemeinsames Gebet');
    $description = sanitizeInput($input['description'] ?? '');
    $scheduledAt = $input['scheduled_at'];
    $duration = (int)($input['duration_minutes'] ?? 60);

    // Validate scheduled time is in the future
    $scheduledTime = strtotime($scheduledAt);
    if ($scheduledTime <= time()) {
        sendError('Scheduled time must be in the future');
    }

    // Validate duration
    if ($duration < 15 || $duration > 180) {
        sendError('Duration must be between 15 and 180 minutes');
    }

    // Create scheduled call
    $stmt = $db->prepare("
        INSERT INTO kfmn.scheduled_calls (title, description, scheduled_at, duration_minutes, created_by)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([$title, $description, $scheduledAt, $duration, $user['id']]);

    // Get the inserted record
    $stmt = $db->prepare("
        SELECT id, title, description, scheduled_at, duration_minutes
        FROM kfmn.scheduled_calls
        WHERE title = ? AND scheduled_at = ? AND created_by = ?
        ORDER BY id DESC LIMIT 1
    ");
    $stmt->execute([$title, $scheduledAt, $user['id']]);
    $call = $stmt->fetch();

    sendJsonResponse([
        'success' => true,
        'scheduled_call' => $call,
        'message' => 'Prayer call scheduled successfully'
    ]);
}

// Function to get mock scheduled call (for when no real calls exist)
function getMockScheduledCall() {
    $now = time();
    $random = mt_rand() / mt_getrandmax();

    // 40% chance of imminent/started call
    if ($random < 0.4) {
        if (mt_rand(0, 1)) {
            // Already started (within last 30 minutes to 2 hours ago)
            return date('Y-m-d H:i:s', $now - (mt_rand(30, 120) * 60));
        } else {
            // Starting within 15 minutes
            return date('Y-m-d H:i:s', $now + mt_rand(1, 15) * 60);
        }
    }
    // 30% chance of no upcoming call
    elseif ($random < 0.7) {
        return null;
    }
    // 30% chance of future calls
    else {
        $futureOptions = [
            $now + mt_rand(15, 60) * 60,        // 15-60 minutes from now
            $now + mt_rand(1, 24) * 3600,       // Within next day
            $now + mt_rand(1, 7) * 24 * 3600,   // Within next week
        ];
        return date('Y-m-d H:i:s', $futureOptions[array_rand($futureOptions)]);
    }
}
?>