const express = require('express');
const router = express.Router();
const { jsPDF } = require('jspdf');
const { getDb, sqlEscape, rowsToObjects } = require('../db');

// Simple admin auth check
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');
  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
  if ((username === ADMIN_USERNAME || (ADMIN_EMAIL && username === ADMIN_EMAIL)) && password === ADMIN_PASSWORD) {
    return next();
  }
  return res.status(401).json({ error: 'Invalid credentials' });
}

router.use(requireAuth);

router.get('/accreditation', async (req, res) => {
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
      GROUP BY hour ORDER BY count DESC, hour ASC
    `);
    const surgeHours = rowsToObjects(surgeResult);

    const recentResult = db.exec(`
      SELECT id, full_name, email, ticket_id, accredited_at
      FROM guests WHERE accredited = 1 AND accredited_at IS NOT NULL
      ORDER BY accredited_at DESC LIMIT 20
    `);
    const recent = rowsToObjects(recentResult);

    res.json({
      event: process.env.EVENT_NAME || 'Sixth Season',
      eventDate: process.env.EVENT_DATE || 'Sunday, 22nd November 2026',
      total, accredited, pending, percentage, surgeHours, recent
    });
  } catch (err) {
    console.error('Report stats error:', err);
    res.status(500).json({ error: 'Failed to get report stats' });
  }
});

router.get('/pdf', async (req, res) => {
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
      GROUP BY hour ORDER BY count DESC, hour ASC
    `);
    const surgeHours = rowsToObjects(surgeResult);

    const allResult = db.exec('SELECT * FROM guests ORDER BY created_at DESC');
    const allGuests = rowsToObjects(allResult);

    const eventName = process.env.EVENT_NAME || 'Sixth Season';
    const eventDate = process.env.EVENT_DATE || 'Sunday, 22nd November 2026';
    const venue = process.env.VENUE || 'BYD, Victoria Island, Lagos';

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, pageWidth, 60, 'F');
    doc.setTextColor(212, 212, 216);
    doc.setFontSize(24);
    doc.text(eventName, pageWidth / 2, 25, { align: 'center' });
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text(`${eventDate} | ${venue}`, pageWidth / 2, 40, { align: 'center' });
    doc.text('Accreditation Report', pageWidth / 2, 52, { align: 'center' });

    let y = 75;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('Accreditation Summary', 20, y);
    y += 10;

    const stats = [['Total Registered:', total], ['Total Accredited:', accredited], ['Pending / Not Accredited:', pending], ['Accreditation Rate:', `${percentage}%`]];
    stats.forEach(([label, value]) => {
      doc.setFontSize(12);
      doc.setTextColor(50, 50, 50);
      doc.text(label, 20, y);
      doc.setTextColor(0, 0, 0);
      doc.text(String(value), 140, y);
      y += 8;
    });

    y += 15;
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Surge Hours (Accreditations by Hour)', 20, y);
    y += 10;

    if (surgeHours.length > 0) {
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      doc.text('Rank', 20, y);
      doc.text('Hour', 55, y);
      doc.text('Accreditations', 100, y);
      y += 7;
      surgeHours.forEach((hour, index) => {
        doc.text(String(index + 1), 20, y);
        doc.text(`${String(hour.hour).padStart(2, '0')}:00`, 55, y);
        doc.text(String(hour.count), 100, y);
        y += 7;
      });
      y += 8;
    } else {
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text('No accreditations recorded yet.', 20, y);
      y += 15;
    }

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Guest List & Accreditation Status', 20, y);
    y += 10;
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    allGuests.forEach((guest, index) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      const name = doc.splitTextToSize(`${index + 1}. ${guest.full_name}`, pageWidth - 40);
      const details = doc.splitTextToSize(
        `${guest.email || '-'} | ${guest.ticket_id} | ${guest.accredited === 1 ? 'Accredited' : 'Pending'} | ${guest.accredited_at || '-'}`,
        pageWidth - 45
      );
      doc.text(name, 20, y);
      y += name.length * 4;
      doc.text(details, 25, y);
      y += details.length * 4 + 3;
    });

    const fileName = `${eventName.replace(/\s+/g, '-')}-Accreditation-Report.pdf`;
    const pdfBuffer = doc.output('arraybuffer');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(Buffer.from(pdfBuffer));
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: 'Failed to generate PDF', details: err.message });
  }
});

module.exports = router;
