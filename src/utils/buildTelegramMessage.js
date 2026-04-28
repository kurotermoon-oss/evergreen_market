export function buildTelegramMessage({ orderNumber, cartItems, form, total }) {
  const itemsText = cartItems
    .map((item, index) => {
      const lineTotal = item.price * item.quantity;

      return `${index + 1}. ${item.name}
   Кількість: ${item.quantity} шт
   Ціна: ${item.price} грн
   Сума: ${lineTotal} грн`;
    })
    .join("\n\n");

  const addressText =
    form.deliveryType === "Самовивіз з кав’ярні"
      ? "Самовивіз з кав’ярні"
      : `${form.deliveryType}
Корпус/будинок: ${form.building || "—"}
Під’їзд: ${form.entrance || "—"}
Поверх: ${form.floor || "—"}
Квартира: ${form.apartment || "—"}`;

  return `🟢 Нове замовлення з сайту Evergreen coffee

#${orderNumber}

👤 Клієнт: ${form.name || "—"}
📞 Телефон: ${form.phone || "—"}
💬 Telegram: ${form.telegram || "—"}

📍 Спосіб отримання:
${order.deliveryType === "pickup"
  ? "Самовивіз з кавʼярні"
  : `Доставка по ЖК
Будинок: ${order.building || "-"}
Підʼїзд: ${order.entrance || "-"}
Поверх: ${order.floor || "-"}
Квартира: ${order.apartment || "-"}`
}ressText}

🧾 Замовлення:
${itemsText}

💰 Разом: ${total} грн

💳 Оплата: ${form.payment}
📝 Коментар клієнта:
${form.comment || "—"}`;
}