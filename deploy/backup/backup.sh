#!/usr/bin/env bash
# Automated database backup for the Bihar Scheme Tracker.
# Dumps the live Postgres (full, schema + data) to a gzipped, timestamped file and keeps a
# rolling window. Run from the deploy dir (where docker-compose.yml lives) via cron/systemd.
#
# Install (on the server, one time):
#   chmod +x /root/bihar-scheme-tracker/deploy/backup/backup.sh
#   ( crontab -l 2>/dev/null; echo '7 2 * * * cd /root/bihar-scheme-tracker && ./deploy/backup/backup.sh >> /root/backups/backup.log 2>&1' ) | crontab -
#
# Restore (see DEPLOY.md → "Backups & recovery"):
#   gunzip -c /root/backups/bihar-YYYYMMDD-HHMM.sql.gz | docker compose exec -T db psql -U bihar -d bihar_scheme_tracker
set -euo pipefail

DEST="${BACKUP_DIR:-/root/backups}"
KEEP_DAILY="${KEEP_DAILY:-30}"   # rolling daily backups to retain
mkdir -p "$DEST"

ts="$(date -u +%Y%m%d-%H%M)"
out="$DEST/bihar-$ts.sql.gz"

# Full dump (schema + data) so a restore needs nothing else. --clean lets it restore over an
# existing DB; pipe straight to gzip.
docker compose exec -T db pg_dump -U bihar -d bihar_scheme_tracker --clean --if-exists \
  | gzip > "$out"

# Integrity: non-trivial gzip that contains our table. Use `wc -c` (portable) for size and
# `grep -c` (reads the whole stream — `grep -q` would close the pipe early and trip pipefail).
size=$(wc -c < "$out")
hits=$(gunzip -c "$out" | grep -c "public.schemes" || true)
if [ "$size" -lt 1000 ] || [ "$hits" -eq 0 ]; then
  echo "[$(date -u)] BACKUP FAILED — $out looks empty/invalid (size=$size, schema hits=$hits)" >&2
  rm -f "$out"
  exit 1
fi

# Retention: keep the newest $KEEP_DAILY, delete older.
ls -1t "$DEST"/bihar-*.sql.gz 2>/dev/null | tail -n +"$((KEEP_DAILY + 1))" | xargs -r rm -f

echo "[$(date -u)] backup ok: $out ($(du -h "$out" | cut -f1))"
