const crypto = require("crypto");

const { normalizePhone, normalizeTelegram } = require("./customerAuth.cjs");
const { buildCookieOptions } = require("./runtimeSecurity.cjs");

const GUEST_COOKIE_NAME = "guest_token";

const TRUST_LEVELS = {
  GUEST: "guest",
  REGISTERED_UNVERIFIED: "registered_unverified",
  REGISTERED_VERIFIED: "registered_verified",
};

const ORDER_LIMITS_BY_TRUST = {
  [TRUST_LEVELS.GUEST]: {
    label: "Гість",
    businessLimitsEnabled: true,

    maxDifferentItems: 50,
    maxOneProductQuantity: 15,
    maxTotalQuantity: 50,
    minTotal: 25,

    cooldownMs: 60 * 1000,
    maxActiveOrders: 3,
    maxOrdersPerDay: 8,
    maxIpOrders30Min: 12,
  },

  [TRUST_LEVELS.REGISTERED_UNVERIFIED]: {
    label: "Зареєстрований клієнт",
    businessLimitsEnabled: true,

    maxDifferentItems: 70,
    maxOneProductQuantity: Infinity,
    maxTotalQuantity: 70,
    minTotal: 25,

    cooldownMs: 20 * 1000,
    maxActiveOrders: 8,
    maxOrdersPerDay: 25,
    maxIpOrders30Min: 30,
  },

  [TRUST_LEVELS.REGISTERED_VERIFIED]: {
    label: "Підтверджений клієнт",
    businessLimitsEnabled: false,

    maxDifferentItems: Infinity,
    maxOneProductQuantity: Infinity,
    maxTotalQuantity: Infinity,
    minTotal: 0,

    cooldownMs: 0,
    maxActiveOrders: Infinity,
    maxOrdersPerDay: Infinity,

    // Техническая защита от сломанного клиента/бота, не бизнес-ограничение
    maxIpOrders30Min: 100,
  },
};

const ORDER_SPAM_LIMITS_BY_TRUST = {
  [TRUST_LEVELS.GUEST]: {
    windowMs: 60 * 1000,
    maxOrders: 10,
    autoBlock: true,
  },

  [TRUST_LEVELS.REGISTERED_UNVERIFIED]: {
    windowMs: 60 * 1000,
    maxOrders: 15,
    autoBlock: true,
  },

  [TRUST_LEVELS.REGISTERED_VERIFIED]: {
    windowMs: 60 * 1000,
    maxOrders: 30,
    autoBlock: false,
  },
};

function toCleanString(value) {
  return String(value || "").trim();
}

function getClientIp(req) {
  return (
    req.ip ||
    req.socket?.remoteAddress ||
    req.connection?.remoteAddress ||
    "unknown"
  );
}

function createGuestId() {
  return `guest_${crypto.randomBytes(16).toString("hex")}`;
}

function getOrCreateGuestId(req, res) {
  const existingGuestId = toCleanString(req.cookies?.[GUEST_COOKIE_NAME]);

  if (existingGuestId) {
    return existingGuestId;
  }

  const guestId = createGuestId();

  res.cookie(
    GUEST_COOKIE_NAME,
    guestId,
    buildCookieOptions(180 * 24 * 60 * 60 * 1000)
  );

  return guestId;
}

function isCustomerVerified(customer) {
  return Boolean(customer?.phoneVerifiedAt && customer?.telegramVerifiedAt);
}


function getOrderTrustLevel(customer) {
  if (!customer) {
    return TRUST_LEVELS.GUEST;
  }

  if (isCustomerVerified(customer)) {
    return TRUST_LEVELS.REGISTERED_VERIFIED;
  }

  return TRUST_LEVELS.REGISTERED_UNVERIFIED;
}

function getOrderLimits(trustLevel) {
  return (
    ORDER_LIMITS_BY_TRUST[trustLevel] ||
    ORDER_LIMITS_BY_TRUST[TRUST_LEVELS.GUEST]
  );
}

function getOrderSpamLimits(trustLevel) {
  return (
    ORDER_SPAM_LIMITS_BY_TRUST[trustLevel] ||
    ORDER_SPAM_LIMITS_BY_TRUST[TRUST_LEVELS.GUEST]
  );
}

function getTrustLimitHint(trustLevel) {
  if (trustLevel === TRUST_LEVELS.GUEST) {
    return "Ви оформлюєте замовлення як гість. Щоб отримати мʼякші ліміти, увійдіть або створіть акаунт. Після підтвердження Telegram обмеження будуть ще нижчими.";
  }

  if (trustLevel === TRUST_LEVELS.REGISTERED_UNVERIFIED) {
    return "Ваш акаунт ще не підтверджений. Щоб зняти більшість обмежень, підтвердіть Telegram у кабінеті.";
  }

  return "Якщо це реальне замовлення, але сайт його обмежує, звʼяжіться з нами напряму в Telegram.";
}

function isFiniteLimit(value) {
  return Number.isFinite(Number(value));
}

function buildSecurityError({
  status = 400,
  error = "VALIDATION_ERROR",
  field = "cart",
  message,
  hint = "",
}) {
  return {
    ok: false,
    status,
    error,
    message,
    hint,
    errors: {
      [field]: message,
    },
  };
}


function normalizeOrderStatus(status) {
  const aliases = {
    Новий: "new",
    Нове: "new",
    Підтверджено: "confirmed",
    Готується: "preparing",
    Готово: "ready",
    "Готово до видачі": "ready",
    Завершено: "completed",
    Видано: "completed",
    Скасовано: "canceled",
    canceled: "canceled",
    cancelled: "canceled",
  };

  return aliases[status] || String(status || "").toLowerCase();
}

function isActiveOrder(order) {
  if (order.isFinal) {
    return false;
  }

  const status = normalizeOrderStatus(order.status);

  return !["completed", "canceled", "cancelled"].includes(status);
}

function getOrderIdentity(order) {
  return {
    customerId: order.customerId ? String(order.customerId) : "",
    guestId: order.guestId ? String(order.guestId) : "",
    phone: normalizePhone(order.customerPhone || ""),
    telegram: normalizeTelegram(order.customerTelegram || ""),
    ip: String(order.clientIp || ""),
  };
}

function buildSpamBlockTargets(identity = {}, trustLevel) {
  const targets = [];
  const ip = toCleanString(identity.ip);
  const guestId = toCleanString(identity.guestId);
  const customerId = toCleanString(identity.customerId);

  if (ip) {
    targets.push({
      type: "ip",
      value: ip,
    });
  }

  if (trustLevel === TRUST_LEVELS.GUEST && guestId) {
    targets.push({
      type: "guestId",
      value: guestId,
    });
  }

  if (trustLevel === TRUST_LEVELS.REGISTERED_UNVERIFIED && customerId) {
    targets.push({
      type: "customerId",
      value: customerId,
    });
  }

  return targets;
}

function orderMatchesSpamIdentity(order, identity = {}) {
  const orderIdentity = getOrderIdentity(order);

  return (
    (identity.ip && orderIdentity.ip === identity.ip) ||
    (identity.guestId && orderIdentity.guestId === identity.guestId) ||
    (identity.customerId &&
      orderIdentity.customerId === String(identity.customerId))
  );
}

function buildSpamLimitResult(identity, trustLevel, limits, recentOrdersCount) {
  const autoBlock = Boolean(limits.autoBlock);
  const blockTargets = autoBlock
    ? buildSpamBlockTargets(identity, trustLevel)
    : [];

  return {
    ok: false,
    status: autoBlock && blockTargets.length ? 403 : 429,
    error: autoBlock && blockTargets.length ? "CUSTOMER_BLOCKED" : "ORDER_SPAM_LIMIT",
    message:
      "Замовлення тимчасово обмежено через надто часті спроби оформлення.",
    hint: autoBlock
      ? "Джерело запиту автоматично додано до блокувань як спам. Якщо це реальне замовлення, зв’яжіться з кав’ярнею напряму."
      : "Спробуйте ще раз трохи пізніше.",
    reason: `Автоблок: ${recentOrdersCount} замовлень за ${Math.round(
      limits.windowMs / 1000
    )} секунд.`,
    blockTargets,
  };
}

function checkOrderSpamRateLimit(orders = [], identity = {}, trustLevel) {
  const limits = getOrderSpamLimits(trustLevel);
  const windowMs = Number(limits.windowMs || 0);
  const maxOrders = Number(limits.maxOrders || 0);

  if (!windowMs || !maxOrders) {
    return {
      ok: true,
    };
  }

  const since = Date.now() - windowMs;
  const recentOrdersCount = (Array.isArray(orders) ? orders : []).filter(
    (order) => {
      const createdAt = new Date(order.createdAt || "").getTime();

      return (
        Number.isFinite(createdAt) &&
        createdAt >= since &&
        orderMatchesSpamIdentity(order, identity)
      );
    }
  ).length;

  if (recentOrdersCount >= maxOrders) {
    return buildSpamLimitResult(identity, trustLevel, limits, recentOrdersCount);
  }

  return {
    ok: true,
  };
}

function getNormalizedRawItems(items = []) {
  const itemsByProduct = {};

  if (!Array.isArray(items)) {
    return [];
  }

  items.forEach((item) => {
    const productId = item.id ?? item.productId;
    const quantity = Math.max(1, Number(item.quantity) || 1);

    if (!productId) return;

    const key = String(productId);

    if (!itemsByProduct[key]) {
      itemsByProduct[key] = {
        id: productId,
        quantity: 0,
      };
    }

    itemsByProduct[key].quantity += quantity;
  });

  return Object.values(itemsByProduct);
}

function validateRawOrderItems(items = [], limits) {
  const normalizedItems = getNormalizedRawItems(items);

  if (!normalizedItems.length) {
    return buildSecurityError({
      error: "EMPTY_CART",
      message: "Кошик порожній.",
      hint: "Додайте хоча б один товар перед оформленням замовлення.",
    });
  }

  if (limits.businessLimitsEnabled === false) {
    return {
      ok: true,
      errors: {},
      items: normalizedItems,
    };
  }

  if (
    isFiniteLimit(limits.maxDifferentItems) &&
    normalizedItems.length > limits.maxDifferentItems
  ) {
    return buildSecurityError({
      error: "TOO_MANY_DIFFERENT_ITEMS",
      message: `У замовленні забагато різних товарів. Максимум — ${limits.maxDifferentItems}.`,
      hint: "Зменште кількість різних позицій у кошику або оформіть частину товарів окремим замовленням.",
    });
  }

  const totalQuantity = normalizedItems.reduce((sum, item) => {
    return sum + Number(item.quantity || 0);
  }, 0);

  if (
    isFiniteLimit(limits.maxTotalQuantity) &&
    totalQuantity > limits.maxTotalQuantity
  ) {
    return buildSecurityError({
      error: "TOO_MANY_TOTAL_ITEMS",
      message: `У замовленні забагато товарів. Максимум — ${limits.maxTotalQuantity} одиниць.`,
      hint: "Зменште загальну кількість товарів у кошику.",
    });
  }

  const tooLargeItem = normalizedItems.find((item) => {
    return (
      isFiniteLimit(limits.maxOneProductQuantity) &&
      Number(item.quantity || 0) > limits.maxOneProductQuantity
    );
  });

  if (tooLargeItem) {
    return buildSecurityError({
      error: "TOO_MANY_ONE_PRODUCT",
      message: `Одного товару можна додати не більше ${limits.maxOneProductQuantity} шт.`,
      hint: "Це обмеження захищає кавʼярню від помилкових або спамних замовлень. Для великого замовлення звʼяжіться з нами напряму.",
    });
  }

  return {
    ok: true,
    errors: {},
    items: normalizedItems,
  };
}


function validateResolvedOrderItems(orderItems = [], total = 0, limits) {
  if (!orderItems.length) {
    return buildSecurityError({
      error: "NO_AVAILABLE_ITEMS",
      message: "У замовленні немає доступних товарів.",
      hint: "Можливо, товар був прихований або закінчився. Оновіть сторінку та перевірте кошик.",
    });
  }

  if (
    limits.businessLimitsEnabled !== false &&
    Number(total || 0) < limits.minTotal
  ) {
    return buildSecurityError({
      error: "MIN_ORDER_TOTAL",
      message: `Мінімальна сума замовлення — ${limits.minTotal} грн.`,
      hint: "Додайте ще один товар до кошика, щоб оформити замовлення.",
    });
  }

  return {
    ok: true,
    errors: {},
  };
}

function checkOrderRateLimit(db, identity, trustLevel) {
  const limits = getOrderLimits(trustLevel);
  const now = Date.now();
  const orders = Array.isArray(db.orders) ? db.orders : [];

  const relatedOrders = orders.filter((order) => {
    const orderIdentity = getOrderIdentity(order);

    const sameCustomer =
      identity.customerId && orderIdentity.customerId === identity.customerId;

    const sameGuest =
      identity.guestId && orderIdentity.guestId === identity.guestId;

    const samePhone =
      identity.phone && orderIdentity.phone === identity.phone;

    const sameTelegram =
      identity.telegram && orderIdentity.telegram === identity.telegram;

    return sameCustomer || sameGuest || samePhone || sameTelegram;
  });

  const lastOrder = relatedOrders
    .filter((order) => order.createdAt)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

  if (lastOrder) {
    const lastOrderTime = new Date(lastOrder.createdAt).getTime();

    if (
      Number(limits.cooldownMs || 0) > 0 &&
      Number.isFinite(lastOrderTime) &&
      now - lastOrderTime < limits.cooldownMs
    ) {
      return {
        ok: false,
        status: 429,
        error: "ORDER_TOO_FAST",
        message: "Замовлення створюються занадто часто.",
        hint:
          trustLevel === TRUST_LEVELS.GUEST
            ? "Зачекайте трохи перед наступним замовленням. Якщо ви часто замовляєте у нас, створіть акаунт — для зареєстрованих клієнтів ліміти мʼякші."
            : getTrustLimitHint(trustLevel),
      };
    }
  }

  const activeOrdersCount = relatedOrders.filter(isActiveOrder).length;

  if (
    isFiniteLimit(limits.maxActiveOrders) &&
    activeOrdersCount >= limits.maxActiveOrders
  ) {
    return {
      ok: false,
      status: 429,
      error: "TOO_MANY_ACTIVE_ORDERS",
      message:
        trustLevel === TRUST_LEVELS.GUEST
          ? "У вас вже є кілька активних гостьових замовлень."
          : "У вас вже є кілька активних замовлень.",
      hint:
        trustLevel === TRUST_LEVELS.GUEST
          ? "Дочекайтесь підтвердження попереднього замовлення або увійдіть в акаунт. Зареєстровані клієнти мають мʼякші обмеження."
          : getTrustLimitHint(trustLevel),
    };
  }

  const dayAgo = now - 24 * 60 * 60 * 1000;

  const todayOrdersCount = relatedOrders.filter((order) => {
    const createdAt = new Date(order.createdAt || "").getTime();

    return Number.isFinite(createdAt) && createdAt >= dayAgo;
  }).length;

  if (
    isFiniteLimit(limits.maxOrdersPerDay) &&
    todayOrdersCount >= limits.maxOrdersPerDay
  ) {
    return {
      ok: false,
      status: 429,
      error: "DAILY_ORDER_LIMIT",
      message:
        trustLevel === TRUST_LEVELS.GUEST
          ? "Досягнуто денний ліміт замовлень для гостя."
          : "Досягнуто денний ліміт замовлень для непідтвердженого акаунта.",
      hint: getTrustLimitHint(trustLevel),
    };
  }

  const thirtyMinutesAgo = now - 30 * 60 * 1000;

  const ipOrdersCount = orders.filter((order) => {
    const createdAt = new Date(order.createdAt || "").getTime();

    return (
      identity.ip &&
      String(order.clientIp || "") === identity.ip &&
      Number.isFinite(createdAt) &&
      createdAt >= thirtyMinutesAgo
    );
  }).length;

  if (
    isFiniteLimit(limits.maxIpOrders30Min) &&
    ipOrdersCount >= limits.maxIpOrders30Min
  ) {
    return {
      ok: false,
      status: 429,
      error: "IP_ORDER_LIMIT",
      message: "З цієї мережі створено забагато замовлень.",
      hint: "Спробуйте пізніше або звʼяжіться з нами напряму, якщо це реальне замовлення.",
    };
  }

  return {
    ok: true,
  };
}

module.exports = {
  TRUST_LEVELS,

  getClientIp,
  getOrCreateGuestId,

  getOrderTrustLevel,
  getOrderLimits,
  getOrderSpamLimits,

  getNormalizedRawItems,
  validateRawOrderItems,
  validateResolvedOrderItems,
  checkOrderSpamRateLimit,
  checkOrderRateLimit,
};
