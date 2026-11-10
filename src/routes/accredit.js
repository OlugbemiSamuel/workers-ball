const express = require('express');
const router = express.Router();
const { getDb, sqlEscape, rowsToObjects } = require('../db');

router.get('/search', async (req, res) => {
  try {
    const db = await getDb();
    const { name } = req.query;
    if (!name) return res.status(400).json({ error: 'name query parameter is required' });

    const like = `%${sqlEscape(name)}%`;
    const result = db.exec(
      `SELECT id, full_name, email, phone, ticket_id, accredited, accredited_at, ticket_sent_count
       FROM guests
       WHERE full_name LIKE '${like}' OR email LIKE '${like}' OR ticket_id LIKE '${like}'
       ORDER BY full_name ASC LIMIT 10`
    );
    const rows = rowsToObjects(result);
    res.json({ results: rows });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

router.get('/guest/:ticketId', async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec(`SELECT * FROM guests WHERE ticket_id = '${sqlEscape(req.params.ticketId)}'`);
    const rows = rowsToObjects(result);
    if (rows.length === 0) return res.status(404).json({ error: 'Guest not found' });
    res.json({ guest: rows[0] });
  } catch (err) {
    console.error('Get guest by ticket error:', err);
    res.status(500).json({ error: 'Failed to get guest' });
  }
});

router.post('/confirm/:ticketId', async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec(`SELECT * FROM guests WHERE ticket_id = '${sqlEscape(req.params.ticketId)}'`);
    const rows = rowsToObjects(result);
    if (rows.length === 0) return res.status(404).json({ error: 'Guest not found' });

    const row = rows[0];
    if (row.accredited === 1) {
      return res.status(409).json({
        error: 'Already accredited',
        message: `${row.full_name} was already accredited at ${row.accredited_at}`,
        guest: row
      });
    }

    const now = new Date().toISOString();
    db.run(`UPDATE guests SET accredited = 1, accredited_at = '${now}', updated_at = '${now}' WHERE ticket_id = '${sqlEscape(req.params.ticketId)}'`);
    const updatedResult = db.exec(`SELECT * FROM guests WHERE ticket_id = '${sqlEscape(req.params.ticketId)}'`);
    const updated = rowsToObjects(updatedResult)[0];
    res.json({ message: 'Guest accredited successfully', guest: updated });
  } catch (err) {
    console.error('Confirm accreditation error:', err);
    res.status(500).json({ error: 'Accreditation failed' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const db = await getDb();
    const totalResult = db.exec('SELECT COUNT(*) as c FROM guests');
    const total = totalResult[0]?.values?.[0]?.[0] || 0;

    const accreditedResult = db.exec("SELECT COUNT(*) as c FROM guests WHERE accredited = 1");
    const accredited = accreditedResult[0]?.values?.[0]?.[0] || 0;

    const pending = total - accredited;
    const percentage = total > 0 ? Math.round((accredited / total) * 100) : 0;

    const surgeResult = db.exec(`
      SELECT CAST(strftime('%H', accredited_at) AS INTEGER) as hour, COUNT(*) as count
      FROM guests WHERE accredited = 1 AND accredited_at IS NOT NULL
      GROUP BY hour ORDER BY count DESC
    `);
    const surgeHours = rowsToObjects(surgeResult);

    res.json({ total, accredited, pending, percentage, surgeHours });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

module.exports = router;
