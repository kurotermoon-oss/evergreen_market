const { isProductionLike } = require("./runtimeSecurity.cjs");

const DEV_ORIGINS = new Set([
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:5173",
]);

function splitEnvOrigins(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeOrigin(value) {
  const trimmed = String(value || "").trim().replace(/\/+$/, "");

  if (!trimmed) return "";

  try {
    return new URL(trimmed).origin;
  } catch {
    try {
      return new URL(`https://${trimmed}`).origin;
    } catch {
      return "";
    }
  }
}

function getAllowedOrigins() {
  const configured = [
    ...splitEnvOrigins(process.env.CORS_ORIGINS),
    ...splitEnvOrigins(process.env.CLIENT_ORIGIN),
    ...splitEnvOrigins(process.env.FRONTEND_URL),
    ...splitEnvOrigins(process.env.APP_ORIGIN),
  ];

  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    configured.push(process.env.RAILWAY_PUBLIC_DOMAIN);
  }

  return new Set(configured.map(normalizeOrigin).filter(Boolean));
}

function isLocalhostOrigin(origin) {
  try {
    const { hostname } = new URL(origin);

    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

function isAllowedOrigin(origin) {
  if (!origin) return true;

  const normalizedOrigin = normalizeOrigin(origin);
  const allowedOrigins = getAllowedOrigins();

  if (allowedOrigins.has(normalizedOrigin)) {
    return true;
  }

  if (!isProductionLike()) {
    return DEV_ORIGINS.has(normalizedOrigin) || isLocalhostOrigin(normalizedOrigin);
  }

  return false;
}

function createCorsOptions() {
  return {
    credentials: true,
    origin(origin, callback) {
      callback(null, isAllowedOrigin(origin) ? origin || true : false);
    },
  };
}

function buildContentSecurityPolicy() {
  const allowedOrigins = [...getAllowedOrigins()];
  const connectSrc = ["'self'", ...allowedOrigins];
  const scriptSrc = ["'self'"];
  const frameSrc = ["'self'", "https://www.google.com", "https://maps.google.com"];

  if (!isProductionLike()) {
    connectSrc.push("http://localhost:*", "ws://localhost:*", "http://127.0.0.1:*", "ws://127.0.0.1:*");
    scriptSrc.push("'unsafe-inline'", "'unsafe-eval'");
  }

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connectSrc.join(" ")}`,
    `frame-src ${frameSrc.join(" ")}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  if (isProductionLike()) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

function applySecurityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Content-Security-Policy", buildContentSecurityPolicy());

  if (isProductionLike()) {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=15552000; includeSubDomains"
    );
  }

  next();
}

function getRequestIp(req) {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function createRateLimiter({
  windowMs,
  max,
  keyPrefix = "rate",
  keyGenerator,
  message = "Too many requests. Please try again later.",
}) {
  const hits = new Map();

  return function rateLimiter(req, res, next) {
    const now = Date.now();
    const key = `${keyPrefix}:${keyGenerator ? keyGenerator(req) : getRequestIp(req)}`;
    const current = hits.get(key);

    if (!current || current.resetAt <= now) {
      hits.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });

      return next();
    }

    current.count += 1;

    if (current.count > max) {
      const retryAfter = Math.ceil((current.resetAt - now) / 1000);

      res.setHeader("Retry-After", String(Math.max(1, retryAfter)));

      return res.status(429).json({
        error: "RATE_LIMITED",
        message,
      });
    }

    if (hits.size > 10000) {
      for (const [hitKey, hitValue] of hits.entries()) {
        if (hitValue.resetAt <= now) {
          hits.delete(hitKey);
        }
      }
    }

    return next();
  };
}

module.exports = {
  createCorsOptions,
  applySecurityHeaders,
  createRateLimiter,
  getRequestIp,
};
