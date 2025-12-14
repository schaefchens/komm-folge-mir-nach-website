<?php
// Simple database connection test
require_once 'config/database.php';

header('Content-Type: text/plain');

try {
    $db = Database::getInstance()->getConnection();
    echo "Database connection: SUCCESS\n";

    // Test a simple query
    $stmt = $db->query("SELECT 1 as test");
    $result = $stmt->fetch();
    echo "Simple query: SUCCESS (" . $result['test'] . ")\n";

    // Test schema exists
    $stmt = $db->query("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'kfmn'");
    if ($stmt->fetch()) {
        echo "Schema 'kfmn': EXISTS\n";
    } else {
        echo "Schema 'kfmn': NOT FOUND\n";
    }

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
}
?>