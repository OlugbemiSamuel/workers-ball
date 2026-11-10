import PDFKit from "pdfkit";
import fs from "node:fs";
import path from "node:path";
import { getDb } from "../db/connection.js";

// Build-report: generates a Leadway-style PDF accreditation report.
// Usage: npx tsx src/scripts/build-report.ts [output.pdf]

const outPath = process.argv[2] || path.resolve(process.cwd(), "workers-ball-accreditation-report.pdf");

const doc = new PDFKit({ margin: 50 });
const stream = fs.createWriteStream(outPath);
doc.pipe(stream);

// Header band
doc.rect(0, 0, doc.page.width, 60).fill("#000000");
doc.fillColor("#ffd700").fontSize(24).text(process.env.EVENT_NAME || "Workers Ball 2026", {
  align: "center",
  y: 25,
});
doc.fillColor("#ffffff").fontSize(12).text(
  `${process.env.EVENT_DATE || "22nd Nov. 2026"} • ${process.env.VENUE || "Harvesters Globe Ologolo"}`,
  { align: "center", y: 40 }
);
doc.fillColor("#ffffff").fontSize(12).text("Accreditation Report", { align: "center", y: 52 });

// Summary stats
let y = 75;
doc.fillColor("#000000").fontSize(16).text("Accreditation Summary", 20, y);
y += 10;

const db = require("../db/connection.js").getDb();
const totalRow = db.prepare("SELECT COUNT(*) as c FROM guests").get() as { c: number };
const total = totalRow.c;
const accreditedRow = db.prepare("SELECT COUNT(*) as c FROM guests WHERE accredited = 1").get() as { c: number };
const accredited = accreditedRow.c;
const pending = total - accredited;
const percentage = total > 0 ? Math.round((accredited / total) * 100) : 0;

const stats = [
  ["Total Registered:", String(total)],
  ["Total Accredited:", String(accredited)],
  ["Pending / Not Accredited:", String(pending)],
  ["Accreditation Rate:", `${percentage}%`],
];
stats.forEach(([label, value]) => {
  doc.fillColor("#323232").fontSize(12).text(label, 20, y);
  doc.fillColor("#006400").fontSize(12).text(value, 140, y);
  y += 8;
});

// Surge hours
y += 15;
doc.fillColor("#000000").fontSize(16).text("Surge Hours (Accreditations by Hour)", 20, y);
y += 10;

const surgeRows = db.prepare(
  `SELECT CAST(strftime('%H', accredited_at) AS INTEGER) as hour, COUNT(*) as count
   FROM guests WHERE accredited = 1 AND accredited_at IS NOT NULL
   GROUP BY hour ORDER BY count DESC, hour ASC`
).all() as Array<{ hour: number; count: number }>;

if (surgeRows.length > 0) {
  const tableTop = y;
  doc.fontSize(10).fillColor("#000000");
  doc.text("Rank", 20, tableTop);
  doc.text("Hour", 70, tableTop);
  doc.text("Accreditations", 120, tableTop, { align: "right" });
  y = tableTop + 15;
  surgeRows.forEach((h, i) => {
    doc.text(String(i + 1), 20, y);
    doc.text(`${String(h.hour).padStart(2, "0")}:00`, 70, y);
    doc.text(String(h.count), 120, y, { align: "right" });
    y += 14;
  });
  y += 10;
} else {
  doc.fillColor("#666666").fontSize(12).text("No accreditations recorded yet.", 20, y);
  y += 15;
}

// Guest table
doc.fillColor("#000000").fontSize(16).text("Guest List & Accreditation Status", 20, y);
y += 10;

const allRows = db.prepare(`SELECT * FROM guests ORDER BY created_at DESC`).all() as Array<GuestRow>;
const headerY = y;
doc.fontSize(8).fillColor("#ffffff").rect(20, headerY, doc.page.width - 40, 14).fill("#000000");
doc.text("#", 25, headerY + 4);
doc.text("Full Name", 45, headerY + 4);
doc.text("Email", 120, headerY + 4);
doc.text("Ticket ID", 220, headerY + 4);
doc.text("Status", 270, headerY + 4);
doc.text("Accredited At", 340, headerY + 4);

let rowY = headerY + 14;
allRows.forEach((g, i) => {
  const isAccredited = g.accredited_at === 1 || g.accredited === 1;
  const status = isAccredited ? "Accredited" : "Pending";
  const at = g.accredited_at ? String(g.accredited_at).substring(0, 16) : "-";
  doc.fontSize(8).fillColor("#000000");
  doc.text(String(i + 1), 25, rowY);
  doc.text(g.full_name, 45, rowY);
  doc.text(g.email || "-", 120, rowY);
  doc.text(g.ticket_number || g.ticket_id || "-", 220, rowY);
  doc.text(status, 270, rowY);
  doc.text(at, 340, rowY);
  rowY += 14;
});

doc.end();
stream.on("finish", () => {
  console.log(`PDF report written to ${outPath}`);
});

interface GuestRow {
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  ticket_number: string | null;
  ticket_id: string | null;
  qr_token: string | null;
  accredited: number;
  accredited_at: string | null;
  ticket_sent_count: number;
  created_at: string;
  updated_at: string;
}
