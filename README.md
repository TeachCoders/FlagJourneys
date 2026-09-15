# Flag Journeys — Travel Booking Platform

Full-stack travel platform: public holiday-package website + admin dashboard + sales/booking backend.

| Layer | Tech | Folder |
|---|---|---|
| Frontend | Next.js 16 (Turbopack), React 19, Tailwind 4, shadcn/ui, TanStack Query | `frontend/` |
| Backend | Express 5, Prisma 7 (PostgreSQL), express-session + connect-pg-simple, Zod, Multer, Puppeteer (PDF), Nodemailer | `Backend/` |
| Database | PostgreSQL | `arushka_holidays_db` |
| Image tooling | sharp | root `package.json` |

---

## Quick start (local)

### 1. Database

PostgreSQL chahiye. DB banayein:

```bash
psql -U postgres -c "CREATE DATABASE arushka_holidays_db;"
```

### 2. Backend

```bash
cd Backend
npm install
cp .env.example .env        # phir .env me real values bharein
npx prisma migrate deploy   # migrations apply karein
npm run dev                 # http://localhost:5000
```

Backend start par superadmin seed hota hai (`.env` ke `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` se).

### 3. Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # (abhi .env.local manually banayein — template: frontend/.env.example)
npm run dev               # http://localhost:3000
```

> Frontend `.env.example` dekh kar `NEXT_PUBLIC_API_BASE_URL` etc. apne `.env.local` me rakhein.

---

## Environment variables

### Backend `.env` — sab required

| Var | Example | Purpose |
|---|---|---|
| `PORT` | `5000` | Backend port |
| `DATABASE_URL` | `postgresql://postgres:password@localhost:5432/arushka_holidays_db` | PostgreSQL DSN |
| `EMAIL_ID` / `EMAIL_PASSWORD` | — | Gmail SMTP (app password) — quotes/otp bhejne ke liye |
| `OWNER_EMAIL` / `OWNER_MOBILE` / `SALES_MOBILE` | — | Contact info, emails me use hota hai |
| `BASE_URL` | `http://localhost:5000` | Absolute URL prefix — image URLs me use hota hai |
| `BRAND_NAME` / `SITE_URL` / `BOOKING_PORTAL_URL` | — | Branding / links |
| `SESSION_SECRET` | — | Session signing (production me strong/random rakhein) |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | — | First super-admin account |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed dashboard origin |
| `NODE_ENV` | `development` / `production` | `production` me `trust proxy` + secure cookies on |
| `WEBHOOK_URL` | — | External notifications (Make.com / Zapier / WhatsApp API) |
| `DEFAULT_ASSIGNEE_EMAIL` | — | Lead auto-assign partner (user email, role `sales`) — khali to no auto-assign |
| `CHAT_PARTNER_NUMBER` | `919136739178` | Widget "Continue on WhatsApp" handoff number (bina `+`) |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_IDS` | — | Optional Telegram alerts for new chats (₹0) |

### Frontend `.env.local`

| Var | Example | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:5000` | Backend base URL |
| `NEXT_PUBLIC_BRAND_NAME` | `Flag Journey` | Branding |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Public site URL |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `919136739178` | WhatsApp deep links |
| `NEXT_PUBLIC_SALES_PHONE` | `+918447273005` | Sales contact |
| `NEXT_PUBLIC_CHAT_PARTNER_NUMBER` | `919136739178` | Chat widget WhatsApp handoff (empty → `NEXT_PUBLIC_WHATSAPP_NUMBER` fallback) |

---

## Common commands

```bash
# Backend
cd Backend && npm run dev                 # nodemon dev server
cd Backend && npx prisma migrate dev      # naya migration banaye + apply (dev)
cd Backend && npx prisma migrate deploy   # prod me migrations apply
cd Backend && npx prisma studio           # DB UI

# Frontend
cd frontend && npm run dev                # dev server
cd frontend && npm run build              # production build
cd frontend && npm run start              # serve build
cd frontend && npm run lint               # eslint

# Tests
cd Backend && npm test                    # node:test suite (validation, upload security)

# DB backup / restore
Backend/scripts/backup-db.sh              # pg_dump backup -> backups/
Backend/scripts/restore-db.sh backups/<file>.sql   # restore
```

---

## Repo hygiene (zaroori)

- **`.env` / secrets kabhi commit nahi** — `.gitignore` handles karta hai.
- **Uploads `Backend/public/`** (passports, payment slips, generated PDFs) runtime data hain — commit nahi hote.
- **`back.zip` (898MB) jaise archives delete karein** — folder me secret leak ka risk.
- Backend abhi **git repo nahi hai** — `git init` + first commit karne ki strongly zaroorat hai (deploy/rollback ke liye).

---

## Deployment notes (jab target decide ho)

1. `NODE_ENV=production`, `CORS_ORIGIN` = real dashboard domain.
2. Frontend aur backend **same registrable domain** par rakhein (e.g. `flagjourneys.com` + `api.flagjourneys.com`) — dashboard images ke session cookies `SameSite=Lax` chahiye.
3. `npx prisma migrate deploy` prod DB par chalein.
4. `BASE_URL` real domain set karein, phir `node scripts/fix_image_urls.mjs --apply` chala ke DB ke localhost image URLs fix karein.
5. Gmail app password (`.env` wala) deploy se pehle **rotate** karein.

---

## Monitoring

### 1. In-app logging (koi account nahi chahiye — chalu hai)
- Har request `Backend/logs/<YYYY-MM-DD>.log` me log hoti hai (method, URL, status, duration, IP). `4xx` → WARN, `5xx` → ERROR.
- Unhandled errors/rejections bhi isi file me aate hain.
- `/health` — DB + uptime + memory check (uptime monitor / load balancer ke liye).

### 2. Sentry (error tracking — optional, abhi off hai)
1. [sentry.io](https://sentry.io) par free account banao, naya **Node.js** project → DSN copy karo.
2. Backend: `.env` me `SENTRY_DSN=<dsn>` → restart. Errors ab Sentry dashboard me aayenge.
3. Frontend: `.env.local` me `NEXT_PUBLIC_SENTRY_DSN=<dsn>` → `npm run build` phir deploy.
4. DSN nahi hai to code no-op rehta hai — koi error nahi.

### 3. Uptime Kuma (uptime alerts — chalu hai, Docker)
- `monitoring/docker-compose.yml` — UI: `http://localhost:3001`
- Setup: `docker compose -f monitoring/docker-compose.yml up -d`
- Browser me pehle admin account banayein, phir Monitor → HTTP(s) → `http://<API>:5000/health`
- Notification add karein (WhatsApp / Telegram / Email) taaki site down hote hi alert mile.

---

## Website chat system (₹0)

Public site par ek floating **chat widget** hai jo tourist ka **naam + WhatsApp number** leta hai aur ek rule-based
bot (koi paid API nahi) se unse destination/date/travellers/budget collect karta hai. Conversation se ek **lead**
auto-create hota hai aur partner (sales user) ko email/Telegram alert jaata hai. Partner dashboard ke **Chat Inbox**
me reply karta hai — saare messages DB (`chat_messages`) me save hote hain.

### Flow
1. Tourist widget kholta hai → naam + number daalta hai → `/chat/start` → bot 4 questions poochta hai
   (destination → travel date → travellers → budget). Har answer ek lead field ban jaata hai.
2. FAQ module: tourist jab bhi kuch pooche, common questions (`answerFaq`) ka instant answer milta hai —
   best time to visit, visa, currency, hotels, khaana, safety, tour types, booking — **kahi se bhi koi price nahi bataya jaata.**
   Price/cost/rate wale sawaal → *"custom quote expert se mila — 24h me contact hoga"*.
3. Partner online ho (dashboard `chatAvailable` ON) to widget dikhata hai "expert will join here", warna
   "we'll contact you within 24h" — availability sirf internal hai, tourist ko negative feel nahi aati.
4. Partner dashboard → **Chat Inbox** (`/dashboard/chat`) me conversation list + thread + reply. Tourist
   widget 4s polling se partner ka reply turant dekh leta hai.
5. Widget par "Continue on WhatsApp" button tourist ko partner ke personal number par bhejta hai
   (`CHAT_PARTNER_NUMBER`).

### Setup
```bash
cd Backend
node scripts/seedChatFaqs.js          # 25 FAQ seed (upsert — baar baar chala sakte hain)
```

`.env` (backend): `CHAT_PARTNER_NUMBER` (tourist handoff), `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_IDS`
(optional — naye chat ka instant alert). `frontend/.env.local`: `NEXT_PUBLIC_CHAT_PARTNER_NUMBER`.

### Endpoints
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/chat/start` | public | widget start (naam+number → bot) |
| POST | `/chat/:token/messages` | public (token) | tourist message send (bot reply milega) |
| GET | `/chat/:token/messages?since=` | public (token) | polling — naye messages |
| GET | `/chat/conversations` | dashboard | inbox list |
| GET | `/chat/conversations/:id` | dashboard | thread detail |
| POST | `/chat/conversations/:id/reply` | dashboard | partner reply |
| GET/PATCH | `/chat/availability` | dashboard | chatAvailable toggle |

> Schema: `ChatConversation` (token, botState, needsData), `ChatMessage` (direction in/out), `ChatFaq`
> (keyword + answer). DB sync ke liye `npx prisma db push` use hota hai (migrations + `db push` ka
> shadow replay abhi broken hai — `migrate dev` DB reset kar dega, isliye nahi chalana).

### Level 2 (jab budget mile — WhatsApp Business API)
- Welcome template (24h window) + tourist ko WhatsApp par asli partner chat — SIM ~₹200–500/month + per-template fees.
- Notification/transactional WhatsApp alerts ke liye `WEBHOOK_URL` pehle se ready hai.
- Data `monitoring/kuma-data/` me (backup karein).
