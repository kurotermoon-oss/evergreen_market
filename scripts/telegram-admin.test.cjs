const { test } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const express = require("express");
const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../server/runtimeSecurity.cjs");
const { getConfig, validateInitData, issueSession, verifySession } = require("../server/telegram/adminAuth.cjs");
const { notifyAdminOrder, appUrl } = require("../server/telegram/adminNotify.cjs");
const { createTelegramAdminRouter } = require("../server/routes/telegramAdmin.routes.cjs");
const { createAdminOrderActions } = require("../server/services/adminOrderActions.cjs");
const { applySecurityHeaders } = require("../server/httpSecurity.cjs");
const { verifyAdminToken } = require("../server/middleware/adminAuth.cjs");
const sharedBotEnv = { TELEGRAM_BOT_TOKEN: "test-bot-token-only", TELEGRAM_ADMIN_USER_IDS: "42", TELEGRAM_ADMIN_APP_URL: "https://example.com/telegram/admin" };
const config = getConfig(sharedBotEnv);
function sign(fields = {}, token = config.token) {
  const params = new URLSearchParams({ auth_date: String(Math.floor(Date.now() / 1000)), query_id: "test-query", user: JSON.stringify({ id: 42, first_name: "Тест" }), ...fields });
  const secret = crypto.createHmac("sha256", "WebAppData").update(token).digest();
  params.sort();
  const hash = crypto.createHmac("sha256", secret).update([...params].map(([k, v]) => `${k}=${v}`).join("\n")).digest("hex");
  params.set("hash", hash); return params.toString();
}
test("Shared bot configuration requires explicit admin IDs and ignores the notification chat", () => {
  for (const override of [undefined, "", "   "]) {
    const shared = getConfig({ ...sharedBotEnv, TELEGRAM_BOT_TOKEN: "  test-bot-token-only  ", TELEGRAM_ADMIN_BOT_TOKEN: override });
    assert.equal(shared.token, "test-bot-token-only");
    assert.equal(verifySession(issueSession(sign(), shared).token, shared).id, "42");
    assert.throws(() => issueSession(sign({ user: JSON.stringify({ id: 99 }) }), shared), { status: 403 });
  }
  const noAdmins = getConfig({ ...sharedBotEnv, TELEGRAM_ADMIN_USER_IDS: "", TELEGRAM_CHAT_ID: "42" });
  assert.throws(() => issueSession(sign(), noAdmins), { status: 503 });
  assert.throws(() => issueSession(sign(), getConfig({ TELEGRAM_ADMIN_USER_IDS: "42" })), { status: 503 });
});

test("Dedicated admin token overrides the shared token for authentication and notifications", async () => {
  const dedicated = getConfig({ ...sharedBotEnv, TELEGRAM_ADMIN_BOT_TOKEN: "  dedicated-test-token  " });
  assert.throws(() => issueSession(sign(), dedicated), { status: 401 });
  assert.equal(verifySession(issueSession(sign({}, "dedicated-test-token"), dedicated).token, dedicated).id, "42");
  const result = await notifyAdminOrder({ id: "test", orderNumber: 1 }, { config: dedicated, fetchImpl: async (url, options) => {
    assert.equal(url, "https://api.telegram.org/botdedicated-test-token/sendMessage");
    assert.equal(JSON.parse(options.body).chat_id, "42");
    return { ok: true, json: async () => ({ ok: true }) };
  } });
  assert.equal(result.sent, 1);
});

test("Telegram verifies signature, time, duplicate fields and user identity", () => {
  assert.equal(validateInitData(sign(), config.token).id, 42);
  for (const data of [sign().replace("test-query", "changed"), sign({}, "customer-bot"), sign({ auth_date: "1" }), sign({ auth_date: String(Math.floor(Date.now() / 1000) + 60) }), sign({ user: "{}" }), sign({ user: JSON.stringify({ id: 42, is_bot: true }) }), sign() + "&auth_date=1"]) {
    assert.throws(() => validateInitData(data, config.token), { status: 401 });
  }
});
test("Only allowlisted IDs get scoped sessions, revocation and expiry are enforced", () => {
  const { token } = issueSession(sign(), config);
  assert.equal(verifySession(token, config).id, "42");
  assert.equal(verifyAdminToken(token), null);
  assert.throws(() => issueSession(sign({ user: JSON.stringify({ id: 99 }) }), config), { status: 403 });
  assert.throws(() => issueSession(sign(), { ...config, token: "" }), { status: 503 });
  assert.throws(() => verifySession(token, { ...config, ids: new Set(["99"]) }), { status: 403 });
  assert.throws(() => verifySession(jwt.sign({ role: "admin" }, getJwtSecret()), config), { status: 401 });
  const expired = jwt.sign({ role: "telegram_admin" }, getJwtSecret(), { subject: "42", audience: "evergreen-telegram-admin", issuer: "evergreen", expiresIn: -1 });
  assert.throws(() => verifySession(expired, config), { status: 401 });
});
function fixture() {
  let db = { orders: [{ id: "order-1", orderNumber: 1, customerName: "Тест", customerPhone: "+380000000000", clientIp: "private", status: "new", total: 120, createdAt: new Date().toISOString(), items: [{ productId: "string-product-id", name: "Старе ім’я", price: 60, quantity: 2, total: 120 }], statusHistory: [] }],
    products: [{ id: "string-product-id", name: "Нова назва", price: 80, active: false, stockStatus: "in_stock", stockQuantity: 1 }] };
  let notifications = 0;
  const perform = createAdminOrderActions({ usePostgres: false, readDatabase: () => structuredClone(db), writeDatabase: data => { db = structuredClone(data); }, notifyLocal: async () => { notifications++; throw new Error("offline"); } });
  return { db: () => db, perform, notifications: () => notifications };
}
test("Status changes persist before notification failures; stale and duplicate actions cannot repeat effects", async () => {
  const f = fixture();
  await f.perform("order-1", "confirm", { expectedStatus: "new", strict: true });
  await assert.rejects(f.perform("order-1", "confirm", { expectedStatus: "new", strict: true }), { status: 409 });
  await assert.rejects(f.perform("order-1", "complete", { expectedStatus: "confirmed", strict: true }), { status: 409 });
  await f.perform("order-1", "start_preparing", { expectedStatus: "confirmed", strict: true });
  await assert.rejects(f.perform("order-1", "confirm", {}), { status: 409 });
  const result = await f.perform("order-1", "mark_ready", { expectedStatus: "preparing", strict: true, actor: "42" });
  assert.equal(result.customerTelegramResult.ok, false);
  assert.equal(f.db().orders[0].status, "ready");
  assert.equal(f.notifications(), 1);
  await assert.rejects(f.perform("order-1", "mark_ready", { expectedStatus: "preparing", strict: true }), { status: 409 });
  assert.equal(f.notifications(), 1);
  assert.match(f.db().orders[0].statusHistory.at(-1).label, /Telegram ID 42/);
});
test("Local notification metadata merges without reverting a concurrent order action", async () => {
  let db = { products: [], orders: [{ id: "a", status: "preparing", items: [], statusHistory: [] }] };
  const perform = createAdminOrderActions({ usePostgres: false, readDatabase: () => structuredClone(db), writeDatabase: data => { db = structuredClone(data); },
    notifyLocal: async (_, order) => {
      db.orders[0].status = "completed"; db.orders[0].isFinal = true;
      order.readyTelegramNotification = { ok: true }; order.readyTelegramNotifiedAt = new Date().toISOString();
      order.statusHistory.push({ type: "telegram_notification", label: "Повідомлення надіслано" });
      return { ok: true };
    } });
  await perform("a", "mark_ready", { expectedStatus: "preparing", strict: true });
  assert.equal(db.orders[0].status, "completed"); assert.equal(db.orders[0].readyTelegramNotification.ok, true);
  assert.equal(db.orders[0].statusHistory.filter(e => e.type === "telegram_notification").length, 1);
});
test("Cancellation restores string-ID stock exactly once without changing order snapshots", async () => {
  const f = fixture();
  await f.perform("order-1", "cancel", { expectedStatus: "new", strict: true, reason: "Тест" });
  assert.equal(f.db().products[0].stockQuantity, 3);
  assert.equal(f.db().orders[0].items[0].price, 60);
  await assert.rejects(f.perform("order-1", "cancel", {}), { status: 409 });
  assert.equal(f.db().products[0].stockQuantity, 3);
});
test("Customer history hides staff Telegram IDs and procurement prices", () => {
  const { sanitizeOrderForCustomer } = require("../server/utils/sanitize.cjs");
  const order = { statusHistory: [{ label: "Замовлення підтверджено · Telegram ID 42" }], items: [{ price: 60, costPrice: 40, profit: 20 }] };
  const result = sanitizeOrderForCustomer(order);
  assert.equal(result.statusHistory[0].label, "Замовлення підтверджено");
  assert.equal(result.items[0].costPrice, undefined);
  assert.match(order.statusHistory[0].label, /42/);
});
test("PostgreSQL repository serializes two channels before checking state and restores stock once", async () => {
  const fs = require("node:fs");
  const vm = require("node:vm");
  const path = require("node:path");
  const file = path.join(__dirname, "../server/repositories/ordersRepository.cjs");
  let current = { id: "order-1", status: "new", isFinal: false, items: [{ productId: "p", quantity: 2 }], statusHistory: [] };
  let stockRestored = 0;
  let previousLock = Promise.resolve();
  const database = {
    async $transaction(callback) {
      let release;
      let acquired = false;
      const tx = {
        async $queryRaw(strings, id) {
          assert.match(strings.join("?"), /FROM orders WHERE id = \? FOR UPDATE/);
          assert.equal(id, "order-1");
          const wait = previousLock;
          previousLock = new Promise(resolve => { release = resolve; });
          await wait; acquired = true;
          return [{ id }];
        },
        order: {
          async findUnique() { assert.equal(acquired, true); return structuredClone(current); },
          async update({ data }) { const { statusHistory, ...rest } = data; current = { ...current, ...rest, statusHistory: [...current.statusHistory, statusHistory.create] }; return structuredClone(current); },
        },
        product: { async updateMany({ data }) { stockRestored += data.stockQuantity?.increment || 0; return { count: 1 }; } },
      };
      try { return await callback(tx); } finally { release?.(); }
    },
  };
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(file, "utf8"), { module, exports: module.exports, require: name => name === "../database/prisma.cjs" ? database : name === "crypto" ? crypto : require(path.resolve(path.dirname(file), name)) }, { filename: file });
  const outcomes = await Promise.allSettled([
    module.exports.updateOrderAction("order-1", "cancel", { reason: "Test", expectedStatus: "new", strict: true }),
    module.exports.updateOrderAction("order-1", "cancel", { reason: "Test" }),
  ]);
  assert.equal(outcomes.filter(r => r.status === "fulfilled").length, 1);
  assert.equal(outcomes.find(r => r.status === "rejected").reason.status, 409);
  assert.equal(stockRestored, 2); assert.equal(current.statusHistory.length, 1);
});
test("HTTP routes reject cookies/anonymous requests; list, detail and conflict responses use the shared workflow", async t => {
  const f = fixture();
  const app = express(); app.use(express.json());
  app.use("/api/telegram/admin", createTelegramAdminRouter({ config: () => config, listOrders: async () => f.db().orders, listProducts: async () => f.db().products, performAction: f.perform }));
  const server = app.listen(0, "127.0.0.1"); await new Promise(resolve => server.once("listening", resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const base = `http://127.0.0.1:${server.address().port}/api/telegram/admin`;
  assert.equal((await fetch(`${base}/orders`, { headers: { Cookie: "admin_token=ignored" } })).status, 401);
  assert.equal((await fetch(`${base}/session`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ initData: sign({}, "wrong-bot") }) })).status, 401);
  const session = await (await fetch(`${base}/session`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ initData: sign() }) })).json();
  const headers = { Authorization: `Bearer ${session.token}`, "Content-Type": "application/json" };
  const response = await fetch(`${base}/orders?q=Тест`, { headers });
  assert.equal(response.headers.get("cache-control"), "no-store");
  const list = await response.json(); assert.equal(list.total, 1); assert.equal(list.orders[0].clientIp, undefined);
  assert.equal((await (await fetch(`${base}/orders?scope=history`, { headers })).json()).total, 0);
  const detail = await (await fetch(`${base}/orders/order-1`, { headers })).json();
  assert.equal(detail.order.items[0].name, "Старе ім’я"); assert.equal(detail.order.items[0].product.price, 80); assert.equal(detail.order.items[0].product.active, false);
  assert.equal((await fetch(`${base}/orders/missing`, { headers })).status, 404);
  const patch = payload => fetch(`${base}/orders/order-1/action`, { method: "PATCH", headers, body: JSON.stringify(payload) });
  assert.equal((await patch({ action: "cancel", expectedStatus: "new" })).status, 400);
  assert.equal((await patch({ action: "confirm" })).status, 400);
  assert.equal((await patch({ action: "confirm", expectedStatus: "new" })).status, 200);
  assert.equal((await patch({ action: "confirm", expectedStatus: "new" })).status, 409);
});
test("Shared-bot admin notifications reach only allowed IDs, link to the exact order and tolerate blocked Telegram", async () => {
  let body;
  const result = await notifyAdminOrder({ id: "order/a", orderNumber: 7, total: 120, customerName: "<b>Test</b>" }, { config, fetchImpl: async (url, options) => { assert.match(url, /test-bot-token-only/); body = JSON.parse(options.body); return { ok: true, json: async () => ({ ok: true }) }; } });
  assert.equal(result.sent, 1); assert.equal(body.chat_id, "42"); assert.equal(body.parse_mode, undefined);
  assert.equal(new URL(body.reply_markup.inline_keyboard[0][0].web_app.url).searchParams.get("order"), "order/a");
  assert.equal((await notifyAdminOrder({ id: "x" }, { config, fetchImpl: async () => { throw new Error("network"); } })).failed, 1);
  assert.equal(appUrl("javascript:alert(1)", "x"), ""); assert.equal(appUrl("https://user:pass@example.com/telegram/admin", "x"), "");
});
test("Only the Mini App page allows the Telegram SDK and Telegram framing", () => {
  for (const path of ["/", "/admin", "/telegram/admin", "/telegram/admin/"]) {
    const headers = {};
    applySecurityHeaders({ path }, { setHeader: (k, v) => { headers[k] = v; } }, () => {});
    if (path.startsWith("/telegram/admin")) { assert.equal(headers["X-Frame-Options"], undefined); assert.match(headers["Content-Security-Policy"], /frame-ancestors https:\/\/web.telegram.org/); assert.equal(headers["X-Robots-Tag"], "noindex, nofollow"); }
    else { assert.equal(headers["X-Frame-Options"], "DENY"); assert.doesNotMatch(headers["Content-Security-Policy"], /telegram/); }
  }
});
