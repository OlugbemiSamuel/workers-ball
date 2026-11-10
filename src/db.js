const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = path.join(__dirname, '../database.sqlite');

let db = null;
let initializing = false;
let initPromise = null;

// Escape single quotes for SQL
function sqlEscape(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/'/g, "''");
}

// Convert db.exec() result to array of objects
function rowsToObjects(result) {
  if (!result || result.length === 0) return [];
  const { columns, values } = result[0];
  return values.map((row) => {
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
}

async function getDb() {
  if (db) return db;

  if (initializing) {
    return await initPromise;
  }

  initializing = true;
  initPromise = (async () => {
    try {
      const SQL = await initSqlJs();

      let database;
      if (fs.existsSync(DB_PATH)) {
        const filedata = fs.readFileSync(DB_PATH);
        database = new SQL.Database(filedata);
      } else {
        database = new SQL.Database();
        database.run('PRAGMA journal_mode=WAL;');

        database.run(`
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

        database.run(`
          CREATE INDEX IF NOT EXISTS idx_guests_ticket_id ON guests(ticket_id);
          CREATE INDEX IF NOT EXISTS idx_guests_accredited ON guests(accredited);
          CREATE INDEX IF NOT EXISTS idx_guests_email ON guests(email);
          CREATE INDEX IF NOT EXISTS idx_guests_full_name ON guests(full_name);
        `);

        const data = database.export();
        fs.writeFileSync(DB_PATH, Buffer.from(data));
      }

      // Auto-persist on changes
      const originalRun = database.run.bind(database);
      database.run = function (sql, params) {
        const result = originalRun(sql, params);
        try {
          const data = database.export();
          fs.writeFileSync(DB_PATH, Buffer.from(data));
        } catch (e) {}
        return result;
      };

      db = database;
      return database;
    } catch (err) {
      initializing = false;
      throw err;
    }
  })();

  return await initPromise;
}

module.exports = { getDb, uuidv4, sqlEscape, rowsToObjects };
