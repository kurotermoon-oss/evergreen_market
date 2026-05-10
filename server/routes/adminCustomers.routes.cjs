const express = require("express");

const { requireAdmin } = require("../middleware/adminAuth.cjs");
const adminCustomersRepository = require("../repositories/adminCustomersRepository.cjs");

const router = express.Router();

router.use(requireAdmin);

router.get("/", async (req, res) => {
  try {
    const customers = await adminCustomersRepository.getAdminCustomers({
      search: req.query.search || "",
    });

    return res.json({
      customers,
    });
  } catch (error) {
    console.error("Get admin customers error:", error);

    return res.status(error.status || 500).json({
      error: "ADMIN_CUSTOMERS_FAILED",
      message: error.message || "Не вдалося завантажити клієнтів.",
    });
  }
});

router.get("/:id/orders", async (req, res) => {
  try {
    const orders = await adminCustomersRepository.getCustomerOrders(
      req.params.id
    );

    return res.json({
      orders,
    });
  } catch (error) {
    console.error("Get customer orders for admin error:", error);

    return res.status(error.status || 500).json({
      error: "ADMIN_CUSTOMER_ORDERS_FAILED",
      message: error.message || "Не вдалося завантажити замовлення клієнта.",
    });
  }
});

router.get("/security/blocked", async (req, res) => {
  try {
    const blockedCustomers =
      await adminCustomersRepository.getBlockedCustomers();

    return res.json({
      blockedCustomers,
    });
  } catch (error) {
    console.error("Get blocked customers error:", error);

    return res.status(error.status || 500).json({
      error: "BLOCKED_CUSTOMERS_FAILED",
      message: error.message || "Не вдалося завантажити блокування.",
    });
  }
});

router.post("/security/blocked", async (req, res) => {
  try {
    const blockedCustomer =
      await adminCustomersRepository.createBlockedCustomer(req.body);

    return res.json({
      ok: true,
      blockedCustomer,
    });
  } catch (error) {
    console.error("Create blocked customer error:", error);

    return res.status(error.status || 500).json({
      error: "CREATE_BLOCKED_CUSTOMER_FAILED",
      message: error.message || "Не вдалося створити блокування.",
    });
  }
});

router.delete("/security/blocked/:id", async (req, res) => {
  try {
    await adminCustomersRepository.deleteBlockedCustomer(req.params.id);

    return res.json({
      ok: true,
    });
  } catch (error) {
    console.error("Delete blocked customer error:", error);

    return res.status(error.status || 500).json({
      error: "DELETE_BLOCKED_CUSTOMER_FAILED",
      message: error.message || "Не вдалося видалити блокування.",
    });
  }
});

module.exports = router;