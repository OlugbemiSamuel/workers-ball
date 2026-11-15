const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const { getDb, sqlEscape, rowsToObjects } = require('../db');
const { sendTicketEmail } = require('../services/email');
const { generateQRPayload } = require('../utils/qrcode-gen');

router.get('/qr/:ticketId', async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec(`SELECT ticket_id FROM guests WHERE ticket_id = '${sqlEscape(req.params.ticketId)}'`);
    const rows = rowsToObjects(result);
    if (rows.length === 0) return res.status(404).json({ error: 'Guest not found' });

    const qrBuffer = await QRCode.toBuffer(generateQRPayload(rows[0].ticket_id), {
      type: 'buffer', width: 300, margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' }
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(qrBuffer);
  } catch (err) {
    console.error('QR error:', err);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

router.post('/send/:ticketId', async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec(`SELECT * FROM guests WHERE ticket_id = '${sqlEscape(req.params.ticketId)}'`);
    const rows = rowsToObjects(result);
    if (rows.length === 0) return res.status(404).json({ error: 'Guest not found' });

    const guest = rows[0];
    if (!guest.email) return res.status(400).json({ error: 'Guest has no email address' });

    const info = await sendTicketEmail(guest);

    const now = new Date().toISOString();
    const qrCodeData = generateQRPayload(guest.ticket_id);
    db.run(
      'UPDATE guests SET qr_code_data = ?, ticket_sent_count = ticket_sent_count + 1, ticket_last_sent_at = ?, updated_at = ? WHERE ticket_id = ?',
      [qrCodeData, now, now, req.params.ticketId]
    );
    const updatedResult = db.exec(`SELECT * FROM guests WHERE ticket_id = '${sqlEscape(req.params.ticketId)}'`);
    const updated = rowsToObjects(updatedResult)[0];

    res.json({
      message: 'Ticket email sent successfully',
      messageId: info.messageId,
      guest: { ticket_id: updated.ticket_id, ticket_sent_count: updated.ticket_sent_count, ticket_last_sent_at: updated.ticket_last_sent_at }
    });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ error: 'Failed to send email', details: err.message });
  }
});

module.exports = router;
