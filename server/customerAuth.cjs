const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const CUSTOMER_COOKIE_NAME = "customer_token";

function cleanString(value) {
  return String(value || "").trim();
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return "";

  if (digits.length === 10 && digits.startsWith("0")) {
    return `+38${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("380")) {
    return `+${digits}`;
  }

  return "";
}

function isValidPhone(value) {
  const phone = normalizePhone(value);
  return /^\+380\d{9}$/.test(phone);
}

function normalizeTelegram(value) {
  return String(value || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}

function isValidTelegram(value) {
  const telegram = normalizeTelegram(value);

  if (!telegram) return false;

  return /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(telegram);
}

function validateCustomerName(value) {
  const name = cleanString(value);

  if (name.length < 2) {
    return {
      ok: false,
      message: "Імʼя має містити щонайменше 2 символи",
    };
  }

  if (name.length > 60) {
    return {
      ok: false,
      message: "Імʼя занадто довге",
    };
  }

  return {
    ok: true,
    value: name,
  };
}

function validateCustomerPassword(password) {
  const value = String(password || "");

  if (value.length < 8) {
    return {
      ok: false,
      message: "Пароль має містити щонайменше 8 символів",
    };
  }

  if (/\s/.test(value)) {
    return {
      ok: false,
      message: "Пароль не повинен містити пробілів",
    };
  }

  return {
    ok: true,
    value,
  };
}

function validateCustomerRegistration(body = {}) {
  const errors = {};

  const nameResult = validateCustomerName(body.name);
  if (!nameResult.ok) {
    errors.name = nameResult.message;
  }

  const phone = normalizePhone(body.phone);
  const telegram = normalizeTelegram(body.telegram);

  if (!phone && !telegram) {
    errors.contact = "Вкажіть телефон або Telegram";
  }

  if (body.phone && !isValidPhone(body.phone)) {
    errors.phone = "Вкажіть телефон у форматі +380XXXXXXXXX";
  }

  if (body.telegram && !isValidTelegram(body.telegram)) {
    errors.telegram =
      "Telegram має бути у форматі @username, мінімум 5 символів";
  }

  const passwordResult = validateCustomerPassword(body.password);
  if (!passwordResult.ok) {
    errors.password = passwordResult.message;
  }

  if (body.passwordConfirm !== undefined && body.password !== body.passwordConfirm) {
    errors.passwordConfirm = "Паролі не співпадають";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    data: {
      name: nameResult.value || "",
      phone,
      telegram,
      password: String(body.password || ""),
      building: cleanString(body.building),
      entrance: cleanString(body.entrance),
      floor: cleanString(body.floor),
      apartment: cleanString(body.apartment),
    },
  };
}

function validateCustomerLogin(body = {}) {
  const login = cleanString(body.login);
  const password = String(body.password || "");
  const errors = {};

  if (!login) {
    errors.login = "Вкажіть телефон або Telegram";
  }

  const normalizedPhone = normalizePhone(login);
  const normalizedTelegram = normalizeTelegram(login);

  const looksLikeTelegram = /[a-zA-Z_@]/.test(login);

  if (login && looksLikeTelegram && !isValidTelegram(login)) {
    errors.login = "Telegram має бути у форматі @username";
  }

  if (login && !looksLikeTelegram && !normalizedPhone) {
    errors.login = "Телефон має бути у форматі +380XXXXXXXXX";
  }

  if (!password) {
    errors.password = "Вкажіть пароль";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    data: {
      login,
      phone: normalizedPhone,
      telegram: normalizedTelegram,
      password,
    },
  };
}

function findCustomerDuplicate(db, { phone, telegram }, exceptCustomerId = null) {
  return (db.customers || []).find((customer) => {
    if (
      exceptCustomerId &&
      Number(customer.id) === Number(exceptCustomerId)
    ) {
      return false;
    }

    const samePhone = phone && customer.phone === phone;
    const sameTelegram = telegram && customer.telegram === telegram;

    return samePhone || sameTelegram;
  });
}

function findCustomerByLogin(db, login) {
  const phone = normalizePhone(login);
  const telegram = normalizeTelegram(login);

  return (db.customers || []).find((customer) => {
    return (
      (phone && customer.phone === phone) ||
      (telegram && customer.telegram === telegram)
    );
  });
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
    telegramVerifiedAt: customer.telegramVerifiedAt || "",
    phoneVerifiedAt: customer.phoneVerifiedAt || "",
    telegramChatId: customer.telegramChatId || "",
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

  if (hash.length !== originalHash.length) {
    return false;
  }

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
  isValidPhone,
  normalizeTelegram,
  isValidTelegram,

  validateCustomerRegistration,
  validateCustomerLogin,
  findCustomerDuplicate,
  findCustomerByLogin,

  sanitizeCustomer,
  hashPassword,
  verifyPassword,
  createCustomerToken,
  setCustomerCookie,
  clearCustomerCookie,
  ensureCustomersStore,
  getCustomerFromRequest,
};