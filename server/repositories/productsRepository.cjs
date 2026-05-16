const crypto = require("crypto");

const prisma = require("../database/prisma.cjs");
const categoriesRepository = require("./categoriesRepository.cjs");

function toCleanString(value) {
  return String(value || "").trim();
}

const MAX_DB_INT = 2_147_483_647;

function createValidationError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function toInt(value, fallback = 0, fieldName = "Числове поле") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  if (number < 0) {
    throw createValidationError(`${fieldName} не може бути відʼємним.`);
  }

  if (number > MAX_DB_INT) {
    throw createValidationError(
      `${fieldName} має занадто велике значення. Максимум — ${MAX_DB_INT}.`
    );
  }

  return Math.round(number);
}

function toNullableInt(value, fieldName = "Числове поле") {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  if (number < 0) {
    throw createValidationError(`${fieldName} не може бути відʼємним.`);
  }

  if (number > MAX_DB_INT) {
    throw createValidationError(
      `${fieldName} має занадто велике значення. Максимум — ${MAX_DB_INT}.`
    );
  }

  return Math.round(number);
}

function mapProductForPublic(product) {
  return {
    id: product.id,

    name: product.name,
    brand: product.brand || "",
    productType: product.productType || "",
    countryOfOrigin: product.countryOfOrigin || "",
    image: product.image || "",

    category: product.categoryId,
    subcategory: product.subcategoryId || "",

    price: Number(product.price || 0),
    oldPrice: product.oldPrice === null ? null : Number(product.oldPrice),

    unit: product.unit || "1 шт",
    packageInfo: product.packageInfo || "продається поштучно",

    description: product.description || "",
    details: product.details || "",
    benefits: product.benefits || "",
    composition: product.composition || "",
    allergens: product.allergens || "",
    storage: product.storage || product.storageConditions || "",
    storageConditions: product.storageConditions || product.storage || "",

    statusLabel: product.statusLabel || "",
    stockStatus: product.stockStatus || "in_stock",
    stockQuantity:
      product.stockQuantity === null || product.stockQuantity === undefined
        ? null
        : Number(product.stockQuantity),

    active: product.active !== false,
    popular: Boolean(product.popular),
    purchaseCount: Number(product.purchaseCount || 0),

    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

function mapProductForAdmin(product) {
  return {
    ...mapProductForPublic(product),

    costPrice: Number(product.costPrice || 0),
  };
}

function createProductId() {
  return `product_${crypto.randomUUID()}`;
}

async function getPublicProducts() {
  const products = await prisma.product.findMany({
    where: {
      active: true,
      category: {
        active: true,
      },
      OR: [
        {
          subcategoryId: null,
        },
        {
          subcategory: {
            active: true,
          },
        },
      ],
    },
    orderBy: [
      {
        createdAt: "desc",
      },
    ],
  });

  return products.map(mapProductForPublic);
}

async function getAdminProducts() {
  const products = await prisma.product.findMany({
    orderBy: [
      {
        createdAt: "desc",
      },
    ],
  });

  return products.map(mapProductForAdmin);
}

async function findCategoryByIdOrName(value) {
  const cleanValue = toCleanString(value);

  if (!cleanValue) return null;

  const byId = await prisma.category.findUnique({
    where: {
      id: cleanValue,
    },
    select: {
      id: true,
    },
  });

  if (byId) return byId;

  return prisma.category.findFirst({
    where: {
      name: {
        equals: cleanValue,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
    },
  });
}

async function findSubcategoryByIdOrName(categoryId, value) {
  const cleanValue = toCleanString(value);

  if (!cleanValue || cleanValue === "all" || cleanValue === "none") {
    return null;
  }

  const byId = await prisma.subcategory.findFirst({
    where: {
      id: cleanValue,
      categoryId,
    },
    select: {
      id: true,
    },
  });

  if (byId) return byId;

  return prisma.subcategory.findFirst({
    where: {
      categoryId,
      name: {
        equals: cleanValue,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
    },
  });
}

async function resolveCategoryId(payloadCategoryId, fallbackCategoryId = "") {
  const categoryValue = toCleanString(payloadCategoryId);

  if (categoryValue) {
    const existingCategory = await findCategoryByIdOrName(categoryValue);

    if (existingCategory) {
      return existingCategory.id;
    }

    const createdCategory = await categoriesRepository.createAdminCategory({
      name: categoryValue,
    });

    return createdCategory.id;
  }

  const fallbackValue = toCleanString(fallbackCategoryId);

  if (fallbackValue) {
    const fallbackCategory = await findCategoryByIdOrName(fallbackValue);

    if (fallbackCategory) {
      return fallbackCategory.id;
    }
  }

  const firstCategory = await prisma.category.findFirst({
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        name: "asc",
      },
    ],
    select: {
      id: true,
    },
  });

  if (firstCategory) {
    return firstCategory.id;
  }

  const createdCategory = await categoriesRepository.createAdminCategory({
    name: "Без категорії",
  });

  return createdCategory.id;
}

async function resolveSubcategoryId(payloadSubcategoryId, categoryId) {
  const subcategoryValue = toCleanString(payloadSubcategoryId);

  if (
    !subcategoryValue ||
    subcategoryValue === "all" ||
    subcategoryValue === "none"
  ) {
    return null;
  }

  const existingSubcategory = await findSubcategoryByIdOrName(
    categoryId,
    subcategoryValue
  );

  if (existingSubcategory) {
    return existingSubcategory.id;
  }

  const createdSubcategory =
    await categoriesRepository.createAdminSubcategory(categoryId, {
      name: subcategoryValue,
    });

  return createdSubcategory.id;
}

async function buildProductData(payload, existingProduct = null) {
  const name = toCleanString(payload.name ?? existingProduct?.name);

  if (!name) {
    throw createValidationError("Назва товару обовʼязкова.");
  }

  const categoryId = await resolveCategoryId(
    payload.newCategoryName || payload.category || payload.categoryId,
    existingProduct?.categoryId
  );

  const subcategoryId = await resolveSubcategoryId(
    payload.newSubcategoryName || payload.subcategory || payload.subcategoryId,
    categoryId
  );

  return {
    name,
    brand: toCleanString(payload.brand ?? existingProduct?.brand),
    productType: toCleanString(
      payload.productType ?? existingProduct?.productType
    ),
    countryOfOrigin: toCleanString(
      payload.countryOfOrigin ?? existingProduct?.countryOfOrigin
    ),
    image: toCleanString(payload.image ?? existingProduct?.image),

    categoryId,
    subcategoryId,

    price: toInt(payload.price ?? existingProduct?.price, 0, "Ціна"),
    oldPrice: toNullableInt(
      payload.oldPrice ?? existingProduct?.oldPrice,
      "Стара ціна"
    ),
    costPrice: toInt(
      payload.costPrice ?? existingProduct?.costPrice,
      0,
      "Собівартість"
    ),

    unit: toCleanString(payload.unit ?? existingProduct?.unit) || "1 шт",
    packageInfo:
      toCleanString(payload.packageInfo ?? existingProduct?.packageInfo) ||
      "продається поштучно",

    description: toCleanString(
      payload.description ?? existingProduct?.description
    ),
    details: toCleanString(payload.details ?? existingProduct?.details),
    benefits: toCleanString(payload.benefits ?? existingProduct?.benefits),
    composition: toCleanString(
      payload.composition ?? existingProduct?.composition
    ),
    allergens: toCleanString(payload.allergens ?? existingProduct?.allergens),
    storage: toCleanString(
      payload.storage ??
        payload.storageConditions ??
        existingProduct?.storage ??
        existingProduct?.storageConditions
    ),
    storageConditions: toCleanString(
      payload.storageConditions ??
        payload.storage ??
        existingProduct?.storageConditions ??
        existingProduct?.storage
    ),

    statusLabel: toCleanString(
      payload.statusLabel ?? existingProduct?.statusLabel
    ),
    stockStatus:
      toCleanString(payload.stockStatus ?? existingProduct?.stockStatus) ||
      "in_stock",
    stockQuantity: toNullableInt(
      payload.stockQuantity ?? existingProduct?.stockQuantity,
      "Кількість на складі"
    ),

    active:
      payload.active === undefined
        ? existingProduct?.active ?? true
        : payload.active !== false,

    popular:
      payload.popular === undefined
        ? Boolean(existingProduct?.popular)
        : Boolean(payload.popular),

    purchaseCount: toInt(
      payload.purchaseCount ?? existingProduct?.purchaseCount,
      0,
      "Кількість покупок"
    ),
  };
}

async function createAdminProduct(payload) {
  const productId = toCleanString(payload.id) || createProductId();
  const data = await buildProductData(payload);

  const product = await prisma.product.create({
    data: {
      id: productId,
      ...data,
    },
  });

  return mapProductForAdmin(product);
}

async function updateAdminProduct(id, payload) {
  const productId = toCleanString(id);

  const existingProduct = await prisma.product.findUnique({
    where: {
      id: productId,
    },
  });

  if (!existingProduct) {
    const error = new Error("Товар не знайдено.");
    error.status = 404;
    throw error;
  }

  const data = await buildProductData(payload, existingProduct);

  const product = await prisma.product.update({
    where: {
      id: productId,
    },
    data,
  });

  return mapProductForAdmin(product);
}

async function deleteAdminProduct(id) {
  const productId = toCleanString(id);

  const existingProduct = await prisma.product.findUnique({
    where: {
      id: productId,
    },
    select: {
      id: true,
    },
  });

  if (!existingProduct) {
    const error = new Error("Товар не знайдено.");
    error.status = 404;
    throw error;
  }

  await prisma.product.delete({
    where: {
      id: productId,
    },
  });

  return {
    ok: true,
  };
}

async function importAdminProducts(rows = []) {
  const productRows = Array.isArray(rows) ? rows : [];
  const summary = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  for (const [index, row] of productRows.entries()) {
    const rowNumber = Number(row.rowNumber || index + 2);

    try {
      const productId = toCleanString(row.id);
      const name = toCleanString(row.name);

      if (!name) {
        summary.skipped += 1;
        summary.errors.push({
          rowNumber,
          message: "Назва товару обовʼязкова.",
        });
        continue;
      }

      if (productId) {
        const existingProduct = await prisma.product.findUnique({
          where: {
            id: productId,
          },
          select: {
            id: true,
          },
        });

        if (existingProduct) {
          await updateAdminProduct(productId, row);
          summary.updated += 1;
          continue;
        }
      }

      await createAdminProduct(row);
      summary.created += 1;
    } catch (error) {
      summary.skipped += 1;
      summary.errors.push({
        rowNumber,
        message: error.message || "Не вдалося імпортувати товар.",
      });
    }
  }

  return summary;
}

module.exports = {
  getPublicProducts,

  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  importAdminProducts,
};
