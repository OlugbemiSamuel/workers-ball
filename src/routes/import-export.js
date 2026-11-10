const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getDb, sqlEscape, rowsToObjects } = require('../db');
const { generateTicketId, generateQRPayload } = require('../utils/qrcode-gen');

const router = express.Router();
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `import-${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

router.post('/import', upload.single('file'), async (req, res) => {
  try {
    const db = await getDb();
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    fs.unlinkSync(req.file.path);

    const now = new Date().toISOString();
    let imported = 0, skipped = 0, errors = [];

    const insertStmt = db.prepare(
      `INSERT OR IGNORE INTO guests (id, full_name, email, phone, ticket_id, qr_code_data, accredited, accredited_at, ticket_sent_count, ticket_last_sent_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, NULL, 0, NULL, ?, ?)`
    );

    data.forEach((row, index) => {
      try {
        const full_name = row.full_name || row.name || row['Full Name'] || '';
        const email = row.email || row.Email || row['Email Address'] || null;
        const phone = row.phone || row.Phone || row['Phone Number'] || null;
        if (!full_name) { skipped++; errors.push({ row: index + 2, reason: 'Missing full_name' }); return; }

        const id = uuidv4();
        const ticket_id = generateTicketId();
        const qr_code_data = generateQRPayload(ticket_id);
        insertStmt.run([id, full_name, email, phone, ticket_id, qr_code_data, now, now]);
        imported++;
      } catch (err) { skipped++; errors.push({ row: index + 2, reason: err.message }); }
    });

    res.json({ imported, skipped, total: data.length, errors: errors.slice(0, 10) });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('Import error:', err);
    res.status(500).json({ error: 'Import failed', details: err.message });
  }
});

router.get('/export', async (req, res) => {
  try {
    const db = await getDb();
    const { format = 'xlsx', accredited } = req.query;

    let where = '';
    if (accredited === 'true') where = 'WHERE accredited = 1';
    else if (accredited === 'false') where = 'WHERE accredited = 0';

    const result = db.exec(`SELECT * FROM guests ${where} ORDER BY created_at DESC`);
    const rows = rowsToObjects(result);

    const exportData = rows.map(r => ({
      'Ticket ID': r.ticket_id, 'Full Name': r.full_name, Email: r.email || '',
      Phone: r.phone || '', Accredited: r.accredited === 1 ? 'Yes' : 'No',
      'Accredited At': r.accredited_at || '', 'Tickets Sent': r.ticket_sent_count || 0,
      'Last Sent': r.ticket_last_sent_at || '', 'Created At': r.created_at || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Guests');

    const fileName = `workers-ball-guests-${new Date().toISOString().split('T')[0]}.${format}`;
    const filePath = path.join(uploadDir, fileName);

    if (format === 'csv') XLSX.writeFile(workbook, filePath, { bookType: 'csv', type: 'file' });
    else XLSX.writeFile(workbook, filePath, { bookType: 'xlsx', type: 'file' });

    res.download(filePath, fileName);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Export failed', details: err.message });
  }
});

module.exports = router;
