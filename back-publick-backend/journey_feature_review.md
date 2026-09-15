# Journey Feature – Documentation & Final Review

## 📌 Overview
The **Journey** module represents a travel package (trip) that can be created, edited, listed, and soft‑deleted by **Super‑Admin** users. It is linked to **Country → State → City** hierarchy and to **Travel Experiences** and **Seasons**.

---

## 🗂️ Data Model (Prisma)
```prisma
model Journey {
  id                    Int                @id @default(autoincrement())
  title                 String
  slug                  String             @unique
  seoDescription        String
  overView              String?
  seoKeyword            String?
  canonical             String?
  seoTitle              String?
  h1Title               String?
  thumbImg              String?
  moreDescription       String?
  destination           String?
  duration              String?
  noDays                Int
  pricePerPerson        Float              @default(0)
  discountPrice         Float?
  highlights            String[]
  hotelDetails          Json?
  carDetails            Json?
  guideDetails          Json?
  isActive              Boolean            @default(true)
  isBestSelling         Boolean            @default(false)
  displayOrder          Int                @default(0)
  purchaseCount         Int                @default(0)
  createdById           Int?
  createdAt             DateTime           @default(now())
  updatedAt             DateTime           @updatedAt
  cities                City[]
  cityOrder             Int[]              @default([])
  travelExperienceOrder Int[]              @default([])
  months                Month[]
  travelExperiences     TravelExperience[]
  days                  JourneyDay[]
  inclusion             Inclusion[]
  exclusion             Exclusion[]
  whyChooseUs           WhyChoose[]
  bookingPolicy         BookingPolicy[]
}
```
Key relationships:
- `cities` → City[] (many‑to‑many via join table).
- `travelExperiences` → TravelExperience[].
- `months` → Month[].

---

## 📡 API Endpoints (REST)
| Method | URL | Description | Service | Prisma Model |
|--------|-----|-------------|---------|--------------|
| **POST** | `/api/journeys` | Create a new Journey (Super‑Admin only) | `journeyService.js` | `Journey` |
| **GET** | `/api/journeys` | List journeys – supports filters (`isActive`, `search`, pagination) | `journeyService.js` | `Journey` |
| **GET** | `/api/journeys/:id` | Retrieve full details of a Journey (incl. related cities, experiences) | `journeyService.js` | `Journey` |
| **PUT** | `/api/journeys/:id` | Update fields (partial updates allowed) | `journeyService.js` | `Journey` |
| **DELETE** | `/api/journeys/:id` | Soft‑delete (set `isActive = false`) | `journeyService.js` | `Journey` |

All routes are protected by `authMiddleware` + role‑check (`req.user.role === 'SUPER_ADMIN'`).

---

## 🎨 Front‑End Pages (React)
| Page | Route | Component | Main UI Elements |
|------|-------|-----------|-------------------|
| **Journey List** | `/admin/journeys` | `JourneyList.tsx` | Table with pagination, search, active toggle, Edit & Delete buttons |
| **Create / Edit Journey** | Modal from list (`/admin/journeys` → `JourneyForm.tsx`) | Form fields: title, slug, description, price, SEO fields, city multiselect, travel‑experience multiselect, month multiselect |
| **Journey Detail (Public)** | `/journeys/:slug` | `JourneyDetailPage.tsx` | Hero banner, itinerary (JourneyDay), inclusion/exclusion lists, booking CTA |

All admin pages use **React‑Query** for data fetching, **React Hook Form + Yup** for validation, and **Framer Motion** for smooth modal animations. Role‑based route guard (`<RequireRole role="SUPER_ADMIN"/>`) ensures only authorized users can access admin routes.

---

## ✅ Validation & Security
- **Server‑side**: `zod` schema in `journeyService.js` validates every field. Missing required fields return **400 Bad Request** with details.
- **Client‑side**: `Yup` mirrors the same rules (required strings, unique slug check via debounce API call).
- **Authorization**: `authMiddleware` verifies JWT; `roleCheck('SUPER_ADMIN')` blocks non‑admin attempts.
- **Rate‑limit**: Global limiter (express‑rate‑limit) already applied to `/api/*`.
- **Input sanitisation**: All string inputs are trimmed; HTML is escaped before storage.

---

## 🧪 Testing Strategy
| Layer | Tool | What is Tested |
|-------|------|----------------|
| **Unit** | `jest` + `ts-jest` | Service functions (`createJourney`, `updateJourney`, `softDelete`) – happy path & validation errors |
| **Integration** | `supertest` | Full request‑/response cycle for all CRUD endpoints, auth & role enforcement |
| **E2E (UI)** | `Cypress` | Admin flow: login → Journey List → Create → Verify in table → Edit → Delete → ensure UI reflects changes |
| **Performance** | `k6` (optional) | GET `/api/journeys` with 1000 records – response < 300 ms |

All tests are part of CI (GitHub Actions) and must achieve **>90 % coverage** for the journey module.

---

## 📦 Deployment Checklist
1. **Prisma Migration** – `prisma migrate deploy` (model already exists, just ensure migration history is up‑to‑date).
2. **Environment Variables** – `JWT_SECRET`, `DATABASE_URL`, `BASE_URL` set in production `.env`.
3. **Docker Image** – `Dockerfile` includes the new route (`journeyRouter`). Re‑build and push.
4. **CI/CD** – Add `journey.test.js` to the test matrix; ensure pipeline passes before promotion.
5. **Nginx/Reverse‑Proxy** – Certbot SSL for `https://<domain>` (Let’s Encrypt). Ensure `/admin/journeys` is only reachable over HTTPS.
6. **Log Rotation** – `winston-daily-rotate-file` already rotating; confirm `maxFiles: '30d'` for production.
7. **Health Endpoint** – `/health` returns `journeyService` status (simple DB ping).
8. **Feature Flag (optional)** – If you want to roll‑out gradually, wrap the admin routes with a `FEATURE_JOURNEY` flag.

---

## 📋 Final Review Checklist
- [ ] **Code Review** – PR merged with approvals from Lead Engineer and Security reviewer.
- [ ] **Linting** – `npm run lint` passes (ESLint + Prettier).
- [ ] **All Tests Pass** – `npm test` shows 0 failures, coverage ≥ 90 % for journey files.
- [ ] **Documentation Updated** – API doc (`api_overview.docx`), Front‑end page overview, and this review file are committed.
- [ ] **Staging Deploy** – Feature works on staging (`https://staging.example.com/admin/journeys`).
- [ ] **Production Deploy** – After staging sign‑off, merge to `main` and trigger production pipeline.
- [ ] **Post‑Deploy Smoke Test** – Verify:
    - Super‑Admin can create a journey.
    - Journey appears on the public `/journeys/:slug` page.
    - Soft‑deleted journeys no longer appear in admin list.
- [ ] **Monitoring** – Add a Grafana panel for `GET /api/journeys` latency.
- [ ] **Rollback Plan** – Keep previous Docker image tag; in case of failure, roll back via CI.

If every checkbox is ticked, the **Journey** feature is fully production‑ready.

---

## 📚 References
- **Prisma schema** – `prisma/schema.prisma` (Journey model lines 699‑739).
- **Service code** – `Backend/services/journeyService.js` (new file).
- **Router** – `Backend/routes/journeyRouter.js` (new file).
- **Frontend components** – `frontend/src/pages/admin/journeys/`, `frontend/src/components/forms/JourneyForm.tsx`.
- **Tests** – `Backend/tests/journey.test.js`, `frontend/cypress/integration/journey.spec.js`.

---

*Prepared by the development team on 2026‑08‑21. Ready for final QA sign‑off.*
