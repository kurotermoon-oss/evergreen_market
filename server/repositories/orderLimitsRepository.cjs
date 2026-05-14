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

function buildSpamSourceConditions(identity = {}) {
  const conditions = [];
  const customerId = Number(identity.customerId);
  const guestId = String(identity.guestId || "").trim();
  const ip = String(identity.ip || "").trim();

  if (Number.isFinite(customerId) && customerId > 0) {
    conditions.push({
      customerId,
    });
  }

  if (guestId) {
    conditions.push({
      guestId,
    });
  }

  if (ip) {
    conditions.push({
      clientIp: ip,
    });
  }

  return conditions;
}

function buildSpamBlockTargets(identity = {}, trustLevel) {
  const targets = [];
  const ip = String(identity.ip || "").trim();
  const guestId = String(identity.guestId || "").trim();
  const customerId = String(identity.customerId || "").trim();

  if (ip) {
    targets.push({
      type: "ip",
      value: ip,
    });
  }

  if (trustLevel === "guest" && guestId) {
    targets.push({
      type: "guestId",
      value: guestId,
    });
  }

  if (trustLevel === "registered_unverified" && customerId) {
    targets.push({
      type: "customerId",
      value: customerId,
    });
  }

  return targets;
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

async function checkPostgresOrderSpamRateLimit(
  identity = {},
  trustLevel = "guest",
  limits = {}
) {
  const sourceConditions = buildSpamSourceConditions(identity);
  const windowMs = Number(limits.windowMs || 0);
  const maxOrders = Number(limits.maxOrders || 0);

  if (!sourceConditions.length || !windowMs || !maxOrders) {
    return {
      ok: true,
    };
  }

  const recentOrdersCount = await prisma.order.count({
    where: {
      OR: sourceConditions,
      createdAt: {
        gte: getDateBeforeMs(windowMs),
      },
    },
  });

  if (recentOrdersCount < maxOrders) {
    return {
      ok: true,
    };
  }

  const blockTargets = limits.autoBlock
    ? buildSpamBlockTargets(identity, trustLevel)
    : [];

  return {
    ok: false,
    status: limits.autoBlock && blockTargets.length ? 403 : 429,
    error:
      limits.autoBlock && blockTargets.length
        ? "CUSTOMER_BLOCKED"
        : "ORDER_SPAM_LIMIT",
    message:
      "Замовлення тимчасово обмежено через надто часті спроби оформлення.",
    hint:
      limits.autoBlock && blockTargets.length
        ? "Джерело запиту автоматично додано до блокувань як спам. Якщо це реальне замовлення, зв’яжіться з кав’ярнею напряму."
        : "Спробуйте ще раз трохи пізніше.",
    reason: `Автоблок: ${recentOrdersCount} замовлень за ${Math.round(
      windowMs / 1000
    )} секунд.`,
    blockTargets,
  };
}

module.exports = {
  checkPostgresOrderRateLimit,
  checkPostgresOrderSpamRateLimit,
};
