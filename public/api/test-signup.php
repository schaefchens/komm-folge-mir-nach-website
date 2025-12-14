<?php
// Test signup script for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'config/database.php';
require_once 'includes/functions.php';

header('Content-Type: text/plain');
echo "=== Signup Test ===\n\n";

// Test data
$testData = [
    'action' => 'register',
    'username' => 'testuser_' . time(),
    'password' => 'testpass123',
    'name' => 'Test User',
    'email' => 'test@example.com',
    'phone' => '',
    'color' => '#3b82f6',
    'avatar' => '🙏',
    'notifications' => true // Test with boolean true
];

echo "Test data: " . json_encode($testData) . "\n\n";

// Try to call handleRegister directly
try {
    handleRegister($testData);
    echo "Signup completed successfully!\n";
} catch (Exception $e) {
    echo "Signup failed with exception: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
?>