require("dotenv").config();

const { defineConfig } = require("drizzle-kit");

const isGenerateCommand = process.argv.slice(2).includes("generate");
const connectionVariable =
  process.env.NODE_ENV === "test" ? "TEST_DATABASE_URL" : "DATABASE_URL";
const connectionString = process.env[connectionVariable];

const config = {
  dialect: "postgresql",
  schema: "./src/db/schema.js",
  out: "./drizzle",
};

// Generation reads the schema only and does not need database credentials.
if (!isGenerateCommand) {
  if (!connectionString) {
    throw new Error(
      `${connectionVariable} must be set before running Drizzle Kit`
    );
  }

  config.dbCredentials = { url: connectionString };
}

module.exports = defineConfig(config);
