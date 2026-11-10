const SQL = require('sql.js');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '../../database.sqlite');

// Load SQL.wasm (sql.js needs the wasm binary)
let db;

function initDatabase() {
  // Create a new in-memory database, then persist to file
  db = new SQL.Database();

  // Enable WAL mode for better concurrent access
  db.run('PRAGMA journal_mode=WAL;');

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS guests (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      ticket_id TEXT UNIQUE NOT NULL,
      qr_code_data TEXT,
      accredited INTEGER DEFAULT 0,
      accredited_at TEXT,
      ticket_sent_count INTEGER DEFAULT 0,
      ticket_last_sent_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_guests_ticket_id ON guests(ticket_id);
    CREATE INDEX IF NOT EXISTS idx_guests_accredited ON guests(accredited);
    CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email);
    CREATE INDEX IF NOT EXISTS idx_guests_full_name ON guests(full_name);
  `);

  // Persist to file immediately
  persistDatabase();

  return db;
}

function persistDatabase() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Try to load existing database from file
function loadDatabase() {
  if (fs.existsSync(DB_PATH)) {
    const filedata = fs.readFileSync(DB_PATH);
    db = new SQL.Database(filedata);
    return db;
  }
  return initDatabase();
}

const database = loadDatabase();

// Auto-persist on changes (wrap run to save after writes)
const originalRun = database.run.bind(database);
database.run = function (sql, params) {
  const result = originalRun(sql, params);
  persistDatabase();
  return result;
};

module.exports = database;
module.exports.persistDatabase = persistDatabase;
module.exports.uuidv4 = uuidv4;
