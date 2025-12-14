<?php
// Database configuration and connection
class Database {
    private static $instance = null;
    private $pdo;

    private function __construct() {
        // Load configuration
        $config = [];
        if (file_exists(__DIR__ . '/config.php')) {
            $config = include __DIR__ . '/config.php';
        }

        // Database configuration - edit config.php or update these values
        $host = $config['database']['host'] ?? 'k3p9.your-database.de';
        $port = $config['database']['port'] ?? '5432';
        $dbname = $config['database']['name'] ?? 'kfmndb';
        $user = $config['database']['user'] ?? 'kfmnmaestro';
        $password = $config['database']['password'] ?? 'DB_PASSWORD_PURGED';

        $dsn = "pgsql:host=$host;port=$port;dbname=$dbname";

        try {
            $this->pdo = new PDO($dsn, $user, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);

            // Set search path to include kfmn schema
            $this->pdo->exec("SET search_path TO kfmn, public");
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new Exception("Database connection failed");
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->pdo;
    }

    // Utility method to get a user by session token
    public function getUserBySession($sessionToken) {
        $stmt = $this->pdo->prepare("
            SELECT u.* FROM kfmn.users u
            JOIN kfmn.user_sessions s ON u.id = s.user_id
            WHERE s.session_token = ? AND s.expires_at > NOW()
        ");
        $stmt->execute([$sessionToken]);
        return $stmt->fetch();
    }

    // Clean up expired sessions
    public function cleanupSessions() {
        $stmt = $this->pdo->prepare("SELECT kfmn.cleanup_expired_sessions()");
        $stmt->execute();
        return $stmt->fetchColumn();
    }
}

// Initialize database connection
$db = Database::getInstance()->getConnection();
?>