# Game Server Fetch API

Endpoint:

```txt
https://komm-folge-mir-nach.de/api/fetch-game-server.php
```

## 1. Wake server / heartbeat

Use this when the user enters online mode.

This call also updates the heartbeat timestamp.

### Request

```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: https://komm-folge-mir-nach.de" \
  https://komm-folge-mir-nach.de/api/fetch-game-server.php | jq
```

### Sample response: server ready

```json
{
  "status": "ready",
  "serverStatus": "running",
  "gameUrl": "https://game.komm-folge-mir-nach.de/game/",
  "websocketUrl": "wss://game.komm-folge-mir-nach.de/ws",
  "heartbeat": {
    "lastActivity": 1783438200,
    "lastActivityIso": "2026-07-07T12:10:00+00:00",
    "ageSeconds": 0
  }
}
```

### Sample response: server starting

```json
{
  "status": "starting",
  "message": "Server creation started. Poll again shortly.",
  "server": {
    "id": 123456789,
    "name": "spirit-game-server"
  },
  "gameUrl": "https://game.komm-folge-mir-nach.de/game/",
  "websocketUrl": "wss://game.komm-folge-mir-nach.de/ws",
  "heartbeat": {
    "lastActivity": 1783438200,
    "lastActivityIso": "2026-07-07T12:10:00+00:00",
    "ageSeconds": 0
  }
}
```

## 2. Check status

Use this for admin/debugging.

### Request

```bash
curl -s \
  "https://komm-folge-mir-nach.de/api/fetch-game-server.php?action=status&key=s3cr3t" | jq
```

### Sample response

```json
{
  "status": "ok",
  "serverExists": true,
  "serverStatus": "running",
  "server": {
    "id": 123456789,
    "name": "spirit-game-server",
    "status": "running",
    "created": "2026-07-07T12:08:30+00:00"
  },
  "heartbeat": {
    "lastActivity": 1783438200,
    "lastActivityIso": "2026-07-07T12:10:00+00:00",
    "ageSeconds": 42
  }
}
```

## 3. Destroy server if idle

Use this from a cron job.

It does not update the heartbeat.

### Request

```bash
curl -s \
  "https://komm-folge-mir-nach.de/api/fetch-game-server.php?action=destroy-if-idle&key=s3cr3t" | jq
```

### Sample response: not idle yet

```json
{
  "status": "not-destroyed",
  "reason": "Server is not idle long enough",
  "idleDestroyAfterSeconds": 3600,
  "heartbeat": {
    "lastActivity": 1783438200,
    "lastActivityIso": "2026-07-07T12:10:00+00:00",
    "ageSeconds": 420
  }
}
```

### Sample response: deletion requested

```json
{
  "status": "destroying",
  "message": "Server deletion requested",
  "server": {
    "id": 123456789,
    "name": "spirit-game-server",
    "previousStatus": "running"
  },
  "force": false,
  "heartbeat": {
    "lastActivity": 1783434000,
    "lastActivityIso": "2026-07-07T11:00:00+00:00",
    "ageSeconds": 4200
  },
  "hetzner": {
    "action": {
      "id": 987654321,
      "command": "delete_server",
      "status": "running"
    }
  }
}
```

### Cron URL

Call every 10 minutes:

```txt
https://komm-folge-mir-nach.de/api/fetch-game-server.php?action=destroy-if-idle&key=s3cr3t
```

## 4. Force destroy server

Use this only manually/admin-side.

It deletes the server even if the heartbeat is recent.

### Request

```bash
curl -s \
  "https://komm-folge-mir-nach.de/api/fetch-game-server.php?action=destroy-now&key=s3cr3t" | jq
```

### Sample response

```json
{
  "status": "destroying",
  "message": "Server deletion requested",
  "server": {
    "id": 123456789,
    "name": "spirit-game-server",
    "previousStatus": "running"
  },
  "force": true,
  "heartbeat": {
    "lastActivity": 1783438200,
    "lastActivityIso": "2026-07-07T12:10:00+00:00",
    "ageSeconds": 60
  },
  "hetzner": {
    "action": {
      "id": 987654321,
      "command": "delete_server",
      "status": "running"
    }
  }
}
```

## 5. Error response

### Sample response

```json
{
  "status": "error",
  "error": "Unauthorized",
  "heartbeat": {
    "lastActivity": 1783438200,
    "lastActivityIso": "2026-07-07T12:10:00+00:00",
    "ageSeconds": 60
  }
}
```

## Frontend example

```js
const endpoint = "https://komm-folge-mir-nach.de/api/fetch-game-server.php";

async function fetchGameServer() {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (data.status === "ready") {
    return data.websocketUrl;
  }

  if (data.status === "starting") {
    return null;
  }

  throw new Error(data.error || "Could not fetch game server");
}

async function waitForGameServer() {
  for (let attempt = 0; attempt < 60; attempt++) {
    const websocketUrl = await fetchGameServer();

    if (websocketUrl) {
      return websocketUrl;
    }

    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  throw new Error("Game server did not become ready in time");
}
```

## Status values

```txt
ready
Server is running and WebSocket URL can be used.

starting
Server is being created or is not ready yet.

ok
Admin status request succeeded.

not-destroyed
Idle destroy was skipped.

destroying
Server deletion was requested.

already-destroyed
Server does not exist.

error
Request failed.
```
