require("dotenv").config();

const { defineConfig } = require("drizzle-kit");

// Generation reads the schema; migration commands use DATABASE_URL to reach the database.
module.exports = defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.js",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL || ""
  }
});
