const prisma = require("../database/prisma.cjs");
const { buildAnalytics } = require("../analytics.cjs");

function toIsoOrEmpty(value) {
  if (!value) return "";

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) return "";

  return date.toISOString();
}

function mapOrderItem(item) {
  return {
    id: item.id,
    orderId: item.orderId,
    productId: item.productId || "",

    name: item.name || "",
    brand: item.brand || "",
    unit: item.unit || "",
    packageInfo: item.packageInfo || "",

    price: Number(item.price || 0),
    costPrice: Number(item.costPrice || 0),
    quantity: Number(item.quantity || 0),

    total: Number(item.total || 0),
    costTotal: Number(item.costTotal || 0),
    profit: Number(item.profit || 0),
  };
}

function mapOrder(order) {
  return {
    id: order.id,
    orderNumber: Number(order.orderNumber || 0),

    customerId: order.customerId || null,
    guestId: order.guestId || "",
    clientIp: order.clientIp || "",
    trustLevel: order.trustLevel || "guest",

    customerName: order.customerName || "",
    customerPhone: order.customerPhone || "",
    customerTelegram: order.customerTelegram || "",

    deliveryType: order.deliveryType || "pickup",

    paymentMethod: order.paymentMethod || "Після підтвердження",
    paymentStatus: order.paymentStatus || "unpaid",

    comment: order.comment || "",

    status: order.status || "new",
    isFinal: Boolean(order.isFinal),
    finalType: order.finalType || "",
    finalizedAt: toIsoOrEmpty(order.finalizedAt),
    cancelReason: order.cancelReason || "",

    total: Number(order.total || 0),

    createdAt: toIsoOrEmpty(order.createdAt),
    updatedAt: toIsoOrEmpty(order.updatedAt),

    items: Array.isArray(order.items) ? order.items.map(mapOrderItem) : [],
  };
}

async function buildPostgresAnalytics(filters = {}) {
  const orders = await prisma.order.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      items: {
        orderBy: {
          id: "asc",
        },
      },
    },
  });

  return buildAnalytics(
    {
      orders: orders.map(mapOrder),
      products: [],
    },
    filters
  );
}

module.exports = {
  buildPostgresAnalytics,
};