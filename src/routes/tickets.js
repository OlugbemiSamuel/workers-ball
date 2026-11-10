const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
const { getDb } = require('../db');

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
    const row = db.prepare('SELECT qr_code_data FROM guests WHERE ticket_id = ?').get([req.params.ticketId]);
    if (!row || !row.qr_code_data) return res.status(404).json({ error: 'QR data not found' });

    const qrBuffer = await QRCode.toBuffer(row.qr_code_data, {
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
    const guest = db.prepare('SELECT * FROM guests WHERE ticket_id = ?').get([req.params.ticketId]);
    if (!guest) return res.status(404).json({ error: 'Guest not found' });
    if (!guest.email) return res.status(400).json({ error: 'Guest has no email address' });

    const qrDataUrl = await QRCode.toDataURL(guest.qr_code_data, {
      type: 'image/png', width: 400, margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' }
    });

    const html = generateTicketEmail(guest, qrDataUrl);

    const info = await transporter.sendMail({
      from: `"${process.env.EVENT_NAME || 'Workers Ball 2026'}" <${process.env.DEFAULT_FROM_EMAIL || 'noreply@accredit.vip'}>`,
      to: guest.email,
      subject: `Your Ticket for ${process.env.EVENT_NAME || 'Workers Ball 2026'} — ${guest.ticket_id}`,
      html
    });

    const now = new Date().toISOString();
    db.run('UPDATE guests SET ticket_sent_count = ticket_sent_count + 1, ticket_last_sent_at = ?, updated_at = ? WHERE ticket_id = ?', [now, now, req.params.ticketId]);
    const updated = db.prepare('SELECT * FROM guests WHERE ticket_id = ?').get([req.params.ticketId]);

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

function generateTicketEmail(guest, qrDataUrl) {
  const eventName = process.env.EVENT_NAME || 'Workers Ball 2026';
  const eventDate = process.env.EVENT_DATE || '22nd Nov. 2026';
  const eventTime = process.env.EVENT_TIME || '4PM';
  const venue = process.env.VENUE || 'Harvesters Globe Ologolo';

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Your Ticket — ${eventName}</title></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',sans-serif;background:#0a0a0a;color:#ffffff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#1a1a1a;border:1px solid #333;">
    <tr><td align="center" style="padding:40px 20px 20px;background:linear-gradient(180deg,#0a0a0a 0%,#1a1a1a 100%);">
      <h1 style="margin:0;font-size:28px;color:#ffd700;letter-spacing:2px;text-transform:uppercase;">${eventName}</h1>
      <p style="margin:8px 0 0;font-size:14px;color:#b8860b;letter-spacing:1px;">Light of the Globe</p>
    </td></tr>
    <tr><td style="padding:30px 20px;text-align:center;border-bottom:1px solid #333;">
      <p style="margin:4px 0;font-size:16px;color:#ffffff;"><strong>Guest:</strong> ${guest.full_name}</p>
      <p style="margin:4px 0;font-size:16px;color:#ffffff;"><strong>Ticket ID:</strong> <span style="color:#ffd700;">${guest.ticket_id}</span></p>
      <p style="margin:4px 0;font-size:16px;color:#ffffff;"><strong>Date:</strong> ${eventDate}</p>
      <p style="margin:4px 0;font-size:16px;color:#ffffff;"><strong>Time:</strong> ${eventTime}</p>
      <p style="margin:4px 0;font-size:16px;color:#ffffff;"><strong>Venue:</strong> ${venue}</p>
    </td></tr>
    <tr><td align="center" style="padding:30px 20px;background:#0a0a0a;">
      <img src="${qrDataUrl}" alt="QR Code" style="width:180px;height:180px;border:4px solid #ffd700;border-radius:8px;background:#ffffff;" />
      <p style="margin-top:16px;font-size:14px;color:#cccccc;">Scan this QR code at entry for accreditation</p>
    </td></tr>
    <tr><td style="padding:20px;text-align:center;font-size:12px;color:#666666;border-top:1px solid #333;">
      <p style="margin:0;">Please present this ticket (printed or on mobile) at the entrance.</p>
      <p style="margin:8px 0 0;">${venue} • ${eventDate} • ${eventTime}</p>
      <p style="margin:8px 0 0;font-size:11px;color:#444;">If you did not request this ticket, please ignore this email.</p>
    </td></tr>
  </table>
</body></html>`;
}

module.exports = router;
