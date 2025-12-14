<?php
// Debug script to check database connection and queries
require_once 'config/database.php';
require_once 'includes/functions.php';

header('Content-Type: text/plain');
echo "=== Database Debug ===\n\n";

// Show configuration
$config = [];
if (file_exists('config/config.php')) {
    $config = include 'config/config.php';
    echo "Using config.php: YES\n";
    echo "Database: {$config['database']['name']}\n";
    echo "Schema: {$config['database']['schema']}\n";
} else {
    echo "Using config.php: NO (using hardcoded values)\n";
}
echo "\n";

try {
    $db = Database::getInstance()->getConnection();
    echo "✓ Database connection successful\n";

    // Test search path
    $result = $db->query("SHOW search_path");
    $searchPath = $result->fetchColumn();
    echo "Search path: $searchPath\n";

    // Test schema exists
    $stmt = $db->query("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'kfmn'");
    $schema = $stmt->fetch();
    if ($schema) {
        echo "✓ kfmn schema exists\n";
    } else {
        echo "✗ kfmn schema NOT found\n";
    }

    // Test tables exist
    $tables = ['users', 'prayers', 'reactions', 'reaction_users', 'reaction_comments', 'scheduled_calls', 'user_sessions'];
    foreach ($tables as $table) {
        try {
            $stmt = $db->query("SELECT 1 FROM kfmn.$table LIMIT 1");
            echo "✓ kfmn.$table accessible\n";
        } catch (Exception $e) {
            echo "✗ kfmn.$table error: " . $e->getMessage() . "\n";
        }
    }

    // Test scheduled calls query
    echo "\n=== Testing Scheduled Calls Query ===\n";
    try {
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
        if ($call) {
            echo "✓ Scheduled calls query successful\n";
            print_r($call);
        } else {
            echo "✓ Scheduled calls query successful (no results)\n";
        }
    } catch (Exception $e) {
        echo "✗ Scheduled calls query failed: " . $e->getMessage() . "\n";
    }

    // Test user insert query (without actually inserting)
    echo "\n=== Testing User Insert Query Structure ===\n";
    try {
        $stmt = $db->prepare("
            INSERT INTO kfmn.users (
                username, display_name, email, phone, password_hash,
                user_color, user_avatar, notifications_enabled, is_verified,
                verification_token, verification_expires_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        echo "✓ User insert query prepared successfully\n";
    } catch (Exception $e) {
        echo "✗ User insert query failed: " . $e->getMessage() . "\n";
    }

} catch (Exception $e) {
    echo "✗ Database error: " . $e->getMessage() . "\n";
}

echo "\n=== PHP Environment ===\n";
echo "PHP Version: " . phpversion() . "\n";
echo "PostgreSQL Extension: " . (extension_loaded('pgsql') ? 'Loaded' : 'NOT LOADED') . "\n";
echo "PDO Extension: " . (extension_loaded('pdo') ? 'Loaded' : 'NOT LOADED') . "\n";
echo "PDO PostgreSQL: " . (extension_loaded('pdo_pgsql') ? 'Loaded' : 'NOT LOADED') . "\n";
?>