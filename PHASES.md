# CivicFix — Development Phases & Execution Roadmap

This document establishes the 17-phase execution roadmap for CivicFix. Each phase defines objectives, tasks, files involved, expected output, and completion criteria.

---

## Phase 0: Inspect Existing Project
- **Objective**: Inspect the pre-existing CivicFix project, verify existing assets, dependencies, and local database availability.
- **Tasks**: Inspect root structure, verify Node.js (v24.x) and PostgreSQL 18.x service on port 5432.
- **Files Involved**: Root workspace files.
- **Expected Output**: Verified runtime environment.
- **Completion Criteria**: Confirmed PostgreSQL connectivity and runtime versions.

---

## Phase 1: Organize Folders
- **Objective**: Reorganize codebase into the 4 architectural modules:
  - `frontend/` (Pure UI)
  - `client/` (API communication layer)
  - `server/` (Backend Express server)
  - `api/` (Serverless / deployment support)
- **Tasks**: Create directories, move React UI to `frontend/`, scaffold `client/`, and establish module boundaries.
- **Files Involved**: `frontend/`, `client/`, `server/`, `api/`.
- **Expected Output**: Exact 4-folder separation without `backend/` or `docs/`.
- **Completion Criteria**: `frontend/` contains only UI; `client/` handles API requests; `server/` contains backend logic.

---

## Phase 2: Update Documentation
- **Objective**: Synchronize root documentation with the 4-module architecture.
- **Tasks**: Update `DATABASE.md`, `DESIGN.md`, `PHASES.md`, `PRD.md`, `RULES.md`, and `README.md`.
- **Files Involved**: `DATABASE.md`, `DESIGN.md`, `PHASES.md`, `PRD.md`, `RULES.md`, `README.md`.
- **Expected Output**: Complete, up-to-date documentation suite in the project root.
- **Completion Criteria**: All 6 files present and aligned.

---

## Phase 3: Backend Setup
- **Objective**: Configure Express.js backend with security, CORS, file uploads, and health checking.
- **Tasks**: Setup `server/package.json`, `server/src/server.js`, `server/.env.example`, `server/.env`.
- **Files Involved**: `server/src/server.js`, `server/package.json`.
- **Expected Output**: Express backend responding on port 5000 with `GET /api/health`.
- **Completion Criteria**: `curl http://localhost:5000/api/health` returns `{ "success": true, "message": "CivicFix API is running" }`.

---

## Phase 4: Database
- **Objective**: Provision PostgreSQL database, configure connection pool, run migrations, and implement seeding.
- **Tasks**: Implement `server/src/db/index.js`, `migrate.js`, and `seed.js`.
- **Files Involved**: `server/src/db/*`.
- **Expected Output**: `users` and `reports` tables created with indexes, sequences, and admin account seeded.
- **Completion Criteria**: `npm run db:migrate` and `npm run seed:admin` execute successfully.

---

## Phase 5: Authentication
- **Objective**: Implement bcrypt password hashing, JWT issuance, and authentication middleware.
- **Tasks**: Implement `server/src/middleware/auth.js`, `server/src/services/authService.js`, and `server/src/controllers/authController.js`.
- **Files Involved**: `server/src/controllers/authController.js`, `server/src/services/authService.js`, `server/src/middleware/auth.js`.
- **Expected Output**: Secure citizen registration, login, and `/api/auth/me` endpoints.
- **Completion Criteria**: Valid credentials return JWT; unauthorized requests return 401/403.

---

## Phase 6: Citizen APIs
- **Objective**: Build endpoints allowing citizens to submit complaints with photo evidence and retrieve their tickets.
- **Tasks**: Implement `server/src/services/reportService.js`, `reportController.js`, `idGenerator.js`, and multer upload middleware.
- **Files Involved**: `server/src/controllers/reportController.js`, `server/src/services/reportService.js`, `server/src/utils/idGenerator.js`.
- **Expected Output**: Working `POST /api/reports`, `GET /api/reports/my`, `GET /api/reports/:id`.
- **Completion Criteria**: Citizen can upload photo, receive sequential `CF-XXXX` ID, and view personal reports.

---

## Phase 7: Admin APIs
- **Objective**: Build endpoints for municipal administrators to triage, filter, and update complaint statuses.
- **Tasks**: Implement `server/src/services/adminService.js`, `adminController.js`, and `adminRoutes.js` guarded by `requireAdmin`.
- **Files Involved**: `server/src/controllers/adminController.js`, `server/src/services/adminService.js`, `server/src/routes/adminRoutes.js`.
- **Expected Output**: `GET /api/admin/reports`, `GET /api/admin/reports/:id`, `PATCH /api/admin/reports/:id/status`, `GET /api/admin/stats`.
- **Completion Criteria**: Admin can view all tickets, search/filter, and update status; non-admins are blocked (403).

---

## Phase 8: Backend Testing
- **Objective**: Execute comprehensive automated API test suite.
- **Tasks**: Run `server/src/scripts/verify-backend.js`.
- **Files Involved**: `server/src/scripts/verify-backend.js`.
- **Expected Output**: 16/16 test assertions passing.
- **Completion Criteria**: Zero test failures across auth, reporting, admin, and authorization checks.

---

## Phase 9: Frontend UI
- **Objective**: Build the complete, responsive React user interface in `frontend/`.
- **Tasks**: Implement 9 pages, layouts, navigation, and custom civic-tech design system.
- **Files Involved**: `frontend/src/pages/*`, `frontend/src/components/*`, `frontend/src/layouts/*`, `frontend/src/index.css`.
- **Expected Output**: High-contrast, clean civic-tech UI.
- **Completion Criteria**: All pages render cleanly across mobile, tablet, and desktop.

---

## Phase 10: Client API Layer
- **Objective**: Build dedicated client API communication package in `client/`.
- **Tasks**: Implement `client/api/apiClient.js`, `services/authService.js`, `services/reportService.js`, `services/adminService.js`, `auth/tokenStorage.js`.
- **Files Involved**: `client/api/*`, `client/services/*`, `client/auth/*`, `client/index.js`.
- **Expected Output**: Reusable client API SDK cleanly decoupled from UI components.
- **Completion Criteria**: All API requests flow through `client/` services.

---

## Phase 11: Frontend / Backend Integration
- **Objective**: Connect `frontend/` UI components to the `client/` service layer and live Express backend.
- **Tasks**: Wire up `AuthContext`, forms, tables, and details views to consume `@civicfix/client`.
- **Files Involved**: `frontend/src/context/AuthContext.jsx`, `frontend/vite.config.js`, all page components.
- **Expected Output**: Seamless end-to-end data flow with zero mock data.
- **Completion Criteria**: Submitting a report in UI stores data in PostgreSQL and reflects across views.

---

## Phase 12: Complete Testing
- **Objective**: Verify the complete 17-step end-to-end user and admin lifecycle.
- **Tasks**: Execute `server/src/scripts/test-complete-17-steps.js`.
- **Files Involved**: `server/src/scripts/test-complete-17-steps.js`.
- **Expected Output**: 100% passing tests for the full 17-step user journey.
- **Completion Criteria**: All 17 verification steps pass.

---

## Phase 13: UI Polish
- **Objective**: Ensure high visual quality, loading indicators, accessible contrast, and empty states.
- **Tasks**: Review and polish buttons, badges, modals, timeline progression, and responsive tables.
- **Files Involved**: `frontend/src/index.css`, UI components.
- **Expected Output**: Professional civic-tech startup appearance.
- **Completion Criteria**: Zero layout bugs, smooth touch responsiveness.

---

## Phase 14: Production Build
- **Objective**: Validate production asset compilation.
- **Tasks**: Run `npm run build` in `frontend/`.
- **Files Involved**: `frontend/dist/`.
- **Expected Output**: Optimized production HTML, CSS, and JS bundle.
- **Completion Criteria**: Production build completes in under 1 second with zero warnings or errors.

---

## Phase 15: Deployment
- **Objective**: Prepare repository for cloud deployment on Vercel and Neon PostgreSQL.
- **Tasks**: Configure `vercel.json` and `api/index.js`.
- **Files Involved**: `vercel.json`, `api/index.js`.
- **Expected Output**: Cloud-ready serverless configuration.
- **Completion Criteria**: Deployment configuration routes API and frontend appropriately.

---

## Phase 16: GitHub + Final Verification
- **Objective**: Finalize Git commits, verify cleanliness, and compile final report.
- **Tasks**: Commit milestones, ensure `.gitignore` excludes secrets, verify presentation requirements.
- **Files Involved**: `.git`, `.gitignore`, `README.md`.
- **Expected Output**: Clean git repository ready for hackathon presentation and submission.
- **Completion Criteria**: Clean working tree and comprehensive final summary.
