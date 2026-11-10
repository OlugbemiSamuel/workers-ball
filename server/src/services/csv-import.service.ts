// Learn: CSV import = bulk guest creation from a spreadsheet.
// The service parses CSV text, validates each row, and inserts guests.
// One bad row doesn't stop the rest - errors are reported per row.

interface CsvRow {
  full_name?: string;
  name?: string;
  "Full Name"?: string;
  email?: string;
  Email?: string;
  phone?: string;
  Phone?: string;
}

export interface CsvImportResult {
  imported: number;
  skipped: number;
  total: number;
  errors: Array<{ row: number; reason: string }>;
}

// Simple random ID generator (no uuid dependency needed for shared hosting)
const makeId = (): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const importGuestsFromCsv = (csv: unknown): CsvImportResult => {
  if (typeof csv !== "string") {
    throw new Error("CSV content is required");
  }

  // Simple CSV parser: split by lines, then by commas
  // Handles basic CSV with quoted fields containing commas
  const lines = csv.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length === 0) {
    return { imported: 0, skipped: 0, total: 0, errors: [] };
  }

  // Parse header
  const headerLine = lines[0];
  const headers = parseCsvLine(headerLine).map((h) => h.trim());

  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: CsvRow = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx]?.trim()) ?? null;
    });
    rows.push(row);
  }

  const now = new Date().toISOString();
  let imported = 0;
  let skipped = 0;
  const errors: Array<{ row: number; reason: string }> = [];

  const db = getDb();
  const insertStmt = db.prepare(
    `INSERT INTO guests (id, full_name, email, phone, ticket_id, qr_code_data, accredited, accredited_at, ticket_sent_count, ticket_last_sent_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, NULL, 0, NULL, ?, ?)`
  );

  rows.forEach((row, index) => {
    try {
      const rowNum = index + 2; // +1 for 0-based, +1 for header
      const full_name = (row.full_name ?? row.name ?? row["Full Name"]) || "";
      const email = row.email ?? row.Email ?? null;
      const phone = row.phone ?? row.Phone ?? null;

      if (!full_name) {
        skipped++;
        errors.push({ row: rowNum, reason: "Missing full_name" });
        return;
      }

      // Check email uniqueness
      if (email) {
        const existing = db.prepare("SELECT id FROM guests WHERE email = ? LIMIT 1").get(email);
        if (existing) {
          skipped++;
          errors.push({ row: rowNum, reason: "Email already exists" });
          return;
        }
      }

      const id = makeId();
      const ticket_id = generateTicketId();
      const qr_code_data = generateQRPayload(ticket_id);

      insertStmt.run([id, full_name, email, phone, ticket_id, qr_code_data, now, now]);
      imported++;
    } catch (err) {
      skipped++;
      errors.push({ row: index + 2, reason: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  return { imported, skipped, total: rows.length, errors: errors.slice(0, 10) };
};

// Simple CSV line parser: handles quoted fields with commas
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}
