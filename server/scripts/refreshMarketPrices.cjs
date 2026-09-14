require("dotenv").config();
const prisma = require("../database/prisma.cjs");
const { refreshProfiles } = require("../services/marketPricing.cjs");
async function main() {
  if (process.env.USE_POSTGRES !== "true") throw new Error("Моніторинг потребує PostgreSQL.");
  const limit = Math.min(100, Math.max(1, Number(process.env.PRICE_MONITOR_LIMIT) || 20));
  const result = await refreshProfiles({ limit });
  console.log(JSON.stringify(result));
  if (result.failed || result.conflicts) process.exitCode = 1;
}
main().catch(() => { console.error("Price monitoring failed; research snapshots were not fully refreshed."); process.exitCode = 1; }).finally(() => prisma.$disconnect());
