# Ultraviolet-Proxy (Interstellar starter)

Minimal starter for an Ultraviolet-style web proxy with:
- about:blank embedding
- Liquid Glass dark UI
- Chrome-like subtle animations
- Cloudflare Workers router (edge)
- Optional Docker + Nginx static host

This repo contains runnable skeleton. See quick start below.

## Quick start (local via Docker)
1. `git clone <repo>`
2. `docker compose up --build -d`
3. Open http://localhost:8080

## Quick start (local without Docker)
1. `./scripts/start-local.sh`
2. Open http://localhost:8080

## Deploy Workers (Cloudflare)
1. Install `wrangler` and login
2. `cd worker && npm install`
3. `npx wrangler publish`

## Notes
- This is a learning starter. Major sites (YouTube/TikTok/X) may require additional header rewriting, signature handling, or DRM steps.
- Use Workers to handle CSP/X-Frame-Options rewriting at edge.

-kotopiro(Takorou)
