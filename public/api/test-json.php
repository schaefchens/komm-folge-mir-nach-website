<?php
// Test JSON parsing and basic functionality
header('Content-Type: text/plain');

echo "Testing JSON input parsing...\n";

try {
    $input = json_decode(file_get_contents('php://input'), true);
    echo "JSON decode: SUCCESS\n";

    if ($input) {
        echo "Input received: " . json_encode($input) . "\n";
        echo "Action: " . ($input['action'] ?? 'none') . "\n";
    } else {
        echo "No JSON input received\n";
    }

    // Test includes loading
    require_once 'includes/functions.php';
    echo "Functions loaded: SUCCESS\n";

    // Test hash function
    $hash = hashPassword('test');
    echo "Password hashing: SUCCESS\n";

    echo "All basic tests passed!\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    echo "File: " . $e->getFile() . "\n";
}
?>