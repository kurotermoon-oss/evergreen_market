const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { getJwtSecret } = require("../runtimeSecurity.cjs");

const AUDIENCE = "evergreen-telegram-admin";
function getConfig() {
  return {
    token: String(process.env.TELEGRAM_ADMIN_BOT_TOKEN || "").trim(),
    ids: new Set(String(process.env.TELEGRAM_ADMIN_USER_IDS || "").split(",").map(s => s.trim()).filter(s => /^[1-9]\d{0,15}$/.test(s))),
    url: String(process.env.TELEGRAM_ADMIN_APP_URL || "").trim(),
  };
}
function authError(message = "Не вдалося підтвердити вхід. Закрийте й відкрийте застосунок через меню бота.", status = 401) {
  return Object.assign(new Error(message), { status });
}
function validateInitData(raw, token, now = Math.floor(Date.now() / 1000)) {
  if (!token || typeof raw !== "string" || !raw || raw.length > 12000) throw authError();
  const params = new URLSearchParams(raw);
  const keys = [...params.keys()];
  if (new Set(keys).size !== keys.length) throw authError();
  const hash = params.get("hash") || "";
  if (!/^[a-f0-9]{64}$/i.test(hash)) throw authError();
  params.delete("hash");
  const check = [...params.entries()].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, value]) => `${key}=${value}`).join("\n");
  const secret = crypto.createHmac("sha256", "WebAppData").update(token).digest();
  const expected = crypto.createHmac("sha256", secret).update(check).digest();
  if (!crypto.timingSafeEqual(expected, Buffer.from(hash, "hex"))) throw authError();
  const date = Number(params.get("auth_date"));
  if (!Number.isInteger(date) || now - date > 300 || date - now > 30) throw authError();
  let user;
  try { user = JSON.parse(params.get("user")); } catch { throw authError(); }
  if (!Number.isSafeInteger(user?.id) || user.id <= 0 || user.is_bot) throw authError();
  return user;
}
function issueSession(raw, config = getConfig()) {
  if (!config.token || !config.ids.size) throw authError("Доступ через Telegram ще не налаштовано.", 503);
  const user = validateInitData(raw, config.token);
  if (!config.ids.has(String(user.id))) throw authError("Цей Telegram-акаунт не має доступу до керування.", 403);
  const token = jwt.sign({ role: "telegram_admin" }, getJwtSecret(), {
    algorithm: "HS256", audience: AUDIENCE, issuer: "evergreen", subject: String(user.id), expiresIn: "30m",
  });
  return { token, user: { id: String(user.id), name: String(user.first_name || "Адміністратор").slice(0, 100) }, expiresIn: 1800 };
}
function verifySession(token, config = getConfig()) {
  if (!config.token || !config.ids.size) throw authError();
  let payload;
  try { payload = jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"], audience: AUDIENCE, issuer: "evergreen" }); }
  catch { throw authError(); }
  if (payload.role !== "telegram_admin" || !config.ids.has(payload.sub)) throw authError("Доступ відкликано.", 403);
  return { id: payload.sub };
}
module.exports = { getConfig, validateInitData, issueSession, verifySession };
