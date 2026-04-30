require("dotenv").config();

const { buildAnalytics } = require("./analytics.cjs");
const { applyOrderAction } = require("./orderWorkflow.cjs");
const {
  syncCustomerTelegramChats,
  notifyCustomerOrderReady,
} = require("./telegramCustomerNotify.cjs");

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

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

  const name = String(req.body.name || "").trim();
  const phone = normalizePhone(req.body.phone);
  const telegram = normalizeTelegram(req.body.telegram);
  const password = String(req.body.password || "");

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
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

    building: String(req.body.building || "").trim(),
    entrance: String(req.body.entrance || "").trim(),
    floor: String(req.body.floor || "").trim(),
    apartment: String(req.body.apartment || "").trim(),

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

  const login = String(req.body.login || "").trim();
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

  const orders = db.orders.filter(
    (order) => Number(order.customerId) === Number(customer.id)
  );

  res.json({
    orders: orders.map(sanitizeOrderForCustomer),
  });
});


app.post("/api/orders", async (req, res) => {
  try {
    const { items, form } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }


    const db = readDatabase();


    ensureCustomersStore(db);

const customer = getCustomerFromRequest(req, db, JWT_SECRET);

const orderForm = {
  ...form,
};

if (customer) {
  orderForm.name = orderForm.name || customer.name;
  orderForm.phone = orderForm.phone || customer.phone;
  orderForm.telegram = orderForm.telegram || customer.telegram;
  orderForm.building = orderForm.building || customer.building || "";
  orderForm.entrance = orderForm.entrance || customer.entrance || "";
  orderForm.floor = orderForm.floor || customer.floor || "";
  orderForm.apartment = orderForm.apartment || customer.apartment || "";
}
    if (!orderForm?.name || (!orderForm?.phone && !orderForm?.telegram)) {
      return res.status(400).json({
        error: "Name and phone or Telegram are required",
      });
    }

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

      const price = Number(product.price || 0);
      const costPrice = Number(product.costPrice || 0);
      const total = price * quantity;
      const costTotal = costPrice * quantity;

      orderItems.push({
        productId: product.id,
        name: product.name,
        price,
        costPrice,
        quantity,
        total,
        costTotal,
        profit: total - costTotal,
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

      customerId: customer ? customer.id : null,

      customerName: orderForm.name,
      customerPhone: orderForm.phone || "",
      customerTelegram: orderForm.telegram || "",

      deliveryType: orderForm.deliveryType || "pickup",
      building: orderForm.building || "",
      entrance: orderForm.entrance || "",
      floor: orderForm.floor || "",
      apartment: orderForm.apartment || "",

      paymentMethod: orderForm.payment || "Після підтвердження",
      paymentStatus: "Не оплачено",

      comment: orderForm.comment || "",

      status: "Новий",

      isFinal: false,
      finalType: null,
      finalizedAt: null,
      cancelReason: "",
      stockRestoredAt: null,

      statusHistory: [
        {
          at: new Date().toISOString(),
          type: "created",
          label: "Замовлення створено",
        },
      ],
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
      order: sanitizeOrderForCustomer(order),
      telegramMessage,
      telegramResult,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create order" });
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
        (subcategory) =>
          String(subcategory.id) === String(req.params.subcategoryId)
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
    const categoryData = resolveProductCategory(db, req.body);

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
    costPrice: Number(req.body.costPrice || 0),
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
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message || "Failed to create product",
    });
  }
});

app.patch("/api/admin/products/:id", requireAdmin, (req, res) => {
  const db = readDatabase();

  const productId = Number(req.params.id);
  const productIndex = db.products.findIndex((product) => product.id === productId);

  if (productIndex === -1) {
    return res.status(404).json({ error: "Product not found" });
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
      req.body.category === undefined ? current.category : req.body.category,
    subcategory:
      req.body.subcategory === undefined
        ? current.subcategory
        : req.body.subcategory,
    newCategoryName: req.body.newCategoryName,
    newSubcategoryName: req.body.newSubcategoryName,
  });
}


const updated = {
  ...current,
  ...req.body,
  id: current.id,
  category: categoryData ? categoryData.categoryId : current.category,
  subcategory: categoryData ? categoryData.subcategoryId : current.subcategory,
  price:
    req.body.price === undefined ? current.price : Number(req.body.price) || current.price,
    
    costPrice:
      req.body.costPrice === undefined
        ? Number(current.costPrice || 0)
        : Number(req.body.costPrice || 0),

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
  try {
    const db = readDatabase();

    const productId = Number(req.params.id);

    if (!productId) {
      return res.status(400).json({
        error: "Invalid product id",
      });
    }

    const productIndex = db.products.findIndex(
      (product) => Number(product.id) === productId
    );

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
      return res.status(404).json({ error: "Order not found" });
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

app.listen(PORT, () => {
  console.log(`Evergreen backend running on http://localhost:${PORT}`);
});