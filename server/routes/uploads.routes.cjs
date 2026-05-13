const express = require("express");

const uploadsRepository = require("../repositories/uploadsRepository.cjs");

const router = express.Router();

router.get(/^\/(.+)$/, async (req, res) => {
  try {
    const key = req.params[0];
    const object = await uploadsRepository.getUploadedObject(key);

    res.setHeader("Content-Type", object.ContentType || "image/webp");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    if (object.ContentLength) {
      res.setHeader("Content-Length", String(object.ContentLength));
    }

    object.Body.pipe(res);
  } catch (error) {
    console.error("Get uploaded image error:", error);

    return res.status(error.status || 404).send("Image not found");
  }
});

module.exports = router;