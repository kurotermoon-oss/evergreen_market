const crypto = require("crypto");

const prisma = require("../database/prisma.cjs");

const MAX_DB_INT = 2_147_483_647;
const MAX_MARKUP_PERCENT = 10000;

function toCleanString(value) {
  return String(value || "").trim();
}

function toBoolean(value, fallback = true) {
  if (value === undefined) return fallback;
  return Boolean(value);
}

function createEntityId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function createValidationError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function normalizeMarkupPercent(value) {
  const number = Number(String(value ?? "").trim().replace(",", "."));

  if (!Number.isFinite(number)) {
    throw createValidationError("Вкажіть коректний відсоток націнки.");
  }

  if (number < 0) {
    throw createValidationError("Націнка не може бути відʼємною.");
  }

  if (number > MAX_MARKUP_PERCENT) {
    throw createValidationError(
      `Націнка не може бути більшою за ${MAX_MARKUP_PERCENT}%.`
    );
  }

  return number;
}

function normalizeOptionalMarkupPercent(value) {
  if (value === undefined) return undefined;

  if (value === null || String(value).trim() === "") {
    return null;
  }

  return normalizeMarkupPercent(value);
}

function hasMarkupPercent(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return false;
  }

  const number = Number(value);
  return Number.isFinite(number) && number >= 0;
}

function calculatePriceByMarkup(costPrice, markupPercent) {
  const calculatedPrice = Number(costPrice || 0) * (1 + markupPercent / 100);

  if (!Number.isFinite(calculatedPrice)) {
    throw createValidationError("Не вдалося розрахувати ціну продажу.");
  }

  if (calculatedPrice > MAX_DB_INT) {
    throw createValidationError(
      `Розрахована ціна більша за допустимий максимум ${MAX_DB_INT}.`
    );
  }

  return Math.max(0, Math.round(calculatedPrice));
}

function slugify(value, fallback = "item") {
  const base = String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-zа-яіїєґ0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");

  return base || fallback;
}

function mapSubcategory(subcategory, options = {}) {
  return {
    id: subcategory.id,
    name: subcategory.name,
    slug: subcategory.slug,
    active: subcategory.active,
    sortOrder: subcategory.sortOrder,
    ...(options.includeAdminFields
      ? {
          markupPercent:
            subcategory.markupPercent === null ||
            subcategory.markupPercent === undefined
              ? null
              : Number(subcategory.markupPercent),
        }
      : {}),
  };
}

function mapCategory(category, options = {}) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    active: category.active,
    sortOrder: category.sortOrder,
    ...(options.includeAdminFields
      ? {
          markupPercent:
            category.markupPercent === null || category.markupPercent === undefined
              ? null
              : Number(category.markupPercent),
        }
      : {}),
    subcategories: (category.subcategories || []).map((subcategory) =>
      mapSubcategory(subcategory, options)
    ),
  };
}

async function getPublicCategories() {
  const categories = await prisma.category.findMany({
    where: {
      active: true,
    },
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        name: "asc",
      },
    ],
    include: {
      subcategories: {
        where: {
          active: true,
        },
        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            name: "asc",
          },
        ],
      },
    },
  });

  return categories.map((category) => mapCategory(category));
}

async function getAdminCategories() {
  const categories = await prisma.category.findMany({
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        name: "asc",
      },
    ],
    include: {
      subcategories: {
        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            name: "asc",
          },
        ],
      },
    },
  });

  return categories.map((category) =>
    mapCategory(category, { includeAdminFields: true })
  );
}

async function ensureUniqueCategorySlug(name, exceptId = "") {
  const baseSlug = slugify(name, "category");
  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await prisma.category.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    if (!existing || String(existing.id) === String(exceptId)) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

async function ensureUniqueSubcategorySlug(categoryId, name, exceptId = "") {
  const baseSlug = slugify(name, "subcategory");
  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await prisma.subcategory.findFirst({
      where: {
        categoryId,
        slug,
      },
      select: {
        id: true,
      },
    });

    if (!existing || String(existing.id) === String(exceptId)) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

async function categoryNameExists(name, exceptId = "") {
  const normalizedName = toCleanString(name).toLowerCase();

  if (!normalizedName) return false;

  const existing = await prisma.category.findFirst({
    where: {
      name: {
        equals: normalizedName,
        mode: "insensitive",
      },
      NOT: exceptId
        ? {
            id: String(exceptId),
          }
        : undefined,
    },
    select: {
      id: true,
    },
  });

  return Boolean(existing);
}

async function subcategoryNameExists(categoryId, name, exceptId = "") {
  const normalizedName = toCleanString(name).toLowerCase();

  if (!normalizedName) return false;

  const existing = await prisma.subcategory.findFirst({
    where: {
      categoryId,
      name: {
        equals: normalizedName,
        mode: "insensitive",
      },
      NOT: exceptId
        ? {
            id: String(exceptId),
          }
        : undefined,
    },
    select: {
      id: true,
    },
  });

  return Boolean(existing);
}

async function createAdminCategory(payload) {
  const name = toCleanString(payload.name);

  if (!name) {
    const error = new Error("Назва категорії обовʼязкова.");
    error.status = 400;
    throw error;
  }

  if (await categoryNameExists(name)) {
    const error = new Error("Категорія з такою назвою вже існує.");
    error.status = 409;
    throw error;
  }

  const category = await prisma.category.create({
    data: {
      id: createEntityId("category"),
      name,
      slug: await ensureUniqueCategorySlug(name),
      active: payload.active !== false,
      sortOrder: Number(payload.sortOrder || 0),
      markupPercent: normalizeOptionalMarkupPercent(payload.markupPercent),
    },
    include: {
      subcategories: true,
    },
  });

  return mapCategory(category, { includeAdminFields: true });
}

async function updateAdminCategory(id, payload) {
  const categoryId = String(id);

  const current = await prisma.category.findUnique({
    where: {
      id: categoryId,
    },
    include: {
      subcategories: true,
    },
  });

  if (!current) {
    const error = new Error("Категорію не знайдено.");
    error.status = 404;
    throw error;
  }

  const nextName =
    payload.name === undefined ? current.name : toCleanString(payload.name);

  if (!nextName) {
    const error = new Error("Назва категорії обовʼязкова.");
    error.status = 400;
    throw error;
  }

  if (nextName !== current.name && (await categoryNameExists(nextName, categoryId))) {
    const error = new Error("Категорія з такою назвою вже існує.");
    error.status = 409;
    throw error;
  }

  const category = await prisma.category.update({
    where: {
      id: categoryId,
    },
    data: {
      name: nextName,
      slug:
        nextName !== current.name
          ? await ensureUniqueCategorySlug(nextName, categoryId)
          : current.slug,
      active: toBoolean(payload.active, current.active),
      sortOrder:
        payload.sortOrder === undefined
          ? current.sortOrder
          : Number(payload.sortOrder || 0),
      markupPercent:
        payload.markupPercent === undefined
          ? current.markupPercent
          : normalizeOptionalMarkupPercent(payload.markupPercent),
    },
    include: {
      subcategories: {
        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            name: "asc",
          },
        ],
      },
    },
  });

  return mapCategory(category, { includeAdminFields: true });
}

async function deleteAdminCategory(id) {
  const categoryId = String(id);

  const category = await prisma.category.findUnique({
    where: {
      id: categoryId,
    },
    include: {
      subcategories: true,
    },
  });

  if (!category) {
    const error = new Error("Категорію не знайдено.");
    error.status = 404;
    throw error;
  }

  const productsCount = await prisma.product.count({
    where: {
      categoryId,
    },
  });

  if (productsCount > 0) {
    const error = new Error(
      `Категорію не можна видалити, бо вона використовується товарами: ${productsCount}.`
    );
    error.status = 409;
    throw error;
  }

  await prisma.$transaction(async (tx) => {
    await tx.subcategory.deleteMany({
      where: {
        categoryId,
      },
    });

    await tx.category.delete({
      where: {
        id: categoryId,
      },
    });
  });

  return {
    ok: true,
  };
}

async function applyAdminCategoryMarkup(id, payload = {}) {
  const categoryId = String(id);
  const markupPercent = normalizeMarkupPercent(payload.markupPercent);

  return prisma.$transaction(async (tx) => {
    const currentCategory = await tx.category.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!currentCategory) {
      const error = new Error("Категорію не знайдено.");
      error.status = 404;
      throw error;
    }

    const category = await tx.category.update({
      where: {
        id: categoryId,
      },
      data: {
        markupPercent,
      },
      include: {
        subcategories: true,
      },
    });

    const products = await tx.product.findMany({
      where: {
        categoryId,
      },
      select: {
        id: true,
        costPrice: true,
        priceMode: true,
        subcategoryId: true,
      },
    });

    const subcategoryMarkupById = new Map(
      (category.subcategories || []).map((subcategory) => [
        String(subcategory.id),
        subcategory.markupPercent,
      ])
    );

    const updates = products
      .filter((product) => String(product.priceMode || "auto") !== "manual")
      .filter((product) => Number(product.costPrice || 0) > 0)
      .map((product) => {
        const subcategoryMarkup = subcategoryMarkupById.get(
          String(product.subcategoryId || "")
        );
        const effectiveMarkupPercent = hasMarkupPercent(subcategoryMarkup)
          ? Number(subcategoryMarkup)
          : markupPercent;

        return {
          id: product.id,
          price: calculatePriceByMarkup(product.costPrice, effectiveMarkupPercent),
        };
      });

    for (const update of updates) {
      await tx.product.update({
        where: {
          id: update.id,
        },
        data: {
          price: update.price,
          priceMode: "auto",
        },
      });
    }

    return {
      ok: true,
      categoryId: category.id,
      categoryName: category.name,
      markupPercent,
      totalProducts: products.length,
      updated: updates.length,
      skippedManualPrice: products.filter(
        (product) => String(product.priceMode || "auto") === "manual"
      ).length,
      skippedWithoutCostPrice: products.filter((product) => {
        return (
          String(product.priceMode || "auto") !== "manual" &&
          Number(product.costPrice || 0) <= 0
        );
      }).length,
    };
  });
}

async function applySubcategoryEffectiveMarkup(tx, subcategory) {
  const categoryMarkupPercent = subcategory.category?.markupPercent;
  const effectiveMarkupPercent = hasMarkupPercent(subcategory.markupPercent)
    ? Number(subcategory.markupPercent)
    : hasMarkupPercent(categoryMarkupPercent)
      ? Number(categoryMarkupPercent)
      : null;

  const products = await tx.product.findMany({
    where: {
      categoryId: subcategory.categoryId,
      subcategoryId: subcategory.id,
    },
    select: {
      id: true,
      costPrice: true,
      priceMode: true,
    },
  });

  if (effectiveMarkupPercent === null) {
    return {
      totalProducts: products.length,
      updated: 0,
      skippedManualPrice: 0,
      skippedWithoutCostPrice: 0,
      skippedWithoutMarkup: products.length,
      effectiveMarkupPercent: null,
    };
  }

  const updates = products
    .filter((product) => String(product.priceMode || "auto") !== "manual")
    .filter((product) => Number(product.costPrice || 0) > 0)
    .map((product) => {
      return {
        id: product.id,
        price: calculatePriceByMarkup(product.costPrice, effectiveMarkupPercent),
      };
    });

  for (const update of updates) {
    await tx.product.update({
      where: {
        id: update.id,
      },
      data: {
        price: update.price,
        priceMode: "auto",
      },
    });
  }

  return {
    totalProducts: products.length,
    updated: updates.length,
    skippedManualPrice: products.filter(
      (product) => String(product.priceMode || "auto") === "manual"
    ).length,
    skippedWithoutCostPrice: products.filter((product) => {
      return (
        String(product.priceMode || "auto") !== "manual" &&
        Number(product.costPrice || 0) <= 0
      );
    }).length,
    skippedWithoutMarkup: 0,
    effectiveMarkupPercent,
  };
}

async function createAdminSubcategory(categoryId, payload) {
  const parentCategoryId = String(categoryId);
  const name = toCleanString(payload.name);

  if (!name) {
    const error = new Error("Назва підкатегорії обовʼязкова.");
    error.status = 400;
    throw error;
  }

  const category = await prisma.category.findUnique({
    where: {
      id: parentCategoryId,
    },
    select: {
      id: true,
    },
  });

  if (!category) {
    const error = new Error("Категорію не знайдено.");
    error.status = 404;
    throw error;
  }

  if (await subcategoryNameExists(parentCategoryId, name)) {
    const error = new Error("Підкатегорія з такою назвою вже існує в цій категорії.");
    error.status = 409;
    throw error;
  }

  const subcategory = await prisma.subcategory.create({
    data: {
      id: createEntityId("subcategory"),
      categoryId: parentCategoryId,
      name,
      slug: await ensureUniqueSubcategorySlug(parentCategoryId, name),
      active: payload.active !== false,
      sortOrder: Number(payload.sortOrder || 0),
      markupPercent: normalizeOptionalMarkupPercent(payload.markupPercent),
    },
  });

  return mapSubcategory(subcategory, { includeAdminFields: true });
}

async function updateAdminSubcategory(categoryId, subcategoryId, payload) {
  const parentCategoryId = String(categoryId);
  const currentSubcategoryId = String(subcategoryId);

  const current = await prisma.subcategory.findFirst({
    where: {
      id: currentSubcategoryId,
      categoryId: parentCategoryId,
    },
  });

  if (!current) {
    const error = new Error("Підкатегорію не знайдено.");
    error.status = 404;
    throw error;
  }

  const nextName =
    payload.name === undefined ? current.name : toCleanString(payload.name);

  if (!nextName) {
    const error = new Error("Назва підкатегорії обовʼязкова.");
    error.status = 400;
    throw error;
  }

  if (
    nextName !== current.name &&
    (await subcategoryNameExists(parentCategoryId, nextName, currentSubcategoryId))
  ) {
    const error = new Error("Підкатегорія з такою назвою вже існує в цій категорії.");
    error.status = 409;
    throw error;
  }

  const nextMarkupPercent = normalizeOptionalMarkupPercent(
    payload.markupPercent
  );
  const shouldRecalculateMarkup = payload.markupPercent !== undefined;

  return prisma.$transaction(async (tx) => {
    const subcategory = await tx.subcategory.update({
      where: {
        id: currentSubcategoryId,
      },
      data: {
        name: nextName,
        slug:
          nextName !== current.name
            ? await ensureUniqueSubcategorySlug(
                parentCategoryId,
                nextName,
                currentSubcategoryId
              )
            : current.slug,
        active: toBoolean(payload.active, current.active),
        sortOrder:
          payload.sortOrder === undefined
            ? current.sortOrder
            : Number(payload.sortOrder || 0),
        ...(nextMarkupPercent === undefined
          ? {}
          : {
              markupPercent: nextMarkupPercent,
            }),
      },
      include: {
        category: true,
      },
    });

    const markupResult = shouldRecalculateMarkup
      ? await applySubcategoryEffectiveMarkup(tx, subcategory)
      : null;

    return {
      ...mapSubcategory(subcategory, { includeAdminFields: true }),
      markupResult,
    };
  });
}

async function deleteAdminSubcategory(categoryId, subcategoryId) {
  const parentCategoryId = String(categoryId);
  const currentSubcategoryId = String(subcategoryId);

  const subcategory = await prisma.subcategory.findFirst({
    where: {
      id: currentSubcategoryId,
      categoryId: parentCategoryId,
    },
  });

  if (!subcategory) {
    const error = new Error("Підкатегорію не знайдено.");
    error.status = 404;
    throw error;
  }

  const productsCount = await prisma.product.count({
    where: {
      categoryId: parentCategoryId,
      subcategoryId: currentSubcategoryId,
    },
  });

  if (productsCount > 0) {
    const error = new Error(
      `Підкатегорію не можна видалити, бо вона використовується товарами: ${productsCount}.`
    );
    error.status = 409;
    throw error;
  }

  await prisma.subcategory.delete({
    where: {
      id: currentSubcategoryId,
    },
  });

  return {
    ok: true,
  };
}

module.exports = {
  getPublicCategories,
  getAdminCategories,

  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  applyAdminCategoryMarkup,

  createAdminSubcategory,
  updateAdminSubcategory,
  deleteAdminSubcategory,
};
