const FINAL_STATUSES = ["Завершено", "Скасовано", "Видано"];

function isFinalOrder(order) {
  return Boolean(order.isFinal) || FINAL_STATUSES.includes(order.status);
}

function addHistory(order, type, label, extra = {}) {
  if (!Array.isArray(order.statusHistory)) {
    order.statusHistory = [];
  }

  order.statusHistory.push({
    at: new Date().toISOString(),
    type,
    label,
    ...extra,
  });
}

function restoreStockForCancelledOrder(db, order) {
  if (order.stockRestoredAt) return;

  (order.items || []).forEach((orderItem) => {
    const product = db.products.find(
      (item) => item.id === Number(orderItem.productId || orderItem.id)
    );

    if (!product) return;

    const quantity = Number(orderItem.quantity || 0);

    if (product.stockStatus === "limited" || product.stockStatus === "out_of_stock") {
      product.stockQuantity = Number(product.stockQuantity || 0) + quantity;

      if (product.stockQuantity > 0 && product.stockStatus === "out_of_stock") {
        product.stockStatus = "limited";
      }
    }
  });

  order.stockRestoredAt = new Date().toISOString();
}

function assertActionAllowed(order, action) {
  if (isFinalOrder(order)) {
    const error = new Error("Finalized orders cannot be changed");
    error.statusCode = 400;
    throw error;
  }

  const allowedByStatus = {
    Новий: ["confirm", "mark_paid", "cancel"],
    Підтверджено: ["start_preparing", "mark_ready", "mark_paid", "complete_paid", "cancel"],
    Готується: ["mark_ready", "mark_paid", "complete_paid", "cancel"],
    "Готово до видачі": ["mark_paid", "complete_paid", "cancel"],
  };

  const allowedActions = allowedByStatus[order.status] || [];

  if (!allowedActions.includes(action)) {
    const error = new Error(`Action "${action}" is not allowed for status "${order.status}"`);
    error.statusCode = 400;
    throw error;
  }
}

function applyOrderAction(db, order, action, payload = {}) {
  assertActionAllowed(order, action);

  const previousStatus = order.status;
  const previousPaymentStatus = order.paymentStatus;

  if (action === "confirm") {
    order.status = "Підтверджено";

    addHistory(order, "status_changed", "Замовлення підтверджено", {
      from: previousStatus,
      to: order.status,
    });
  }

  if (action === "start_preparing") {
    order.status = "Готується";

    addHistory(order, "status_changed", "Замовлення передано в приготування", {
      from: previousStatus,
      to: order.status,
    });
  }

  if (action === "mark_ready") {
    order.status = "Готово до видачі";

    addHistory(order, "status_changed", "Замовлення готове до видачі", {
      from: previousStatus,
      to: order.status,
    });
  }

  if (action === "mark_paid") {
    order.paymentStatus = "Оплачено";

    addHistory(order, "payment_changed", "Замовлення позначено як оплачене", {
      from: previousPaymentStatus,
      to: order.paymentStatus,
    });
  }

  if (action === "complete_paid") {
    order.status = "Завершено";
    order.paymentStatus = "Оплачено";
    order.isFinal = true;
    order.finalType = "paid";
    order.finalizedAt = new Date().toISOString();

    addHistory(order, "finalized", "Замовлення завершено як оплачене", {
      from: previousStatus,
      to: order.status,
      paymentFrom: previousPaymentStatus,
      paymentTo: order.paymentStatus,
    });
  }

  if (action === "cancel") {
    order.status = "Скасовано";
    order.isFinal = true;
    order.finalType = "cancelled";
    order.finalizedAt = new Date().toISOString();
    order.cancelReason = String(payload.reason || "").trim();

    restoreStockForCancelledOrder(db, order);

    addHistory(order, "cancelled", "Замовлення скасовано", {
      from: previousStatus,
      to: order.status,
      reason: order.cancelReason,
    });
  }

  order.updatedAt = new Date().toISOString();

  return order;
}

module.exports = {
  applyOrderAction,
  isFinalOrder,
};