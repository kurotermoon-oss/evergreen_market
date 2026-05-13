const express = require("express");
const multer = require("multer");

const { requireAdmin } = require("../middleware/adminAuth.cjs");
const uploadsRepository = require("../repositories/uploadsRepository.cjs");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 6 * 1024 * 1024,
  },
});

router.use(requireAdmin);

router.post("/product-image", upload.single("image"), async (req, res) => {
  try {
    const result = await uploadsRepository.uploadProductImage(req.file);

    return res.json({
      ok: true,
      imageUrl: result.imageUrl,
      key: result.key,
    });
  } catch (error) {
    console.error("Upload product image error:", error);

    return res.status(error.status || 500).json({
      error: "PRODUCT_IMAGE_UPLOAD_FAILED",
      message: error.message || "Не вдалося завантажити зображення.",
    });
  }
});

module.exports = router;