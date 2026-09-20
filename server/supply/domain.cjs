const crypto = require("node:crypto");
const { localParts, addDays, weekday, validDate, validTime, schedule } = require("./scheduling.cjs");
const error = (message, status = 400) => Object.assign(new Error(message), { status });
const id = () => crypto.randomUUID();
const text = (value, max = 200) => typeof value === "string" ? value.trim().slice(0, max) : "";
function requireText(value, label, max = 200) { const result = text(value, max); if (!result) throw error(`Вкажіть ${label}.`); return result; }
function days(value) { if (!Array.isArray(value) || !value.length || value.some(n => !Number.isInteger(n) || n < 0 || n > 6)) throw error("Оберіть дні тижня."); return [...new Set(value)].sort(); }
function number(value, min, max) { const n = Number(value); if (!Number.isInteger(n) || n < min || n > max) throw error(`Потрібне ціле число від ${min} до ${max}.`); return n; }
function safeUrl(value) { if (!value) return ""; try { const u = new URL(value); if (u.protocol === "https:" && !u.username && !u.password) return u.href.slice(0, 500); } catch {} throw error("Посилання має починатися з https://."); }
function emptyState() { return { revision: 0, settings: { enabled: false, morning: "11:00", evening: "17:00" }, suppliers: [], products: [], checks: [], tasks: [], resolutions: {}, history: [] }; }
function seed(state) {
  if (state.suppliers.length || state.products.length) throw error("Базовий список можна додати лише в порожній простір.", 409);
  const everyday = Array(7).fill("20:00");
  const draft = (name, orderTimes, deliveryDays, minLeadDays, maxLeadDays) => ({ id: id(), name, active: true, confirmed: false, orderTimes, deliveryDays, minLeadDays, maxLeadDays, contact: "", url: "", notes: "Чернетка з початкового ТЗ. Уточніть графік і терміни доставки у постачальника.", exceptions: [], notifications: true, reminderMinutes: [180, 60, 20] });
  state.suppliers = [draft("Milk Diller", everyday, [0, 1, 2, 3, 4, 5, 6], 1, 1), draft("Maya Cake", Array(7).fill("21:00"), [0, 1, 2, 3, 4, 5, 6], 1, 1), draft("Panini Grill", [null, "", "", "", "", "", null], [1, 2, 3, 4, 5, 6], 1, 1), draft("OMOM", [null, "", "", "", "", "", null], [2, 4, 6], 1, 2)];
  const stock = ["Молоко звичайне", "Молоко рослинне", "Молоко безлактозне", "Кава", "Сиропи", "Стакани маленькі", "Стакани великі", "PET-стакани", "Кришки", "Пакети", "Рукавички", "Напої для лимонадів", "Фруктові пюре"];
  state.products = [...stock.map(name => ({ name, kind: "stock", supplierId: state.suppliers[0].id })), { name: "Десерти", kind: "display", supplierId: state.suppliers[1].id }, { name: "Паніні", kind: "display", supplierId: state.suppliers[2].id }, { name: "Холодні напої", kind: "display", supplierId: state.suppliers[3].id }].map((p, index) => ({ ...p, id: id(), active: true, days: [0, 1, 2, 3, 4, 5, 6], unit: "уп.", threshold: "", sortOrder: index }));
}
function validateSupplier(data) {
  if (!Array.isArray(data.orderTimes) || data.orderTimes.length !== 7 || data.orderTimes.some(t => t !== null && !validTime(t) && !(t === "" && data.confirmed !== true))) throw error("Перевірте час прийому замовлень для кожного дня.");
  if (data.confirmed && !data.orderTimes.some(Boolean)) throw error("Вкажіть хоча б один день прийому замовлень.");
  const minLeadDays = number(data.minLeadDays, 0, 30), maxLeadDays = number(data.maxLeadDays, minLeadDays, 30);
  const exceptions = Array.isArray(data.exceptions) ? data.exceptions : [];
  if (exceptions.length > 90 || new Set(exceptions.map(e => e.date)).size !== exceptions.length) throw error("Забагато винятків або дата повторюється.");
  const normalizedExceptions = exceptions.map(e => {
    if (!validDate(e.date) || (e.deadline !== null && !validTime(e.deadline)) || typeof e.delivery !== "boolean") throw error("Перевірте дату, дедлайн і доставку у винятках.");
    return { date: e.date, deadline: e.deadline, delivery: e.delivery };
  });
  if (!Array.isArray(data.reminderMinutes) || data.reminderMinutes.length > 4 || !data.reminderMinutes.length) throw error("Задайте від 1 до 4 нагадувань.");
  return { name: requireText(data.name, "назву постачальника", 80), active: data.active !== false, confirmed: data.confirmed === true,
    orderTimes: data.orderTimes, deliveryDays: days(data.deliveryDays), minLeadDays, maxLeadDays,
    contact: text(data.contact), url: safeUrl(data.url), notes: text(data.notes, 500), exceptions: normalizedExceptions,
    notifications: data.notifications !== false, reminderMinutes: [...new Set(data.reminderMinutes.map(n => number(n, 5, 1440)))].sort((a, b) => b - a) };
}
function latestResult(state, productId) {
  return state.checks.flatMap(check => check.results[productId] ? [check.results[productId]] : []).sort((a, b) => b.seq - a.seq)[0] || null;
}
function dueProducts(state, kind, date) {
  return state.products.filter(p => p.active && state.suppliers.some(s => s.id === p.supplierId && s.active) && (!kind || p.kind === kind) &&
    (p.days.includes(weekday(date)) || (state.resolutions[p.id]?.type === "received" && (!latestResult(state, p.id) || latestResult(state, p.id).seq <= state.resolutions[p.id].seq)))).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}
function observedToday(state, product, date) {
  const result = state.checks.find(c => c.date === date && c.kind === product.kind)?.results[product.id];
  const resolution = state.resolutions[product.id];
  return result && !(resolution?.type === "received" && result.seq <= resolution.seq) ? result : null;
}
function reconcile(state, now = new Date()) {
  const today = localParts(now).date;
  const needs = state.products.filter(p => {
    if (!p.active || !state.suppliers.some(s => s.id === p.supplierId && s.active)) return false;
    const result = latestResult(state, p.id), resolution = state.resolutions[p.id];
    if (!result || result.status === "enough") return false;
    if (state.tasks.some(t => t.status === "ordered" && t.items.some(i => i.productId === p.id))) return false;
    if (resolution && result.seq <= resolution.seq && (resolution.type === "received" || resolution.until > today)) return false;
    return true;
  });
  for (const supplier of state.suppliers.filter(s => s.active)) {
    const products = needs.filter(p => p.supplierId === supplier.id);
    let task = state.tasks.find(t => t.supplierId === supplier.id && t.status === "pending");
    if (!products.length) {
      if (task) { task.status = "not_required"; task.closedAt = now.toISOString(); task.reason = "Потребу знято після перевірки."; }
      continue;
    }
    if (!task) {
      task = { id: id(), supplierId: supplier.id, supplierName: supplier.name, status: "pending", createdAt: now.toISOString(), orderBy: schedule(supplier, now).nextOrder?.at || null, items: [] };
      state.tasks.push(task);
    }
    task.supplierName = supplier.name;
    task.items = products.map(p => { const r = latestResult(state, p.id); return { productId: p.id, name: p.name, unit: p.unit, quantity: r.quantity, comment: r.comment, status: r.status }; });
  }
  const cutoff = addDays(today, -90);
  // Current observations are working state, not disposable audit history.
  // Keep the latest result per active product even when a shortage is >90 days old.
  const latest = new Map(state.products.filter(p => p.active).map(p => [p.id, latestResult(state, p.id)?.seq]));
  state.checks = state.checks.map(c => c.date >= cutoff ? c : { ...c, completedAt: null,
    results: Object.fromEntries(Object.entries(c.results).filter(([productId, result]) => latest.get(productId) === result.seq))
  }).filter(c => c.date >= cutoff || Object.keys(c.results).length);
  state.tasks = state.tasks.filter(t => ["pending", "ordered"].includes(t.status) || (t.closedAt || t.createdAt).slice(0, 10) >= cutoff);
  state.history = state.history.filter(h => h.at.slice(0, 10) >= cutoff).slice(-3000);
}
function command(state, action, now = new Date()) {
  if (!action || typeof action !== "object") throw error("Невідома дія.");
  const data = action.data || {}, today = localParts(now).date, seq = state.revision + 1, at = now.toISOString();
  let label;
  if (action.type === "seed") { seed(state); label = "Додано початкові чернетки постачальників і товарів"; }
  else if (action.type === "supplier") {
    const supplier = validateSupplier(data), existing = data.id && state.suppliers.find(s => s.id === data.id);
    if (data.id && !existing) throw error("Постачальника не знайдено.", 404);
    if (!supplier.active && existing && state.tasks.some(t => t.supplierId === existing.id && ["pending", "ordered"].includes(t.status))) throw error("Спочатку закрийте закупки й очікувані поставки цього постачальника.", 409);
    if (!existing && state.suppliers.length >= 100) throw error("Досягнуто ліміт 100 постачальників.");
    const result = { ...supplier, id: existing?.id || id() };
    if (existing) Object.assign(existing, result); else state.suppliers.push(result);
    label = `Оновлено постачальника: ${result.name}`;
  } else if (action.type === "product") {
    if (!state.suppliers.some(s => s.id === data.supplierId)) throw error("Оберіть постачальника.");
    if (!["stock", "display"].includes(data.kind)) throw error("Оберіть склад або вітрину.");
    const existing = data.id && state.products.find(p => p.id === data.id);
    if (data.id && !existing) throw error("Товар не знайдено.", 404);
    if (!existing && state.products.length >= 500) throw error("Досягнуто ліміт 500 позицій.");
    if (existing && (data.active === false || data.supplierId !== existing.supplierId) && state.tasks.some(t => t.status === "ordered" && t.items.some(i => i.productId === existing.id))) throw error("Спочатку підтвердіть отримання замовленого товару.", 409);
    const product = { id: existing?.id || id(), name: requireText(data.name, "назву товару", 120), supplierId: data.supplierId, kind: data.kind,
      days: days(data.days), active: data.active !== false, unit: requireText(data.unit, "одиницю замовлення", 20), threshold: text(data.threshold, 200), sortOrder: number(data.sortOrder || 0, 0, 9999) };
    if (existing) Object.assign(existing, product); else state.products.push(product);
    label = `Оновлено позицію: ${product.name}`;
  } else if (action.type === "check") {
    const product = state.products.find(p => p.id === data.productId && p.active);
    if (!product || !state.suppliers.some(s => s.id === product.supplierId && s.active)) throw error("Позиція більше не активна.", 409);
    if (!["enough", "low", "critical"].includes(data.status)) throw error("Оберіть стан запасу.");
    if (data.date !== today) throw error("День змінився. Оновіть список перед перевіркою.", 409);
    const quantity = data.quantity === "" || data.quantity == null ? null : Number(data.quantity);
    if (quantity !== null && (!Number.isFinite(quantity) || quantity <= 0 || quantity > 100000)) throw error("Кількість має бути більшою за нуль.");
    let check = state.checks.find(c => c.date === today && c.kind === product.kind);
    if (!check) { check = { date: today, kind: product.kind, results: {}, completedAt: null }; state.checks.push(check); }
    check.results[product.id] = { seq, status: data.status, quantity, comment: text(data.comment, 300), at };
    check.completedAt = null;
    label = `${product.name}: ${{ enough: "вистачає", low: "замовити", critical: "критично" }[data.status]}`;
  } else if (action.type === "complete_check") {
    if (!["stock", "display"].includes(data.kind) || data.date !== today) throw error("Оновіть чеклист.", 409);
    const products = dueProducts(state, data.kind, today);
    if (!products.length || products.some(p => !observedToday(state, p, today))) throw error("Спочатку перевірте всі сьогоднішні позиції.");
    const check = state.checks.find(c => c.date === today && c.kind === data.kind);
    if (check.completedAt) throw error("Цю перевірку вже завершено.", 409);
    check.completedAt = at; label = `${data.kind === "stock" ? "Склад" : "Вітрину"} перевірено`;
  } else if (action.type === "task") {
    const task = state.tasks.find(t => t.id === data.id);
    if (!task) throw error("Закупку не знайдено.", 404);
    if (data.action === "ordered" && task.status === "pending") {
      if (!validDate(data.expectedDelivery) || data.expectedDelivery < today || data.expectedDelivery > addDays(today, 90)) throw error("Вкажіть очікувану дату отримання.");
      task.status = "ordered"; task.orderedAt = at; task.expectedDelivery = data.expectedDelivery; task.comment = text(data.comment, 300);
      label = `${task.supplierName}: замовлення оформлено`;
    } else if (data.action === "skip" && task.status === "pending") {
      const reason = requireText(data.reason, "причину", 300);
      if (!validDate(data.reconsiderOn) || data.reconsiderOn <= today || data.reconsiderOn > addDays(today, 30)) throw error("Оберіть дату повторної перевірки, починаючи із завтра.");
      task.status = "not_required"; task.reason = reason; task.closedAt = at; task.reconsiderOn = data.reconsiderOn;
      for (const item of task.items) state.resolutions[item.productId] = { type: "skip", seq, until: data.reconsiderOn };
      label = `${task.supplierName}: відкладено до ${data.reconsiderOn} — ${reason}`;
    } else if (data.action === "received" && task.status === "ordered") {
      task.status = "received"; task.closedAt = at;
      for (const item of task.items) state.resolutions[item.productId] = { type: "received", seq };
      label = `${task.supplierName}: поставку отримано, перевірте поповнені запаси`;
    } else if (data.action === "reschedule" && task.status === "ordered") {
      if (!validDate(data.expectedDelivery) || data.expectedDelivery < today || data.expectedDelivery > addDays(today, 90)) throw error("Вкажіть нову дату поставки.");
      task.expectedDelivery = data.expectedDelivery; task.comment = requireText(data.comment, "пояснення затримки", 300);
      label = `${task.supplierName}: поставку перенесено на ${data.expectedDelivery}`;
    } else throw error("Статус уже змінився. Оновіть список.", 409);
  } else if (action.type === "settings") {
    if (!validTime(data.morning) || !validTime(data.evening) || data.morning >= data.evening) throw error("Вечірня перевірка має бути пізніше ранкової.");
    state.settings = { enabled: data.enabled === true, morning: data.morning, evening: data.evening };
    label = "Оновлено налаштування нагадувань";
  } else throw error("Невідома дія.");
  reconcile(state, now);
  state.history.push({ id: id(), at, label });
  state.revision = seq;
  return state;
}
function snapshot(original, now = new Date()) {
  const state = structuredClone(original);
  reconcile(state, now);
  const date = localParts(now).date;
  const checklists = ["stock", "display"].map(kind => {
    const products = dueProducts(state, kind, date).map(p => ({ ...p, result: observedToday(state, p, date), incoming: state.tasks.find(t => t.status === "ordered" && t.items.some(i => i.productId === p.id))?.expectedDelivery || null }));
    const remaining = products.filter(p => !p.result).length;
    return { kind, products, remaining, completedAt: !remaining ? state.checks.find(c => c.date === date && c.kind === kind)?.completedAt : null };
  });
  return { ...state, date, now: now.toISOString(), checklists, suppliers: state.suppliers.map(s => ({ ...s, schedule: schedule(s, now) })), history: state.history.slice(-100).reverse() };
}
module.exports = { emptyState, command, snapshot, reconcile, dueProducts, observedToday, latestResult, validateSupplier, error };
