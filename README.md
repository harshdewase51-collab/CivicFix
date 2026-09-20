# CivicFix

> **"Report. Track. Improve your community."**

CivicFix is a modern, responsive civic-tech web application designed to connect citizens directly with municipal authorities. Citizens can document and submit public infrastructure problems (such as potholes, broken streetlights, water leaks, and garbage hazards) with photos, location, and details, and track progress through a transparent resolution timeline. Municipal administrators are equipped with a real-time command dashboard to review evidence, manage municipal queues, and update issue statuses.

---

## 🌟 Key Features

### For Citizens
- **Instant Digital Reporting**: Report local issues in under 60 seconds with category, address, context, and photo evidence.
- **Unique Tracking Code**: Automatically receive a memorable tracking ID (e.g. `CF-1001`).
- **Personal Dashboard**: View real-time metrics of your submitted tickets and current statuses.
- **Visual Resolution Timeline**: Follow the lifecycle from *Submitted* to *Under Review*, *In Progress*, and *Resolved*.

### For Municipal Administrators
- **Operations Dashboard**: View system-wide metrics (Total Issues, Pending Triage, In Progress, Resolved).
- **Advanced Filtering & Search**: Filter issues by category and status or search by Report ID, location, or citizen.
- **Complete Dossier View**: Review citizen contact information, attached evidence photos, and full descriptions.
- **Status Lifecycle Control**: Update ticket statuses with immediate database persistence and citizen reflection.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, React Router 6, Lucide React icons, Custom Civic-Tech CSS Design System.
- **Client**: Dedicated API communication layer with Axios, token storage, and specialized service modules (`authService`, `reportService`, `adminService`).
- **Server**: Node.js, Express.js, Helmet, CORS, Multer (file uploads), Bcrypt.js, JSON Web Tokens (JWT), dedicated business logic service layer.
- **Database**: PostgreSQL (local PostgreSQL 18.x or cloud serverless Neon PostgreSQL) via `pg` pool.
- **Deployment**: Vercel-ready with serverless API configuration via `api/index.js` and `vercel.json`.

---

## 📂 Project Structure

```
CivicFix/
│
├── api/                        # Deployment & serverless support
│   └── index.js                # Vercel serverless adapter
│
├── frontend/                   # Pure UI Layer (React + Vite)
│   ├── src/
│   │   ├── components/         # Navbar, Footer, StatusBadge, StatCard, Timeline, RouteGuards
│   │   ├── pages/              # Landing, Login, Register, Dashboards, Report, Details
│   │   ├── layouts/            # MainLayout (header, main container, footer)
│   │   ├── context/            # AuthContext (consuming client/services/authService)
│   │   ├── hooks/              # useReports, useAdmin custom hooks
│   │   ├── styles/             # Global CSS design tokens
│   │   ├── App.jsx             # React Router definition
│   │   ├── main.jsx            # Application mount
│   │   └── index.css           # Civic-Tech Design System
│   ├── public/                 # Static assets (favicon.svg)
│   └── package.json            # Frontend dependencies
│
├── client/                     # Dedicated Client API Communication Layer
│   ├── api/
│   │   └── apiClient.js        # Axios instance, base URL, JWT header injection
│   ├── services/
│   │   ├── authService.js      # Login, registration, session verification
│   │   ├── reportService.js    # Create report, citizen report queries
│   │   └── adminService.js     # Admin report triage, filtering, status updates
│   ├── auth/
│   │   └── tokenStorage.js     # LocalStorage token & user state manager
│   ├── utils/
│   │   └── formatters.js       # Date, status, and category formatters
│   └── package.json            # Client service module
│
├── server/                     # Backend API & Business Logic
│   ├── src/
│   │   ├── controllers/        # authController, reportController, adminController
│   │   ├── routes/             # authRoutes, reportRoutes, adminRoutes
│   │   ├── services/           # authService, reportService, adminService
│   │   ├── middleware/         # auth (JWT & requireAdmin), upload (multer)
│   │   ├── db/                 # Postgres connection pool, migrate.js, seed.js
│   │   ├── utils/              # Atomic Report ID generator (CF-XXXX sequence)
│   │   ├── scripts/            # verify-backend.js, test-complete-17-steps.js
│   │   └── server.js           # Express app setup and health endpoint
│   ├── uploads/                # Local evidence image store
│   ├── package.json
│   └── .env.example
│
├── DATABASE.md                 # Database schema & sequence documentation
├── DESIGN.md                   # UI/UX design specifications & tokens
├── PHASES.md                   # 17-phase development roadmap
├── PRD.md                      # Product Requirements Document
├── RULES.md                    # 25 immutable engineering rules
├── test-pothole.png            # Verification test asset
├── vercel.json                 # Vercel deployment routing
├── package.json                # Root workspace orchestrator scripts
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [PostgreSQL](https://www.postgresql.org/) (v14+ or a [Neon](https://neon.tech/) cloud connection string)

### 1. Clone the Repository
```bash
git clone https://github.com/harshdewase51-collab/civicfix.git
cd civicfix
```

### 2. Configure Environment Variables
Inside `server/`, create a `.env` file based on `.env.example`:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:Harsh@123@localhost:5432/civicfix
JWT_SECRET=civicfix_secret_jwt_key_hackathon_2026
CLIENT_URL=http://localhost:5173
```

Inside `client/`, optional `.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run Database Migrations & Seed Admin
```bash
# Run migrations
npm run db:migrate

# Seed default administrator and sample data
npm run seed:admin
```

### 4. Start the Application
You can run both backend and frontend servers:

```bash
# Terminal 1: Backend Server (Port 5000)
npm run dev:server

# Terminal 2: Frontend Client (Port 5173)
npm run dev:frontend
```

---

## 🔑 Default Demo Accounts

For rapid hackathon evaluation, the seed script provisions:

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@civicfix.org` | `Admin@12345` | Full Admin Dashboard & Ticket Control |
| **Citizen** | `citizen@civicfix.org` | `Citizen@12345` | Citizen Dashboard & Issue Reporting |

*(The login page also includes 1-click **Fill Citizen Demo** and **Fill Admin Demo** buttons for instant evaluation).*

---

## 📡 API Overview

| Method | Endpoint | Protection | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Backend health check |
| `POST` | `/api/auth/register` | Public | Register new citizen |
| `POST` | `/api/auth/login` | Public | Authenticate user & get JWT |
| `GET` | `/api/auth/me` | Authenticated | Get current user profile |
| `POST` | `/api/reports` | Citizen | Submit new complaint with photo |
| `GET` | `/api/reports/my` | Citizen | Get reports submitted by citizen |
| `GET` | `/api/reports/:id` | Authenticated | Get detailed complaint view |
| `GET` | `/api/admin/reports` | Admin | Query all complaints with search/filters |
| `GET` | `/api/admin/reports/:id` | Admin | Detailed view with citizen details |
| `PATCH` | `/api/admin/reports/:id/status` | Admin | Update status (`PENDING`, `IN_PROGRESS`, `RESOLVED`) |
| `GET` | `/api/admin/stats` | Admin | System-wide status counts |

---

## 🧪 Testing

Execute automated test suites:
```bash
# Verify backend APIs (16 assertions)
npm run test:backend

# Verify master 17-step end-to-end user flow
npm run test:e2e
```

---

## 💡 Hackathon Presentation Outline

- **Slide 1 — CivicFix**: *"Report. Track. Improve your community."*
- **Slide 2 — The Problem**: Disjointed civic complaint processes, lack of photographic context, citizen disengagement, and administrative blind spots.
- **Slide 3 — The Solution**: A 60-second digital reporting system with evidence photos, atomic tracking IDs, and real-time status transparency.
- **Slide 4 — Live Workflow Demo**: Citizen reports pothole (`CF-1001`) ➔ Admin inspects photo and updates status ➔ Citizen verifies resolution.
- **Slide 5 — Tech Stack & Impact**: React, Node.js, Express, PostgreSQL, secure JWT, Vercel. Transparent municipal governance at zero hardware cost.

---

## 🔮 Future Scope
- Geolocation GPS capture & Interactive OpenStreetMap pin dropping.
- SMS & WhatsApp status notification webhooks.
- AI defect severity categorization.
- Ward-level supervisor dispatches and citizen resolution satisfaction ratings.

---

## 📄 License
MIT License. Built for the Hackathon.
