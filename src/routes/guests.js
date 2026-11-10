const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db');
const { generateQRPayload, generateTicketId } = require('../utils/qrcode-gen');

// GET /api/guests — list with pagination, search, filter
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const {
      page = 1,
      limit = 20,
      search = '',
      accredited = ''
    } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const offset = (pageNum - 1) * limitNum;

    let whereClause = '';
    let params = [];

    const conditions = [];
    if (search) {
      conditions.push(`(full_name LIKE ? OR email LIKE ? OR ticket_id LIKE ? OR phone LIKE ?)`);
      const like = `%${search}%`;
      params.push(like, like, like, like);
    }
    if (accredited === 'true') {
      conditions.push('accredited = 1');
    } else if (accredited === 'false') {
      conditions.push('accredited = 0');
    }
    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    const countResult = db.prepare(`SELECT COUNT(*) as total FROM guests ${whereClause}`).get(params);
    const total = countResult ? countResult.total : 0;

    const allParams = [...params, limitNum, offset];
    const rows = db.prepare(
      `SELECT * FROM guests ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
    ).all(allParams);

    res.json({
      guests: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    console.error('List guests error:', err);
    res.status(500).json({ error: 'Failed to list guests', details: err.message });
  }
});

// GET /api/guests/:id
router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const row = db.prepare('SELECT * FROM guests WHERE id = ?').get([req.params.id]);
    if (!row) return res.status(404).json({ error: 'Guest not found' });
    res.json({ guest: row });
  } catch (err) {
    console.error('Get guest error:', err);
    res.status(500).json({ error: 'Failed to get guest' });
  }
});

// POST /api/guests — create guest
router.post('/', async (req, res) => {
  try {
    const db = await getDb();
    const { full_name, email, phone } = req.body;

    if (!full_name) {
      return res.status(400).json({ error: 'full_name is required' });
    }

    const now = new Date().toISOString();
    const id = uuidv4();
    const ticket_id = generateTicketId();
    const qr_code_data = generateQRPayload(ticket_id);

    if (email) {
      const existing = db.prepare('SELECT id FROM guests WHERE email = ? LIMIT 1').get([email]);
      if (existing) {
        return res.status(409).json({ error: 'A guest with this email already exists' });
      }
    }

    db.run(
      `INSERT INTO guests (id, full_name, email, phone, ticket_id, qr_code_data, accredited, accredited_at, ticket_sent_count, ticket_last_sent_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, NULL, 0, NULL, ?, ?)`,
      [id, full_name, email || null, phone || null, ticket_id, qr_code_data, now, now]
    );

    const newGuest = db.prepare('SELECT * FROM guests WHERE id = ?').get([id]);
    res.status(201).json({ guest: newGuest });
  } catch (err) {
    console.error('Create guest error:', err);
    res.status(500).json({ error: 'Failed to create guest', details: err.message });
  }
});

// PUT /api/guests/:id — edit guest details
router.put('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const { full_name, email, phone } = req.body;

    const existing = db.prepare('SELECT id FROM guests WHERE id = ?').get([req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Guest not found' });

    if (email) {
      const emailExists = db.prepare('SELECT id FROM guests WHERE email = ? AND id != ? LIMIT 1').get([email, req.params.id]);
      if (emailExists) {
        return res.status(409).json({ error: 'A guest with this email already exists' });
      }
    }

    const now = new Date().toISOString();
    db.run(
      `UPDATE guests SET full_name = COALESCE(?, full_name), email = COALESCE(?, email), phone = COALESCE(?, phone), updated_at = ? WHERE id = ?`,
      [full_name || null, email || null, phone || null, now, req.params.id]
    );

    const updated = db.prepare('SELECT * FROM guests WHERE id = ?').get([req.params.id]);
    res.json({ guest: updated });
  } catch (err) {
    console.error('Update guest error:', err);
    res.status(500).json({ error: 'Failed to update guest' });
  }
});

// DELETE /api/guests/:id
router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const existing = db.prepare('SELECT id FROM guests WHERE id = ?').get([req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Guest not found' });

    db.run('DELETE FROM guests WHERE id = ?', [req.params.id]);
    res.json({ message: 'Guest deleted successfully' });
  } catch (err) {
    console.error('Delete guest error:', err);
    res.status(500).json({ error: 'Failed to delete guest' });
  }
});

module.exports = router;
