# Workers Ball 2026 — Accreditation System Build Log

## Project Goal
Church event management & accreditation system for "Workers Ball 2026" (Harvesters Globe Ologolo, 22nd Nov 2026, 4PM).
Stack: React + TypeScript (frontend), Node.js + Express + SQLite (sql.js, no native compile) (backend).
Deploy target: Namecheap Shared Hosting (cPanel File Manager, Setup Node.js App).

## Atomic Commit Convention
Each commit represents one complete, testable feature or file group:
- `feat: init project structure and agents.md`
- `feat: express server with sql.js database`
- `feat: guest CRUD API`
- `feat: accreditation search + scan + confirm`
- `feat: ticket email + QR generation`
- `feat: excel/csv import export`
- `feat: accreditation report + surge hours + pdf`
- `feat: react typescript frontend`
- `feat: deployment config for namecheap shared`

---

## Phase 1 — Project Setup (PENDING)

### Files to create
- [x] `agents.md` — this tracking file
- [ ] `package.json` — root dependencies
- [ ] `server.js` — Express entry point (cPanel startup file)
- [ ] `.env.example` — env template
- [ ] `src/db.js` — sql.js initialization + schema
- [ ] `src/routes/guests.js` — guest CRUD
- [ ] `src/routes/accredit.js` — search/scan/confirm accreditation
- [ ] `src/routes/tickets.js` — send email, QR image endpoint
- [ ] `src/routes/import-export.js` — multer upload + export
- [ ] `src/routes/reports.js` — stats, surge hours, PDF
- [ ] `src/controllers/*.js` — business logic
- [ ] `src/email/ticket.html` — HTML email template
- [ ] `src/utils/qrcode-gen.js` — QR generation
- [ ] `src/utils/pdf-report.js` — Leadway-style PDF report

### Phase 1 Commits (atomic)
1. `feat: init project structure and agents.md`
2. `feat: express server with sql.js database and env config`
3. `feat: guest crud api (create, list, search, edit, delete)`
4. `feat: accreditation flow — manual search + qr scan + confirm with already-accredited guard`
5. `feat: ticket email sending with html template and qr embed, send-count tracking`
6. `feat: excel/csv import and export for guests`
7. `feat: accreditation report with surge-hour ranking and pdf export`

---

## Phase 2 — React TypeScript Frontend (PENDING)

### Pages
- [ ] `/` — Registration landing page (mimics Workers Ball 2026 design, QR code on banner)
- [ ] `/register` — Guest registration form
- [ ] `/admin` — Dashboard stats
- [ ] `/admin/guests` — Guest list, search, edit, send ticket
- [ ] `/admin/accredit` — Dual mode: manual search + QR scanner modal/card
- [ ] `/admin/import-export` — Excel/CSV upload & download
- [ ] `/admin/reports` — Report viewer + PDF download

### Phase 2 Commits
8. `feat: react typescript frontend scaffold with vite`
9. `feat: registration page mimicking workers ball design`
10. `feat: admin dashboard and guest management`
11. `feat: accreditation page with search and qr scanner`
12. `feat: import export and reports pages`

---

## Phase 3 — Deployment (PENDING)

### Namecheap Shared Hosting Steps
- [ ] Build client: `cd client && npm run build`
- [ ] Copy `client/dist/` to `server/public/`
- [ ] Zip project folder
- [ ] Upload via Namecheap File Manager
- [ ] Extract, run `npm install --production`
- [ ] cPanel → Setup Node.js App → startup file `server.js`
- [ ] Add environment variables from `.env.example`
- [ ] Start app, verify `/api/guests` and registration page

---

## Environment Variables Required
```
PORT=3000
NODE_ENV=production
EVENT_NAME=Workers Ball 2026
EVENT_DATE=22nd Nov. 2026
EVENT_TIME=4PM
VENUE=Harvesters Globe Ologolo
REGISTRATION_URL=https://yourdomain.com/register
EMAIL_HOST=server396.web-hosting.com
EMAIL_PORT=465
EMAIL_USE_SSL=True
EMAIL_HOST_USER=noreply@accredit.vip
EMAIL_HOST_PASSWORD=MCe5)X3hnkO7yIUq
DEFAULT_FROM_EMAIL=noreply@accredit.vip
```

---

## Notes
- `sql.js` used instead of `better-sqlite3` to avoid native compilation on Namecheap shared hosting.
- No `accredited_by` / `performed_by` fields — multiple staff share the same accreditation page.
- `ticket_sent_count` and `ticket_last_sent_at` track email sends per guest.
- Accreditation guard: clicking Accredit on an already-accredited guest shows "Already accredited".
- QR payload: `https://yourdomain.accredit.vip/accredit?ticket=WB26-0042`
