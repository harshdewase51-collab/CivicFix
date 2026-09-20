# CivicFix

> **"Report. Track. Improve your community."**

CivicFix is a modern, responsive civic-tech web application designed to connect citizens directly with municipal authorities. Citizens can easily document and submit public infrastructure problems (such as potholes, broken streetlights, water leaks, and garbage hazards) with photos, location, and details, and track progress through a transparent resolution timeline. Municipal administrators are equipped with a real-time command dashboard to review evidence, manage municipal queues, and update issue statuses.

---

## 🌟 Key Features

### For Citizens
- **Instant Digital Reporting**: Report local issues in under 60 seconds with category, address, context, and photo evidence.
- **Unique Tracking Code**: Automatically receive a memorable tracking ID (e.g. `CF-1001`).
- **Personal Dashboard**: View real-time metrics of your submitted tickets and current statuses.
- **Visual Resolution Timeline**: Follow the lifecycle from *Submitted* to *Under Review*, *In Progress*, and *Resolved*.

### For Municipal Administrators
- **Operations Dashboard**: View system-wide metrics (Total Issues, Pending Triage, In Progress, Resolved).
- **Advanced Filtering & Search**: Filter issues by category and status or search by Report ID and location.
- **Complete Dossier View**: Review citizen contact information, attached evidence photos, and full descriptions.
- **Status Lifecycle Control**: Update ticket statuses with immediate database persistence and citizen reflection.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, React Router 6, Axios, Lucide React icons, Custom Civic-Tech CSS Design System.
- **Backend**: Node.js, Express.js, Helmet, CORS, Multer (file uploads), Bcrypt.js, JSON Web Tokens (JWT).
- **Database**: PostgreSQL (local PostgreSQL 18.x or cloud serverless Neon PostgreSQL) via `pg` pool.
- **Deployment**: Vercel-ready with monolithic or decoupled serverless API configuration.

---

## 📂 Project Structure

```
civicfix/
├── client/                     # React + Vite frontend SPA
│   ├── src/
│   │   ├── components/         # Navbar, Footer, StatusBadge, StatCard, Timeline, RouteGuards
│   │   ├── context/            # AuthContext (JWT, user state, login/logout)
│   │   ├── pages/              # Landing, Login, Register, Citizen Dashboard, Report, Admin Views
│   │   ├── services/           # Centralized Axios API service
│   │   ├── App.jsx             # React router configuration
│   │   ├── main.jsx            # React root
│   │   └── index.css           # Civic-Tech Design System
│   └── package.json
│
├── server/                     # Node.js + Express API backend
│   ├── src/
│   │   ├── controllers/        # authController, reportController, adminController
│   │   ├── db/                 # Postgres connection pool, migrate.js, seed.js
│   │   ├── middleware/         # auth (JWT & requireAdmin), upload (multer), errorHandler
│   │   ├── routes/             # authRoutes, reportRoutes, adminRoutes
│   │   ├── utils/              # Atomic Report ID generator
│   │   └── server.js           # Express app setup and health endpoint
│   ├── uploads/                # Local evidence image store
│   ├── package.json
│   └── .env.example
│
├── DATABASE.md                 # Database schema & sequence documentation
├── DESIGN.md                   # UI/UX design specifications & tokens
├── PHASES.md                   # Detailed 15-phase development roadmap
├── PRD.md                      # Product Requirements Document
├── RULES.md                    # 25 immutable engineering rules
├── vercel.json                 # Vercel deployment configuration
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
JWT_SECRET=civicfix_super_secret_jwt_key_2026_hackathon
CLIENT_URL=http://localhost:5173
```
*(Or use individual `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `PGPORT` variables).*

### 3. Run Database Migrations & Seeds
From the `server/` directory:
```bash
cd server
npm install
npm run db:migrate
npm run db:seed
```
This provisions the database tables, creates the atomic `CF-XXXX` sequence, and generates the default administrative account.

### 4. Start the Backend Server
```bash
npm run dev
# Backend runs on http://localhost:5000
```
Verify health:
```bash
curl http://localhost:5000/api/health
```

### 5. Start the Frontend Client
In a separate terminal:
```bash
cd client
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 🔑 Default Demo Accounts

For rapid hackathon evaluation, the seed script provisions:

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@civicfix.org` | `Admin@12345` | Full Admin Dashboard & Ticket Control |
| **Citizen** | `citizen@civicfix.org` | `Citizen@12345` | Citizen Dashboard & Issue Reporting |

*(The login page also includes 1-click **Fill Demo Credentials** buttons for seamless testing!)*

---

## 📡 API Overview

| Method | Endpoint | Protection | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Backend health check |
| `POST` | `/api/auth/register` | Public | Register new citizen |
| `POST` | `/api/auth/login` | Public | Authenticate user & get JWT |
| `GET` | `/api/auth/me` | User | Get current user profile |
| `POST` | `/api/reports` | Citizen | Submit new complaint with photo |
| `GET` | `/api/reports/my` | Citizen | Get reports submitted by citizen |
| `GET` | `/api/reports/:id` | Authenticated | Get detailed complaint view |
| `GET` | `/api/admin/reports` | Admin | Query all complaints with filters |
| `GET` | `/api/admin/reports/:id` | Admin | Detailed view with citizen details |
| `PATCH` | `/api/admin/reports/:id/status` | Admin | Update status (`PENDING`, `IN_PROGRESS`, `RESOLVED`) |
| `GET` | `/api/admin/stats` | Admin | System-wide status counts |

---

## 📱 Screenshots & Demo Flow

*(Visual documentation placeholder — see `walkthrough.md` for live test captures)*

1. **Public Landing**: Civic problem overview and direct calls to action.
2. **Citizen Reporting**: Fast form with drag-and-drop photo attachment.
3. **Ticket Created**: Immediate `CF-1001` confirmation code.
4. **Admin Dashboard**: Real-time stats cards and triage data table.
5. **Status Update**: Admin moves ticket to *In Progress* and *Resolved*.
6. **Citizen Tracking**: Live reflection of green *Resolved* badge on citizen portal.

---

## 💡 Hackathon Presentation Outline

- **Slide 1 — CivicFix**: *"Report. Track. Improve your community."*
- **Slide 2 — The Problem**: Disjointed civic complaint processes, lack of photographic context, citizen disengagement, and administrative blind spots.
- **Slide 3 — The Solution**: A 60-second digital reporting system with evidence photos, atomic tracking IDs, and real-time status transparency.
- **Slide 4 — Live Workflow Demo**: Citizen reports pothole (`CF-1001`) ➔ Admin inspects photo and updates status ➔ Citizen verifies resolution.
- **Slide 5 — Tech Stack & Impact**: React, Express, PostgreSQL, secure JWT, Vercel. Transparent governance at zero hardware cost.

---

## 🔮 Future Scope
- Geolocation GPS capture & Interactive OpenStreetMap pin dropping.
- SMS & WhatsApp status notification webhooks.
- AI defect severity categorization.
- Ward-level supervisor dispatches and citizen resolution satisfaction ratings.

---

## 📄 License
MIT License. Built for the Hackathon.
