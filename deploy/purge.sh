#!/usr/bin/env bash
# Purge the Cloudflare edge cache (everything) — run as the last step of a deploy / data update
# so the 1-week edge TTL never serves stale HTML. Reads CF_PURGE_TOKEN + CF_ZONE_ID from the
# deploy .env (a minimal token: Zone → Cache Purge only, scoped to the site's zone).
#
# Usage (from the deploy dir):  ./deploy/purge.sh
# No-op (warns, exits 0) if the token isn't configured, so a deploy never fails for lack of it.
set -uo pipefail

[ -f .env ] && { set -a; . ./.env; set +a; }

if [ -z "${CF_PURGE_TOKEN:-}" ] || [ -z "${CF_ZONE_ID:-}" ]; then
  echo "[purge] CF_PURGE_TOKEN / CF_ZONE_ID not set in .env — skipping cache purge." >&2
  exit 0
fi

resp=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/purge_cache" \
  -H "Authorization: Bearer ${CF_PURGE_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}')

if echo "$resp" | grep -q '"success":true'; then
  echo "[purge] Cloudflare cache purged."
else
  echo "[purge] FAILED: $resp" >&2
  exit 1
fi
