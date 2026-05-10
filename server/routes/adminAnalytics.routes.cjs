const express = require("express");

const { readDatabase } = require("../db.cjs");
const { buildAnalytics } = require("../analytics.cjs");
const analyticsRepository = require("../repositories/analyticsRepository.cjs");
const { requireAdmin } = require("../middleware/adminAuth.cjs");

const router = express.Router();

const USE_POSTGRES = process.env.USE_POSTGRES === "true";

router.use(requireAdmin);

router.get("/", async (req, res) => {
  try {
    const filters = {
      from: req.query.from || "",
      to: req.query.to || "",
    };

    if (USE_POSTGRES) {
      const analytics = await analyticsRepository.buildPostgresAnalytics(
        filters
      );

      return res.json(analytics);
    }

    const db = readDatabase();

    return res.json(buildAnalytics(db, filters));
  } catch (error) {
    console.error("Get admin analytics error:", error);

    return res.status(500).json({
      error: "ADMIN_ANALYTICS_FAILED",
      message: "Не вдалося завантажити аналітику.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;