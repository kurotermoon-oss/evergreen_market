const prisma = require("../database/prisma.cjs");

function toIsoOrEmpty(value) {
  if (!value) return "";

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) return "";

  return date.toISOString();
}

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

function mapCustomer(customer, stats = {}, blockedItems = []) {
  const phone = customer.phone || "";
  const telegram = customer.telegram || "";

  const isBlocked = blockedItems.some((item) => {
    if (item.type === "customerId" && String(item.value) === String(customer.id)) {
      return true;
    }

    if (item.type === "phone" && normalizePhone(item.value) === normalizePhone(phone)) {
      return true;
    }

    if (
      item.type === "telegram" &&
      normalizeTelegram(item.value) === normalizeTelegram(telegram)
    ) {
      return true;
    }

    return false;
  });

  return {
    id: customer.id,
    name: customer.name || "",
    phone,
    telegram,

    building: customer.building || "",
    entrance: customer.entrance || "",
    floor: customer.floor || "",
    apartment: customer.apartment || "",

    telegramChatId: customer.telegramChatId || "",
    telegramVerifiedAt: toIsoOrEmpty(customer.telegramVerifiedAt),
    phoneVerifiedAt: toIsoOrEmpty(customer.phoneVerifiedAt),

    createdAt: toIsoOrEmpty(customer.createdAt),
    updatedAt: toIsoOrEmpty(customer.updatedAt),

    isTelegramVerified: Boolean(customer.telegramVerifiedAt),
    isPhoneVerified: Boolean(customer.phoneVerifiedAt),
    isFullyVerified: Boolean(customer.telegramVerifiedAt && customer.phoneVerifiedAt),

    isBlocked,
    blockedItems: blockedItems.filter((item) => {
      return (
        (item.type === "customerId" && String(item.value) === String(customer.id)) ||
        (item.type === "phone" && normalizePhone(item.value) === normalizePhone(phone)) ||
        (item.type === "telegram" &&
          normalizeTelegram(item.value) === normalizeTelegram(telegram))
      );
    }),

    ordersCount: Number(stats.ordersCount || 0),
    activeOrdersCount: Number(stats.activeOrdersCount || 0),
    completedOrdersCount: Number(stats.completedOrdersCount || 0),
    cancelledOrdersCount: Number(stats.cancelledOrdersCount || 0),
    completedRevenue: Number(stats.completedRevenue || 0),
    lastOrderAt: stats.lastOrderAt || "",
  };
}

async function getCustomerStats(customerIds = []) {
  const statsByCustomerId = new Map();

  for (const customerId of customerIds) {
    statsByCustomerId.set(Number(customerId), {
      ordersCount: 0,
      activeOrdersCount: 0,
      completedOrdersCount: 0,
      cancelledOrdersCount: 0,
      completedRevenue: 0,
      lastOrderAt: "",
    });
  }

  if (!customerIds.length) {
    return statsByCustomerId;
  }

  const orders = await prisma.order.findMany({
    where: {
      customerId: {
        in: customerIds,
      },
    },
    select: {
      customerId: true,
      total: true,
      isFinal: true,
      finalType: true,
      status: true,
      createdAt: true,
      finalizedAt: true,
    },
  });

  for (const order of orders) {
    if (!order.customerId) continue;

    const stats = statsByCustomerId.get(Number(order.customerId));

    if (!stats) continue;

    const finalType = String(order.finalType || "").toLowerCase();
    const status = String(order.status || "").toLowerCase();

    const isCompleted =
      finalType === "completed" ||
      status === "completed" ||
      status === "видано";

    const isCancelled =
      finalType === "cancelled" ||
      finalType === "canceled" ||
      status === "cancelled" ||
      status === "canceled";

    stats.ordersCount += 1;

    if (!order.isFinal) {
      stats.activeOrdersCount += 1;
    }

    if (isCompleted) {
      stats.completedOrdersCount += 1;
      stats.completedRevenue += Number(order.total || 0);
    }

    if (isCancelled) {
      stats.cancelledOrdersCount += 1;
    }

    const orderDate = order.finalizedAt || order.createdAt;

    if (orderDate) {
      const iso = toIsoOrEmpty(orderDate);

      if (!stats.lastOrderAt || iso > stats.lastOrderAt) {
        stats.lastOrderAt = iso;
      }
    }
  }

  return statsByCustomerId;
}

async function getRelevantBlockedItems(customers = []) {
  const or = [];

  for (const customer of customers) {
    or.push({
      type: "customerId",
      value: String(customer.id),
    });

    if (customer.phone) {
      or.push({
        type: "phone",
        value: customer.phone,
      });
    }

    if (customer.telegram) {
      or.push({
        type: "telegram",
        value: customer.telegram,
      });

      or.push({
        type: "telegram",
        value: `@${customer.telegram}`,
      });
    }
  }

  if (!or.length) return [];

  return prisma.blockedCustomer.findMany({
    where: {
      OR: or,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

async function getAdminCustomers({ search = "" } = {}) {
  const cleanSearch = toCleanString(search);

  const where = cleanSearch
    ? {
        OR: [
          {
            name: {
              contains: cleanSearch,
              mode: "insensitive",
            },
          },
          {
            phone: {
              contains: cleanSearch,
              mode: "insensitive",
            },
          },
          {
            telegram: {
              contains: normalizeTelegram(cleanSearch),
              mode: "insensitive",
            },
          },
        ],
      }
    : {};

  const customers = await prisma.customer.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
  });

  const customerIds = customers.map((customer) => customer.id);
  const statsByCustomerId = await getCustomerStats(customerIds);
  const blockedItems = await getRelevantBlockedItems(customers);

  return customers.map((customer) => {
    return mapCustomer(
      customer,
      statsByCustomerId.get(Number(customer.id)),
      blockedItems
    );
  });
}

async function getCustomerOrders(customerId) {
  const id = Number(customerId);

  if (!Number.isFinite(id)) {
    const error = new Error("Клієнта не знайдено.");
    error.status = 404;
    throw error;
  }

  const orders = await prisma.order.findMany({
    where: {
      customerId: id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      items: {
        orderBy: {
          id: "asc",
        },
      },
      statusHistory: {
        orderBy: {
          at: "asc",
        },
      },
    },
  });

  return orders;
}

async function createBlockedCustomer(payload = {}) {
  const type = toCleanString(payload.type);
  let value = toCleanString(payload.value);
  const reason = toCleanString(payload.reason);

  if (!type || !value) {
    const error = new Error("Тип і значення блокування обовʼязкові.");
    error.status = 400;
    throw error;
  }

  if (type === "phone") {
    value = normalizePhone(value);
  }

  if (type === "telegram") {
    value = normalizeTelegram(value);
  }

  const blockedCustomer = await prisma.blockedCustomer.create({
    data: {
      type,
      value,
      reason,
    },
  });

  return blockedCustomer;
}

async function deleteBlockedCustomer(id) {
  const blockedId = Number(id);

  if (!Number.isFinite(blockedId)) {
    const error = new Error("Блокування не знайдено.");
    error.status = 404;
    throw error;
  }

  await prisma.blockedCustomer.delete({
    where: {
      id: blockedId,
    },
  });
}

async function getBlockedCustomers() {
  return prisma.blockedCustomer.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

module.exports = {
  getAdminCustomers,
  getCustomerOrders,

  getBlockedCustomers,
  createBlockedCustomer,
  deleteBlockedCustomer,
};