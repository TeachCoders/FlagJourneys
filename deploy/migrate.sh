#!/usr/bin/env bash
# migrate.sh  ── BigRock → Hostinger move (saal 3, jab business chale).
# Ye script SIRF guide hai — commands step-by-step, apne notebook me rakho.
set -euo pipefail

log() { echo -e "\n\033[1;33m>> $*\033[0m"; }

echo "OK. Migrate guide (documented steps):"

log "OLD server (BigRock) — last backup"
echo "  ssh root@<OLD_IP>"
echo "  bash /opt/flagjourney/app/deploy/backup.sh"
echo "  # backup file: /opt/flagjourney/app/Backend/backups/db_*.dump + uploads_*.tar.gz"
echo "  # private documents (documents/, user/) ho to:"
echo "  tar -czf /tmp/private_$(date +%F).tar.gz -C /opt/flagjourney/app/Backend/public documents user"
echo "  scp /tmp/private_*.tar.gz root@<NEW_IP>:/tmp/"

log "NEW server (Hostinger) — base setup"
echo "  ssh root@<NEW_IP>"
echo "  (setup-vps.sh me REPO_URL set karke) bash setup-vps.sh"
echo "  nano /opt/flagjourney/app/Backend/.env       # DATABASE_URL wahi Supabase ka, SESSION_SECRET naya random"
echo "  nano /opt/flagjourney/app/frontend/.env      # wahi public URLs"
echo "  bash /opt/flagjourney/app/deploy/deploy-app.sh"

log "Extra: private documents ==>
echo "  ssh root@<NEW_IP>"
echo "  cd /opt/flagjourney/app/Backend && mkdir -p public && tar -xzf /tmp/private_*.tar.gz -C public"

log "DNS switch (30-60 min me live)"
echo "  BigRock DNS panel: A/@ → <NEW_IP>   A/api → <NEW_IP>"

log "Purana server band (2-3 din confirm ke baad)"
echo "  Uptime monitor: https://api.<DOMAIN>/health"

echo
echo "NOTE: data + public images SUPABASE me hain — unko kabhi copy nahi karna."
echo "Sirf app redeploy hua. Private docs ek baar copy hote hain."