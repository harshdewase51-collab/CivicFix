# CivicFix — Product Requirements Document (PRD)

## 1. Product Overview

**CivicFix** is a responsive civic-tech web application that bridges the communication gap between citizens and municipal authorities. It empowers community residents to report localized public infrastructure and utility defects (such as potholes, malfunctioning streetlights, garbage accumulation, and broken pipes) with photo evidence and specific locations. Concurrently, it equips city administrators with a centralized operations dashboard to triage, prioritize, dispatch, and resolve these community grievances transparently.

**Tagline:** *"Report. Track. Improve your community."*

---

## 2. Problem Statement

Citizens in urban and suburban municipalities face persistent friction when attempting to report civic hazards and community maintenance breakdowns:
- **Inconvenient Reporting**: Traditional municipal help desks rely on disjointed paper complaints, cumbersome phone hotlines, or unmonitored email inboxes.
- **Lack of Evidence & Context**: Complaints often lack photographic proof and clear location references, leading to delays and incorrect dispatch.
- **Zero Transparency & Tracking**: Once a complaint is filed, citizens receive no visibility into whether their report was reviewed, queued, or resolved. This fosters community apathy and distrust.
- **Administrative Disorganization**: City administrators lack a unified real-time dashboard to aggregate, categorize, filter, and track public issues through completion.

---

## 3. Target Users

### 3.1 Citizens (Community Residents)
- Residents who encounter civic problems during daily commutes or in their neighborhoods.
- Need a fast, mobile-friendly interface to snap a picture, select an issue category, describe the problem, and monitor resolution progress.

### 3.2 Municipal Administrators (Public Works & City Officials)
- City officers, dispatchers, and department supervisors responsible for civic maintenance.
- Need an aggregated management dashboard to review submitted complaints, examine evidence, filter by category/urgency, and update task statuses.

---

## 4. Proposed Solution

CivicFix offers an end-to-end digital workflow:
1. **Easy Citizen Reporting**: A clean form allowing citizens to report issues within 60 seconds by picking a category, specifying the location, attaching a photo, and providing a description.
2. **Instant Tracking Code**: Every complaint receives an unambiguous identifier (`CF-1001`, `CF-1002`, etc.) upon submission.
3. **Transparent Resolution Timeline**: A 4-stage visual tracker (*Submitted → Under Review → In Progress → Resolved*) gives citizens real-time insight into the resolution lifecycle.
4. **Administrative Triage Command Center**: Municipal staff can monitor statistics (Total, Pending, In Progress, Resolved), filter issues, review citizen contact details, and update statuses with immediate feedback.

---

## 5. Goals & Success Criteria

### 5.1 Goals
- Deliver a 100% functional, software-only web platform with zero physical hardware/IoT dependencies.
- Provide a smooth mobile and desktop experience with modern, high-trust civic styling.
- Maintain absolute data consistency and role separation using PostgreSQL and JWT auth.

### 5.2 Success Criteria
- Under 60 seconds for a citizen to submit a verified complaint with photo evidence.
- 100% of submitted complaints generate an atomic, sequential `CF-XXXX` tracking code.
- Immediate reflection of admin status updates on citizen dashboards.
- Zero mock or hardcoded API responses in the production stack.

---

## 6. User Roles & Capabilities

| Feature / Capability | Citizen | Administrator |
| :--- | :---: | :---: |
| Register Account | Yes | No (Admin provisioned securely) |
| Login / Logout | Yes | Yes |
| View Public Landing Page | Yes | Yes |
| Access Citizen Dashboard | Yes | No (Redirects to Admin) |
| Submit Problem with Photo | Yes | No |
| View Own Submitted Reports | Yes | No |
| Track Single Report Timeline | Yes | Yes |
| Access Admin Dashboard & Stats | No (403 Forbidden) | Yes |
| View All Citizen Reports | No (403 Forbidden) | Yes |
| Search & Filter All Reports | No | Yes |
| View Citizen Contact Details | No | Yes |
| Update Report Status | No (403 Forbidden) | Yes |

---

## 7. Core User Flows

### 7.1 Citizen Reporting Flow
```
1. Land on CivicFix Homepage
       │
       ▼
2. Register / Sign In as Citizen
       │
       ▼
3. Open Citizen Dashboard
       │
       ▼
4. Click "+ Report a Problem"
       │
       ▼
5. Fill Category, Location, Description & Upload Photo
       │
       ▼
6. Submit Complaint ───► Backend stores record in PostgreSQL
       │
       ▼
7. Receive Tracking ID (e.g., CF-1001)
       │
       ▼
8. View Report Details & Monitor Timeline (PENDING)
```

### 7.2 Administrator Triage Flow
```
1. Sign In as Administrator (admin@civicfix.org)
       │
       ▼
2. Open Admin Command Center
       │
       ▼
3. View Real-time Stats (Total, Pending, In Progress, Resolved)
       │
       ▼
4. Search / Filter Reports by Category or Status
       │
       ▼
5. Open Report Details (CF-1001)
       │
       ▼
6. Inspect Citizen Details, Location & Photo Evidence
       │
       ▼
7. Update Status: PENDING ──► IN_PROGRESS ──► RESOLVED
       │
       ▼
8. Citizen immediately observes updated status on personal dashboard
```

---

## 8. Functional Requirements

### 8.1 Authentication & Authorization
- `FR-1.1`: Citizens can register with name, email, and password. Default role is strictly `'citizen'`.
- `FR-1.2`: Passwords must be hashed using `bcryptjs` with a work factor of 10. Passwords must never be stored or transmitted in plain text.
- `FR-1.3`: Login generates a cryptographically signed JSON Web Token (JWT) expiring after 24 hours.
- `FR-1.4`: Token verification middleware enforces route and role protection; unauthorized or expired requests return HTTP 401/403.

### 8.2 Citizen Complaint Submissions
- `FR-2.1`: Citizen reports require `category`, `location`, and `description`.
- `FR-2.2`: Image upload is supported for JPG, JPEG, PNG, and WEBP formats up to 5MB.
- `FR-2.3`: Each submission automatically generates a unique sequential identifier in format `CF-XXXX`.
- `FR-2.4`: Initial status is automatically set to `PENDING`.
- `FR-2.5`: Citizens can retrieve only reports created by their own user account.

### 8.3 Administrative Operations
- `FR-3.1`: Admins can query all complaints with pagination, category filter, and status filter.
- `FR-3.2`: Admins can view citizen name and email associated with any complaint for follow-up.
- `FR-3.3`: Admins can update status only to one of: `PENDING`, `IN_PROGRESS`, `RESOLVED`.
- `FR-3.4`: Admins can view aggregated system statistics: Total, Pending, In Progress, and Resolved.

---

## 9. Non-Functional Requirements

- **Performance**: API responses return under 200ms; client pages render under 1 second.
- **Reliability**: PostgreSQL ACID transactions ensure no dropped or duplicate ticket identifiers.
- **Security**: OWASP compliance: SQL injection protection via parameterized queries, XSS protection via React DOM escaping and Helmet security headers, CORS restricted to trusted origin.
- **Usability**: Fully responsive across mobile (375px+), tablet, and desktop viewports. High-contrast typography and clear visual cues.
- **Maintainability**: Clean MVC backend structure, modular React components, and zero hardcoded configuration secrets.

---

## 10. API Specification Summary

### Auth APIs
- `POST /api/auth/register` — Create citizen account.
- `POST /api/auth/login` — Authenticate and receive JWT.
- `GET /api/auth/me` — Retrieve current authenticated session.

### Citizen APIs
- `POST /api/reports` — Create issue with optional photo upload.
- `GET /api/reports/my` — Get reports submitted by current citizen.
- `GET /api/reports/:id` — Get single report details (owner or admin).

### Admin APIs
- `GET /api/admin/reports` — List all reports with search & filters.
- `GET /api/admin/reports/:id` — Full report details with submitter info.
- `PATCH /api/admin/reports/:id/status` — Update report status.
- `GET /api/admin/stats` — Overall statistics counts.

### Utility APIs
- `GET /api/health` — System status and health check.

---

## 11. MVP Scope vs. Future Scope

### 11.1 Included in Hackathon MVP
- Full software-only web application (Node.js/Express + React/Vite + PostgreSQL).
- Complete citizen reporting and tracking flow.
- Complete admin dashboard and status transition flow.
- Evidence photo upload and preview.
- Atomic `CF-XXXX` report ID sequence generation.
- Responsive design for mobile and desktop.
- Seed data and automated testing scripts.

### 11.2 Future Scope (Post-Hackathon)
- Interactive Google Maps / OpenStreetMap pin dropping and geofencing.
- Automated reverse geocoding for GPS coordinate capture.
- Automated email and SMS notifications on status changes.
- AI-assisted defect classification and duplicate detection.
- Departmental routing and multi-tier municipal officer accounts.
- Citizen satisfaction surveys and resolution confirmation ratings.
