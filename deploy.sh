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

# Color helpers (only enable colors when output is a TTY)
if [ -t 1 ]; then
	RED='\033[0;31m'
	GREEN='\033[0;32m'
	YELLOW='\033[0;33m'
	BLUE='\033[0;34m'
	BOLD='\033[1m'
	RESET='\033[0m'
else
	RED=''
	GREEN=''
	YELLOW=''
	BLUE=''
	BOLD=''
	RESET=''
fi

info() { printf "%b\n" "${BLUE}[INFO]${RESET} $*"; }
warn() { printf "%b\n" "${YELLOW}[WARN]${RESET} $*"; }
success() { printf "%b\n" "${GREEN}[OK]${RESET} $*"; }
error() { printf "%b\n" "${RED}[ERROR]${RESET} $*" >&2; }

info "[1/12] Ensure Hugo is available"
if ! command -v hugo >/dev/null 2>&1; then
	error "hugo is not installed. Install Hugo and re-run."
	exit 1
fi

info "[2/12] Build the Hugo site"
# If enabled in site params, sync static images into assets so Hugo can process them
if grep -q "^enable_image_processing = true" "$REPO_ROOT/config/_default/params.toml" 2>/dev/null; then
	info "Syncing static images to assets for Hugo processing"
	mkdir -p "$REPO_ROOT/assets/images"
	# Copy files but don't error the deploy if copy fails
	cp -a "$REPO_ROOT/static/images/." "$REPO_ROOT/assets/images/" || true
	# Move referenced content images into page bundles so Hugo can process them via .Resources
	if [ -x "$REPO_ROOT/scripts/move_content_images.sh" ]; then
		info "Moving content-referenced images into page bundles"
		"$REPO_ROOT/scripts/move_content_images.sh"
	fi
fi

hugo --gc --minify

info "[3/11] Backup existing deployment (if present)"
info "(using cp fallback; rsync not required)"
ts=$(timestamp)
if [ -d "$DEPLOY_DIR" ]; then
  sudo tar -C "$(dirname "$DEPLOY_DIR")" -czf "/tmp/backup_qcgrant_www_$ts.tar.gz" "$(basename "$DEPLOY_DIR")" && success "backup -> /tmp/backup_qcgrant_www_$ts.tar.gz"
else
  info "no existing $DEPLOY_DIR to backup"
fi

info "[4/11] Ensure deployment directory exists"
sudo mkdir -p "$DEPLOY_DIR"

info "[5/11] Sync build to deployment directory (cp fallback)"
# Remove all existing contents (preserve the directory itself), then copy the new build
sudo find "$DEPLOY_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
sudo cp -a "$BUILD_DIR/." "$DEPLOY_DIR/"

info "[6/11] Set ownership to root:caddy (fallback to root:www-data)"
if getent group caddy >/dev/null 2>&1; then
	sudo chown -R root:caddy "$DEPLOY_DIR"
	grp="caddy"
	success "chown -> root:caddy"
else
	sudo chown -R root:www-data "$DEPLOY_DIR"
	grp="www-data"
	success "chown -> root:www-data"
fi

info "[7/11] Set secure permissions (dirs 0755, files 0644)"
sudo find "$DEPLOY_DIR" -type d -exec chmod 0755 {} +
sudo find "$DEPLOY_DIR" -type f -exec chmod 0644 {} +
success "permissions set (dirs 0755, files 0644)"

info "[8/12] Ensure Caddy is configured to serve $DEPLOY_DIR"
if ! sudo grep -q "root \* $DEPLOY_DIR" /etc/caddy/Caddyfile 2>/dev/null; then
	ts2=$(timestamp)
	sudo cp /etc/caddy/Caddyfile "/etc/caddy/Caddyfile.bak.$ts2"
	# Replace existing root directive pointing to any path with the deploy dir
	sudo sed -i -E "s|root \* .*|root * $DEPLOY_DIR|g" /etc/caddy/Caddyfile
	success "Updated /etc/caddy/Caddyfile (backup at /etc/caddy/Caddyfile.bak.$ts2)"
else
	info "Caddy already configured to serve $DEPLOY_DIR"
fi

info "[9/12] Format Caddyfile for consistency (caddy fmt --overwrite)"
if command -v caddy >/dev/null 2>&1; then
	if sudo caddy fmt --overwrite /etc/caddy/Caddyfile >/dev/null 2>&1; then
		success "Caddyfile formatted"
	else
		warn "caddy fmt failed or produced no changes; continuing to validation"
	fi
else
	warn "caddy binary not found; skipping format"
fi

info "[10/12] Validate Caddy configuration"
if ! sudo caddy validate --config /etc/caddy/Caddyfile; then
	error "Caddy validation failed; aborting and restoring previous Caddyfile"
	sudo mv "/etc/caddy/Caddyfile.bak.$ts2" /etc/caddy/Caddyfile || true
	exit 1
fi

info "[10/11] Restart Caddy"
sudo systemctl restart caddy
sleep 1

info "[11/11] Verify service and report"
if sudo systemctl is-active --quiet caddy; then
	success "caddy: active"
else
	error "caddy: not active"
	sudo systemctl status --no-pager --full -l caddy -n 200 || true
fi

success "Deployment completed successfully! (owner: root:$grp, dirs:0755, files:0644)"
info "Backup (if any) at: /tmp/backup_qcgrant_www_*$ts.tar.gz"