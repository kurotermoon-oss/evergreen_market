const { applyOrderAction } = require("../orderWorkflow.cjs");
const { assertOrderAction } = require("./orderActionGuard.cjs");

function createAdminOrderActions({ usePostgres, ordersRepository, readDatabase, writeDatabase, notifyPostgres, notifyLocal }) {
  return async function perform(id, action, options = {}) {
    let order;
    let localDb;
    if (usePostgres) {
      order = await ordersRepository.updateOrderAction(id, action, options);
    } else {
      localDb = readDatabase();
      order = localDb.orders.find(item => String(item.id) === String(id));
      if (!order) throw Object.assign(new Error("Замовлення не знайдено."), { status: 404 });
      assertOrderAction(order, action, options);
      applyOrderAction(localDb, order, action, options);
      if (options.actor && order.statusHistory?.length) order.statusHistory.at(-1).label += ` · Telegram ID ${options.actor}`;
      order.updatedAt = new Date().toISOString();
      // Commit first; a notification failure must never undo or repeat a status change.
      writeDatabase(localDb);
    }
    let customerTelegramResult = null;
    if (["mark_ready", "ready"].includes(action)) {
      try { customerTelegramResult = await (usePostgres ? notifyPostgres(order) : notifyLocal(localDb, order)); }
      catch { customerTelegramResult = { ok: false, error: "Не вдалося надіслати сповіщення покупцю." }; }
      if (!usePostgres && order.readyTelegramNotification) {
        // Merge only notification metadata into fresh local state, never an old snapshot.
        const latest = readDatabase();
        const current = latest.orders.find(item => String(item.id) === String(id));
        if (current) {
          current.readyTelegramNotification = order.readyTelegramNotification;
          if (order.readyTelegramNotifiedAt) current.readyTelegramNotifiedAt = order.readyTelegramNotifiedAt;
          const event = order.statusHistory?.at(-1);
          if (event?.type === "telegram_notification") current.statusHistory.push(event);
          writeDatabase(latest);
        }
      }
    }
    return { ok: true, order, customerTelegramResult };
  };
}
module.exports = { createAdminOrderActions };
