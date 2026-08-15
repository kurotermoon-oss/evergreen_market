async function notifySupplierSyncIssue(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return {
      ok: false,
      skipped: true,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5_000);

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
      signal: controller.signal,
    });

    return {
      ok: response.ok,
      skipped: false,
    };
  } catch (error) {
    console.error("Supplier sync Telegram notification failed:", error.message);

    return {
      ok: false,
      skipped: false,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = {
  notifySupplierSyncIssue,
};
