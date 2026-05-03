require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { pool } = require("./pool.cjs");

async function migrate() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is missing. Add it to .env or Railway variables."
    );
  }

  const schemaPath = path.join(__dirname, "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");

  await pool.query(schemaSql);

  console.log("✅ PostgreSQL schema migrated successfully.");
}

migrate()
  .catch((error) => {
    console.error("❌ Migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });