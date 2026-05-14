const express = require("express");

const {
  createAdminToken,
  verifyAdminToken,
  revokeAdminToken,
} = require("../middleware/adminAuth.cjs");
const {
  getAdminCredentials,
  timingSafeStringEqual,
  buildCookieOptions,
  buildClearCookieOptions,
} = require("../runtimeSecurity.cjs");
const {
  createRateLimiter,
  getRequestIp,
} = require("../httpSecurity.cjs");

const router = express.Router();
const ADMIN_CREDENTIALS = getAdminCredentials();

const adminLoginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyPrefix: "admin-login",
  keyGenerator(req) {
    const login = String(req.body?.login || "").trim().toLowerCase();

    return `${getRequestIp(req)}:${login}`;
  },
  message: "Too many admin login attempts. Please try again later.",
});

router.post("/login", adminLoginLimiter, (req, res) => {
  const login = String(req.body?.login || "").trim();
  const password = String(req.body?.password || "");

  const loginMatches = timingSafeStringEqual(login, ADMIN_CREDENTIALS.login);
  const passwordMatches = timingSafeStringEqual(
    password,
    ADMIN_CREDENTIALS.password
  );

  if (!loginMatches || !passwordMatches) {
    return res.status(401).json({ error: "Wrong login or password" });
  }

  const token = createAdminToken();

  res.cookie("admin_token", token, buildCookieOptions(7 * 24 * 60 * 60 * 1000));

  res.json({ ok: true });
});

router.post("/logout", (req, res) => {
  revokeAdminToken(req.cookies?.admin_token);
  res.clearCookie("admin_token", buildClearCookieOptions());

  res.json({ ok: true });
});

router.get("/me", (req, res) => {
  const token = req.cookies.admin_token;

  if (!token) {
    return res.json({ authenticated: false });
  }

  try {
    const payload = verifyAdminToken(token);

    res.json({
      authenticated: Boolean(payload),
    });
  } catch {
    res.json({ authenticated: false });
  }
});

module.exports = router;
