function escapeTelegramHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function cleanSingleLine(value, fallback = "—") {
  const text = String(value ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return escapeTelegramHtml(text || fallback);
}

function cleanMultiline(value, fallback = "—") {
  const text = String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();

  return escapeTelegramHtml(text || fallback);
}

function formatNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function formatMoney(value) {
  return `${formatNumber(value)} грн`;
}

function formatDeliveryType(deliveryType) {
  return deliveryType === "building" ? "Доставка до будинку" : "Самовивіз";
}

function formatStatus(status) {
  const labels = {
    new: "Нове",
    confirmed: "Підтверджено",
    preparing: "Готується",
    ready: "Готове до видачі",
    completed: "Видано",
    cancelled: "Скасовано",
    canceled: "Скасовано",
  };

  return labels[status] || status || "new";
}

function formatTelegramUsername(value) {
  const username = String(value || "").trim().replace(/^@/, "");

  return username ? `@${cleanSingleLine(username)}` : "—";
}

function formatAddress(order) {
  if (order.deliveryType !== "building") {
    return `<b>${formatDeliveryType(order.deliveryType)}</b>`;
  }

  return [
    `<b>${formatDeliveryType(order.deliveryType)}</b>`,
    `Будинок: ${cleanSingleLine(order.building)}`,
    `Під’їзд: ${cleanSingleLine(order.entrance)}`,
    `Поверх: ${cleanSingleLine(order.floor)}`,
    `Квартира: ${cleanSingleLine(order.apartment)}`,
  ].join("\n");
}

function formatOrderItem(item, index) {
  const quantity = formatNumber(item.quantity);
  const price = formatMoney(item.price);
  const total = formatMoney(item.total);

  return [
    `${index + 1}. <b>${cleanSingleLine(item.name)}</b>`,
    `   ${quantity} шт × ${price}`,
    `   Сума: <b>${total}</b>`,
  ].join("\n");
}

function formatOrderMessage({ order }) {
  const itemsText =
    (order.items || []).map(formatOrderItem).join("\n\n") || "—";

  return `☕️ <b>Evergreen Coffee</b>
Нове замовлення <b>#${cleanSingleLine(order.orderNumber)}</b>

👤 <b>Клієнт</b>
Ім’я: ${cleanSingleLine(order.customerName)}
Телефон: ${cleanSingleLine(order.customerPhone)}
Telegram: ${formatTelegramUsername(order.customerTelegram)}

📍 <b>Отримання</b>
${formatAddress(order)}

🧾 <b>Замовлення</b>
${itemsText}

💰 <b>Разом: ${formatMoney(order.total)}</b>
💳 Оплата: ${cleanSingleLine(order.paymentMethod)}
📌 Статус: ${cleanSingleLine(formatStatus(order.status))}

📝 <b>Коментар клієнта</b>
${cleanMultiline(order.comment)}`;
}

module.exports = {
  formatOrderMessage,
  escapeTelegramHtml,
};
