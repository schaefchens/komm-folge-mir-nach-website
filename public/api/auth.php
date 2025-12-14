<?php
require_once 'config/database.php';
require_once 'includes/functions.php';

// Handle different HTTP methods
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'POST':
        handleAuthPost();
        break;
    case 'DELETE':
        handleAuthDelete();
        break;
    default:
        sendError('Method not allowed', 405);
}

function handleAuthPost() {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input || !isset($input['action'])) {
        sendError('Invalid request data');
    }

    switch ($input['action']) {
        case 'register':
            handleRegister($input);
            break;
        case 'login':
            handleLogin($input);
            break;
        case 'verify':
            handleVerify($input);
            break;
        default:
            sendError('Unknown action');
    }
}

function handleRegister($data) {
    global $db;


    // Validate required fields
    if (empty($data['username']) || empty($data['password'])) {
        sendError('Username and password are required');
    }

    $username = sanitizeInput($data['username']);
    $password = $data['password'];
    $name = sanitizeInput($data['name'] ?? '');
    $email = sanitizeInput($data['email'] ?? '');
    $phone = sanitizeInput($data['phone'] ?? '');
    $color = $data['color'] ?? '#3b82f6';
    $avatar = $data['avatar'] ?? '🙏';
    // Ensure notifications is a proper boolean
    $notifications = isset($data['notifications']) ? (bool)$data['notifications'] : false;


    // Validate inputs
    if (!validateUsername($username)) {
        sendError('Invalid username. Must be 3-50 characters, alphanumeric and underscores only');
    }

    if (!validatePassword($password)) {
        sendError('Password must be at least 6 characters long');
    }

    if ($email && !validateEmail($email)) {
        sendError('Invalid email address');
    }

    if ($phone && !validatePhone($phone)) {
        sendError('Invalid phone number');
    }

    try {
        // Check if username already exists
        $stmt = $db->prepare("SELECT id FROM kfmn.users WHERE username = ?");
        $stmt->execute([$username]);
        if ($stmt->fetch()) {
            sendError('Username already exists');
        }

        // Check if email already exists (if provided)
        if ($email) {
            $stmt = $db->prepare("SELECT id FROM kfmn.users WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                sendError('Email already exists');
            }
        }

        // Check if phone already exists (if provided)
        if ($phone) {
            $stmt = $db->prepare("SELECT id FROM kfmn.users WHERE phone = ?");
            $stmt->execute([$phone]);
            if ($stmt->fetch()) {
                sendError('Phone number already exists');
            }
        }
    } catch (Exception $e) {
        sendError('Database error during validation: ' . $e->getMessage());
    }

    // Hash password
    $passwordHash = hashPassword($password);

    // Generate verification token if phone provided
    $verificationToken = null;
    $verificationExpires = null;
    $isVerified = false;

    if ($phone) {
        $verificationToken = generateVerificationToken();
        $verificationExpires = date('Y-m-d H:i:s', strtotime('+24 hours'));
        // In real implementation, send SMS here
    } else {
        $isVerified = true; // No phone = auto-verified
    }

    try {
        // Create user
        $stmt = $db->prepare("
            INSERT INTO kfmn.users (
                username, display_name, email, phone, password_hash,
                user_color, user_avatar, notifications_enabled, is_verified,
                verification_token, verification_expires_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $displayName = $name ?: $username;
        $emailParam = $email ?: null;
        $phoneParam = $phone ?: null;

        $stmt->bindParam(1, $username, PDO::PARAM_STR);
        $stmt->bindParam(2, $displayName, PDO::PARAM_STR);
        $stmt->bindParam(3, $emailParam, PDO::PARAM_STR);
        $stmt->bindParam(4, $phoneParam, PDO::PARAM_STR);
        $stmt->bindParam(5, $passwordHash, PDO::PARAM_STR);
        $stmt->bindParam(6, $color, PDO::PARAM_STR);
        $stmt->bindParam(7, $avatar, PDO::PARAM_STR);
        $stmt->bindParam(8, $notifications, PDO::PARAM_BOOL);
        $stmt->bindParam(9, $isVerified, PDO::PARAM_BOOL);
        $stmt->bindParam(10, $verificationToken, PDO::PARAM_STR);
        $stmt->bindParam(11, $verificationExpires, PDO::PARAM_STR);

        $stmt->execute();

        // Get the created user
        $stmt = $db->prepare("SELECT id, username, display_name, user_color, user_avatar, is_verified FROM kfmn.users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch();

        if (!$user) {
            sendError('User created but could not retrieve data');
        }

    } catch (Exception $e) {
        sendError('Database error during user creation: ' . $e->getMessage());
    }

    try {
        // Create session
        $sessionToken = generateSessionToken();
        $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));

        $stmt = $db->prepare("
            INSERT INTO kfmn.user_sessions (user_id, session_token, expires_at, user_agent, ip_address)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $user['id'],
            $sessionToken,
            $expiresAt,
            $_SERVER['HTTP_USER_AGENT'] ?? null,
            $_SERVER['REMOTE_ADDR'] ?? null
        ]);

    } catch (Exception $e) {
        sendError('Database error during session creation: ' . $e->getMessage());
    }

    // Send verification SMS if phone provided
    if ($phone && $verificationToken) {
        // In real implementation:
        // sendSMS($phone, "Your verification link: https://yourdomain.com/verify/$verificationToken");
    }

    sendJsonResponse([
        'success' => true,
        'user' => $user,
        'session_token' => $sessionToken,
        'requires_verification' => !$isVerified,
        'message' => $isVerified ? 'Registration successful' : 'Registration successful. Please verify your phone number.'
    ]);
}

function handleLogin($data) {
    global $db;

    if (empty($data['username']) || empty($data['password'])) {
        sendError('Username and password are required');
    }

    $username = sanitizeInput($data['username']);
    $password = $data['password'];

    // Get user
    $stmt = $db->prepare("SELECT * FROM kfmn.users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user || !verifyPassword($password, $user['password_hash'])) {
        sendError('Invalid username or password', 401);
    }

    // Create session
    $sessionToken = generateSessionToken();
    $expiresAt = date('Y-m-d H:i:s', strtotime('+30 days'));

    $stmt = $db->prepare("
        INSERT INTO kfmn.user_sessions (user_id, session_token, expires_at, user_agent, ip_address)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $user['id'],
        $sessionToken,
        $expiresAt,
        $_SERVER['HTTP_USER_AGENT'] ?? null,
        $_SERVER['REMOTE_ADDR'] ?? null
    ]);

    // Clean up old sessions
    Database::getInstance()->cleanupSessions();

    sendJsonResponse([
        'success' => true,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'display_name' => $user['display_name'],
            'color' => $user['user_color'],
            'avatar' => $user['user_avatar'],
            'verified' => $user['is_verified'],
            'notifications' => $user['notifications_enabled']
        ],
        'session_token' => $sessionToken,
        'message' => 'Login successful'
    ]);
}

function handleVerify($data) {
    global $db;

    $user = requireAuth();

    if ($user['is_verified']) {
        sendError('User is already verified');
    }

    if (empty($data['token'])) {
        sendError('Verification token is required');
    }

    $token = sanitizeInput($data['token']);

    if ($user['verification_token'] !== $token) {
        sendError('Invalid verification token');
    }

    if (strtotime($user['verification_expires_at']) < time()) {
        sendError('Verification token has expired');
    }

    // Verify user
    $stmt = $db->prepare("
        UPDATE kfmn.users
        SET is_verified = true, verification_token = null, verification_expires_at = null
        WHERE id = ?
    ");
    $stmt->execute([$user['id']]);

    sendJsonResponse([
        'success' => true,
        'message' => 'Phone number verified successfully'
    ]);
}

function handleAuthDelete() {
    $user = requireAuth();

    global $db;

    // Delete all sessions for this user (logout from all devices)
    $stmt = $db->prepare("DELETE FROM kfmn.user_sessions WHERE user_id = ?");
    $stmt->execute([$user['id']]);

    sendJsonResponse([
        'success' => true,
        'message' => 'Logged out successfully'
    ]);
}
?>