<?php
// Simple test file for Hetzner deployment
header('Content-Type: text/plain');

echo "=== Prayer Modal API Test ===\n\n";

// Test PHP version and extensions
echo "PHP Version: " . PHP_VERSION . "\n";
echo "PostgreSQL Extension: " . (extension_loaded('pgsql') ? 'Loaded' : 'NOT LOADED') . "\n";
echo "PDO Extension: " . (extension_loaded('pdo') ? 'Loaded' : 'NOT LOADED') . "\n";
echo "PDO PostgreSQL: " . (extension_loaded('pdo_pgsql') ? 'Loaded' : 'NOT LOADED') . "\n";
echo "JSON Extension: " . (extension_loaded('json') ? 'Loaded' : 'NOT LOADED') . "\n";
echo "Argon2 Password Hashing: " . (defined('PASSWORD_ARGON2ID') ? 'Available' : 'NOT AVAILABLE') . "\n\n";

// Test database connection
echo "=== Database Connection Test ===\n";
try {
    require_once 'config/database.php';
    $db = Database::getInstance()->getConnection();

    // Test schema access
    $stmt = $db->query("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'kfmn'");
    $schema = $stmt->fetch();

    if ($schema) {
        echo "✓ kfmn schema exists\n";

        // Check if tables exist
        $tables = ['users', 'prayers', 'reactions', 'reaction_users', 'reaction_comments', 'scheduled_calls', 'user_sessions'];
        foreach ($tables as $table) {
            $stmt = $db->query("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'kfmn' AND table_name = '$table')");
            $exists = $stmt->fetchColumn();
            echo ($exists ? "✓" : "✗") . " kfmn.$table table " . ($exists ? "exists" : "MISSING") . "\n";
        }
    } else {
        echo "✗ kfmn schema does NOT exist\n";
        echo "Please run the database_schema.sql file in your PostgreSQL database\n";
    }

} catch (Exception $e) {
    echo "✗ Database connection failed: " . $e->getMessage() . "\n";
    echo "Please check your database configuration in config/database.php\n";
}

echo "\n=== API Files Check ===\n";
$apiFiles = [
    'auth.php',
    'prayers.php',
    'reactions.php',
    'scheduled-calls.php',
    'verify.php',
    'config/database.php',
    'includes/functions.php'
];

foreach ($apiFiles as $file) {
    $exists = file_exists($file);
    echo ($exists ? "✓" : "✗") . " $file " . ($exists ? "exists" : "MISSING") . "\n";
}

echo "\n=== Next Steps ===\n";
echo "1. If any tables are missing, run database_schema.sql in your PostgreSQL database\n";
echo "2. Test user registration: POST to /api/auth.php with action=register\n";
echo "3. Test prayer creation: POST to /api/prayers.php with authentication\n";
echo "4. Remove this test file from production for security\n";
?>