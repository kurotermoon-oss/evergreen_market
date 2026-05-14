const crypto = require("crypto");

const WEAK_SECRET_VALUES = new Set([
  "dev-secret",
  "secret",
  "jwt-secret",
  "change-this-secret",
  "change-this-secret-to-long-random-string",
]);

function isProductionLike() {
  return (
    process.env.NODE_ENV === "production" ||
    Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID)
  );
}

function getRequiredSecret(name, { developmentFallback = "", minLength = 32 } = {}) {
  const value = String(process.env[name] || "").trim();

  if (value) {
    if (
      isProductionLike() &&
      (value.length < minLength || WEAK_SECRET_VALUES.has(value))
    ) {
      throw new Error(
        `${name} must be a strong, non-placeholder value in production.`
      );
    }

    return value;
  }

  if (isProductionLike()) {
    throw new Error(`${name} is required in production.`);
  }

  return developmentFallback;
}

function getJwtSecret() {
  return getRequiredSecret("JWT_SECRET", {
    developmentFallback: "dev-secret",
    minLength: 32,
  });
}

function getAdminCredentials() {
  const login = String(process.env.ADMIN_LOGIN || "").trim();
  const password = String(process.env.ADMIN_PASSWORD || "");

  if (isProductionLike() && (!login || !password)) {
    throw new Error("ADMIN_LOGIN and ADMIN_PASSWORD are required in production.");
  }

  if (isProductionLike() && password === "change-this-password") {
    throw new Error("ADMIN_PASSWORD must be changed in production.");
  }

  return {
    login: login || "admin",
    password: password || "change-this-password",
  };
}

function timingSafeStringEqual(actual, expected) {
  const actualHash = crypto
    .createHash("sha256")
    .update(String(actual ?? ""), "utf8")
    .digest();

  const expectedHash = crypto
    .createHash("sha256")
    .update(String(expected ?? ""), "utf8")
    .digest();

  return crypto.timingSafeEqual(actualHash, expectedHash);
}

function getCookieSameSite() {
  const configured = String(
    process.env.COOKIE_SAME_SITE || process.env.COOKIE_SAMESITE || ""
  )
    .trim()
    .toLowerCase();

  if (["strict", "lax", "none"].includes(configured)) {
    return configured;
  }

  return "lax";
}

function getSecureCookieFlag() {
  return isProductionLike() || getCookieSameSite() === "none";
}

function buildCookieOptions(maxAge) {
  return {
    httpOnly: true,
    sameSite: getCookieSameSite(),
    secure: getSecureCookieFlag(),
    ...(maxAge ? { maxAge } : {}),
  };
}

function buildClearCookieOptions() {
  return {
    sameSite: getCookieSameSite(),
    secure: getSecureCookieFlag(),
  };
}

module.exports = {
  isProductionLike,
  getJwtSecret,
  getAdminCredentials,
  timingSafeStringEqual,
  buildCookieOptions,
  buildClearCookieOptions,
};
