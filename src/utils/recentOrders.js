const RECENT_ORDERS_STORAGE_KEY = "evergreen_recent_orders";
const MAX_RECENT_ORDERS = 8;

function getStorage() {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

function safeParseOrders(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((item) => item && typeof item === "object" && item.orderNumber)
      : [];
  } catch {
    return [];
  }
}

function normalizeTelegram(value) {
  const telegram = String(value || "").trim();

  if (!telegram) return "";

  return `@${telegram.replace(/^@/, "")}`;
}

export function getRecentOrders() {
  try {
    return safeParseOrders(getStorage()?.getItem(RECENT_ORDERS_STORAGE_KEY));
  } catch {
    return [];
  }
}

export function clearRecentOrders() {
  try {
    getStorage()?.removeItem(RECENT_ORDERS_STORAGE_KEY);
  } catch {
    // Browser history is optional; storage restrictions must not block shopping.
  }
}

export function saveRecentOrder(order, { form, customer } = {}) {
  const storage = getStorage();
  if (!storage || !order?.orderNumber) return;

  const phone = order.customerPhone || form?.phone || customer?.phone || "";
  const telegram =
    order.customerTelegram || form?.telegram || customer?.telegram || "";

  const nextOrder = {
    id: String(order.id || order.orderNumber),
    orderNumber: order.orderNumber,
    createdAt: order.createdAt || new Date().toISOString(),
    total: Number(order.total || 0),
    status: order.status || "new",
    customerName: order.customerName || form?.name || customer?.name || "",
    contact: phone || normalizeTelegram(telegram) || "",
  };

  const currentOrders = getRecentOrders();

  const withoutDuplicate = currentOrders.filter((item) => {
    return String(item.orderNumber) !== String(nextOrder.orderNumber);
  });

  const nextOrders = [nextOrder, ...withoutDuplicate].slice(
    0,
    MAX_RECENT_ORDERS
  );

  try {
    storage.setItem(RECENT_ORDERS_STORAGE_KEY, JSON.stringify(nextOrders));
  } catch {
    // The server has already created the order, even if local history is full.
  }
}
