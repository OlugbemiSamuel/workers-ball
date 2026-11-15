const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const { generateQRPayload } = require('../utils/qrcode-gen');

const emailPort = Number.parseInt(process.env.EMAIL_PORT || '465', 10);
const sslSetting = process.env.EMAIL_USE_SSL;
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'server396.web-hosting.com',
  port: emailPort,
  secure: sslSetting === undefined
    ? emailPort === 465
    : !['false', '0', 'no'].includes(sslSetting.toLowerCase()),
  auth: {
    user: process.env.EMAIL_HOST_USER || 'noreply@accredit.vip',
    pass: process.env.EMAIL_HOST_PASSWORD || ''
  }
});

// Resolve the flyer from the built public folder or the client source public folder.
function findFlyerPath() {
  const candidates = [
    path.resolve(__dirname, '../../public/images/sixth-season-flyer.jpeg'),
    path.resolve(__dirname, '../../client/public/images/sixth-season-flyer.jpeg')
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0];
}

async function sendTicketEmail(guest) {
  if (!guest.email) throw new Error('Guest has no email address');
  if (!guest.qr_code_data) throw new Error('Guest ticket has no QR code data');

  const [qrBuffer, flyerBuffer] = await Promise.all([
    QRCode.toBuffer(generateQRPayload(guest.ticket_id), {
      type: 'png',
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' }
    }),
    fs.promises.readFile(findFlyerPath())
  ]);
  const eventName = process.env.EVENT_NAME || 'Sixth Season';
  const eventDate = process.env.EVENT_DATE || 'Sunday, 22nd November 2026';
  const eventTime = process.env.EVENT_TIME || '6:00 PM';
  const venue = process.env.VENUE || 'BYD, Victoria Island, Lagos';

  return transporter.sendMail({
    from: `"${eventName}" <${process.env.DEFAULT_FROM_EMAIL || 'noreply@accredit.vip'}>`,
    to: guest.email,
    subject: `Your Ticket for ${eventName} — ${guest.ticket_id}`,
    html: generateTicketEmail(guest, { eventName, eventDate, eventTime, venue }),
    attachments: [
      {
        filename: 'sixth-season-ticket-qr.png',
        content: qrBuffer,
        contentType: 'image/png',
        cid: 'sixth-season-qr',
        contentDisposition: 'inline'
      },
      {
        filename: 'sixth-season-flyer.jpeg',
        content: flyerBuffer,
        contentType: 'image/jpeg',
        cid: 'sixth-season-flyer',
        contentDisposition: 'inline'
      }
    ]
  });
}

function generateTicketEmail(guest, event) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Your Ticket — ${event.eventName}</title></head>
<body style="margin:0;padding:24px 12px;font-family:'Segoe UI',Arial,sans-serif;background:#000000;color:#ffffff;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#0a0a0a;border:1px solid #2a2a2a;">
    <tr><td style="padding:0;background:#000000;">
      <img src="cid:sixth-season-flyer" alt="Sixth Season Pop-Up Experience flyer" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
    </td></tr>
    <tr><td align="center" style="padding:24px 20px 10px;background:#000000;">
      <h1 style="margin:0;font-size:24px;color:#ffffff;letter-spacing:4px;">SIXTH SEASON</h1>
      <p style="margin:8px 0 0;font-size:12px;color:#a1a1aa;letter-spacing:2px;text-transform:uppercase;">Beyond Limits. Beyond Seasons.</p>
    </td></tr>
    <tr><td style="padding:24px 20px;text-align:center;background:#ffffff;color:#000000;">
      <p style="margin:6px 0;font-size:17px;"><strong>Guest:</strong> ${guest.full_name}</p>
      <p style="margin:8px 0;color:#3f3f46;font-size:15px;"><strong>Ticket ID:</strong> ${guest.ticket_id}</p>
      <p style="margin:8px 0;color:#3f3f46;font-size:15px;"><strong>Date:</strong> ${event.eventDate}</p>
      <p style="margin:8px 0;color:#3f3f46;font-size:15px;"><strong>Time:</strong> ${event.eventTime}</p>
      <p style="margin:8px 0;color:#3f3f46;font-size:15px;"><strong>Venue:</strong> ${event.venue}</p>
    </td></tr>
    <tr><td align="center" style="padding:24px 20px;background:#000000;border-top:1px solid #2a2a2a;">
      <img src="cid:sixth-season-qr" alt="Accreditation QR code for ${guest.ticket_id}" width="220" height="220" style="display:block;width:220px;height:220px;max-width:100%;border:1px solid #ffffff;background:#ffffff;" />
      <p style="margin:16px 0 0;font-size:14px;color:#d4d4d8;">Present this QR code at the entrance for accreditation.</p>
    </td></tr>
    <tr><td style="padding:18px;text-align:center;font-size:12px;color:#a1a1aa;background:#000000;border-top:1px solid #2a2a2a;">
      <p style="margin:0;">Please present this ticket on your phone or as a printout.</p>
      <p style="margin:8px 0 0;">${event.venue} · ${event.eventDate} · ${event.eventTime}</p>
    </td></tr>
  </table>
</body></html>`;
}

module.exports = { sendTicketEmail };
