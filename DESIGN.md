# CivicFix — UI/UX Design Specification

## 1. Design Philosophy & Civic-Tech Identity

CivicFix is designed as an accessible, high-trust municipal public utility and administrative control system. Its aesthetic avoids frivolous gimmicks and generic AI-template decorations in favor of:
- **Clarity and High Contrast**: Easy readability for citizens outdoors and on mobile devices.
- **Institutional Trust**: Grounded color palette featuring civic deep blue, calm slate, clean white, and purposeful semantic accents.
- **Instant Usability**: One-click paths to report issues, intuitive file uploading, and crystal-clear status tracking.
- **Zero Confusion**: Standardized badges, simple progress timelines, and actionable feedback banners.

---

## 2. Design System & Style Tokens

### 2.1 Color Palette

```css
:root {
  /* Brand Civic Colors */
  --color-primary: #1E3A8A;         /* Civic Blue / Royal Navy */
  --color-primary-hover: #172554;
  --color-primary-light: #EFF6FF;
  
  --color-accent: #0D9488;          /* Civic Teal / Public Works */
  --color-accent-hover: #0F766E;

  /* Neutral Backgrounds & Surfaces */
  --color-bg-base: #F8FAFC;         /* Soft Cool Slate */
  --color-bg-surface: #FFFFFF;      /* Clean White */
  --color-bg-muted: #F1F5F9;        /* Input and Table Header Background */
  
  /* Typography & Borders */
  --color-text-main: #0F172A;       /* Slate 900 */
  --color-text-muted: #475569;      /* Slate 600 */
  --color-text-subtle: #94A3B8;     /* Slate 400 */
  --color-border: #E2E8F0;          /* Slate 200 */
  --color-border-hover: #CBD5E1;

  /* Semantic Status Colors */
  --status-pending-text: #B45309;    /* Amber 700 */
  --status-pending-bg: #FEF3C7;      /* Amber 100 */
  --status-pending-border: #FCD34D;
  
  --status-progress-text: #1D4ED8;   /* Blue 700 */
  --status-progress-bg: #DBEAFE;     /* Blue 100 */
  --status-progress-border: #93C5FD;

  --status-resolved-text: #047857;   /* Emerald 700 */
  --status-resolved-bg: #D1FAE5;     /* Emerald 100 */
  --status-resolved-border: #6EE7B7;

  --color-danger: #DC2626;
  --color-danger-bg: #FEE2E2;

  /* Typography */
  --font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
}
```

---

## 3. Core Components

### 3.1 Status Badges
- **Pending**: Amber badge with Clock icon (`● Pending`). Signals under initial triage.
- **In Progress**: Blue badge with Activity/Wrench icon (`● In Progress`). Signals work crew assigned.
- **Resolved**: Emerald badge with CheckCircle icon (`● Resolved`). Signals verified fix.

### 3.2 Status Timeline
Displayed on the Report Details page to give citizens total transparency:
```
[1. Submitted] ───► [2. Under Review] ───► [3. In Progress] ───► [4. Resolved]
```
- Active/completed steps have solid brand fill and checkmarks.
- Future steps remain in neutral muted gray.

### 3.3 Cards & Metric Panels
- Elevated with `--shadow-sm`, subtle border (`--color-border`), and hover elevation (`--shadow-md`).
- Metric cards display an icon, bold numerical stat (e.g. `12`), descriptive label, and colored indicator bar.

### 3.4 Responsive Data Tables
- Desktop: Full tabular grid with columns: ID, Category, Location, Citizen, Date, Status, and Action.
- Mobile: Transforms gracefully into stacked card records with clear touch targets.

### 3.5 Feedback States
- **Loading**: Subtle pulsating skeleton placeholders or spinner inside submit buttons (disabling repetitive clicks).
- **Empty States**: Friendly illustration/icon with helpful prompt: *"No reports submitted yet. Spot an issue in your neighborhood? Click 'Report Problem' to notify city services."*
- **Error Banners**: High-contrast red banners with explicit explanations and recovery actions.

---

## 4. Page Architecture & Flows

### 4.1 Public Pages
1. **Landing Page (`/`)**:
   - Header with Logo, navigation links, and "Sign In" / "Register" CTAs.
   - Hero banner with headline *"Report. Track. Improve your community."*, concise mission statement, and quick CTAs.
   - Civic Issues Showcase: Visual grid highlighting common municipal problems (Potholes, Broken Streetlights, Overflowing Garbage, Water Leaks, Broken Signals, Infrastructure damage).
   - How It Works Section: 3-step workflow (Snap & Submit → City Dispatches → Track to Resolution).
   - Civic Impact banner.
2. **Login Page (`/login`)**:
   - Clean card with email/password, validation, and demo credentials quick-fill buttons (`Fill Citizen Demo`, `Fill Admin Demo`) for instant hackathon evaluation.
3. **Register Page (`/register`)**:
   - Form requesting Full Name, Email, Password, and Password Confirmation. Direct login link.

### 4.2 Citizen Pages
1. **Citizen Dashboard (`/dashboard`)**:
   - Personalized welcome header: *"Welcome back, [Name]"*.
   - Stat cards: Total Reported, Pending, In Progress, Resolved.
   - Prominent primary CTA button: **+ Report a Problem**.
   - "Recent Reports" summary table/cards with quick links to view details.
2. **Report Problem Page (`/report`)**:
   - Form fields:
     - Category Selector (Pothole, Streetlight, Garbage, Water Leakage, Traffic Signal, Public Infrastructure, Other).
     - Location input (e.g. Street, landmark, crossroad).
     - Description textarea (Context and specifics).
     - Evidence photo upload box (Drag-and-drop or file picker with live thumbnail preview).
   - Submit action with loading spinner.
   - Post-submission confirmation modal displaying the generated Report ID (e.g. `CF-1001`) with direct "Track Report" button.
3. **My Reports Page (`/reports`)**:
   - List and grid view of all complaints submitted by the authenticated citizen.
   - Filter by status (`All`, `Pending`, `In Progress`, `Resolved`) and search bar.
4. **Report Details Page (`/reports/:id`)**:
   - Prominent Report ID and Category header.
   - Visual step-by-step resolution timeline.
   - Location, creation timestamp, and last update timestamp.
   - Evidence photo (with lightbox preview).
   - Detailed incident description.

### 4.3 Admin Pages
1. **Admin Dashboard (`/admin`)**:
   - System-wide statistics: Total Complaints, Pending Triage, Active In-Progress, Total Resolved.
   - Comprehensive filter bar: Search by Report ID or location, filter by category dropdown, filter by status dropdown.
   - Full reports management table with Citizen Name, Citizen Email, Category, Location, Date, Status badge, and "View & Manage" action.
2. **Admin Report Details Page (`/admin/reports/:id`)**:
   - Complete dossier including citizen contact info (Name, Email).
   - Attached evidence photo and description.
   - **Administrative Action Panel**: Status update selector (`PENDING`, `IN_PROGRESS`, `RESOLVED`) and "Save Status" button with instant update feedback.

---

## 5. Responsive Breakpoints

- **Mobile (< 640px)**: Single column layouts, sticky mobile top navigation with hamburger menu, stacked cards replacing horizontal tables, 100% width buttons.
- **Tablet (640px - 1024px)**: 2-column dashboard grids, fluid search and filter bar.
- **Desktop (> 1024px)**: Max-width 1200px container, 4-column metric cards, rich tabular management views.
