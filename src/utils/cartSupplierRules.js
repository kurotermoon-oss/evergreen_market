export const FULFILLMENT_IN_STOCK = "in_stock";
export const FULFILLMENT_SUPPLIER_ORDER = "supplier_order";

function toMoney(value) {
  const number = Number(value || 0);

  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0;
}

export function getProductFulfillmentType(product) {
  return product?.fulfillmentType === FULFILLMENT_SUPPLIER_ORDER
    ? FULFILLMENT_SUPPLIER_ORDER
    : FULFILLMENT_IN_STOCK;
}

export function isSupplierOrderProduct(product) {
  return getProductFulfillmentType(product) === FULFILLMENT_SUPPLIER_ORDER;
}

export function getProductSupplierId(product) {
  return String(product?.supplierId || product?.supplier?.id || "").trim();
}

export function getProductSupplier(product) {
  return product?.supplier || null;
}

export function getProductSupplierName(product) {
  return (
    String(product?.supplier?.name || "").trim() ||
    String(product?.supplierName || "").trim() ||
    "постачальника"
  );
}

export function getFulfillmentLabel(product) {
  return isSupplierOrderProduct(product) ? "Під замовлення" : "Є в наявності";
}

export function buildSupplierConflictMessage(existingSupplierName) {
  return [
    `У кошику вже є товари під замовлення від ${existingSupplierName}.`,
    "В одному замовленні можна оформити товари під замовлення тільки від одного постачальника.",
    "Щоб додати товар від іншого постачальника, оформіть окреме замовлення або очистіть кошик.",
  ].join("\n\n");
}

function buildInvalidSummary(message) {
  return {
    hasSupplierOrder: true,
    isValid: false,
    canCheckout: false,
    message,
    supplier: null,
    supplierId: "",
    supplierName: "",
    currentAmount: 0,
    minOrderAmount: 0,
    missingAmount: 0,
    isMinimumMet: false,
  };
}

export function buildCartSupplierSummary(cartItems = []) {
  const supplierOrderItems = cartItems.filter(isSupplierOrderProduct);

  if (!supplierOrderItems.length) {
    return {
      hasSupplierOrder: false,
      isValid: true,
      canCheckout: true,
      message: "",
      supplier: null,
      supplierId: "",
      supplierName: "",
      currentAmount: 0,
      minOrderAmount: 0,
      missingAmount: 0,
      isMinimumMet: true,
    };
  }

  const suppliersById = new Map();
  let currentAmount = 0;

  for (const item of supplierOrderItems) {
    const supplierId = getProductSupplierId(item);
    const supplier = getProductSupplier(item);

    if (!supplierId || !supplier) {
      return buildInvalidSummary(
        `Товар "${item.name || "під замовлення"}" не має постачальника.`
      );
    }

    if (supplier.isActive === false) {
      return buildInvalidSummary(
        `Постачальник ${getProductSupplierName(item)} зараз вимкнений. Оформити товари під замовлення від нього неможливо.`
      );
    }

    suppliersById.set(supplierId, supplier);
    currentAmount += toMoney(item.total || item.price * item.quantity);
  }

  if (suppliersById.size > 1) {
    const firstSupplier = suppliersById.values().next().value;

    return buildInvalidSummary(
      buildSupplierConflictMessage(firstSupplier?.name || "іншого постачальника")
    );
  }

  const supplier = suppliersById.values().next().value;
  const supplierId = supplier?.id || "";
  const supplierName = supplier?.name || "постачальника";
  const minOrderAmount = toMoney(supplier?.minOrderAmount);
  const missingAmount = Math.max(0, minOrderAmount - currentAmount);
  const isMinimumMet = missingAmount <= 0;

  return {
    hasSupplierOrder: true,
    isValid: true,
    canCheckout: isMinimumMet,
    message: isMinimumMet
      ? ""
      : `Для товарів від ${supplierName} мінімальна сума замовлення - ${minOrderAmount} грн.\n\nЗараз у кошику: ${currentAmount} грн.\n\nДодайте ще ${missingAmount} грн товарів цього постачальника.`,
    supplier,
    supplierId,
    supplierName,
    currentAmount,
    minOrderAmount,
    missingAmount,
    isMinimumMet,
  };
}

export function validateAddToCart(product, cartItems = []) {
  if (!isSupplierOrderProduct(product)) {
    return {
      ok: true,
      message: "",
    };
  }

  const supplierId = getProductSupplierId(product);
  const supplier = getProductSupplier(product);

  if (!supplierId || !supplier) {
    return {
      ok: false,
      message: `Товар "${product?.name || "під замовлення"}" не має постачальника.`,
    };
  }

  if (supplier.isActive === false) {
    return {
      ok: false,
      message: `Постачальник ${getProductSupplierName(product)} зараз вимкнений. Оформити товари під замовлення від нього неможливо.`,
    };
  }

  const summary = buildCartSupplierSummary(cartItems);

  if (!summary.hasSupplierOrder) {
    return {
      ok: true,
      message: "",
    };
  }

  if (!summary.isValid) {
    return {
      ok: false,
      message: summary.message,
    };
  }

  if (summary.supplierId && summary.supplierId !== supplierId) {
    return {
      ok: false,
      message: buildSupplierConflictMessage(summary.supplierName),
    };
  }

  return {
    ok: true,
    message: "",
  };
}
