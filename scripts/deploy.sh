#!/usr/bin/env bash
# Deploy dist/ to everharris.com over SSH (HostGator).
# Usage: scripts/deploy.sh [--dry-run]
# Before uploading it saves a dated tarball of the current site folder on the server
# (~/backups/everharris-<timestamp>.tgz). Rollback: tar xzf that file inside the docroot.
set -euo pipefail
cd "$(dirname "$0")/.."

SSH_HOST="${DEPLOY_SSH_HOST:-aycjztte@50.6.161.39}"
SSH_PORT="${DEPLOY_SSH_PORT:-2222}"
SSH_KEY="${DEPLOY_SSH_KEY:-$HOME/.ssh/id_ed25519_hostgator}"
DOCROOT="${DEPLOY_DOCROOT:-public_html/everharris}"
STALE_FILES="api/index.php"

SSH=(ssh -p "$SSH_PORT" -i "$SSH_KEY" -o BatchMode=yes -o IdentitiesOnly=yes "$SSH_HOST")

[ -f public/api/config.php ] || { echo "public/api/config.php missing (copy config.example.php and fill it in)" >&2; exit 1; }
grep -q REPLACE_ME public/api/config.php && { echo "public/api/config.php still has placeholders" >&2; exit 1; }

npm run build >/dev/null
FILES=$(cd dist && find . -type f ! -name '*.map' | sed 's|^\./||' | sort)
echo "Target: $SSH_HOST:~/$DOCROOT  ($(echo "$FILES" | wc -l) files)"

if [ "${1:-}" = "--dry-run" ]; then
  echo "$FILES"
  "${SSH[@]}" "test -d $DOCROOT && echo 'remote docroot exists' && ls -A $DOCROOT | head -20"
  exit 0
fi

STAMP=$(date +%Y%m%d-%H%M%S)
echo "Backing up current site to ~/backups/everharris-$STAMP.tgz"
"${SSH[@]}" "mkdir -p ~/backups && cd $DOCROOT && tar czf ~/backups/everharris-$STAMP.tgz . && ls -l ~/backups/everharris-$STAMP.tgz"

echo "Uploading"
tar czf - --exclude='*.map' -C dist . | "${SSH[@]}" "cd $DOCROOT && tar xzf -"

"${SSH[@]}" "cd $DOCROOT && rm -f $STALE_FILES && ls -A | head -20"
echo "Done. Backup: ~/backups/everharris-$STAMP.tgz"
