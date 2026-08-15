require("dotenv").config();

const prisma = require("../database/prisma.cjs");
const {
  runEnabledSupplierSyncs,
} = require("../services/supplierAvailabilitySync.cjs");

async function main() {
  if (process.env.USE_POSTGRES !== "true") {
    throw new Error("Milk Diller synchronization requires USE_POSTGRES=true.");
  }

  const results = await runEnabledSupplierSyncs();
  const failures = results.filter((result) => result.status === "failed");

  console.log(
    JSON.stringify(
      {
        ok: failures.length === 0,
        completedAt: new Date().toISOString(),
        results,
      },
      null,
      2
    )
  );

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("Milk Diller synchronization failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
