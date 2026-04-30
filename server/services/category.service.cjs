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

function normalizeName(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function normalizeForCompare(value) {
  return normalizeName(value).toLowerCase();
}

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function ensureCategoriesStore(db) {
  if (!Array.isArray(db.categories)) {
    db.categories = [];
  }

  db.categories.forEach((category) => {
    if (!Array.isArray(category.subcategories)) {
      category.subcategories = [];
    }

    if (category.active === undefined) {
      category.active = true;
    }

    category.subcategories.forEach((subcategory) => {
      if (subcategory.active === undefined) {
        subcategory.active = true;
      }
    });
  });
}

function makeUniqueId(items, name) {
  const baseId = slugify(name);

  if (!baseId) {
    throw createHttpError(400, "Name is required");
  }

  const existingIds = new Set((items || []).map((item) => String(item.id)));
  let candidate = baseId;
  let index = 2;

  while (existingIds.has(candidate)) {
    candidate = `${baseId}_${index}`;
    index += 1;
  }

  return candidate;
}

function findCategory(db, categoryId) {
  ensureCategoriesStore(db);

  return db.categories.find(
    (category) => String(category.id) === String(categoryId)
  );
}

function findSubcategory(category, subcategoryId) {
  if (!category || !Array.isArray(category.subcategories)) return null;

  return category.subcategories.find(
    (subcategory) => String(subcategory.id) === String(subcategoryId)
  );
}

function categoryNameExists(db, name, exceptCategoryId = "") {
  ensureCategoriesStore(db);

  const normalizedName = normalizeForCompare(name);

  return db.categories.some((category) => {
    if (String(category.id) === String(exceptCategoryId)) return false;

    return normalizeForCompare(category.name) === normalizedName;
  });
}

function subcategoryNameExists(category, name, exceptSubcategoryId = "") {
  const normalizedName = normalizeForCompare(name);

  return (category.subcategories || []).some((subcategory) => {
    if (String(subcategory.id) === String(exceptSubcategoryId)) return false;

    return normalizeForCompare(subcategory.name) === normalizedName;
  });
}

function getCategoryProductCount(db, categoryId) {
  if (!Array.isArray(db.products)) return 0;

  return db.products.filter(
    (product) => String(product.category) === String(categoryId)
  ).length;
}

function getSubcategoryProductCount(db, categoryId, subcategoryId) {
  if (!Array.isArray(db.products)) return 0;

  return db.products.filter((product) => {
    return (
      String(product.category) === String(categoryId) &&
      String(product.subcategory || "") === String(subcategoryId)
    );
  }).length;
}

function sanitizePublicCategory(category) {
  return {
    ...category,
    subcategories: (category.subcategories || []).filter(
      (subcategory) => subcategory.active !== false
    ),
  };
}

function createCategory(db, name) {
  ensureCategoriesStore(db);

  const categoryName = normalizeName(name);

  if (!categoryName) {
    throw createHttpError(400, "Category name is required");
  }

  if (categoryNameExists(db, categoryName)) {
    throw createHttpError(409, "Category already exists");
  }

  const category = {
    id: makeUniqueId(db.categories, categoryName),
    name: categoryName,
    active: true,
    subcategories: [],
  };

  db.categories.push(category);

  return category;
}

function createSubcategory(db, categoryId, name) {
  ensureCategoriesStore(db);

  const category = findCategory(db, categoryId);

  if (!category) {
    throw createHttpError(404, "Category not found");
  }

  const subcategoryName = normalizeName(name);

  if (!subcategoryName) {
    throw createHttpError(400, "Subcategory name is required");
  }

  if (subcategoryNameExists(category, subcategoryName)) {
    throw createHttpError(409, "Subcategory already exists in this category");
  }

  const subcategory = {
    id: makeUniqueId(category.subcategories, subcategoryName),
    name: subcategoryName,
    active: true,
  };

  category.subcategories.push(subcategory);

  return subcategory;
}

function resolveProductCategory(db, body) {
  ensureCategoriesStore(db);

  let categoryId = String(body.category || "").trim();
  let subcategoryId = String(body.subcategory || "").trim();

  const newCategoryName = normalizeName(body.newCategoryName);
  const newSubcategoryName = normalizeName(body.newSubcategoryName);

  let category = null;

  if (newCategoryName) {
    category = db.categories.find(
      (item) =>
        normalizeForCompare(item.name) === normalizeForCompare(newCategoryName)
    );

    if (!category) {
      category = createCategory(db, newCategoryName);
    }

    categoryId = category.id;
  } else {
    category = findCategory(db, categoryId);
  }

  if (!category) {
    throw createHttpError(400, "Valid category is required");
  }

  if (newSubcategoryName) {
    let subcategory = category.subcategories.find(
      (item) =>
        normalizeForCompare(item.name) ===
        normalizeForCompare(newSubcategoryName)
    );

    if (!subcategory) {
      subcategory = createSubcategory(db, category.id, newSubcategoryName);
    }

    subcategoryId = subcategory.id;
  }

  if (subcategoryId) {
    const subcategory = findSubcategory(category, subcategoryId);

    if (!subcategory) {
      throw createHttpError(
        400,
        "Subcategory does not belong to selected category"
      );
    }
  }

  return {
    categoryId: category.id,
    subcategoryId: subcategoryId || "",
  };
}

module.exports = {
  slugify,
  normalizeName,
  normalizeForCompare,
  createHttpError,
  ensureCategoriesStore,
  makeUniqueId,
  findCategory,
  findSubcategory,
  categoryNameExists,
  subcategoryNameExists,
  getCategoryProductCount,
  getSubcategoryProductCount,
  sanitizePublicCategory,
  createCategory,
  createSubcategory,
  resolveProductCategory,
};