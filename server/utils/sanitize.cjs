function sanitizePublicProduct(product) {
  const { costPrice, ...publicProduct } = product;
  return publicProduct;
}

function sanitizeOrderForCustomer(order) {
  return {
    ...order,
    items: (order.items || []).map((item) => {
      const { costPrice, costTotal, profit, ...publicItem } = item;
      return publicItem;
    }),
  };
}

module.exports = {
  sanitizePublicProduct,
  sanitizeOrderForCustomer,
};