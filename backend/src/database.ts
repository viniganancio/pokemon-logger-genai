import sqlite3 from 'sqlite3';
import path from 'path';

// Use test database path for tests, otherwise use production path
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'pokemon_logger.db');
export const db = new sqlite3.Database(dbPath);

export const initDatabase = () => {
  db.serialize(() => {
    // Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        createdAt TEXT NOT NULL
      )
    `);

    // User Pokemon table
    db.run(`
      CREATE TABLE IF NOT EXISTS user_pokemon (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        pokemonId INTEGER NOT NULL,
        pokemonName TEXT NOT NULL,
        pokemonImage TEXT NOT NULL,
        pokemonTypes TEXT NOT NULL,
        category TEXT NOT NULL,
        notes TEXT,
        dateAdded TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    `);
  });
};