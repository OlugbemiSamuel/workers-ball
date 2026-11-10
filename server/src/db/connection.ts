import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { GUEST_TABLE_SQL } from "./schema.js";

// Learn: connection = the open door to the database file.
// We keep ONE shared connection (singleton), like one register book
// on the reception desk that everyone writes in, not a new book per person.
//
// Why node:sqlite (built into Node 22+) instead of better-sqlite3?
// better-sqlite3 ships a native binary that needs a new OS (GLIBC 2.29+).
// Namecheap shared hosting runs an older OS, so that binary refuses to
// load (ERR_DLOPEN_FAILED) and the whole API returns 503. node:sqlite
// comes with Node itself, so there is nothing to compile or download.

let db: DatabaseSync | null = null;

const resolveDbPath = (): string => {
  const configured = process.env.DATABASE_PATH || "./data/workers-ball.sqlite";
  return path.resolve(process.cwd(), configured);
};

export const getDb = (): DatabaseSync => {
  if (db) return db;
  const dbPath = resolveDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON");
  return db;
};

// Creates tables if they do not exist. Safe to run on every startup.
export const initDb = (): DatabaseSync => {
  const database = getDb();
  database.exec(GUEST_TABLE_SQL);
  return database;
};

export const closeDb = (): void => {
  if (db) {
    db.close();
    db = null;
  }
};
