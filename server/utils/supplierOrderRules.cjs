const SUPPLIER_ORDER = "supplier_order";

function toMoney(value) {
  const number = Number(value || 0);

  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0;
}

function getSupplierId(item = {}) {
  return String(item.supplierId || item.supplier?.id || "").trim();
}

function getSupplierName(item = {}) {
  return (
    String(item.supplier?.name || "").trim() ||
    String(item.supplierName || "").trim() ||
    "цього постачальника"
  );
}

function getItemTotal(item = {}) {
  const total = Number(item.total);

  if (Number.isFinite(total)) {
    return Math.max(0, Math.round(total));
  }

  return toMoney(item.price) * Math.max(1, Number(item.quantity) || 1);
}

function createValidationResult(message, details = {}) {
  return {
    ok: false,
    status: 400,
    error: details.error || "SUPPLIER_ORDER_RULES_FAILED",
    message,
    hint: details.hint || "",
    errors: {
      cart: message,
    },
    details,
  };
}

function validateSupplierOrderItems(items = []) {
  const supplierOrderItems = items.filter((item) => {
    return item?.fulfillmentType === SUPPLIER_ORDER;
  });

  const inStockItems = items.filter((item) => {
    return item?.fulfillmentType !== SUPPLIER_ORDER;
  });

  if (supplierOrderItems.length && inStockItems.length) {
    return createValidationResult(
      "Товари в наявності та товари під замовлення потрібно оформлювати окремими замовленнями.",
      {
        error: "MIXED_FULFILLMENT_ORDER",
        hint:
          "Оформіть усі товари з вкладки \"Є в наявності\" окремо або виберіть один сегмент постачальника.",
      }
    );
  }

  if (!supplierOrderItems.length) {
    return {
      ok: true,
      hasSupplierOrder: false,
    };
  }

  const suppliersById = new Map();
  let currentAmount = 0;

  for (const item of supplierOrderItems) {
    const supplierId = getSupplierId(item);

    if (!supplierId) {
      return createValidationResult(
        `Товар "${item.name || "під замовлення"}" не має постачальника.`,
        {
          error: "SUPPLIER_REQUIRED",
        }
      );
    }

    if (!item.supplier) {
      return createValidationResult(
        `Постачальника для товару "${item.name || "під замовлення"}" не знайдено.`,
        {
          error: "SUPPLIER_NOT_FOUND",
        }
      );
    }

    if (item.supplier.isActive === false) {
      return createValidationResult(
        `Постачальник ${getSupplierName(item)} зараз вимкнений. Оформити товари під замовлення від нього неможливо.`,
        {
          error: "SUPPLIER_DISABLED",
        }
      );
    }

    suppliersById.set(supplierId, item.supplier);
    currentAmount += getItemTotal(item);
  }

  if (suppliersById.size > 1) {
    const supplierNames = [...suppliersById.values()]
      .map((supplier) => supplier?.name)
      .filter(Boolean)
      .join(", ");

    return createValidationResult(
      "В одному замовленні можна оформити товари під замовлення тільки від одного постачальника.",
      {
        error: "MULTIPLE_SUPPLIER_ORDERS",
        supplierNames,
      }
    );
  }

  const supplier = [...suppliersById.values()][0];
  const minOrderAmount = toMoney(supplier?.minOrderAmount);
  const missingAmount = Math.max(0, minOrderAmount - currentAmount);

  if (missingAmount > 0) {
    const supplierName = supplier?.name || "постачальника";

    return createValidationResult(
      `Для товарів від ${supplierName} мінімальна сума замовлення - ${minOrderAmount} грн. Зараз у кошику товарів цього постачальника на ${currentAmount} грн. Додайте ще на ${missingAmount} грн товарів від ${supplierName}, щоб оформити замовлення.`,
      {
        error: "SUPPLIER_MIN_ORDER_NOT_MET",
        supplierId: supplier?.id || "",
        supplierName,
        minOrderAmount,
        currentAmount,
        missingAmount,
      }
    );
  }

  return {
    ok: true,
    hasSupplierOrder: true,
    supplier,
    minOrderAmount,
    currentAmount,
    missingAmount: 0,
  };
}

module.exports = {
  SUPPLIER_ORDER,
  validateSupplierOrderItems,
};
