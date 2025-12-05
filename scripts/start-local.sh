#!/usr/bin/env bash
set -e

echo "[local] Starting static web on http://localhost:8080"
docker build -t tp-proxy .
docker run --rm -p 8080:8080 tp-proxy
