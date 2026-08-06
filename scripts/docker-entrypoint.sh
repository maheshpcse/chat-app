#!/bin/sh
# Runtime entry for chat-app Nginx image.
# MAINTENANCE_MODE=1 → serve premium maintenance page as site root.
set -eu

HTML_ROOT="${HTML_ROOT:-/usr/share/nginx/html}"
MAINT_SRC="${MAINT_SRC:-/usr/share/nginx/maintenance/index.html}"

APP_INDEX="${HTML_ROOT}/index.html.app"

if [ "${MAINTENANCE_MODE:-0}" = "1" ] || [ -f "${HTML_ROOT}/.maintenance" ]; then
  echo "[chat-app] Maintenance mode ON — serving maintenance page"
  if [ -f "$MAINT_SRC" ]; then
    cp "$MAINT_SRC" "${HTML_ROOT}/index.html"
    cp "$MAINT_SRC" "${HTML_ROOT}/404.html" 2>/dev/null || true
    # Marker so probes / ops can detect mode without parsing HTML
    : > "${HTML_ROOT}/.maintenance"
  else
    echo "[chat-app] WARN: maintenance source missing at $MAINT_SRC"
  fi
else
  echo "[chat-app] Maintenance mode OFF — serving application bundle"
  if [ -f "$APP_INDEX" ]; then
    cp "$APP_INDEX" "${HTML_ROOT}/index.html"
    cp "$APP_INDEX" "${HTML_ROOT}/404.html" 2>/dev/null || true
  fi
  rm -f "${HTML_ROOT}/.maintenance"
fi

exec nginx -g "daemon off;"
