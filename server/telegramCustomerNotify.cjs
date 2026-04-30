function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normalizeTelegramUsername(value) {
  return String(value || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}

function buildOrderReadyMessage(order) {
  const itemsText = (order.items || [])
    .map((item) => {
      return `• ${escapeHtml(item.name)} × ${item.quantity} — ${item.total} грн`;
    })
    .join("\n");

  return [
    `✅ <b>Ваше замовлення готове до видачі</b>`,
    ``,
    `Замовлення: <b>#${escapeHtml(order.orderNumber)}</b>`,
    `Сума: <b>${escapeHtml(order.total)} грн</b>`,
    ``,
    `<b>Склад замовлення:</b>`,
    itemsText || "—",
    ``,
    `Можете забрати його в кавʼярні ☕`,
  ].join("\n");
}

async function sendTelegramToChat(botToken, chatId, text) {
  if (!botToken || !chatId) {
    return {
      ok: false,
      skipped: true,
      reason: "Missing bot token or chat id",
    };
  }

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    return {
      ok: false,
      error: errorText,
    };
  }

  return response.json();
}

async function syncCustomerTelegramChats(db, botToken) {
  if (!botToken) {
    return {
      ok: false,
      skipped: true,
      reason: "Missing TELEGRAM_BOT_TOKEN",
    };
  }

  if (!Array.isArray(db.customers)) {
    db.customers = [];
  }

  const offset = Number(db.telegramUpdateOffset || 0);

  const response = await fetch(
    `https://api.telegram.org/bot${botToken}/getUpdates?timeout=0&offset=${offset}`
  );

  const data = await response.json();

  if (!data.ok) {
    return {
      ok: false,
      error: data.description || "Telegram getUpdates failed",
    };
  }

  let linkedCount = 0;

  for (const update of data.result || []) {
    db.telegramUpdateOffset = Math.max(
      Number(db.telegramUpdateOffset || 0),
      Number(update.update_id) + 1
    );

    const message = update.message || update.edited_message;

    if (!message?.from) continue;

    const from = message.from;
    const text = String(message.text || "").trim();

    let customer = null;

    const startMatch = text.match(/^\/start\s+customer_(\d+)/i);

    if (startMatch) {
      customer = db.customers.find(
        (item) => Number(item.id) === Number(startMatch[1])
      );
    }

    if (!customer && from.username) {
      const username = normalizeTelegramUsername(from.username);

      customer = db.customers.find(
        (item) => normalizeTelegramUsername(item.telegram) === username
      );
    }

    if (!customer) continue;

    customer.telegramChatId = String(from.id);
    customer.telegramLinkedAt = new Date().toISOString();

    linkedCount += 1;
  }

  return {
    ok: true,
    linkedCount,
  };
}

async function notifyCustomerOrderReady(db, order, botToken) {
  try {
    if (order.readyTelegramNotifiedAt) {
      return {
        ok: false,
        skipped: true,
        reason: "Already notified",
      };
    }

    if (!Array.isArray(db.customers)) {
      db.customers = [];
    }

    const customer = db.customers.find(
      (item) => Number(item.id) === Number(order.customerId)
    );

    if (!customer?.telegramChatId) {
      order.readyTelegramNotification = {
        ok: false,
        skipped: true,
        reason: "Customer Telegram chat is not linked",
        at: new Date().toISOString(),
      };

      return order.readyTelegramNotification;
    }

    const text = buildOrderReadyMessage(order);

    const result = await sendTelegramToChat(
      botToken,
      customer.telegramChatId,
      text
    );

    order.readyTelegramNotification = {
      ...result,
      at: new Date().toISOString(),
    };

    if (result.ok) {
      order.readyTelegramNotifiedAt = new Date().toISOString();

      if (!Array.isArray(order.statusHistory)) {
        order.statusHistory = [];
      }

      order.statusHistory.push({
        at: new Date().toISOString(),
        type: "telegram_notification",
        label: "Клієнту надіслано Telegram-повідомлення про готовність",
      });
    }

    return result;
  } catch (error) {
    order.readyTelegramNotification = {
      ok: false,
      error: error.message,
      at: new Date().toISOString(),
    };

    return order.readyTelegramNotification;
  }
}

module.exports = {
  syncCustomerTelegramChats,
  notifyCustomerOrderReady,
};