require("dotenv").config({ quiet: true });
const { pool } = require("../database/pool.cjs");
const { createRepository } = require("../supply/repository.cjs");
const { runTick } = require("../supply/worker.cjs");
runTick(createRepository(pool)).then(result => console.log(JSON.stringify(result)))
  .catch(() => { console.error("Supply reminders failed. Check database connection and migrations."); process.exitCode = 1; })
  .finally(() => pool.end());
