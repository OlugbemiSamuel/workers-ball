# Workers Ball 2026 — Accreditation System Build Log

## Project Goal
Church event management & accreditation system for "Workers Ball 2026" (Harvesters Globe Ologolo, 22nd Nov 2026, 4PM).
Stack: React + TypeScript + Express + Node.js + SQLite (sql.js).
Deploy target: Namecheap Shared Hosting (cPanel File Manager, Setup Node.js App).
Repository: https://github.com/OlugbemiSamuel/workers-ball

## Project Structure (Rebuilt from texcellence patterns)
```
workers-ball/
├── agents.md              # This tracking file
├── package.json           # Root package.json
├── .env                   # Environment variables (NOT committed)
├── .env.example           # Environment variables template
├── .gitignore
├── client/                # React + TypeScript + Vite frontend
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── index.css
│       ├── App.tsx
│       ├── services/
│       │   └── api.ts
│       ├── pages/
│       │   ├── HomePage.tsx
│       │   ├── RegisterPage.tsx      # Event background + stacked form
│       │   ├── LoginPage.tsx         # Admin login
│       │   ├── DashboardPage.tsx     # Sidebar layout, guest management
│       │   ├── AccreditPage.tsx      # Camera scanner, verify button
│       │   ├── ImportExportPage.tsx  # Excel/CSV import/export
│       │   └── ReportsPage.tsx       # PDF accreditation report
│       ├── types/
│       │   ├── guest.types.ts
│       │   └── auth.types.ts
│       └── services/
│           └── api.ts
├── server/                # Express + Node.js backend
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env               # Environment variables (NOT committed)
│   ├── .env.example
│   └── src/
│       ├── index.ts
│       ├── app.ts
│       ├── db/
│       │   ├── connection.ts    # node:sqlite (no native compile)
│       │   └── schema.ts
│       ├── types/
│       │   ├── guest.types.ts
│       │   └── auth.types.ts
│       ├── errors/
│       │   └── http.error.ts
│       ├── middleware/
│       │   └── requireAuth.ts
│       ├── services/
│       │   ├── auth.service.ts
│       │   ├── guest.service.ts
│       │   ├── email.service.ts   # Nodemailer + QR code
│       │   └── csv-import.service.ts
│       ├── repositories/
│       │   └── guest.repository.ts
│       ├── controllers/
│       │   ├── guest.controller.ts
│       │   └── auth.controller.ts
│       ├── routes/
│       │   ├── guest.routes.ts
│       │   ├── auth.routes.ts
│       │   ├── registration.routes.ts
│       │   └── stats.routes.ts
│       ├── utils/
│       │   └── qrcode-gen.ts
│       └── scripts/
│           └── build-report.ts
└── database.sqlite          # SQLite database file (created on first run)
```

## Build Architecture (Route → Controller → Service → Repository)
Follows the exact same layered pattern as the texcellence conference project:
- **Route**: Express route handlers
- **Controller**: HTTP request/response handling
- **Service**: Business logic and validation
- **Repository**: Direct SQLite database access

## Commit History (15 commits)
1. `feat: init project structure and agents.md`
2. `feat: express server with sql.js database and env config`
3. `feat: guest crud api create list search edit delete`
4. `feat: accreditation flow manual search qr scan confirm with already-accredited guard`
5. `feat: ticket email sending with html template qr embed and send-count tracking`
6. `feat: excel csv import and export for guests`
7. `feat: accreditation report surge-hour ranking and pdf export`
8. `feat: react typescript frontend registration admin accredit import-export reports`
9. `fix: vite version compatibility with @vitejs/plugin-react`
10. `fix: sql.js v1.16.0 API compatibility db.exec() returns [] fix DB_PATH`
11. `docs: update agents.md with local testing results and fixes`
12. `fix: AccreditPage syntax error </th> tags causing 500 error`
13. `docs: mark all Phase 3 changes complete`
14. `feat: sidebar admin layout, accredit page redesign, registration redesign, admin login auth, remove delete, add edit, mobile hamburger`
15. `feat: complete rebuild using texcellence patterns - server + frontend fully functional`
16. `feat: add guest edit functionality - remove delete, add edit modal and PATCH endpoint`

## Features Implemented & Tested
✅ **Registration Page** — Event background image, modern stacked form (First name, Last name, Email, Phone), public access
✅ **Admin Login** — JWT authentication with admin@harvesters.org / Admin123!
✅ **Admin Dashboard** — Sidebar layout, stats cards, guest management
✅ **Guest Management** — View, edit (no delete), search, filter, pagination, add guest, send ticket email, accredit guest
✅ **Accreditation Page** — Green theme "Accredit Interactive", camera scanner (start/stop), manual search with debounce (3 keystrokes), verify button, already-accredited guard, recent activity
✅ **Import/Export** — Excel/CSV import with preview, Excel/CSV export with filters
✅ **Reports** — PDF report with event stats, surge hours ranked, guest table with accreditation status
✅ **HTML Ticket Email** — Event design, QR code embedded, guest details, send count tracking
✅ **API Endpoints** — All tested and working

## Environment Variables (.env, NOT committed)
```
PORT=3000
EVENT_NAME=Workers Ball 2026
EVENT_DATE=22nd Nov. 2026
EVENT_TIME=4PM
VENUE=Harvesters Globe Ologolo
REGISTRATION_URL=http://localhost:5173/register
ADMIN_EMAIL=admin@harvesters.org
ADMIN_PASSWORD=Admin123!
JWT_SECRET=workers-ball-2026-super-secret-key-change-in-production
EMAIL_HOST=server396.web-hosting.com
EMAIL_PORT=465
EMAIL_USE_SSL=true
EMAIL_HOST_USER=noreply@accredit.vip
EMAIL_HOST_PASSWORD=MCe5)X3hnkO7yIUq
DEFAULT_FROM_EMAIL=noreply@accredit.vip
```

## Deployment to Namecheap Shared Hosting
1. Build frontend: `cd client && npm run build` (outputs to `../public/`)
2. Zip the `harversters-workers-ball` folder
3. Upload via Namecheap File Manager, extract
4. Run `npm install --production` in the app directory
5. cPanel → Setup Node.js App → startup file `server.js`
6. Add environment variables from `.env.example`
7. Start the app

## Test Credentials
- Admin login: admin@harvesters.org / Admin123!
- Test guest: john@test.com (already in database from testing)
