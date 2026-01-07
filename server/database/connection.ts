import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(__dirname, '../../database.sqlite');
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initializeDatabase() {
  const fs = require('fs');
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  
  db.exec(schema);
}

// Close database connection
export function closeDatabase() {
  db.close();
}

