#!/usr/bin/env bash

# Deployment script for Hugo site
# - builds the site with Hugo
# - installs rsync if missing
# - backs up existing site in /var/www
# - deploys files to /var/www/qcgrant-website
# - sets secure ownership/permissions (root:caddy -> dirs 0755, files 0644)
# - ensures Caddy serves the deploy dir and restarts Caddy

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR"
BUILD_DIR="$REPO_ROOT/public"
DEPLOY_DIR="/var/www/qcgrant-website"

timestamp() { date +%s; }

echo "[1/12] Ensure Hugo is available"
if ! command -v hugo >/dev/null 2>&1; then
	echo "ERROR: hugo is not installed. Install Hugo and re-run." >&2
	exit 1
fi

echo "[2/12] Build the Hugo site"
hugo --gc --minify

echo "[3/12] Ensure rsync is available (installing if necessary)"
if ! command -v rsync >/dev/null 2>&1; then
	echo "rsync not found; installing..."
	sudo apt-get update -y && sudo apt-get install -y rsync
fi

echo "[4/12] Backup existing deployment (if present)"
ts=$(timestamp)
if [ -d "$DEPLOY_DIR" ]; then
	sudo tar -C "$(dirname "$DEPLOY_DIR")" -czf "/tmp/backup_qcgrant_www_$ts.tar.gz" "$(basename "$DEPLOY_DIR")" && echo "backup -> /tmp/backup_qcgrant_www_$ts.tar.gz"
else
	echo "no existing $DEPLOY_DIR to backup"
fi

echo "[5/12] Ensure deployment directory exists"
sudo mkdir -p "$DEPLOY_DIR"

echo "[6/12] Sync build to deployment directory"
sudo rsync -a --delete --no-o --no-g --chmod=Du=rwx,Dg=rx,Do=rx,Fu=rw,Fg=r,Fo=r "$BUILD_DIR/" "$DEPLOY_DIR/"

echo "[7/12] Set ownership to root:caddy (fallback to root:www-data)"
if getent group caddy >/dev/null 2>&1; then
	sudo chown -R root:caddy "$DEPLOY_DIR"
	grp="caddy"
else
	sudo chown -R root:www-data "$DEPLOY_DIR"
	grp="www-data"
fi

echo "[8/12] Set secure permissions (dirs 0755, files 0644)"
sudo find "$DEPLOY_DIR" -type d -exec chmod 0755 {} +
sudo find "$DEPLOY_DIR" -type f -exec chmod 0644 {} +

echo "[9/12] Ensure Caddy is configured to serve $DEPLOY_DIR"
if ! sudo grep -q "root \* $DEPLOY_DIR" /etc/caddy/Caddyfile 2>/dev/null; then
	ts2=$(timestamp)
	sudo cp /etc/caddy/Caddyfile "/etc/caddy/Caddyfile.bak.$ts2"
	# Replace existing root directive pointing to any path with the deploy dir
	sudo sed -i -E "s|root \* .*|root * $DEPLOY_DIR|g" /etc/caddy/Caddyfile
	echo "Updated /etc/caddy/Caddyfile (backup at /etc/caddy/Caddyfile.bak.$ts2)"
else
	echo "Caddy already configured to serve $DEPLOY_DIR"
fi

echo "[10/12] Validate Caddy configuration"
if ! sudo caddy validate --config /etc/caddy/Caddyfile; then
	echo "Caddy validation failed; aborting and restoring previous Caddyfile" >&2
	sudo mv "/etc/caddy/Caddyfile.bak.$ts2" /etc/caddy/Caddyfile || true
	exit 1
fi

echo "[11/12] Restart Caddy"
sudo systemctl restart caddy
sleep 1

echo "[12/12] Verify service and report"
sudo systemctl is-active --quiet caddy && echo "caddy: active" || (echo "caddy: not active" >&2; sudo systemctl status --no-pager --full -l caddy -n 200 || true)

echo "Deployment completed successfully! (owner: root:$grp, dirs:0755, files:0644)"
echo "Backup (if any) at: /tmp/backup_qcgrant_www_*$ts.tar.gz"