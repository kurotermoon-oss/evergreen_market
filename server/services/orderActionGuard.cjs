const { normalizeOrderStatus } = require("../orderWorkflow.cjs");
function statusOf(order) {
  const status = normalizeOrderStatus(order.status);
  return status === "canceled" ? "cancelled" : status;
}
const targets = {
  confirm: "confirmed", mark_confirmed: "confirmed",
  start_prepare: "preparing", start_preparing: "preparing", prepare: "preparing", preparing: "preparing", mark_preparing: "preparing",
  mark_ready: "ready", ready: "ready",
  complete: "completed", mark_completed: "completed", issue: "completed", close: "completed",
  cancel: "cancelled", mark_cancelled: "cancelled",
};
function assertOrderAction(order, action, options = {}) {
  const status = statusOf(order);
  const fail = message => { throw Object.assign(new Error(message), { status: 409 }); };
  if (order.isFinal || ["completed", "cancelled"].includes(status)) fail("Замовлення вже завершене або скасоване. Оновіть список.");
  if (options.expectedStatus !== undefined && options.expectedStatus !== status) fail("Замовлення вже змінилося. Перевірте оновлений статус.");
  const target = targets[action];
  const next = { new: "confirmed", confirmed: "preparing", preparing: "ready", ready: "completed" }[status];
  if ((options.strict && !target) || (target && target !== "cancelled" && target !== next)) fail("Ця дія вже недоступна. Оновіть замовлення.");
}
module.exports = { assertOrderAction, statusOf };
