const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const publicRoutes = require("./routes/public.routes.cjs");
const customerRoutes = require("./routes/customer.routes.cjs");
const ordersRoutes = require("./routes/orders.routes.cjs");

const adminAuthRoutes = require("./routes/adminAuth.routes.cjs");
const adminProductsRoutes = require("./routes/adminProducts.routes.cjs");
const adminCategoriesRoutes = require("./routes/adminCategories.routes.cjs");
const adminOrdersRoutes = require("./routes/adminOrders.routes.cjs");
const adminAnalyticsRoutes = require("./routes/adminAnalytics.routes.cjs");
const adminTelegramRoutes = require("./routes/adminTelegram.routes.cjs");

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api", publicRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/orders", ordersRoutes);

app.use("/api/admin", adminAuthRoutes);
app.use("/api/admin/products", adminProductsRoutes);
app.use("/api/admin/categories", adminCategoriesRoutes);
app.use("/api/admin/orders", adminOrdersRoutes);
app.use("/api/admin/analytics", adminAnalyticsRoutes);
app.use("/api/admin/telegram", adminTelegramRoutes);

module.exports = app;