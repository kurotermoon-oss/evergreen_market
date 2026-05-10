function getOrderItemCost(item, db) {
  if (item.costTotal !== undefined) {
    return Number(item.costTotal || 0);
  }

  if (item.costPrice !== undefined) {
    return Number(item.costPrice || 0) * Number(item.quantity || 0);
  }

  const product = (db.products || []).find(
    (productItem) => Number(productItem.id) === Number(item.productId || item.id)
  );

  return Number(product?.costPrice || 0) * Number(item.quantity || 0);
}

function normalizeOrderStatus(status) {
  const clean = String(status || "").trim();

  const aliases = {
    Завершено: "completed",
    Видано: "completed",
    completed: "completed",

    Скасовано: "canceled",
    Скасоване: "canceled",
    canceled: "canceled",
    cancelled: "canceled",

    Новий: "new",
    new: "new",

    Підтверджено: "confirmed",
    confirmed: "confirmed",

    Готується: "preparing",
    preparing: "preparing",

    Готово: "ready",
    ready: "ready",
  };

  return aliases[clean] || clean.toLowerCase();
}

function isCompletedOrder(order) {
  const status = normalizeOrderStatus(order.status);
  const finalType = String(order.finalType || "").toLowerCase();

  return (
    status === "completed" ||
    finalType === "completed" ||
    finalType === "paid"
  );
}

function getOrderAnalyticsDate(order) {
  return order.finalizedAt || order.createdAt || "";
}

function parseStartDate(value) {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function parseEndDate(value) {
  if (!value) return null;

  const date = new Date(`${value}T23:59:59.999Z`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function isOrderInDateRange(order, filters = {}) {
  const orderDateValue = getOrderAnalyticsDate(order);

  if (!orderDateValue) return false;

  const orderDate = new Date(orderDateValue);

  if (Number.isNaN(orderDate.getTime())) return false;

  const fromDate = parseStartDate(filters.from);
  const toDate = parseEndDate(filters.to);

  if (fromDate && orderDate < fromDate) return false;
  if (toDate && orderDate > toDate) return false;

  return true;
}

function buildAnalytics(db, filters = {}) {
  const orders = Array.isArray(db.orders) ? db.orders : [];

  const periodOrders = orders.filter((order) =>
    isOrderInDateRange(order, filters)
  );

  const completedOrders = periodOrders.filter(isCompletedOrder);

  const totalOrders = periodOrders.length;
  const completedOrdersCount = completedOrders.length;

  const totalRevenue = completedOrders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const totalCost = completedOrders.reduce((sum, order) => {
    const orderCost = (order.items || []).reduce(
      (itemSum, item) => itemSum + getOrderItemCost(item, db),
      0
    );

    return sum + orderCost;
  }, 0);

  const totalProfit = totalRevenue - totalCost;

  const averageOrderValue =
    completedOrdersCount > 0 ? totalRevenue / completedOrdersCount : 0;

  const productStats = {};
  const ordersByDayMap = {};

  completedOrders.forEach((order) => {
    const day = String(getOrderAnalyticsDate(order)).slice(0, 10);

    if (day) {
      if (!ordersByDayMap[day]) {
        ordersByDayMap[day] = {
          date: day,
          orders: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
        };
      }

      const orderCost = (order.items || []).reduce(
        (sum, item) => sum + getOrderItemCost(item, db),
        0
      );

      ordersByDayMap[day].orders += 1;
      ordersByDayMap[day].revenue += Number(order.total || 0);
      ordersByDayMap[day].cost += orderCost;
      ordersByDayMap[day].profit += Number(order.total || 0) - orderCost;
    }

    (order.items || []).forEach((item) => {
      const id = item.productId || item.id || item.name;
      const quantity = Number(item.quantity || 0);
      const revenue = Number(item.total || 0);
      const cost = getOrderItemCost(item, db);
      const profit = revenue - cost;

      if (!productStats[id]) {
        productStats[id] = {
          id,
          name: item.name,
          purchaseCount: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
        };
      }

      productStats[id].purchaseCount += quantity;
      productStats[id].revenue += revenue;
      productStats[id].cost += cost;
      productStats[id].profit += profit;
    });
  });

  const topProducts = Object.values(productStats)
    .sort((a, b) => Number(b.profit || 0) - Number(a.profit || 0))
    .slice(0, 10);

  const ordersByDay = Object.values(ordersByDayMap).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  return {
    filters,
    totalOrders,
    completedOrdersCount,
    totalRevenue,
    totalCost,
    totalProfit,
    averageOrderValue,
    topProducts,
    ordersByDay,
  };
}

module.exports = {
  buildAnalytics,
};