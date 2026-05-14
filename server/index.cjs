const path = require("path");
const fs = require("fs");
require("dotenv").config();

const jwt = require("jsonwebtoken");
const customersRepository = require("./repositories/customersRepository.cjs");

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const {
  createCorsOptions,
  applySecurityHeaders,
  createRateLimiter,
  getRequestIp,
} = require("./httpSecurity.cjs");
const { getJwtSecret } = require("./runtimeSecurity.cjs");
const {
  getTelegramVerificationStatus,
  startTelegramVerification,
  checkTelegramVerification,
} = require("./telegramVerification.cjs");


const settingsRepository = require("./repositories/settingsRepository.cjs");
const productsRepository = require("./repositories/productsRepository.cjs");
const categoriesRepository = require("./repositories/categoriesRepository.cjs");
const ordersRepository = require("./repositories/ordersRepository.cjs");
const orderLimitsRepository = require("./repositories/orderLimitsRepository.cjs");
const blockedCustomersRepository = require("./repositories/blockedCustomersRepository.cjs");


const {
  ORDER_STATUS,
  PAYMENT_STATUS,
  applyOrderAction,
} = require("./orderWorkflow.cjs");

const {
  syncCustomerTelegramChats,
  notifyCustomerOrderReady,
} = require("./telegramCustomerNotify.cjs");

const adminAuthRoutes = require("./routes/adminAuth.routes.cjs");
const adminAnalyticsRoutes = require("./routes/adminAnalytics.routes.cjs");
const adminCustomersRoutes = require("./routes/adminCustomers.routes.cjs");
const adminSecurityRoutes = require("./routes/adminSecurity.routes.cjs");
const adminUploadsRoutes = require("./routes/adminUploads.routes.cjs");


const uploadsRoutes = require("./routes/uploads.routes.cjs");


const { requireAdmin } = require("./middleware/adminAuth.cjs");

const { readDatabase, writeDatabase } = require("./db.cjs");
const { formatOrderMessage } = require("./orderMessage.cjs");

const {
  ensureCategoriesStore,
  sanitizePublicCategory,
  createSubcategory,
  findCategory,
  findSubcategory,
  normalizeName,
  subcategoryNameExists,
  getSubcategoryProductCount,
  resolveProductCategory,
} = require("./services/category.service.cjs");

const {
  sanitizePublicProduct,
  sanitizeOrderForCustomer,
} = require("./utils/sanitize.cjs");

const {
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
} = require("./customerAuth.cjs");

const {
  getClientIp,
  getOrCreateGuestId,
  getOrderTrustLevel,
  getOrderLimits,
  getOrderSpamLimits,
  validateRawOrderItems,
  validateResolvedOrderItems,
  checkOrderSpamRateLimit,
  checkOrderRateLimit,
} = require("./orderSecurity.cjs");


const app = express();


const JWT_SECRET = getJwtSecret();
const USE_POSTGRES = process.env.USE_POSTGRES === "true";
const customerLoginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyPrefix: "customer-login",
  keyGenerator(req) {
    const login = String(req.body?.login || "").trim().toLowerCase();

    return `${getRequestIp(req)}:${login}`;
  },
  message: "Забагато спроб входу. Спробуйте ще раз пізніше.",
});

async function getPostgresCustomerFromRequest(req) {
  const token = req.cookies?.customer_token;

  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (payload.role !== "customer") return null;

    const customerId = payload.customerId || payload.id || payload.sub;

    if (!customerId) return null;

    return await customersRepository.getCustomerById(customerId);
  } catch {
    return null;
  }
}

function sanitizePostgresCustomer(customer) {
  if (!customer) return null;

  const {
    passwordHash,
    telegramVerificationCode,
    telegramVerificationExpiresAt,
    telegramVerificationStartedAt,
    telegramVerificationChatId,
    telegramVerificationUsername,
    telegramVerificationCodeConfirmedAt,
    telegramVerificationContactRequestedAt,
    ...safeCustomer
  } = customer;

  return safeCustomer;
}


function getTelegramVerificationPayload(customer) {
  return {
    telegram: customer.telegram,

    telegramChatId: customer.telegramChatId || "",
    telegramVerifiedAt: customer.telegramVerifiedAt || null,
    phoneVerifiedAt: customer.phoneVerifiedAt || null,

    telegramVerificationCode: customer.telegramVerificationCode || "",
    telegramVerificationExpiresAt:
      customer.telegramVerificationExpiresAt || null,
    telegramVerificationStartedAt:
      customer.telegramVerificationStartedAt || null,
    telegramVerificationChatId:
      customer.telegramVerificationChatId || "",
    telegramVerificationUsername:
      customer.telegramVerificationUsername || "",
    telegramVerificationCodeConfirmedAt:
      customer.telegramVerificationCodeConfirmedAt || null,
    telegramVerificationContactRequestedAt:
      customer.telegramVerificationContactRequestedAt || null,
  };
}


function buildDuplicateCustomerErrors(error, payload = {}) {
  const message = error?.message || "";

  if (!message.includes("вже існує")) {
    return {};
  }

  const errors = {};

  if (payload.phone) {
    errors.phone = "Користувач з таким телефоном вже існує";
  }

  if (payload.telegram) {
    errors.telegram = "Користувач з таким Telegram вже існує";
  }

  return errors;
}




const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const DEFAULT_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop";
const DEFAULT_PAYMENT_METHOD = "Після підтвердження";

const STOCK_STATUSES = new Set([
  "in_stock",
  "limited",
  "preorder",
  "out_of_stock",
]);

function toCleanString(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function normalizeOrderSingleLine(value, maxLength = 80) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeOrderComment(value) {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]+/g, " ")
    .trim()
    .slice(0, 500);
}

function normalizeOrderForm(form = {}) {
  return {
    ...form,
    name: normalizeOrderSingleLine(form.name, 60),
    phone: toCleanString(form.phone),
    telegram: toCleanString(form.telegram),
    building: normalizeOrderSingleLine(form.building, 40),
    entrance: normalizeOrderSingleLine(form.entrance, 20),
    floor: normalizeOrderSingleLine(form.floor, 20),
    apartment: normalizeOrderSingleLine(form.apartment, 20),
    comment: normalizeOrderComment(form.comment),
  };
}

function ensureBlockedCustomersStore(db) {
  if (!Array.isArray(db.blockedCustomers)) {
    db.blockedCustomers = [];
  }

  if (!Number.isFinite(Number(db.nextBlockedCustomerId))) {
    db.nextBlockedCustomerId = 1;
  }
}

function normalizeBlockedValue(type, value) {
  if (type === "phone") {
    return normalizePhone(value);
  }

  if (type === "telegram") {
    return normalizeTelegram(value);
  }

  return toCleanString(value);
}

function buildLocalBlockedValues(identity = {}) {
  const values = [];

  [
    ["customerId", identity.customerId],
    ["guestId", identity.guestId],
    ["phone", identity.phone],
    ["telegram", identity.telegram],
    ["ip", identity.ip],
  ].forEach(([type, rawValue]) => {
    const value = normalizeBlockedValue(type, rawValue);

    if (!value) return;

    values.push({
      type,
      value,
    });

    if (type === "telegram") {
      values.push({
        type,
        value: `@${value}`,
      });
    }
  });

  return values;
}

function findLocalBlockedCustomer(db, identity = {}) {
  ensureBlockedCustomersStore(db);

  const blockedValues = buildLocalBlockedValues(identity);

  return db.blockedCustomers.find((blockedCustomer) => {
    return blockedValues.some((item) => {
      return (
        blockedCustomer.type === item.type &&
        String(blockedCustomer.value || "") === item.value
      );
    });
  });
}

function buildBlockedOrderResponse(blockedCustomer) {
  return {
    ok: false,
    status: 403,
    error: "CUSTOMER_BLOCKED",
    message:
      "Ми не можемо оформити це замовлення автоматично. Будь ласка, зв’яжіться з кав’ярнею напряму.",
    hint:
      blockedCustomer?.reason ||
      "Замовлення обмежено адміністратором або антиспам-захистом.",
  };
}

function createLocalBlockedCustomers(db, targets = [], reason = "") {
  ensureBlockedCustomersStore(db);

  const created = [];

  targets.forEach((target) => {
    const type = toCleanString(target.type);
    const value = normalizeBlockedValue(type, target.value);

    if (!type || !value) return;

    const existing = db.blockedCustomers.find((item) => {
      return item.type === type && String(item.value || "") === value;
    });

    if (existing) {
      created.push(existing);
      return;
    }

    const blockedCustomer = {
      id: db.nextBlockedCustomerId,
      type,
      value,
      reason,
      createdAt: new Date().toISOString(),
    };

    db.nextBlockedCustomerId += 1;
    db.blockedCustomers.unshift(blockedCustomer);
    created.push(blockedCustomer);
  });

  return created;
}

function buildSpamResponse(spamResult) {
  return {
    error: spamResult.error || "ORDER_SPAM_LIMIT",
    message:
      spamResult.message ||
      "Замовлення тимчасово обмежено через надто часті спроби оформлення.",
    hint: spamResult.hint || "",
  };
}

function getFirstErrorMessage(errors = {}) {
  return Object.values(errors).find(Boolean) || "";
}

function validateOrderContactForm(form = {}) {
  const errors = {};

  const name = toCleanString(form.name);
  const rawPhone = toCleanString(form.phone);
  const rawTelegram = toCleanString(form.telegram);

  const phone = normalizePhone(rawPhone);
  const telegram = normalizeTelegram(rawTelegram);

  if (!name) {
    errors.name = "Вкажіть імʼя";
  } else if (name.length < 2) {
    errors.name = "Імʼя має містити щонайменше 2 символи";
  } else if (name.length > 60) {
    errors.name = "Імʼя занадто довге";
  }

  if (!rawPhone && !rawTelegram) {
    errors.contact = "Вкажіть телефон або Telegram";
  }

  if (rawPhone && !isValidPhone(rawPhone)) {
    errors.phone = "Телефон має бути у форматі +380XXXXXXXXX";
  }

  if (rawTelegram && !isValidTelegram(rawTelegram)) {
    errors.telegram =
      "Telegram має бути у форматі @username, мінімум 5 символів";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    data: {
      name,
      phone,
      telegram,
    },
  };
}

function validateDeliveryForm(form = {}, deliveryType = "pickup") {
  const errors = {};

  if (deliveryType !== "building") {
    return {
      ok: true,
      errors,
    };
  }

  if (!toCleanString(form.building)) {
    errors.building = "Вкажіть будинок";
  }

  if (!toCleanString(form.apartment)) {
    errors.apartment = "Вкажіть квартиру";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
  };
}


function validateCustomerProfileForm(body = {}) {
  const errors = {};

  const name = toCleanString(body.name);
  const rawPhone = toCleanString(body.phone);
  const rawTelegram = toCleanString(body.telegram);

  const phone = normalizePhone(rawPhone);
  const telegram = normalizeTelegram(rawTelegram);

  if (!name) {
    errors.name = "Вкажіть імʼя";
  } else if (name.length < 2) {
    errors.name = "Імʼя має містити щонайменше 2 символи";
  }

  if (!rawPhone && !rawTelegram) {
    errors.contact = "Вкажіть телефон або Telegram";
  }

  if (rawPhone && !isValidPhone(rawPhone)) {
    errors.phone = "Телефон має бути у форматі +380XXXXXXXXX";
  }

  if (rawTelegram && !isValidTelegram(rawTelegram)) {
    errors.telegram =
      "Telegram має бути у форматі @username, мінімум 5 символів";
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    data: {
      name,
      phone,
      telegram,
      building: toCleanString(body.building),
      entrance: toCleanString(body.entrance),
      floor: toCleanString(body.floor),
      apartment: toCleanString(body.apartment),
    },
  };
}



function toNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

function toNullableNumber(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function normalizeStockStatus(value, fallback = "in_stock") {
  if (STOCK_STATUSES.has(value)) {
    return value;
  }

  if (STOCK_STATUSES.has(fallback)) {
    return fallback;
  }

  return "in_stock";
}

function normalizeStockQuantity(stockStatus, value, fallback = 0) {
  if (stockStatus !== "limited") {
    return null;
  }

  return Math.max(0, toNumber(value, fallback));
}

function buildProductFromRequest(db, body) {
  const categoryData = resolveProductCategory(db, body);
  const stockStatus = normalizeStockStatus(body.stockStatus);

  return {
    id: db.nextProductId,

    name: toCleanString(body.name),

    category: categoryData.categoryId,
    subcategory: categoryData.subcategoryId,

    brand: toCleanString(body.brand),
    productType: toCleanString(body.productType),
    countryOfOrigin: toCleanString(body.countryOfOrigin),

    description: toCleanString(body.description),
    details: toCleanString(body.details),
    benefits: toCleanString(body.benefits),

    unit: toCleanString(body.unit, "1 шт"),
    packageInfo: toCleanString(body.packageInfo, "продається поштучно"),

    composition: toCleanString(body.composition),
    allergens: toCleanString(body.allergens),
    storageConditions: toCleanString(body.storageConditions),

    price: toNumber(body.price),
    costPrice: toNumber(body.costPrice),
    oldPrice: toNullableNumber(body.oldPrice),

    image: body.image ? toCleanString(body.image) : DEFAULT_PRODUCT_IMAGE,

    popular: Boolean(body.popular),
    active: body.active !== false,

    purchaseCount: toNumber(body.purchaseCount),

    stockStatus,
    stockQuantity: normalizeStockQuantity(stockStatus, body.stockQuantity),

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function buildUpdatedProduct(current, body, categoryData) {
  const nextStockStatus = normalizeStockStatus(
    body.stockStatus,
    current.stockStatus || "in_stock"
  );

  return {
    ...current,

    id: current.id,

    category: categoryData ? categoryData.categoryId : current.category,
    subcategory: categoryData ? categoryData.subcategoryId : current.subcategory,

    name:
      body.name === undefined
        ? current.name
        : toCleanString(body.name),

    brand:
      body.brand === undefined
        ? current.brand || ""
        : toCleanString(body.brand),

    productType:
      body.productType === undefined
        ? current.productType || ""
        : toCleanString(body.productType),

    countryOfOrigin:
      body.countryOfOrigin === undefined
        ? current.countryOfOrigin || ""
        : toCleanString(body.countryOfOrigin),

    description:
      body.description === undefined
        ? current.description || ""
        : toCleanString(body.description),

    details:
      body.details === undefined
        ? current.details || ""
        : toCleanString(body.details),

    benefits:
      body.benefits === undefined
        ? current.benefits || ""
        : toCleanString(body.benefits),

    unit:
      body.unit === undefined
        ? current.unit || "1 шт"
        : toCleanString(body.unit, "1 шт"),

    packageInfo:
      body.packageInfo === undefined
        ? current.packageInfo || "продається поштучно"
        : toCleanString(body.packageInfo, "продається поштучно"),

    composition:
      body.composition === undefined
        ? current.composition || ""
        : toCleanString(body.composition),

    allergens:
      body.allergens === undefined
        ? current.allergens || ""
        : toCleanString(body.allergens),

    storageConditions:
      body.storageConditions === undefined
        ? current.storageConditions || ""
        : toCleanString(body.storageConditions),

    price:
      body.price === undefined
        ? toNumber(current.price)
        : toNumber(body.price, current.price),

    costPrice:
      body.costPrice === undefined
        ? toNumber(current.costPrice)
        : toNumber(body.costPrice),

    oldPrice:
      body.oldPrice === undefined
        ? current.oldPrice ?? null
        : toNullableNumber(body.oldPrice),

    image:
      body.image === undefined
        ? current.image || DEFAULT_PRODUCT_IMAGE
        : body.image
          ? toCleanString(body.image)
          : DEFAULT_PRODUCT_IMAGE,

    popular:
      body.popular === undefined
        ? Boolean(current.popular)
        : Boolean(body.popular),

    active:
      body.active === undefined
        ? current.active !== false
        : Boolean(body.active),

    purchaseCount:
      body.purchaseCount === undefined
        ? toNumber(current.purchaseCount)
        : toNumber(body.purchaseCount),

    stockStatus: nextStockStatus,

    stockQuantity:
      nextStockStatus === "limited"
        ? normalizeStockQuantity(
            nextStockStatus,
            body.stockQuantity === undefined
              ? current.stockQuantity
              : body.stockQuantity
          )
        : null,

    updatedAt: new Date().toISOString(),
  };
}

async function sendTelegramMessage(text) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log("[Telegram skipped] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is empty");
    console.log(text);

    return {
      ok: false,
      skipped: true,
    };
  }

  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: "HTML",
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    console.error("[Telegram error]", errorText);

    return {
      ok: false,
      error: errorText,
    };
  }

  return response.json();
}

async function sendTelegramDirectMessage(chatId, text) {
  if (!TELEGRAM_BOT_TOKEN || !chatId) {
    console.log("[Customer Telegram skipped] Missing token or chatId");
    console.log({
      chatId,
      text,
    });

    return {
      ok: false,
      skipped: true,
    };
  }

  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    console.error("[Customer Telegram error]", errorText);

    return {
      ok: false,
      error: errorText,
    };
  }

  return response.json();
}

function buildCustomerOrderReadyMessage(order) {
  const orderNumber = order.orderNumber ? `#${order.orderNumber}` : "";

  return [
    `✅ <b>Ваше замовлення ${orderNumber} готове до видачі</b>`,
    "",
    `Можете забрати його в кавʼярні Evergreen coffee.`,
    "",
    `Сума: <b>${Number(order.total || 0)} грн</b>`,
    "",
    `Дякуємо за замовлення 🌿`,
  ].join("\n");
}

async function notifyPostgresCustomerOrderReady(order) {
  if (!order?.customerId) {
    return {
      ok: false,
      skipped: true,
      reason: "Order has no customerId",
    };
  }

  const customer = await customersRepository.getCustomerById(order.customerId);

  if (!customer?.telegramChatId) {
    return {
      ok: false,
      skipped: true,
      reason: "Customer has no telegramChatId",
    };
  }

  const message = buildCustomerOrderReadyMessage(order);

  return sendTelegramDirectMessage(customer.telegramChatId, message);
}


app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(applySecurityHeaders);
app.use(cors(createCorsOptions()));

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

app.use("/uploads", uploadsRoutes);

app.use("/api/admin", adminAuthRoutes);
app.use("/api/admin/analytics", adminAnalyticsRoutes);
app.use("/api/admin/customers", adminCustomersRoutes);
app.use("/api/admin/security", adminSecurityRoutes);
app.use("/api/admin/uploads", adminUploadsRoutes);

console.log("[debug] admin routes mounted");


console.log("[debug] adminAuthRoutes mounted");



function createCategoryId(name) {
  return `category-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function getCategoryProductCount(db, categoryId) {
  return (db.products || []).filter((product) => {
    return String(product.category) === String(categoryId);
  }).length;
}

function categoryNameExists(db, name, exceptId = "") {
  const normalizedName = normalizeName(name).toLowerCase();

  return (db.categories || []).some((category) => {
    return (
      String(category.id) !== String(exceptId) &&
      normalizeName(category.name).toLowerCase() === normalizedName
    );
  });
}

app.post("/api/admin/categories", requireAdmin, async (req, res) => {
  try {
    if (USE_POSTGRES) {
      const category = await categoriesRepository.createAdminCategory(req.body);

      return res.json({
        ok: true,
        category,
      });
    }

    const db = readDatabase();

    ensureCategoriesStore(db);

    const name = normalizeName(req.body.name);

    if (!name) {
      return res.status(400).json({
        error: "Category name is required",
      });
    }

    if (categoryNameExists(db, name)) {
      return res.status(409).json({
        error: "Category already exists",
      });
    }

    const category = {
      id: createCategoryId(name),
      name,
      active: true,
      subcategories: [],
    };

    db.categories.push(category);

    writeDatabase(db);

    return res.json({
      ok: true,
      category,
    });
  } catch (error) {
    console.error("Create category error:", error);

    return res.status(error.status || 500).json({
      error: "Failed to create category",
      message: error.message || "Не вдалося створити категорію.",
    });
  }
});


app.get("/api/admin/categories", requireAdmin, async (req, res) => {
  try {
    if (USE_POSTGRES) {
      const categories = await categoriesRepository.getAdminCategories();

      return res.json({
        categories,
      });
    }

    const db = readDatabase();

    return res.json({
      categories: Array.isArray(db.categories) ? db.categories : [],
    });
  } catch (error) {
    console.error("Get admin categories error:", error);

    return res.status(500).json({
      error: "Failed to load admin categories",
      message: "Не вдалося завантажити категорії для адмінки.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});


app.patch("/api/admin/categories/:categoryId", requireAdmin, async (req, res) => {
  try {
    if (USE_POSTGRES) {
      const category = await categoriesRepository.updateAdminCategory(
        req.params.categoryId,
        req.body
      );

      return res.json({
        ok: true,
        category,
      });
    }

    const db = readDatabase();

    ensureCategoriesStore(db);

    const category = findCategory(db, req.params.categoryId);

    if (!category) {
      return res.status(404).json({
        error: "Category not found",
      });
    }

    if (req.body.name !== undefined) {
      const name = normalizeName(req.body.name);

      if (!name) {
        return res.status(400).json({
          error: "Category name is required",
        });
      }

      if (categoryNameExists(db, name, category.id)) {
        return res.status(409).json({
          error: "Category already exists",
        });
      }

      category.name = name;
    }

    if (req.body.active !== undefined) {
      category.active = Boolean(req.body.active);
    }

    writeDatabase(db);

    return res.json({
      ok: true,
      category,
    });
  } catch (error) {
    console.error("Update category error:", error);

    return res.status(error.status || 500).json({
      error: "Failed to update category",
      message: error.message || "Не вдалося оновити категорію.",
    });
  }
});


app.delete("/api/admin/categories/:categoryId", requireAdmin, async (req, res) => {
  try {
    if (USE_POSTGRES) {
      await categoriesRepository.deleteAdminCategory(req.params.categoryId);

      return res.json({
        ok: true,
      });
    }

    const db = readDatabase();

    ensureCategoriesStore(db);

    const categoryIndex = db.categories.findIndex((category) => {
      return String(category.id) === String(req.params.categoryId);
    });

    if (categoryIndex === -1) {
      return res.status(404).json({
        error: "Category not found",
      });
    }

    const productCount = getCategoryProductCount(db, req.params.categoryId);

    if (productCount > 0) {
      return res.status(409).json({
        error: `Cannot delete category. It is used by ${productCount} products.`,
      });
    }

    const [deletedCategory] = db.categories.splice(categoryIndex, 1);

    writeDatabase(db);

    return res.json({
      ok: true,
      category: deletedCategory,
    });
  } catch (error) {
    console.error("Delete category error:", error);

    return res.status(error.status || 500).json({
      error: "Failed to delete category",
      message: error.message || "Не вдалося видалити категорію.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});



app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
  });
});

app.get("/api/categories", async (req, res) => {
  try {
    if (USE_POSTGRES) {
      const categories = await categoriesRepository.getPublicCategories();

      return res.json({
        categories,
      });
    }

    const db = readDatabase();

    const categories = Array.isArray(db.categories)
      ? db.categories.filter((category) => category.active !== false)
      : [];

    return res.json({
      categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);

    return res.status(500).json({
      error: "Failed to load categories",
      message: "Не вдалося завантажити категорії.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    if (USE_POSTGRES) {
      const products = await productsRepository.getPublicProducts();

      return res.json({
        products,
      });
    }

    const db = readDatabase();

    const products = Array.isArray(db.products)
      ? db.products
          .filter((product) => product.active !== false)
          .map((product) => {
            const { costPrice, ...safeProduct } = product;

            return safeProduct;
          })
      : [];

    return res.json({
      products,
    });
  } catch (error) {
    console.error("Get products error:", error);

    return res.status(500).json({
      error: "Failed to load products",
      message: "Не вдалося завантажити товари.",
      details:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
});

app.post("/api/customer/register", async (req, res) => {
  try {
    if (USE_POSTGRES) {
      const validation = validateCustomerRegistration(req.body);

      if (!validation.ok) {
        return res.status(400).json({
          error: "VALIDATION_ERROR",
          errors: validation.errors,
        });
      }

      const data = validation.data;
      const password = String(data.password || req.body.password || "");

      const customer = await customersRepository.createCustomer({
        name: data.name,
        phone: data.phone,
        telegram: data.telegram,

        building: data.building,
        entrance: data.entrance,
        floor: data.floor,
        apartment: data.apartment,

        passwordHash: hashPassword(password),
      });

      const token = createCustomerToken(customer, JWT_SECRET);

      setCustomerCookie(res, token);

      return res.json({
        ok: true,
        customer: sanitizePostgresCustomer(customer),
      });
    }

    const db = readDatabase();

    ensureCustomersStore(db);

    const validation = validateCustomerRegistration(req.body);

    if (!validation.ok) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        errors: validation.errors,
      });
    }

    const {
      name,
      phone,
      telegram,
      password,
      building,
      entrance,
      floor,
      apartment,
    } = validation.data;

    const duplicate = findCustomerDuplicate(db, {
      phone,
      telegram,
    });

    if (duplicate) {
      const errors = {};

      if (phone && duplicate.phone === phone) {
        errors.phone = "Користувач з таким телефоном вже існує";
      }

      if (telegram && duplicate.telegram === telegram) {
        errors.telegram = "Користувач з таким Telegram вже існує";
      }

      return res.status(409).json({
        error: "CUSTOMER_ALREADY_EXISTS",
        errors,
      });
    }

    const customer = {
      id: db.nextCustomerId,
      name,
      phone,
      telegram,

      building,
      entrance,
      floor,
      apartment,

      passwordHash: hashPassword(password),

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.nextCustomerId += 1;
    db.customers.push(customer);

    writeDatabase(db);

    const token = createCustomerToken(customer, JWT_SECRET);

    setCustomerCookie(res, token);

    return res.json({
      ok: true,
      customer: sanitizeCustomer(customer),
    });
  } catch (error) {
    console.error("Customer register error:", error);

    if (error.status === 409) {
      return res.status(409).json({
        error: "CUSTOMER_ALREADY_EXISTS",
        errors: buildDuplicateCustomerErrors(error, req.body),
        message: error.message,
      });
    }

    return res.status(error.status || 500).json({
      error: "CUSTOMER_REGISTER_FAILED",
      message: error.message || "Не вдалося створити акаунт.",
    });
  }
});   

app.post("/api/customer/login", customerLoginLimiter, async (req, res) => {
  try {
    if (USE_POSTGRES) {
      const validation = validateCustomerLogin(req.body);

      if (!validation.ok) {
        return res.status(400).json({
          error: "VALIDATION_ERROR",
          errors: validation.errors,
        });
      }

      const { phone, telegram, password } = validation.data;

      const customer = await customersRepository.findCustomerByContact(
        {
          phone,
          telegram,
        },
        {
          includePassword: true,
        }
      );

      if (!customer || !verifyPassword(password, customer.passwordHash)) {
        return res.status(401).json({
          error: "WRONG_LOGIN_OR_PASSWORD",
          errors: {
            login: "Невірний телефон/Telegram або пароль",
          },
        });
      }

      const token = createCustomerToken(customer, JWT_SECRET);

      setCustomerCookie(res, token);

      return res.json({
        ok: true,
        customer: sanitizePostgresCustomer(customer),
      });
    }

    const db = readDatabase();

    ensureCustomersStore(db);

    const validation = validateCustomerLogin(req.body);

    if (!validation.ok) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        errors: validation.errors,
      });
    }

    const { login, password } = validation.data;

    const customer = findCustomerByLogin(db, login);

    if (!customer || !verifyPassword(password, customer.passwordHash)) {
      return res.status(401).json({
        error: "WRONG_LOGIN_OR_PASSWORD",
        errors: {
          login: "Невірний телефон/Telegram або пароль",
        },
      });
    }

    const token = createCustomerToken(customer, JWT_SECRET);

    setCustomerCookie(res, token);

    return res.json({
      ok: true,
      customer: sanitizeCustomer(customer),
    });
  } catch (error) {
    console.error("Customer login error:", error);

    return res.status(500).json({
      error: "CUSTOMER_LOGIN_FAILED",
      message: "Не вдалося увійти в акаунт.",
    });
  }
});

app.post("/api/customer/logout", (req, res) => {
  clearCustomerCookie(res);

  res.json({
    ok: true,
  });
});

app.get("/api/customer/me", async (req, res) => {
  try {
    if (USE_POSTGRES) {
      const customer = await getPostgresCustomerFromRequest(req);

      if (!customer) {
        return res.json({
          authenticated: false,
          customer: null,
        });
      }

      return res.json({
        authenticated: true,
        customer: sanitizePostgresCustomer(customer),
      });
    }

    const db = readDatabase();

    ensureCustomersStore(db);

    const customer = getCustomerFromRequest(req, db, JWT_SECRET);

    if (!customer) {
      return res.json({
        authenticated: false,
        customer: null,
      });
    }

    return res.json({
      authenticated: true,
      customer: sanitizeCustomer(customer),
    });
  } catch (error) {
    console.error("Customer me error:", error);

    return res.status(500).json({
      error: "CUSTOMER_ME_FAILED",
      message: "Не вдалося завантажити профіль.",
    });
  }
});


app.patch("/api/customer/me", async (req, res) => {
  try {
    if (USE_POSTGRES) {
      const customer = await getPostgresCustomerFromRequest(req);

      if (!customer) {
        return res.status(401).json({
          error: "Unauthorized",
        });
      }

      const validation = validateCustomerProfileForm(req.body);

      if (!validation.ok) {
        return res.status(400).json({
          error: "VALIDATION_ERROR",
          errors: validation.errors,
        });
      }

      const updatedCustomer = await customersRepository.updateCustomer(
        customer.id,
        validation.data
      );

      return res.json({
        ok: true,
        customer: updatedCustomer,
      });
    }

    const db = readDatabase();

    ensureCustomersStore(db);

    const customer = getCustomerFromRequest(req, db, JWT_SECRET);

    if (!customer) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const validation = validateCustomerProfileForm(req.body);

    if (!validation.ok) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        errors: validation.errors,
      });
    }

    const duplicate = findCustomerDuplicate(
      db,
      {
        phone: validation.data.phone,
        telegram: validation.data.telegram,
      },
      customer.id
    );

    if (duplicate) {
      const errors = {};

      if (validation.data.phone && duplicate.phone === validation.data.phone) {
        errors.phone = "Користувач з таким телефоном вже існує";
      }

      if (
        validation.data.telegram &&
        duplicate.telegram === validation.data.telegram
      ) {
        errors.telegram = "Користувач з таким Telegram вже існує";
      }

      return res.status(409).json({
        error: "CUSTOMER_ALREADY_EXISTS",
        errors,
      });
    }

    customer.name = validation.data.name;
    customer.phone = validation.data.phone;
    customer.telegram = validation.data.telegram;

    customer.building = validation.data.building;
    customer.entrance = validation.data.entrance;
    customer.floor = validation.data.floor;
    customer.apartment = validation.data.apartment;

    customer.updatedAt = new Date().toISOString();

    writeDatabase(db);

    return res.json({
      ok: true,
      customer: sanitizeCustomer(customer),
    });
  } catch (error) {
    console.error("Customer profile update error:", error);

    if (error.status === 409) {
      return res.status(409).json({
        error: "CUSTOMER_ALREADY_EXISTS",
        errors: buildDuplicateCustomerErrors(error, req.body),
        message: error.message,
      });
    }

    return res.status(error.status || 500).json({
      error: "CUSTOMER_PROFILE_UPDATE_FAILED",
      message: error.message || "Не вдалося оновити профіль.",
    });
  }
});

app.post("/api/customer/telegram/start-verification", async (req, res) => {
  try {
    if (USE_POSTGRES) {
      const customer = await getPostgresCustomerFromRequest(req);

      if (!customer) {
        return res.status(401).json({
          error: "Unauthorized",
        });
      }

      const status = getTelegramVerificationStatus(customer);

      if (!status.canStart && status.verified) {
        return res.json({
          ok: true,
          verified: true,
          message: "Telegram і телефон вже підтверджено.",
          customer,
        });
      }

      if (!status.canStart) {
        return res.status(400).json({
          error: "TELEGRAM_REQUIRED",
          message: status.message,
          hint: "Вкажіть телефон і Telegram у профілі, а потім повторіть підтвердження.",
        });
      }

      const verification = startTelegramVerification(customer);

      const updatedCustomer =
        await customersRepository.updateCustomerTelegramVerification(
          customer.id,
          getTelegramVerificationPayload(customer)
        );

      return res.json({
        ok: true,
        verified: false,
        code: verification.code,
        expiresAt: verification.expiresAt,
        botUsername: process.env.TELEGRAM_BOT_USERNAME || "",
        message:
          "Надішліть цей код нашому Telegram-боту, а потім натисніть “Я надіслав код”.",
        customer: updatedCustomer,
      });
    }

    const db = readDatabase();

    ensureCustomersStore(db);

    const customer = getCustomerFromRequest(req, db, JWT_SECRET);

    if (!customer) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const status = getTelegramVerificationStatus(customer);

    if (!status.canStart && status.verified) {
      return res.json({
        ok: true,
        verified: true,
        message: "Telegram вже підтверджено.",
        customer: sanitizeCustomer(customer),
      });
    }

    if (!status.canStart) {
      return res.status(400).json({
        error: "TELEGRAM_REQUIRED",
        message: status.message,
        hint: "Вкажіть Telegram у профілі, а потім повторіть підтвердження.",
      });
    }

    const verification = startTelegramVerification(customer);

    writeDatabase(db);

    return res.json({
      ok: true,
      verified: false,
      code: verification.code,
      expiresAt: verification.expiresAt,
      botUsername: process.env.TELEGRAM_BOT_USERNAME || "",
      message:
        "Надішліть цей код нашому Telegram-боту, а потім натисніть “Я надіслав код”.",
    });
  } catch (error) {
    console.error("Start Telegram verification error:", error);

    return res.status(error.status || 500).json({
      error: "TELEGRAM_VERIFICATION_START_FAILED",
      message: error.message || "Не вдалося почати підтвердження Telegram.",
    });
  }
});

app.post("/api/customer/telegram/check-verification", async (req, res) => {
  try {
    if (USE_POSTGRES) {
      const customer = await getPostgresCustomerFromRequest(req);

      if (!customer) {
        return res.status(401).json({
          error: "Unauthorized",
        });
      }

      const telegramDb = {
        telegramUpdateOffset:
          await settingsRepository.getTelegramUpdateOffset(),
      };

      const result = await checkTelegramVerification(
        telegramDb,
        customer,
        TELEGRAM_BOT_TOKEN
      );

      await settingsRepository.setTelegramUpdateOffset(
        telegramDb.telegramUpdateOffset || 0
      );

      const updatedCustomer =
        await customersRepository.updateCustomerTelegramVerification(
          customer.id,
          getTelegramVerificationPayload(customer)
        );

      if (!result.ok) {
        return res.status(400).json({
          error: "TELEGRAM_VERIFICATION_FAILED",
          message: result.message,
          hint:
            result.details ||
            "Якщо бот не бачить код, відкрийте Telegram, напишіть боту /start і після цього надішліть код ще раз.",
          customer: updatedCustomer,
        });
      }

      return res.json({
        ok: true,
        verified: Boolean(result.verified),
        step: result.step || "",
        message: result.message,
        hint: result.hint || "",
        customer: updatedCustomer,
      });
    }

    const db = readDatabase();

    ensureCustomersStore(db);

    const customer = getCustomerFromRequest(req, db, JWT_SECRET);

    if (!customer) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const result = await checkTelegramVerification(
      db,
      customer,
      TELEGRAM_BOT_TOKEN
    );

    writeDatabase(db);

    if (!result.ok) {
      return res.status(400).json({
        error: "TELEGRAM_VERIFICATION_FAILED",
        message: result.message,
        hint:
          result.details ||
          "Якщо бот не бачить код, відкрийте Telegram, напишіть боту /start і після цього надішліть код ще раз.",
      });
    }

    return res.json({
      ok: true,
      verified: Boolean(result.verified),
      step: result.step || "",
      message: result.message,
      hint: result.hint || "",
      customer: sanitizeCustomer(customer),
    });
  } catch (error) {
    console.error("Check Telegram verification error:", error);

    return res.status(error.status || 500).json({
      error: "TELEGRAM_VERIFICATION_CHECK_FAILED",
      message: error.message || "Не вдалося перевірити Telegram.",
    });
  }
});


app.get("/api/customer/orders", async (req, res) => {
  try {
      if (USE_POSTGRES) {
        const customer = await getPostgresCustomerFromRequest(req);

        if (!customer) {
          return res.status(401).json({
            error: "Unauthorized",
          });
        }

        const orders = await ordersRepository.getCustomerOrders(customer);

        return res.json({
          orders,
        });
      }

    const db = readDatabase();

    ensureCustomersStore(db);

    const customer = getCustomerFromRequest(req, db, JWT_SECRET);

    if (!customer) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    const orders = Array.isArray(db.orders)
      ? db.orders.filter((order) => {
          return String(order.customerId) === String(customer.id);
        })
      : [];

    return res.json({
      orders,
    });
  } catch (error) {
    console.error("Get customer orders error:", error);

    return res.status(500).json({
      error: "CUSTOMER_ORDERS_FAILED",
      message: "Не вдалося завантажити замовлення.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const { items, form } = req.body;

    if (USE_POSTGRES) {
      const customer = await getPostgresCustomerFromRequest(req);
      const trustLevel = getOrderTrustLevel(customer);
      const orderLimits = getOrderLimits(trustLevel);
      const spamLimits = getOrderSpamLimits(trustLevel);

      const guestId = customer ? "" : getOrCreateGuestId(req, res);
      const clientIp = getClientIp(req);

      const rawItemsValidation = validateRawOrderItems(items, orderLimits);

      if (!rawItemsValidation.ok) {
        return res.status(rawItemsValidation.status || 400).json({
          error: rawItemsValidation.error || "VALIDATION_ERROR",
          message:
            rawItemsValidation.message || "Не вдалося оформити замовлення.",
          hint: rawItemsValidation.hint || "",
          errors: rawItemsValidation.errors || {},
        });
      }

      const orderForm = normalizeOrderForm(form || {});

      const deliveryType =
        orderForm.deliveryType === "building" ? "building" : "pickup";

      if (customer) {
        orderForm.name = normalizeOrderSingleLine(customer.name, 60);
        orderForm.phone = customer.phone || "";
        orderForm.telegram = customer.telegram || "";

        if (deliveryType === "building") {
          orderForm.building =
            orderForm.building || normalizeOrderSingleLine(customer.building, 40);
          orderForm.entrance =
            orderForm.entrance || normalizeOrderSingleLine(customer.entrance, 20);
          orderForm.floor =
            orderForm.floor || normalizeOrderSingleLine(customer.floor, 20);
          orderForm.apartment =
            orderForm.apartment ||
            normalizeOrderSingleLine(customer.apartment, 20);
        }
      }

      if (deliveryType !== "building") {
        orderForm.building = "";
        orderForm.entrance = "";
        orderForm.floor = "";
        orderForm.apartment = "";
      }

      const contactValidation = validateOrderContactForm(orderForm);
      const deliveryValidation = validateDeliveryForm(orderForm, deliveryType);

      const orderErrors = {
        ...contactValidation.errors,
        ...deliveryValidation.errors,
      };

      if (Object.keys(orderErrors).length > 0) {
        return res.status(400).json({
          error: "VALIDATION_ERROR",
          message:
            getFirstErrorMessage(orderErrors) ||
            "Перевірте дані для оформлення замовлення.",
          hint: "Для замовлення достатньо вказати імʼя та один контакт: телефон або Telegram.",
          errors: orderErrors,
        });
      }

      orderForm.name = contactValidation.data.name;
      orderForm.phone = contactValidation.data.phone;
      orderForm.telegram = contactValidation.data.telegram;

      const orderIdentity = {
        customerId: customer ? customer.id : "",
        guestId,
        phone: orderForm.phone,
        telegram: orderForm.telegram,
        ip: clientIp,
      };

      const blockedResult =
        await blockedCustomersRepository.assertCustomerNotBlocked(
          orderIdentity
        );

      if (!blockedResult.ok) {
        return res.status(blockedResult.status || 403).json({
          error: blockedResult.error || "CUSTOMER_BLOCKED",
          message:
            blockedResult.message ||
            "Замовлення тимчасово недоступне для цього контакту.",
          hint: blockedResult.hint || "",
        });
      }

      const spamLimitResult =
        await orderLimitsRepository.checkPostgresOrderSpamRateLimit(
          orderIdentity,
          trustLevel,
          spamLimits
        );

      if (!spamLimitResult.ok) {
        if (spamLimitResult.blockTargets?.length) {
          await blockedCustomersRepository.createBlockedCustomers(
            spamLimitResult.blockTargets,
            spamLimitResult.reason
          );
        }

        return res
          .status(spamLimitResult.status || 429)
          .json(buildSpamResponse(spamLimitResult));
      }

      const rateLimitResult =
        await orderLimitsRepository.checkPostgresOrderRateLimit(
          orderIdentity,
          orderLimits
        );

      if (!rateLimitResult.ok) {
        return res.status(rateLimitResult.status || 429).json({
          error: rateLimitResult.error || "ORDER_LIMIT",
          message:
            rateLimitResult.message || "Замовлення тимчасово обмежено.",
          hint: rateLimitResult.hint || "",
        });
      }

      const orderProducts = await ordersRepository.getProductsForOrder(
        rawItemsValidation.items
      );

      const orderItems = [];

      for (const item of rawItemsValidation.items) {
        const product = orderProducts.find((productItem) => {
          return (
            String(productItem.id) === String(item.id) ||
            String(productItem.id) === String(item.productId)
          );
        });

        if (!product) {
          continue;
        }

        if (product.stockStatus === "out_of_stock") {
          return res.status(400).json({
            error: "VALIDATION_ERROR",
            message: `${product.name} немає в наявності`,
            errors: {
              cart: `${product.name} немає в наявності`,
            },
          });
        }

        const quantity = Math.max(1, Number(item.quantity) || 1);

        if (quantity > orderLimits.maxOneProductQuantity) {
          return res.status(400).json({
            error: "VALIDATION_ERROR",
            message: `Одного товару можна додати не більше ${orderLimits.maxOneProductQuantity} шт.`,
            errors: {
              cart: `Одного товару можна додати не більше ${orderLimits.maxOneProductQuantity} шт.`,
            },
          });
        }

        if (
          product.stockStatus === "limited" &&
          Number(product.stockQuantity || 0) < quantity
        ) {
          return res.status(400).json({
            error: "VALIDATION_ERROR",
            message: `Недостатньо ${product.name} на складі`,
            errors: {
              cart: `Недостатньо ${product.name} на складі`,
            },
          });
        }

        const price = Number(product.price || 0);
        const costPrice = Number(product.costPrice || 0);
        const total = price * quantity;
        const costTotal = costPrice * quantity;

        orderItems.push({
          productId: product.id,

          name: product.name,
          brand: product.brand || "",
          unit: product.unit || "",
          packageInfo: product.packageInfo || "",

          price,
          costPrice,
          quantity,

          total,
          costTotal,
          profit: total - costTotal,
        });
      }

      const total = orderItems.reduce((sum, item) => {
        return sum + item.total;
      }, 0);

      const resolvedItemsValidation = validateResolvedOrderItems(
        orderItems,
        total,
        orderLimits
      );

      if (!resolvedItemsValidation.ok) {
        return res.status(resolvedItemsValidation.status || 400).json({
          error: resolvedItemsValidation.error || "VALIDATION_ERROR",
          message:
            resolvedItemsValidation.message ||
            "Не вдалося оформити замовлення.",
          hint: resolvedItemsValidation.hint || "",
          errors: resolvedItemsValidation.errors || {},
        });
      }

      const order = await ordersRepository.createOrder({
        customerId: customer ? customer.id : null,
        guestId: customer ? "" : guestId,
        clientIp,
        trustLevel,

        customerName: orderForm.name,
        customerPhone: orderForm.phone || "",
        customerTelegram: orderForm.telegram || "",

        deliveryType,

        building: deliveryType === "building" ? orderForm.building || "" : "",
        entrance: deliveryType === "building" ? orderForm.entrance || "" : "",
        floor: deliveryType === "building" ? orderForm.floor || "" : "",
        apartment:
          deliveryType === "building" ? orderForm.apartment || "" : "",

        paymentMethod: DEFAULT_PAYMENT_METHOD,
        paymentStatus: PAYMENT_STATUS.UNPAID,

        comment: orderForm.comment || "",

        status: ORDER_STATUS.NEW,

        items: orderItems,
        total,
      });

      const telegramMessage = formatOrderMessage({
        order,
      });

      const telegramResult = await sendTelegramMessage(telegramMessage);

      return res.json({
        ok: true,
        order: sanitizeOrderForCustomer(order),
        telegramMessage,
        telegramResult,
      });
    }

    const db = readDatabase();

    ensureCustomersStore(db);

    const customer = getCustomerFromRequest(req, db, JWT_SECRET);
    const trustLevel = getOrderTrustLevel(customer);
    const orderLimits = getOrderLimits(trustLevel);

    const guestId = customer ? "" : getOrCreateGuestId(req, res);
    const clientIp = getClientIp(req);

    const rawItemsValidation = validateRawOrderItems(items, orderLimits);

    if (!rawItemsValidation.ok) {
      return res.status(rawItemsValidation.status || 400).json({
        error: rawItemsValidation.error || "VALIDATION_ERROR",
        message:
          rawItemsValidation.message || "Не вдалося оформити замовлення.",
        hint: rawItemsValidation.hint || "",
        errors: rawItemsValidation.errors || {},
      });
    }

    const orderForm = normalizeOrderForm(form || {});

    const deliveryType =
      orderForm.deliveryType === "building" ? "building" : "pickup";

    if (customer) {
      orderForm.name = normalizeOrderSingleLine(customer.name, 60);
      orderForm.phone = customer.phone || "";
      orderForm.telegram = customer.telegram || "";

      if (deliveryType === "building") {
        orderForm.building =
          orderForm.building || normalizeOrderSingleLine(customer.building, 40);
        orderForm.entrance =
          orderForm.entrance || normalizeOrderSingleLine(customer.entrance, 20);
        orderForm.floor =
          orderForm.floor || normalizeOrderSingleLine(customer.floor, 20);
        orderForm.apartment =
          orderForm.apartment || normalizeOrderSingleLine(customer.apartment, 20);
      }
    }

    if (deliveryType !== "building") {
      orderForm.building = "";
      orderForm.entrance = "";
      orderForm.floor = "";
      orderForm.apartment = "";
    }

    const contactValidation = validateOrderContactForm(orderForm);
    const deliveryValidation = validateDeliveryForm(orderForm, deliveryType);

    const orderErrors = {
      ...contactValidation.errors,
      ...deliveryValidation.errors,
    };

    if (Object.keys(orderErrors).length > 0) {
      return res.status(400).json({
        error: "VALIDATION_ERROR",
        message:
          getFirstErrorMessage(orderErrors) ||
          "Перевірте дані для оформлення замовлення.",
        hint: "Для замовлення достатньо вказати імʼя та один контакт: телефон або Telegram.",
        errors: orderErrors,
      });
    }

    orderForm.name = contactValidation.data.name;
    orderForm.phone = contactValidation.data.phone;
    orderForm.telegram = contactValidation.data.telegram;

    const orderIdentity = {
      customerId: customer ? String(customer.id) : "",
      guestId,
      phone: orderForm.phone,
      telegram: orderForm.telegram,
      ip: clientIp,
    };

    const blockedCustomer = findLocalBlockedCustomer(db, orderIdentity);

    if (blockedCustomer) {
      const blockedResponse = buildBlockedOrderResponse(blockedCustomer);

      return res.status(blockedResponse.status).json({
        error: blockedResponse.error,
        message: blockedResponse.message,
        hint: blockedResponse.hint,
      });
    }

    const spamLimitResult = checkOrderSpamRateLimit(
      db.orders || [],
      orderIdentity,
      trustLevel
    );

    if (!spamLimitResult.ok) {
      if (spamLimitResult.blockTargets?.length) {
        createLocalBlockedCustomers(
          db,
          spamLimitResult.blockTargets,
          spamLimitResult.reason
        );
        writeDatabase(db);
      }

      return res
        .status(spamLimitResult.status || 429)
        .json(buildSpamResponse(spamLimitResult));
    }

    const rateLimitResult = checkOrderRateLimit(
      db,
      orderIdentity,
      trustLevel
    );

    if (!rateLimitResult.ok) {
      return res.status(rateLimitResult.status || 429).json({
        error: rateLimitResult.error || "ORDER_LIMIT",
        message:
          rateLimitResult.message || "Замовлення тимчасово обмежено.",
        hint: rateLimitResult.hint || "",
      });
    }

    const orderItems = [];

    for (const item of rawItemsValidation.items) {
      const product = db.products.find((productItem) => {
        return (
          String(productItem.id) === String(item.id) &&
          productItem.active !== false
        );
      });

      if (!product) {
        continue;
      }

      if (product.stockStatus === "out_of_stock") {
        return res.status(400).json({
          error: "VALIDATION_ERROR",
          message: `${product.name} немає в наявності`,
          errors: {
            cart: `${product.name} немає в наявності`,
          },
        });
      }

      const quantity = Math.max(1, Number(item.quantity) || 1);

      if (quantity > orderLimits.maxOneProductQuantity) {
        return res.status(400).json({
          error: "VALIDATION_ERROR",
          message: `Одного товару можна додати не більше ${orderLimits.maxOneProductQuantity} шт.`,
          errors: {
            cart: `Одного товару можна додати не більше ${orderLimits.maxOneProductQuantity} шт.`,
          },
        });
      }

      if (
        product.stockStatus === "limited" &&
        Number(product.stockQuantity || 0) < quantity
      ) {
        return res.status(400).json({
          error: "VALIDATION_ERROR",
          message: `Недостатньо ${product.name} на складі`,
          errors: {
            cart: `Недостатньо ${product.name} на складі`,
          },
        });
      }

      const price = Number(product.price || 0);
      const costPrice = Number(product.costPrice || 0);
      const total = price * quantity;
      const costTotal = costPrice * quantity;

      orderItems.push({
        productId: product.id,

        name: product.name,
        brand: product.brand || "",
        unit: product.unit || "",
        packageInfo: product.packageInfo || "",

        price,
        costPrice,
        quantity,

        total,
        costTotal,
        profit: total - costTotal,
      });
    }

    const total = orderItems.reduce((sum, item) => {
      return sum + item.total;
    }, 0);

    const resolvedItemsValidation = validateResolvedOrderItems(
      orderItems,
      total,
      orderLimits
    );

    if (!resolvedItemsValidation.ok) {
      return res.status(resolvedItemsValidation.status || 400).json({
        error: resolvedItemsValidation.error || "VALIDATION_ERROR",
        message:
          resolvedItemsValidation.message || "Не вдалося оформити замовлення.",
        hint: resolvedItemsValidation.hint || "",
        errors: resolvedItemsValidation.errors || {},
      });
    }

    const order = {
      id: String(Date.now()),
      orderNumber: db.nextOrderNumber,
      createdAt: new Date().toISOString(),

      customerId: customer ? customer.id : null,
      guestId: customer ? null : guestId,
      clientIp,
      trustLevel,

      customerName: orderForm.name,
      customerPhone: orderForm.phone || "",
      customerTelegram: orderForm.telegram || "",

      deliveryType,
      building: deliveryType === "building" ? orderForm.building || "" : "",
      entrance: deliveryType === "building" ? orderForm.entrance || "" : "",
      floor: deliveryType === "building" ? orderForm.floor || "" : "",
      apartment: deliveryType === "building" ? orderForm.apartment || "" : "",

      paymentMethod: DEFAULT_PAYMENT_METHOD,
      paymentStatus: PAYMENT_STATUS.UNPAID,

      comment: orderForm.comment || "",

      status: ORDER_STATUS.NEW,

      isFinal: false,
      finalType: null,
      finalizedAt: null,
      cancelReason: "",
      stockRestoredAt: null,

      statusHistory: [
        {
          at: new Date().toISOString(),
          type: "order_created",
          label: "Замовлення створено",
        },
      ],

      items: orderItems,
      total,
    };

    db.nextOrderNumber += 1;
    db.orders.unshift(order);

    writeDatabase(db);

    const telegramMessage = formatOrderMessage({
      order,
    });

    const telegramResult = await sendTelegramMessage(telegramMessage);

    return res.json({
      ok: true,
      order: sanitizeOrderForCustomer(order),
      telegramMessage,
      telegramResult,
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(error.status || 500).json({
      error: "CREATE_ORDER_FAILED",
      message: error.message || "Не вдалося створити замовлення.",
      details:
        process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

app.get("/api/admin/products", requireAdmin, async (req, res) => {
  try {
    if (USE_POSTGRES) {
      const products = await productsRepository.getAdminProducts();

      return res.json({
        products,
      });
    }

    const db = readDatabase();

    return res.json({
      products: Array.isArray(db.products) ? db.products : [],
    });
  } catch (error) {
    console.error("Get admin products error:", error);

    return res.status(500).json({
      error: "Failed to load admin products",
      message: "Не вдалося завантажити товари.",
    });
  }
});

app.post(
  "/api/admin/categories/:categoryId/subcategories",
  requireAdmin,
  async (req, res) => {
    try {
      if (USE_POSTGRES) {
        const subcategory = await categoriesRepository.createAdminSubcategory(
          req.params.categoryId,
          req.body
        );

        return res.json({
          ok: true,
          subcategory,
        });
      }

      const db = readDatabase();

      const subcategory = createSubcategory(
        db,
        req.params.categoryId,
        req.body.name
      );

      writeDatabase(db);

      return res.json({
        ok: true,
        subcategory,
      });
    } catch (error) {
      console.error("Create subcategory error:", error);

      return res.status(error.status || error.statusCode || 500).json({
        error: "Failed to create subcategory",
        message: error.message || "Не вдалося створити підкатегорію.",
      });
    }
  }
);

app.patch(
  "/api/admin/categories/:categoryId/subcategories/:subcategoryId",
  requireAdmin,
  async (req, res) => {
    try {
      if (USE_POSTGRES) {
        const subcategory = await categoriesRepository.updateAdminSubcategory(
          req.params.categoryId,
          req.params.subcategoryId,
          req.body
        );

        return res.json({
          ok: true,
          subcategory,
        });
      }

      const db = readDatabase();

      ensureCategoriesStore(db);

      const category = findCategory(db, req.params.categoryId);

      if (!category) {
        return res.status(404).json({
          error: "Category not found",
        });
      }

      const subcategory = findSubcategory(category, req.params.subcategoryId);

      if (!subcategory) {
        return res.status(404).json({
          error: "Subcategory not found",
        });
      }

      if (req.body.name !== undefined) {
        const name = normalizeName(req.body.name);

        if (!name) {
          return res.status(400).json({
            error: "Subcategory name is required",
          });
        }

        if (subcategoryNameExists(category, name, subcategory.id)) {
          return res.status(409).json({
            error: "Subcategory already exists in this category",
          });
        }

        subcategory.name = name;
      }

      if (req.body.active !== undefined) {
        subcategory.active = Boolean(req.body.active);
      }

      writeDatabase(db);

      return res.json({
        ok: true,
        subcategory,
      });
    } catch (error) {
      console.error("Update subcategory error:", error);

      return res.status(error.status || error.statusCode || 500).json({
        error: "Failed to update subcategory",
        message: error.message || "Не вдалося оновити підкатегорію.",
      });
    }
  }
);

app.delete(
  "/api/admin/categories/:categoryId/subcategories/:subcategoryId",
  requireAdmin,
  async (req, res) => {
    try {
      if (USE_POSTGRES) {
        await categoriesRepository.deleteAdminSubcategory(
          req.params.categoryId,
          req.params.subcategoryId
        );

        return res.json({
          ok: true,
        });
      }

      const db = readDatabase();

      ensureCategoriesStore(db);

      const category = findCategory(db, req.params.categoryId);

      if (!category) {
        return res.status(404).json({
          error: "Category not found",
        });
      }

      const subcategoryIndex = category.subcategories.findIndex(
        (subcategory) => {
          return String(subcategory.id) === String(req.params.subcategoryId);
        }
      );

      if (subcategoryIndex === -1) {
        return res.status(404).json({
          error: "Subcategory not found",
        });
      }

      const productCount = getSubcategoryProductCount(
        db,
        req.params.categoryId,
        req.params.subcategoryId
      );

      if (productCount > 0) {
        return res.status(409).json({
          error: `Cannot delete subcategory. It is used by ${productCount} products.`,
        });
      }

      const [deletedSubcategory] = category.subcategories.splice(
        subcategoryIndex,
        1
      );

      writeDatabase(db);

      return res.json({
        ok: true,
        subcategory: deletedSubcategory,
      });
    } catch (error) {
      console.error("Delete subcategory error:", error);

      return res.status(error.status || error.statusCode || 500).json({
        error: "Failed to delete subcategory",
        message: error.message || "Не вдалося видалити підкатегорію.",
      });
    }
  }
);

app.get("/api/admin/orders", requireAdmin, async (req, res) => {
  try {
    if (USE_POSTGRES) {
      const orders = await ordersRepository.getAdminOrders();

      return res.json({
        orders,
      });
    }

    const db = readDatabase();

    const orders = Array.isArray(db.orders) ? db.orders : [];

    return res.json({
      orders,
    });
  } catch (error) {
    console.error("Get admin orders error:", error);

    return res.status(500).json({
      error: "ADMIN_ORDERS_FAILED",
      message: "Не вдалося завантажити замовлення.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

app.post("/api/admin/telegram/sync-customers", requireAdmin, async (req, res) => {
  const db = readDatabase();

  const result = await syncCustomerTelegramChats(db, TELEGRAM_BOT_TOKEN);

  writeDatabase(db);

  res.json(result);
});

app.post("/api/admin/products", requireAdmin, async (req, res) => {
  try {
    if (USE_POSTGRES) {
      const product = await productsRepository.createAdminProduct(req.body);

      return res.json({
        ok: true,
        product,
      });
    }

    const db = readDatabase();

    const product = {
      id: String(Date.now()),
      ...req.body,
      price: Number(req.body.price || 0),
      costPrice: Number(req.body.costPrice || 0),
      active: req.body.active !== false,
      popular: Boolean(req.body.popular),
      purchaseCount: Number(req.body.purchaseCount || 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.products.unshift(product);
    writeDatabase(db);

    return res.json({
      ok: true,
      product,
    });
  } catch (error) {
    console.error("Create admin product error:", error);

    return res.status(error.status || 500).json({
      error: "Failed to create product",
      message: error.message || "Не вдалося створити товар.",
    });
  }
});

app.patch("/api/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    if (USE_POSTGRES) {
      const product = await productsRepository.updateAdminProduct(
        req.params.id,
        req.body
      );

      return res.json({
        ok: true,
        product,
      });
    }

    const db = readDatabase();

    const product = db.products.find((item) => {
      return String(item.id) === String(req.params.id);
    });

    if (!product) {
      return res.status(404).json({
        error: "Product not found",
        message: "Товар не знайдено.",
      });
    }

    Object.assign(product, req.body, {
      updatedAt: new Date().toISOString(),
    });

    if (req.body.price !== undefined) {
      product.price = Number(req.body.price || 0);
    }

    if (req.body.costPrice !== undefined) {
      product.costPrice = Number(req.body.costPrice || 0);
    }

    if (req.body.oldPrice !== undefined) {
      product.oldPrice = req.body.oldPrice ? Number(req.body.oldPrice) : null;
    }

    writeDatabase(db);

    return res.json({
      ok: true,
      product,
    });
  } catch (error) {
    console.error("Update admin product error:", error);

    return res.status(error.status || 500).json({
      error: "Failed to update product",
      message: error.message || "Не вдалося оновити товар.",
    });
  }
});

app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
  try {
    if (USE_POSTGRES) {
      await productsRepository.deleteAdminProduct(req.params.id);

      return res.json({
        ok: true,
      });
    }

    const db = readDatabase();

    const initialLength = db.products.length;

    db.products = db.products.filter((item) => {
      return String(item.id) !== String(req.params.id);
    });

    if (db.products.length === initialLength) {
      return res.status(404).json({
        error: "Product not found",
        message: "Товар не знайдено.",
      });
    }

    writeDatabase(db);

    return res.json({
      ok: true,
    });
  } catch (error) {
    console.error("Delete admin product error:", error);

    return res.status(error.status || 500).json({
      error: "Failed to delete product",
      message: error.message || "Не вдалося видалити товар.",
    });
  }
});

app.patch("/api/admin/orders/:id/action", requireAdmin, async (req, res) => {
  try {
    if (USE_POSTGRES) {
      const updatedOrder = await ordersRepository.updateOrderAction(
        req.params.id,
        req.body.action,
        {
          reason: req.body.reason,
        }
      );

      let customerTelegramResult = null;

      if (req.body.action === "mark_ready" || req.body.action === "ready") {
        customerTelegramResult = await notifyPostgresCustomerOrderReady(
          updatedOrder
        );
      }

      return res.json({
        ok: true,
        order: updatedOrder,
        customerTelegramResult,
      });
    }

    const db = readDatabase();

    const orderId = req.params.id;
    const order = db.orders.find((item) => item.id === orderId);

    if (!order) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    const updatedOrder = applyOrderAction(db, order, req.body.action, {
      reason: req.body.reason,
    });

    if (req.body.action === "mark_ready") {
      await notifyCustomerOrderReady(db, updatedOrder, TELEGRAM_BOT_TOKEN);
    }

    writeDatabase(db);

    return res.json({
      ok: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Update order action error:", error);

    return res.status(error.status || error.statusCode || 500).json({
      error: error.message || "Failed to update order",
      message: error.message || "Не вдалося оновити замовлення.",
      details:
        process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

const clientDistPath = path.join(__dirname, "../dist");

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Evergreen backend running on port ${PORT}`);
});
