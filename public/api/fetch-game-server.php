<?php
declare(strict_types=1);

header('Content-Type: application/json');
//header('Access-Control-Allow-Origin: https://komm-folge-mir-nach.de');
$allowedOrigins = [
    'https://komm-folge-mir-nach.de',
    'https://game.komm-folge-mir-nach.de',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}

header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');


if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

/*
  SECURITY:
  Rotate the Hetzner token you posted earlier.
  Put the new token outside web root if possible, or use getenv('HCLOUD_TOKEN').
*/

$token = getenv('HCLOUD_TOKEN') ?: 'HCLOUD_API_TOKEN_PURGED';

$config = [
    'server_name' => 'spirit-game-server',
    'server_type' => 'cpx12',
    'location' => 'fsn1',
    'image' => 406645289,
    'ssh_key' => 'abraham@der-weg-des-herrn.de',
    'firewall' => 'firewall-spirit-game-server',

    'primary_ipv4_name' => 'primary_ip-139525751-spirit-game-server',
    'primary_ipv6_name' => 'primary_ip-139525752-spirit-game-server',

    'game_url' => 'https://game.komm-folge-mir-nach.de/game/',
    'websocket_url' => 'wss://game.komm-folge-mir-nach.de/ws',

    /*
      Idle destroy settings.
      The server is deleted only if no heartbeat happened for this many seconds.
      3600 = 1 hour.
    */
    'idle_destroy_after_seconds' => 3600,

    /*
      Secret for GET actions.
      Use a long random value.
      Example:
      openssl rand -hex 32
    */
    'admin_key' => 's3cr3t',
];

$heartbeatFile = __DIR__ . '/spirit-game-last-activity.txt';
$lockFile = __DIR__ . '/spirit-game-server.lock';

function jsonResponse(array $data, int $httpCode = 200): void {
    http_response_code($httpCode);
    echo json_encode($data, JSON_UNESCAPED_SLASHES);
    exit;
}

function heartbeatPayload(): array {
    global $heartbeatFile;

    $lastActivity = file_exists($heartbeatFile)
        ? (int) file_get_contents($heartbeatFile)
        : null;

    return [
        'lastActivity' => $lastActivity,
        'lastActivityIso' => $lastActivity ? date(DATE_ATOM, $lastActivity) : null,
        'ageSeconds' => $lastActivity ? time() - $lastActivity : null,
    ];
}

function writeHeartbeat(): void {
    global $heartbeatFile;

    file_put_contents($heartbeatFile, (string) time(), LOCK_EX);
}

function hcloud(string $method, string $path, ?array $body = null): array {
    global $token;

    if (!$token || $token === '' || str_starts_with($token, 'PUT_')) {
        throw new RuntimeException('Hetzner API token is not configured');
    }

    $ch = curl_init('https://api.hetzner.cloud/v1' . $path);

    $headers = [
        'Authorization: Bearer ' . $token,
        'Content-Type: application/json',
    ];

    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_TIMEOUT => 30,
    ]);

    if ($body !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
    }

    $raw = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if ($raw === false) {
        $error = curl_error($ch);
        curl_close($ch);
        throw new RuntimeException($error);
    }

    curl_close($ch);

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        $data = ['raw' => $raw];
    }

    return [$httpCode, $data];
}

function hcloudGetAll(string $path, string $key): array {
    [$code, $data] = hcloud('GET', $path);

    if ($code < 200 || $code >= 300) {
        throw new RuntimeException("Hetzner API GET $path failed with HTTP $code");
    }

    return $data[$key] ?? [];
}

function findByName(array $items, string $name): ?array {
    foreach ($items as $item) {
        if (($item['name'] ?? null) === $name) {
            return $item;
        }
    }

    return null;
}

function getServer(): ?array {
    global $config;

    [$serverCode, $serverData] = hcloud(
        'GET',
        '/servers?name=' . urlencode($config['server_name'])
    );

    if ($serverCode < 200 || $serverCode >= 300) {
        throw new RuntimeException('Could not check server status');
    }

    return $serverData['servers'][0] ?? null;
}

function createServer(): array {
    global $config;

    $firewalls = hcloudGetAll('/firewalls', 'firewalls');
    $firewall = findByName($firewalls, $config['firewall']);

    if (!$firewall) {
        throw new RuntimeException('Firewall not found: ' . $config['firewall']);
    }

    $primaryIps = hcloudGetAll('/primary_ips', 'primary_ips');

    $primaryIpv4 = findByName($primaryIps, $config['primary_ipv4_name']);
    $primaryIpv6 = findByName($primaryIps, $config['primary_ipv6_name']);

    if (!$primaryIpv4) {
        throw new RuntimeException('Primary IPv4 not found: ' . $config['primary_ipv4_name']);
    }

    if (!$primaryIpv6) {
        throw new RuntimeException('Primary IPv6 not found: ' . $config['primary_ipv6_name']);
    }

    $createBody = [
        'name' => $config['server_name'],
        'server_type' => $config['server_type'],
        'image' => $config['image'],
        'location' => $config['location'],
        'ssh_keys' => [
            $config['ssh_key'],
        ],
        'firewalls' => [
            [
                'firewall' => $firewall['id'],
            ],
        ],
        'public_net' => [
            'enable_ipv4' => true,
            'enable_ipv6' => true,
            'ipv4' => $primaryIpv4['id'],
            'ipv6' => $primaryIpv6['id'],
        ],
        'labels' => [
            'app' => 'spirit-game',
            'managed_by' => 'php-wake-script',
        ],
    ];

    [$createCode, $createData] = hcloud('POST', '/servers', $createBody);

    if ($createCode < 200 || $createCode >= 300) {
        throw new RuntimeException('Server creation failed: HTTP ' . $createCode . ' ' . json_encode($createData));
    }

    return $createData;
}

function destroyServerIfIdle(bool $force = false): array {
    global $config, $heartbeatFile;

    $heartbeat = heartbeatPayload();
    $lastActivity = $heartbeat['lastActivity'];
    $ageSeconds = $heartbeat['ageSeconds'];

    if (!$force) {
        if (!$lastActivity) {
            return [
                'status' => 'not-destroyed',
                'reason' => 'No heartbeat file exists',
                'heartbeat' => $heartbeat,
            ];
        }

        if ($ageSeconds < $config['idle_destroy_after_seconds']) {
            return [
                'status' => 'not-destroyed',
                'reason' => 'Server is not idle long enough',
                'idleDestroyAfterSeconds' => $config['idle_destroy_after_seconds'],
                'heartbeat' => $heartbeat,
            ];
        }
    }

    $server = getServer();

    if (!$server) {
        return [
            'status' => 'already-destroyed',
            'message' => 'Server does not exist',
            'heartbeat' => $heartbeat,
        ];
    }

    $serverId = $server['id'];
    $serverStatus = $server['status'] ?? 'unknown';

    [$deleteCode, $deleteData] = hcloud('DELETE', '/servers/' . urlencode((string) $serverId));

    if ($deleteCode < 200 || $deleteCode >= 300) {
        throw new RuntimeException('Server deletion failed: HTTP ' . $deleteCode . ' ' . json_encode($deleteData));
    }

    return [
        'status' => 'destroying',
        'message' => 'Server deletion requested',
        'server' => [
            'id' => $serverId,
            'name' => $server['name'] ?? null,
            'previousStatus' => $serverStatus,
        ],
        'force' => $force,
        'heartbeat' => $heartbeat,
        'hetzner' => $deleteData,
    ];
}

function requireAdminKey(): void {
    global $config;

    $key = $_GET['key'] ?? '';

    if (!$config['admin_key'] || str_starts_with($config['admin_key'], 'PUT_')) {
        jsonResponse([
            'status' => 'error',
            'error' => 'Admin key is not configured',
        ], 500);
    }

    if (!hash_equals($config['admin_key'], $key)) {
        jsonResponse([
            'status' => 'error',
            'error' => 'Unauthorized',
        ], 403);
    }
}

try {
    /*
      Prevent concurrent wake calls from creating duplicate servers.
    */
    $lockHandle = fopen($lockFile, 'c');
    if (!$lockHandle) {
        throw new RuntimeException('Could not open lock file');
    }

    flock($lockHandle, LOCK_EX);

    /*
      GET actions:
      - ?action=status&key=...
      - ?action=destroy-if-idle&key=...
      - ?action=destroy-now&key=...
    */
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $action = $_GET['action'] ?? 'status';

        if (in_array($action, ['status', 'destroy-if-idle', 'destroy-now'], true)) {
            requireAdminKey();
        }

        if ($action === 'status') {
            $server = getServer();

            jsonResponse([
                'status' => 'ok',
                'serverExists' => (bool) $server,
                'serverStatus' => $server['status'] ?? null,
                'server' => $server ? [
                    'id' => $server['id'] ?? null,
                    'name' => $server['name'] ?? null,
                    'status' => $server['status'] ?? null,
                    'created' => $server['created'] ?? null,
                ] : null,
                'heartbeat' => heartbeatPayload(),
            ]);
        }

        if ($action === 'destroy-if-idle') {
            jsonResponse(destroyServerIfIdle(false));
        }

        if ($action === 'destroy-now') {
            jsonResponse(destroyServerIfIdle(true));
        }

        jsonResponse([
            'status' => 'error',
            'error' => 'Unknown action',
        ], 400);
    }

    /*
      POST means:
      - record heartbeat
      - check server
      - create server if missing
      - return websocket URL once ready
    */
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        jsonResponse([
            'status' => 'error',
            'error' => 'Method not allowed',
        ], 405);
    }

    writeHeartbeat();

    $server = getServer();

    if ($server) {
        $status = $server['status'] ?? 'unknown';

        if ($status === 'running') {
            jsonResponse([
                'status' => 'ready',
                'serverStatus' => $status,
                'gameUrl' => $config['game_url'],
                'websocketUrl' => $config['websocket_url'],
                'heartbeat' => heartbeatPayload(),
            ]);
        }

        jsonResponse([
            'status' => 'starting',
            'serverStatus' => $status,
            'message' => 'Server exists but is not ready yet. Poll again shortly.',
            'heartbeat' => heartbeatPayload(),
        ]);
    }

    $createData = createServer();

    jsonResponse([
        'status' => 'starting',
        'message' => 'Server creation started. Poll again shortly.',
        'server' => [
            'id' => $createData['server']['id'] ?? null,
            'name' => $config['server_name'],
        ],
        'gameUrl' => $config['game_url'],
        'websocketUrl' => $config['websocket_url'],
        'heartbeat' => heartbeatPayload(),
    ]);
} catch (Throwable $e) {
    jsonResponse([
        'status' => 'error',
        'error' => $e->getMessage(),
        'heartbeat' => heartbeatPayload(),
    ], 500);
}
