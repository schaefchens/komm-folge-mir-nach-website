#!/bin/bash

# Test signup via curl
echo "Testing signup via curl..."

curl -X POST https://komm-folge-mir-nach.de/api/auth.php \
  -H "Content-Type: application/json" \
  -d '{
    "action": "register",
    "username": "testuser_'$RANDOM'",
    "password": "testpass123",
    "name": "Test User",
    "email": "test@example.com",
    "color": "#3b82f6",
    "avatar": "🙏",
    "notifications": true
  }' \
  -v