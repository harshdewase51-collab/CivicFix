# CivicFix — Development Phases & Execution Plan

This document establishes the strict chronological development sequence for CivicFix. Each phase must satisfy its completion criteria before advancing.

---

## Phase 0: Project Documentation
- **Objective**: Establish the software architecture, database schema, design system, API specifications, and operational rules before writing application code.
- **Tasks**:
  1. Author `DATABASE.md` detailing PostgreSQL/Neon schema, tables, indexes, constraints, and sequences.
  2. Author `DESIGN.md` specifying UI/UX components, color tokens, and responsive wireframes.
  3. Author `PHASES.md` mapping out execution milestones.
  4. Author `PRD.md` capturing functional and non-functional specifications.
  5. Author `RULES.md` as the project constitution.
  6. Author `README.md` and `.gitignore`.
- **Files Involved**: `DATABASE.md`, `DESIGN.md`, `PHASES.md`, `PRD.md`, `RULES.md`, `README.md`, `.gitignore`.
- **Expected Output**: Complete set of architectural markdown specifications in the repository root.
- **Completion Criteria**: All 6 files exist with concrete, project-specific details.

---

## Phase 1: Backend Setup
- **Objective**: Bootstrap the Express.js server with middleware, environment configuration, and basic health checking.
- **Tasks**:
  1. Initialize `server/package.json` and install core dependencies (`express`, `dotenv`, `cors`, `helmet`, `pg`, `bcryptjs`, `jsonwebtoken`, `multer`).
  2. Implement `server/src/server.js` with helmet, CORS, JSON parser, and error handling middleware.
  3. Create `GET /api/health` endpoint returning `{ "success": true, "message": "CivicFix API is running" }`.
  4. Configure environment variable files (`server/.env.example` and `server/.env`).
- **Files Involved**: `server/package.json`, `server/src/server.js`, `server/.env.example`, `server/.env`.
- **Expected Output**: Express server running on port 5000 responding successfully to health checks.
- **Completion Criteria**: `curl http://localhost:5000/api/health` returns HTTP 200 with success JSON.

---

## Phase 2: Database Implementation
- **Objective**: Provision PostgreSQL database, run automated migrations, and implement connection pooling and seeding.
- **Tasks**:
  1. Implement PostgreSQL pool in `server/src/db/index.js` supporting both local PostgreSQL and Neon cloud SSL connections.
  2. Write migration script `server/src/db/migrate.js` to create `users` and `reports` tables, sequences, indexes, and constraints.
  3. Write seed script `server/src/db/seed.js` to create default administrator account and sample civic issues.
  4. Run migration and seed scripts to verify database connectivity.
- **Files Involved**: `server/src/db/index.js`, `server/src/db/migrate.js`, `server/src/db/seed.js`.
- **Expected Output**: Database tables created with active indexes, default admin account provisioned.
- **Completion Criteria**: Querying `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'` displays `users` and `reports`.

---

## Phase 3: Authentication
- **Objective**: Implement secure user registration, login, and JWT-based authentication and role authorization.
- **Tasks**:
  1. Implement `authenticateToken` and `requireAdmin` middleware in `server/src/middleware/auth.js`.
  2. Implement `POST /api/auth/register` (hashes password with bcrypt, default role `citizen`).
  3. Implement `POST /api/auth/login` (verifies credentials, generates signed JWT).
  4. Implement `GET /api/auth/me` (returns sanitized user profile without password hash).
  5. Mount routes on `/api/auth`.
- **Files Involved**: `server/src/middleware/auth.js`, `server/src/controllers/authController.js`, `server/src/routes/authRoutes.js`.
- **Expected Output**: Functioning citizen registration and login issuing signed JSON Web Tokens.
- **Completion Criteria**: Automated curl/node tests register a user, login, receive a JWT, and successfully query `/api/auth/me`.

---

## Phase 4: Citizen Report APIs
- **Objective**: Allow authenticated citizens to submit issues with photos and retrieve their complaints.
- **Tasks**:
  1. Implement Multer file upload handling in `server/src/middleware/upload.js` with image file filter and storage in `server/uploads/`.
  2. Implement unique Report ID sequence generator (`CF-1001`, `CF-1002`, etc.) in `server/src/utils/idGenerator.js`.
  3. Implement `POST /api/reports` creating issues with category, location, description, optional photo, default status `PENDING`.
  4. Implement `GET /api/reports/my` fetching citizen-specific reports.
  5. Implement `GET /api/reports/:id` fetching single report ensuring ownership verification.
- **Files Involved**: `server/src/middleware/upload.js`, `server/src/utils/idGenerator.js`, `server/src/controllers/reportController.js`, `server/src/routes/reportRoutes.js`.
- **Expected Output**: Working endpoints to create and view citizen reports.
- **Completion Criteria**: Citizen token can upload a complaint, receive a `CF-XXXX` ID, and see it in `/api/reports/my`.

---

## Phase 5: Admin APIs
- **Objective**: Provide municipal administrators with full visibility and lifecycle control over all reports.
- **Tasks**:
  1. Implement `GET /api/admin/reports` with citizen details join, search queries, and status/category filters.
  2. Implement `GET /api/admin/reports/:id` retrieving complete report details.
  3. Implement `PATCH /api/admin/reports/:id/status` validating and updating status (`PENDING`, `IN_PROGRESS`, `RESOLVED`).
  4. Implement `GET /api/admin/stats` aggregating total, pending, in_progress, and resolved metrics.
  5. Mount protected routes on `/api/admin` with `requireAdmin` middleware.
- **Files Involved**: `server/src/controllers/adminController.js`, `server/src/routes/adminRoutes.js`.
- **Expected Output**: Protected administrative endpoints for report triage and status management.
- **Completion Criteria**: Admin token can retrieve all reports, inspect statistics, and transition report status; citizen token is rejected with 403 Forbidden.

---

## Phase 6: Frontend Setup
- **Objective**: Initialize the React + Vite single-page application and configure the design system, routing, and HTTP client.
- **Tasks**:
  1. Initialize React app with Vite in `client/`.
  2. Install `react-router-dom`, `axios`, `lucide-react`.
  3. Build the complete design system in `client/src/index.css`.
  4. Create centralized Axios API service in `client/src/services/api.js` with token injection and response interception.
  5. Implement `AuthContext` in `client/src/context/AuthContext.jsx` for persistent user state.
- **Files Involved**: `client/package.json`, `client/src/index.css`, `client/src/services/api.js`, `client/src/context/AuthContext.jsx`, `client/src/App.jsx`.
- **Expected Output**: React application running with routing and persistent authentication context.
- **Completion Criteria**: `npm run dev` serves the app without errors, global styles are applied.

---

## Phase 7: Citizen Frontend
- **Objective**: Build public and citizen-facing user interface pages.
- **Tasks**:
  1. Build `LandingPage.jsx` with hero section, issue categories showcase, and how-it-works guide.
  2. Build `LoginPage.jsx` and `RegisterPage.jsx` with input validation and demo quick-fill buttons.
  3. Build `CitizenDashboard.jsx` with personal metrics and prominent "+ Report a Problem" CTA.
  4. Build `ReportProblemPage.jsx` with category picker, location input, photo upload preview, and confirmation modal.
  5. Build `MyReportsPage.jsx` and `ReportDetailsPage.jsx` with visual status timeline.
- **Files Involved**: `client/src/pages/*`, `client/src/components/*`.
- **Expected Output**: Complete citizen experience from landing to reporting and tracking.
- **Completion Criteria**: User can register, login, file an issue with a photo, and view details.

---

## Phase 8: Admin Frontend
- **Objective**: Build administrative control center for municipal staff.
- **Tasks**:
  1. Build `AdminDashboard.jsx` featuring real-time statistics cards, search bar, category/status filters, and full reports data table.
  2. Build `AdminReportDetailsPage.jsx` showing citizen information, incident photo, and status update selector.
  3. Implement admin route protection preventing unauthorized citizen access.
- **Files Involved**: `client/src/pages/AdminDashboard.jsx`, `client/src/pages/AdminReportDetailsPage.jsx`, `client/src/components/AdminRoute.jsx`.
- **Expected Output**: Dedicated admin dashboard with instant status updates and metrics.
- **Completion Criteria**: Admin can view all tickets, filter by status, and change ticket status to `IN_PROGRESS` or `RESOLVED`.

---

## Phase 9: Backend / Frontend Integration
- **Objective**: Connect client API services with the live backend, ensuring seamless state synchronization and error recovery.
- **Tasks**:
  1. Configure proxy or client base URL to connect with `http://localhost:5000/api`.
  2. Test end-to-end token persistence across browser refreshes.
  3. Verify image uploads from browser to backend storage and image rendering in details views.
  4. Synchronize status transitions between admin updates and citizen dashboards.
- **Files Involved**: All client and server route/service integrations.
- **Expected Output**: Fully communicating client and server without mock or fake data.
- **Completion Criteria**: Report submitted on frontend is stored in PostgreSQL and immediately visible in admin dashboard.

---

## Phase 10: Testing
- **Objective**: Rigorously verify the complete 17-step end-to-end user flow and boundary conditions.
- **Tasks**:
  1. Execute automated integration test script simulating complete user and admin journeys.
  2. Verify edge cases: duplicate email, empty forms, unauthorized access, invalid status strings.
  3. Validate response times and error message clarity.
- **Files Involved**: `server/src/scripts/test-flow.js`.
- **Expected Output**: 100% passing tests for all happy and error paths.
- **Completion Criteria**: All 17 verification steps pass without errors.

---

## Phase 11: UI Polish
- **Objective**: Perfect UI responsiveness, loading states, empty states, and accessibility.
- **Tasks**:
  1. Test and adjust responsive views on mobile (375px), tablet (768px), and desktop.
  2. Ensure all buttons display loading spinners during async actions.
  3. Refine empty state graphics and typography.
  4. Verify contrast ratios and accessibility landmarks.
- **Files Involved**: `client/src/index.css`, component JSX files.
- **Expected Output**: Slick, responsive, professional civic-tech interface.
- **Completion Criteria**: Zero layout shifts, no horizontal scroll bugs on mobile, polished look.

---

## Phase 12: Deployment Configuration
- **Objective**: Prepare repository for production deployment on Vercel and Neon PostgreSQL.
- **Tasks**:
  1. Create `vercel.json` configuring frontend static output and backend serverless API routes.
  2. Prepare build scripts and dependency configurations.
  3. Validate production build (`npm run build` in `client/`).
- **Files Involved**: `vercel.json`, `package.json`.
- **Expected Output**: Deployable production bundles.
- **Completion Criteria**: `npm run build` succeeds with zero errors.

---

## Phase 13: Final Verification
- **Objective**: Perform holistic end-to-end validation of the running application.
- **Tasks**:
  1. Launch full stack locally and test via browser.
  2. Confirm complete citizen -> report -> admin status change -> citizen verified flow.
  3. Check console for any warnings or runtime errors.
- **Files Involved**: Entire workspace.
- **Expected Output**: Stable, functional web application ready for presentation.
- **Completion Criteria**: The complete end-to-end flow executes flawlessly.

---

## Phase 14: GitHub & Submission Preparation
- **Objective**: Initialize Git, make clean descriptive commits, and verify submission readiness.
- **Tasks**:
  1. Initialize git repository if needed.
  2. Stage all project files adhering to `.gitignore`.
  3. Commit organized milestones.
  4. Finalize `README.md` with demo instructions and slide outline.
- **Files Involved**: `.git`, `.gitignore`, `README.md`.
- **Expected Output**: Clean git repository history.
- **Completion Criteria**: `git status` clean, all assets committed, ready for submission.
