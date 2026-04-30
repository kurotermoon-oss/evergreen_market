const express = require("express");

const { readDatabase, writeDatabase } = require("../db.cjs");
const { requireAdmin } = require("../middleware/adminAuth.cjs");

const {
  ensureCategoriesStore,
  findCategory,
  findSubcategory,
  normalizeName,
  categoryNameExists,
  subcategoryNameExists,
  getCategoryProductCount,
  getSubcategoryProductCount,
  createCategory,
  createSubcategory,
} = require("../services/category.service.cjs");

const router = express.Router();

router.use(requireAdmin);

router.get("/", (req, res) => {
  const db = readDatabase();
  ensureCategoriesStore(db);

  res.json({
    categories: db.categories,
  });
});

router.post("/", (req, res) => {
  try {
    const db = readDatabase();
    const category = createCategory(db, req.body.name);

    writeDatabase(db);

    res.json({
      ok: true,
      category,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message || "Failed to create category",
    });
  }
});

router.patch("/:categoryId", (req, res) => {
  try {
    const db = readDatabase();
    ensureCategoriesStore(db);

    const category = findCategory(db, req.params.categoryId);

    if (!category) {
      return res.status(404).json({
        error: "Category not found",
      });
    }

    if (req.body.name !== undefined) {
      const name = normalizeName(req.body.name);

      if (!name) {
        return res.status(400).json({
          error: "Category name is required",
        });
      }

      if (categoryNameExists(db, name, category.id)) {
        return res.status(409).json({
          error: "Category already exists",
        });
      }

      category.name = name;
    }

    if (req.body.active !== undefined) {
      category.active = Boolean(req.body.active);
    }

    writeDatabase(db);

    res.json({
      ok: true,
      category,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message || "Failed to update category",
    });
  }
});

router.delete("/:categoryId", (req, res) => {
  try {
    const db = readDatabase();
    ensureCategoriesStore(db);

    const categoryId = req.params.categoryId;
    const categoryIndex = db.categories.findIndex(
      (category) => String(category.id) === String(categoryId)
    );

    if (categoryIndex === -1) {
      return res.status(404).json({
        error: "Category not found",
      });
    }

    const productCount = getCategoryProductCount(db, categoryId);

    if (productCount > 0) {
      return res.status(409).json({
        error: `Cannot delete category. It is used by ${productCount} products.`,
      });
    }

    const [deletedCategory] = db.categories.splice(categoryIndex, 1);

    writeDatabase(db);

    res.json({
      ok: true,
      category: deletedCategory,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      error: error.message || "Failed to delete category",
    });
  }
});

router.post("/:categoryId/subcategories", (req, res) => {
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
});

router.patch("/:categoryId/subcategories/:subcategoryId", (req, res) => {
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
});

router.delete("/:categoryId/subcategories/:subcategoryId", (req, res) => {
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
});

module.exports = router;