const express = require("express");

const { readDatabase } = require("../db.cjs");
const {
  ensureCategoriesStore,
  sanitizePublicCategory,
} = require("../services/category.service.cjs");

const { sanitizePublicProduct } = require("../utils/sanitize.cjs");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ ok: true });
});

router.get("/categories", (req, res) => {
  const db = readDatabase();
  ensureCategoriesStore(db);

  res.json({
    categories: db.categories
      .filter((category) => category.active !== false)
      .map(sanitizePublicCategory),
  });
});

router.get("/products", (req, res) => {
  const db = readDatabase();

  res.json({
    products: db.products
      .filter((product) => product.active)
      .map(sanitizePublicProduct),
  });
});

module.exports = router;