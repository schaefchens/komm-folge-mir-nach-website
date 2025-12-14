<?php
// Utility functions for API responses and authentication

function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    echo json_encode($data);
    exit;
}

function sendError($message, $statusCode = 400, $details = null) {
    $response = ['error' => $message];
    if ($details) {
        $response['details'] = $details;
    }
    sendJsonResponse($response, $statusCode);
}

function getBearerToken() {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        $auth = $headers['Authorization'];
        if (preg_match('/Bearer\s+(.*)$/i', $auth, $matches)) {
            return $matches[1];
        }
    }
    return null;
}

function requireAuth() {
    $token = getBearerToken();
    if (!$token) {
        sendError('Authentication required', 401);
    }

    global $db;
    $user = Database::getInstance()->getUserBySession($token);
    if (!$user) {
        sendError('Invalid or expired session', 401);
    }

    return $user;
}

function validateUsername($username) {
    if (empty($username) || strlen($username) < 3 || strlen($username) > 50) {
        return false;
    }
    return preg_match('/^[a-zA-Z0-9_]+$/', $username);
}

function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

function validatePhone($phone) {
    // German phone number validation (basic)
    return preg_match('/^(\+49|0)[1-9][0-9]{1,14}$/', $phone);
}

function validatePassword($password) {
    return strlen($password) >= 6;
}

function hashPassword($password) {
    // Try Argon2ID first, fallback to bcrypt if not available
    if (defined('PASSWORD_ARGON2ID')) {
        return password_hash($password, PASSWORD_ARGON2ID);
    } else {
        return password_hash($password, PASSWORD_DEFAULT);
    }
}

function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

function generateSessionToken() {
    return bin2hex(random_bytes(32));
}

function generateVerificationToken() {
    return bin2hex(random_bytes(16));
}

function sanitizeInput($input) {
    if (is_array($input)) {
        return array_map('sanitizeInput', $input);
    }
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

function formatTimeAgo($timestamp) {
    $now = new DateTime();
    $date = new DateTime($timestamp);
    $diff = $now->diff($date);

    if ($diff->d > 0) {
        return 'vor ' . $diff->d . ' Tag' . ($diff->d > 1 ? 'en' : '');
    } elseif ($diff->h > 0) {
        return 'vor ' . $diff->h . ' Stunde' . ($diff->h > 1 ? 'n' : '');
    } elseif ($diff->i > 0) {
        return 'vor ' . $diff->i . ' Minuten';
    } else {
        return 'gerade eben';
    }
}

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    exit(0);
}
?>