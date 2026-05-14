const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const { getJwtSecret } = require("../runtimeSecurity.cjs");

const JWT_SECRET = getJwtSecret();
const revokedAdminTokenIds = new Map();

function cleanupRevokedTokens() {
  const now = Date.now();

  for (const [jti, expiresAt] of revokedAdminTokenIds.entries()) {
    if (expiresAt <= now) {
      revokedAdminTokenIds.delete(jti);
    }
  }
}

function createAdminToken() {
  return jwt.sign(
    {
      role: "admin",
      jti: crypto.randomUUID(),
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function verifyAdminToken(token) {
  if (!token) return null;

  const payload = jwt.verify(token, JWT_SECRET);

  cleanupRevokedTokens();

  if (payload.role !== "admin" || !payload.jti) {
    return null;
  }

  if (revokedAdminTokenIds.has(payload.jti)) {
    return null;
  }

  return payload;
}

function revokeAdminToken(token) {
  if (!token) return;

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (!payload.jti) return;

    const expiresAt = Number(payload.exp || 0) * 1000;

    revokedAdminTokenIds.set(
      payload.jti,
      Number.isFinite(expiresAt) && expiresAt > Date.now()
        ? expiresAt
        : Date.now() + 60 * 60 * 1000
    );

    cleanupRevokedTokens();
  } catch {
    // Invalid or expired tokens do not need revocation.
  }
}

function requireAdmin(req, res, next) {
  const token = req.cookies?.admin_token;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const payload = verifyAdminToken(token);

    if (!payload) {
      return res.status(403).json({ error: "Forbidden" });
    }

    req.admin = payload;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

module.exports = {
  createAdminToken,
  verifyAdminToken,
  revokeAdminToken,
  requireAdmin,
};
