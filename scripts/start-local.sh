#!/usr/bin/env bash
set -euo pipefail
if command -v docker >/dev/null 2>&1; then
  echo "Starting via docker-compose..."
  docker compose up --build -d
  echo "Open http://localhost:8080"
else
  echo "Starting via python http.server (no docker)"
  (cd web && python3 -m http.server 8080)
fi
