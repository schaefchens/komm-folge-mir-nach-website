<?php
require_once 'config/database.php';
require_once 'includes/functions.php';

// Handle different HTTP methods
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        handleReactionsPost();
        break;
    case 'DELETE':
        handleReactionsDelete();
        break;
    default:
        sendError('Method not allowed', 405);
}

function handleReactionsPost() {
    $user = requireAuth();
    global $db;

    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || empty($input['prayer_id']) || empty($input['emoji'])) {
        sendError('Prayer ID and emoji are required');
    }

    $prayerId = $input['prayer_id'];
    $emoji = $input['emoji'];
    $commentText = sanitizeInput($input['text'] ?? '');

    // Validate emoji is in allowed list
    $allowedEmojis = ['🙏', '❤️', '🕊️', '✝️', '🎉', '🌟', '💪', '🤗', '❓', '💬'];
    if (!in_array($emoji, $allowedEmojis)) {
        sendError('Invalid emoji');
    }

    // Check if prayer exists
    $stmt = $db->prepare("SELECT id FROM kfmn.prayers WHERE id = ?");
    $stmt->execute([$prayerId]);
    if (!$stmt->fetch()) {
        sendError('Prayer not found', 404);
    }

    $db->beginTransaction();

    try {
        // Check if reaction already exists for this prayer and emoji
        $stmt = $db->prepare("SELECT id FROM kfmn.reactions WHERE prayer_id = ? AND emoji = ?");
        $stmt->execute([$prayerId, $emoji]);
        $reaction = $stmt->fetch();

        if ($reaction) {
            $reactionId = $reaction['id'];

            // Check if user already reacted with this emoji
            $stmt = $db->prepare("SELECT id FROM kfmn.reaction_users WHERE reaction_id = ? AND user_id = ?");
            $stmt->execute([$reactionId, $user['id']]);
            $existingReaction = $stmt->fetch();

            if ($existingReaction) {
                // User is removing their reaction
                if ($commentText) {
                    // Can't remove reaction if adding a comment
                    sendError('You have already reacted with this emoji');
                }

                $stmt = $db->prepare("DELETE FROM kfmn.reaction_users WHERE reaction_id = ? AND user_id = ?");
                $stmt->execute([$reactionId, $user['id']]);

                // Check if reaction has any users left
                $stmt = $db->prepare("SELECT COUNT(*) FROM kfmn.reaction_users WHERE reaction_id = ?");
                $stmt->execute([$reactionId]);
                $count = $stmt->fetchColumn();

                if ($count == 0) {
                    // Remove reaction if no users left
                    $stmt = $db->prepare("DELETE FROM kfmn.reactions WHERE id = ?");
                    $stmt->execute([$reactionId]);
                }
            } else {
                // User is adding a new reaction
                $stmt = $db->prepare("INSERT INTO kfmn.reaction_users (reaction_id, user_id) VALUES (?, ?)");
                $stmt->execute([$reactionId, $user['id']]);
            }
        } else {
            // Create new reaction
            $stmt = $db->prepare("INSERT INTO kfmn.reactions (prayer_id, emoji) VALUES (?, ?) RETURNING id");
            $stmt->execute([$prayerId, $emoji]);
            $reactionId = $stmt->fetch()['id'];

            // Add user reaction
            $stmt = $db->prepare("INSERT INTO kfmn.reaction_users (reaction_id, user_id) VALUES (?, ?)");
            $stmt->execute([$reactionId, $user['id']]);
        }

        // Add comment if provided
        if ($commentText) {
            $stmt = $db->prepare("INSERT INTO kfmn.reaction_comments (reaction_id, user_id, comment_text) VALUES (?, ?, ?)");
            $stmt->execute([$reactionId, $user['id'], $commentText]);
        }

        $db->commit();

        // Get updated reaction data
        $reactionData = getReactionData($prayerId, $user['id']);

        sendJsonResponse([
            'success' => true,
            'reactions' => $reactionData,
            'message' => $commentText ? 'Comment added' : 'Reaction updated'
        ]);

    } catch (Exception $e) {
        $db->rollBack();
        error_log("Reaction error: " . $e->getMessage());
        sendError('Failed to process reaction', 500);
    }
}

function handleReactionsDelete() {
    $user = requireAuth();
    global $db;

    // Get prayer_id and emoji from query parameters
    $prayerId = $_GET['prayer_id'] ?? '';
    $emoji = $_GET['emoji'] ?? '';
    $commentIndex = (int)($_GET['comment_index'] ?? -1);

    if (!$prayerId || !$emoji) {
        sendError('Prayer ID and emoji are required');
    }

    // Get reaction ID
    $stmt = $db->prepare("SELECT id FROM kfmn.reactions WHERE prayer_id = ? AND emoji = ?");
    $stmt->execute([$prayerId, $emoji]);
    $reaction = $stmt->fetch();

    if (!$reaction) {
        sendError('Reaction not found', 404);
    }

    $reactionId = $reaction['id'];

    if ($commentIndex >= 0) {
        // Delete specific comment
        // Get comment by index (order by creation time)
        $stmt = $db->prepare("
            SELECT id FROM kfmn.reaction_comments
            WHERE reaction_id = ?
            ORDER BY created_at ASC
            LIMIT 1 OFFSET ?
        ");
        $stmt->execute([$reactionId, $commentIndex]);
        $comment = $stmt->fetch();

        if (!$comment) {
            sendError('Comment not found', 404);
        }

        // Check if user can delete this comment (creator or prayer creator)
        $stmt = $db->prepare("
            SELECT rc.user_id, p.user_id as prayer_user_id
            FROM kfmn.reaction_comments rc
            JOIN kfmn.reactions r ON rc.reaction_id = r.id
            JOIN kfmn.prayers p ON r.prayer_id = p.id
            WHERE rc.id = ?
        ");
        $stmt->execute([$comment['id']]);
        $owners = $stmt->fetch();

        if ($owners['user_id'] !== $user['id'] && $owners['prayer_user_id'] !== $user['id']) {
            sendError('Not authorized to delete this comment', 403);
        }

        $stmt = $db->prepare("DELETE FROM kfmn.reaction_comments WHERE id = ?");
        $stmt->execute([$comment['id']]);
    } else {
        // Remove user's reaction
        $stmt = $db->prepare("DELETE FROM kfmn.reaction_users WHERE reaction_id = ? AND user_id = ?");
        $stmt->execute([$reactionId, $user['id']]);

        // Check if reaction has any users left
        $stmt = $db->prepare("SELECT COUNT(*) FROM kfmn.reaction_users WHERE reaction_id = ?");
        $stmt->execute([$reactionId]);
        $count = $stmt->fetchColumn();

        if ($count == 0) {
            // Remove reaction if no users left
            $stmt = $db->prepare("DELETE FROM kfmn.reactions WHERE id = ?");
            $stmt->execute([$reactionId]);
        }
    }

    // Get updated reaction data
    $reactionData = getReactionData($prayerId, $user['id']);

    sendJsonResponse([
        'success' => true,
        'reactions' => $reactionData,
        'message' => 'Reaction removed'
    ]);
}

function getReactionData($prayerId, $userId) {
    global $db;

    $stmt = $db->prepare("
        SELECT
            r.emoji,
            COUNT(DISTINCT ru.id) as count,
            COUNT(DISTINCT rc.id) as comment_count,
            BOOL_OR(ru.user_id = ?) as user_reacted
        FROM kfmn.reactions r
        LEFT JOIN kfmn.reaction_users ru ON r.id = ru.reaction_id
        LEFT JOIN kfmn.reaction_comments rc ON r.id = rc.reaction_id
        WHERE r.prayer_id = ?
        GROUP BY r.emoji, r.id
        ORDER BY r.emoji
    ");
    $stmt->execute([$userId, $prayerId]);

    $reactions = [];
    while ($row = $stmt->fetch()) {
        $reactions[] = [
            'emoji' => $row['emoji'],
            'count' => (int)$row['count'],
            'comments' => getReactionComments($prayerId, $row['emoji']),
            'userReactions' => getUserReactions($prayerId, $row['emoji'])
        ];
    }

    return $reactions;
}

function getReactionComments($prayerId, $emoji) {
    global $db;

    $stmt = $db->prepare("
        SELECT
            rc.comment_text as text,
            u.username as creatorUsername,
            u.display_name as name,
            u.user_color as color
        FROM kfmn.reaction_comments rc
        JOIN kfmn.reactions r ON rc.reaction_id = r.id
        JOIN kfmn.users u ON rc.user_id = u.id
        WHERE r.prayer_id = ? AND r.emoji = ?
        ORDER BY rc.created_at ASC
    ");
    $stmt->execute([$prayerId, $emoji]);

    return array_map(function($comment) use ($emoji) {
        return array_merge($comment, ['emoji' => $emoji]);
    }, $stmt->fetchAll());
}

function getUserReactions($prayerId, $emoji) {
    global $db;

    $stmt = $db->prepare("
        SELECT u.username
        FROM kfmn.reaction_users ru
        JOIN kfmn.reactions r ON ru.reaction_id = r.id
        JOIN kfmn.users u ON ru.user_id = u.id
        WHERE r.prayer_id = ? AND r.emoji = ?
    ");
    $stmt->execute([$prayerId, $emoji]);

    return array_column($stmt->fetchAll(), 'username');
}
?>