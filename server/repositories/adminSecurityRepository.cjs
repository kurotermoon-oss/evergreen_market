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

function getGuestKey(order) {
  if (order.guestId) return `guest:${order.guestId}`;
  if (order.customerPhone) return `phone:${normalizePhone(order.customerPhone)}`;
  if (order.customerTelegram) {
    return `telegram:${normalizeTelegram(order.customerTelegram)}`;
  }
  if (order.clientIp) return `ip:${order.clientIp}`;

  return `order:${order.id}`;
}

function calculateGuestRisk(group) {
  let score = 0;
  const reasons = [];

  if (group.ordersCount >= 3) {
    score += 2;
    reasons.push("Багато замовлень");
  }

  if (group.ordersTodayCount >= 3) {
    score += 2;
    reasons.push("Багато замовлень за сьогодні");
  }

  if (group.cancelledOrdersCount >= 2) {
    score += 3;
    reasons.push("Багато скасувань");
  }

  if (group.activeOrdersCount >= 2) {
    score += 2;
    reasons.push("Кілька активних замовлень");
  }

  if (group.uniquePhonesCount >= 2) {
    score += 2;
    reasons.push("Різні телефони");
  }

  if (group.uniqueTelegramsCount >= 2) {
    score += 2;
    reasons.push("Різні Telegram");
  }

  if (group.totalRevenue >= 2000) {
    score += 1;
    reasons.push("Велика сума замовлень");
  }

  if (score >= 6) {
    return {
      score,
      level: "high",
      label: "Високий ризик",
      reasons,
    };
  }

  if (score >= 3) {
    return {
      score,
      level: "medium",
      label: "Середній ризик",
      reasons,
    };
  }

  return {
    score,
    level: "low",
    label: "Низький ризик",
    reasons,
  };
}

function isToday(value) {
  if (!value) return false;

  const date = new Date(value);
  const now = new Date();

  if (!Number.isFinite(date.getTime())) return false;

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function mapOrderShort(order) {
  return {
    id: order.id,
    orderNumber: Number(order.orderNumber || 0),
    customerName: order.customerName || "",
    customerPhone: order.customerPhone || "",
    customerTelegram: order.customerTelegram || "",
    clientIp: order.clientIp || "",
    guestId: order.guestId || "",
    trustLevel: order.trustLevel || "guest",
    status: order.status || "",
    finalType: order.finalType || "",
    isFinal: Boolean(order.isFinal),
    total: Number(order.total || 0),
    createdAt: toIsoOrEmpty(order.createdAt),
    finalizedAt: toIsoOrEmpty(order.finalizedAt),
  };
}

function createEmptyGuestGroup(key, order) {
  return {
    key,

    guestId: order.guestId || "",
    clientIp: order.clientIp || "",

    names: new Set(),
    phones: new Set(),
    telegrams: new Set(),

    ordersCount: 0,
    ordersTodayCount: 0,
    activeOrdersCount: 0,
    completedOrdersCount: 0,
    cancelledOrdersCount: 0,

    totalRevenue: 0,
    completedRevenue: 0,

    firstOrderAt: "",
    lastOrderAt: "",

    orders: [],
  };
}

function finalizeGuestGroup(group, blockedItems = []) {
  const phones = Array.from(group.phones).filter(Boolean);
  const telegrams = Array.from(group.telegrams).filter(Boolean);
  const names = Array.from(group.names).filter(Boolean);

  const relatedBlockedItems = blockedItems.filter((item) => {
    const type = item.type;
    const value = String(item.value || "");

    if (type === "guestId" && value === group.guestId) return true;
    if (type === "ip" && value === group.clientIp) return true;

    if (type === "phone") {
      return phones.some((phone) => normalizePhone(phone) === normalizePhone(value));
    }

    if (type === "telegram") {
      return telegrams.some(
        (telegram) => normalizeTelegram(telegram) === normalizeTelegram(value)
      );
    }

    return false;
  });

  const result = {
    key: group.key,

    guestId: group.guestId,
    clientIp: group.clientIp,

    names,
    phones,
    telegrams,

    mainName: names[0] || "Гість",
    mainPhone: phones[0] || "",
    mainTelegram: telegrams[0] || "",

    uniquePhonesCount: phones.length,
    uniqueTelegramsCount: telegrams.length,

    ordersCount: group.ordersCount,
    ordersTodayCount: group.ordersTodayCount,
    activeOrdersCount: group.activeOrdersCount,
    completedOrdersCount: group.completedOrdersCount,
    cancelledOrdersCount: group.cancelledOrdersCount,

    totalRevenue: group.totalRevenue,
    completedRevenue: group.completedRevenue,

    firstOrderAt: group.firstOrderAt,
    lastOrderAt: group.lastOrderAt,

    isBlocked: relatedBlockedItems.length > 0,
    blockedItems: relatedBlockedItems,

    orders: group.orders,
  };

  return {
    ...result,
    risk: calculateGuestRisk(result),
  };
}

async function getBlockedCustomers() {
  return prisma.blockedCustomer.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

async function getGuestActivity() {
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        {
          customerId: null,
        },
        {
          trustLevel: "guest",
        },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const blockedItems = await getBlockedCustomers();
  const groups = new Map();

  for (const order of orders) {
    const key = getGuestKey(order);

    if (!groups.has(key)) {
      groups.set(key, createEmptyGuestGroup(key, order));
    }

    const group = groups.get(key);
    const createdAtIso = toIsoOrEmpty(order.createdAt);

    group.ordersCount += 1;

    if (isToday(order.createdAt)) {
      group.ordersTodayCount += 1;
    }

    if (!order.isFinal) {
      group.activeOrdersCount += 1;
    }

    const finalType = String(order.finalType || "").toLowerCase();
    const status = String(order.status || "").toLowerCase();

    const isCompleted =
      finalType === "completed" || status === "completed" || status === "видано";

    const isCancelled =
      finalType === "cancelled" ||
      finalType === "canceled" ||
      status === "cancelled" ||
      status === "canceled";

    if (isCompleted) {
      group.completedOrdersCount += 1;
      group.completedRevenue += Number(order.total || 0);
    }

    if (isCancelled) {
      group.cancelledOrdersCount += 1;
    }

    group.totalRevenue += Number(order.total || 0);

    if (order.customerName) group.names.add(order.customerName);
    if (order.customerPhone) group.phones.add(order.customerPhone);
    if (order.customerTelegram) group.telegrams.add(order.customerTelegram);

    if (!group.firstOrderAt || createdAtIso < group.firstOrderAt) {
      group.firstOrderAt = createdAtIso;
    }

    if (!group.lastOrderAt || createdAtIso > group.lastOrderAt) {
      group.lastOrderAt = createdAtIso;
    }

    group.orders.push(mapOrderShort(order));
  }

  return Array.from(groups.values())
    .map((group) => finalizeGuestGroup(group, blockedItems))
    .sort((a, b) => {
      if (b.risk.score !== a.risk.score) return b.risk.score - a.risk.score;
      return String(b.lastOrderAt).localeCompare(String(a.lastOrderAt));
    });
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

  const existing = await prisma.blockedCustomer.findFirst({
    where: {
      type,
      value,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.blockedCustomer.create({
    data: {
      type,
      value,
      reason,
    },
  });
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

module.exports = {
  getGuestActivity,
  getBlockedCustomers,
  createBlockedCustomer,
  deleteBlockedCustomer,
};