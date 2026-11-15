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

const flyerPath = path.resolve(__dirname, '../../public/images/eventFlyer.jpeg');

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
    fs.promises.readFile(flyerPath)
  ]);
  const eventName = process.env.EVENT_NAME || 'Workers Ball 2026';
  const eventDate = process.env.EVENT_DATE || '22nd Nov. 2026';
  const eventTime = process.env.EVENT_TIME || '4PM';
  const venue = process.env.VENUE || 'Harvesters Globe Ologolo';

  return transporter.sendMail({
    from: `"${eventName}" <${process.env.DEFAULT_FROM_EMAIL || 'noreply@accredit.vip'}>`,
    to: guest.email,
    subject: `Your Ticket for ${eventName} — ${guest.ticket_id}`,
    html: generateTicketEmail(guest, { eventName, eventDate, eventTime, venue }),
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
}

function generateTicketEmail(guest, event) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Your Ticket — ${event.eventName}</title></head>
<body style="margin:0;padding:24px 12px;font-family:'Segoe UI',Arial,sans-serif;background:#21170d;color:#fff8e9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff8e9;border:1px solid #d89a27;">
    <tr><td style="padding:0;background:#21170d;">
      <img src="cid:workers-ball-flyer" alt="Workers Ball 2026 event flyer" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
    </td></tr>
    <tr><td align="center" style="padding:24px 20px 10px;background:#3a2612;">
      <h1 style="margin:0;font-size:24px;color:#f4bd4f;letter-spacing:1px;">${event.eventName}</h1>
      <p style="margin:8px 0 0;font-size:14px;color:#fff1ce;letter-spacing:1px;">Your event ticket · Light of the Globe</p>
    </td></tr>
    <tr><td style="padding:24px 20px;text-align:center;background:#fff8e9;color:#3a2612;">
      <p style="margin:6px 0;font-size:17px;"><strong>Guest:</strong> ${guest.full_name}</p>
      <p style="margin:8px 0;color:#6b4c23;font-size:15px;"><strong>Ticket ID:</strong> ${guest.ticket_id}</p>
      <p style="margin:8px 0;color:#6b4c23;font-size:15px;"><strong>Date:</strong> ${event.eventDate}</p>
      <p style="margin:8px 0;color:#6b4c23;font-size:15px;"><strong>Time:</strong> ${event.eventTime}</p>
      <p style="margin:8px 0;color:#6b4c23;font-size:15px;"><strong>Venue:</strong> ${event.venue}</p>
    </td></tr>
    <tr><td align="center" style="padding:24px 20px;background:#f3e5c4;border-top:1px solid #dfbf7a;">
      <img src="cid:workers-ball-qr" alt="Accreditation QR code for ${guest.ticket_id}" width="220" height="220" style="display:block;width:220px;height:220px;max-width:100%;border:5px solid #d89a27;border-radius:8px;background:#ffffff;" />
      <p style="margin:16px 0 0;font-size:14px;color:#4a3218;">Present this QR code at the entrance for accreditation.</p>
    </td></tr>
    <tr><td style="padding:18px;text-align:center;font-size:12px;color:#fff1ce;background:#3a2612;">
      <p style="margin:0;">Please present this ticket on your phone or as a printout.</p>
      <p style="margin:8px 0 0;">${event.venue} · ${event.eventDate} · ${event.eventTime}</p>
    </td></tr>
  </table>
</body></html>`;
}

module.exports = { sendTicketEmail };
