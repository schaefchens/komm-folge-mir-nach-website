<?php
require_once 'config/database.php';
require_once 'includes/functions.php';

// Simple SMS verification stub (in real implementation, integrate with SMS service)
function sendSMSVerification($phone, $token) {
    // In production, integrate with services like:
    // - Twilio: https://www.twilio.com/docs/sms
    // - AWS SNS: https://aws.amazon.com/sns/
    // - MessageBird: https://developers.messagebird.com/

    $message = "Your verification code for Come Follow Me: $token\n\nVerify at: https://yourdomain.com/verify/$token";

    // For demo purposes, just log it
    error_log("SMS to $phone: $message");

    // In real implementation:
    // return sendSMSToProvider($phone, $message);
    return true;
}

// Handle verification requests
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

if ($method === 'POST' && isset($input['action'])) {
    switch ($input['action']) {
        case 'send_verification':
            handleSendVerification($input);
            break;
        case 'verify_code':
            handleVerifyCode($input);
            break;
        default:
            sendError('Unknown action');
    }
} else {
    sendError('Invalid request', 400);
}

function handleSendVerification($data) {
    global $db;

    $user = requireAuth();

    if ($user['is_verified']) {
        sendError('User is already verified');
    }

    if (!$user['phone']) {
        sendError('No phone number on file');
    }

    // Generate new verification token
    $token = generateVerificationToken();
    $expiresAt = date('Y-m-d H:i:s', strtotime('+24 hours'));

    // Update user with new token
    $stmt = $db->prepare("
        UPDATE kfmn.users
        SET verification_token = ?, verification_expires_at = ?
        WHERE id = ?
    ");
    $stmt->execute([$token, $expiresAt, $user['id']]);

    // Send SMS (stub implementation)
    if (sendSMSVerification($user['phone'], $token)) {
        sendJsonResponse([
            'success' => true,
            'message' => 'Verification SMS sent'
        ]);
    } else {
        sendError('Failed to send verification SMS', 500);
    }
}

function handleVerifyCode($data) {
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
?>