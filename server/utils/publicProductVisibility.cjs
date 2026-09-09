// Keep merchandising active independent of supplier availability so goods can return.
const PUBLIC_AVAILABILITY_WHERE = {
  NOT: { fulfillmentType: "supplier_order", stockStatus: "out_of_stock" },
};
function isPublicProductVisible(product) {
  return product.active !== false && !(product.fulfillmentType === "supplier_order" && product.stockStatus === "out_of_stock");
}
module.exports = { PUBLIC_AVAILABILITY_WHERE, isPublicProductVisible };
