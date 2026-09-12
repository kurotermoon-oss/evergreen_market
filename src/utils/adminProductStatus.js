export function getAdminStockLabel(product) {
  if (product.stockStatus === "out_of_stock") return "Немає";
  const quantity = product.stockQuantity;
  if (quantity !== null && quantity !== undefined && quantity !== "" && Number.isFinite(Number(quantity))) {
    return `Залишилось: ${Math.max(0, Number(quantity))}`;
  }
  if (product.stockStatus === "limited") return "Мало в наявності";
  if (product.stockStatus === "preorder") return "Під замовлення";
  return "В наявності";
}
