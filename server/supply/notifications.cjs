const { snapshot } = require("./domain.cjs");
const { localParts } = require("./scheduling.cjs");
function planNotifications(state, now = new Date()) {
  if (!state.settings.enabled) return [];
  const data = snapshot(state, now), local = localParts(now), notifications = [];
  const pending = data.tasks.filter(t => t.status === "pending");
  const late = data.tasks.filter(t => t.status === "ordered" && t.expectedDelivery < local.date);
  const remaining = data.checklists.reduce((sum, c) => sum + c.remaining, 0);
  const incomplete = data.checklists.some(c => c.products.length && !c.completedAt);
  const slot = local.time >= state.settings.evening ? "evening" : local.time >= state.settings.morning ? "morning" : null;
  if (slot && (incomplete || pending.length || late.length)) {
    notifications.push({ key: `digest:${local.date}:${slot}`, screen: "today", text: `Evergreen · ${slot === "morning" ? "час перевірити запаси" : "незакриті справи"}\n\n${remaining ? `Не перевірено позицій: ${remaining}.` : incomplete ? "Підтвердіть завершення перевірки." : "Склад і вітрину перевірено."}\nЗакупок до оформлення: ${pending.length}.${late.length ? `\nПоставок із простроченою датою: ${late.length}.` : ""}` });
  }
  for (const supplier of data.suppliers.filter(s => s.active && s.confirmed && s.notifications)) {
    const tasks = pending.filter(t => t.supplierId === supplier.id);
    const unchecked = data.checklists.flatMap(c => c.products).filter(p => p.supplierId === supplier.id && !p.result);
    if (!tasks.length && !unchecked.length) continue;
    const window = supplier.schedule.today;
    if (!window) continue;
    const minutes = (new Date(window.at) - now) / 60000;
    // Catch up only the most urgent applicable reminder after downtime.
    const threshold = [...supplier.reminderMinutes].sort((a, b) => a - b).find(n => minutes <= n);
    if (threshold === undefined) continue;
    const stage = minutes <= 0 ? "missed" : String(threshold);
    const items = tasks.flatMap(t => t.items);
    const summary = items.slice(0, 8).map(i => `• ${i.name}${i.quantity ? ` — ${i.quantity} ${i.unit}` : ""}`).join("\n");
    const next = supplier.schedule.nextOrder;
    const heading = minutes <= 0 ? `Сьогоднішній дедлайн минув.${next ? ` Наступне вікно: ${next.date} до ${next.time}.` : " Уточніть наступне вікно."}` : `Прийом замовлень до ${window.time}. Залишилося ${Math.max(1, Math.ceil(minutes))} хв.`;
    notifications.push({ key: `supplier:${supplier.id}:${local.date}:${stage}`, screen: tasks.length ? "purchases" : "checks", text: `${supplier.name} · закупівля\n${heading}${supplier.schedule.lastBeforeBreak && minutes > 0 ? "\nОстанній день замовлення перед перервою." : ""}${unchecked.length ? `\nЩе не перевірено позицій: ${unchecked.length}.` : ""}${summary ? `\n\n${summary}` : ""}${items.length > 8 ? `\nТа ще ${items.length - 8} позицій.` : ""}` });
  }
  return notifications;
}
async function telegramRequest(config, method, body, fetchImpl = fetch) {
  let response, data;
  try {
    response = await fetchImpl(`https://api.telegram.org/bot${config.token}/${method}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
    data = await response.json();
  } catch { throw new Error("Telegram тимчасово недоступний. Спробуємо повторити."); }
  if (!response.ok || !data.ok) {
    const e = new Error(data.error_code === 403 ? "Бот не може написати робочому акаунту. Відкрийте чат і натисніть Start." : "Telegram не прийняв повідомлення.");
    e.retryAfter = Math.min(86400, Math.max(60, Number(data.parameters?.retry_after) || 60));
    throw e;
  }
  return data.result;
}
function sendNotification(config, notification, fetchImpl) {
  if (!config.notificationsConfigured) throw new Error("Сповіщення не налаштовані.");
  const url = new URL(config.url); url.searchParams.set("screen", notification.screen);
  return telegramRequest(config, "sendMessage", { chat_id: config.chatId, text: notification.text.slice(0, 3900),
    reply_markup: { inline_keyboard: [[{ text: "Відкрити закупівлі", web_app: { url: url.href } }]] } }, fetchImpl);
}
module.exports = { planNotifications, telegramRequest, sendNotification };
