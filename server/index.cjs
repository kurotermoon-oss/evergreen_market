const path = require("path");
const fs = require("fs");
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

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
  normalizeTelegram,
  sanitizeCustomer,
  hashPassword,
  verifyPassword,
  createCustomerToken,
  setCustomerCookie,
  clearCustomerCookie,
  ensureCustomersStore,
  getCustomerFromRequest,
} = require("./customerAuth.cjs");

const app = express();

const PORT = Number(process.env.PORT || 3001);
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const DEFAULT_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop";

const STOCK_STATUSES = new Set([
  "in_stock",
  "limited",
  "preorder",
  "out_of_stock",
]);

function toCleanString(value, fallback = "") {
  return String(value ?? fallback).trim();
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

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/admin", adminAuthRoutes);
app.use("/api/admin/analytics", adminAnalyticsRoutes);

console.log("[debug] adminAuthRoutes mounted");

app.get("/api/debug/routes", (req, res) => {
  res.json({
    ok: true,
    adminAuthRoutesType: typeof adminAuthRoutes,
    adminAuthStack: adminAuthRoutes.stack?.map((layer) => ({
      path: layer.route?.path,
      methods: layer.route?.methods,
    })),
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
  });
});

app.get("/api/categories", (req, res) => {
  const db = readDatabase();

  ensureCategoriesStore(db);

  res.json({
    categories: db.categories
      .filter((category) => category.active !== false)
      .map(sanitizePublicCategory),
  });
});

app.get("/api/products", (req, res) => {
  const db = readDatabase();

  res.json({
    products: db.products
      .filter((product) => product.active)
      .map(sanitizePublicProduct),
  });
});

app.post("/api/customer/register", (req, res) => {
  const db = readDatabase();

  ensureCustomersStore(db);

  const name = toCleanString(req.body.name);
  const phone = normalizePhone(req.body.phone);
  const telegram = normalizeTelegram(req.body.telegram);
  const password = String(req.body.password || "");

  if (!name) {
    return res.status(400).json({
      error: "Name is required",
    });
  }

  if (!phone && !telegram) {
    return res.status(400).json({
      error: "Phone or Telegram is required",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      error: "Password must be at least 6 characters",
    });
  }

  const exists = db.customers.find((customer) => {
    const samePhone = phone && customer.phone === phone;
    const sameTelegram = telegram && customer.telegram === telegram;

    return samePhone || sameTelegram;
  });

  if (exists) {
    return res.status(409).json({
      error: "Customer already exists",
    });
  }

  const customer = {
    id: db.nextCustomerId,
    name,
    phone,
    telegram,

    building: toCleanString(req.body.building),
    entrance: toCleanString(req.body.entrance),
    floor: toCleanString(req.body.floor),
    apartment: toCleanString(req.body.apartment),

    passwordHash: hashPassword(password),

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.nextCustomerId += 1;
  db.customers.push(customer);

  writeDatabase(db);

  const token = createCustomerToken(customer, JWT_SECRET);

  setCustomerCookie(res, token);

  res.json({
    ok: true,
    customer: sanitizeCustomer(customer),
  });
});

app.post("/api/customer/login", (req, res) => {
  const db = readDatabase();

  ensureCustomersStore(db);

  const login = toCleanString(req.body.login);
  const password = String(req.body.password || "");

  const normalizedPhone = normalizePhone(login);
  const normalizedTelegram = normalizeTelegram(login);

  const customer = db.customers.find((item) => {
    return (
      item.phone === normalizedPhone ||
      item.telegram === normalizedTelegram ||
      item.telegram === login.replace(/^@/, "").toLowerCase()
    );
  });

  if (!customer || !verifyPassword(password, customer.passwordHash)) {
    return res.status(401).json({
      error: "Wrong login or password",
    });
  }

  const token = createCustomerToken(customer, JWT_SECRET);

  setCustomerCookie(res, token);

  res.json({
    ok: true,
    customer: sanitizeCustomer(customer),
  });
});

app.post("/api/customer/logout", (req, res) => {
  clearCustomerCookie(res);

  res.json({
    ok: true,
  });
});

app.get("/api/customer/me", (req, res) => {
  const db = readDatabase();

  ensureCustomersStore(db);

  const customer = getCustomerFromRequest(req, db, JWT_SECRET);

  if (!customer) {
    return res.json({
      authenticated: false,
      customer: null,
    });
  }

  res.json({
    authenticated: true,
    customer: sanitizeCustomer(customer),
  });
});

app.get("/api/customer/orders", (req, res) => {
  const db = readDatabase();

  ensureCustomersStore(db);

  const customer = getCustomerFromRequest(req, db, JWT_SECRET);

  if (!customer) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  const orders = db.orders.filter((order) => {
    return Number(order.customerId) === Number(customer.id);
  });

  res.json({
    orders: orders.map(sanitizeOrderForCustomer),
  });
});

app.post("/api/orders", async (req, res) => {
  try {
    const { items, form } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: "Cart is empty",
      });
    }

    const db = readDatabase();

    ensureCustomersStore(db);

    const customer = getCustomerFromRequest(req, db, JWT_SECRET);

    const orderForm = {
      ...form,
    };

      const deliveryType =
        orderForm.deliveryType === "building" ? "building" : "pickup";

      if (customer) {
        orderForm.name = orderForm.name || customer.name;
        orderForm.phone = orderForm.phone || customer.phone;
        orderForm.telegram = orderForm.telegram || customer.telegram;

        if (deliveryType === "building") {
          orderForm.building = orderForm.building || customer.building || "";
          orderForm.entrance = orderForm.entrance || customer.entrance || "";
          orderForm.floor = orderForm.floor || customer.floor || "";
          orderForm.apartment = orderForm.apartment || customer.apartment || "";
        }
      }

      if (deliveryType !== "building") {
        orderForm.building = "";
        orderForm.entrance = "";
        orderForm.floor = "";
        orderForm.apartment = "";
      }

    if (!orderForm?.name || (!orderForm?.phone && !orderForm?.telegram)) {
      return res.status(400).json({
        error: "Name and phone or Telegram are required",
      });
    }

    const orderItems = [];

    for (const item of items) {
      const product = db.products.find((productItem) => {
        return (
          Number(productItem.id) === Number(item.id) &&
          productItem.active
        );
      });

      if (!product) {
        continue;
      }

      if (product.stockStatus === "out_of_stock") {
        return res.status(400).json({
          error: `${product.name} немає в наявності`,
        });
      }

      const quantity = Math.max(1, Number(item.quantity) || 1);

      if (
        product.stockStatus === "limited" &&
        Number(product.stockQuantity || 0) < quantity
      ) {
        return res.status(400).json({
          error: `Недостатньо ${product.name} на складі`,
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

    if (orderItems.length === 0) {
      return res.status(400).json({
        error: "No valid products in order",
      });
    }

    const total = orderItems.reduce((sum, item) => {
      return sum + item.total;
    }, 0);

    const order = {
      id: String(Date.now()),
      orderNumber: db.nextOrderNumber,
      createdAt: new Date().toISOString(),

      customerId: customer ? customer.id : null,

      customerName: orderForm.name,
      customerPhone: orderForm.phone || "",
      customerTelegram: orderForm.telegram || "",

      deliveryType,
      building: deliveryType === "building" ? orderForm.building || "" : "",
      entrance: deliveryType === "building" ? orderForm.entrance || "" : "",
      floor: deliveryType === "building" ? orderForm.floor || "" : "",
      apartment: deliveryType === "building" ? orderForm.apartment || "" : "",

      paymentMethod: orderForm.payment || "Після підтвердження",
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

    orderItems.forEach((orderItem) => {
      const product = db.products.find((item) => {
        return Number(item.id) === Number(orderItem.productId);
      });

      if (!product) {
        return;
      }

      product.purchaseCount =
        Number(product.purchaseCount || 0) + Number(orderItem.quantity || 0);

      if (product.stockStatus === "limited") {
        product.stockQuantity =
          Number(product.stockQuantity || 0) - Number(orderItem.quantity || 0);

        if (product.stockQuantity <= 0) {
          product.stockStatus = "out_of_stock";
          product.stockQuantity = 0;
        }
      }
    });

    db.nextOrderNumber += 1;
    db.orders.unshift(order);

    writeDatabase(db);

    const telegramMessage = formatOrderMessage({
      order,
    });

    const telegramResult = await sendTelegramMessage(telegramMessage);

    res.json({
      ok: true,
      order: sanitizeOrderForCustomer(order),
      telegramMessage,
      telegramResult,
    });
  } catch (error) {
    console.error("Create order error:", error);

    res.status(500).json({
      error: "Failed to create order",
    });
  }
});

app.get("/api/admin/products", requireAdmin, (req, res) => {
  const db = readDatabase();

  res.json({
    products: db.products,
  });
});

app.post(
  "/api/admin/categories/:categoryId/subcategories",
  requireAdmin,
  (req, res) => {
    try {
      const db = readDatabase();

      const subcategory = createSubcategory(
        db,
        req.params.categoryId,
        req.body.name
      );

      writeDatabase(db);

      res.json({
        ok: true,
        subcategory,
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        error: error.message || "Failed to create subcategory",
      });
    }
  }
);

app.patch(
  "/api/admin/categories/:categoryId/subcategories/:subcategoryId",
  requireAdmin,
  (req, res) => {
    try {
      const db = readDatabase();

      ensureCategoriesStore(db);

      const category = findCategory(db, req.params.categoryId);

      if (!category) {
        return res.status(404).json({
          error: "Category not found",
        });
      }

      const subcategory = findSubcategory(
        category,
        req.params.subcategoryId
      );

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

      res.json({
        ok: true,
        subcategory,
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        error: error.message || "Failed to update subcategory",
      });
    }
  }
);

app.delete(
  "/api/admin/categories/:categoryId/subcategories/:subcategoryId",
  requireAdmin,
  (req, res) => {
    try {
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

      res.json({
        ok: true,
        subcategory: deletedSubcategory,
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        error: error.message || "Failed to delete subcategory",
      });
    }
  }
);

app.get("/api/admin/orders", requireAdmin, (req, res) => {
  const db = readDatabase();

  res.json({
    orders: db.orders,
  });
});

app.post("/api/admin/telegram/sync-customers", requireAdmin, async (req, res) => {
  const db = readDatabase();

  const result = await syncCustomerTelegramChats(db, TELEGRAM_BOT_TOKEN);

  writeDatabase(db);

  res.json(result);
});

app.post("/api/admin/products", requireAdmin, (req, res) => {
  try {
    const db = readDatabase();

    const product = buildProductFromRequest(db, req.body);

    if (!product.name || product.price <= 0) {
      return res.status(400).json({
        error: "Product name and valid price are required",
      });
    }

    db.nextProductId += 1;
    db.products.unshift(product);

    writeDatabase(db);

    res.json({
      ok: true,
      product,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message || "Failed to create product",
    });
  }
});

app.patch("/api/admin/products/:id", requireAdmin, (req, res) => {
  try {
    const db = readDatabase();

    const productId = Number(req.params.id);

    if (!productId) {
      return res.status(400).json({
        error: "Invalid product id",
      });
    }

    const productIndex = db.products.findIndex((product) => {
      return Number(product.id) === productId;
    });

    if (productIndex === -1) {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    const current = db.products[productIndex];

    let categoryData = null;

    if (
      req.body.category !== undefined ||
      req.body.subcategory !== undefined ||
      req.body.newCategoryName ||
      req.body.newSubcategoryName
    ) {
      categoryData = resolveProductCategory(db, {
        category:
          req.body.category === undefined
            ? current.category
            : req.body.category,

        subcategory:
          req.body.subcategory === undefined
            ? current.subcategory
            : req.body.subcategory,

        newCategoryName: req.body.newCategoryName,
        newSubcategoryName: req.body.newSubcategoryName,
      });
    }

    const updated = buildUpdatedProduct(current, req.body, categoryData);

    if (!updated.name || Number(updated.price || 0) <= 0) {
      return res.status(400).json({
        error: "Product name and valid price are required",
      });
    }

    db.products[productIndex] = updated;

    writeDatabase(db);

    res.json({
      ok: true,
      product: updated,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message || "Failed to update product",
    });
  }
});

app.delete("/api/admin/products/:id", requireAdmin, (req, res) => {
  try {
    const db = readDatabase();

    const productId = Number(req.params.id);

    if (!productId) {
      return res.status(400).json({
        error: "Invalid product id",
      });
    }

    const productIndex = db.products.findIndex((product) => {
      return Number(product.id) === productId;
    });

    if (productIndex === -1) {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    const [deletedProduct] = db.products.splice(productIndex, 1);

    writeDatabase(db);

    res.json({
      ok: true,
      product: deletedProduct,
      deletedProductId: productId,
    });
  } catch (error) {
    console.error("Delete product error:", error);

    res.status(500).json({
      error: "Failed to delete product",
    });
  }
});

app.patch("/api/admin/orders/:id/action", requireAdmin, async (req, res) => {
  try {
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

    res.json({
      ok: true,
      order: updatedOrder,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message || "Failed to update order",
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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Evergreen backend running on port ${PORT}`);
});
