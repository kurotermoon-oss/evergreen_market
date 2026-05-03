const ORDER_STATUS = {
  NEW: "new",
  CONFIRMED: "confirmed",
  PREPARING: "preparing",
  READY: "ready",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

const PAYMENT_STATUS = {
  UNPAID: "unpaid",
  PAID: "paid",
  REFUNDED: "refunded",
};

const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.NEW]: "Нове",
  [ORDER_STATUS.CONFIRMED]: "Підтверджено",
  [ORDER_STATUS.PREPARING]: "Готується",
  [ORDER_STATUS.READY]: "Готово до видачі",
  [ORDER_STATUS.COMPLETED]: "Завершено",
  [ORDER_STATUS.CANCELLED]: "Скасовано",
};

const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUS.UNPAID]: "Не оплачено",
  [PAYMENT_STATUS.PAID]: "Оплачено",
  [PAYMENT_STATUS.REFUNDED]: "Повернення",
};

const STATUS_ALIASES = {
  Новий: ORDER_STATUS.NEW,
  Нове: ORDER_STATUS.NEW,
  Підтверджено: ORDER_STATUS.CONFIRMED,
  "Готується": ORDER_STATUS.PREPARING,
  "Готово до видачі": ORDER_STATUS.READY,
  Завершено: ORDER_STATUS.COMPLETED,
  Скасовано: ORDER_STATUS.CANCELLED,
};

const PAYMENT_ALIASES = {
  "Не оплачено": PAYMENT_STATUS.UNPAID,
  Оплачено: PAYMENT_STATUS.PAID,
  Повернення: PAYMENT_STATUS.REFUNDED,
};

function nowIso() {
  return new Date().toISOString();
}

function normalizeOrderStatus(status) {
  return STATUS_ALIASES[status] || status || ORDER_STATUS.NEW;
}

function normalizePaymentStatus(status) {
  return PAYMENT_ALIASES[status] || status || PAYMENT_STATUS.UNPAID;
}

function getOrderStatusLabel(status) {
  return ORDER_STATUS_LABELS[normalizeOrderStatus(status)] || "Нове";
}

function getPaymentStatusLabel(status) {
  return PAYMENT_STATUS_LABELS[normalizePaymentStatus(status)] || "Не оплачено";
}

function pushHistory(order, event) {
  if (!Array.isArray(order.statusHistory)) {
    order.statusHistory = [];
  }

  order.statusHistory.push({
    at: nowIso(),
    ...event,
  });
}

function changeOrderStatus(order, nextStatus, label, extra = {}) {
  const previousStatus = normalizeOrderStatus(order.status);
  const normalizedNextStatus = normalizeOrderStatus(nextStatus);

  if (previousStatus === normalizedNextStatus) {
    return order;
  }

  order.status = normalizedNextStatus;

  if (normalizedNextStatus === ORDER_STATUS.COMPLETED) {
    order.isFinal = true;
    order.finalType = "completed";
    order.finalizedAt = nowIso();
  }

  if (normalizedNextStatus === ORDER_STATUS.CANCELLED) {
    order.isFinal = true;
    order.finalType = "cancelled";
    order.finalizedAt = nowIso();
    order.cancelReason = extra.reason || order.cancelReason || "";
  }

  pushHistory(order, {
    type: "status_changed",
    from: previousStatus,
    to: normalizedNextStatus,
    label: label || getOrderStatusLabel(normalizedNextStatus),
  });

  return order;
}

function changePaymentStatus(order, nextPaymentStatus, label) {
  const previousPaymentStatus = normalizePaymentStatus(order.paymentStatus);
  const normalizedNextPaymentStatus = normalizePaymentStatus(nextPaymentStatus);

  if (previousPaymentStatus === normalizedNextPaymentStatus) {
    return order;
  }

  order.paymentStatus = normalizedNextPaymentStatus;

  pushHistory(order, {
    type: "payment_changed",
    from: previousPaymentStatus,
    to: normalizedNextPaymentStatus,
    label: label || `Оплата: ${getPaymentStatusLabel(normalizedNextPaymentStatus)}`,
  });

  return order;
}

function restoreStockForCancelledOrder(db, order) {
  if (order.stockRestoredAt) return;

  for (const orderItem of order.items || []) {
    const product = db.products.find((item) => {
      return Number(item.id) === Number(orderItem.productId);
    });

    if (!product) continue;

    if (product.stockStatus === "out_of_stock") {
      product.stockStatus = "limited";
    }

    if (product.stockStatus === "limited") {
      product.stockQuantity =
        Number(product.stockQuantity || 0) + Number(orderItem.quantity || 0);
    }
  }

  order.stockRestoredAt = nowIso();
}

function normalizeExistingOrder(order) {
  order.status = normalizeOrderStatus(order.status);
  order.paymentStatus = normalizePaymentStatus(order.paymentStatus);

  if (!Array.isArray(order.statusHistory)) {
    order.statusHistory = [];
  }

  return order;
}

function applyOrderAction(db, order, action, options = {}) {
  normalizeExistingOrder(order);

  switch (action) {
    case "confirm":
    case "mark_confirmed":
      return changeOrderStatus(
        order,
        ORDER_STATUS.CONFIRMED,
        "Замовлення підтверджено"
      );

    case "start_preparing":
    case "preparing":
    case "mark_preparing":
      return changeOrderStatus(
        order,
        ORDER_STATUS.PREPARING,
        "Замовлення готується"
      );

    case "mark_ready":
    case "ready":
      return changeOrderStatus(
        order,
        ORDER_STATUS.READY,
        "Замовлення готове до видачі"
      );

    case "complete":
    case "mark_completed":
    case "close":
      return changeOrderStatus(
        order,
        ORDER_STATUS.COMPLETED,
        "Замовлення завершено"
      );

    case "cancel":
    case "mark_cancelled":
      restoreStockForCancelledOrder(db, order);

      return changeOrderStatus(
        order,
        ORDER_STATUS.CANCELLED,
        "Замовлення скасовано",
        {
          reason: options.reason,
        }
      );

    case "mark_paid":
    case "paid":
      return changePaymentStatus(
        order,
        PAYMENT_STATUS.PAID,
        "Оплату підтверджено"
      );

    case "mark_unpaid":
    case "unpaid":
      return changePaymentStatus(
        order,
        PAYMENT_STATUS.UNPAID,
        "Оплату позначено як неоплачену"
      );

    case "refund":
    case "mark_refunded":
      return changePaymentStatus(
        order,
        PAYMENT_STATUS.REFUNDED,
        "Оплату повернено"
      );

    /*
      Сумісність зі старими кнопками, якщо вони ще є в адмінці.
      Потім краще прибрати ці action з UI.
    */
    case "complete_paid":
    case "mark_completed_paid":
    case "close_paid":
      changePaymentStatus(order, PAYMENT_STATUS.PAID, "Оплату підтверджено");
      return changeOrderStatus(
        order,
        ORDER_STATUS.COMPLETED,
        "Замовлення завершено"
      );

    default:
      const error = new Error(`Unknown order action: ${action}`);
      error.statusCode = 400;
      throw error;
  }
}

module.exports = {
  ORDER_STATUS,
  PAYMENT_STATUS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  normalizeOrderStatus,
  normalizePaymentStatus,
  getOrderStatusLabel,
  getPaymentStatusLabel,
  applyOrderAction,
};