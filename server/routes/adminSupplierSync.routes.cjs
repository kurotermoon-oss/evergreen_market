const express = require("express");

const { requireAdmin } = require("../middleware/adminAuth.cjs");
const supplierSyncService = require("../services/supplierAvailabilitySync.cjs");

const router = express.Router();

router.use(requireAdmin);

function ensurePostgres(req, res, next) {
  if (process.env.USE_POSTGRES === "true") {
    return next();
  }

  return res.status(409).json({
    error: "SUPPLIER_SYNC_REQUIRES_POSTGRES",
    message: "Синхронізація постачальника доступна лише з PostgreSQL.",
  });
}

function sendError(res, error, fallbackMessage) {
  console.error("Supplier sync route error:", error);

  return res.status(error.status || 500).json({
    error: error.code || "SUPPLIER_SYNC_FAILED",
    message: error.message || fallbackMessage,
  });
}

router.use(ensurePostgres);

router.get("/:supplierId", async (req, res) => {
  try {
    const dashboard = await supplierSyncService.getSupplierSyncDashboard(
      req.params.supplierId
    );

    return res.json(dashboard);
  } catch (error) {
    return sendError(res, error, "Не вдалося завантажити синхронізацію.");
  }
});

router.patch("/:supplierId/settings", async (req, res) => {
  try {
    const supplier = await supplierSyncService.updateSupplierSyncSettings(
      req.params.supplierId,
      req.body
    );

    return res.json({
      ok: true,
      supplier,
    });
  } catch (error) {
    return sendError(res, error, "Не вдалося зберегти налаштування.");
  }
});

router.patch("/:supplierId/products/:productId", async (req, res) => {
  try {
    const product = await supplierSyncService.updateProductSyncMapping(
      req.params.supplierId,
      req.params.productId,
      req.body
    );

    return res.json({
      ok: true,
      product,
    });
  } catch (error) {
    return sendError(res, error, "Не вдалося оновити привʼязку товару.");
  }
});

router.post("/:supplierId/run", async (req, res) => {
  try {
    const run = await supplierSyncService.runSupplierSync(req.params.supplierId, {
      trigger: "manual",
      dryRun: req.body?.dryRun === true,
      force: req.body?.force === true,
    });

    return res.json({
      ok: true,
      run,
    });
  } catch (error) {
    return sendError(res, error, "Не вдалося виконати синхронізацію.");
  }
});

module.exports = router;
