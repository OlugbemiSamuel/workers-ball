const express = require('express');
const router = express.Router();

// GET /api/accredit/search?name= — manual name search
router.get('/search', (req, res) => {
  const db = req.app.locals.db || require('../db');
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ error: 'name query parameter is required' });
  }

  const like = `%${name}%`;
  const rows = db.prepare(
    `SELECT id, full_name, email, phone, ticket_id, accredited, accredited_at, ticket_sent_count
     FROM guests
     WHERE full_name LIKE ? OR email LIKE ? OR ticket_id LIKE ?
     ORDER BY full_name ASC
     LIMIT 10`
  ).all(like, like, like);

  res.json({ results: rows });
});

// GET /api/accredit/guest/:ticketId — get full guest details by ticket (for QR scan / confirm)
router.get('/guest/:ticketId', (req, res) => {
  const db = req.app.locals.db || require('../db');
  const row = db.prepare(
    `SELECT * FROM guests WHERE ticket_id = ?`
  ).get(req.params.ticketId);

  if (!row) return res.status(404).json({ error: 'Guest not found' });

  res.json({ guest: row });
});

// POST /api/accredit/confirm/:ticketId — mark guest as accredited
router.post('/confirm/:ticketId', (req, res) => {
  const db = req.app.locals.db || require('../db');
  const row = db.prepare('SELECT * FROM guests WHERE ticket_id = ?').get(req.params.ticketId);

  if (!row) return res.status(404).json({ error: 'Guest not found' });

  if (row.accredited === 1) {
    return res.status(409).json({
      error: 'Already accredited',
      message: `${row.full_name} was already accredited at ${row.accredited_at}`,
      guest: row
    });
  }

  const now = new Date().toISOString();
  db.run(
    `UPDATE guests SET accredited = 1, accredited_at = ?, updated_at = ? WHERE ticket_id = ?`,
    [now, now, req.params.ticketId]
  );

  const updated = db.prepare('SELECT * FROM guests WHERE ticket_id = ?').get(req.params.ticketId);
  res.json({
    message: 'Guest accredited successfully',
    guest: updated
  });
});

// GET /api/accredit/stats — overall accreditation stats
router.get('/stats', (req, res) => {
  const db = req.app.locals.db || require('../db');

  const total = db.prepare('SELECT COUNT(*) as c FROM guests').get().c;
  const accredited = db.prepare("SELECT COUNT(*) as c FROM guests WHERE accredited = 1").get().c;
  const pending = total - accredited;
  const percentage = total > 0 ? Math.round((accredited / total) * 100) : 0;

  // Surge hours — hour of day with most accreditations
  const hourlyRows = db.prepare(`
    SELECT 
      CAST(strftime('%H', accredited_at) AS INTEGER) as hour,
      COUNT(*) as count
    FROM guests
    WHERE accredited = 1 AND accredited_at IS NOT NULL
    GROUP BY hour
    ORDER BY count DESC
  `).all();

  res.json({
    total,
    accredited,
    pending,
    percentage,
    surgeHours: hourlyRows
  });
});

module.exports = router;
