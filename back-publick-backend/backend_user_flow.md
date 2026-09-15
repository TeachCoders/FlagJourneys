# Backend User Flow & Feature Documentation

## 📌 High‑Level Workflow
The following sequence describes **how each role interacts with the system**, the **pages/components** they use, and the **backend API endpoints** that power those actions.  All models mentioned are defined in `prisma/schema.prisma`.

---

### 1️⃣ Authentication (All Users)
| Step | UI / Route | API Call | Prisma Model | Notes |
|------|------------|----------|--------------|-------|
| Login | `/login` (LoginForm) | **POST** `/auth/login` | `Users` | Returns JWT + HttpOnly cookie. |
| Logout | – (button) | **POST** `/auth/logout` | — | Clears cookie. |
| Forgot / Reset Password | `/forgot-password`, `/reset-password/:token` | **POST** `/auth/forgot-password` / **POST** `/auth/reset-password` | `Users` | Email with token, then new password. |

---

### 2️⃣ Team & User Management (Super‑Admin)
| Action | UI / Route | API | Model | Remarks |
|--------|------------|-----|-------|--------|
| **Create Team** | `/admin/teams/create` (TeamForm modal) | **POST** `/teams` *(you may need to add this endpoint)* | `Team` (custom model, not in current schema – can be stored as a simple table) | Used to group users (IT, Sales, etc.). |
| **Create User** | `/admin/users/create` (UserForm modal) | **POST** `/users` | `Users` | Fields: `name`, `email`, `mobile`, `role` (e.g., `SUPER_ADMIN`, `IT`, `SALES_PERSON`, `TRAVELLER`), `teamId`. |
| **Assign Role** | same as above or edit user | **PUT** `/users/:id` | `Users` | Role string controls front‑end route guards. |
| **List Users** | `/admin/users` | **GET** `/users` | `Users` | Shows role, active flag, team. |

---

### 3️⃣ Department‑Specific On‑boarding Flow
#### 3.1 IT Department Member Login
1. IT staff logs in (`/login`).
2. After auth, they are redirected to **IT Settings** (`/admin/it-settings`).
3. From there they can create **Location Hierarchy**.

#### 3.2 Location Hierarchy Creation
| Level | UI / Route | API | Model | Key Fields |
|-------|------------|-----|-------|------------|
| **Country** | `/admin/locations/countries` → **Create Country** modal (`CountryForm.tsx`) | **POST** `/countries` | `Country` | `title`, `slug`, `capital`, `currency`, `language`, `isActive`. |
| **State** | `/admin/locations/states` → **Create State** modal (`StateForm.tsx`) | **POST** `/states` | `State` | `title`, `slug`, `countryId`, `isActive`. |
| **City** | `/admin/locations/cities` → **Create City** modal (`CityForm.tsx`) | **POST** `/cities` | `City` | `title`, `slug`, `stateId`, `isActive`. |
| **Travel Experience** | `/admin/travel‑styles` → **Create Travel‑Style** modal (`TravelStyleForm.tsx`) | **POST** `/travel‑styles` *(endpoint to add)* | `TravelExperience` | `title`, `type`, `idealFor`, `budgetRange`. |
| **Season** (optional) | `/admin/seasons` → **Create Season** modal (`SeasonForm.tsx`) | **POST** `/seasons` | `Season` | `title`, `startDate`, `endDate`, `isActive`. |

---

### 4️⃣ Sales Team On‑boarding (Super‑Admin creates Sales Person)
| Step | UI / Route | API | Model |
|------|------------|-----|-------|
| **Create Sales Person** | `/admin/users/create` (role = `SALES_PERSON`) | **POST** `/users` | `Users` |
| **Login as Sales Person** | `/login` → redirected to **Sales Dashboard** (`/sales/dashboard`) | – | – |
| **View Assigned Leads** | `/sales/leads` (filtered by `assignedToUserId = myId`) | **GET** `/leads?assignedTo=myId` | `Traveller` (Lead) |
| **Add Follow‑up / Notes** | Lead Detail → **Follow‑up Modal** (`PUT /leads/:id/followup`) | **PUT** `/leads/:id/followup` | `FollowupNote` |
| **Upload Payment Slip** | Lead Detail → **Payment Modal** (`POST /payments`) | **POST** `/payments` | `Payment` (field `paymentScreenshotUrl`) |
| **Assign Lead** (Super‑Admin) | Admin Dashboard → **Assign Modal** (`PUT /leads/:id/assign`) | **PUT** `/leads/:id/assign` | `Traveller` (field `assignedToUserId`) |

> **Important:** Sales Person UI hides the **Assign** button; they only see leads where `assignedToUserId` equals their own ID.

---

### 5️⃣ Traveller (Normal User) Journey
1. **Register / Login** → receives normal `TRAVELLER` role.
2. **Fill Lead Form** (`/leads` → `POST /leads`). Required fields: `name`, `email`, `phone`, `source`, `selectedJourneyId`, `selectedTravelExperienceId`, etc.
3. Lead is stored in `Traveller` model with `status = PENDING`.
4. Super‑Admin sees the new lead in **Admin Dashboard**.
5. Super‑Admin assigns it to a Sales Person.

---

### 6️⃣ Sales Person Work on Assigned Lead
| Action | UI / Route | API | Model |
|--------|------------|-----|-------|
| **View Assigned Lead** | `/sales/leads` (filtered) | **GET** `/leads?assignedTo=myId` | `Traveller` |
| **Add Follow‑up / Notes** | Lead Detail → **Follow‑up** | **PUT** `/leads/:id/followup` | `FollowupNote` |
| **Upload Payment Slip** | Lead Detail → **Payment** | **POST** `/payments` (include `paymentScreenshotUrl`) | `Payment` |
| **Cannot Re‑assign** | – | – | UI button hidden, API not exposed for their role. |

---

### 7️⃣ Super‑Admin Payment Verification
1. Super‑Admin logs in → **Payments Dashboard** (`/admin/payments`).
2. **List Pending Payments** – `GET /payments?status=PENDING`.
3. **Approve Payment** – `PUT /payments/:id` with `status = PAID` and optional `approvedAt`, `approvedBy` fields.
4. Once approved, the lead status may be updated to `PAYMENT_APPROVAL` (via backend service).

---

### 8️⃣ Traveller Service Booking (No Vendor Exists)
1. After payment is approved, the **Traveller** proceeds to **Requirement & Booking** page (`/traveller/requirements`).
2. **Create Vendor** (since none exist) – Super‑Admin or Sales Person can create a vendor record:
   - UI: `/admin/vendors/create` → **VendorForm**.
   - API: **POST** `/vendors` → `Vendor` model (stores service details, commission, contact info).
3. **Book Service** – Using the newly created vendor:
   - API: **POST** `/vendor-assignments` (fields: `travellerId`, `vendorId`, `services[]`, `commissionRate`).
   - This creates a `VendorAssignment` linked to the lead.
4. **Create Invoice** – `POST /invoices` (link to `travellerId`).
5. **Mark Invoice Paid** – `PUT /invoices/:id/close`.

---

### 9️⃣ Final Super‑Admin Review
| Area | UI / Route | API | Model |
|------|------------|-----|-------|
| **Lead Overview** | `/admin/leads` | **GET** `/leads` | `Traveller` |
| **Vendor & Assignment Review** | `/admin/vendors` & `/admin/vendor-assignments` | **GET** `/vendors`, **GET** `/vendor-assignments?travellerId=` | `Vendor`, `VendorAssignment` |
| **Payment & Invoice Status** | `/admin/payments`, `/admin/invoices` | **GET** `/payments`, **GET** `/invoices` | `Payment`, `Invoice` |
| **Travel Experience & Journey Data** | `/admin/journeys`, `/admin/travel‑styles` | **GET** `/journeys`, **GET** `/travel‑styles` | `Journey`, `TravelExperience` |

Super‑Admin can see the full end‑to‑end chain:
`Team → User → Role → Country/State/City → TravelExperience/Season → Lead → Assignment → Payment → Vendor → Invoice`.

---

## 📚 Mapping of API Endpoints to Flow Steps
| Flow Step | HTTP Method | URL | Service Module | Prisma Table(s) |
|-----------|-------------|-----|----------------|----------------|
| Login | POST | /auth/login | `authService.js` | `Users` |
| Create Team (custom) | POST | /teams | `teamService.js` | `Team` (new) |
| Create User | POST | /users | `userService.js` | `Users` |
| Assign Role | PUT | /users/:id | `userService.js` | `Users` |
| Create Country | POST | /countries | `locationService.js` | `Country` |
| Create State | POST | /states | `locationService.js` | `State` |
| Create City | POST | /cities | `locationService.js` | `City` |
| Create Travel‑Experience | POST | /travel‑experiences | `travelExperienceService.js` | `TravelExperience` |
| Create Season | POST | /seasons | `seasonService.js` | `Season` |
| Create Lead | POST | /leads | `leadService.js` | `Traveller` |
| Assign Lead | PUT | /leads/:id/assign | `leadService.js` | `Traveller` |
| Follow‑up Note | PUT | /leads/:id/followup | `leadService.js` | `FollowupNote` |
| Upload Payment Slip | POST | /payments | `paymentService.js` | `Payment` |
| Approve Payment | PUT | /payments/:id | `paymentService.js` | `Payment` |
| Create Vendor | POST | /vendors | `vendorService.js` | `Vendor` |
| Vendor Assignment | POST | /vendor-assignments | `vendorAssignmentService.js` | `VendorAssignment` |
| Create Invoice | POST | /invoices | `invoiceService.js` | `Invoice` |
| Close Invoice (PAID) | PUT | /invoices/:id/close | `invoiceService.js` | `Invoice` |
| List Leads (admin) | GET | /leads | `leadService.js` | `Traveller` |
| List Payments (admin) | GET | /payments?status=... | `paymentService.js` | `Payment` |
| List Vendors | GET | /vendors | `vendorService.js` | `Vendor` |
| List Assignments | GET | /vendor-assignments?travellerId= | `vendorAssignmentService.js` | `VendorAssignment` |

---

## 🏗️ Suggested Backend Additions (if missing)
- **Team Model & Service** – for grouping users (IT, Sales, etc.).
- **POST /journeys** – already required for journey creation (if not present). 
- **POST /travel‑styles** – for travel‑experience creation.
- **Role‑based middleware** – extend `authMiddleware` to check `req.user.role` and restrict endpoints (e.g., only Super‑Admin can hit `/users`, only Sales can access `/leads?assignedTo=`).
- **Vendor Assignment Flow** – ensure `vendorAssignments` are linked to `Traveller` and `Vendor` with proper cascade deletion.

---

## 📋 Quick Reference Checklist for QA
1. **Auth** – login/out, JWT works.
2. **Team & User** – create team → create users with appropriate roles.
3. **IT Member** – can create Country → State → City → Travel‑Experience → Season.
4. **Super‑Admin** – can create Sales Person.
5. **Traveller** – can submit lead (source: website, chat, travelogyindia).
6. **Super‑Admin** – sees lead, assigns to Sales Person.
7. **Sales Person** – sees only assigned leads, can add follow‑up, upload payment slip.
8. **Super‑Admin** – approves payment, changes status.
9. **No Vendor** – Sales / Super‑Admin creates Vendor, fills service details.
10. **Vendor Assignment** – link vendor to lead, create invoice, mark paid.
11. **End‑to‑End** – Super‑Admin can view the full chain on dashboards.

---

## 🎨 UI / UX Recommendations (Premium Look)
- Use **Inter** font, dark‑mode colours, glass‑morphism cards for dashboards.
- Add **micro‑animations** (Framer Motion) for modal open/close and table row hover.
- Show **role‑based badges** on user list (Super‑Admin 🔴, Sales 🟢, IT 🔵, Traveller 🟡).
- Provide **breadcrumb navigation** on location pages (`Country > State > City`).
- Use **toast notifications** for successful create/assign actions.

---

*This document serves as a complete **backend‑to‑frontend flow guide** for developers, QA engineers, and product owners. Feel free to expand any section with further technical details or screenshots.*
