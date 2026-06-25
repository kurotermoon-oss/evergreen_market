import { useState } from "react";
import { api } from "../api/client.js";
import { EMPTY_DRAFT_PRODUCT } from "../data/defaults.js";
import { getAnalyticsDateRange } from "../utils/analyticsDateRange.js";

function getStockQuantityValue(value) {
  if (value === undefined || value === null) return null;

  const cleanValue = String(value).trim();

  if (!cleanValue) return null;

  const number = Number(cleanValue);

  if (!Number.isFinite(number)) return null;

  return Math.max(0, Math.round(number));
}

function getProductPayload(product) {
  const fulfillmentType =
    product.fulfillmentType === "supplier_order" ? "supplier_order" : "in_stock";
  const stockQuantity =
    fulfillmentType === "in_stock"
      ? getStockQuantityValue(product.stockQuantity)
      : null;

  return {
    ...product,
    fulfillmentType,
    supplierId: fulfillmentType === "supplier_order" ? product.supplierId || "" : "",
    stockStatus:
      fulfillmentType === "supplier_order"
        ? "preorder"
        : stockQuantity > 0
          ? "in_stock"
          : "out_of_stock",
    stockQuantity,
    price: Number(product.price),
    costPrice: Number(product.costPrice || 0),
    oldPrice: product.oldPrice ? Number(product.oldPrice) : null,
    priceMode: product.priceMode === "manual" ? "manual" : "auto",
  };
}

export function useAdminData({ loadPublicData, setView }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminProducts, setAdminProducts] = useState([]);
  const [adminSuppliers, setAdminSuppliers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [adminFeedback, setAdminFeedback] = useState([]);

  const [analytics, setAnalytics] = useState(null);
  const [analyticsFilters, setAnalyticsFilters] = useState({
    preset: "30d",
    from: "",
    to: "",
  });

  const [draftProduct, setDraftProduct] = useState(EMPTY_DRAFT_PRODUCT);
  const [editingProduct, setEditingProduct] = useState(null);


  const [adminCategories, setAdminCategories] = useState([]);


async function loadAdminData(nextAnalyticsFilters = analyticsFilters) {
  const analyticsDateRange = getAnalyticsDateRange(nextAnalyticsFilters);

  const [
    productsResponse,
    suppliersResponse,
    categoriesResponse,
    ordersResponse,
    analyticsResponse,
    feedbackResponse,
  ] = await Promise.all([
    api.getAdminProducts(),
    api.getAdminSuppliers(),
    api.getAdminCategories(),
    api.getAdminOrders(),
    api.getAdminAnalytics(analyticsDateRange),
    api.getAdminFeedback(),
  ]);

  setAdminProducts(productsResponse.products || []);
  setAdminSuppliers(suppliersResponse.suppliers || []);
  setAdminCategories(categoriesResponse.categories || []);
  setOrders(ordersResponse.orders || []);
  setAnalytics(analyticsResponse);
  setAdminFeedback(feedbackResponse.feedback || []);
}

  async function checkAdminSession() {
    const adminStatus = await api.adminMe();

    if (adminStatus.authenticated) {
      setIsAdmin(true);
      await loadAdminData();

      return true;
    }

    setIsAdmin(false);

    return false;
  }

  async function loginAdmin(payload) {
    await api.adminLogin(payload);

    setIsAdmin(true);
    await loadAdminData();
    setView("admin");
  }

  async function logoutAdmin() {
    await api.adminLogout();

    setIsAdmin(false);
    setAdminProducts([]);
    setAdminSuppliers([]);
    setOrders([]);
    setAdminFeedback([]);
    setAnalytics(null);
    setView("home");
    setAdminCategories([]);
  }

async function addDraftProduct() {
  if (!draftProduct.name || !draftProduct.price) return;

  if (
    draftProduct.fulfillmentType === "supplier_order" &&
    !draftProduct.supplierId
  ) {
    alert("Для товару під замовлення потрібно вибрати постачальника.");
    return;
  }

  if (
    draftProduct.fulfillmentType !== "supplier_order" &&
    getStockQuantityValue(draftProduct.stockQuantity) === null
  ) {
    alert("Для товару в наявності потрібно вказати кількість.");
    return;
  }

  await api.createAdminProduct(getProductPayload(draftProduct));

  setDraftProduct(EMPTY_DRAFT_PRODUCT);

  await loadPublicData();
  await loadAdminData();

  alert("Товар успішно створено");
}

  async function toggleProductActive(id) {
    const product = adminProducts.find((item) => item.id === id);

    if (!product) return;

    await api.updateAdminProduct(id, {
      active: !product.active,
    });

    await loadPublicData();
    await loadAdminData();
  }

  async function deleteProduct(id) {
    const confirmed = window.confirm("Видалити цей товар назавжди?");

    if (!confirmed) return;

    await api.deleteAdminProduct(id);

    await loadPublicData();
    await loadAdminData();

    setView("admin");
  }

  async function importProductsCsv(products) {
    const result = await api.importAdminProducts({
      products,
    });

    await loadPublicData();
    await loadAdminData();

    return result;
  }

  function startEditProduct(product) {
    setEditingProduct({
      ...product,
      price: String(product.price || ""),
      costPrice: String(product.costPrice || ""),
      oldPrice: product.oldPrice ? String(product.oldPrice) : "",
      stockQuantity:
        product.stockQuantity === null || product.stockQuantity === undefined
          ? ""
          : String(product.stockQuantity),
      supplierId: product.supplierId || "",
      fulfillmentType: product.fulfillmentType || "in_stock",
      priceMode: product.priceMode === "manual" ? "manual" : "auto",
    });
  }

  function cancelEditProduct() {
    setEditingProduct(null);
  }

  async function saveEditedProduct() {
    if (!editingProduct?.id || !editingProduct.name || !editingProduct.price) {
      return;
    }

    if (
      editingProduct.fulfillmentType === "supplier_order" &&
      !editingProduct.supplierId
    ) {
      alert("Для товару під замовлення потрібно вибрати постачальника.");
      return;
    }

    if (
      editingProduct.fulfillmentType !== "supplier_order" &&
      getStockQuantityValue(editingProduct.stockQuantity) === null
    ) {
      alert("Для товару в наявності потрібно вказати кількість.");
      return;
    }

    await api.updateAdminProduct(
      editingProduct.id,
      getProductPayload(editingProduct)
    );

    setEditingProduct(null);

    await loadPublicData();
    await loadAdminData();
  }

  async function updateAnalyticsFilters(nextFilters) {
    setAnalyticsFilters(nextFilters);
    await loadAdminData(nextFilters);
  }

  async function updateOrderAction(orderId, action, payload = {}) {
    await api.updateAdminOrderAction(orderId, {
      action,
      ...payload,
    });

    await loadAdminData();
  }

  async function updateFeedbackStatus(feedbackId, status) {
    await api.updateAdminFeedbackStatus(feedbackId, status);

    await loadAdminData();
  }

async function createSupplier(payload) {
  await api.createAdminSupplier(payload);
  await loadPublicData();
  await loadAdminData();
}

async function updateSupplier(id, payload) {
  await api.updateAdminSupplier(id, payload);
  await loadPublicData();
  await loadAdminData();
}

async function deleteSupplier(id) {
  await api.deleteAdminSupplier(id);
  await loadPublicData();
  await loadAdminData();
}


  async function createCategory(name) {
  await api.createAdminCategory({ name });
  await loadPublicData();
  await loadAdminData();
}

async function updateCategory(id, payload) {
  if (
    Object.prototype.hasOwnProperty.call(payload, "name") &&
    !String(payload.name || "").trim()
  ) {
    return;
  }

  const result = await api.updateAdminCategory(id, payload);
  await loadPublicData();
  await loadAdminData();

  return result;
}

async function applyCategoryMarkup(categoryId, markupPercent) {
  const result = await api.applyAdminCategoryMarkup(categoryId, {
    markupPercent,
  });

  await loadPublicData();
  await loadAdminData();

  return result;
}

async function deleteCategory(id) {
  await api.deleteAdminCategory(id);

  await loadPublicData();
  await loadAdminData();
}

async function createSubcategory(categoryId, name) {
  await api.createAdminSubcategory(categoryId, { name });
  await loadPublicData();
  await loadAdminData();
}

async function updateSubcategory(categoryId, subcategoryId, payload) {
  if (
    Object.prototype.hasOwnProperty.call(payload, "name") &&
    !String(payload.name || "").trim()
  ) {
    return;
  }

  const result = await api.updateAdminSubcategory(
    categoryId,
    subcategoryId,
    payload
  );
  await loadPublicData();
  await loadAdminData();

  return result;
}

async function deleteSubcategory(categoryId, subcategoryId) {
  await api.deleteAdminSubcategory(categoryId, subcategoryId);

  await loadPublicData();
  await loadAdminData();
}

return {
  isAdmin,
  adminProducts,
  adminSuppliers,
  adminCategories,
  orders,
  adminFeedback,

  analytics,
  analyticsFilters,

  draftProduct,
  setDraftProduct,

  editingProduct,
  setEditingProduct,

  loadAdminData,
  checkAdminSession,

  loginAdmin,
  logoutAdmin,

  addDraftProduct,
  importProductsCsv,
  toggleProductActive,
  deleteProduct,

  startEditProduct,
  cancelEditProduct,
  saveEditedProduct,

  updateAnalyticsFilters,
  updateOrderAction,
  updateFeedbackStatus,

  createSupplier,
  updateSupplier,
  deleteSupplier,
  
  createCategory,
  updateCategory,
  applyCategoryMarkup,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  
};
}
