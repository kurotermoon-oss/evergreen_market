export const ORDER_STATUS = {
  NEW: "new",
  CONFIRMED: "confirmed",
  PREPARING: "preparing",
  READY: "ready",
  COMPLETED: "completed",
  CANCELED: "canceled",
};

export const PAYMENT_STATUS = {
  UNPAID: "unpaid",
  PAID: "paid",
  REFUNDED: "refunded",
};

export const ACTIVE_ORDER_STATUSES = [
  "all",
  ORDER_STATUS.NEW,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.READY,
];

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.NEW]: "Новий",
  [ORDER_STATUS.CONFIRMED]: "Підтверджено",
  [ORDER_STATUS.PREPARING]: "Готується",
  [ORDER_STATUS.READY]: "Готово до видачі",
  [ORDER_STATUS.COMPLETED]: "Завершено",
  [ORDER_STATUS.CANCELED]: "Скасовано",
};

export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUS.UNPAID]: "Не оплачено",
  [PAYMENT_STATUS.PAID]: "Оплачено",
  [PAYMENT_STATUS.REFUNDED]: "Повернення",
};

const ORDER_STATUS_ALIASES = {
  Новий: ORDER_STATUS.NEW,
  Нове: ORDER_STATUS.NEW,
  Підтверджено: ORDER_STATUS.CONFIRMED,
  Готується: ORDER_STATUS.PREPARING,
  "Готово до видачі": ORDER_STATUS.READY,
  Завершено: ORDER_STATUS.COMPLETED,
  Скасовано: ORDER_STATUS.CANCELED,
  cancelled: ORDER_STATUS.CANCELED,
};

const PAYMENT_STATUS_ALIASES = {
  "Не оплачено": PAYMENT_STATUS.UNPAID,
  Оплачено: PAYMENT_STATUS.PAID,
  Повернення: PAYMENT_STATUS.REFUNDED,
};

export function normalizeOrderStatus(status) {
  return (
    ORDER_STATUS_ALIASES[status] ||
    status?.toLowerCase?.() ||
    ORDER_STATUS.NEW
  );
}

export function normalizePaymentStatus(status) {
  return (
    PAYMENT_STATUS_ALIASES[status] ||
    status?.toLowerCase?.() ||
    PAYMENT_STATUS.UNPAID
  );
}

export function getOrderStatusLabel(status) {
  const normalizedStatus = normalizeOrderStatus(status);
  return ORDER_STATUS_LABELS[normalizedStatus] || "Новий";
}

export function getPaymentStatusLabel(status) {
  const normalizedStatus = normalizePaymentStatus(status);
  return PAYMENT_STATUS_LABELS[normalizedStatus] || "Не оплачено";
}

export function isFinalOrder(order) {
  const status = normalizeOrderStatus(order?.status);

  return (
    status === ORDER_STATUS.COMPLETED ||
    status === ORDER_STATUS.CANCELED
  );
}

export function getOrderStatusClass(status) {
  const normalizedStatus = normalizeOrderStatus(status);

  const classes = {
    [ORDER_STATUS.NEW]:
      "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
    [ORDER_STATUS.CONFIRMED]:
      "bg-sky-50 text-sky-800 ring-1 ring-sky-200",
    [ORDER_STATUS.PREPARING]:
      "bg-orange-50 text-orange-800 ring-1 ring-orange-200",
    [ORDER_STATUS.READY]:
      "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
    [ORDER_STATUS.COMPLETED]:
      "bg-stone-100 text-stone-700 ring-1 ring-stone-200",
    [ORDER_STATUS.CANCELED]:
      "bg-red-50 text-red-800 ring-1 ring-red-200",
  };

  return classes[normalizedStatus] || "bg-stone-100 text-stone-700";
}

export function getPaymentStatusClass(status) {
  const normalizedStatus = normalizePaymentStatus(status);

  const classes = {
    [PAYMENT_STATUS.UNPAID]:
      "bg-stone-100 text-stone-700 ring-1 ring-stone-200",
    [PAYMENT_STATUS.PAID]:
      "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
    [PAYMENT_STATUS.REFUNDED]:
      "bg-orange-50 text-orange-800 ring-1 ring-orange-200",
  };

  return classes[normalizedStatus] || "bg-stone-100 text-stone-700";
}

export function getAvailableOrderActions(order) {
  if (!order || isFinalOrder(order)) return [];

  const status = normalizeOrderStatus(order.status);
  const paymentStatus = normalizePaymentStatus(order.paymentStatus);

  const actions = [];

  if (status === ORDER_STATUS.NEW) {
    actions.push({
      id: "confirm",
      action: "confirm",
      label: "Підтвердити",
      variant: "primary",
    });
  }

  if (status === ORDER_STATUS.CONFIRMED) {
    actions.push({
      id: "start_preparing",
      action: "start_preparing",
      label: "Готувати",
      variant: "primary",
    });
  }

  if (status === ORDER_STATUS.PREPARING) {
    actions.push({
      id: "mark_ready",
      action: "mark_ready",
      label: "Готово",
      variant: "primary",
    });
  }

  if (status === ORDER_STATUS.READY) {
    actions.push({
      id: "complete",
      action: "complete",
      label: "Завершити",
      variant: "primary",
    });
  }


  actions.push({
    id: "cancel",
    action: "cancel",
    label: "Скасувати",
    variant: "danger",
  });

  return actions;
}

export function getActionClassName(variant = "secondary") {
  const classes = {
    primary:
      "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200 hover:bg-emerald-100",
    success:
      "bg-stone-100 text-stone-800 ring-1 ring-stone-200 hover:bg-stone-200",
    danger:
      "bg-red-50 text-red-800 ring-1 ring-red-200 hover:bg-red-100",
    secondary:
      "bg-stone-50 text-stone-700 ring-1 ring-stone-200 hover:bg-stone-100",
  };

  return classes[variant] || classes.secondary;
}