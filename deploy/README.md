# Deploy — Flag Journeys (Production)

Final stack decided:

| Cheez | Kahan | Cost |
|---|---|---|
| **Database (PostgreSQL)** | Supabase (FREE, Mumbai region) | ₹0 |
| **Images/PDF (public)** | Supabase Storage (FREE 1GB bucket) | ₹0 |
| **Private docs** (passports/payment slips) | VPS disk + backup | — |
| **VPS (app)** | BigRock 4GB VPS (2-saal) | ~₹9,884 |
| **Domain** | Hostinger `flagjourneys.com` (3-saal, ₹1/1st yr deal) | ~₹3,600 |
| **Branded email** | Brevo SMTP free (app send, 300 emails/day) | ₹0 |
| **Code** | Aapki git repo | git me |

> **Bahut zaroori rule:** images ka URL **Supabase public bucket** se aata hai (permanent,
> sab jagah khulne wala), lekin site par **apne domain ke niche** dikhta hai
> (`flagjourneys.com/content/...` → nginx / Next rewrite → Supabase CDN).
> Passports/payment slips **kabhi** public bucket me nahi — wo VPS par protected + backup.

---

## Step 0 — Purchases

1. **Supabase** — `supabase-setup.md` follow karo (free: DB + Storage + keys). Database connection string me `?sslmode=require`.
2. **BigRock VPS** — India Budget ya NVMe 4 profile, 4GB RAM, Ubuntu 24.04 OS select. 24-mahina (2-saal) term.
3. **Domain** `flagjourneys.com` — **Hostinger** se (3-saal term; spelling pakka karo: `holida**a**ys`). Purchase ke foran **auto-renewal OFF** karo (`hPanel → Profile → Billing → Subscriptions`).
4. **Branded email** (optional, ₹0) — niche "Branded email (Brevo)" section.

VPS milte hi niche se shuru karo.

---

## 📒 Notebook Copy — POORA COMMAND LIST (order me)

> Har command apne system (office ya personal) se chal sakti hai — sab `ssh` se hota hai.
> `<SERVER_IP>` = VPS ka IP, `<REPO_URL>` = aapki git repo.

```bash
# ── 1. VPS SETUP (1 baar) ──────────────────────────────
ssh root@<SERVER_IP>
apt update && apt install -y curl
# setup-vps.sh ke top par REPO_URL set karo, phir:
bash setup-vps.sh
#    → Node 20 + PM2 + Nginx + certbot + UFW + repo clone

# ── 2. .env FILES (hamesha ke liye) ────────────────────
nano /opt/flagjourney/app/Backend/.env
#   → DATABASE_URL (Supabase) / SESSION_SECRET / CSRF_SECRET /
#     BASE_URL=https://api.flagjourneys.com / CORS_ORIGIN=https://flagjourneys.com /
#     SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / STORAGE_BACKEND=supabase /
#       EMAIL_ID+EMAIL_PASSWORD (+ SMTP_HOST/SMTP_PORT) / OWNER_EMAIL / CHAT_PARTNER_NUMBER
#       (branded send ke liye Brevo — "Branded email" section dekho)
nano /opt/flagjourney/app/frontend/.env
#   → NEXT_PUBLIC_API_BASE_URL=https://api.flagjourneys.com /
#     API_BASE_URL=https://api.flagjourneys.com /
#     NEXT_PUBLIC_SITE_URL=https://flagjourneys.com

# ── 3. DEPLOY (har badlaav par) ────────────────────────
bash /opt/flagjourney/app/deploy/deploy-app.sh
#    → migrate + build + PM2 + nginx + SSL

# ── 4. DNS (BigRock panel) ─────────────────────────────
#   A  flagjourneys.com  → <SERVER_IP>
#   A  api.flagjourneys.com → <SERVER_IP>
#   A  www               → <SERVER_IP>

# ── 5. SSL (DNS point hone ke baad, 1 baar) ────────────
certbot --nginx -d flagjourneys.com -d www.flagjourneys.com -d api.flagjourneys.com --redirect --agree-tos -m aap@email.com

# ── 6. BACKUP (cron auto) ──────────────────────────────
bash /opt/flagjourney/app/deploy/backup.sh
#   cron: 0 3 * * * bash /opt/flagjourney/app/deploy/backup.sh >> /var/log/flagjourney-backup.log 2>&1

# ── 7. ROJ-GO USE ──────────────────────────────────────
pm2 logs flagjourney-backend          # backend log
pm2 logs flagjourney-frontend         # frontend log
pm2 restart all                 # restart
curl https://api.flagjourneys.com/health   # health check
```

Security note: root password login band karo (setup me SSH key hi kafi), UFW 22/80/443.

---

## Branded email (Brevo — ₹0)

App branded send: **`leads@flagjourneys.com`** (Brevo free SMTP, 300 emails/day).
Zoho/Wasto mailbox nahi — **sirf sending Brevo se** (app ke emails OTP/quotes/payments).
Milo reply-only ho, inbox nahi — kaam me koi farak nahi padta.

1. **brevo.com** → signup (free) → **Sender Identity → Add domain** → `flagjourneys.com`
   → Bhargya TXT records: `brevo-code=...` + SPF `v=spf1 include:relay.brevo.com ~all` + DKIM
2. Wo records **Hostinger DNS** me add karo (ye 3-4 TXT + SPF).
3. Brevo me **Verify** dabao → domain verified (30 min lag sakta hai).
4. **SMTP & API → SMTP key** banao (ythir $ start hoti hai).
5. `Backend/.env` me:
   ```
   EMAIL_ID=leads@flagjourneys.com
   EMAIL_PASSWORD=<brevo-smtp-key>
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   BRAND_NAME=Flag Journeys
   ```
6. Backend restart + test email (1–3 sec) → From: "Flag Journey" <leads@flagjourneys.com>

> Brevo **VPS se independent** hai — abhi (local) bhi chalega, VPS deploy par same values.
> Free tier: 300 emails/day — bundle/OTP ke liye kaafi. Zoho/paid mailbox zaroori nahi.

---

## Step 1 — Server setup (1 baar)

SSH root login:

```bash
ssh root@<SERVER_IP>
apt install -y curl
bash <(curl -s https://<aapka-git-raw>/deploy/setup-vps.sh)
```

Ya file local copy kar ke:

```bash
scp deploy/setup-vps.sh root@<SERVER_IP>:/tmp/
ssh root@<SERVER_IP> "bash /tmp/setup-vps.sh"
```

Setup script (`deploy/setup-vps.sh`):
- Ubuntu update + Node 20 + PM2 + Nginx + Certbot + firewall (22/80/443)
- **Private repo**: pehli baar ek SSH deploy key banata hai → us public key ko
  GitHub → repo → Settings → Deploy keys par paste karo → script **dobara** chalao
- Repo clone karta hai `/opt/flagjourney/app`
- `.env` `example` → `.env` copy hota hai (baad me edit karna)

> Setup script vars (start me): `REPO_URL` (private ho to `git@github.com:you/repo.git`), `GIT_BRANCH`.

---

## Step 2 — .env files bharo

`/opt/flagjourney/app/Backend/.env` aur `/opt/flagjourney/app/frontend/.env` — `.env.example` ke hisaab se sab values bharo.

Backend `.env` production me yeh badalna:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres.<ref>:<PASSWORD>@db.<ref>.supabase.co:5432/postgres?sslmode=require
BASE_URL=https://api.flagjourneys.com
CORS_ORIGIN=https://flagjourneys.com
SITE_URL=https://flagjourneys.com
BOOKING_PORTAL_URL=https://booking.flagjourneys.com
SESSION_SECRET=<random 96 hex chars>
CSRF_SECRET=<random 96 hex chars> (SESSION_SECRET se alag rakho)
SEED_ADMIN_EMAIL=...
SEED_ADMIN_PASSWORD=...
OWNER_EMAIL=... OWNER_MOBILE=... SALES_MOBILE=...
CHAT_PARTNER_NUMBER=...

# Supabase Storage (images → cloud)
STORAGE_BACKEND=supabase
SUPABASE_URL=https://khgopfgebkkdlnwwoanx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... (service_role, secret!)
```

Frontend `.env`:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.flagjourneys.com
API_BASE_URL=https://api.flagjourneys.com
NEXT_PUBLIC_SITE_URL=https://flagjourneys.com
NEXT_PUBLIC_WHATSAPP_NUMBER=...
NEXT_PUBLIC_SALES_PHONE=...
```

> ⚠️ Frontend env build time me bake hota hai — galat value dalo to `deploy-app.sh` phir build karna padega.

## Step 3 — Deploy (migrate + build + start)

```bash
ssh root@<SERVER_IP> "bash /opt/flagjourney/app/deploy/deploy-app.sh"
```

Ye karega:
- `prisma migrate deploy` (Supabase par tables banate)
- Frontend production build
- PM2 start (backend :5000 + frontend :3000)
- Nginx conf generate (banner: `/content/...`, tour folders → **Supabase CDN** proxy bhi committed he)
- Certbot SSL (domain ready ho to)

## Step 3b — First boot extras

Pehli baar declare hui ek cheez: **uptime monitor**.
Live hote hi `https://api.flagjourneys.com/health` link kisi free monitor
(UptimeRobot/Uptime Kuma) par add kar lo — internet down ya server fail hone par email/WhatsApp alert milega.

## Step 3c — Seed images (finished)

Seed images `/destinationImage/...` repo me committed hain → **git clone ke saath
automatically VPS par aa jayengi**, alag se upload nahi karni. Bas first deploy ke baad
seed command chalao (agar repo me seed script hai) — README ke "seeds" section jaisa.

## Step 4 — DNS

Hostinger se domain DNS:
- `A  flagjourneys.com  -> <SERVER_IP>`
- `A  api.flagjourneys.com  -> <SERVER_IP>`
- `CNAME  www  -> flagjourneys.com` (optional)

Cloudflare free (optional): nameservers change karke CDN + HTTPS bhi mil jata hai — international tourists ke liye fast.

## Step 5 — Backups

```bash
ssh root@<SERVER_IP> "bash /opt/flagjourney/app/deploy/backup.sh"
```

Cron add karo (root `crontab -e`):

```
0 3 * * * root bash /opt/flagjourney/app/deploy/backup.sh >> /var/log/flagjourney-backup.log 2>&1
```

Backup = Supabase DB dump (pg_dump, TLS) + VPS disk `Backend/public` ka tar.
Note: public images Supabase Storage me hain (backup DB se pata chalta hai), private docs VPS par tar me hai.
Offsite ke liye rclone setup (`rclone config`) karke `backup.sh` me `RCLONE_DEST` bharo (Google Drive free 15GB).

---

## Migration (BigRock → Hostinger, jab business chale)

`migrate.sh` padho. Asli tarika:
1. Purane server par: `backup.sh` chalao (DB + uploads ka single archive milta hai `Backend/backups/`)
2. Naya server (Hostinger): setup-vps.sh + deploy-app.sh chalao (repos dosre-naye repo se parsed)
3. Supabase DB **wapas data nahi transfer** karna — data pehle se Supabase me hai. Sirf uploads copy hote hain.
4. DNS point karo → 30 min me live.

---

## Tips

- **Kisi bhi samay restart:** `pm2 restart all`
- **Logs:** `pm2 logs flagjourney-backend`
- **Uptime monitor:** `http://api.flagjourneys.com/health` (README ke Uptime Kuma section jaise)
- Security: root SSH password login band (setup par key use karo), UFW sirf 22/80/443.