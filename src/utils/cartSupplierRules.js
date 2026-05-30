export const FULFILLMENT_IN_STOCK = "in_stock";
export const FULFILLMENT_SUPPLIER_ORDER = "supplier_order";
export const IN_STOCK_GROUP_ID = "in_stock";

function toMoney(value) {
  const number = Number(value || 0);

  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0;
}

function getItemTotal(item = {}) {
  const total = Number(item.total);

  if (Number.isFinite(total)) {
    return Math.max(0, Math.round(total));
  }

  return toMoney(item.price) * Math.max(1, Number(item.quantity) || 1);
}

function getItemQuantity(item = {}) {
  return Math.max(1, Number(item.quantity) || 1);
}

export function getProductFulfillmentType(product) {
  return product?.fulfillmentType === FULFILLMENT_SUPPLIER_ORDER
    ? FULFILLMENT_SUPPLIER_ORDER
    : FULFILLMENT_IN_STOCK;
}

export function isSupplierOrderProduct(product) {
  return getProductFulfillmentType(product) === FULFILLMENT_SUPPLIER_ORDER;
}

export function isInStockProduct(product) {
  return !isSupplierOrderProduct(product);
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

export function getOrderGroupLabel(group) {
  if (group?.type === FULFILLMENT_SUPPLIER_ORDER) {
    return group.supplierName || "Постачальник";
  }

  return "Є в наявності";
}

function createInStockGroup(items = []) {
  const total = items.reduce((sum, item) => sum + getItemTotal(item), 0);
  const count = items.reduce((sum, item) => sum + getItemQuantity(item), 0);

  return {
    id: IN_STOCK_GROUP_ID,
    type: FULFILLMENT_IN_STOCK,
    title: "Є в наявності",
    label: "Є в наявності",
    description:
      "Ці товари можна оформити разом без мінімальної суми, навіть якщо в адмінці вони привʼязані до різних постачальників.",
    items,
    count,
    total,
    supplier: null,
    supplierId: "",
    supplierName: "",
    minOrderAmount: 0,
    missingAmount: 0,
    isMinimumMet: true,
    isValid: true,
    canCheckout: items.length > 0,
    message: items.length ? "" : "У цьому сегменті немає товарів.",
  };
}

function createSupplierGroup(items = [], supplierId = "") {
  const firstItem = items[0] || {};
  const supplier = getProductSupplier(firstItem);
  const supplierName = getProductSupplierName(firstItem);
  const total = items.reduce((sum, item) => sum + getItemTotal(item), 0);
  const count = items.reduce((sum, item) => sum + getItemQuantity(item), 0);
  const minOrderAmount = toMoney(supplier?.minOrderAmount);
  const missingAmount = Math.max(0, minOrderAmount - total);

  let isValid = true;
  let message = "";

  if (!supplierId || !supplier) {
    isValid = false;
    message = `Товар "${firstItem.name || "під замовлення"}" не має постачальника.`;
  } else if (supplier.isActive === false) {
    isValid = false;
    message = `Постачальник ${supplierName} зараз вимкнений. Оформити товари під замовлення від нього неможливо.`;
  } else if (missingAmount > 0) {
    message = `Мінімальне замовлення від ${supplierName} - ${minOrderAmount} грн. Зараз у сегменті ${total} грн. Додайте ще ${missingAmount} грн товарів цього постачальника.`;
  }

  const isMinimumMet = missingAmount <= 0;

  return {
    id: `supplier:${supplierId || "missing"}`,
    type: FULFILLMENT_SUPPLIER_ORDER,
    title: supplierName,
    label: `Під замовлення · ${supplierName}`,
    description: `Окреме замовлення від ${supplierName}. У цей сегмент не додаються товари з вкладки "Є в наявності".`,
    items,
    count,
    total,
    supplier,
    supplierId,
    supplierName,
    minOrderAmount,
    missingAmount,
    isMinimumMet,
    isValid,
    canCheckout: items.length > 0 && isValid && isMinimumMet,
    message,
  };
}

export function buildCartOrderGroups(cartItems = []) {
  const inStockItems = [];
  const supplierItemsById = new Map();

  cartItems.forEach((item) => {
    if (!isSupplierOrderProduct(item)) {
      inStockItems.push(item);
      return;
    }

    const supplierId = getProductSupplierId(item);
    const groupKey = supplierId || `missing:${item.productId || item.id || ""}`;
    const currentItems = supplierItemsById.get(groupKey) || [];

    currentItems.push(item);
    supplierItemsById.set(groupKey, currentItems);
  });

  const groups = [];

  if (inStockItems.length) {
    groups.push(createInStockGroup(inStockItems));
  }

  for (const [supplierId, items] of supplierItemsById.entries()) {
    groups.push(createSupplierGroup(items, supplierId));
  }

  return groups;
}

export function buildCartSupplierSummary(cartItems = []) {
  const supplierGroups = buildCartOrderGroups(cartItems).filter((group) => {
    return group.type === FULFILLMENT_SUPPLIER_ORDER;
  });

  if (!supplierGroups.length) {
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

  const invalidGroup = supplierGroups.find((group) => !group.isValid);

  if (invalidGroup) {
    return {
      hasSupplierOrder: true,
      isValid: false,
      canCheckout: false,
      message: invalidGroup.message,
      supplier: invalidGroup.supplier,
      supplierId: invalidGroup.supplierId,
      supplierName: invalidGroup.supplierName,
      currentAmount: invalidGroup.total,
      minOrderAmount: invalidGroup.minOrderAmount,
      missingAmount: invalidGroup.missingAmount,
      isMinimumMet: invalidGroup.isMinimumMet,
    };
  }

  const blockedGroup = supplierGroups.find((group) => !group.canCheckout);
  const primaryGroup = blockedGroup || supplierGroups[0];

  return {
    hasSupplierOrder: true,
    isValid: true,
    canCheckout: !blockedGroup,
    message: primaryGroup.message,
    supplier: primaryGroup.supplier,
    supplierId: primaryGroup.supplierId,
    supplierName: primaryGroup.supplierName,
    currentAmount: primaryGroup.total,
    minOrderAmount: primaryGroup.minOrderAmount,
    missingAmount: primaryGroup.missingAmount,
    isMinimumMet: primaryGroup.isMinimumMet,
  };
}

export function validateAddToCart(product) {
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

  return {
    ok: true,
    message: "",
  };
}
