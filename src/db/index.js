require("dotenv").config();

const { drizzle } = require("drizzle-orm/node-postgres");
const { Pool } = require("pg");
const schema = require("./schema");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set before connecting to PostgreSQL");
}

// A single pool avoids each repository creating independent connections and gives shutdown one owner.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Drizzle ORM translates schema-aware JavaScript queries into PostgreSQL operations.
const db = drizzle({ client: pool, schema });

module.exports = { db, pool };
