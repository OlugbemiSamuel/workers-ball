# Workers Ball 2026 — Accreditation System Build Log

## Project Goal
Church event management & accreditation system for "Workers Ball 2026" (Harvesters Globe Ologolo, 22nd Nov 2026, 4PM).
Stack: React + TypeScript (frontend), Node.js + Express + SQLite (sql.js) (backend).
Deploy target: Namecheap Shared Hosting (cPanel File Manager, Setup Node.js App).
Repository: https://github.com/OlugbemiSamuel/workers-ball

## Atomic Commit Convention
Each commit represents one complete, testable feature or file group.

## Commit History (COMPLETED)
1. ✅ `feat: init project structure and agents.md`
2. ✅ `feat: express server with sql.js database and env config`
3. ✅ `feat: guest crud api create list search edit delete`
4. ✅ `feat: accreditation flow manual search qr scan confirm with already-accredited guard`
5. ✅ `feat: ticket email sending with html template qr embed and send-count tracking`
6. ✅ `feat: excel csv import and export for guests`
7. ✅ `feat: accreditation report surge-hour ranking and pdf export`
8. ✅ `feat: react typescript frontend registration admin accredit import-export reports`
9. ✅ `fix: vite version compatibility with @vitejs/plugin-react`
10. ✅ `fix: sql.js v1.16.0 API compatibility db.exec() returns [] fix DB_PATH`
11. ✅ `docs: update agents.md with local testing results and fixes`

## Phase 3 — Current Changes (IN PROGRESS)
- [ ] Remove edit/delete from guest management (view only)
- [ ] Admin sidebar layout instead of top navigation
- [ ] Accreditation page matching images exactly (green theme, "Accredit Interactive", camera scanner, manual entry)
- [ ] Fix PDF report generation
- [ ] Mobile hamburger menu + back button
- [ ] Admin login (username/password protection)
- [ ] Registration page: event image background + modern stacked form (like texcellence)
- [ ] Camera scanner: start/stop camera, modal with guest details, verify button
- [ ] Debounced search: 3 keystrokes, popup after verify clicked
- [ ] "Accredit Interactive" branding instead of "Workers Ball" on accreditation page
- [ ] Registration form: modern design, not bland
- [ ] Match images 100% for mobile and desktop accreditation page

## Environment Variables Required
```
PORT=3000
NODE_ENV=production
EVENT_NAME=Workers Ball 2026
EVENT_DATE=22nd Nov. 2026
EVENT_TIME=4PM
VENUE=Harvesters Globe Ologolo
REGISTRATION_URL=http://localhost:5173/register
EMAIL_HOST=server396.web-hosting.com
EMAIL_PORT=465
EMAIL_USE_SSL=True
EMAIL_HOST_USER=noreply@accredit.vip
EMAIL_HOST_PASSWORD=MCe5)X3hnkO7yIUq
DEFAULT_FROM_EMAIL=noreply@accredit.vip
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```
