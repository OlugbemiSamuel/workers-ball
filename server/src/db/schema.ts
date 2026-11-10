// Guest table definition.
// Learn: schema = the written plan of a table: which columns exist,
// what type each column holds, and what rules the database must enforce.

// Email is the identity WHEN present (unique). It is nullable because
// printed-list guests (no email) are admitted by name instead. SQLite
// treats NULLs as distinct, so many NULL emails never collide.
export const GUEST_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS guests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  attendance_status TEXT NOT NULL DEFAULT 'pending',
  ticket_number TEXT UNIQUE,
  qr_token TEXT UNIQUE,
  is_sent INTEGER NOT NULL DEFAULT 0,
  ticket_sent_count INTEGER NOT NULL DEFAULT 0,
  accredited_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;
