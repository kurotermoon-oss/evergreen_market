const crypto = require("crypto");

const prisma = require("../database/prisma.cjs");

const MAX_DB_INT = 2_147_483_647;

function toCleanString(value) {
  return String(value || "").trim();
}

function createValidationError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
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
    throw createValidationError(`${fieldName} не може бути від'ємним.`);
  }

  if (number > MAX_DB_INT) {
    throw createValidationError(
      `${fieldName} має занадто велике значення. Максимум - ${MAX_DB_INT}.`
    );
  }

  return Math.round(number);
}

function slugifySupplierId(value) {
  const slug = toCleanString(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `supplier-${crypto.randomUUID().slice(0, 8)}`;
}

async function createUniqueSupplierId(seedValue) {
  const baseId = slugifySupplierId(seedValue);
  let candidate = baseId;
  let index = 2;

  while (
    await prisma.supplier.findUnique({
      where: {
        id: candidate,
      },
      select: {
        id: true,
      },
    })
  ) {
    candidate = `${baseId}-${index}`;
    index += 1;
  }

  return candidate;
}

function mapSupplier(supplier) {
  if (!supplier) return null;

  return {
    id: supplier.id,
    name: supplier.name || "",
    minOrderAmount: Number(supplier.minOrderAmount || 0),
    isActive: supplier.isActive !== false,
    comment: supplier.comment || "",
    createdAt: supplier.createdAt,
    updatedAt: supplier.updatedAt,
  };
}

function buildSupplierData(payload = {}, existingSupplier = null) {
  const name = toCleanString(payload.name ?? existingSupplier?.name);

  if (!name) {
    throw createValidationError("Назва постачальника обов'язкова.");
  }

  return {
    name,
    minOrderAmount: toInt(
      payload.minOrderAmount ?? existingSupplier?.minOrderAmount,
      0,
      "Мінімальна сума замовлення"
    ),
    isActive:
      payload.isActive === undefined
        ? existingSupplier?.isActive ?? true
        : payload.isActive !== false,
    comment: toCleanString(payload.comment ?? existingSupplier?.comment),
  };
}

async function getAdminSuppliers() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: [
      {
        name: "asc",
      },
    ],
  });

  return suppliers.map(mapSupplier);
}

async function getPublicSuppliers() {
  const suppliers = await prisma.supplier.findMany({
    where: {
      isActive: true,
    },
    orderBy: [
      {
        name: "asc",
      },
    ],
  });

  return suppliers.map(mapSupplier);
}

async function createAdminSupplier(payload = {}) {
  const data = buildSupplierData(payload);
  const requestedId = toCleanString(payload.id);
  const supplierId = requestedId || (await createUniqueSupplierId(data.name));

  if (requestedId) {
    const existingSupplier = await prisma.supplier.findUnique({
      where: {
        id: requestedId,
      },
      select: {
        id: true,
      },
    });

    if (existingSupplier) {
      throw createValidationError("Постачальник з таким id вже існує.", 409);
    }
  }

  const supplier = await prisma.supplier.create({
    data: {
      id: supplierId,
      ...data,
    },
  });

  return mapSupplier(supplier);
}

async function updateAdminSupplier(id, payload = {}) {
  const supplierId = toCleanString(id);

  const existingSupplier = await prisma.supplier.findUnique({
    where: {
      id: supplierId,
    },
  });

  if (!existingSupplier) {
    throw createValidationError("Постачальника не знайдено.", 404);
  }

  const supplier = await prisma.supplier.update({
    where: {
      id: supplierId,
    },
    data: buildSupplierData(payload, existingSupplier),
  });

  return mapSupplier(supplier);
}

async function deleteAdminSupplier(id) {
  const supplierId = toCleanString(id);

  const existingSupplier = await prisma.supplier.findUnique({
    where: {
      id: supplierId,
    },
    select: {
      id: true,
    },
  });

  if (!existingSupplier) {
    throw createValidationError("Постачальника не знайдено.", 404);
  }

  const productsCount = await prisma.product.count({
    where: {
      supplierId,
    },
  });

  if (productsCount > 0) {
    throw createValidationError(
      `Не можна видалити постачальника: він використовується у ${productsCount} товарах. Вимкніть його або перенесіть товари до іншого постачальника.`,
      409
    );
  }

  await prisma.supplier.delete({
    where: {
      id: supplierId,
    },
  });

  return {
    ok: true,
  };
}

module.exports = {
  mapSupplier,
  getAdminSuppliers,
  getPublicSuppliers,
  createAdminSupplier,
  updateAdminSupplier,
  deleteAdminSupplier,
};
