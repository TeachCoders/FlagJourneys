#!/usr/bin/env bash
# setup-vps.sh  ── 1 baar chalao (fresh Ubuntu 24.04 VPS par, root login)
#
# Notebook command:
#   bash /tmp/setup-vps.sh
# (upar REPO_URL edit karke)
set -euo pipefail

# ── EDIT THIS ──
REPO_URL="${REPO_URL:-}"            # e.g. git@github.com:you/flagjourney.git (private → SSH URL)
GIT_BRANCH="${GIT_BRANCH:-main}"
# ───────────────

APP_DIR="/opt/flagjourney"
export DEBIAN_FRONTEND=noninteractive

log() { echo -e "\n\033[1;32m>> $*\033[0m"; }

if [ "$(id -u)" -ne 0 ]; then echo "ERROR: root se chalao (sudo -i)"; exit 1; fi
if [ -z "$REPO_URL" ]; then echo "ERROR: script ke top par REPO_URL lagao"; exit 1; fi

log "1/8 System update"
apt-get update -y
apt-get upgrade -y

log "2/8 Base tools"
apt-get install -y curl ca-certificates gnupg build-essential git ufw postgresql-client

log "3/8 Node.js 20"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

log "4/8 PM2 + Prisma"
npm i -g pm2

log "5/8 Nginx + certbot (SSL)"
apt-get install -y nginx python3-certbot-nginx

log "6/8 Firewall (22, 80, 443)"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

log "7/8 Repo clone + env scaffolds"
mkdir -p "$APP_DIR"

# DEPLOY KEY — private repo ke liye. Pehli baar chalao to ek NEW SSH key banegi:
#   1) nice output copy karna
#   2) GitHub → repo → Settings → Deploy keys → Add → public key paste karna
#   3) phir script 2 baar chalao (key ready hone ke baad clone ho jayega)
if [ ! -f /root/.ssh/id_ed25519 ]; then
  ssh-keygen -t ed25519 -C "flagjourney-vps-deploy" -N "" -f /root/.ssh/id_ed25519 >/dev/null 2>&1
  touch /root/.ssh/known_hosts
  ssh-keyscan github.com >> /root/.ssh/known_hosts 2>/dev/null || true
  if [[ "$REPO_URL" == git@* ]]; then
    # Put this PUBLIC key into your repo's Deploy keys, then re-run this script.
    if command -v xclip >/dev/null 2>&1; then xclip -sel clip < /root/.ssh/id_ed25519.pub; fi
    cat <<EOF

===============================================================
 🚨 BUJH GAYI EK BAAT — DEPLOY KEY CHAHIYE aapke repo ke liye:

  Public key (niche / neeche copy karo):
---------------------------------------------------------------
 $(cat /root/.ssh/id_ed25519.pub)
---------------------------------------------------------------

  GitHub me jaao:
   repo → Settings → Deploy keys (Developer settings) → Add deploy key
   → Title: "flagjourney-vps"   Key: (upar wali paste karo)
   → Allow write access: NO (sirf read hi chahiye) → Add key

  Fir isi script ko DOBARA chalao (clone ho jayega):
   bash /tmp/setup-vps.sh
===============================================================
EOF
    exit 0
  fi
fi

if [ -d "$APP_DIR/app/.git" ]; then
  git -C "$APP_DIR/app" pull
else
  GIT_SSH_COMMAND="ssh -o StrictHostKeyChecking=no" git clone -b "$GIT_BRANCH" "$REPO_URL" "$APP_DIR/app"
fi
for f in Backend frontend; do
  if [ ! -f "$APP_DIR/app/$f/.env" ] && [ -f "$APP_DIR/app/$f/.env.example" ]; then
    cp "$APP_DIR/app/$f/.env.example" "$APP_DIR/app/$f/.env"
    echo "   created $APP_DIR/app/$f/.env  (EDIT KARO)"
  fi
done

log "8/8 npm install (backend + frontend)"
cd "$APP_DIR/app/Backend"
npm install
cd "$APP_DIR/app/frontend"
npm install

echo
echo "==============================================================="
echo " SETUP COMPLETE."
echo " NEXT:"
echo "   1) Edit .env files:"
echo "        nano /opt/flagjourney/app/Backend/.env"
echo "        nano /opt/flagjourney/app/frontend/.env"
echo "   2) Deploy:  bash /opt/flagjourney/app/deploy/deploy-app.sh"
echo "==============================================================="