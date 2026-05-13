const RECENT_ORDERS_STORAGE_KEY = "evergreen_recent_orders";
const MAX_RECENT_ORDERS = 8;

function canUseStorage() {
  return typeof window !== "undefined" && window.localStorage;
}

function safeParseOrders(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : [];
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
  if (!canUseStorage()) return [];

  return safeParseOrders(localStorage.getItem(RECENT_ORDERS_STORAGE_KEY));
}

export function clearRecentOrders() {
  if (!canUseStorage()) return;

  localStorage.removeItem(RECENT_ORDERS_STORAGE_KEY);
}

export function saveRecentOrder(order, { form, customer } = {}) {
  if (!canUseStorage() || !order?.orderNumber) return;

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

  localStorage.setItem(RECENT_ORDERS_STORAGE_KEY, JSON.stringify(nextOrders));
}