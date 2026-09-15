# Hostinger VPS Deploy — Flag Journeys

> Ye guide specifically **Hostinger VPS** pe deploy karne ke liye hai.
> (Pehle se VPS ready ho to `deploy/README.md` ka poora general guide bhi dekho.)

---

## 📦 Hostinger VPS Purchase (agar abhi nahi liya)

1. **hostinger.com** → **VPS Hosting** → koi bhi plan (recommend: **4GB RAM** wala, Ubuntu 22.04/24.04 OS)
2. OS = **Ubuntu 22.04 LTS** (ya 24.04) — Node.js 20 + nginx chalenge
3. Data center region: koi bhi (India customers ke liye Singapore/Mumbai best — international ke liye EU/US)
4. Login method: **SSH key** use karo (Hostinger hPanel mein apni public key add karo)
   - Local par: `ssh-keygen -t ed25519` → copy `.pub` file
5. VPS ready hone ke baad IP + root password (ya key) milega

---

## 🚀 Setup Steps (1 baar)

### Step 1 — SSH login

```bash
ssh root@<VPS_IP>
```

(ya Hostinger app/terminal se)

### Step 2 — Setup script upload + run

Script locally copy karke upload karo:

```bash
# Local (apne computer) se:
scp deploy/hostinger-setup.sh root@<VPS_IP>:/tmp/

# VPS par:
ssh root@<VPS_IP>
chmod +x /tmp/hostinger-setup.sh
REPO_URL=git@github.com:user/repo.git bash /tmp/hostinger-setup.sh
```

> 💡 Agar repo **public** hai to `https://github.com/user/repo.git` use karo (mirror URL).
> Private repo pe pehli baar SSH deploy key banegi — usko GitHub → Settings → Deploy keys mein add karo, phir dobara run karo.

Script install karega:
- System update + base tools
- Node.js 20 + PM2
- Nginx + Certbot
- UFW firewall (22/80/443)
- Repo clone `/opt/flagjourney/app`
- `.env` files scaffold

### Step 3 — .env files bharo

```bash
nano /opt/flagjourney/app/Backend/.env
nano /opt/flagjourney/app/frontend/.env
```

Production values (`deploy/README.md` Step 2 mein pura detail hai):
- Backend: `DATABASE_URL` (Supabase), `SESSION_SECRET`, `BASE_URL=https://api.flagjourneys.com`, `CORS_ORIGIN=https://flagjourneys.com`, Supabase storage keys
- Frontend: `NEXT_PUBLIC_API_BASE_URL=https://api.flagjourneys.com`, `API_BASE_URL=https://api.flagjourneys.com`, `NEXT_PUBLIC_SITE_URL=https://flagjourneys.com`

### Step 4 — Deploy

```bash
bash /opt/flagjourney/app/deploy/deploy-app.sh
```

Ye karega: DB migrate → frontend build → PM2 start (backend:5000 + frontend:3000) → nginx + SSL.

---

## 🌐 DNS (Hostinger hPanel)

Hostinger **hPanel → Domains → `<apna-domain>` → DNS/Nameservers** mein:

```
A       flagjourneys.com    →  <VPS_IP>
A       api.flagjourneys.com →  <VPS_IP>
A       www                   →  <VPS_IP>        (ya CNAME → flagjourneys.com)
```

DNS propagate hone par (30 min – 24 hr) SSL lagao:

```bash
certbot --nginx -d flagjourneys.com -d www.flagjourneys.com -d api.flagjourneys.com \
  --redirect --agree-tos -m aap@email.com
```

---

## ✔️ Verify

```bash
curl https://api.flagjourneys.com/health
```

Browser mein open karo:
- `https://flagjourneys.com`  → site
- `https://api.flagjourneys.com/health` → `{"ok":true}` wala JSON

---

## 🔄 Deploy (har baar badalav ke baad)

```bash
ssh root@<VPS_IP>
bash /opt/flagjourney/app/deploy/deploy-app.sh    # pull + migrate + build + restart
```

Ya shortcut:
```bash
pm2 logs flagjourney-backend
pm2 restart all
```

---

## 💾 Backup cron

```bash
crontab -e
# add:
0 3 * * * bash /opt/flagjourney/app/deploy/backup.sh >> /var/log/flagjourney-backup.log 2>&1
```

(Offsite ke liye rclone — `backup.sh` mein `RCLONE_DEST` → Google Drive)

---

## ⚠️ Hostinger-Specific Notes

| Cheez | Note |
|---|---|
| **VPS + domain alag** | Domain Hostinger se ho aur VPS bhi Hostinger se ho to aap hPanel mein sab manage kar sakte ho |
| **SSH key** | Purchase ke waqt SSH key add karo — password login band rehne deta hai |
| **Nginx default page** | Agar `flagjourneys.com` default nginx page dikhaya to DNS still pointing nahi — wait + nginx reload |
| **RAM** | 4GB+ recommend. Chhota plan ho to `NODE_OPTIONS="--max-old-space-size=2048"` wala build flag deploy-app.sh mein already hai |
| **Email** | VPS par SMTP (Gmail/Brevo) use karo, VPS ki IP reputation pe depend na karo — `deploy/README.md` "Branded email" section |

---

## 🔗 Reference

- General deploy/backup/migration docs: `deploy/README.md`
- Setup script: `deploy/hostinger-setup.sh`
- Deploy script: `deploy/deploy-app.sh`
