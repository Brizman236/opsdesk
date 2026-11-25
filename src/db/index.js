require("dotenv").config();

const { drizzle } = require("drizzle-orm/node-postgres");
const { Pool } = require("pg");
const schema = require("./schema");

const connectionString =
  process.env.NODE_ENV === "test"
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL;

const requiredVariable =
  process.env.NODE_ENV === "test" ? "TEST_DATABASE_URL" : "DATABASE_URL";

if (!connectionString) {
  throw new Error(`${requiredVariable} must be set before connecting to PostgreSQL`);
}

// A single pool avoids each repository creating independent connections and gives shutdown one owner.
const pool = new Pool({ connectionString });

// Drizzle ORM translates schema-aware JavaScript queries into PostgreSQL operations.
const db = drizzle({ client: pool, schema });

module.exports = { db, pool };
