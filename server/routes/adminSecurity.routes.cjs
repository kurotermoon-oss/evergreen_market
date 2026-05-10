    const express = require("express");

const { requireAdmin } = require("../middleware/adminAuth.cjs");
const adminSecurityRepository = require("../repositories/adminSecurityRepository.cjs");

const router = express.Router();

router.use(requireAdmin);

router.get("/guests", async (req, res) => {
  try {
    const guests = await adminSecurityRepository.getGuestActivity();

    return res.json({
      guests,
    });
  } catch (error) {
    console.error("Get guest activity error:", error);

    return res.status(error.status || 500).json({
      error: "GUEST_ACTIVITY_FAILED",
      message: error.message || "Не вдалося завантажити гостьову активність.",
    });
  }
});

router.get("/blocked", async (req, res) => {
  try {
    const blockedCustomers =
      await adminSecurityRepository.getBlockedCustomers();

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

router.post("/blocked", async (req, res) => {
  try {
    const blockedCustomer =
      await adminSecurityRepository.createBlockedCustomer(req.body);

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

router.delete("/blocked/:id", async (req, res) => {
  try {
    await adminSecurityRepository.deleteBlockedCustomer(req.params.id);

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