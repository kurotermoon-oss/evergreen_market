const jwt = require("jsonwebtoken");
const { validateInitData } = require("../telegram/adminAuth.cjs");
const { getJwtSecret } = require("../runtimeSecurity.cjs");
const { error } = require("./domain.cjs");
const AUDIENCE = "evergreen-supply";
function getConfig(env = process.env) {
  const ids = new Set(String(env.TELEGRAM_SUPPLY_USER_IDS || "").split(",").map(s => s.trim()).filter(s => /^[1-9]\d{0,15}$/.test(s)));
  const token = String(env.TELEGRAM_SUPPLY_BOT_TOKEN || "").trim() || (env.TELEGRAM_SUPPLY_USE_SHARED_BOT === "true" ? String(env.TELEGRAM_BOT_TOKEN || "").trim() : "");
  const chatId = String(env.TELEGRAM_SUPPLY_CHAT_ID || "").trim();
  const url = String(env.TELEGRAM_SUPPLY_APP_URL || "").trim();
  let validUrl = false;
  try { const u = new URL(url); validUrl = u.protocol === "https:" && !u.username && !u.password && u.pathname.replace(/\/$/, "") === "/telegram/supply"; } catch {}
  return { token, ids, chatId, url, configured: !!token && ids.size > 0,
    notificationsConfigured: !!token && ids.has(chatId) && validUrl,
    workerEnabled: env.SUPPLY_REMINDERS_ENABLED === "true" };
}
function issueSession(raw, config = getConfig()) {
  if (!config.configured) throw error("Бот закупівель ще не підключений. Потрібні токен і дозволений робочий Telegram-акаунт.", 503);
  const user = validateInitData(raw, config.token);
  if (!config.ids.has(String(user.id))) throw error("Цей акаунт не має доступу до закупівель Evergreen.", 403);
  return { token: jwt.sign({ role: "supply" }, getJwtSecret(), { algorithm: "HS256", audience: AUDIENCE, issuer: "evergreen", subject: String(user.id), expiresIn: "8h" }), user: { name: "Робочий акаунт Evergreen" }, expiresIn: 28800 };
}
function verifySession(token, config = getConfig()) {
  if (!config.configured) throw error("Доступ до закупівель не налаштований.", 503);
  let payload;
  try { payload = jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"], audience: AUDIENCE, issuer: "evergreen" }); }
  catch { throw error("Сесія завершилася. Закрийте й відкрийте Mini App через Telegram.", 401); }
  if (payload.role !== "supply" || !config.ids.has(payload.sub)) throw error("Доступ до закупівель відкликано.", 403);
  return { id: payload.sub };
}
module.exports = { getConfig, issueSession, verifySession };
