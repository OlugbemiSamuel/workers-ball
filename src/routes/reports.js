const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');

// GET /api/reports/accreditation — JSON summary
router.get('/accreditation', (req, res) => {
  const db = req.app.locals.db || require('../db');

  const total = db.prepare('SELECT COUNT(*) as c FROM guests').get().c;
  const accredited = db.prepare("SELECT COUNT(*) as c FROM guests WHERE accredited = 1").get().c;
  const pending = total - accredited;
  const percentage = total > 0 ? Math.round((accredited / total) * 100) : 0;

  // Surge hours ranked
  const surgeHours = db.prepare(`
    SELECT 
      CAST(strftime('%H', accredited_at) AS INTEGER) as hour,
      COUNT(*) as count
    FROM guests
    WHERE accredited = 1 AND accredited_at IS NOT NULL
    GROUP BY hour
    ORDER BY count DESC, hour ASC
  `).all();

  // Recent accreditations
  const recent = db.prepare(`
    SELECT full_name, email, ticket_id, accredited_at
    FROM guests
    WHERE accredited = 1 AND accredited_at IS NOT NULL
    ORDER BY accredited_at DESC
    LIMIT 20
  `).all();

  res.json({
    event: process.env.EVENT_NAME || 'Workers Ball 2026',
    eventDate: process.env.EVENT_DATE || '22nd Nov. 2026',
    total,
    accredited,
    pending,
    percentage,
    surgeHours,
    recent
  });
});

// GET /api/reports/pdf — generate Leadway-style PDF report
router.get('/pdf', (req, res) => {
  const db = req.app.locals.db || require('../db');

  const total = db.prepare('SELECT COUNT(*) as c FROM guests').get().c;
  const accredited = db.prepare("SELECT COUNT(*) as c FROM guests WHERE accredited = 1").get().c;
  const pending = total - accredited;
  const percentage = total > 0 ? Math.round((accredited / total) * 100) : 0;

  const surgeHours = db.prepare(`
    SELECT 
      CAST(strftime('%H', accredited_at) AS INTEGER) as hour,
      COUNT(*) as count
    FROM guests
    WHERE accredited = 1 AND accredited_at IS NOT NULL
    GROUP BY hour
    ORDER BY count DESC, hour ASC
  `).all();

  const allGuests = db.prepare(`SELECT * FROM guests ORDER BY created_at DESC`).all();

  const eventName = process.env.EVENT_NAME || 'Workers Ball 2026';
  const eventDate = process.env.EVENT_DATE || '22nd Nov. 2026';
  const venue = process.env.VENUE || 'Harvesters Globe Ologolo';

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, pageWidth, 60, 'F');
  doc.setTextColor(255, 215, 0); // Gold
  doc.setFontSize(24);
  doc.text(eventName, pageWidth / 2, 25, { align: 'center' });
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text(`${eventDate} • ${venue}`, pageWidth / 2, 40, { align: 'center' });
  doc.text('Accreditation Report', pageWidth / 2, 52, { align: 'center' });

  // Summary stats
  let y = 75;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.text('Accreditation Summary', 20, y);
  y += 10;

  const stats = [
    [`Total Registered:`, total],
    [`Total Accredited:`, accredited],
    [`Pending / Not Accredited:`, pending],
    [`Accreditation Rate:`, `${percentage}%`]
  ];

  stats.forEach(([label, value]) => {
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text(label, 20, y);
    doc.setTextColor(0, 100, 0);
    doc.text(String(value), 140, y);
    y += 8;
  });

  // Surge hours table
  y += 15;
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Surge Hours (Accreditations by Hour)', 20, y);
  y += 10;

  if (surgeHours.length > 0) {
    const surgeData = surgeHours.map((h, i) => [
      i + 1,
      `${String(h.hour).padStart(2, '0')}:00`,
      h.count
    ]);
    doc.autoTable({
      startY: y,
      head: [['Rank', 'Hour', 'Accreditations']],
      body: surgeData,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 215, 0] },
      styles: { fontSize: 10, textColor: [0, 0, 0] }
    });
    y = doc.lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text('No accreditations recorded yet.', 20, y);
    y += 15;
  }

  // Guest table
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Guest List & Accreditation Status', 20, y);
  y += 10;

  const guestData = allGuests.map((g, i) => [
    i + 1,
    g.full_name,
    g.email || '-',
    g.ticket_id,
    g.accredited === 1 ? 'Accredited' : 'Pending',
    g.accredited_at ? g.accredited_at.substring(0, 16) : '-'
  ]);

  doc.autoTable({
    startY: y,
    head: [['#', 'Full Name', 'Email', 'Ticket ID', 'Status', 'Accredited At']],
    body: guestData,
    theme: 'striped',
    headStyles: { fillColor: [0, 0, 0], textColor: [255, 215, 0] },
    styles: { fontSize: 8, cellPadding: 3, textColor: [0, 0, 0] },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 35 },
      2: { cellWidth: 40 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: 35 }
    }
  });

  const fileName = `${eventName.replace(/\s+/g, '-')}-Accreditation-Report.pdf`;
  const pdfBuffer = doc.output('arraybuffer');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.send(Buffer.from(pdfBuffer));
});

module.exports = router;
