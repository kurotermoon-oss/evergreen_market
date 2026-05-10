const { normalizePhone, normalizeTelegram } = require("./customerAuth.cjs");

const TELEGRAM_CODE_TTL_MS = 10 * 60 * 1000;

function generateTelegramCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function normalizePhoneForCompare(value) {
  return String(value || "").replace(/\D/g, "");
}

function getTelegramVerificationStatus(customer) {
  if (!customer?.telegram) {
    return {
      verified: false,
      canStart: false,
      message: "Спочатку вкажіть Telegram у профілі.",
    };
  }

  if (!customer?.phone) {
    return {
      verified: false,
      canStart: false,
      message: "Спочатку вкажіть телефон у профілі.",
    };
  }

  if (customer.telegramVerifiedAt && customer.phoneVerifiedAt) {
    return {
      verified: true,
      canStart: false,
      message: "Telegram і телефон підтверджено.",
    };
  }

  return {
    verified: false,
    canStart: true,
    message: "Telegram і телефон ще не підтверджено.",
  };
}

function startTelegramVerification(customer) {
  const code = generateTelegramCode();
  const now = new Date();

  customer.telegramVerificationCode = code;
  customer.telegramVerificationExpiresAt = new Date(
    now.getTime() + TELEGRAM_CODE_TTL_MS
  ).toISOString();
  customer.telegramVerificationStartedAt = now.toISOString();

  customer.telegramVerificationChatId = "";
  customer.telegramVerificationUsername = "";
  customer.telegramVerificationCodeConfirmedAt = "";
  customer.telegramVerificationContactRequestedAt = "";

  return {
    code,
    expiresAt: customer.telegramVerificationExpiresAt,
  };
}

async function getTelegramUpdates(botToken, offset = 0) {
  if (!botToken) {
    return {
      ok: false,
      error: "TELEGRAM_BOT_TOKEN is empty",
      updates: [],
      nextOffset: offset,
    };
  }

  const url = new URL(`https://api.telegram.org/bot${botToken}/getUpdates`);

  if (offset) {
    url.searchParams.set("offset", String(offset));
  }

  url.searchParams.set("timeout", "0");
  url.searchParams.set("allowed_updates", JSON.stringify(["message"]));

  const response = await fetch(url);

  if (!response.ok) {
    const text = await response.text();

    return {
      ok: false,
      error: text,
      updates: [],
      nextOffset: offset,
    };
  }

  const data = await response.json();
  const updates = Array.isArray(data.result) ? data.result : [];

  const nextOffset = updates.length
    ? Math.max(...updates.map((update) => Number(update.update_id || 0))) + 1
    : offset;

  return {
    ok: true,
    updates,
    nextOffset,
  };
}

async function sendTelegramContactRequest(botToken, chatId) {
  if (!botToken || !chatId) {
    return {
      ok: false,
      skipped: true,
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
        text:
          "Код отримано ✅\n\nТепер підтвердьте номер телефону. Натисніть кнопку нижче, щоб поділитися саме своїм номером.",
        reply_markup: {
          keyboard: [
            [
              {
                text: "Поділитися телефоном",
                request_contact: true,
              },
            ],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
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

function updateContainsCode(update, code) {
  const text = String(update?.message?.text || "").trim();

  if (!text || !code) return false;

  return text.includes(String(code));
}

function getUpdateSender(update) {
  const message = update?.message || {};
  const from = message.from || {};
  const chat = message.chat || {};

  return {
    chatId: chat.id ? String(chat.id) : "",
    userId: from.id ? String(from.id) : "",
    username: normalizeTelegram(from.username || ""),
    firstName: from.first_name || "",
    lastName: from.last_name || "",
  };
}

function findContactUpdateFromChat(updates, chatId, expectedPhone) {
  const expectedPhoneDigits = normalizePhoneForCompare(expectedPhone);

  return updates.find((update) => {
    const message = update?.message || {};
    const contact = message.contact || {};
    const from = message.from || {};
    const chat = message.chat || {};

    const sameChat = String(chat.id || "") === String(chatId || "");

    const contactBelongsToSender =
      contact.user_id &&
      from.id &&
      String(contact.user_id) === String(from.id);

    const contactPhoneDigits = normalizePhoneForCompare(contact.phone_number);

    return (
      sameChat &&
      contactBelongsToSender &&
      expectedPhoneDigits &&
      contactPhoneDigits === expectedPhoneDigits
    );
  });
}

async function checkTelegramVerification(db, customer, botToken) {
  if (!customer?.telegramVerificationCode) {
    return {
      ok: false,
      verified: false,
      message: "Спочатку натисніть “Підтвердити Telegram”, щоб отримати код.",
    };
  }

  const expiresAt = new Date(customer.telegramVerificationExpiresAt || "");
  const now = new Date();

  if (!Number.isFinite(expiresAt.getTime()) || expiresAt < now) {
    customer.telegramVerificationCode = "";
    customer.telegramVerificationExpiresAt = "";
    customer.telegramVerificationStartedAt = "";
    customer.telegramVerificationChatId = "";
    customer.telegramVerificationUsername = "";
    customer.telegramVerificationCodeConfirmedAt = "";
    customer.telegramVerificationContactRequestedAt = "";

    return {
      ok: false,
      verified: false,
      message: "Код підтвердження застарів. Створіть новий код.",
    };
  }

  if (!Number.isFinite(Number(db.telegramUpdateOffset))) {
    db.telegramUpdateOffset = 0;
  }

  const updatesResult = await getTelegramUpdates(
    botToken,
    Number(db.telegramUpdateOffset || 0)
  );

  if (!updatesResult.ok) {
    return {
      ok: false,
      verified: false,
      message: "Не вдалося перевірити повідомлення Telegram-бота.",
      details: updatesResult.error,
    };
  }

  db.telegramUpdateOffset = updatesResult.nextOffset;

  const expectedTelegram = normalizeTelegram(customer.telegram || "");
  const expectedPhone = normalizePhone(customer.phone || "");

  let chatId = customer.telegramVerificationChatId || "";

  if (!chatId) {
    const codeUpdate = updatesResult.updates.find((update) => {
      return updateContainsCode(update, customer.telegramVerificationCode);
    });

    if (!codeUpdate) {
      return {
        ok: false,
        verified: false,
        message: "Код поки не знайдено.",
        details:
          "Переконайтесь, що ви надіслали код саме нашому Telegram-боту.",
      };
    }

    const sender = getUpdateSender(codeUpdate);

    if (!sender.chatId) {
      return {
        ok: false,
        verified: false,
        message: "Не вдалося визначити Telegram-чат.",
        details: "Напишіть боту /start і надішліть код ще раз.",
      };
    }

    if (!sender.username) {
      return {
        ok: false,
        verified: false,
        message: "У вашого Telegram-акаунта немає username.",
        details:
          "Додайте username у Telegram або вкажіть у профілі саме той Telegram, з якого надсилаєте код.",
      };
    }

    if (expectedTelegram && sender.username !== expectedTelegram) {
      return {
        ok: false,
        verified: false,
        message: "Код надіслано з іншого Telegram-акаунта.",
        details:
          "Надішліть код саме з того Telegram, який вказаний у вашому профілі.",
      };
    }

    chatId = sender.chatId;

    customer.telegramVerificationChatId = sender.chatId;
    customer.telegramVerificationUsername = sender.username;
    customer.telegramVerificationCodeConfirmedAt = new Date().toISOString();
    customer.telegramVerificationContactRequestedAt = new Date().toISOString();

    await sendTelegramContactRequest(botToken, sender.chatId);

    return {
      ok: true,
      verified: false,
      step: "phone_contact_required",
      message: "Код підтверджено. Тепер підтвердіть номер телефону.",
      hint:
        "У Telegram-боті натисніть кнопку “Поділитися телефоном”. Номер має збігатися з номером у вашому профілі.",
      customer,
    };
  }

  const contactUpdate = findContactUpdateFromChat(
    updatesResult.updates,
    chatId,
    expectedPhone
  );

  if (!contactUpdate) {
    await sendTelegramContactRequest(botToken, chatId);

    return {
      ok: true,
      verified: false,
      step: "waiting_phone_contact",
      message: "Очікуємо підтвердження номера телефону.",
      hint:
        "У Telegram-боті натисніть кнопку “Поділитися телефоном”, а потім поверніться на сайт і натисніть “Я надіслав код”.",
      customer,
    };
  }

  const sender = getUpdateSender(contactUpdate);

  customer.telegramChatId = chatId;
  customer.telegramVerifiedAt = new Date().toISOString();
  customer.phoneVerifiedAt = new Date().toISOString();

  if (customer.telegramVerificationUsername) {
    customer.telegram = customer.telegramVerificationUsername;
  } else if (sender.username) {
    customer.telegram = sender.username;
  }

  customer.telegramVerificationCode = "";
  customer.telegramVerificationExpiresAt = "";
  customer.telegramVerificationStartedAt = "";
  customer.telegramVerificationChatId = "";
  customer.telegramVerificationUsername = "";
  customer.telegramVerificationCodeConfirmedAt = "";
  customer.telegramVerificationContactRequestedAt = "";

  customer.updatedAt = new Date().toISOString();

  return {
    ok: true,
    verified: true,
    customer,
    message: "Telegram і номер телефону успішно підтверджено.",
  };
}

module.exports = {
  getTelegramVerificationStatus,
  startTelegramVerification,
  checkTelegramVerification,
};