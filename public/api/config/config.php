<?php
// Database configuration file
// Edit these values to match your database settings

$config = [
    'database' => [
        'host' => 'k3p9.your-database.de',
        'port' => '5432',
        'name' => 'kfmndb',
        'user' => 'kfmnmaestro',
        'password' => 'DB_PASSWORD_PURGED',
        'schema' => 'kfmn'
    ]
];

// You can also override these values using environment variables:
// DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD

return $config;
?>