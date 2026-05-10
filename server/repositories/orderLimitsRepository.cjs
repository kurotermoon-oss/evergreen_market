const prisma = require("../database/prisma.cjs");

function isFiniteLimit(value) {
  return Number.isFinite(Number(value));
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

function getStartOfToday() {
  const date = new Date();

  date.setHours(0, 0, 0, 0);

  return date;
}

function getDateBeforeMs(ms) {
  return new Date(Date.now() - Number(ms || 0));
}

function buildOrderOwnerConditions(identity = {}) {
  const conditions = [];

  const customerId = Number(identity.customerId);

  if (Number.isFinite(customerId) && customerId > 0) {
    conditions.push({
      customerId,
    });
  }

  const guestId = String(identity.guestId || "").trim();

  if (guestId) {
    conditions.push({
      guestId,
    });
  }

  const phone = normalizePhone(identity.phone);

  if (phone) {
    conditions.push({
      customerPhone: phone,
    });
  }

  const telegram = normalizeTelegram(identity.telegram);

  if (telegram) {
    conditions.push({
      customerTelegram: telegram,
    });

    conditions.push({
      customerTelegram: `@${telegram}`,
    });
  }

  return conditions;
}

function buildLimitResponse({
  ok = false,
  status = 429,
  error = "ORDER_LIMIT",
  message,
  hint = "",
}) {
  return {
    ok,
    status,
    error,
    message,
    hint,
  };
}

async function checkPostgresOrderRateLimit(identity = {}, limits = {}) {
  const ownerConditions = buildOrderOwnerConditions(identity);

  if (!ownerConditions.length) {
    return {
      ok: true,
    };
  }

  const now = Date.now();

  if (isFiniteLimit(limits.maxActiveOrders)) {
    const activeOrdersCount = await prisma.order.count({
      where: {
        OR: ownerConditions,
        isFinal: false,
      },
    });

    if (activeOrdersCount >= Number(limits.maxActiveOrders)) {
      return buildLimitResponse({
        message: `У вас вже є активні замовлення. Максимум активних замовлень: ${limits.maxActiveOrders}.`,
        hint: "Дочекайтесь завершення попереднього замовлення або звʼяжіться з кавʼярнею.",
      });
    }
  }

  if (isFiniteLimit(limits.maxOrdersPerDay)) {
    const todayOrdersCount = await prisma.order.count({
      where: {
        OR: ownerConditions,
        createdAt: {
          gte: getStartOfToday(),
        },
      },
    });

    if (todayOrdersCount >= Number(limits.maxOrdersPerDay)) {
      return buildLimitResponse({
        message: `Досягнуто денний ліміт замовлень: ${limits.maxOrdersPerDay}.`,
        hint: "Якщо вам потрібно оформити велике або повторне замовлення, напишіть нам у Telegram.",
      });
    }
  }

  if (isFiniteLimit(limits.cooldownMs) && Number(limits.cooldownMs) > 0) {
    const lastOrder = await prisma.order.findFirst({
      where: {
        OR: ownerConditions,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        createdAt: true,
      },
    });

    if (lastOrder?.createdAt) {
      const elapsedMs = now - new Date(lastOrder.createdAt).getTime();
      const cooldownMs = Number(limits.cooldownMs);

      if (elapsedMs < cooldownMs) {
        const secondsLeft = Math.ceil((cooldownMs - elapsedMs) / 1000);

        return buildLimitResponse({
          message: `Зачекайте ${secondsLeft} сек. перед наступним замовленням.`,
          hint: "Це захист від випадкових повторних замовлень і спаму.",
        });
      }
    }
  }

  const ip = String(identity.ip || "").trim();

  if (ip && isFiniteLimit(limits.maxIpOrders30Min)) {
    const ipOrdersCount = await prisma.order.count({
      where: {
        clientIp: ip,
        createdAt: {
          gte: getDateBeforeMs(30 * 60 * 1000),
        },
      },
    });

    if (ipOrdersCount >= Number(limits.maxIpOrders30Min)) {
      return buildLimitResponse({
        message: "З цієї мережі надто багато замовлень за короткий час.",
        hint: "Спробуйте трохи пізніше або звʼяжіться з нами напряму.",
      });
    }
  }

  return {
    ok: true,
  };
}

module.exports = {
  checkPostgresOrderRateLimit,
};