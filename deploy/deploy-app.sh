#!/usr/bin/env bash
# deploy-app.sh  ── HAR deploy/badlao ke baad (VPS par, root). Idempotent.
#
# Notebook command:
#   bash /opt/flagjourney/app/deploy/deploy-app.sh
set -euo pipefail

APP_DIR="/opt/flagjourney/app"
OWNER_EMAIL="${OWNER_EMAIL:-}"     # certbot ke liye (optional)
DOMAIN="${DOMAIN:-flagjourneys.com}"
API_DOMAIN="${API_DOMAIN:-api.flagjourneys.com}"

log() { echo -e "\n\033[1;32m>> $*\033[0m"; }

if [ "$(id -u)" -ne 0 ]; then echo "ERROR: root se chalao"; exit 1; fi

log "1/5 Pull latest code"
git -C "$APP_DIR" pull

log "2/5 Backend: env check + database migrate"
cd "$APP_DIR/Backend"
set -a; source ./.env; set +a
: "${DATABASE_URL:?ERROR: Backend/.env me DATABASE_URL set karo}"
: "${SESSION_SECRET:?ERROR: Backend/.env me SESSION_SECRET set karo}"
npx prisma migrate deploy
npx prisma generate
pm2 delete flagjourney-backend >/dev/null 2>&1 || true

log "3/5 Frontend: production build"
cd "$APP_DIR/frontend"
export NODE_OPTIONS="--max-old-space-size=2048"
# BFF: client calls same-origin /api — browser ke Network tab me API subdomain
# (api.flagjourneys.com) kabhi na dikhe. (NEXT_PUBLIC_ vars ko .env.local
# override nahi kar sakti kyunki ye pehle se process.env me set hai.)
export NEXT_PUBLIC_API_BASE_URL="/api"
npm run build

log "4/5 PM2 start (backend :5000, frontend :3000)"
cd "$APP_DIR"
pm2 delete flagjourney-frontend >/dev/null 2>&1 || true
pm2 start "$APP_DIR/deploy/ecosystem.config.cjs"
pm2 save
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true

log "5/5 Nginx + SSL"
# Scanner-block snippet ko hamesha sync karo (nginx.conf ko overwrite mat karo —
# usme certbot SSL/redirect blocks ho sakte hain).
cp "$APP_DIR/deploy/block-scanners.conf" /etc/nginx/block-scanners.conf
if [ ! -f "/etc/nginx/sites-available/flagjourneys" ]; then
  cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/flagjourneys
  ln -sf /etc/nginx/sites-available/flagjourneys /etc/nginx/sites-enabled/flagjourneys
  rm -f /etc/nginx/sites-enabled/default
else
  # Pehle se install hain → sirf include line inject karo (certbot SSL blocks safe rahenge).
  if ! grep -q "block-scanners" /etc/nginx/sites-available/flagjourneys; then
    sed -i 's#\(server_name [^;]*;\)#\1\n    include /etc/nginx/block-scanners.conf;#' /etc/nginx/sites-available/flagjourneys
  fi
fi
nginx -t && systemctl reload nginx
sleep 2 && pm2 restart all >/dev/null 2>&1 || true

if [ -z "$OWNER_EMAIL" ]; then
  echo
  echo " NOTE: SSL ke liye ek baar chalao (domain DNS point hone ke baad):"
  echo "   certbot --nginx -d $DOMAIN -d www.$DOMAIN -d $API_DOMAIN --redirect --agree-tos -m aap@email.com"
else
  certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" -d "$API_DOMAIN" \
    --redirect --non-interactive --agree-tos -m "$OWNER_EMAIL" || \
    echo "   CERTBOT try hua par fail (shayad DNS point nahi hua). Baad me dobara chalana."
fi

echo
echo "==============================================================="
echo " DONE."
echo "   Backend logs : pm2 logs flagjourney-backend"
echo "   Health check : curl https://$API_DOMAIN/health"
echo "==============================================================="