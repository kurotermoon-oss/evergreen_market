const express = require("express");

const { readDatabase } = require("../db.cjs");
const { buildAnalytics } = require("../analytics.cjs");
const { requireAdmin } = require("../middleware/adminAuth.cjs");

const router = express.Router();

router.use(requireAdmin);

router.get("/", (req, res) => {
  const db = readDatabase();

  res.json(
    buildAnalytics(db, {
      from: req.query.from || "",
      to: req.query.to || "",
    })
  );
});

module.exports = router;