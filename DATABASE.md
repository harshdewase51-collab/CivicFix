# CivicFix — Database Documentation

## 1. Database Overview

CivicFix uses **PostgreSQL** as its relational database management system. It is fully compatible with both local PostgreSQL instances (e.g., PostgreSQL 18.x) and cloud serverless PostgreSQL providers such as **Neon PostgreSQL**.

The database architecture is designed to support:
- Strict relational integrity with foreign keys and cascade rules.
- Fast lookups and filtering via targeted B-tree indexes.
- Atomic and sequential Report ID generation (`CF-1001`, `CF-1002`, ...).
- Role-based data separation between citizens and municipal administrators.

---

## 2. PostgreSQL / Neon Configuration

Connection configuration is managed via environment variables:

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | Full PostgreSQL connection URI | `postgresql://user:password@ep-xyz.neon.tech/civicfix?sslmode=require` |
| `PGHOST` | Hostname (fallback if no `DATABASE_URL`) | `localhost` |
| `PGPORT` | Port number | `5432` |
| `PGUSER` | Database user | `postgres` |
| `PGPASSWORD` | Database password | `<your_password>` |
| `PGDATABASE` | Database name | `civicfix` |

For cloud connections (e.g., Neon), SSL mode is enabled (`ssl: { rejectUnauthorized: false }`). For local development, SSL is automatically disabled when connecting to localhost.

---

## 3. Tables & Schema Specification

### 3.1 `users` Table

Stores authenticated citizen and administrator accounts.

| Column | Data Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Sequence | Unique integer identifier for each user |
| `name` | `VARCHAR(100)` | `NOT NULL` | None | Full name of the user |
| `email` | `VARCHAR(255)` | `NOT NULL, UNIQUE` | None | Normalized email address for authentication |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | None | Bcrypt-hashed password (10 salt rounds) |
| `role` | `VARCHAR(20)` | `NOT NULL, CHECK (role IN ('citizen', 'admin'))` | `'citizen'` | User authorization level |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | Account creation timestamp |

### 3.2 `reports` Table

Stores all civic problem complaints submitted by citizens.

| Column | Data Type | Constraints | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `SERIAL` | `PRIMARY KEY` | Sequence | Internal database sequence ID |
| `report_id` | `VARCHAR(20)` | `NOT NULL, UNIQUE` | Generated | Public tracking identifier (e.g., `CF-1001`) |
| `user_id` | `INTEGER` | `NOT NULL, REFERENCES users(id) ON DELETE CASCADE` | None | Foreign key linking report to submitting citizen |
| `category` | `VARCHAR(50)` | `NOT NULL` | None | Category of the civic issue |
| `description` | `TEXT` | `NOT NULL` | None | Detailed explanation of the civic issue |
| `location` | `VARCHAR(255)` | `NOT NULL` | None | Street address, landmark, or intersection |
| `image_url` | `VARCHAR(500)` | `NULL` | `NULL` | Public relative or absolute URL to evidence photo |
| `status` | `VARCHAR(20)` | `NOT NULL, CHECK (status IN ('PENDING', 'IN_PROGRESS', 'RESOLVED'))` | `'PENDING'` | Current status of the ticket |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | Submission timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL` | `CURRENT_TIMESTAMP` | Timestamp of last status modification |

---

## 4. Enums and Permitted Values

### 4.1 User Roles
- `citizen`: Can report civic problems, view personal reports, and track resolution.
- `admin`: Can view all community reports, filter by category/status, view citizen contact info, and update report statuses.

### 4.2 Report Categories
Valid categories enforced in backend validation and UI selectors:
1. `Pothole`
2. `Streetlight`
3. `Garbage`
4. `Water Leakage`
5. `Traffic Signal`
6. `Public Infrastructure`
7. `Other`

### 4.3 Report Statuses
Enforced via SQL `CHECK` constraint:
1. `PENDING`: Initial state upon citizen submission.
2. `IN_PROGRESS`: Municipal authority has acknowledged and scheduled or started work.
3. `RESOLVED`: Field work is verified and complete.

---

## 5. Relationships & Integrity Rules

```mermaid
erDiagram
    USERS ||--o{ REPORTS : "submits"
    USERS {
        int id PK
        string name
        string email UK
        string password_hash
        string role
        timestamptz created_at
    }
    REPORTS {
        int id PK
        string report_id UK
        int user_id FK
        string category
        text description
        string location
        string image_url
        string status
        timestamptz created_at
        timestamptz updated_at
    }
```

- **One-to-Many**: One user can submit multiple reports. Each report belongs to exactly one user.
- **Referential Integrity**: `reports.user_id` strictly references `users.id`.
- **Cascade Deletion**: If a user is deleted, their associated complaints are cleaned up (`ON DELETE CASCADE`).

---

## 6. Indexes for Performance

```sql
-- Fast lookup for citizen's personal report dashboard
CREATE INDEX idx_reports_user_id ON reports(user_id);

-- Fast lookup for public report ID tracking (e.g. CF-1001)
CREATE UNIQUE INDEX idx_reports_report_id ON reports(report_id);

-- Fast filtering by status in admin dashboard
CREATE INDEX idx_reports_status ON reports(status);

-- Fast filtering by category in admin and analytics views
CREATE INDEX idx_reports_category ON reports(category);

-- Fast ordering by latest submission
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
```

---

## 7. Report ID Generation Strategy

CivicFix uses a clean, citizen-friendly, and memorable identifier format:

$$\text{Format: } \mathbf{CF}\text{-}\mathbf{\{1000 + N\}}$$

Example sequence:
- `CF-1001`
- `CF-1002`
- `CF-1003`

### Implementation
A dedicated sequence `report_id_seq` starting at 1001 is maintained in PostgreSQL. On insertion, the default value or trigger/generator executes:
```sql
CREATE SEQUENCE IF NOT EXISTS report_code_seq START WITH 1001;
```
When creating a record, `report_id` is assigned atomically:
```sql
'CF-' || nextval('report_code_seq')
```
This guarantees strict uniqueness, avoids concurrency race conditions, and prevents ID enumeration collisions.

---

## 8. Example Records

### Users
```sql
INSERT INTO users (id, name, email, password_hash, role, created_at)
VALUES
  (1, 'Admin Officer', 'admin@civicfix.org', '$2a$10$wN9PzY2r5u2q9QZ18K7eSeE0uFhG1O9s3XoJ.zW6Xw1B6Jp8n4Wlq', 'admin', NOW()),
  (2, 'Jane Citizen', 'jane@example.com', '$2a$10$a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a', 'citizen', NOW());
```

### Reports
```sql
INSERT INTO reports (id, report_id, user_id, category, description, location, image_url, status, created_at, updated_at)
VALUES
  (1, 'CF-1001', 2, 'Pothole', 'Deep pothole dangerous for two-wheelers near the junction.', 'Main Road & 4th Avenue Cross', '/uploads/demo-pothole.jpg', 'PENDING', NOW(), NOW()),
  (2, 'CF-1002', 2, 'Streetlight', 'Streetlight pole #14 has been flickering and completely off for 3 days.', 'Oak Street in front of Community Hall', NULL, 'IN_PROGRESS', NOW(), NOW());
```
