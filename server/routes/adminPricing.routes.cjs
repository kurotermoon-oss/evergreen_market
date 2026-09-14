const express = require("express");
const { requireAdmin } = require("../middleware/adminAuth.cjs");
const { getProfile, saveProfile } = require("../services/marketPricing.cjs");
const { fetchMarketQuote } = require("../integrations/marketPriceQuote.cjs");
const router = express.Router();
router.use(requireAdmin);
let activeQuotes = 0;
const handle = callback => async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  try { return res.json(await callback(req)); }
  catch (error) {
    const setupError = ["P2021", "P2022"].includes(error.code);
    return res.status(setupError ? 409 : error.status || 400).json({ message: setupError ? "Спочатку застосуйте міграцію market_price_profiles у потрібному середовищі." : error.message || "Не вдалося виконати розрахунок." });
  }
};
router.post("/quote", handle(async req => {
  if (activeQuotes >= 2) throw Object.assign(new Error("Дві перевірки вже виконуються. Спробуйте трохи пізніше."), { status: 429 });
  activeQuotes++;
  try { return { quote: await fetchMarketQuote(req.body || {}) }; }
  finally { activeQuotes--; }
}));
router.get("/:productId", handle(req => getProfile(req.params.productId)));
router.put("/:productId", handle(req => saveProfile(req.params.productId, req.body?.profile, req.body?.revision)));
module.exports = router;
