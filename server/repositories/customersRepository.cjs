const prisma = require("../database/prisma.cjs");

function toCleanString(value) {
  return String(value || "").trim();
}

function normalizePhone(value) {
  const clean = String(value || "")
    .replace(/[^\d+]/g, "")
    .trim();

  return clean || null;
}

function normalizeTelegram(value) {
  const clean = String(value || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();

  return clean || null;
}

function normalizeTelegramOrEmpty(value) {
  return normalizeTelegram(value) || "";
}

function toIsoOrEmpty(value) {
  if (!value) return "";

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) return "";

  return date.toISOString();
}

function toNullableDateForPrisma(value) {
  if (value === undefined) return undefined;
  if (!value) return null;

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return null;
  }

  return date;
}

function mapCustomer(customer) {
  if (!customer) return null;

  return {
    id: customer.id,
    name: customer.name || "",
    phone: customer.phone || "",
    telegram: customer.telegram || "",

    building: customer.building || "",
    entrance: customer.entrance || "",
    floor: customer.floor || "",
    apartment: customer.apartment || "",

    telegramChatId: customer.telegramChatId || "",
    telegramVerifiedAt: toIsoOrEmpty(customer.telegramVerifiedAt),
    phoneVerifiedAt: toIsoOrEmpty(customer.phoneVerifiedAt),

    telegramVerificationCode: customer.telegramVerificationCode || "",
    telegramVerificationExpiresAt: toIsoOrEmpty(
      customer.telegramVerificationExpiresAt
    ),
    telegramVerificationStartedAt: toIsoOrEmpty(
      customer.telegramVerificationStartedAt
    ),
    telegramVerificationChatId: customer.telegramVerificationChatId || "",
    telegramVerificationUsername:
      customer.telegramVerificationUsername || "",
    telegramVerificationCodeConfirmedAt: toIsoOrEmpty(
      customer.telegramVerificationCodeConfirmedAt
    ),
    telegramVerificationContactRequestedAt: toIsoOrEmpty(
      customer.telegramVerificationContactRequestedAt
    ),

    createdAt: toIsoOrEmpty(customer.createdAt),
    updatedAt: toIsoOrEmpty(customer.updatedAt),
  };
}

function mapCustomerWithPassword(customer) {
  if (!customer) return null;

  return {
    ...mapCustomer(customer),
    passwordHash: customer.passwordHash || "",
  };
}

async function getCustomerById(id, { includePassword = false } = {}) {
  const customerId = Number(id);

  if (!Number.isFinite(customerId)) {
    return null;
  }

  const customer = await prisma.customer.findUnique({
    where: {
      id: customerId,
    },
  });

  return includePassword
    ? mapCustomerWithPassword(customer)
    : mapCustomer(customer);
}

async function getCustomerByPhone(phone, { includePassword = false } = {}) {
  const normalizedPhone = normalizePhone(phone);

  if (!normalizedPhone) return null;

  const customer = await prisma.customer.findUnique({
    where: {
      phone: normalizedPhone,
    },
  });

  return includePassword
    ? mapCustomerWithPassword(customer)
    : mapCustomer(customer);
}

async function getCustomerByTelegram(
  telegram,
  { includePassword = false } = {}
) {
  const normalizedTelegram = normalizeTelegram(telegram);

  if (!normalizedTelegram) return null;

  const customer = await prisma.customer.findUnique({
    where: {
      telegram: normalizedTelegram,
    },
  });

  return includePassword
    ? mapCustomerWithPassword(customer)
    : mapCustomer(customer);
}

async function findCustomerByContact(
  { phone, telegram },
  { includePassword = false } = {}
) {
  const normalizedPhone = normalizePhone(phone);
  const normalizedTelegram = normalizeTelegram(telegram);

  const conditions = [];

  if (normalizedPhone) {
    conditions.push({
      phone: normalizedPhone,
    });
  }

  if (normalizedTelegram) {
    conditions.push({
      telegram: normalizedTelegram,
    });
  }

  if (!conditions.length) return null;

  const customer = await prisma.customer.findFirst({
    where: {
      OR: conditions,
    },
  });

  return includePassword
    ? mapCustomerWithPassword(customer)
    : mapCustomer(customer);
}

async function createCustomer(payload) {
  const name = toCleanString(payload.name);

  if (!name) {
    const error = new Error("Імʼя обовʼязкове.");
    error.status = 400;
    throw error;
  }

  if (!payload.passwordHash) {
    const error = new Error("passwordHash is required.");
    error.status = 400;
    throw error;
  }

  const phone = normalizePhone(payload.phone);
  const telegram = normalizeTelegram(payload.telegram);

  if (!phone && !telegram) {
    const error = new Error("Вкажіть телефон або Telegram.");
    error.status = 400;
    throw error;
  }

  const existingCustomer = await findCustomerByContact({
    phone,
    telegram,
  });

  if (existingCustomer) {
    const error = new Error("Клієнт з таким телефоном або Telegram вже існує.");
    error.status = 409;
    throw error;
  }

  const customer = await prisma.customer.create({
    data: {
      name,
      phone,
      telegram,

      passwordHash: payload.passwordHash,

      building: toCleanString(payload.building),
      entrance: toCleanString(payload.entrance),
      floor: toCleanString(payload.floor),
      apartment: toCleanString(payload.apartment),
    },
  });

  return mapCustomer(customer);
}

async function updateCustomer(id, payload) {
  const customerId = Number(id);

  if (!Number.isFinite(customerId)) {
    const error = new Error("Клієнта не знайдено.");
    error.status = 404;
    throw error;
  }

  const currentCustomer = await prisma.customer.findUnique({
    where: {
      id: customerId,
    },
  });

  if (!currentCustomer) {
    const error = new Error("Клієнта не знайдено.");
    error.status = 404;
    throw error;
  }

  const nextPhone =
    payload.phone === undefined
      ? currentCustomer.phone
      : normalizePhone(payload.phone);

  const nextTelegram =
    payload.telegram === undefined
      ? currentCustomer.telegram
      : normalizeTelegram(payload.telegram);

  if (!nextPhone && !nextTelegram) {
    const error = new Error("Вкажіть телефон або Telegram.");
    error.status = 400;
    throw error;
  }

  const duplicateConditions = [];

  if (nextPhone) {
    duplicateConditions.push({
      phone: nextPhone,
    });
  }

  if (nextTelegram) {
    duplicateConditions.push({
      telegram: nextTelegram,
    });
  }

  if (duplicateConditions.length) {
    const duplicate = await prisma.customer.findFirst({
      where: {
        id: {
          not: customerId,
        },
        OR: duplicateConditions,
      },
      select: {
        id: true,
      },
    });

    if (duplicate) {
      const error = new Error(
        "Клієнт з таким телефоном або Telegram вже існує."
      );
      error.status = 409;
      throw error;
    }
  }

  const phoneChanged = nextPhone !== currentCustomer.phone;
  const telegramChanged = nextTelegram !== currentCustomer.telegram;

  const verificationResetData = {};

  if (phoneChanged) {
    verificationResetData.phoneVerifiedAt = null;
  }

  if (telegramChanged) {
    verificationResetData.telegramVerifiedAt = null;
    verificationResetData.telegramChatId = "";
    verificationResetData.telegramVerificationCode = "";
    verificationResetData.telegramVerificationExpiresAt = null;
    verificationResetData.telegramVerificationStartedAt = null;
    verificationResetData.telegramVerificationChatId = "";
    verificationResetData.telegramVerificationUsername = "";
    verificationResetData.telegramVerificationCodeConfirmedAt = null;
    verificationResetData.telegramVerificationContactRequestedAt = null;
  }

  const customer = await prisma.customer.update({
    where: {
      id: customerId,
    },
    data: {
      name:
        payload.name === undefined
          ? currentCustomer.name
          : toCleanString(payload.name) || currentCustomer.name,

      phone: nextPhone,
      telegram: nextTelegram,

      building:
        payload.building === undefined
          ? currentCustomer.building
          : toCleanString(payload.building),

      entrance:
        payload.entrance === undefined
          ? currentCustomer.entrance
          : toCleanString(payload.entrance),

      floor:
        payload.floor === undefined
          ? currentCustomer.floor
          : toCleanString(payload.floor),

      apartment:
        payload.apartment === undefined
          ? currentCustomer.apartment
          : toCleanString(payload.apartment),

      ...verificationResetData,
    },
  });

  return mapCustomer(customer);
}

async function updateCustomerTelegramVerification(id, payload) {
  const customerId = Number(id);

  if (!Number.isFinite(customerId)) {
    const error = new Error("Клієнта не знайдено.");
    error.status = 404;
    throw error;
  }

  const customer = await prisma.customer.update({
    where: {
      id: customerId,
    },
    data: {
      telegram:
        payload.telegram === undefined
          ? undefined
          : normalizeTelegram(payload.telegram),

      telegramChatId:
        payload.telegramChatId === undefined
          ? undefined
          : toCleanString(payload.telegramChatId),

      telegramVerifiedAt: toNullableDateForPrisma(
        payload.telegramVerifiedAt
      ),

      phoneVerifiedAt: toNullableDateForPrisma(payload.phoneVerifiedAt),

      telegramVerificationCode:
        payload.telegramVerificationCode === undefined
          ? undefined
          : toCleanString(payload.telegramVerificationCode),

      telegramVerificationExpiresAt: toNullableDateForPrisma(
        payload.telegramVerificationExpiresAt
      ),

      telegramVerificationStartedAt: toNullableDateForPrisma(
        payload.telegramVerificationStartedAt
      ),

      telegramVerificationChatId:
        payload.telegramVerificationChatId === undefined
          ? undefined
          : toCleanString(payload.telegramVerificationChatId),

telegramVerificationUsername:
  payload.telegramVerificationUsername === undefined
    ? undefined
    : normalizeTelegramOrEmpty(payload.telegramVerificationUsername),

      telegramVerificationCodeConfirmedAt: toNullableDateForPrisma(
        payload.telegramVerificationCodeConfirmedAt
      ),

      telegramVerificationContactRequestedAt: toNullableDateForPrisma(
        payload.telegramVerificationContactRequestedAt
      ),
    },
  });

  return mapCustomer(customer);
}

async function clearTelegramVerificationDraft(id) {
  return updateCustomerTelegramVerification(id, {
    telegramVerificationCode: "",
    telegramVerificationExpiresAt: null,
    telegramVerificationStartedAt: null,
    telegramVerificationChatId: "",
    telegramVerificationUsername: "",
    telegramVerificationCodeConfirmedAt: null,
    telegramVerificationContactRequestedAt: null,
  });
}

async function getCustomersCount() {
  return prisma.customer.count();
}

module.exports = {
  normalizePhone,
  normalizeTelegram,

  mapCustomer,
  mapCustomerWithPassword,

  getCustomerById,
  getCustomerByPhone,
  getCustomerByTelegram,
  findCustomerByContact,

  createCustomer,
  updateCustomer,

  updateCustomerTelegramVerification,
  clearTelegramVerificationDraft,

  getCustomersCount,
};