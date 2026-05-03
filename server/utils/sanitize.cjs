function sanitizePublicProduct(product) {
  return {
    id: product.id,

    name: product.name || "",

    category: product.category || "",
    subcategory: product.subcategory || "",

    brand: product.brand || "",
    productType: product.productType || "",
    countryOfOrigin: product.countryOfOrigin || "",

    description: product.description || "",
    details: product.details || "",
    benefits: product.benefits || "",

    unit: product.unit || "1 шт",
    packageInfo: product.packageInfo || "продається поштучно",

    composition: product.composition || "",
    allergens: product.allergens || "",
    storageConditions: product.storageConditions || "",

    price: Number(product.price || 0),
    oldPrice:
      product.oldPrice === undefined || product.oldPrice === null
        ? null
        : Number(product.oldPrice),

    image: product.image || "",

    popular: Boolean(product.popular),
    purchaseCount: Number(product.purchaseCount || 0),

    stockStatus: product.stockStatus || "in_stock",

    createdAt: product.createdAt || null,
    updatedAt: product.updatedAt || null,
  };
}

function sanitizeOrderForCustomer(order) {
  return {
    ...order,

    items: (order.items || []).map((item) => {
      const { costPrice, costTotal, profit, ...publicItem } = item;

      return {
        ...publicItem,

        price: Number(publicItem.price || 0),
        quantity: Number(publicItem.quantity || 0),
        total: Number(publicItem.total || 0),

        brand: publicItem.brand || "",
        unit: publicItem.unit || "",
        packageInfo: publicItem.packageInfo || "",
      };
    }),
  };
}

module.exports = {
  sanitizePublicProduct,
  sanitizeOrderForCustomer,
};