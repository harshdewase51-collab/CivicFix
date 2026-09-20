-- =============================================================================
-- CivicFix — Complete PostgreSQL Schema Initialization
-- =============================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin')),
  phone VARCHAR(30),
  area VARCHAR(150),
  avatar_url VARCHAR(500),
  avatar_type VARCHAR(20) DEFAULT 'preset',
  avatar_preset VARCHAR(50) DEFAULT 'avatar_01',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index on users email for high-speed authentication lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Report Tracking Code Sequence (starts at 1001 -> CF-1001)
CREATE SEQUENCE IF NOT EXISTS report_code_seq START WITH 1001;

-- 3. Reports Table
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  report_id VARCHAR(20) NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'Pothole',
    'Streetlight',
    'Garbage',
    'Water Leakage',
    'Traffic Signal',
    'Public Infrastructure',
    'Other'
  )),
  description TEXT NOT NULL,
  location VARCHAR(255) NOT NULL,
  image_url VARCHAR(500),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'RESOLVED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes on reports for fast dashboard querying and filtering
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_report_id ON reports(report_id);
