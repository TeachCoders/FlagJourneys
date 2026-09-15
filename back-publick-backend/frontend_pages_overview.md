# Front‑End Pages Overview

This document catalogs **all front‑end pages** (routes, UI components, and purpose) required for the CRM/Travel‑Agency application. It aligns each page with the relevant user roles (Super‑Admin, Sales Team, IT Department, etc.) and highlights the key actions (Create, Read, Update, Delete) that the UI must support.

---

## 1️⃣ Authentication & Session
| Page | URL | Component | Accessible By | Key Features |
|------|-----|-----------|---------------|--------------|
| **Login** | `/login` | `LoginForm.tsx` | Public (Anyone) | Email & password fields, JWT login, error handling, redirect to dashboard on success |
| **Logout** | – (action) | – | Authenticated users | Clears auth cookie / token, redirects to `/login` |
| **Forgot Password** | `/forgot-password` | `ForgotPasswordForm.tsx` | Public | Submit email, receive reset link
| **Reset Password** | `/reset-password/:token` | `ResetPasswordForm.tsx` | Public (via token) | New password entry, validation, success message |

---

## 2️⃣ Dashboard (Super‑Admin) 
| Page | URL | Component | Accessible By | Key Features |
|------|-----|-----------|---------------|--------------|
| **Admin Dashboard** | `/admin/dashboard` | `AdminDashboard.tsx` | Super‑Admin | Summary cards (total leads, payments, invoices, active users), recent activity tables, quick links to creation forms |
| **Notifications Bell** (header) | – (global) | `NotificationBell.tsx` | Authenticated | Shows unread count (only NEW_LEAD & PAYMENT_APPROVAL), mark as read |

---

## 3️⃣ User & Role Management
| Page | URL | Component | Accessible By | Key Features |
|------|-----|-----------|---------------|--------------|
| **User List** | `/admin/users` | `UserList.tsx` | Super‑Admin | Table of users with role, status, edit/delete actions |
| **Create User** | `/admin/users/create` (modal from list) | `UserForm.tsx` | Super‑Admin | Fields: name, email, mobile, role (Super‑Admin, Sales, IT, HR, Vendor), password, active flag |
| **Edit User** | `/admin/users/:id/edit` (modal) | `UserForm.tsx` | Super‑Admin | Pre‑filled fields, role change, activation toggle |
| **Roles Overview** | `/admin/roles` | `RolesPage.tsx` | Super‑Admin | List existing roles, permissions matrix, add new custom role |

---

## 4️⃣ Department Specific Pages
### 4.1 Sales Team
| Page | URL | Component | Accessible By | Key Features |
|------|-----|-----------|---------------|--------------|
| **Leads List** | `/sales/leads` | `LeadsList.tsx` | Sales Team | Filter by status/source/assignedTo, pagination, bulk actions |
| **Lead Detail** | `/sales/leads/:id` | `LeadDetail.tsx` | Sales Team | View full lead info, assign to user, add follow‑up notes, change status, soft‑delete |
| **Create Lead** | (modal from Leads List) | `LeadForm.tsx` | Sales Team | Fields: name, email, phone, source (website, chat, travelogyindia), journey, travel style, etc. |
| **Vendor Assignment** | `/sales/leads/:id/vendors` | `VendorAssignmentForm.tsx` | Sales Team | Select vendor(s), specify services, commission, save assignment |
| **Payments** | `/sales/payments` | `PaymentsList.tsx` | Sales Team | Filter by status (PAID, PENDING), create payment record, update status |
| **Invoices** | `/sales/invoices` | `InvoicesList.tsx` | Sales Team | Create invoice for a lead, view status, close invoice (mark PAID) |

### 4.2 IT Department
| Page | URL | Component | Accessible By | Key Features |
|------|-----|-----------|---------------|--------------|
| **System Settings** | `/admin/it-settings` | `ITSettingsPage.tsx` | IT Department | Manage JWT secret, session expiry, logging level, API rate limits |
| **Audit Logs** | `/admin/audit-logs` | `AuditLogList.tsx` | IT Department | View system logs (filtered by date, severity), download log file, search |
| **API Documentation** | `/admin/api-docs` | `APIDocsPage.tsx` | IT Department | Render `api_overview.md` as HTML, searchable table of endpoints |

---

## 5️⃣ Location Management (Country → State → City)
| Page | URL | Component | Accessible By | Key Features |
|------|-----|-----------|---------------|--------------|
| **Countries List** | `/admin/locations/countries` | `CountryList.tsx` | Super‑Admin / IT | Table with active flag, edit/delete, create modal |
| **Create Country** | (modal) | `CountryForm.tsx` | Super‑Admin / IT | Fields: title, slug, SEO meta, capital, currency, language, timezone, active flag |
| **States List** | `/admin/locations/states` | `StateList.tsx` | Super‑Admin / IT | Filter by country, edit/delete, create modal |
| **Create State** | (modal) | `StateForm.tsx` | Super‑Admin / IT | Dropdown country, title, SEO meta, active flag |
| **Cities List** | `/admin/locations/cities` | `CityList.tsx` | Super‑Admin / IT | Filter by state, edit/delete, create modal |
| **Create City** | (modal) | `CityForm.tsx` | Super‑Admin / IT | Dropdown state, title, SEO meta, attractions, weather, active flag |

---

## 6️⃣ Journey & Travel‑Style Management
| Page | URL | Component | Accessible By | Key Features |
|------|-----|-----------|---------------|--------------|
| **Journeys List** | `/admin/journeys` | `JourneyList.tsx` | Super‑Admin / IT | Table with title, destination, price, active flag, edit/delete, create modal |
| **Create Journey** | (modal) | `JourneyForm.tsx` | Super‑Admin / IT | Title, SEO, description, duration, price, related Country/State/City (multi‑select), travel‑experience association, month association |
| **Travel‑Style List** | `/admin/travel-styles` | `TravelStyleList.tsx` | Super‑Admin / IT | List of travel styles (e.g., Adventure, Relaxation), edit/delete, create modal |
| **Create Travel‑Style** | (modal) | `TravelStyleForm.tsx` | Super‑Admin / IT | Name, optional icon, description |

---

## 7️⃣ Site‑Map (Public Navigation)
| Page | URL | Component | Accessible By | Key Features |
|------|-----|-----------|---------------|--------------|
| **Site‑Map** | `/sitemap` | `SiteMap.tsx` | Public | Hierarchical tree: Country → State → City → Journey → Travel‑Style; each node links to its public detail page |
| **Journey Detail** | `/journeys/:slug` | `JourneyDetailPage.tsx` | Public | Show full itinerary, inclusions/exclusions, booking button |
| **Travel‑Style Detail** | `/travel-styles/:slug` | `TravelStyleDetailPage.tsx` | Public | Description, related journeys, images |
| **Location Detail** | `/countries/:slug`, `/states/:slug`, `/cities/:slug` | `LocationDetailPage.tsx` | Public | SEO‑friendly page with meta tags, active status, list of child entities |

---

## 8️⃣ Private Pages (PSE) – Role‑Based Access
| Page | URL | Component | Required Role(s) | Key Features |
|------|-----|-----------|------------------|--------------|
| **Private Reports** | `/private/reports` | `ReportsPage.tsx` | Super‑Admin, IT | Generate revenue, lead conversion, payment status reports; export CSV/PDF |
| **User Activity Log** | `/private/activity` | `ActivityLogPage.tsx` | Super‑Admin, IT | Real‑time activity stream, filter by user, action type |
| **System Settings** | `/private/settings` | `SystemSettingsPage.tsx` | Super‑Admin | Toggle site live flag, manage maintenance mode, configure third‑party integrations |

---

## 9️⃣ Common UI Components (Reusable)
- **Header** – navigation links, notification bell, user avatar with dropdown (profile, logout).
- **Sidebar** – collapsible menu based on role (admin, sales, IT).
- **FilterBar** – reusable component for list pages; supports dropdowns, search input, clear button.
- **Modal** – generic `ModalWrapper` using **Framer Motion** for smooth opening/closing.
- **Form** – `React Hook Form` + **Yup** validation, used across all create/edit pages.
- **Table** – `react‑table` with pagination, sorting, selectable rows, micro‑animations on hover.
- **Badge** – status indicators (Active, Inactive, Pending, Paid) with colour coding.

---

## 📌 Summary
- **Authentication** – login, logout, password reset.
- **Super‑Admin Dashboard** – high‑level metrics & quick actions.
- **User & Role Management** – CRUD for users and roles.
- **Department Pages** – Sales (leads, payments, invoices), IT (settings, logs, API docs).
- **Location Hierarchy** – Country, State, City CRUD with filters.
- **Journey & Travel‑Style** – full creation workflow, association with locations.
- **Public Site‑Map** – navigable tree linking to SEO‑friendly detail pages.
- **Private Pages (PSE)** – secure, role‑restricted sections for reports and system configuration.
- **Reusable UI primitives** ensure consistency, premium aesthetics, and micro‑animations across the entire app.

Use this overview as a **reference for developers** when building or extending any front‑end page, and as a **checklist for QA** to ensure each page implements the required features.
