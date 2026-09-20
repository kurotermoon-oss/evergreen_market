require("dotenv").config({ quiet: true });
const { getConfig } = require("../supply/auth.cjs");
const { telegramRequest } = require("../supply/notifications.cjs");
async function main() {
  const config = getConfig();
  if (!config.notificationsConfigured) throw new Error("Configure TELEGRAM_SUPPLY_BOT_TOKEN (or explicit shared-bot opt-in), TELEGRAM_SUPPLY_USER_IDS, TELEGRAM_SUPPLY_CHAT_ID and TELEGRAM_SUPPLY_APP_URL first.");
  const bot = await telegramRequest(config, "getMe", {});
  // A dedicated bot can own its menu. Reusing the shop bot must preserve its existing menu.
  if (process.env.TELEGRAM_SUPPLY_USE_SHARED_BOT !== "true") await telegramRequest(config, "setChatMenuButton", { chat_id: config.chatId, menu_button: { type: "web_app", text: "Закупівлі", web_app: { url: config.url } } });
  await telegramRequest(config, "sendMessage", { chat_id: config.chatId, text: "Evergreen · закупівлі\nСпільний чеклист, замовлення та поставки. Спочатку перевірте постачальників і розклад, потім увімкніть нагадування в налаштуваннях.", reply_markup: { inline_keyboard: [[{ text: "Відкрити закупівлі", web_app: { url: config.url } }]] } });
  console.log(`Connected @${bot.username}. Shared workspace: ${config.url}`);
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
