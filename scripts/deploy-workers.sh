#!/usr/bin/env bash
set -euo pipefail
cd worker
if ! command -v npx >/dev/null 2>&1; then
  echo "Please install Node.js & npm"
  exit 1
fi
npx wrangler publish
