#!/bin/sh
set -eu

CONFIG_PATH=/usr/share/nginx/html/config.js
if [ -n "${VITE_API_BASE_URL:-}" ]; then
  cat > "$CONFIG_PATH" <<EOF_CONF
window.__CONFIG__ = {
  API_BASE_URL: "${VITE_API_BASE_URL}"
};
EOF_CONF
fi
