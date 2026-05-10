require("dotenv").config();

const fs = require("fs");
const path = require("path");

const prisma = require("../database/prisma.cjs");

const DB_JSON_PATH = path.join(__dirname, "..", "data", "db.json");

const RESET_DATABASE_BEFORE_IMPORT =
  process.env.RESET_DATABASE_BEFORE_IMPORT === "true";

function toStringId(value, fallback = "") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

function toCleanString(value) {
  return String(value || "").trim();
}

function toNullableString(value) {
  const clean = toCleanString(value);
  return clean ? clean : null;
}

function toInt(value, fallback = 0) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.round(number);
}

function toNullableInt(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return Math.round(number);
}

function toDate(value, fallback = new Date()) {
  const date = new Date(value || "");

  if (!Number.isFinite(date.getTime())) {
    return fallback;
  }

  return date;
}

function toNullableDate(value) {
  if (!value) return null;

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return null;
  }

  return date;
}

function slugify(value, fallback = "item") {
  const base = String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-zа-яіїєґ0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");

  return base || fallback;
}

function normalizePhone(value) {
  const clean = String(value || "").replace(/[^\d+]/g, "").trim();
  return clean || null;
}

function normalizeTelegram(value) {
  const clean = String(value || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();

  return clean || null;
}

function getUniqueNullable(value, usedSet, normalizer, label) {
  const normalized = normalizer(value);

  if (!normalized) {
    return null;
  }

  if (usedSet.has(normalized)) {
    console.warn(
      `[WARN] Duplicate ${label}: ${normalized}. This value will be imported as null.`
    );

    return null;
  }

  usedSet.add(normalized);

  return normalized;
}

function readJsonDatabase() {
  if (!fs.existsSync(DB_JSON_PATH)) {
    throw new Error(`db.json not found: ${DB_JSON_PATH}`);
  }

  const raw = fs.readFileSync(DB_JSON_PATH, "utf8");

  return JSON.parse(raw);
}

async function resetDatabase(tx) {
  console.log("Resetting PostgreSQL tables...");

  await tx.orderStatusHistory.deleteMany();
  await tx.orderItem.deleteMany();
  await tx.order.deleteMany();

  await tx.product.deleteMany();
  await tx.subcategory.deleteMany();
  await tx.category.deleteMany();

  await tx.customer.deleteMany();

  await tx.blockedCustomer.deleteMany();
  await tx.siteSetting.deleteMany();
}

function getCategoriesFromJson(db) {
  const categories = Array.isArray(db.categories) ? db.categories : [];

  if (categories.length) {
    return categories;
  }

  return [
    {
      id: "uncategorized",
      name: "Без категорії",
      active: true,
      subcategories: [],
    },
  ];
}

function collectCategoryIds(categories) {
  return new Set(
    categories.map((category) => {
      return toStringId(category.id, slugify(category.name, "category"));
    })
  );
}

function collectSubcategoryIds(categories) {
  const result = new Set();

  categories.forEach((category) => {
    (category.subcategories || []).forEach((subcategory) => {
      result.add(toStringId(subcategory.id, slugify(subcategory.name, "subcategory")));
    });
  });

  return result;
}

async function importCategories(tx, db) {
  const categories = getCategoriesFromJson(db);

  console.log(`Importing categories: ${categories.length}`);

  for (const [index, category] of categories.entries()) {
    const id = toStringId(category.id, slugify(category.name, `category-${index}`));
    const name = toCleanString(category.name) || id;

    await tx.category.upsert({
      where: {
        id,
      },
      update: {
        name,
        slug: slugify(category.slug || name, id),
        active: category.active !== false,
        sortOrder: toInt(category.sortOrder, index),
      },
      create: {
        id,
        name,
        slug: slugify(category.slug || name, id),
        active: category.active !== false,
        sortOrder: toInt(category.sortOrder, index),
        createdAt: toDate(category.createdAt, new Date()),
      },
    });

    const subcategories = Array.isArray(category.subcategories)
      ? category.subcategories
      : [];

    for (const [subIndex, subcategory] of subcategories.entries()) {
      const subcategoryId = toStringId(
        subcategory.id,
        `${id}-${slugify(subcategory.name, `subcategory-${subIndex}`)}`
      );

      const subcategoryName = toCleanString(subcategory.name) || subcategoryId;

      await tx.subcategory.upsert({
        where: {
          id: subcategoryId,
        },
        update: {
          categoryId: id,
          name: subcategoryName,
          slug: slugify(subcategory.slug || subcategoryName, subcategoryId),
          active: subcategory.active !== false,
          sortOrder: toInt(subcategory.sortOrder, subIndex),
        },
        create: {
          id: subcategoryId,
          categoryId: id,
          name: subcategoryName,
          slug: slugify(subcategory.slug || subcategoryName, subcategoryId),
          active: subcategory.active !== false,
          sortOrder: toInt(subcategory.sortOrder, subIndex),
          createdAt: toDate(subcategory.createdAt, new Date()),
        },
      });
    }
  }
}

async function ensureFallbackCategory(tx) {
  await tx.category.upsert({
    where: {
      id: "uncategorized",
    },
    update: {},
    create: {
      id: "uncategorized",
      name: "Без категорії",
      slug: "uncategorized",
      active: true,
      sortOrder: 9999,
    },
  });
}

async function importProducts(tx, db) {
  const products = Array.isArray(db.products) ? db.products : [];
  const categories = getCategoriesFromJson(db);

  const categoryIds = collectCategoryIds(categories);
  const subcategoryIds = collectSubcategoryIds(categories);

  console.log(`Importing products: ${products.length}`);

  await ensureFallbackCategory(tx);

  for (const [index, product] of products.entries()) {
    const id = toStringId(product.id, `product-${index}`);

    const rawCategoryId = toStringId(product.category || product.categoryId, "");
    const categoryId = categoryIds.has(rawCategoryId)
      ? rawCategoryId
      : "uncategorized";

    const rawSubcategoryId = toStringId(
      product.subcategory || product.subcategoryId,
      ""
    );

    const subcategoryId = subcategoryIds.has(rawSubcategoryId)
      ? rawSubcategoryId
      : null;

    await tx.product.upsert({
      where: {
        id,
      },
      update: {
        name: toCleanString(product.name) || id,
        brand: toCleanString(product.brand),
        image: toCleanString(product.image),

        categoryId,
        subcategoryId,

        price: toInt(product.price, 0),
        oldPrice: toNullableInt(product.oldPrice),
        costPrice: toInt(product.costPrice, 0),

        unit: toCleanString(product.unit) || "1 шт",
        packageInfo:
          toCleanString(product.packageInfo) || "продається поштучно",

        description: toCleanString(product.description),
        details: toCleanString(product.details),
        composition: toCleanString(product.composition),
        allergens: toCleanString(product.allergens),
        storage: toCleanString(product.storage),

        statusLabel: toCleanString(product.statusLabel),
        stockStatus: toCleanString(product.stockStatus) || "in_stock",
        stockQuantity: toNullableInt(product.stockQuantity),

        active: product.active !== false,
        popular: Boolean(product.popular),
        purchaseCount: toInt(product.purchaseCount, 0),
      },
      create: {
        id,
        name: toCleanString(product.name) || id,
        brand: toCleanString(product.brand),
        image: toCleanString(product.image),

        categoryId,
        subcategoryId,

        price: toInt(product.price, 0),
        oldPrice: toNullableInt(product.oldPrice),
        costPrice: toInt(product.costPrice, 0),

        unit: toCleanString(product.unit) || "1 шт",
        packageInfo:
          toCleanString(product.packageInfo) || "продається поштучно",

        description: toCleanString(product.description),
        details: toCleanString(product.details),
        composition: toCleanString(product.composition),
        allergens: toCleanString(product.allergens),
        storage: toCleanString(product.storage),

        statusLabel: toCleanString(product.statusLabel),
        stockStatus: toCleanString(product.stockStatus) || "in_stock",
        stockQuantity: toNullableInt(product.stockQuantity),

        active: product.active !== false,
        popular: Boolean(product.popular),
        purchaseCount: toInt(product.purchaseCount, 0),
        createdAt: toDate(product.createdAt, new Date()),
      },
    });
  }
}

async function importCustomers(tx, db) {
  const customers = Array.isArray(db.customers) ? db.customers : [];

  const usedPhones = new Set();
  const usedTelegrams = new Set();

  console.log(`Importing customers: ${customers.length}`);

  for (const customer of customers) {
    const id = toInt(customer.id, 0);

    if (!id) {
      console.warn("[WARN] Customer without valid id skipped:", customer);
      continue;
    }

    const phone = getUniqueNullable(
      customer.phone,
      usedPhones,
      normalizePhone,
      "phone"
    );

    const telegram = getUniqueNullable(
      customer.telegram,
      usedTelegrams,
      normalizeTelegram,
      "telegram"
    );

    await tx.customer.upsert({
      where: {
        id,
      },
      update: {
        name: toCleanString(customer.name) || "Клієнт",
        phone,
        telegram,

        passwordHash:
          toCleanString(customer.passwordHash) ||
          toCleanString(customer.password) ||
          "",

        building: toCleanString(customer.building),
        entrance: toCleanString(customer.entrance),
        floor: toCleanString(customer.floor),
        apartment: toCleanString(customer.apartment),

        telegramChatId: toCleanString(customer.telegramChatId),
        telegramVerifiedAt: toNullableDate(customer.telegramVerifiedAt),
        phoneVerifiedAt: toNullableDate(customer.phoneVerifiedAt),

        telegramVerificationCode: toCleanString(
          customer.telegramVerificationCode
        ),
        telegramVerificationExpiresAt: toNullableDate(
          customer.telegramVerificationExpiresAt
        ),
        telegramVerificationStartedAt: toNullableDate(
          customer.telegramVerificationStartedAt
        ),
        telegramVerificationChatId: toCleanString(
          customer.telegramVerificationChatId
        ),
        telegramVerificationUsername: toCleanString(
          customer.telegramVerificationUsername
        ),
        telegramVerificationCodeConfirmedAt: toNullableDate(
          customer.telegramVerificationCodeConfirmedAt
        ),
        telegramVerificationContactRequestedAt: toNullableDate(
          customer.telegramVerificationContactRequestedAt
        ),
      },
      create: {
        id,
        name: toCleanString(customer.name) || "Клієнт",
        phone,
        telegram,

        passwordHash:
          toCleanString(customer.passwordHash) ||
          toCleanString(customer.password) ||
          "",

        building: toCleanString(customer.building),
        entrance: toCleanString(customer.entrance),
        floor: toCleanString(customer.floor),
        apartment: toCleanString(customer.apartment),

        telegramChatId: toCleanString(customer.telegramChatId),
        telegramVerifiedAt: toNullableDate(customer.telegramVerifiedAt),
        phoneVerifiedAt: toNullableDate(customer.phoneVerifiedAt),

        telegramVerificationCode: toCleanString(
          customer.telegramVerificationCode
        ),
        telegramVerificationExpiresAt: toNullableDate(
          customer.telegramVerificationExpiresAt
        ),
        telegramVerificationStartedAt: toNullableDate(
          customer.telegramVerificationStartedAt
        ),
        telegramVerificationChatId: toCleanString(
          customer.telegramVerificationChatId
        ),
        telegramVerificationUsername: toCleanString(
          customer.telegramVerificationUsername
        ),
        telegramVerificationCodeConfirmedAt: toNullableDate(
          customer.telegramVerificationCodeConfirmedAt
        ),
        telegramVerificationContactRequestedAt: toNullableDate(
          customer.telegramVerificationContactRequestedAt
        ),

        createdAt: toDate(customer.createdAt, new Date()),
      },
    });
  }
}

async function importOrders(tx, db) {
  const orders = Array.isArray(db.orders) ? db.orders : [];
  const products = Array.isArray(db.products) ? db.products : [];

  const productIds = new Set(products.map((product) => toStringId(product.id)));

  console.log(`Importing orders: ${orders.length}`);

  for (const order of orders) {
    const id = toStringId(order.id, `order-${order.orderNumber || Date.now()}`);
    const createdAt = toDate(order.createdAt, new Date());

    const customerId = order.customerId ? toInt(order.customerId, 0) : null;

    const customerExists = customerId
      ? Boolean(
          await tx.customer.findUnique({
            where: {
              id: customerId,
            },
            select: {
              id: true,
            },
          })
        )
      : false;

    await tx.order.upsert({
      where: {
        id,
      },
      update: {
        orderNumber: toInt(order.orderNumber, 0),
        customerId: customerExists ? customerId : null,

        guestId: toNullableString(order.guestId),
        clientIp: toCleanString(order.clientIp),
        trustLevel: toCleanString(order.trustLevel) || "guest",

        customerName: toCleanString(order.customerName) || "Гість",
        customerPhone: toCleanString(order.customerPhone),
        customerTelegram: toCleanString(order.customerTelegram),

        deliveryType: toCleanString(order.deliveryType) || "pickup",
        building: toCleanString(order.building),
        entrance: toCleanString(order.entrance),
        floor: toCleanString(order.floor),
        apartment: toCleanString(order.apartment),

        paymentMethod:
          toCleanString(order.paymentMethod) || "Після підтвердження",
        paymentStatus: toCleanString(order.paymentStatus) || "unpaid",

        comment: toCleanString(order.comment),

        status: toCleanString(order.status) || "new",
        isFinal: Boolean(order.isFinal),
        finalType: toNullableString(order.finalType),
        finalizedAt: toNullableDate(order.finalizedAt),
        cancelReason: toCleanString(order.cancelReason),

        stockRestoredAt: toNullableDate(order.stockRestoredAt),

        total: toInt(order.total, 0),
      },
      create: {
        id,
        orderNumber: toInt(order.orderNumber, 0),
        createdAt,

        customerId: customerExists ? customerId : null,

        guestId: toNullableString(order.guestId),
        clientIp: toCleanString(order.clientIp),
        trustLevel: toCleanString(order.trustLevel) || "guest",

        customerName: toCleanString(order.customerName) || "Гість",
        customerPhone: toCleanString(order.customerPhone),
        customerTelegram: toCleanString(order.customerTelegram),

        deliveryType: toCleanString(order.deliveryType) || "pickup",
        building: toCleanString(order.building),
        entrance: toCleanString(order.entrance),
        floor: toCleanString(order.floor),
        apartment: toCleanString(order.apartment),

        paymentMethod:
          toCleanString(order.paymentMethod) || "Після підтвердження",
        paymentStatus: toCleanString(order.paymentStatus) || "unpaid",

        comment: toCleanString(order.comment),

        status: toCleanString(order.status) || "new",
        isFinal: Boolean(order.isFinal),
        finalType: toNullableString(order.finalType),
        finalizedAt: toNullableDate(order.finalizedAt),
        cancelReason: toCleanString(order.cancelReason),

        stockRestoredAt: toNullableDate(order.stockRestoredAt),

        total: toInt(order.total, 0),
      },
    });

    const orderItems = Array.isArray(order.items) ? order.items : [];

    for (const item of orderItems) {
      const productId = item.productId
        ? toStringId(item.productId)
        : item.id
          ? toStringId(item.id)
          : null;

      const existingProductId =
        productId && productIds.has(productId) ? productId : null;

      await tx.orderItem.create({
        data: {
          orderId: id,
          productId: existingProductId,

          name: toCleanString(item.name) || "Товар",
          brand: toCleanString(item.brand),
          unit: toCleanString(item.unit),
          packageInfo: toCleanString(item.packageInfo),

          price: toInt(item.price, 0),
          costPrice: toInt(item.costPrice, 0),
          quantity: toInt(item.quantity, 1),

          total: toInt(item.total, toInt(item.price, 0) * toInt(item.quantity, 1)),
          costTotal: toInt(item.costTotal, 0),
          profit: toInt(item.profit, 0),
        },
      });
    }

    const statusHistory = Array.isArray(order.statusHistory)
      ? order.statusHistory
      : [];

    for (const historyItem of statusHistory) {
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          at: toDate(historyItem.at, createdAt),
          type: toCleanString(historyItem.type) || "status",
          label: toCleanString(historyItem.label) || "Зміна статусу",
        },
      });
    }
  }
}

async function importSettings(tx, db) {
  const settings = [
    ["nextOrderNumber", db.nextOrderNumber || 1001],
    ["nextCustomerId", db.nextCustomerId || null],
    ["telegramUpdateOffset", db.telegramUpdateOffset || 0],
  ];

  for (const [key, value] of settings) {
    await tx.siteSetting.upsert({
      where: {
        key,
      },
      update: {
        value,
      },
      create: {
        key,
        value,
      },
    });
  }
}

async function printResult() {
  const result = {
    categories: await prisma.category.count(),
    subcategories: await prisma.subcategory.count(),
    products: await prisma.product.count(),
    customers: await prisma.customer.count(),
    orders: await prisma.order.count(),
    orderItems: await prisma.orderItem.count(),
    orderStatusHistory: await prisma.orderStatusHistory.count(),
  };

  console.log("Import result:");
  console.table(result);
}

async function main() {
  console.log("Reading db.json...");
  console.log(DB_JSON_PATH);

  const db = readJsonDatabase();

  await prisma.$transaction(
    async (tx) => {
      if (RESET_DATABASE_BEFORE_IMPORT) {
        await resetDatabase(tx);
      }

      await importCategories(tx, db);
      await importProducts(tx, db);
      await importCustomers(tx, db);
      await importOrders(tx, db);
      await importSettings(tx, db);
    },
    {
      timeout: 60_000,
      maxWait: 10_000,
    }
  );

  await printResult();

  console.log("JSON import completed.");
}

main()
  .catch((error) => {
    console.error("JSON import failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });