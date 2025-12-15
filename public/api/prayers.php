<?php
require_once 'config/database.php';
require_once 'includes/functions.php';

// Handle different HTTP methods
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handlePrayersGet();
        break;
    case 'POST':
        handlePrayersPost();
        break;
    default:
        sendError('Method not allowed', 405);
}

function handlePrayersGet() {
    global $db;

    // Optional authentication for filtering
    $token = getBearerToken();
    $currentUser = null;
    if ($token) {
        $currentUser = Database::getInstance()->getUserBySession($token);
    }

    // Get query parameters
    $filter = $_GET['filter'] ?? 'all';
    $hashtag = $_GET['hashtag'] ?? '';
    $limit = min((int)($_GET['limit'] ?? 50), 100);
    $offset = (int)($_GET['offset'] ?? 0);

    $params = [];
    $whereClause = '';

    // Build filter conditions
    switch ($filter) {
        case 'own':
            if (!$currentUser) {
                sendJsonResponse(['prayers' => []]);
                return;
            }
            $whereClause = 'WHERE p.user_id = ?';
            $params[] = $currentUser['id'];
            break;
        case 'unanswered':
            $whereClause = 'WHERE NOT EXISTS (SELECT 1 FROM kfmn.reactions r WHERE r.prayer_id = p.id)';
            break;
        case 'unseen':
            if (!$currentUser) {
                sendJsonResponse(['prayers' => []]);
                return;
            }
            $whereClause = 'WHERE NOT EXISTS (
                SELECT 1 FROM kfmn.reactions r
                JOIN kfmn.reaction_users ru ON r.id = ru.reaction_id
                WHERE r.prayer_id = p.id AND ru.user_id = ?
            )';
            $params[] = $currentUser['id'];
            break;
        case 'seen':
            if (!$currentUser) {
                sendJsonResponse(['prayers' => []]);
                return;
            }
            $whereClause = 'WHERE EXISTS (
                SELECT 1 FROM kfmn.reactions r
                JOIN kfmn.reaction_users ru ON r.id = ru.reaction_id
                WHERE r.prayer_id = p.id AND ru.user_id = ?
            )';
            $params[] = $currentUser['id'];
            break;
        default: // 'all'
            $whereClause = '';
    }

    // Add hashtag filter
    if ($hashtag) {
        $hashtags = explode(' ', trim($hashtag));
        $hashtagConditions = [];
        foreach ($hashtags as $tag) {
            if (strpos($tag, '#') === 0) {
                $tag = substr($tag, 1);
                $hashtagConditions[] = "p.prayer_text ILIKE ?";
                $params[] = "%#$tag%";
            }
        }
        if ($hashtagConditions) {
            $hashtagClause = '(' . implode(' AND ', $hashtagConditions) . ')';
            $whereClause = $whereClause ? $whereClause . ' AND ' . $hashtagClause : 'WHERE ' . $hashtagClause;
        }
    }

    // Build query
    $query = "
        SELECT
            p.id,
            p.prayer_text,
            p.created_at,
            u.username,
            u.display_name,
            u.user_color,
            u.user_avatar,
            u.is_verified,
            COALESCE(json_agg(
                json_build_object(
                    'emoji', r.emoji,
                    'count', r.reaction_count,
                    'user_reacted', CASE WHEN ?::uuid IS NOT NULL THEN r.user_reacted ELSE false END,
                    'comment_count', r.comment_count
                )
            ) FILTER (WHERE r.emoji IS NOT NULL), '[]'::json) as reactions
        FROM kfmn.prayers p
        JOIN kfmn.users u ON p.user_id = u.id
        LEFT JOIN (
            SELECT
                r.prayer_id,
                r.emoji,
                COUNT(ru.id) as reaction_count,
                COUNT(rc.id) as comment_count,
                BOOL_OR(ru.user_id = ?::uuid) as user_reacted
            FROM kfmn.reactions r
            LEFT JOIN kfmn.reaction_users ru ON r.id = ru.reaction_id
            LEFT JOIN kfmn.reaction_comments rc ON r.id = rc.reaction_id
            GROUP BY r.prayer_id, r.emoji, r.id
        ) r ON p.id = r.prayer_id
        $whereClause
        GROUP BY p.id, p.prayer_text, p.created_at, u.username, u.display_name, u.user_color, u.user_avatar, u.is_verified
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
    ";

    $params[] = $currentUser['id'] ?? null;
    $params[] = $currentUser['id'] ?? null;
    $params[] = $limit;
    $params[] = $offset;

    $stmt = $db->prepare($query);
    $stmt->execute($params);
    $prayers = $stmt->fetchAll();

    // Format prayers for frontend compatibility
    $formattedPrayers = array_map(function($prayer) use ($currentUser) {
        // Fetch full reaction data including comments and user reactions
        $reactions = getReactionData($prayer['id'], $currentUser['id'] ?? null);

        return [
            'id' => $prayer['id'],
            'name' => $prayer['display_name'] ?: $prayer['username'],
            'text' => $prayer['prayer_text'],
            'createdAt' => $prayer['created_at'],
            'reactions' => $reactions,
            'userColor' => $prayer['user_color'],
            'userAvatar' => $prayer['user_avatar'],
            'verified' => $prayer['is_verified'],
            'creatorUsername' => $prayer['username']
        ];
    }, $prayers);

    sendJsonResponse([
        'prayers' => $formattedPrayers,
        'has_more' => count($prayers) === $limit
    ]);
}

/**
 * Helpers for loading full reaction data (shared with reactions endpoint behaviour)
 */
function getReactionData($prayerId, $userId = null) {
    global $db;

    $stmt = $db->prepare("
        SELECT
            r.id,
            r.emoji,
            COUNT(DISTINCT ru.id) as count,
            COUNT(DISTINCT rc.id) as comment_count,
            BOOL_OR(ru.user_id = ?::uuid) as user_reacted
        FROM kfmn.reactions r
        LEFT JOIN kfmn.reaction_users ru ON r.id = ru.reaction_id
        LEFT JOIN kfmn.reaction_comments rc ON r.id = rc.reaction_id
        WHERE r.prayer_id = ?::uuid
        GROUP BY r.id, r.emoji
        ORDER BY r.emoji
    ");
    $stmt->execute([$userId, $prayerId]);

    $reactions = [];
    while ($row = $stmt->fetch()) {
        $reactions[] = [
            'emoji' => $row['emoji'],
            'count' => (int)$row['count'],
            'comments' => getReactionComments($row['id'], $row['emoji']),
            'userReactions' => getUserReactions($row['id']),
        ];
    }

    return $reactions;
}

function getReactionComments($reactionId, $emoji) {
    global $db;

    $stmt = $db->prepare("
        SELECT
            rc.comment_text as text,
            u.username as creatorUsername,
            u.display_name as name,
            u.user_color as color
        FROM kfmn.reaction_comments rc
        JOIN kfmn.users u ON rc.user_id = u.id
        WHERE rc.reaction_id = ?::uuid
        ORDER BY rc.created_at ASC
    ");
    $stmt->execute([$reactionId]);

    // Attach emoji to each comment for UI display
    return array_map(function($comment) use ($emoji) {
        return array_merge($comment, ['emoji' => $emoji]);
    }, $stmt->fetchAll());
}

function getUserReactions($reactionId) {
    global $db;

    $stmt = $db->prepare("
        SELECT u.username
        FROM kfmn.reaction_users ru
        JOIN kfmn.users u ON ru.user_id = u.id
        WHERE ru.reaction_id = ?::uuid
    ");
    $stmt->execute([$reactionId]);

    return array_column($stmt->fetchAll(), 'username');
}

function handlePrayersPost() {
    $user = requireAuth();
    global $db;

    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || empty($input['text'])) {
        sendError('Prayer text is required');
    }

    $text = sanitizeInput($input['text']);

    if (strlen($text) > 2000) {
        sendError('Prayer text is too long (max 2000 characters)');
    }

    // Create prayer
    $stmt = $db->prepare("
        INSERT INTO kfmn.prayers (user_id, prayer_text)
        VALUES (?, ?)
        RETURNING id, prayer_text, created_at
    ");
    $stmt->execute([$user['id'], $text]);
    $prayer = $stmt->fetch();

    sendJsonResponse([
        'success' => true,
        'prayer' => [
            'id' => $prayer['id'],
            'name' => $user['display_name'] ?: $user['username'],
            'text' => $prayer['prayer_text'],
            'createdAt' => $prayer['created_at'],
            'reactions' => [],
            'userColor' => $user['user_color'],
            'userAvatar' => $user['user_avatar'],
            'verified' => $user['is_verified'],
            'creatorUsername' => $user['username']
        ],
        'message' => 'Prayer submitted successfully'
    ]);
}
?>