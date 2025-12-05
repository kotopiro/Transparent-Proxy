#!/usr/bin/env bash
set -euo pipefail
cd worker
if ! command -v npx >/dev/null 2>&1; then
  echo "Install npm & npx first"
  exit 1
fi
echo "Deploying Cloudflare Worker (wrangler publish)..."
npx wrangler publish
