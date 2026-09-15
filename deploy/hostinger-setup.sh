#!/usr/bin/env bash
# hostinger-setup.sh  ── Hostinger VPS ke liye 1-time setup (Ubuntu 22.04/24.04)
#
# Usage:
#   1. Hostinger VPS purchase karo (Ubuntu 22.04/24.04, 4GB+ RAM)
#   2. SSH root se login: ssh root@<VPS_IP>
#   3. Ye script run karo:
#      REPO_URL=git@github.com:user/repo.git bash hostinger-setup.sh
#
set -euo pipefail

# ── CONFIG ──
REPO_URL="${REPO_URL:-}"
GIT_BRANCH="${GIT_BRANCH:-main}"
APP_DIR="/opt/flagjourney"
export DEBIAN_FRONTEND=noninteractive

log() { echo -e "\n\033[1;32m>> $*\033[0m"; }
error() { echo -e "\n\033[1;31mERROR: $*\033[0m"; exit 1; }

# ── VALIDATIONS ──
if [ "$(id -u)" -ne 0 ]; then error "Root se chalao: sudo -i"; fi
if [ -z "$REPO_URL" ]; then error "REPO_URL set karo: REPO_URL=git@github.com:user/repo.git bash hostinger-setup.sh"; fi

# ── HOSTINGER VPS DETECTION ──
log "0/9 Hostinger VPS detect kar raha hoon..."
if grep -qi "hostinger" /etc/hostname 2>/dev/null || [ -f /etc/hostinger-release ]; then
    log "   Hostinger VPS detected"
else
    log "   Hostinger VPS nahi laga (ya detection nahi hua) — proceeding anyway"
fi

# ── SYSTEM UPDATE ──
log "1/9 System update"
apt-get update -y
apt-get upgrade -y

# ── BASE TOOLS ──
log "2/9 Base tools install"
apt-get install -y \
    curl wget git unzip \
    build-essential \
    ca-certificates gnupg lsb-release \
    ufw \
    postgresql-client \
    htop net-tools

# ── NODE.JS 20 ──
log "3/9 Node.js 20 install"
if command -v node &>/dev/null && node -v | grep -q "v20"; then
    log "   Node.js 20 already installed: $(node -v)"
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    log "   Installed: $(node -v)"
fi

# ── PM2 ──
log "4/9 PM2 install"
if ! command -v pm2 &>/dev/null; then
    npm i -g pm2
fi
log "   PM2: $(pm2 -v)"

# ── NGINX ──
log "5/9 Nginx install"
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx

# ── CERTBOT (SSL) ──
log "6/9 Certbot install"
apt-get install -y python3-certbot-nginx

# ── FIREWALL ──
log "7/9 UFW firewall setup"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# ── GIT REPO CLONE ──
log "8/9 Git repo clone"
mkdir -p "$APP_DIR"

# SSH key setup (private repo ke liye)
if [[ "$REPO_URL" == git@* ]] && [ ! -f /root/.ssh/id_ed25519 ]; then
    ssh-keygen -t ed25519 -C "hostinger-vps-deploy" -N "" -f /root/.ssh/id_ed25519 >/dev/null 2>&1
    touch /root/.ssh/known_hosts
    ssh-keyscan github.com >> /root/.ssh/known_hosts 2>/dev/null || true
    
    cat <<EOF

╔══════════════════════════════════════════════════════════════╗
║  🚨 SSH DEPLOY KEY BAN GAYI — GitHub me add karo:         ║
║                                                              ║
║  Public key (copy karo):                                     ║
║  ─────────────────────────────────────────────────────────── ║
║  $(cat /root/.ssh/id_ed25519.pub)
║  ─────────────────────────────────────────────────────────── ║
║                                                              ║
║  GitHub → repo → Settings → Deploy keys → Add deploy key    ║
║  Title: "hostinger-vps"                                      ║
║  Key: (upar wali paste karo)                                 ║
║  Allow write access: NO → Add key                            ║
║                                                              ║
║  Phir ye script DOBARA chalao:                               ║
║  REPO_URL=$REPO_URL bash hostinger-setup.sh                 ║
╚══════════════════════════════════════════════════════════════╝
EOF
    exit 0
fi

# Clone or pull
if [ -d "$APP_DIR/app/.git" ]; then
    log "   Repo already exists, pulling latest..."
    git -C "$APP_DIR/app" pull
else
    GIT_SSH_COMMAND="ssh -o StrictHostKeyChecking=no" git clone -b "$GIT_BRANCH" "$REPO_URL" "$APP_DIR/app"
fi

# ── ENV FILES SCAFFOLD ──
for f in Backend frontend; do
    if [ ! -f "$APP_DIR/app/$f/.env" ] && [ -f "$APP_DIR/app/$f/.env.example" ]; then
        cp "$APP_DIR/app/$f/.env.example" "$APP_DIR/app/$f/.env"
        log "   Created $APP_DIR/app/$f/.env (EDIT KARO!)"
    fi
done

# ── NPM INSTALL ──
log "9/9 npm install (backend + frontend)"
cd "$APP_DIR/app/Backend"
npm install
cd "$APP_DIR/app/frontend"
npm install

# ── COMPLETE ──
echo
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  ✅ HOSTINGER VPS SETUP COMPLETE!                           ║"
echo "║                                                              ║"
echo "║  NEXT STEPS:                                                 ║"
echo "║                                                              ║"
echo "║  1. .env files edit karo:                                    ║"
echo "║     nano /opt/flagjourney/app/Backend/.env                         ║"
echo "║     nano /opt/flagjourney/app/frontend/.env                        ║"
echo "║                                                              ║"
echo "║  2. Deploy karo:                                             ║"
echo "║     bash /opt/flagjourney/app/deploy/deploy-app.sh                 ║"
echo "║                                                              ║"
echo "║  3. DNS setup karo (Hostinger hPanel → DNS):                 ║"
echo "║     A  flagjourneys.com  → <VPS_IP>                         ║"
echo "║     A  api.flagjourneys.com → <VPS_IP>                      ║"
echo "║     A  www               → <VPS_IP>                         ║"
echo "║                                                              ║"
echo "║  4. SSL setup (DNS point hone ke baad):                      ║"
echo "║     certbot --nginx -d flagjourneys.com -d www.flagjourneys.com -d api.flagjourneys.com --redirect --agree-tos -m aap@email.com"
echo "║                                                              ║"
echo "║  5. Backup cron add karo:                                    ║"
echo "║     crontab -e → 0 3 * * * bash /opt/flagjourney/app/deploy/backup.sh >> /var/log/flagjourney-backup.log 2>&1"
echo "╚══════════════════════════════════════════════════════════════╝"
