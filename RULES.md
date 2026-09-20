# CivicFix — Project Constitution & Engineering Rules

These 25 rules form the immutable constitution for the development of CivicFix. Every line of code, architectural boundary, and operational workflow must strictly adhere to these mandates.

---

### RULE 1: Build a real application.
No mock buttons or non-functional placeholder elements. Every UI element must trigger real underlying logic.

### RULE 2: No fake functionality.
Features exposed in the interface must execute real operations in the application runtime.

### RULE 3: No fake API responses.
All data consumed by the client must originate from live API endpoints querying the persistent database.

### RULE 4: Frontend must use the real client layer.
The `frontend/` UI must issue requests exclusively through the dedicated `client/` service and API layer.

### RULE 5: Client must communicate with the real backend.
The `client/` layer must communicate with the live Express.js server in `server/` via Axios.

### RULE 6: Backend must use PostgreSQL.
All mutations and queries must execute against real PostgreSQL tables using parameterized SQL.

### RULE 7: Authentication must actually work.
User registration, credential verification, JWT issuance, and session validation must be fully functional.

### RULE 8: Passwords must be hashed.
All user passwords must be hashed using bcrypt before database insertion. Never store plain text passwords.

### RULE 9: Use bcrypt.
Use `bcryptjs` with at least 10 salt rounds for secure password cryptography.

### RULE 10: Use JWT.
Stateless authorization tokens must be signed with a strong secret and validated on protected endpoints.

### RULE 11: Protect admin routes.
Every endpoint under `/api/admin/*` must enforce administrative role checks (`requireAdmin`), rejecting unauthorized callers with HTTP 403.

### RULE 12: Citizens can only access their own reports.
Citizens cannot inspect, tamper with, or query complaints belonging to other users.

### RULE 13: Validate user input.
All incoming request payloads must be strictly sanitized and validated for presence, format, and allowed values.

### RULE 14: Never expose password hashes.
All user queries and JSON serialization must explicitly strip `password_hash` from the response payload.

### RULE 15: Never commit secrets.
`.env` files must be excluded by `.gitignore`. Provide `.env.example` templates only.

### RULE 16: Use environment variables.
Database credentials, JWT secret keys, and port numbers must be read dynamically from environment variables.

### RULE 17: Keep frontend separate from client and server.
Maintain strict 4-module separation: `frontend/` (UI), `client/` (API client), `server/` (backend), and `api/` (deployment).

### RULE 18: No hardware.
The application is 100% software-only. No IoT devices, microcontrollers, or physical sensors.

### RULE 19: No AI.
Avoid unnecessary LLM or ML pipelines that add complexity and fragility to core civic operations.

### RULE 20: Prioritize MVP.
A robust, working, reliable end-to-end flow always takes precedence over aesthetic excess or over-engineering.

### RULE 21: Fix errors before continuing.
Never advance across phase boundaries with known bugs or broken dependencies. Diagnose and fix immediately.

### RULE 22: Test all major flows.
The complete 17-step end-to-end flow from citizen registration to admin resolution must be tested and verified.

### RULE 23: Keep code clean.
Maintain clean separation of concerns: controllers, routes, middleware, services, components, and contexts.

### RULE 24: Make the project deployable.
The codebase must build without warnings or errors, run with a single command, and be immediately ready for production hosting.

### RULE 25: Update documentation when architecture changes.
Keep root documentation files synchronized with code changes and folder structure reorganizations.
