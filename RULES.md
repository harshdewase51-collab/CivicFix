# CivicFix — Project Constitution & Development Rules

These 25 rules form the immutable constitution for the development of CivicFix. Every line of code, architecture decision, and testing procedure must strictly adhere to these mandates.

---

### RULE 1: Build a real functional application.
No mock buttons or non-functional placeholder elements. Every UI element must trigger its real underlying logic.

### RULE 2: Do not create fake functionality.
Features exposed in the interface must execute real operations in the application runtime.

### RULE 3: Do not use fake API responses in production code.
All data consumed by the client must originate from live API endpoints querying the persistent database.

### RULE 4: Frontend must communicate with the actual backend.
The React client must issue real HTTP requests via Axios to the Express.js server.

### RULE 5: Backend must communicate with the actual PostgreSQL database.
All mutations and queries must execute against real PostgreSQL tables using parameterized SQL.

### RULE 6: Authentication must actually work.
User registration, credential verification, JWT issuance, and session validation must be fully functional.

### RULE 7: Passwords must never be stored as plain text.
Never write raw passwords to logs, database rows, memory dumps, or API responses.

### RULE 8: Use bcrypt for password hashing.
All user passwords must be hashed using `bcryptjs` with a work factor of at least 10 salt rounds prior to persistence.

### RULE 9: Use JWT authentication.
Stateless authorization tokens must be signed with a strong secret and validated on every protected API call.

### RULE 10: Admin APIs must be protected.
Every endpoint under `/api/admin/*` must enforce administrative role checks (`requireAdmin`), rejecting unauthorized callers with HTTP 403.

### RULE 11: Citizens must only access their own reports.
Citizens cannot inspect, tamper with, or query complaints belonging to other users.

### RULE 12: Validate all incoming data.
All request payloads must be strictly sanitized and validated for presence, type, length, and allowed enum values before processing.

### RULE 13: Never expose password hashes.
All user queries and JSON serialization must explicitly strip `password_hash` from the response payload.

### RULE 14: Use environment variables for secrets.
Database credentials, JWT secret keys, and port numbers must be read dynamically from environment variables via `dotenv`.

### RULE 15: Never commit .env files.
`.env` files must be excluded by `.gitignore`. Provide `.env.example` with safe placeholder templates only.

### RULE 16: Keep the UI responsive.
The interface must render seamlessly and cleanly on mobile viewports (375px+), tablets, and high-resolution desktops.

### RULE 17: Do not add unnecessary features before the MVP works.
Scope discipline is paramount. Fulfill the core citizen and admin workflows before considering secondary enhancements.

### RULE 18: Do not use hardware.
The application is 100% software-only. No IoT devices, microcontrollers, or physical sensors.

### RULE 19: Do not add AI unless specifically required.
Avoid complex LLM or ML pipelines that add latency, cost, and fragility to core civic operations.

### RULE 20: Do not use unnecessary third-party APIs.
Avoid external dependencies that can fail, throttle, or complicate local development and evaluation.

### RULE 21: Prioritize working functionality.
A robust, working, reliable end-to-end flow always takes precedence over aesthetic excess or architectural over-engineering.

### RULE 22: Fix errors before moving to the next phase.
Never advance across phase boundaries with known bugs or broken dependencies. Diagnose, resolve, and re-test immediately.

### RULE 23: Test the complete user flow.
The complete 17-step end-to-end flow from citizen registration to admin resolution must be tested and verified.

### RULE 24: Keep code clean and maintainable.
Maintain clean separation of concerns: controllers, routes, middleware, services, components, and contexts. Use clear naming.

### RULE 25: The final application must be deployable.
The codebase must build without warnings or errors, run with a single command, and be immediately ready for production hosting.
