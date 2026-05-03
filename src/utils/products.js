export function getRandomItems(items, limit = 6) {
  if (!Array.isArray(items)) return [];

  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));

    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled.slice(0, limit);
}

export function getDiscountPercent(product) {
  const price = Number(product?.price || 0);
  const oldPrice = Number(product?.oldPrice || 0);

  if (!oldPrice || !price || oldPrice <= price) {
    return null;
  }

  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

export function getProductPurchaseCount(product) {
  return Number(product?.purchaseCount || 0);
}

export function isProductPopular(product) {
  return Boolean(product?.isPopular || product?.autoPopular || product?.popular);
}

export function markPopularProducts(products, limit = 6) {
  if (!Array.isArray(products)) return [];

  const activeProducts = products.filter((product) => product.active !== false);

  const topPurchasedIds = new Set(
    [...activeProducts]
      .filter((product) => getProductPurchaseCount(product) > 0)
      .sort((a, b) => {
        return getProductPurchaseCount(b) - getProductPurchaseCount(a);
      })
      .slice(0, limit)
      .map((product) => String(product.id))
  );

  return products.map((product) => {
    const manuallyPopular = Boolean(product.popular);
    const autoPopular = topPurchasedIds.has(String(product.id));

    return {
      ...product,
      autoPopular,
      isPopular: manuallyPopular || autoPopular,
    };
  });
}

export function getPopularProducts(products, limit = 6) {
  const markedProducts = markPopularProducts(products, limit);

  const popularProducts = markedProducts
    .filter((product) => product.active !== false)
    .filter((product) => product.isPopular)
    .sort((a, b) => {
      const purchaseDifference =
        getProductPurchaseCount(b) - getProductPurchaseCount(a);

      if (purchaseDifference !== 0) {
        return purchaseDifference;
      }

      return Number(Boolean(b.popular)) - Number(Boolean(a.popular));
    });

  return popularProducts.slice(0, limit);
}

export function getProductUnit(product) {
  if (!product) return "1 шт";

  if (product.unit) {
    return product.unit;
  }

  if (product.unitValue && product.unitLabel) {
    return `${product.unitValue} ${product.unitLabel}`;
  }

  return "1 шт";
}

export function getProductPackage(product) {
  return product?.packageInfo || "продається поштучно";
}

export function getStockLabel(product) {
  const status = product?.stockStatus || "in_stock";

  if (status === "out_of_stock") return "Немає в наявності";
  if (status === "limited" || status === "low_stock") return "Мало в наявності";
  if (status === "preorder") return "Під замовлення";

  return "У наявності";
}

export function getStockTone(product) {
  const status = product?.stockStatus || "in_stock";

  if (status === "out_of_stock") {
    return "bg-red-50 text-red-700";
  }

  if (status === "limited" || status === "low_stock") {
    return "bg-orange-50 text-orange-700";
  }

  if (status === "preorder") {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-emerald-50 text-emerald-800";
}

export function isProductAvailable(product) {
  return product?.stockStatus !== "out_of_stock";
}

export function getCategoryName(categories, categoryId) {
  return (
    categories.find((category) => category.id === categoryId)?.name || "Товар"
  );
}