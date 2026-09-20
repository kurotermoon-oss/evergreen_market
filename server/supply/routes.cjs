const express = require("express");
const { getConfig, issueSession, verifySession } = require("./auth.cjs");
const { snapshot } = require("./domain.cjs");
const { createRateLimiter } = require("../httpSecurity.cjs");
function createSupplyRouter({ repository, config = getConfig }) {
  const router = express.Router();
  router.use((req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
  router.post("/session", createRateLimiter({ windowMs: 60000, max: 20, keyPrefix: "supply-login" }), (req, res, next) => {
    try { res.json(issueSession(req.body?.initData, config())); } catch (e) { next(e); }
  });
  router.use((req, res, next) => {
    try { req.supplyUser = verifySession(String(req.get("authorization") || "").replace(/^Bearer /, ""), config()); next(); }
    catch (e) { next(e); }
  });
  router.use(createRateLimiter({ windowMs: 60000, max: 180, keyPrefix: "supply", keyGenerator: req => req.supplyUser.id }));
  async function payload(state) {
    const cfg = config();
    const health = repository.pool ? (await repository.pool.query("SELECT last_tick_at, last_sent_at, last_error FROM supply_worker_status WHERE id = 'evergreen'")).rows[0] : null;
    return { ...snapshot(state), deliveryHealth: { configured: cfg.notificationsConfigured, workerEnabled: cfg.workerEnabled, ...health } };
  }
  router.get("/state", async (req, res, next) => { try { res.json(await payload(await repository.read())); } catch (e) { next(e); } });
  router.post("/command", async (req, res, next) => {
    try {
      if (Buffer.byteLength(JSON.stringify(req.body || {})) > 32000) return res.status(413).json({ message: "Завеликий запит." });
      res.json(await payload(await repository.command(req.body?.action, req.body?.revision)));
    } catch (e) { next(e); }
  });
  router.use((e, req, res, next) => { const status = e.status || 500; res.status(status).json({ message: status < 500 || status === 503 ? e.message : "Не вдалося зберегти дані. Оновіть список перед повторною спробою." }); });
  return router;
}
module.exports = { createSupplyRouter };
