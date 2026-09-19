const express = require("express");
const { issueSession, verifySession } = require("../telegram/adminAuth.cjs");
const { createRateLimiter } = require("../httpSecurity.cjs");
const { statusOf } = require("../services/orderActionGuard.cjs");

function orderSummary(order) {
  const { id, orderNumber, customerName, customerPhone, customerTelegram, total, status, createdAt, updatedAt, isFinal } = order;
  return { id: String(id), orderNumber, customerName, customerPhone, customerTelegram, total, status: statusOf(order), createdAt, updatedAt, isFinal,
    itemCount: (order.items || []).length };
}
function productSummary(product) {
  if (!product) return null;
  const { id, name, price, active, stockStatus, stockQuantity, fulfillmentType, supplierId, supplierProductUrl, unit, packageInfo } = product;
  return { id, name, price, active, stockStatus, stockQuantity, fulfillmentType, supplierId, supplierProductUrl, unit, packageInfo,
    supplier: product.supplier ? { id: product.supplier.id, name: product.supplier.name, isActive: product.supplier.isActive, minOrderAmount: product.supplier.minOrderAmount } : null };
}
function createTelegramAdminRouter({ listOrders, listProducts, performAction, config }) {
  const router = express.Router();
  router.use((req, res, next) => { res.set("Cache-Control", "no-store"); next(); });
  router.post("/session", createRateLimiter({ windowMs: 60000, max: 20, keyPrefix: "telegram-admin-login" }), (req, res, next) => {
    try { res.json(issueSession(req.body?.initData, config?.())); } catch (error) { next(error); }
  });
  router.use((req, res, next) => {
    try {
      const header = String(req.get("authorization") || "");
      req.telegramAdmin = verifySession(header.startsWith("Bearer ") ? header.slice(7) : "", config?.());
      next();
    } catch (error) { next(error); }
  });
  router.use(createRateLimiter({ windowMs: 60000, max: 120, keyPrefix: "telegram-admin", keyGenerator: req => req.telegramAdmin.id }));
  router.get("/orders", async (req, res, next) => {
    try {
      const query = String(req.query.q || "").trim().toLocaleLowerCase("uk").slice(0, 150);
      const history = req.query.scope === "history";
      const status = String(req.query.status || "all");
      const offset = Math.max(0, Math.min(100000, Number.parseInt(req.query.offset, 10) || 0));
      const all = (await listOrders()).map(orderSummary).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const active = all.filter(o => !o.isFinal && !["completed", "cancelled"].includes(o.status));
      const base = history ? all.filter(o => o.isFinal || ["completed", "cancelled"].includes(o.status)) : active;
      const filtered = base.filter(o => (status === "all" || o.status === status) && [o.orderNumber, o.customerName, o.customerPhone, o.customerTelegram].join(" ").toLocaleLowerCase("uk").includes(query));
      res.json({ orders: filtered.slice(offset, offset + 50), total: filtered.length, activeCount: active.length, nextOffset: offset + 50 < filtered.length ? offset + 50 : null });
    } catch (error) { next(error); }
  });
  router.get("/orders/:id", async (req, res, next) => {
    try {
      const order = (await listOrders()).find(o => String(o.id) === req.params.id);
      if (!order) return res.status(404).json({ message: "Замовлення не знайдено." });
      const products = new Map((await listProducts()).map(p => [String(p.id), p]));
      res.json({ order: { ...orderSummary(order), comment: order.comment, paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus,
        deliveryType: order.deliveryType, cancelReason: order.cancelReason, statusHistory: order.statusHistory,
        items: (order.items || []).map(item => ({ productId: item.productId, name: item.name, price: item.price, quantity: item.quantity, total: item.total,
          unit: item.unit, packageInfo: item.packageInfo, product: productSummary(products.get(String(item.productId))) })) } });
    } catch (error) { next(error); }
  });
  router.patch("/orders/:id/action", async (req, res, next) => {
    try {
      const { action, expectedStatus, reason = "" } = req.body || {};
      if (!["confirm", "start_preparing", "mark_ready", "complete", "cancel"].includes(action) ||
        !["new", "confirmed", "preparing", "ready"].includes(expectedStatus) || typeof reason !== "string" || reason.length > 500) {
        return res.status(400).json({ message: "Перевірте дію та поточний статус замовлення." });
      }
      if (action === "cancel" && !reason.trim()) return res.status(400).json({ message: "Вкажіть причину скасування." });
      const result = await performAction(req.params.id, action, { expectedStatus, reason: reason.trim(), strict: true, actor: req.telegramAdmin.id });
      res.json({ ok: true, order: orderSummary(result.order), customerTelegramResult: result.customerTelegramResult });
    } catch (error) { next(error); }
  });
  router.use((error, req, res, next) => {
    const status = error.status || 500;
    res.status(status).json({ message: status < 500 || status === 503 ? error.message : "Не вдалося виконати запит. Оновіть замовлення перед повторною спробою." });
  });
  return router;
}
module.exports = { createTelegramAdminRouter };
