# Architecture — Flag Journeys

## High-level

```
Browser (public site / booking / dashboard)
        │  HTTPS
        ▼
Next.js 16 frontend (frontend/)  ── axios ──▶  Express 5 backend (Backend/)
                                                    │
                                       ┌────────────┼──────────────┐
                                       ▼            ▼              ▼
                                   PostgreSQL  Puppeteer        Gmail SMTP
                                   (Prisma 7)  (PDF quotes)    (Nodemailer)
```

- Frontend = public marketing site + booking portal + admin dashboard (single Next app, route groups).
- Backend = single Express server: REST API + static file serving (`public/`) + cron jobs.
- Auth = session cookie (`express-session`) stored in **Postgres** via `connect-pg-simple` (shared/session table).

---

## Folder structure

### Backend (`Backend/`)

```
index.js                  # Entry — middlewares, session, rate limits, routes, static
router/                   # Express routers (one per module)
controllers/              # Shared logic: auth helpers, email, PDF, upload, cron
utils/                    # uploadImage (multer), prismaConnection, validation (zod schemas)
middleware/               # requireSalesOrAdmin, requireSuperAdmin, verifySession, etc.
prisma/schema.prisma      # Data models
prisma/migrations/        # Applied migrations
scripts/                  # One-off/ops scripts (backup, data fixes) — debug-* are scratch
tests/                    # node:test suite — run with `npm test`
public/                   # RUNTIME uploads — documents/, user/, quotations/, journey media etc.
                           #  ⚠ Never commit. Served statically.
```

Route mounting order (matters):

```
cors → session (PgStore) → private-uploads guard → rate limiters
     → express.json/urlencoded (10mb) → routers → express.static(public)
```

**Upload security rule:** `public/documents/` aur `public/user/` sirf logged-in admin/vendor ke liye serve hote hain (middleware `requireSalesOrAdmin` + `res.sendFile`). `public/quotations/` public hai (WhatsApp share ke liye).

### Frontend (`frontend/src/`)

```
app/
  (site)/          # Public marketing pages (holiday packages, blogs, CMS)
  (public)/        # Public content pages
  (dashboard)/     # Admin dashboard (auth-protected layout)
  booking/         # Public booking portal
  packages/        # Holiday package listing/detail
feature/           # One folder per domain: auth, leadFolup, tourPackages, payments,
                   #  travellers, vendors, destinations, travelExperience, journey, ...
components/
  ui/              # shadcn/ui primitives
  shared/          # Shared widgets
  providers/       # Query client, theme, etc.
```

---

## Auth model

- Roles: **superadmin / admin / sales / vendor** (Teams table + `role`).
- Login → `POST /auth/login` → session cookie set.
- Middleware guards:
  - `requireSalesOrAdmin` — `/documents`, `/user` files, most dashboard routes.
  - `authLimiter` — brute-force protection on `/auth`.
  - Vendor portal uses per-vendor access (vendor routes).
- Sessions persist in Postgres `session` table → survives restarts, multi-instance safe.

---

## Data model (Prisma) — core entities

| Domain | Models |
|---|---|
| Users & team | `Users`, `Teams`, `Notification` |
| Sales pipeline | `Traveller` (lead), `FollowupNote`, `TravellerDocument`, `TravellerRequirementConfirmation` |
| Bookings | `TourBooking`, `VehicleBooking`, `Invoice`, `InvoiceItem`, `Payment`, `PaymentInstallment`, `VendorPayment` |
| Vendors | `VendorGroup`, `Vendor`, `VendorAssignment`, `VendorType`, `EngagementModel` |
| Content | `Country`, `State`, `City`, `Season`, `TravelExperience`, `Faq`, `Journey`, `JourneyDay`, `WhyChoose`, `Inclusion`, `Exclusion`, `BookingPolicy`, `CmsPage`, `BlogPost`, `BlogCategory` |
| Assets | `Media`, `Banner`, `TourPackage` |

Enums: `BookingStatus`, `service`, `PaymentType`, `PaymentMethod`, `PaymentStatus`, `BannerEntityType`, `FaqEntityType`.

---

## API map (main routes)

All under `http://<host>:5000`.

| Module | Routes (prefix) | Notes |
|---|---|---|
| Auth | `/auth` — `login`, `logout`, `me`, `seed` | rate-limited |
| Leads | `/traveller-lead` — CRUD, `assign`, `notes`, `status`, `documents`, `requirements`, `send-email` | public POST rate-limited + zod |
| Tour bookings | `/tour-booking` | public POST rate-limited + zod |
| Vehicle bookings | `/vehicle-booking` | public POST rate-limited + zod |
| Quote builder | `/package-builder/lead/:id` — packages, `generate-pdf`, `send-invoice`, `invoice-preview` | PDF → `public/quotations/` |
| Payments | `/traveller-payment`, `/vendor-payment` | status workflows |
| Vendors | `/vender`, `/vendor-group`, `/vendor-assignment` | assignment logic |
| Content | `/country`, `/state`, `/city`, `/season`, `/holidays`, `/journey`, `/tour-packages`, `/cms`, `/blog`, `/blog-category` | mostly read-public, write-admin |
| Users/team | `/user`, `/teams` | |
| Notifications | `/notifications` | |
| Media | `/media` | search/delete |
| Image proxy | `/proxy-image` | SSRF-protected remote image fetcher |
| Upload | `/upload` | multer + folder allowlist + 10mb body limit |
| Health | `/health` | liveness |

---

## Cron jobs

Defined in `controllers/cronJobs.js` (node-cron) — registered on server start.

## Monitoring

- **Logging** — `utils/logger.js`: har request + unhandled errors → `Backend/logs/<date>.log` (4xx WARN / 5xx ERROR).
- **Health** — `GET /health`: DB check + uptime + memory (probe-friendly).
- **Sentry** — optional (`SENTRY_DSN` backend, `NEXT_PUBLIC_SENTRY_DSN` frontend). No-op jab DSN missing.
- **Uptime Kuma** — `monitoring/docker-compose.yml` (port 3001), monitors `/health`, alerts via WhatsApp/Telegram/Email.

## Ops scripts (`Backend/scripts/`)

| Script | Purpose |
|---|---|
| `backup-db.sh` | `pg_dump` → timestamped `.sql` |
| `restore-db.sh` | restore from a backup file |
| `fix_image_urls.mjs` | replace localhost BASE_URL in DB image fields (dry-run by default, `--apply`) |
| `move_quotation_pdfs.mjs` | move old quotation PDFs into `public/quotations/` |

---

## Key invariants / gotchas

1. **`BASE_URL` (`.env`)** controls absolute image URLs stored in DB. Local dev uses `http://localhost:5000`; **production must change it** and run `fix_image_urls.mjs --apply`.
2. **Same-domain cookie requirement** — frontend/backend same registrable domain, `SameSite=Lax`, so dashboard `<img src>` cookies work.
3. **`public/` is runtime data** — deleting files there deletes user uploads/documents.
4. **`/user` collision** — the `/user` API router and `public/user/` uploads share the path; upload guard only intercepts real files.
5. Gmail `EMAIL_PASSWORD` is an **app password**, not the Gmail login password.
