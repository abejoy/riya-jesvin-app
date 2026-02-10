import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;

export async function getDatabase() {
  if (!db) {
    await initializeDatabase();
  }
  return db;
}

export async function initializeDatabase() {
  const dbPath =
    process.env.DATABASE_PATH || path.join(__dirname, "../../data/db.sqlite");

  // Ensure directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await db.exec("PRAGMA foreign_keys = ON");

  // Create tables
  await createTables();

  // Initialize admin user
  await initializeAdminUser();

  return db;
}

async function createTables() {
  if (!db) return;

  // Memories table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      date TEXT,
      section TEXT NOT NULL,
      body TEXT NOT NULL,
      location TEXT,
      sortOrder INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  // Memory images table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS memory_images (
      id TEXT PRIMARY KEY,
      memoryId TEXT NOT NULL,
      filename TEXT NOT NULL,
      url TEXT NOT NULL,
      width INTEGER,
      height INTEGER,
      alt TEXT,
      sortOrder INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (memoryId) REFERENCES memories(id) ON DELETE CASCADE
    )
  `);

  // Valentine message table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS valentine_message (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      title TEXT NOT NULL DEFAULT 'Happy Valentines',
      body TEXT NOT NULL DEFAULT 'Forever with you...',
      signature TEXT,
      typedEffect INTEGER NOT NULL DEFAULT 1,
      updatedAt TEXT NOT NULL
    )
  `);

  // Admin users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);

  // Ensure valentine message exists
  const valentine = await db.get(
    "SELECT id FROM valentine_message WHERE id = 1",
  );
  if (!valentine) {
    await db.run(
      `INSERT INTO valentine_message (id, title, body, signature, typedEffect, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        1,
        "Happy Valentine's ❤️",
        "Forever with you...",
        "— Us",
        1,
        new Date().toISOString(),
      ],
    );
  }
}

export async function closeDatabase() {
  if (db) {
    await db.close();
  }
}

async function initializeAdminUser() {
  if (!db) return;

  const admin = await db.get(
    "SELECT * FROM admin_users WHERE username = ?",
    process.env.ADMIN_USERNAME || "admin",
  );

  if (!admin) {
    const adminPassword = process.env.ADMIN_PASSWORD || "changeme";
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const id = uuidv4();

    await db.run(
      `INSERT INTO admin_users (id, username, passwordHash, createdAt) 
       VALUES (?, ?, ?, ?)`,
      id,
      process.env.ADMIN_USERNAME || "admin",
      passwordHash,
      new Date().toISOString(),
    );

    console.log("✓ Admin user initialized");
  }
}
