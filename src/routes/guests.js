const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb, sqlEscape, rowsToObjects } = require('../db');
const { generateQRPayload, generateTicketId } = require('../utils/qrcode-gen');

router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const { page = 1, limit = 20, search = '', accredited = '' } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    let whereClause = '';
    const conditions = [];
    if (search) {
      const like = `%${sqlEscape(search)}%`;
      conditions.push(`(full_name LIKE '${like}' OR email LIKE '${like}' OR ticket_id LIKE '${like}' OR phone LIKE '${like}')`);
    }
    if (accredited === 'true') conditions.push('accredited = 1');
    else if (accredited === 'false') conditions.push('accredited = 0');
    if (conditions.length > 0) whereClause = 'WHERE ' + conditions.join(' AND ');

    const countResult = db.exec(`SELECT COUNT(*) as total FROM guests ${whereClause}`);
    const total = countResult[0]?.values?.[0]?.[0] || 0;

    const rowsResult = db.exec(
      `SELECT * FROM guests ${whereClause} ORDER BY created_at DESC LIMIT ${limitNum} OFFSET ${offset}`
    );
    const rows = rowsToObjects(rowsResult);

    res.json({
      guests: rows,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
    });
  } catch (err) {
    console.error('List guests error:', err);
    res.status(500).json({ error: 'Failed to list guests', details: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec(`SELECT * FROM guests WHERE id = '${sqlEscape(req.params.id)}'`);
    const rows = rowsToObjects(result);
    if (rows.length === 0) return res.status(404).json({ error: 'Guest not found' });
    res.json({ guest: rows[0] });
  } catch (err) {
    console.error('Get guest error:', err);
    res.status(500).json({ error: 'Failed to get guest' });
  }
});

router.post('/', async (req, res) => {
  try {
    const db = await getDb();
    const { full_name, email, phone } = req.body;
    if (!full_name) return res.status(400).json({ error: 'full_name is required' });

    const now = new Date().toISOString();
    const id = uuidv4();
    const ticket_id = generateTicketId();
    const qr_code_data = generateQRPayload(ticket_id);

    if (email) {
      const existing = db.exec(`SELECT id FROM guests WHERE email = '${sqlEscape(email)}' LIMIT 1`);
      if (existing.length > 0 && existing[0].values.length > 0) {
        return res.status(409).json({ error: 'A guest with this email already exists' });
      }
    }

    db.run(
      `INSERT INTO guests (id, full_name, email, phone, ticket_id, qr_code_data, accredited, accredited_at, ticket_sent_count, ticket_last_sent_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, NULL, 0, NULL, ?, ?)`,
      [id, full_name, email || null, phone || null, ticket_id, qr_code_data, now, now]
    );

    const newGuest = {
      id, full_name, email: email || null, phone: phone || null,
      ticket_id, qr_code_data, accredited: 0, accredited_at: null,
      ticket_sent_count: 0, ticket_last_sent_at: null,
      created_at: now, updated_at: now
    };
    res.status(201).json({ guest: newGuest });
  } catch (err) {
    console.error('Create guest error:', err);
    res.status(500).json({ error: 'Failed to create guest', details: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { full_name, email, phone } = req.body;
    const existing = db.exec(`SELECT id FROM guests WHERE id = '${sqlEscape(req.params.id)}'`);
    if (existing.length === 0 || existing[0].values.length === 0) return res.status(404).json({ error: 'Guest not found' });

    if (email) {
      const emailExists = db.exec(`SELECT id FROM guests WHERE email = '${sqlEscape(email)}' AND id != '${sqlEscape(req.params.id)}' LIMIT 1`);
      if (emailExists.length > 0 && emailExists[0].values.length > 0) return res.status(409).json({ error: 'A guest with this email already exists' });
    }

    const now = new Date().toISOString();
    db.run(
      `UPDATE guests SET full_name = COALESCE('${sqlEscape(full_name)}', full_name), email = COALESCE('${sqlEscape(email)}', email), phone = COALESCE('${sqlEscape(phone)}', phone), updated_at = '${now}' WHERE id = '${sqlEscape(req.params.id)}'`
    );

    const updatedResult = db.exec(`SELECT * FROM guests WHERE id = '${sqlEscape(req.params.id)}'`);
    const updated = rowsToObjects(updatedResult)[0];
    res.json({ guest: updated });
  } catch (err) {
    console.error('Update guest error:', err);
    res.status(500).json({ error: 'Failed to update guest' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const existing = db.exec(`SELECT id FROM guests WHERE id = '${sqlEscape(req.params.id)}'`);
    if (existing.length === 0 || existing[0].values.length === 0) return res.status(404).json({ error: 'Guest not found' });
    db.run(`DELETE FROM guests WHERE id = '${sqlEscape(req.params.id)}'`);
    res.json({ message: 'Guest deleted successfully' });
  } catch (err) {
    console.error('Delete guest error:', err);
    res.status(500).json({ error: 'Failed to delete guest' });
  }
});

module.exports = router;
