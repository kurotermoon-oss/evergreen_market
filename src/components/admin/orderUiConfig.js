export const ACTIVE_ORDER_STATUSES = [
  "Усі активні",
  "Новий",
  "Підтверджено",
  "Готується",
  "Готово до видачі",
];

export const FINAL_ORDER_STATUSES = ["Завершено", "Скасовано", "Видано"];

export function isFinalOrder(order) {
  return Boolean(order?.isFinal) || FINAL_ORDER_STATUSES.includes(order?.status);
}

export const statusColors = {
  Новий: "bg-yellow-100 text-yellow-800",
  Підтверджено: "bg-blue-100 text-blue-800",
  Готується: "bg-orange-100 text-orange-800",
  "Готово до видачі": "bg-green-100 text-green-800",
  Завершено: "bg-emerald-100 text-emerald-900",
  Видано: "bg-emerald-100 text-emerald-900",
  Скасовано: "bg-red-100 text-red-800",
};

export const paymentColors = {
  "Не оплачено": "bg-stone-100 text-stone-700",
  "Очікує оплату": "bg-orange-100 text-orange-800",
  Оплачено: "bg-emerald-100 text-emerald-900",
  Повернення: "bg-red-100 text-red-800",
};

export const orderActionConfig = {
  confirm: {
    label: "Підтвердити",
    className:
      "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100",
  },

  start_preparing: {
    label: "Готується",
    className:
      "bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100",
  },

  mark_ready: {
    label: "Готово до видачі",
    className:
      "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100",
  },

  mark_paid: {
    label: "Оплачено",
    className:
      "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100",
  },

  complete_paid: {
    label: "Завершити як оплачений",
    className:
      "bg-stone-100 text-stone-800 border border-stone-300 hover:bg-stone-200",
  },

  cancel: {
    label: "Скасувати",
    className:
      "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100",
  },
};

export function getAvailableOrderActions(order) {
  if (isFinalOrder(order)) return [];

  const byStatus = {
    Новий: ["confirm", "mark_paid", "cancel"],
    Підтверджено: ["start_preparing", "mark_ready", "mark_paid", "complete_paid", "cancel"],
    Готується: ["mark_ready", "mark_paid", "complete_paid", "cancel"],
    "Готово до видачі": ["mark_paid", "complete_paid", "cancel"],
  };

  const actions = byStatus[order.status] || [];

  if (order.paymentStatus === "Оплачено") {
    return actions.filter((action) => action !== "mark_paid");
  }

  return actions;
}