function formatOrderMessage({ order }) {
  const itemsText = order.items
    .map((item, index) => {
      return `${index + 1}. ${item.name}
   Кількість: ${item.quantity} шт
   Ціна: ${item.price} грн
   Сума: ${item.total} грн`;
    })
    .join("\n\n");

  const addressText =
    order.deliveryType === "Самовивіз з кав’ярні"
      ? "Самовивіз з кав’ярні"
      : `${order.deliveryType}
Корпус/будинок: ${order.building || "—"}
Під’їзд: ${order.entrance || "—"}
Поверх: ${order.floor || "—"}
Квартира: ${order.apartment || "—"}`;

  return `🟢 Нове замовлення з сайту Evergreen coffee

#${order.orderNumber}

👤 Клієнт: ${order.customerName || "—"}
📞 Телефон: ${order.customerPhone || "—"}
💬 Telegram: ${order.customerTelegram || "—"}

📍 Спосіб отримання:
${addressText}

🧾 Замовлення:
${itemsText}

💰 Разом: ${order.total} грн

💳 Оплата: ${order.paymentMethod}
📌 Статус: ${order.status}

📝 Коментар клієнта:
${order.comment || "—"}`;
}

module.exports = {
  formatOrderMessage,
};