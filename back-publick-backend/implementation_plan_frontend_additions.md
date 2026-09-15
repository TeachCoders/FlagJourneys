# Front‑End Additions – Implementation Plan

## 🎯 Goal
Add missing UI & workflow for **Country → State → City → Journey → Travel‑Style** creation, filtering, a **site‑map**, **dashboards**, and **private pages** (PSE) so that both front‑end and back‑end are fully covered.

---

## 1️⃣ Backend Confirmation (already present)
| Entity | Required API (already exists) |
|--------|-------------------------------|
| Country | `POST /countries` – create |
| State   | `POST /states` – create (needs `countryId`) |
| City    | `POST /cities` – create (needs `stateId`) |
| Journey | *Missing* – add `POST /journeys` (service `journeyService.js`, Prisma model `Journey`) |
| Travel‑Style | *Missing* – add `POST /travel‑styles` (service `travelStyleService.js`, Prisma model `TravelStyle`) |

> **Action:** Verify those two new endpoints are added (or add them now). The checklist file will reference them.

---

## 2️⃣ Front‑End UI – Pages & Modals
| Feature | UI Component | Route | Key Elements |
|---------|--------------|-------|--------------|
| **Country Create** | `CountryForm.tsx` (modal) | `/admin/locations/countries` | Input: name, code; Submit → `POST /countries` |
| **State Create** | `StateForm.tsx` (modal) | `/admin/locations/states` | Dropdown: Country (fetch `/countries`); Input: name; Submit → `POST /states` |
| **City Create** | `CityForm.tsx` (modal) | `/admin/locations/cities` | Dropdown: State (fetch `/states?countryId=`); Input: name; Submit → `POST /cities` |
| **Journey Create** | `JourneyForm.tsx` (modal) | `/admin/journeys` | Fields: title, description, startDate, endDate, relatedCountry/State/City (multi‑select); Submit → `POST /journeys` |
| **Travel‑Style Create** | `TravelStyleForm.tsx` (modal) | `/admin/travel‑styles` | Input: styleName, icon (optional); Submit → `POST /travel‑styles` |
| **Filters** | `LocationFilters.tsx` (re‑usable) | Embedded on List pages (countries, states, cities, journeys) | Dropdowns for parent hierarchy, search box, clear button |
| **Site‑Map** | `SiteMap.tsx` (static page) | `/sitemap` | Tree view: Country → State → City → Journey → Travel‑Style (links to their public pages) |
| **Dashboard** | `AdminDashboard.tsx` | `/admin/dashboard` | Summary cards (total countries, states, cities, journeys, leads, payments), recent activity tables, quick‑links to create forms |
| **Private PSE Pages** | `PrivateLayout.tsx` + route guards | `/private/*` (e.g., `/private/reports`) | Auth middleware (`authMiddleware`), role‑based access (`admin`, `sales`) |

---

## 3️⃣ State Management (React)
- Use **React‑Query** (or **SWR**) for data fetching/caching.
- Centralise dropdown data in a **`locationContext`** providing `countries`, `statesByCountry`, `citiesByState`.
- After a successful create, **invalidateQueries** for the related list to refresh UI automatically.

---

## 4️⃣ Forms & Validation
- Use **React Hook Form** + **Yup** schema.
- Required fields: 
  - Country: `name`, `code`.
  - State: `name`, `countryId`.
  - City: `name`, `stateId`.
  - Journey: `title`, `startDate`, `endDate`, at least one location.
  - Travel‑Style: `name`.
- Show inline error messages and disable submit until valid.

---

## 5️⃣ API Service Layer (frontend)
Create a **`api.ts`** wrapper:
```ts
export const api = (method: string, url: string, body?: any) =>
  fetch(`/api${url}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  }).then(res => res.json());
```
Expose helpers: `createCountry`, `createState`, `createCity`, `createJourney`, `createTravelStyle`.

---

## 6️⃣ Routing (React Router / Next.js)
- Add **protected routes** for `/admin/**` and `/private/**` using a higher‑order component that checks JWT & required role.
- Public pages (site‑map, journey detail) stay unprotected.

---

## 7️⃣ Styling & UX (Premium Look)
- Use **Inter** font, dark‑mode compatible colors, glass‑morphism cards for summary widgets.
- Add **micro‑animations** on modal open/close (`framer‑motion`).
- Hover effects on table rows, badge colors for status.

---

## 8️⃣ Testing
1. **Unit** – test each form component with React Testing Library.
2. **Integration** – Cypress/Playwright flow:
   - Login → navigate to Country page → create → verify list update.
   - Repeat for State, City, Journey, Travel‑Style.
   - Verify filters narrow results correctly.
   - Open `/sitemap` and ensure all links are reachable (status 200).
   - Check dashboard numbers match API summary.
   - Attempt to access `/private/reports` as non‑admin → redirected.
3. **End‑to‑End** – Run the API‑tester HTML page for each new endpoint.

---

## 9️⃣ Deployment Checklist
- Add new backend routes (`journey`, `travel‑style`) to **`api_overview.md`** and **`api_checklist.docx`**.
- Update **`Dockerfile`** if static assets need to be copied (the new pages are under `frontend/src/pages`).
- Run **`npm run build`**, ensure no TypeScript errors.
- Verify that site‑map page is SEO‑friendly (meta tags, `<title>`).

---

## 📌 Summary
- **Backend:** ensure two missing POST endpoints exist.
- **Frontend:** create forms, filters, sitemap, dashboard, private pages.
- **State & Validation:** React Hook Form + Yup + React‑Query.
- **Styling:** premium dark‑mode, micro‑animations.
- **Testing:** unit + Cypress/Playwright + API‑tester.
- **Docs:** update all markdown & DOCX checklists.

Once the above steps are completed, the application will have full CRUD support for location hierarchy, journeys, travel styles, searchable filters, a navigable site‑map, an admin dashboard, and secure private sections.

---

*Feel free to ask for any specific component code snippets or further breakdowns.*
