function buildAnalytics(db) {
  const orders = Array.isArray(db.orders) ? db.orders : [];

  const totalOrders = orders.length;

  const totalRevenue = orders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const productStats = {};
  const ordersByDayMap = {};

  orders.forEach((order) => {
    const day = String(order.createdAt || "").slice(0, 10);

    if (day) {
      if (!ordersByDayMap[day]) {
        ordersByDayMap[day] = {
          date: day,
          orders: 0,
          revenue: 0,
        };
      }

      ordersByDayMap[day].orders += 1;
      ordersByDayMap[day].revenue += Number(order.total || 0);
    }

    (order.items || []).forEach((item) => {
      const id = item.productId || item.id || item.name;

      if (!productStats[id]) {
        productStats[id] = {
          id,
          name: item.name,
          purchaseCount: 0,
          revenue: 0,
        };
      }

      productStats[id].purchaseCount += Number(item.quantity || 0);
      productStats[id].revenue += Number(item.total || 0);
    });
  });

  const topProducts = Object.values(productStats)
    .sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0))
    .slice(0, 10);

  const ordersByDay = Object.values(ordersByDayMap).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  return {
    totalOrders,
    totalRevenue,
    averageOrderValue,
    topProducts,
    ordersByDay,
  };
}

module.exports = {
  buildAnalytics,
};