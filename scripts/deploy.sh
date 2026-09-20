#!/usr/bin/env bash
#
# Deploy the SPA + PHP backend to the Hetzner webspace over SFTP.
#
#   ./scripts/deploy.sh [options]
#
#     --no-build      skip `npm run build` and upload whatever is in dist/
#     --with-config   also upload api/config/config.php (see the warning below)
#     --with-tests    also upload the api/ diagnostics (debug.php, test-*.php)
#     --dry-run       print the transfer plan and exit
#
# Credentials come from ./sftp.env (gitignored):
#     SFTP_SERVER=user@host
#     SFTP_PASSWD=...
#
# ─── Why this uses an explicit allow-list ────────────────────────────────────
# Vite copies public/ verbatim into dist/, so dist/ also holds the *server* side
# of the project — and one of those directories accumulates live state that only
# exists on the server:
#
#   questionnaires/  the two *_v1.json definitions sit beside one
#                    <identifier>.json per person who filled the questionnaire
#                    out (questionaire.php writes them there). Only the two
#                    definitions are named below; answers are never touched.
# Uploading dist/ wholesale would push a stale local snapshot over that. Nothing
# is uploaded unless it is named below — and nothing is ever deleted.
#
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$PWD"

BUILD=1 WITH_CONFIG=0 WITH_TESTS=0 DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --no-build)    BUILD=0 ;;
    --with-config) WITH_CONFIG=1 ;;
    --with-tests)  WITH_TESTS=1 ;;
    --dry-run)     DRY_RUN=1 ;;
    -h|--help)     sed -n '2,30p' "$0"; exit 0 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

[ -f sftp.env ] || { echo "✗ sftp.env not found in $ROOT" >&2; exit 1; }
set -a; . ./sftp.env; set +a
: "${SFTP_SERVER:?SFTP_SERVER missing from sftp.env}"
: "${SFTP_PASSWD:?SFTP_PASSWD missing from sftp.env}"

command -v sshpass >/dev/null || { echo "✗ sshpass not installed (brew install sshpass)" >&2; exit 1; }

PUBLIC_URL="https://komm-folge-mir-nach.schaefchens.de"

if [ "$BUILD" = 1 ]; then
  echo "▸ building web bundle…"
  npm run build
fi
[ -f dist/index.html ] || { echo "✗ dist/index.html missing — run without --no-build" >&2; exit 1; }

# ─── Build the transfer plan ─────────────────────────────────────────────────
# PLAN lines are "local<TAB>remote". Directories are derived from them.
PLAN=$(mktemp) ; BATCH=$(mktemp)
trap 'rm -f "$PLAN" "$BATCH"' EXIT

add_file() { [ -f "$1" ] && printf '%s\t%s\n' "$1" "$2" >> "$PLAN" || true; }
add_tree() {
  # add_tree <localdir> <remotedir> — every file beneath it, structure preserved
  local src="$1" dst="$2"
  [ -d "$src" ] || return 0
  while IFS= read -r f; do
    printf '%s\t%s\n' "$f" "$dst/${f#$src/}" >> "$PLAN"
  done < <(find "$src" -type f ! -name '.DS_Store')
}

# Order matters, and index.html is deliberately last — see the end of this block.
add_tree dist/assets assets

# Static extras Vite copied from public/
for f in favicon.ico favicon.png manifest.json placeholder.svg robots.txt .htaccess; do
  add_file "dist/$f" "$f"
done

# Questionnaire definitions only. Named one by one on purpose: the remote
# questionnaires/ directory is also where every filled-out questionnaire lands.
add_file dist/questionnaires/glaubensfragebogen_v1.json questionnaires/glaubensfragebogen_v1.json
add_file dist/questionnaires/simple_beliefs_v1.json     questionnaires/simple_beliefs_v1.json

# PHP entry points served at the site root
add_file dist/join.php        join.php
add_file dist/questionaire.php questionaire.php

# Backend. config/database.php and includes/functions.php are required by every
# handler, so they go up before the handlers that include them.
add_file dist/api/config/database.php  api/config/database.php
add_file dist/api/includes/functions.php api/includes/functions.php
for f in auth.php prayers.php reactions.php scheduled-calls.php verify.php; do
  add_file "dist/api/$f" "api/$f"
done

# api/config/config.php carries the live PostgreSQL password. The copy in this
# repo is the one the server runs today, but if the credentials were ever
# rotated on the server, this would silently roll them back and take the whole
# prayer/auth backend down. Opt in only when you mean to change them.
[ "$WITH_CONFIG" = 1 ] && add_file dist/api/config/config.php api/config/config.php

# debug.php and test-*.php print the database name, schema and connection state
# to anyone who requests them, so they are not part of a normal deploy. (Leaving
# them out does not remove them from the server — this script never deletes.)
if [ "$WITH_TESTS" = 1 ]; then
  add_file dist/api/debug.php api/debug.php
  while IFS= read -r f; do add_file "$f" "api/$(basename "$f")"; done \
    < <(find dist/api -maxdepth 1 -name 'test-*.php')
fi

# Last. index.html references this build's hashed assets/ filenames, so until it
# is replaced the old page is still being served against the assets it expects.
# Uploading it first would leave anyone who loads the site mid-transfer with a
# blank page pointing at bundles that are not there yet.
add_file dist/index.html index.html

# ─── Guard: never upload a placeholder over a live credential ────────────────
# The Twilio, SMTP, Hetzner SMS and PostgreSQL credentials were purged from this
# repo's history, so the tracked copies of join.php and database.php now read
# *_PURGED. The server still runs the real ones.
#
# Such a file is dropped from the plan rather than uploaded: the server's copy
# is the working original, and leaving it untouched is always safer than
# overwriting a live credential with a redacted one. The cost is that a genuine
# code change to one of those files will NOT deploy until the real values are
# restored locally — which is why this says so loudly rather than silently.
SKIPPED=""
KEPT=$(mktemp)
while IFS= read -r line; do
  f="${line%%	*}"
  case "$f" in
    *.php|*.html|*.json|*.js|*.css)
      if grep -q '_PURGED' "$f" 2>/dev/null; then SKIPPED="$SKIPPED$f"$'\n'; continue; fi ;;
  esac
  printf '%s\n' "$line" >> "$KEPT"
done < "$PLAN"
mv "$KEPT" "$PLAN"

FILE_COUNT=$(wc -l < "$PLAN" | tr -d ' ')
BYTES=$(awk -F'\t' '{print $1}' "$PLAN" | xargs -I{} stat -f%z {} 2>/dev/null | awk '{s+=$1} END {print s+0}')

echo
echo "▸ target : $SFTP_SERVER  →  $PUBLIC_URL"
echo "▸ files  : $FILE_COUNT  ($(echo "scale=1; $BYTES/1048576" | bc) MB)"
[ "$WITH_CONFIG" = 1 ] && echo "▸ incl.  : api/config/config.php  (overwrites the server's DB credentials!)"
[ "$WITH_TESTS" = 1 ]  && echo "▸ incl.  : api/ diagnostics (debug.php, test-*.php)"
if [ -n "$SKIPPED" ]; then
  echo "▸ SKIPPED: these carry purged-secret placeholders, so the server's working"
  echo "           copies are left alone. Restore the real values locally to deploy"
  echo "           code changes to them:"
  printf '%s' "$SKIPPED" | sed 's|^|             |'
fi
echo "▸ never  : questionnaires/<identifier>.json (filled-out questionnaires)"
echo "           and anything not listed in the plan"
echo

if [ "$DRY_RUN" = 1 ]; then
  echo "── dry run — would transfer ──"
  awk -F'\t' '{printf "   %s → %s\n", $1, $2}' "$PLAN" | head -40
  [ "$FILE_COUNT" -gt 40 ] && echo "   … and $((FILE_COUNT - 40)) more"
  exit 0
fi

# ─── Emit the sftp batch ─────────────────────────────────────────────────────
# `-` prefixes mean "keep going if this fails" — mkdir on an existing directory
# is expected to fail, and batch mode aborts on the first error otherwise.
awk -F'\t' '{ n=split($2, p, "/"); d=""; for (i=1;i<n;i++){ d = (i==1? p[i] : d "/" p[i]); print d } }' "$PLAN" \
  | awk '!seen[$0]++' | sort | sed 's/^/-mkdir /' >> "$BATCH"
awk -F'\t' '{printf "put %s %s\n", $1, $2}' "$PLAN" >> "$BATCH"

echo "▸ uploading…"
SSHPASS="$SFTP_PASSWD" sshpass -e sftp \
  -o StrictHostKeyChecking=accept-new \
  -o BatchMode=no \
  -o ConnectTimeout=20 \
  -b "$BATCH" "$SFTP_SERVER" > /tmp/deploy-sftp.log 2>&1 || {
    echo "✗ upload failed — last 20 lines:" >&2
    tail -20 /tmp/deploy-sftp.log >&2
    exit 1
  }
echo "▸ uploaded $FILE_COUNT files"

# ─── Verify ──────────────────────────────────────────────────────────────────
echo
echo "▸ verifying…"

check() {
  local path="$1" expect="$2" label="$3"
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$PUBLIC_URL$path" || echo 000)
  if [ "$code" = "$expect" ]; then printf '   ✓ %-34s %s\n' "$label" "$code"
  else printf '   ✗ %-34s got %s, expected %s\n' "$label" "$code" "$expect"; fi
}

# A status code alone says little about a PHP endpoint: a handler that dies on a
# require() still answers 200, just with an HTML error page or nothing at all.
# Asserting the content-type is what distinguishes "responding" from "working".
check_ct() {
  local path="$1" expect_re="$2" label="$3"
  local head code ct
  head=$(curl -sIL --max-time 20 "$PUBLIC_URL$path" | tr -d '\r' || true)
  code=$(printf '%s\n' "$head" | awk '/^HTTP\//{c=$2} END{print (c==""?"000":c)}')
  ct=$(printf '%s\n' "$head" | awk -F': ' 'tolower($1)=="content-type"{v=$2} END{print v}')
  if [ "$code" != "200" ]; then
    printf '   ✗ %-34s HTTP %s\n' "$label" "$code"
  elif printf '%s' "$ct" | grep -qiE "$expect_re"; then
    printf '   ✓ %-34s %s\n' "$label" "$ct"
  else
    printf '   ✗ %-34s unexpected content-type: %s\n' "$label" "${ct:-none}"
  fi
}

check "/"              200 "SPA index"
check "/manifest.json" 200 "web manifest"
check "/robots.txt"    200 "robots.txt"
check_ct "/favicon.png" "image/png" "favicon"

# The hashed bundle names change every build, so they are read back out of the
# index.html that was just uploaded rather than hard-coded. This is the check
# that catches an assets/ upload that silently came up short.
while IFS= read -r a; do
  case "$a" in
    *.js)  check_ct "/$a" "javascript|ecmascript" "JS bundle  ${a#assets/}" ;;
    *.css) check_ct "/$a" "text/css"              "CSS bundle ${a#assets/}" ;;
  esac
done < <(grep -oE 'assets/[A-Za-z0-9._-]+\.(js|css)' dist/index.html | sort -u)

# JSON, not HTML: both of these talk to PostgreSQL, so a JSON body proves PHP is
# executing, the include chain resolved, and the database connection came up.
check_ct "/questionaire.php?list=true" "application/json" "questionaire.php (list)"
check_ct "/api/prayers.php"            "application/json" "api/prayers.php (DB alive)"

# config.php holds the PostgreSQL password in plain text. If PHP ever stops
# handling .php under api/config/ — a bad .htaccess, a handler change — Apache
# serves the file as text and hands the database to anyone who asks. It returns
# an array and echoes nothing, so a working server answers with an empty body.
printf '   ─ api/config/config.php must never be served as source:\n'
if curl -s --max-time 20 "$PUBLIC_URL/api/config/config.php" | head -c 2000 | grep -q '<?php'; then
  printf '     ✗ PHP SOURCE IS BEING SERVED — the DB password is public, fix this now\n'
else
  printf '     ✓ not served as source\n'
fi

echo
echo "▸ done → $PUBLIC_URL"
