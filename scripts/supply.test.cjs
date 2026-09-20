const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const express = require("express");
const { emptyState, command, snapshot, reconcile } = require("../server/supply/domain.cjs");
const { localParts, instant, schedule } = require("../server/supply/scheduling.cjs");
const { planNotifications, sendNotification } = require("../server/supply/notifications.cjs");
const { getConfig, issueSession, verifySession } = require("../server/supply/auth.cjs");
const { verifySession: verifyAdmin } = require("../server/telegram/adminAuth.cjs");
const { createSupplyRouter } = require("../server/supply/routes.cjs");
const now = new Date("2026-09-18T09:00:00Z"); // Friday, noon Kyiv.
function supplier(overrides = {}) { return { id: "s", name: "Тест", active: true, confirmed: true, orderTimes: [null, "17:00", "17:00", "17:00", "17:00", "17:00", null], deliveryDays: [1, 2, 3, 4, 5, 6], minLeadDays: 1, maxLeadDays: 1, exceptions: [], notifications: true, reminderMinutes: [180, 60, 20], ...overrides }; }
function fixture() {
  const state = emptyState(); state.suppliers = [supplier()];
  state.products = ["a", "b"].map((id, sortOrder) => ({ id, name: id, supplierId: "s", active: true, kind: "stock", days: [0, 1, 2, 3, 4, 5, 6], unit: "уп.", sortOrder }));
  return state;
}
function check(state, productId = "a", status = "low", time = now) { command(state, { type: "check", data: { productId, status, quantity: 2, date: localParts(time).date } }, time); }
test("Kyiv day boundaries and DST deadlines use local calendar dates", () => {
  assert.equal(localParts(new Date("2026-09-18T22:30Z")).date, "2026-09-19");
  assert.equal(instant("2026-03-28", "20:00"), "2026-03-28T18:00:00.000Z");
  assert.equal(instant("2026-03-29", "20:00"), "2026-03-29T17:00:00.000Z");
  assert.equal(instant("2026-03-29", "03:30"), null);
  assert.equal(instant("2026-10-25", "03:30"), "2026-10-25T00:30:00.000Z");
});
test("Friday orders can arrive Saturday; closed weekends offer Monday, not a false current window", () => {
  const friday = schedule(supplier(), now);
  assert.equal(friday.delivery, "2026-09-19"); assert.equal(friday.lastBeforeBreak, true);
  const saturday = schedule(supplier(), new Date("2026-09-19T10:00Z"));
  assert.equal(saturday.today, null); assert.equal(saturday.nextOrder.date, "2026-09-21"); assert.equal(saturday.delivery, "2026-09-22");
  assert.equal(schedule(supplier(), new Date("2026-09-18T14:00Z")).nextOrder.date, "2026-09-21");
});
test("Conservative lead time never promises Thursday from a Wednesday order requiring up to two days", () => {
  const result = schedule(supplier({ deliveryDays: [2, 4, 6], maxLeadDays: 2 }), new Date("2026-09-16T10:00Z"));
  assert.equal(result.earliestDelivery, "2026-09-17"); assert.equal(result.delivery, "2026-09-19"); assert.equal(result.lastSafeOrder.date, "2026-09-17");
});
test("Exceptions can close ordering, shorten deadlines or cancel deliveries; drafts have no promises", () => {
  const result = schedule(supplier({ exceptions: [{ date: "2026-09-18", deadline: "11:00", delivery: true }, { date: "2026-09-22", deadline: "17:00", delivery: false }] }), now);
  assert.equal(result.nextOrder.date, "2026-09-21"); assert.equal(result.delivery, "2026-09-23");
  assert.equal(schedule(supplier({ confirmed: false }), now).nextOrder, null);
});
test("Two checks share one supplier task; enough removes only that need", () => {
  const state = fixture(); check(state); check(state, "b", "critical");
  assert.equal(state.tasks.filter(t => t.status === "pending").length, 1); assert.equal(state.tasks[0].items.length, 2);
  check(state, "a", "enough"); assert.deepEqual(state.tasks[0].items.map(i => i.productId), ["b"]);
  check(state, "b", "enough"); assert.equal(state.tasks[0].status, "not_required");
});
test("An unresolved shortage survives history retention and a repeated read", () => {
  const state = fixture(); check(state);
  const id = state.tasks[0].id, future = new Date("2027-01-20T09:00Z");
  reconcile(state, future); reconcile(state, future);
  assert.equal(state.tasks.find(t => t.id === id).status, "pending");
  assert.equal(state.tasks.find(t => t.id === id).items[0].quantity, 2);
  assert.equal(state.history.length, 0);
  check(state, "a", "enough", future);
  assert.equal(state.tasks.find(t => t.id === id).status, "not_required");
});
test("Checklists never treat unknowns as enough or allow incomplete completion", () => {
  const state = fixture(); assert.equal(snapshot(state, now).checklists[0].remaining, 2);
  assert.throws(() => command(state, { type: "complete_check", data: { kind: "stock", date: "2026-09-18" } }, now));
  check(state, "a", "enough"); check(state, "b", "enough"); command(state, { type: "complete_check", data: { kind: "stock", date: "2026-09-18" } }, now);
  assert.ok(snapshot(state, now).checklists[0].completedAt);
  assert.equal(snapshot(state, new Date("2026-09-19T09:00Z")).checklists[0].remaining, 2);
});
test("Weekly items appear only on selected days, stock and display remain separate", () => {
  const state = fixture(); state.products[0].days = [1]; state.products[1].kind = "display";
  assert.equal(snapshot(state, now).checklists[0].products.length, 0); assert.equal(snapshot(state, now).checklists[1].products.length, 1);
});
test("Incoming goods prevent duplicate orders; receiving forces a fresh check even for weekly products", () => {
  const state = fixture(); check(state); const id = state.tasks[0].id;
  command(state, { type: "task", data: { id, action: "ordered", expectedDelivery: "2026-09-19" } }, now);
  check(state, "a", "critical", new Date("2026-09-19T09:00Z"));
  assert.equal(state.tasks.filter(t => t.status === "pending").length, 0);
  state.products[0].days = [1];
  command(state, { type: "task", data: { id, action: "received" } }, new Date("2026-09-19T10:00Z"));
  const product = snapshot(state, new Date("2026-09-19T10:00Z")).checklists[0].products.find(p => p.id === "a");
  assert.equal(product.result, null); assert.equal(state.tasks.filter(t => t.status === "pending").length, 0);
  check(state, "a", "low", new Date("2026-09-19T10:01Z")); assert.equal(state.tasks.filter(t => t.status === "pending").length, 1);
  assert.throws(() => command(state, { type: "task", data: { id, action: "received" } }, now), { status: 409 });
});
test("Skipping requires a reason and review date, then the unresolved need returns", () => {
  const state = fixture(); check(state); const id = state.tasks[0].id;
  assert.throws(() => command(state, { type: "task", data: { id, action: "skip", reconsiderOn: "2026-09-19" } }, now));
  command(state, { type: "task", data: { id, action: "skip", reason: "Резерв", reconsiderOn: "2026-09-19" } }, now);
  reconcile(state, now); assert.equal(state.tasks.filter(t => t.status === "pending").length, 0);
  reconcile(state, new Date("2026-09-19T09:00Z")); assert.equal(state.tasks.filter(t => t.status === "pending").length, 1);
});
test("Missed supplier cutoff never silently closes or discards demand", () => {
  const state = fixture(); check(state); const id = state.tasks[0].id;
  reconcile(state, new Date("2026-09-21T09:00Z")); assert.equal(state.tasks[0].id, id); assert.equal(state.tasks[0].status, "pending");
});
test("Invalid schedule, dates, quantities and external links fail before changing data", () => {
  const state = fixture();
  for (const data of [{ ...supplier(), url: "javascript:alert(1)" }, { ...supplier(), minLeadDays: 4, maxLeadDays: 2 }, { ...supplier(), exceptions: [{ date: "2026-02-30", deadline: null, delivery: false }] }]) assert.throws(() => command(structuredClone(state), { type: "supplier", data }, now));
  assert.throws(() => command(state, { type: "check", data: { productId: "a", status: "low", date: "2026-09-17" } }, now), { status: 409 });
  assert.throws(() => command(state, { type: "check", data: { productId: "a", status: "low", quantity: -3, date: "2026-09-18" } }, now));
});
test("Seeded schedules stay drafts; no fake confirmed deadlines or unsolicited notifications", () => {
  const state = emptyState(); command(state, { type: "seed" }, now);
  assert.ok(state.products.some(p => p.name === "Кава")); assert.ok(state.suppliers.every(s => !s.confirmed));
  assert.deepEqual(planNotifications(state, now), []);
  const draft = state.suppliers.find(s => s.name === "Panini Grill");
  assert.equal(draft.orderTimes[1], "");
  command(state, { type: "supplier", data: { ...draft, notes: "Час уточнюється" } }, now);
  assert.throws(() => command(state, { type: "supplier", data: { ...draft, confirmed: true } }, now), /час/);
});
test("Unperformed checks cause supplier warnings; downtime catches up only the latest threshold", () => {
  const state = fixture(); state.settings.enabled = true;
  const alerts = planNotifications(state, new Date("2026-09-18T13:45Z"));
  const supplierAlerts = alerts.filter(n => n.key.startsWith("supplier"));
  assert.equal(supplierAlerts.length, 1); assert.match(supplierAlerts[0].key, /:20$/); assert.match(supplierAlerts[0].text, /не перевірено/);
  assert.equal(planNotifications(state, new Date("2026-09-18T15:00Z")).filter(n => n.key.endsWith(":missed")).length, 1);
});
test("Confirmed orders stop supplier alerts when all items have been checked", () => {
  const state = fixture(); state.settings.enabled = true; check(state); check(state, "b", "enough");
  command(state, { type: "task", data: { id: state.tasks[0].id, action: "ordered", expectedDelivery: "2026-09-19" } }, now);
  assert.equal(planNotifications(state, new Date("2026-09-18T13:45Z")).filter(n => n.key.startsWith("supplier")).length, 0);
});
const config = getConfig({ TELEGRAM_SUPPLY_BOT_TOKEN: "test-token", TELEGRAM_SUPPLY_USER_IDS: "42", TELEGRAM_SUPPLY_CHAT_ID: "42", TELEGRAM_SUPPLY_APP_URL: "https://example.com/telegram/supply" });
function signed(fields = {}) {
  const p = new URLSearchParams({ auth_date: String(Math.floor(Date.now() / 1000)), user: JSON.stringify({ id: 42 }), ...fields }); p.sort();
  const secret = crypto.createHmac("sha256", "WebAppData").update(config.token).digest();
  p.set("hash", crypto.createHmac("sha256", secret).update([...p].map(([k, v]) => `${k}=${v}`).join("\n")).digest("hex")); return p.toString();
}
test("Supply access is explicit, scoped and revocable; a notification destination cannot grant access", () => {
  assert.equal(getConfig({ TELEGRAM_BOT_TOKEN: "x", TELEGRAM_CHAT_ID: "42" }).configured, false);
  assert.equal(getConfig({ TELEGRAM_SUPPLY_BOT_TOKEN: "x", TELEGRAM_SUPPLY_CHAT_ID: "42" }).configured, false);
  const { token } = issueSession(signed(), config); assert.equal(verifySession(token, config).id, "42");
  assert.throws(() => verifyAdmin(token, { token: config.token, ids: config.ids }), { status: 401 });
  assert.throws(() => verifySession(token, { ...config, ids: new Set(["43"]) }), { status: 403 });
  assert.throws(() => issueSession(signed({ user: JSON.stringify({ id: 43 }) }), config), { status: 403 });
  assert.throws(() => issueSession(signed({ auth_date: "1" }), config), { status: 401 });
});
test("Notifications target only the configured shared chat and open the matching Mini App screen", async () => {
  await sendNotification(config, { text: "Тест", screen: "checks" }, async (url, options) => {
    const body = JSON.parse(options.body); assert.equal(body.chat_id, "42"); assert.match(body.reply_markup.inline_keyboard[0][0].web_app.url, /screen=checks/);
    return { ok: true, json: async () => ({ ok: true, result: { message_id: 1 } }) };
  });
  await assert.rejects(sendNotification(config, { text: "Тест", screen: "today" }, async () => { throw new Error("secret url"); }), e => !e.message.includes("secret"));
});
test("HTTP API rejects outsiders and stale shared-device writes without losing accepted changes", async () => {
  let state = fixture();
  const repository = { read: async () => structuredClone(state), command: async (action, revision) => {
    if (state.revision !== revision) throw Object.assign(new Error("Conflict"), { status: 409 });
    const next = structuredClone(state); command(next, action); state = next; return structuredClone(state);
  } };
  const app = express(); app.use(express.json()); app.use("/api/telegram/supply", createSupplyRouter({ repository, config: () => config }));
  const server = app.listen(0, "127.0.0.1"); await new Promise(resolve => server.once("listening", resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/telegram/supply`;
  try {
    assert.equal((await fetch(`${base}/state`)).status, 401);
    const session = await (await fetch(`${base}/session`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ initData: signed() }) })).json();
    const options = { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.token}` }, body: JSON.stringify({ revision: 0, action: { type: "settings", data: { enabled: false, morning: "10:00", evening: "16:00" } } }) };
    const results = await Promise.all([fetch(`${base}/command`, options), fetch(`${base}/command`, options)]);
    assert.deepEqual(results.map(r => r.status).sort(), [200, 409]); assert.equal(state.revision, 1);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
