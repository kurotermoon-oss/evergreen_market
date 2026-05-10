const crypto = require("crypto");

const prisma = require("../database/prisma.cjs");

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

function slugify(value, fallback = "item") {
  const base = String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-zа-яіїєґ0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");

  return base || fallback;
}

function mapSubcategory(subcategory) {
  return {
    id: subcategory.id,
    name: subcategory.name,
    slug: subcategory.slug,
    active: subcategory.active,
    sortOrder: subcategory.sortOrder,
  };
}

function mapCategory(category) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    active: category.active,
    sortOrder: category.sortOrder,
    subcategories: (category.subcategories || []).map(mapSubcategory),
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

  return categories.map(mapCategory);
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

  return categories.map(mapCategory);
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
    },
    include: {
      subcategories: true,
    },
  });

  return mapCategory(category);
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

  return mapCategory(category);
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
    },
  });

  return mapSubcategory(subcategory);
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

  const subcategory = await prisma.subcategory.update({
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
    },
  });

  return mapSubcategory(subcategory);
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

  createAdminSubcategory,
  updateAdminSubcategory,
  deleteAdminSubcategory,
};