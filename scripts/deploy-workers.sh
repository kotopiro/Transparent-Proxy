#!/usr/bin/env bash
set -euo pipefail
cd worker
echo "Deploying worker..."
npx wrangler deploy
