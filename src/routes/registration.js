const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb, rowsToObjects } = require('../db');
const { generateQRPayload, generateTicketId } = require('../utils/qrcode-gen');
const { sendTicketEmail } = require('../services/email');

const router = express.Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/', async (req, res) => {
  const firstName = typeof req.body.first_name === 'string' ? req.body.first_name.trim() : '';
  const lastName = typeof req.body.last_name === 'string' ? req.body.last_name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
  const attendance = req.body.attendance_status;

  if (!firstName || !lastName) {
    return res.status(400).json({ error: 'First name and last name are required' });
  }
  if (!emailPattern.test(email)) {
    return res.status(400).json({ error: 'A valid email address is required' });
  }
  if (attendance !== 'yes' && attendance !== 'no') {
    return res.status(400).json({ error: 'A valid attendance status is required' });
  }

  try {
    const db = await getDb();
    const existing = rowsToObjects(db.exec(
      'SELECT id FROM guests WHERE lower(email) = ? LIMIT 1',
      [email]
    ));
    if (existing.length) {
      return res.status(409).json({
        error: 'This email is already registered. Please use another email or contact the event team.'
      });
    }

    const now = new Date().toISOString();
    const id = uuidv4();
    const ticketId = generateTicketId();
    const qrCodeData = generateQRPayload(ticketId);
    db.run(
      `INSERT INTO guests
        (id, full_name, email, phone, ticket_id, qr_code_data, accredited,
         accredited_at, ticket_sent_count, ticket_last_sent_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, NULL, 0, NULL, ?, ?)`,
      [id, `${firstName} ${lastName}`, email, phone || null, ticketId, qrCodeData, now, now]
    );

    const guest = {
      id,
      full_name: `${firstName} ${lastName}`,
      email,
      phone: phone || null,
      ticket_id: ticketId,
      qr_code_data: qrCodeData,
      accredited: 0,
      accredited_at: null,
      ticket_sent_count: 0,
      ticket_last_sent_at: null,
      created_at: now,
      updated_at: now
    };

    try {
      await sendTicketEmail(guest);
      const sentAt = new Date().toISOString();
      db.run(
        'UPDATE guests SET ticket_sent_count = ticket_sent_count + 1, ticket_last_sent_at = ?, updated_at = ? WHERE id = ?',
        [sentAt, sentAt, id]
      );
      guest.ticket_sent_count = 1;
      guest.ticket_last_sent_at = sentAt;
    } catch (emailError) {
      console.error(`Registration email failed for guest ${id}:`, emailError);
      return res.status(201).json({
        guest: {
          id,
          first_name: firstName,
          last_name: lastName,
          email,
          phone: phone || null,
          ticket_number: ticketId
        },
        created: true,
        email_sent: false,
        email_error: 'Your registration is saved, but the ticket email could not be sent. Please try again or contact the event team.'
      });
    }

    return res.status(201).json({
      guest: {
        id,
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || null,
        ticket_number: ticketId
      },
      created: true,
      email_sent: true
    });
  } catch (error) {
    console.error('Public registration failed:', error);
    return res.status(500).json({ error: 'Registration could not be completed. Please try again.' });
  }
});

module.exports = router;
