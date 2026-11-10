const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

const DB_PATH = path.join(__dirname, 'database.sqlite');
console.log('DB_PATH:', DB_PATH);
console.log('File exists:', fs.existsSync(DB_PATH));

(async () => {
  const SQL = await initSqlJs();
  
  let database;
  if (fs.existsSync(DB_PATH)) {
    console.log('Loading from file...');
    const filedata = fs.readFileSync(DB_PATH);
    database = new SQL.Database(filedata);
  } else {
    console.log('Creating new empty database...');
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
    console.log('Table created.');
    
    const count = database.exec('SELECT COUNT(*) as c FROM guests');
    console.log('Count right after table creation:', JSON.stringify(count));
  }
  
  const emailCheck = db => db.exec("SELECT id FROM guests WHERE email = 'john@test.com' LIMIT 1");
  console.log('Email check:', JSON.stringify(emailCheck(database)));
})();
