import { randomBytes } from "node:crypto";
import type { CreateGuestInput, Guest } from "../types/guest.types.js";
import { getDb } from "../db/connection.js";

// Learn: repository = the ONLY staff allowed to touch the register book.
// Controllers/services must ask the repository; they never run SQL directly.
// This keeps SQL in one place so a schema change touches one file.

type GuestRow = Guest;

const toGuest = (row: GuestRow): Guest => ({ ...row });

export const createGuest = (input: CreateGuestInput): Guest => {
  const db = getDb();
  const ticket_number = `WB26-${String(Math.floor(Math.random() * 90000) + 10000).padStart(5, "0")}`;
  const qr_token = randomBytes(32).toString("hex");

  db.prepare(
    "INSERT INTO guests (first_name, last_name, email, phone, attendance_status, ticket_number, qr_token) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(
    input.first_name,
    input.last_name,
    input.email,
    input.phone ?? null,
    input.attendance_status ?? "pending",
    ticket_number,
    qr_token
  );

  const idRow = db.prepare("SELECT last_insert_rowid() AS id").get() as { id: number };
  const created = db.prepare("SELECT * FROM guests WHERE id = ?").get(idRow.id) as GuestRow | undefined;
  if (!created) throw new Error("Failed to read back created guest");
  return toGuest(created);
};

export const findGuestById = (id: number): Guest | null => {
  const db = getDb();
  const row = db.prepare("SELECT * FROM guests WHERE id = ?").get(id) as GuestRow | undefined;
  return row ? toGuest(row) : null;
};

export const findGuestByEmail = (email: string): Guest | null => {
  const db = getDb();
  const row = db.prepare("SELECT * FROM guests WHERE email = ?").get(email) as GuestRow | undefined;
  return row ? toGuest(row) : null;
};

export const findGuestByQrToken = (qrToken: string): Guest | null => {
  const db = getDb();
  const row = db.prepare("SELECT * FROM guests WHERE qr_token = ?").get(qrToken) as GuestRow | undefined;
  return row ? toGuest(row) : null;
};

export const listGuests = (limit = 2000): Guest[] => {
  const db = getDb();
  const capped = Math.min(Math.max(limit, 1), 2000);
  const rows = db.prepare("SELECT * FROM guests ORDER BY id ASC LIMIT ?").all(capped) as unknown as GuestRow[];
  return rows.map(toGuest);
};

export const listRecentlyAccredited = (limit = 20): Guest[] => {
  const db = getDb();
  const capped = Math.min(Math.max(limit, 1), 50);
  const rows = db.prepare("SELECT * FROM guests WHERE accredited_at IS NOT NULL ORDER BY accredited_at DESC LIMIT ?").all(capped) as unknown as GuestRow[];
  return rows.map(toGuest);
};

export const searchGuests = (query: string, limit = 20): Guest[] => {
  const term = query.trim();
  if (term === "") return [];
  const like = `%${term.replace(/[\\%_]/g, (ch) => `\\${ch}`)}%`;
  const capped = Math.min(Math.max(limit, 1), 50);
  const db = getDb();
  const rows = db.prepare(
    "SELECT * FROM guests WHERE first_name LIKE ? ESCAPE '\\' OR last_name LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\' OR phone LIKE ? ESCAPE '\\' OR ticket_number LIKE ? ESCAPE '\\' ORDER BY id ASC LIMIT ?"
  ).all(like, like, like, like, like, capped) as unknown as GuestRow[];
  return rows.map(toGuest);
};

export type GuestPatch = Partial<Pick<Guest, "first_name" | "last_name" | "email" | "phone" | "attendance_status">>;

export const updateGuestById = (id: number, patch: GuestPatch): Guest | null => {
  const columns = Object.keys(patch) as (keyof GuestPatch)[];
  if (columns.length === 0) return findGuestById(id);
  const db = getDb();
  const setClause = columns.map((col) => `${col} = ?`).join(", ");
  const values = columns.map((col) => patch[col]);
  db.prepare(`UPDATE guests SET ${setClause}, updated_at = datetime('now') WHERE id = ?`).run(...values, id);
  return findGuestById(id);
};

export type AccreditResult =
  | { status: "accredited"; guest: Guest }
  | { status: "not_found" }
  | { status: "already_accredited"; guest: Guest };

export const accreditGuestById = (id: number): AccreditResult => {
  const db = getDb();
  const result = db.prepare(
    "UPDATE guests SET accredited_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND accredited_at IS NULL"
  ).run(id);
  if (result.changes > 0) {
    const guest = findGuestById(id);
    if (guest) return { status: "accredited", guest };
  }
  const existing = findGuestById(id);
  if (!existing) return { status: "not_found" };
  return { status: "already_accredited", guest: existing };
};

export const markTicketSent = (id: number): Guest | null => {
  const db = getDb();
  db.prepare("UPDATE guests SET ticket_sent_count = ticket_sent_count + 1, updated_at = datetime('now') WHERE id = ?").run(id);
  return findGuestById(id);
};

export const markRsvpSent = (id: number): Guest | null => {
  const db = getDb();
  db.prepare("UPDATE guests SET is_sent = 1, updated_at = datetime('now') WHERE id = ?").run(id);
  return findGuestById(id);
};

export const listUnsentTicketBatch = (limit = 5): Guest[] => {
  const db = getDb();
  const capped = Math.min(Math.max(limit, 1), 20);
  const rows = db.prepare("SELECT * FROM guests WHERE ticket_sent_count = 0 ORDER BY id ASC LIMIT ?").all(capped) as unknown as GuestRow[];
  return rows.map(toGuest);
};

const TICKET_PREFIX = "WB";
const QR_TOKEN_BYTES = 32;

const ticketNumberFor = (id: number): string => {
  return `${TICKET_PREFIX}-${String(id).padStart(6, "0")}`;
};

export const generateTicketCredentials = (id: number): Guest | null => {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const existing = findGuestById(id);
    if (!existing) {
      db.exec("ROLLBACK");
      return null;
    }
    if (existing.ticket_number && existing.qr_token) {
      db.exec("ROLLBACK");
      return existing;
    }
    const ticket_number = existing.ticket_number ?? ticketNumberFor(id);
    let qr_token = existing.qr_token;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = qr_token ?? randomBytes(QR_TOKEN_BYTES).toString("hex");
      try {
        db.prepare(
          "UPDATE guests SET ticket_number = ?, qr_token = ?, updated_at = datetime('now') WHERE id = ?"
        ).run(ticket_number, candidate, id);
        qr_token = candidate;
        break;
      } catch (err) {
        if (err instanceof Error && err.message.includes("UNIQUE") && attempt < 4) {
          qr_token = null;
          continue;
        }
        throw err;
      }
    }
    const done = findGuestById(id);
    db.exec("COMMIT");
    return done;
  } catch (err) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // ignore - connection may already be out of transaction
    }
    throw err;
  }
};
