require("dotenv").config();
const { buildAnalytics } = require("./analytics.cjs");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const { readDatabase, writeDatabase } = require("./db.cjs");
const { formatOrderMessage } = require("./orderMessage.cjs");

const app = express();
console.log("ANALYTICS IMPORT:", require("./analytics.cjs"));
const PORT = Number(process.env.PORT || 3001);
const ADMIN_LOGIN = process.env.ADMIN_LOGIN || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "change-this-password";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

function createAdminToken() {
  return jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
}

function requireAdmin(req, res, next) {
  const token = req.cookies.admin_token;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    if (payload.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    req.admin = payload;
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/ї/g, "i")
    .replace(/і/g, "i")
    .replace(/є/g, "e")
    .replace(/ґ/g, "g")
    .replace(/[^a-zа-я0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "");
}

function ensureCategoryAndSubcategory(db, body) {
  let categoryId = body.category;
  let subcategoryId = body.subcategory;

  const newCategoryName = String(body.newCategoryName || "").trim();
  const newSubcategoryName = String(body.newSubcategoryName || "").trim();

  if (newCategoryName) {
    const generatedId = slugify(newCategoryName);

    let category = db.categories.find(
      (item) =>
        item.id === generatedId ||
        item.name.toLowerCase() === newCategoryName.toLowerCase()
    );

    if (!category) {
      category = {
        id: generatedId,
        name: newCategoryName,
        active: true,
        subcategories: [],
      };

      db.categories.push(category);
    }

    categoryId = category.id;
  }

  let category = db.categories.find((item) => item.id === categoryId);

  if (!category) {
    category = db.categories[0];
    categoryId = category?.id || "other";
  }

  if (!Array.isArray(category.subcategories)) {
    category.subcategories = [];
  }

  if (newSubcategoryName) {
    const generatedSubId = slugify(newSubcategoryName);

    let subcategory = category.subcategories.find(
      (item) =>
        item.id === generatedSubId ||
        item.name.toLowerCase() === newSubcategoryName.toLowerCase()
    );

    if (!subcategory) {
      subcategory = {
        id: generatedSubId,
        name: newSubcategoryName,
        active: true,
      };

      category.subcategories.push(subcategory);
    }

    subcategoryId = subcategory.id;
  }

  return {
    categoryId,
    subcategoryId: subcategoryId || "",
  };
}

async function sendTelegramMessage(text) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log("[Telegram skipped] TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is empty");
    console.log(text);
    return { ok: false, skipped: true };
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
    return { ok: false, error: errorText };
  }

  return response.json();
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/categories", (req, res) => {
  const db = readDatabase();

  res.json({
    categories: db.categories.filter((category) => category.active),
  });
});

app.get("/api/products", (req, res) => {
  const db = readDatabase();

  res.json({
    products: db.products.filter((product) => product.active),
  });
});

app.post("/api/orders", async (req, res) => {
  try {
    const { items, form } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    if (!form?.name || (!form?.phone && !form?.telegram)) {
      return res.status(400).json({
        error: "Name and phone or Telegram are required",
      });
    }

    const db = readDatabase();

    const orderItems = [];

    for (const item of items) {
      const product = db.products.find(
        (productItem) => productItem.id === Number(item.id) && productItem.active
      );

      if (!product) continue;
      if (product.stockStatus === "out_of_stock") {
        return res.status(400).json({
          error: `${product.name} немає в наявності`,
        });
      }

      if (
        product.stockStatus === "limited" &&
        Number(product.stockQuantity || 0) < Number(item.quantity || 1)
      ) {
        return res.status(400).json({
          error: `Недостатньо ${product.name} на складі`,
        });
      }

      const quantity = Math.max(1, Number(item.quantity) || 1);

      orderItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity,
        total: product.price * quantity,
      });
    }

    if (orderItems.length === 0) {
      return res.status(400).json({ error: "No valid products in order" });
    }

    const total = orderItems.reduce((sum, item) => sum + item.total, 0);

    const order = {
      id: String(Date.now()),
      orderNumber: db.nextOrderNumber,
      createdAt: new Date().toISOString(),

      customerName: form.name,
      customerPhone: form.phone || "",
      customerTelegram: form.telegram || "",

      deliveryType: form.deliveryType || "pickup",
      building: form.building || "",
      entrance: form.entrance || "",
      floor: form.floor || "",
      apartment: form.apartment || "",

      paymentMethod: form.payment || "Після підтвердження",
      paymentStatus: "Не оплачено",

      comment: form.comment || "",

      status: "Новий",
      items: orderItems,
      total,
    };

    orderItems.forEach((orderItem) => {
      const product = db.products.find((item) => item.id === orderItem.productId);

      if (product) {
        product.purchaseCount =
          Number(product.purchaseCount || 0) + Number(orderItem.quantity || 0);
      
      if (product.stockStatus === "limited") {
      product.stockQuantity -= orderItem.quantity;

          if (product.stockQuantity <= 0) {
            product.stockStatus = "out_of_stock";
            product.stockQuantity = 0;
          }
        }
        }
    });

    db.nextOrderNumber += 1;
    db.orders.unshift(order);

    writeDatabase(db);

    const telegramMessage = formatOrderMessage({ order });
    const telegramResult = await sendTelegramMessage(telegramMessage);

    res.json({
      ok: true,
      order,
      telegramMessage,
      telegramResult,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

app.post("/api/admin/login", (req, res) => {
  const { login, password } = req.body;

  if (login !== ADMIN_LOGIN || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Wrong login or password" });
  }

  const token = createAdminToken();

  res.cookie("admin_token", token, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ ok: true });
});

app.post("/api/admin/logout", (req, res) => {
  res.clearCookie("admin_token");
  res.json({ ok: true });
});

app.get("/api/admin/me", (req, res) => {
  const token = req.cookies.admin_token;

  if (!token) {
    return res.json({ authenticated: false });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    res.json({
      authenticated: payload.role === "admin",
    });
  } catch {
    res.json({ authenticated: false });
  }
});


app.get("/api/admin/analytics", requireAdmin, (req, res) => {
  const db = readDatabase();

  res.json(buildAnalytics(db));
});


app.get("/api/admin/products", requireAdmin, (req, res) => {
  const db = readDatabase();

  res.json({
    products: db.products,
  });
});

app.get("/api/admin/orders", requireAdmin, (req, res) => {
  const db = readDatabase();

  res.json({
    orders: db.orders,
  });
});

app.post("/api/admin/products", requireAdmin, (req, res) => {
  const db = readDatabase();
  const categoryData = ensureCategoryAndSubcategory(db, req.body);

  const product = {
    id: db.nextProductId,
    name: String(req.body.name || "").trim(),
    category: categoryData.categoryId,
    subcategory: categoryData.subcategoryId,
    description: String(req.body.description || "").trim(),
    details: String(req.body.details || "").trim(),
    unit: String(req.body.unit || "1 шт").trim(),
    packageInfo: String(req.body.packageInfo || "продається поштучно").trim(),
    price: Number(req.body.price) || 0,
    oldPrice: req.body.oldPrice ? Number(req.body.oldPrice) : null,
    image:
      req.body.image ||
      "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop",
    popular: Boolean(req.body.popular),
    active: req.body.active !== false,
    composition: String(req.body.composition || "").trim(),
    statusLabel: String(req.body.statusLabel || "Доступно для замовлення").trim(),
    purchaseCount: Number(req.body.purchaseCount || 0),
    stockStatus: req.body.stockStatus || "in_stock",
    stockQuantity:
      req.body.stockStatus === "limited"
        ? Number(req.body.stockQuantity || 0)
        : null,
  };

  if (!product.name || product.price <= 0) {
    return res.status(400).json({
      error: "Product name and valid price are required",
    });
  }

  db.nextProductId += 1;
  db.products.unshift(product);

  writeDatabase(db);

  res.json({ ok: true, product });
});

app.patch("/api/admin/products/:id", requireAdmin, (req, res) => {
  const db = readDatabase();

  const productId = Number(req.params.id);
  const productIndex = db.products.findIndex((product) => product.id === productId);

  if (productIndex === -1) {
    return res.status(404).json({ error: "Product not found" });
  }

  const current = db.products[productIndex];

  const updated = {
    ...current,
    ...req.body,
    id: current.id,
    price:
      req.body.price === undefined ? current.price : Number(req.body.price) || current.price,
    oldPrice:
      req.body.oldPrice === undefined || req.body.oldPrice === ""
        ? null
        : Number(req.body.oldPrice),
    purchaseCount:
      req.body.purchaseCount === undefined
        ? Number(current.purchaseCount || 0)
        : Number(req.body.purchaseCount || 0),
    popular:
      req.body.popular === undefined ? current.popular : Boolean(req.body.popular),
    active:
      req.body.active === undefined ? current.active : Boolean(req.body.active),

          stockStatus:
      req.body.stockStatus === undefined
        ? current.stockStatus || "in_stock"
        : req.body.stockStatus,

    stockQuantity:
      req.body.stockStatus === "limited"
        ? Number(req.body.stockQuantity || 0)
        : null,
  };

  db.products[productIndex] = updated;

  writeDatabase(db);

  res.json({ ok: true, product: updated });
});

app.delete("/api/admin/products/:id", requireAdmin, (req, res) => {
  const db = readDatabase();

  const productId = Number(req.params.id);
  const productIndex = db.products.findIndex((product) => product.id === productId);

  if (productIndex === -1) {
    return res.status(404).json({ error: "Product not found" });
  }

  const deletedProduct = db.products.splice(productIndex, 1)[0];

  writeDatabase(db);

  res.json({ ok: true, product: deletedProduct });
});

app.patch("/api/admin/orders/:id", requireAdmin, (req, res) => {
  const db = readDatabase();

  const orderId = req.params.id;
  const orderIndex = db.orders.findIndex((order) => order.id === orderId);

  if (orderIndex === -1) {
    return res.status(404).json({ error: "Order not found" });
  }

  db.orders[orderIndex] = {
    ...db.orders[orderIndex],
    status: req.body.status || db.orders[orderIndex].status,
    paymentStatus: req.body.paymentStatus || db.orders[orderIndex].paymentStatus,
    updatedAt: new Date().toISOString(),
  };

  writeDatabase(db);

  res.json({ ok: true, order: db.orders[orderIndex] });
});

app.listen(PORT, () => {
  console.log(`Evergreen backend running on http://localhost:${PORT}`);
});