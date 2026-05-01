# PoolOps Dev Workflow

## Services (auto-start on boot)

| Service | Description | Port |
|---------|-------------|------|
| `openclaw-gateway` | OpenClaw gateway | — |
| `mission-control` | MC frontend + backend | 3000 (frontend), 3002 (backend) |
| `poolops-api` | PoolOps local API | 3003 |

All three are systemd user services that start automatically on boot.

## Managing Services

```bash
# Status
systemctl --user status poolops-api
systemctl --user status mission-control

# Start / Stop / Restart
systemctl --user start poolops-api
systemctl --user stop poolops-api
systemctl --user restart poolops-api

# Logs
journalctl --user -u poolops-api -f
journalctl --user -u mission-control -f
```

## Database — Cloud Supabase Only

**NEVER start local Supabase Docker containers.** PoolOps uses the cloud Supabase instance exclusively.

- Cloud project: `fqpbjcxdzesbwxkwyklf.supabase.co`
- Config: `~/poolops/api/.env`
- Schema changes: use Supabase dashboard SQL editor (direct DB connection is IPv6-only, unreachable from WSL)
- `docker compose up` / `supabase start` are **not part of this workflow**

## Key URLs

| What | URL |
|------|-----|
| Mission Control frontend | http://localhost:3000 |
| Mission Control backend | http://localhost:3002 |
| PoolOps API health | http://localhost:3003/health |
| PoolOps web admin (production) | https://web-chi-five-48.vercel.app |

## Stripe Webhooks (manual — only when needed)

The Stripe listener is **not** a boot service. Start it manually when testing webhooks:

```bash
cd ~/poolops/api && npm run stripe:listen
```

Webhook secret is in `~/.config/stripe/config.toml` and `.env`.

## Docker

Docker is stopped by default to conserve RAM. It is not required for any part of the PoolOps dev stack. Only start it if you have an explicit reason unrelated to PoolOps.
