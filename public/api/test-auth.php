<?php
// Test auth functionality step by step
require_once 'config/database.php';
require_once 'includes/functions.php';

header('Content-Type: text/plain');
echo "=== Auth Test ===\n\n";

try {
    echo "1. Testing database connection...\n";
    $db = Database::getInstance()->getConnection();
    echo "   ✓ Database connection successful\n";

    echo "2. Testing JSON input...\n";
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        echo "   ✗ No JSON input received\n";
        echo "   Raw input: " . file_get_contents('php://input') . "\n";
        exit;
    }
    echo "   ✓ JSON decoded successfully\n";
    echo "   Action: " . ($input['action'] ?? 'none') . "\n";

    if ($input['action'] === 'register') {
        echo "3. Testing registration validation...\n";

        if (empty($input['username']) || empty($input['password'])) {
            echo "   ✗ Missing username or password\n";
            exit;
        }

        $username = sanitizeInput($input['username']);
        echo "   ✓ Username sanitized: $username\n";

        $password = $input['password'];
        echo "   ✓ Password received (length: " . strlen($password) . ")\n";

        // Test password hashing
        echo "4. Testing password hashing...\n";
        $hash = hashPassword($password);
        echo "   ✓ Password hashed successfully\n";

        // Test boolean conversion
        echo "5. Testing boolean conversion...\n";
        $notifications = isset($input['notifications']) ? (bool)$input['notifications'] : false;
        echo "   ✓ Notifications converted to boolean: " . var_export($notifications, true) . "\n";

        echo "6. Testing database query preparation...\n";
        $stmt = $db->prepare("
            INSERT INTO kfmn.users (
                username, display_name, email, phone, password_hash,
                user_color, user_avatar, notifications_enabled, is_verified,
                verification_token, verification_expires_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        echo "   ✓ Query prepared successfully\n";

        echo "7. Testing parameter binding...\n";
        $stmt->bindParam(1, $username, PDO::PARAM_STR);
        $stmt->bindParam(2, $username, PDO::PARAM_STR); // display_name defaults to username
        $stmt->bindParam(3, $null = null, PDO::PARAM_STR); // email
        $stmt->bindParam(4, $null = null, PDO::PARAM_STR); // phone
        $stmt->bindParam(5, $hash, PDO::PARAM_STR);
        $stmt->bindParam(6, $color = '#3b82f6', PDO::PARAM_STR);
        $stmt->bindParam(7, $avatar = '🙏', PDO::PARAM_STR);
        $notifications = isset($input['notifications']) ? (bool)$input['notifications'] : false;

        // Create proper variables for bindParam
        $displayName = $username;
        $emailParam = null;
        $phoneParam = null;
        $colorParam = '#3b82f6';
        $avatarParam = '🙏';
        $verifiedParam = false;
        $tokenParam = null;
        $expiresParam = null;

        $stmt->bindParam(1, $username, PDO::PARAM_STR);
        $stmt->bindParam(2, $displayName, PDO::PARAM_STR);
        $stmt->bindParam(3, $emailParam, PDO::PARAM_STR);
        $stmt->bindParam(4, $phoneParam, PDO::PARAM_STR);
        $stmt->bindParam(5, $hash, PDO::PARAM_STR);
        $stmt->bindParam(6, $colorParam, PDO::PARAM_STR);
        $stmt->bindParam(7, $avatarParam, PDO::PARAM_STR);
        $stmt->bindParam(8, $notifications, PDO::PARAM_BOOL);
        $stmt->bindParam(9, $verifiedParam, PDO::PARAM_BOOL);
        $stmt->bindParam(10, $tokenParam, PDO::PARAM_STR);
        $stmt->bindParam(11, $expiresParam, PDO::PARAM_STR);
        echo "   ✓ Parameters bound successfully\n";

        echo "8. Testing query execution...\n";
        // Don't actually execute to avoid creating test users
        echo "   ✓ Query execution prepared (skipped for testing)\n";

        echo "\n=== All tests passed! ===\n";
        echo "The issue might be in the actual execution or a different part of the code.\n";
    }

} catch (Exception $e) {
    echo "\n=== ERROR ===\n";
    echo "Message: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
?>