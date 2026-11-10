const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { getDb, sqlEscape, rowsToObjects } = require('../db');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'server396.web-hosting.com',
  port: parseInt(process.env.EMAIL_PORT) || 465,
  secure: process.env.EMAIL_USE_SSL !== 'false',
  auth: {
    user: process.env.EMAIL_HOST_USER || 'noreply@accredit.vip',
    pass: process.env.EMAIL_HOST_PASSWORD || ''
  }
});

router.get('/qr/:ticketId', async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec(`SELECT qr_code_data FROM guests WHERE ticket_id = '${sqlEscape(req.params.ticketId)}'`);
    const rows = rowsToObjects(result);
    if (rows.length === 0 || !rows[0].qr_code_data) return res.status(404).json({ error: 'QR data not found' });

    const qrBuffer = await QRCode.toBuffer(rows[0].qr_code_data, {
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

    const qrBuffer = await QRCode.toBuffer(guest.qr_code_data, {
      type: 'png', width: 400, margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' }
    });

    const flyerBuffer = fs.readFileSync(path.resolve(__dirname, '../../client/src/images/eventFlyer.jpeg'));
    const html = generateTicketEmail(guest);

    const info = await transporter.sendMail({
      from: `"${process.env.EVENT_NAME || 'Workers Ball 2026'}" <${process.env.DEFAULT_FROM_EMAIL || 'noreply@accredit.vip'}>`,
      to: guest.email,
      subject: `Your Ticket for ${process.env.EVENT_NAME || 'Workers Ball 2026'} — ${guest.ticket_id}`,
      html,
      attachments: [
        {
          filename: 'workers-ball-ticket-qr.png',
          content: qrBuffer,
          contentType: 'image/png',
          cid: 'workers-ball-qr',
          contentDisposition: 'inline'
        },
        {
          filename: 'workers-ball-flyer.jpeg',
          content: flyerBuffer,
          contentType: 'image/jpeg',
          cid: 'workers-ball-flyer',
          contentDisposition: 'inline'
        }
      ]
    });

    const now = new Date().toISOString();
    db.run(`UPDATE guests SET ticket_sent_count = ticket_sent_count + 1, ticket_last_sent_at = '${now}', updated_at = '${now}' WHERE ticket_id = '${sqlEscape(req.params.ticketId)}'`);
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

function generateTicketEmail(guest) {
  const eventName = process.env.EVENT_NAME || 'Workers Ball 2026';
  const eventDate = process.env.EVENT_DATE || '22nd Nov. 2026';
  const eventTime = process.env.EVENT_TIME || '4PM';
  const venue = process.env.VENUE || 'Harvesters Globe Ologolo';

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Your Ticket — ${eventName}</title></head>
<body style="margin:0;padding:24px 12px;font-family:'Segoe UI',Arial,sans-serif;background:#21170d;color:#fff8e9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff8e9;border:1px solid #d89a27;">
    <tr><td style="padding:0;background:#21170d;">
      <img src="cid:workers-ball-flyer" alt="Workers Ball 2026 event flyer" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
    </td></tr>
    <tr><td align="center" style="padding:24px 20px 10px;background:#3a2612;">
      <h1 style="margin:0;font-size:24px;color:#f4bd4f;letter-spacing:1px;">${eventName}</h1>
      <p style="margin:8px 0 0;font-size:14px;color:#fff1ce;letter-spacing:1px;">Your event ticket · Light of the Globe</p>
    </td></tr>
    <tr><td style="padding:24px 20px;text-align:center;background:#fff8e9;color:#3a2612;">
      <p style="margin:6px 0;font-size:17px;"><strong>Guest:</strong> ${guest.full_name}</p>
      <p style="margin:8px 0;color:#6b4c23;font-size:15px;"><strong>Ticket ID:</strong> ${guest.ticket_id}</p>
      <p style="margin:8px 0;color:#6b4c23;font-size:15px;"><strong>Date:</strong> ${eventDate}</p>
      <p style="margin:8px 0;color:#6b4c23;font-size:15px;"><strong>Time:</strong> ${eventTime}</p>
      <p style="margin:8px 0;color:#6b4c23;font-size:15px;"><strong>Venue:</strong> ${venue}</p>
    </td></tr>
    <tr><td align="center" style="padding:24px 20px;background:#f3e5c4;border-top:1px solid #dfbf7a;">
      <img src="cid:workers-ball-qr" alt="Accreditation QR code for ${guest.ticket_id}" width="220" height="220" style="display:block;width:220px;height:220px;max-width:100%;border:5px solid #d89a27;border-radius:8px;background:#ffffff;" />
      <p style="margin:16px 0 0;font-size:14px;color:#4a3218;">Present this QR code at the entrance for accreditation.</p>
    </td></tr>
    <tr><td style="padding:18px;text-align:center;font-size:12px;color:#fff1ce;background:#3a2612;">
      <p style="margin:0;">Please present this ticket on your phone or as a printout.</p>
      <p style="margin:8px 0 0;">${venue} · ${eventDate} · ${eventTime}</p>
    </td></tr>
  </table>
</body></html>`;
}

module.exports = router;
