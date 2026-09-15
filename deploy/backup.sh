#!/usr/bin/env bash
# backup.sh  ── DB dump (Supabase) + VPS uploads ka tar + offsite copy.
# Cron (root):
#   0 3 * * * bash /opt/flagjourney/app/deploy/backup.sh >> /var/log/flagjourney-backup.log 2>&1
#
# Notebook command:
#   bash /opt/flagjourney/app/deploy/backup.sh
set -euo pipefail

APP_DIR="/opt/flagjourney/app"
BACKUP_ROOT="$APP_DIR/Backend/backups"
KEEP_DAYS="${KEEP_DAYS:-14}"
DATE="$(date +%Y-%m-%d_%H%M%S)"

log() { echo "[$(date '+%F %T')] $*"; }

mkdir -p "$BACKUP_ROOT"
cd "$APP_DIR/Backend"
set -a; source ./.env; set +a

log "1/2 DB dump (Supabase, TLS)"
pg_dump "$DATABASE_URL" --no-owner --no-privileges --format=custom \
  > "$BACKUP_ROOT/db_$DATE.dump"
log "   -> db_$DATE.dump"

log "2/2 Uploads archive (VPS disk)"
tar -czf "$BACKUP_ROOT/uploads_$DATE.tar.gz" -C "$APP_DIR/Backend/public" . 2>/dev/null || true
log "   -> uploads_$DATE.tar.gz"

log "Prune (>$KEEP_DAYS din purane)"
find "$BACKUP_ROOT" -name 'db_*.dump'            -mtime +"$KEEP_DAYS" -delete
find "$BACKUP_ROOT" -name 'uploads_*.tar.gz'     -mtime +"$KEEP_DAYS" -delete

# Offsite copy (optional). Ek baar:  rclone config  → Google Drive 15GB free
RCLONE_DEST="${RCLONE_DEST:-}"
if [ -n "$RCLONE_DEST" ] && command -v rclone >/dev/null 2>&1; then
  log "Offsite copy"
  rclone copy "$BACKUP_ROOT" "$RCLONE_DEST" --transfers 1
fi

log "Backup complete → $BACKUP_ROOT"