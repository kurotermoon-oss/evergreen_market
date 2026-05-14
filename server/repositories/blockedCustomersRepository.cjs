const prisma = require("../database/prisma.cjs");

function toCleanString(value) {
  return String(value || "").trim();
}

function normalizePhone(value) {
  return String(value || "")
    .replace(/[^\d+]/g, "")
    .trim();
}

function normalizeTelegram(value) {
  return String(value || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}

function buildBlockedValues(identity = {}) {
  const values = [];

  const customerId = toCleanString(identity.customerId);

  if (customerId) {
    values.push({
      type: "customerId",
      value: customerId,
    });
  }

  const guestId = toCleanString(identity.guestId);

  if (guestId) {
    values.push({
      type: "guestId",
      value: guestId,
    });
  }

  const phone = normalizePhone(identity.phone);

  if (phone) {
    values.push({
      type: "phone",
      value: phone,
    });
  }

  const telegram = normalizeTelegram(identity.telegram);

  if (telegram) {
    values.push({
      type: "telegram",
      value: telegram,
    });

    values.push({
      type: "telegram",
      value: `@${telegram}`,
    });
  }

  const ip = toCleanString(identity.ip);

  if (ip) {
    values.push({
      type: "ip",
      value: ip,
    });
  }

  return values;
}

async function findBlockedCustomer(identity = {}) {
  const blockedValues = buildBlockedValues(identity);

  if (!blockedValues.length) return null;

  const blockedCustomer = await prisma.blockedCustomer.findFirst({
    where: {
      OR: blockedValues.map((item) => ({
        type: item.type,
        value: item.value,
      })),
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return blockedCustomer;
}

async function assertCustomerNotBlocked(identity = {}) {
  const blockedCustomer = await findBlockedCustomer(identity);

  if (!blockedCustomer) {
    return {
      ok: true,
    };
  }

  return {
    ok: false,
    status: 403,
    error: "CUSTOMER_BLOCKED",
    message:
      "Ми не можемо оформити це замовлення автоматично. Будь ласка, звʼяжіться з кавʼярнею напряму.",
    hint: blockedCustomer.reason || "Замовлення обмежено адміністратором.",
    blockedCustomer,
  };
}

async function createBlockedCustomer(payload = {}) {
  const type = toCleanString(payload.type);
  let value = toCleanString(payload.value);
  const reason = toCleanString(payload.reason);

  if (!type || !value) {
    return null;
  }

  if (type === "phone") {
    value = normalizePhone(value);
  }

  if (type === "telegram") {
    value = normalizeTelegram(value);
  }

  const existing = await prisma.blockedCustomer.findFirst({
    where: {
      type,
      value,
    },
  });

  if (existing) {
    return existing;
  }

  try {
    return await prisma.blockedCustomer.create({
      data: {
        type,
        value,
        reason,
      },
    });
  } catch (error) {
    if (error.code === "P2002") {
      return prisma.blockedCustomer.findFirst({
        where: {
          type,
          value,
        },
      });
    }

    throw error;
  }
}

async function createBlockedCustomers(items = [], reason = "") {
  const blockedCustomers = [];

  for (const item of items) {
    const blockedCustomer = await createBlockedCustomer({
      ...item,
      reason,
    });

    if (blockedCustomer) {
      blockedCustomers.push(blockedCustomer);
    }
  }

  return blockedCustomers;
}

module.exports = {
  findBlockedCustomer,
  assertCustomerNotBlocked,
  createBlockedCustomer,
  createBlockedCustomers,
};
