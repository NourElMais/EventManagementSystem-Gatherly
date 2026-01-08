# Gatherly Platform

Gatherly is a full‑stack web app that coordinates clients, hosts, and administrators around premium event staffing. The project combines a React front end with an Express/MySQL API so the team can manage event requests, staffing pipelines, and logistics (clothing inventory, transportation, reviews) from a single workspace.

## Tech Stack
- **Frontend:** React 19 (CRA), React Router, Axios, Tailwind/PostCSS, Bootstrap accents, lucide-react icons.
- **Backend:** Node.js + Express 5, MySQL (via mysql2 pool), JWT-based auth, bcryptjs, CORS, dotenv.
- **Tooling:** React Scripts, Testing Library, Web Vitals; npm scripts for build/test; shared REST client in `frontend/src/services/api.js`.

## Project Structure
```
Project-DATABASE/
├── backend/                 # Express API + MySQL integration
│   ├── config/db.js         # Connection pool driven by .env
│   ├── middleware/auth.js   # JWT verification + role guards
│   ├── routes/              # Events, applications, admin, hosts, clients, etc.
│   ├── utils/               # Helpers (transportation summaries, etc.)
│   ├── pics/                # Static clothing/dress images served at /pics
│   └── server.js            # API bootstrap + dynamic port retry
├── frontend/                # React SPA
│   ├── src/
│   │   ├── Pages/           # Home, Admin, Client, Host/Team Leader experiences
│   │   ├── components/      # Shared UI, admin dashboards, team leader tools, etc.
│   │   ├── services/api.js  # Axios instance + domain-specific APIs
│   │   └── hooks/           # Custom hooks (if any)
│   └── public/              # CRA static assets
├── fixes/, login/           # Additional artifacts (reference prototypes, etc.)
├── package.json             # Root-level shared dependencies (bcrypt, JWT, etc.)
└── README.md                # You are here
```

## Core Features
- **Hosts & Team Leaders**
  - Sign up, accept code of conduct, and maintain eligibility status.
  - Browse accepted events, view assigned logistics (clothing, transportation), and submit applications.
  - Team leaders access consolidated event dashboards with host rosters, attendance, and reviews.
- **Administrators**
  - Review/approve client event requests and host applications from tabbed dashboards.
  - Manage host lifecycle (pending approvals, blocks), clothing inventory/stock, and transportation assignments.
  - Access platform stats (events, staffing, clients) via `AdminStats`.
- **Clients**
  - Request events, manage profiles, and track training/host performance relevant to their events.
  - Landing page highlights marketing content (Hero, Features, About Us) plus authentication modal for role-based onboarding.
- **Shared Experience**
  - Authentication modal supports host/client onboarding with JWT stored in `localStorage`.
  - Navbar/Footer plus marketing sections evenly shared among devs; responsive layout via Tailwind/Bootstrap utility mix.
  - Axios service automatically injects auth tokens and targets `/api` via CRA proxy (falls back to `http://localhost:5050` in dev).

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- MySQL 8 (or compatible) running locally or accessible remotely

### 1. Clone & Install
```bash
git clone <repo-url> Project-DATABASE
cd Project-DATABASE

# Backend deps
cd backend
npm install

# Frontend deps
cd ../frontend
npm install
```

### 2. Configure Environment
Create `backend/.env` with your database + JWT secrets:
```ini
PORT=5050                    # optional; server auto-increments if busy
DB_HOST=localhost
DB_USER=gatherly_user
DB_PASS=supersecret
DB_NAME=gatherly
JWT_SECRET=change_me
```

Optionally add any other per-environment settings you introduce later (e.g., mail, S3). The frontend relies on CRA defaults and uses the dev proxy from `frontend/package.json`; no .env is required unless you override `REACT_APP_*` vars.

### 3. Run the Backend
```bash
cd backend
npm start
# Server listens on PORT (default 5050) and retries nearby ports if unavailable.
```

Verify health:
```bash
curl http://localhost:5050/health
```

### 4. Run the Frontend
```bash
cd frontend
npm start
```
CRA serves the app at `http://localhost:3000` and forwards API calls to `http://localhost:5050/api` through the `proxy` setting.

### 5. Build/Test
```bash
# Frontend production build
cd frontend
npm run build

# Frontend tests (React Testing Library)
npm test
```

## API Overview
All endpoints are prefixed with `/api`. Highlights:
- `GET /api/events` – public feed of accepted events (includes clothing + transportation summaries).
- `GET /api/events/:id/team-view` – team leader/admin event overview (requires JWT + role guard).
- `GET /api/applications` & `PUT /api/applications/:id` – manage host applications/assign roles.
- `POST /api/auth/signup/host|client`, `POST /api/auth/login` (see `routes/authRoutes.js`) – onboarding + authentication.
- `GET /api/admins/stats`, `/event-requests`, `/hosts/pending`, `/clients`, `/clothing` – admin dashboards.
- `POST /api/hosts/code-of-conduct/accept` – finalize host eligibility.
- `POST /api/transportation/:eventId` – attach transportation logistics.
- `GET/POST /api/events/:eventId/reviews` – review lifecycle for hosts/team leaders with admin visibility controls.

Refer to the files in `backend/routes/` for complete request/response payloads.

## Development Notes
- **Auth:** `middleware/auth.js` decodes JWTs and enforces `admin`, `user` (hosts/team leaders), and `client` roles. Hosts must be approved/active before accessing protected endpoints (`requireActiveHost`).
- **Database:** MySQL schema should include tables referenced in queries (EVENTS, EVENT_APP, CLIENTS, USERS, CLOTHING, CLOTHING_STOCK, TRANSPORTATION, REVIEWS). Run migrations/seed scripts that match these table names before booting the API.
- **Static Assets:** Place clothing images in `backend/pics/`; they are served at `http://localhost:5050/pics/<filename>`.
- **Styling:** Tailwind classes live in `colors.css` and `App.css`, while `tailwind.config.js` in the frontend root declares the palette (pearl, ocean, cream, etc.).

## Contributing
1. Create a feature branch per user group (Hosts/Team Leaders, Admin, Clients) as previously assigned.
2. Maintain lint/test discipline before PRs.
3. Document new env vars, routes, or shared components in this README so onboarding stays simple.
