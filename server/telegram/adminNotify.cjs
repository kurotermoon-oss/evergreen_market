const { getConfig } = require("./adminAuth.cjs");

function appUrl(base, orderId) {
  try {
    const url = new URL(base);
    if (url.protocol !== "https:" || url.username || url.password || url.pathname.replace(/\/$/, "") !== "/telegram/admin") return "";
    url.search = "";
    url.hash = "";
    if (orderId) url.searchParams.set("order", String(orderId));
    return url.href;
  } catch { return ""; }
}
// The admin bot only sends private notifications. It never consumes customer-bot updates.
async function notifyAdminOrder(order, { config = getConfig(), fetchImpl = fetch } = {}) {
  const url = appUrl(config.url, order.id);
  if (!config.token || !config.ids.size || !url) return { skipped: true };
  const text = `Нове замовлення #${order.orderNumber}\n${String(order.customerName || "Покупець").slice(0, 120)}\n${Number(order.total || 0)} грн · ${(order.items || []).length} поз.\nПеревірте склад і наявність перед підтвердженням.`;
  const results = await Promise.all([...config.ids].map(async id => {
    try {
      const response = await fetchImpl(`https://api.telegram.org/bot${config.token}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: AbortSignal.timeout(5000),
        body: JSON.stringify({ chat_id: id, text, protect_content: true, reply_markup: { inline_keyboard: [[{ text: "Відкрити замовлення", web_app: { url } }]] } }),
      });
      const result = await response.json();
      return response.ok && result.ok === true;
    } catch { return false; }
  }));
  const failed = results.filter(ok => !ok).length;
  if (failed) console.warn(`[Telegram admin] ${failed} notification(s) failed; order is saved. Check bot configuration and /start.`);
  return { sent: results.length - failed, failed };
}
module.exports = { appUrl, notifyAdminOrder };
