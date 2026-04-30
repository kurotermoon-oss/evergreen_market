const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const CUSTOMER_COOKIE_NAME = "customer_token";

function normalizePhone(value) {
  return String(value || "").replace(/[^\d+]/g, "").trim();
}

function normalizeTelegram(value) {
  return String(value || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}

function sanitizeCustomer(customer) {
  if (!customer) return null;

  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    telegram: customer.telegram,
    building: customer.building || "",
    entrance: customer.entrance || "",
    floor: customer.floor || "",
    apartment: customer.apartment || "",
    createdAt: customer.createdAt,
  };
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");

  const hash = crypto
    .pbkdf2Sync(String(password), salt, 100000, 64, "sha512")
    .toString("hex");

  return `${salt}:${hash}`;
}

function verifyPassword(password, storedPassword) {
  if (!storedPassword || !storedPassword.includes(":")) return false;

  const [salt, originalHash] = storedPassword.split(":");

  const hash = crypto
    .pbkdf2Sync(String(password), salt, 100000, 64, "sha512")
    .toString("hex");

  return crypto.timingSafeEqual(
    Buffer.from(hash, "hex"),
    Buffer.from(originalHash, "hex")
  );
}

function createCustomerToken(customer, jwtSecret) {
  return jwt.sign(
    {
      role: "customer",
      customerId: customer.id,
    },
    jwtSecret,
    {
      expiresIn: "30d",
    }
  );
}

function setCustomerCookie(res, token) {
  res.cookie(CUSTOMER_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

function clearCustomerCookie(res) {
  res.clearCookie(CUSTOMER_COOKIE_NAME);
}

function ensureCustomersStore(db) {
  if (!Array.isArray(db.customers)) {
    db.customers = [];
  }

  if (!Number.isFinite(Number(db.nextCustomerId))) {
    db.nextCustomerId = 1;
  }
}

function getCustomerFromRequest(req, db, jwtSecret) {
  const token = req.cookies[CUSTOMER_COOKIE_NAME];

  if (!token) return null;

  try {
    const payload = jwt.verify(token, jwtSecret);

    if (payload.role !== "customer") return null;

    return db.customers.find(
      (customer) => Number(customer.id) === Number(payload.customerId)
    );
  } catch {
    return null;
  }
}

module.exports = {
  normalizePhone,
  normalizeTelegram,
  sanitizeCustomer,
  hashPassword,
  verifyPassword,
  createCustomerToken,
  setCustomerCookie,
  clearCustomerCookie,
  ensureCustomersStore,
  getCustomerFromRequest,
};