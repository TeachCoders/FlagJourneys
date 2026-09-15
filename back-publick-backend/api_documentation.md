# API Documentation (Public)

This document provides a concise table of all backend endpoints, their HTTP methods, URLs, the service modules implementing them, the Prisma tables they interact with, and a short purpose description.

| Sr No | HTTP Method | API URL (relative to `/api`) | Service Module | Prisma Table(s) | Purpose |
|------|-------------|------------------------------|----------------|----------------|---------|
| 1 | POST | /auth/login | `services/authService.js` | `Users` | User login – returns JWT token |
| 2 | POST | /auth/logout | `services/authService.js` | — | Clears auth cookie / token |
| 3 | POST | /users | `services/userService.js` | `Users` | Create new user (admin, sales, partner) |
| 4 | GET | /users/:id | `services/userService.js` | `Users` | Retrieve user details |
| 5 | PUT | /users/:id | `services/userService.js` | `Users` | Update user (role, active flag) |
| 6 | DELETE | /users/:id | `services/userService.js` | `Users` | Soft‑delete or deactivate user |
| 7 | POST | /countries | `services/locationService.js` | `Country` | Add a new country |
| 8 | GET | /countries | `services/locationService.js` | `Country` | List all active countries |
| 9 | PUT | /countries/:id | `services/locationService.js` | `Country` | Update country details |
| 10 | DELETE | /countries/:id | `services/locationService.js` | `Country` | Deactivate a country |
| 11 | POST | /states | `services/locationService.js` | `State` | Create a state (needs `countryId`) |
| 12 | GET | /states | `services/locationService.js` | `State` | List states (filter by `countryId`) |
| 13 | PUT | /states/:id | `services/locationService.js` | `State` | Update state information |
| 14 | DELETE | /states/:id | `services/locationService.js` | `State` | Deactivate state |
| 15 | POST | /cities | `services/locationService.js` | `City` | Add a city (needs `stateId`) |
| 16 | GET | /cities | `services/locationService.js` | `City` | List cities (filter by `stateId`) |
| 17 | PUT | /cities/:id | `services/locationService.js` | `City` | Update city details |
| 18 | DELETE | /cities/:id | `services/locationService.js` | `City` | Deactivate city |
| 19 | POST | /seasons | `services/seasonService.js` | `Season` | Create a travel season |
| 20 | GET | /seasons | `services/seasonService.js` | `Season` | List active seasons |
| 21 | PUT | /seasons/:id | `services/seasonService.js` | `Season` | Update season attributes |
| 22 | DELETE | /seasons/:id | `services/seasonService.js` | `Season` | Deactivate season |
| 23 | POST | /travel-experiences | `services/travelExperienceService.js` | `TravelExperience` | Add a travel‑experience type |
| 24 | GET | /travel-experiences | `services/travelExperienceService.js` | `TravelExperience` | List travel experiences |
| 25 | PUT | /travel-experiences/:id | `services/travelExperienceService.js` | `TravelExperience` | Update travel experience |
| 26 | DELETE | /travel-experiences/:id | `services/travelExperienceService.js` | `TravelExperience` | Deactivate travel experience |
| 27 | POST | /site/status | `services/siteService.js` | — | Toggle site live flag (`isLive`) |
| 28 | GET | /site/status | `services/siteService.js` | — | Get current live status |
| 29 | POST | /leads | `services/leadService.js` | `Traveller` | Create a new lead (source can be website, chat, travelogyindia, etc.) |
| 30 | GET | /leads | `services/leadService.js` | `Traveller` | List leads (filter by status, source, assignedTo) |
| 31 | GET | /leads/:id | `services/leadService.js` | `Traveller` | Get lead details |
| 32 | PUT | /leads/:id/assign | `services/leadService.js` | `Traveller` | Assign lead to a sales‑user (`assignedToUserId`) |
| 33 | PUT | /leads/:id/followup | `services/leadService.js` | `Traveller` | Update follow‑up status / notes (creates `FollowupNote`) |
| 34 | DELETE | /leads/:id | `services/leadService.js` | `Traveller` | Soft‑delete / cancel lead |
| 35 | POST | /chat/start | `services/chatService.js` | `ChatConversation` | Start a new chat session (creates token) |
| 36 | POST | /chat/message | `services/chatService.js` | `ChatMessage` | Append a message to a conversation |
| 37 | GET | /chat/:conversationId | `services/chatService.js` | `ChatConversation`, `ChatMessage` | Retrieve chat history |
| 38 | POST | /vendors | `services/vendorService.js` | `Vendor` | Register a new vendor |
| 39 | GET | /vendors | `services/vendorService.js` | `Vendor` | List vendors (filter by active) |
| 40 | PUT | /vendors/:id | `services/vendorService.js` | `Vendor` | Update vendor details |
| 41 | DELETE | /vendors/:id | `services/vendorService.js` | `Vendor` | Deactivate vendor |
| 42 | POST | /vendor-assignments | `services/vendorAssignmentService.js` | `VendorAssignment` | Assign a lead to a vendor (services, commission, etc.) |
| 43 | GET | /vendor-assignments?travellerId= | `services/vendorAssignmentService.js` | `VendorAssignment` | List assignments for a lead |
| 44 | POST | /payments | `services/paymentService.js` | `Payment` | Record a payment (status defaults to `PENDING`) |
| 45 | PUT | /payments/:id | `services/paymentService.js` | `Payment` | Update payment status (e.g., `PAID`, `OVERDUE`) |
| 46 | GET | /payments?status=PAID | `services/paymentService.js` | `Payment` | List payments by status |
| 47 | POST | /invoices | `services/invoiceService.js` | `Invoice` | Create an invoice for a lead |
| 48 | PUT | /invoices/:id/close | `services/invoiceService.js` | `Invoice` | Mark invoice as `PAID` (final revenue) |
| 49 | GET | /dashboard/summary | `services/dashboardService.js` | Multiple (`Traveller`, `Payment`, `Invoice`, `Notification`) | Aggregated counts – total leads, pending payments, revenue, unread notifications |
| 50 | GET | /notifications?unread=true | `services/notificationService.js` | `Notification` | List unread notifications (only `NEW_LEAD` and `PAYMENT_APPROVAL` types) |
| 51 | PUT | /notifications/:id/read | `services/notificationService.js` | `Notification` | Mark a notification as read |

*All services are thin wrappers around Prisma client calls, include error handling, logging (via `utils/logger.js`), and optional webhook/Telegram notifications where indicated.*
