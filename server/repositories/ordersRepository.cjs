const crypto = require("crypto");

const prisma = require("../database/prisma.cjs");

function createOrderId() {
  return `order_${crypto.randomUUID()}`;
}

function toIsoOrEmpty(value) {
  if (!value) return "";

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) return "";

  return date.toISOString();
}

function createEntityId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
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

function mapOrderStatusHistoryItem(item) {
  return {
    id: item.id,
    orderId: item.orderId,
    at: toIsoOrEmpty(item.at),
    type: item.type || "",
    label: item.label || "",
  };
}

function mapOrder(order) {
  if (!order) return null;

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

    building: order.building || "",
    entrance: order.entrance || "",
    floor: order.floor || "",
    apartment: order.apartment || "",

    paymentMethod: order.paymentMethod || "Після підтвердження",
    paymentStatus: order.paymentStatus || "unpaid",

    comment: order.comment || "",

    status: order.status || "new",
    isFinal: Boolean(order.isFinal),
    finalType: order.finalType || "",
    finalizedAt: toIsoOrEmpty(order.finalizedAt),
    cancelReason: order.cancelReason || "",

    stockRestoredAt: toIsoOrEmpty(order.stockRestoredAt),

    total: Number(order.total || 0),

    createdAt: toIsoOrEmpty(order.createdAt),
    updatedAt: toIsoOrEmpty(order.updatedAt),

    items: Array.isArray(order.items) ? order.items.map(mapOrderItem) : [],

    statusHistory: Array.isArray(order.statusHistory)
      ? order.statusHistory.map(mapOrderStatusHistoryItem)
      : [],
  };
}

function normalizePhone(value) {
  return String(value || "")
    .replace(/[^\d+]/g, "")
    .trim();
}

function normalizeTelegram(value) {
  return String(value || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}

async function getCustomerOrders(customer) {
  const conditions = [];

  const customerId = Number(customer?.id || customer);

  if (Number.isFinite(customerId)) {
    conditions.push({
      customerId,
    });
  }

  const phone = normalizePhone(customer?.phone);

  if (phone) {
    conditions.push({
      customerPhone: phone,
    });
  }

  const telegram = normalizeTelegram(customer?.telegram);

  if (telegram) {
    conditions.push({
      customerTelegram: telegram,
    });

    conditions.push({
      customerTelegram: `@${telegram}`,
    });
  }

  if (!conditions.length) {
    return [];
  }

  const orders = await prisma.order.findMany({
    where: {
      OR: conditions,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      items: {
        orderBy: {
          id: "asc",
        },
      },
      statusHistory: {
        orderBy: {
          at: "asc",
        },
      },
    },
  });

  return orders.map(mapOrder);
}

async function getAdminOrders() {
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
      statusHistory: {
        orderBy: {
          at: "asc",
        },
      },
    },
  });

  return orders.map(mapOrder);
}

async function getOrdersCount() {
  return prisma.order.count();
}



async function getNextOrderNumber(db = prisma) {
  const lastOrder = await db.order.findFirst({
    orderBy: {
      orderNumber: "desc",
    },
    select: {
      orderNumber: true,
    },
  });

  return Number(lastOrder?.orderNumber || 0) + 1;
}

async function getProductsForOrder(rawItems = []) {
  const ids = rawItems
    .map((item) => String(item.id || item.productId || "").trim())
    .filter(Boolean);

  if (!ids.length) return [];

  return prisma.product.findMany({
    where: {
      id: {
        in: ids,
      },
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
  });
}

async function reserveOrderStock(db, items = []) {
  for (const item of items) {
    const productId = String(item.productId || "").trim();
    const quantity = Math.max(1, Number(item.quantity) || 1);

    if (!productId) continue;

    const result = await db.product.updateMany({
      where: {
        id: productId,
        stockStatus: "limited",
        stockQuantity: {
          gte: quantity,
        },
      },
      data: {
        stockQuantity: {
          decrement: quantity,
        },
      },
    });

    if (result.count === 0) {
      const product = await db.product.findUnique({
        where: {
          id: productId,
        },
        select: {
          name: true,
          stockStatus: true,
          stockQuantity: true,
        },
      });

      if (product?.stockStatus === "limited") {
        const error = new Error(
          `Недостатньо ${product.name || "товару"} на складі.`
        );
        error.status = 400;
        throw error;
      }
    }
  }
}

async function restoreOrderStock(db, items = []) {
  for (const item of items) {
    const productId = String(item.productId || "").trim();
    const quantity = Math.max(1, Number(item.quantity) || 1);

    if (!productId) continue;

    await db.product.updateMany({
      where: {
        id: productId,
        stockStatus: "limited",
        stockQuantity: {
          not: null,
        },
      },
      data: {
        stockQuantity: {
          increment: quantity,
        },
      },
    });
  }
}

async function increaseOrderPurchaseCount(db, items = []) {
  for (const item of items) {
    const productId = String(item.productId || "").trim();
    const quantity = Math.max(1, Number(item.quantity) || 1);

    if (!productId) continue;

    await db.product.updateMany({
      where: {
        id: productId,
      },
      data: {
        purchaseCount: {
          increment: quantity,
        },
      },
    });
  }
}


async function createOrder(payload) {
  return prisma.$transaction(async (tx) => {
    const orderNumber = await getNextOrderNumber(tx);

    await reserveOrderStock(tx, payload.items);

    const order = await tx.order.create({
      data: {
        id: createOrderId(),
        orderNumber,

        customerId: payload.customerId || null,
        guestId: payload.guestId || "",
        clientIp: payload.clientIp || "",
        trustLevel: payload.trustLevel || "guest",

        customerName: payload.customerName || "",
        customerPhone: payload.customerPhone || "",
        customerTelegram: payload.customerTelegram || "",

        deliveryType: payload.deliveryType || "pickup",

        building: payload.building || "",
        entrance: payload.entrance || "",
        floor: payload.floor || "",
        apartment: payload.apartment || "",

        paymentMethod: payload.paymentMethod || "Після підтвердження",
        paymentStatus: payload.paymentStatus || "unpaid",

        comment: payload.comment || "",

        status: payload.status || "new",
        isFinal: false,
        finalType: "",
        finalizedAt: null,
        cancelReason: "",
        stockRestoredAt: null,

        total: Number(payload.total || 0),

        items: {
          create: payload.items.map((item) => ({
            productId: String(item.productId || ""),

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
          })),
        },

        statusHistory: {
          create: [
            {
              type: "order_created",
              label: "Замовлення створено",
              at: new Date(),
            },
          ],
        },
      },
      include: {
        items: {
          orderBy: {
            id: "asc",
          },
        },
        statusHistory: {
          orderBy: {
            at: "asc",
          },
        },
      },
    });

    return mapOrder(order);
  });
}

function getOrderActionUpdate(action, options = {}) {
  const reason = String(options.reason || "").trim();

  const actions = {
    confirm: {
      status: "confirmed",
      label: "Замовлення підтверджено",
      isFinal: false,
      finalType: "",
    },

    start_prepare: {
      status: "preparing",
      label: "Замовлення готується",
      isFinal: false,
      finalType: "",
    },

    start_preparing: {
      status: "preparing",
      label: "Замовлення готується",
      isFinal: false,
      finalType: "",
    },

    prepare: {
      status: "preparing",
      label: "Замовлення готується",
      isFinal: false,
      finalType: "",
    },

    mark_ready: {
      status: "ready",
      label: "Замовлення готове до видачі",
      isFinal: false,
      finalType: "",
    },

    ready: {
      status: "ready",
      label: "Замовлення готове до видачі",
      isFinal: false,
      finalType: "",
    },

    complete: {
      status: "completed",
      label: "Замовлення видано",
      isFinal: true,
      finalType: "completed",
    },

    mark_completed: {
      status: "completed",
      label: "Замовлення видано",
      isFinal: true,
      finalType: "completed",
    },

    issue: {
      status: "completed",
      label: "Замовлення видано",
      isFinal: true,
      finalType: "completed",
    },

    cancel: {
      status: "cancelled",
      label: reason
        ? `Замовлення скасовано: ${reason}`
        : "Замовлення скасовано",
      isFinal: true,
      finalType: "cancelled",
      cancelReason: reason,
    },
  };

  return actions[action] || null;
}

async function updateOrderAction(orderId, action, options = {}) {
  const id = String(orderId || "").trim();

  if (!id) {
    const error = new Error("Order id is required.");
    error.status = 400;
    throw error;
  }

  return prisma.$transaction(async (tx) => {
    const currentOrder = await tx.order.findUnique({
      where: {
        id,
      },
      include: {
        items: {
          orderBy: {
            id: "asc",
          },
        },
        statusHistory: {
          orderBy: {
            at: "asc",
          },
        },
      },
    });

    if (!currentOrder) {
      const error = new Error("Order not found");
      error.status = 404;
      throw error;
    }

    if (currentOrder.isFinal) {
      const error = new Error(
        "Завершене або скасоване замовлення вже не можна змінювати."
      );
      error.status = 400;
      throw error;
    }

    const update = getOrderActionUpdate(action, options);

    if (!update) {
      const error = new Error(`Unsupported order action: ${action}`);
      error.status = 400;
      throw error;
    }

    const now = new Date();

    const shouldRestoreStock =
      update.finalType === "cancelled" && !currentOrder.stockRestoredAt;

    const shouldIncreasePurchaseCount = update.finalType === "completed";

    if (shouldRestoreStock) {
      await restoreOrderStock(tx, currentOrder.items);
    }

    if (shouldIncreasePurchaseCount) {
      await increaseOrderPurchaseCount(tx, currentOrder.items);
    }

    const order = await tx.order.update({
      where: {
        id,
      },
      data: {
        status: update.status,
        isFinal: Boolean(update.isFinal),
        finalType: update.finalType || "",
        finalizedAt: update.isFinal ? now : null,
        cancelReason: update.cancelReason || currentOrder.cancelReason || "",
        stockRestoredAt: shouldRestoreStock
          ? now
          : currentOrder.stockRestoredAt,

        statusHistory: {
          create: {
            type: action,
            label: update.label,
            at: now,
          },
        },
      },
      include: {
        items: {
          orderBy: {
            id: "asc",
          },
        },
        statusHistory: {
          orderBy: {
            at: "asc",
          },
        },
      },
    });

    return mapOrder(order);
  });
}



module.exports = {
  mapOrder,
  mapOrderItem,

  getCustomerOrders,
  getAdminOrders,
  getOrdersCount,

  getProductsForOrder,
  createOrder,
  updateOrderAction,
};