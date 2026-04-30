import { useState } from "react";
import { api } from "../api/client.js";
import { EMPTY_DRAFT_PRODUCT } from "../data/defaults.js";
import { getAnalyticsDateRange } from "../utils/analyticsDateRange.js";

export function useAdminData({ loadPublicData, setView }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminProducts, setAdminProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [analytics, setAnalytics] = useState(null);
  const [analyticsFilters, setAnalyticsFilters] = useState({
    preset: "30d",
    from: "",
    to: "",
  });

  const [draftProduct, setDraftProduct] = useState(EMPTY_DRAFT_PRODUCT);
  const [editingProduct, setEditingProduct] = useState(null);

  async function loadAdminData(nextAnalyticsFilters = analyticsFilters) {
    const analyticsDateRange = getAnalyticsDateRange(nextAnalyticsFilters);

    const [productsResponse, ordersResponse, analyticsResponse] =
      await Promise.all([
        api.getAdminProducts(),
        api.getAdminOrders(),
        api.getAdminAnalytics(analyticsDateRange),
      ]);

    setAdminProducts(productsResponse.products);
    setOrders(ordersResponse.orders);
    setAnalytics(analyticsResponse);
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
    setOrders([]);
    setAnalytics(null);
    setView("home");
  }

  async function addDraftProduct() {
    if (!draftProduct.name || !draftProduct.price) return;

    await api.createAdminProduct({
      ...draftProduct,
      price: Number(draftProduct.price),
      costPrice: Number(draftProduct.costPrice || 0),
      oldPrice: draftProduct.oldPrice ? Number(draftProduct.oldPrice) : null,
    });

    setDraftProduct(EMPTY_DRAFT_PRODUCT);

    await loadPublicData();
    await loadAdminData();
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

  function startEditProduct(product) {
    setEditingProduct({
      ...product,
      price: String(product.price || ""),
      costPrice: String(product.costPrice || ""),
      oldPrice: product.oldPrice ? String(product.oldPrice) : "",
      stockQuantity: product.stockQuantity ? String(product.stockQuantity) : "",
    });
  }

  function cancelEditProduct() {
    setEditingProduct(null);
  }

  async function saveEditedProduct() {
    if (!editingProduct?.id || !editingProduct.name || !editingProduct.price) {
      return;
    }

    await api.updateAdminProduct(editingProduct.id, {
      ...editingProduct,
      price: Number(editingProduct.price),
      costPrice: Number(editingProduct.costPrice || 0),
      oldPrice: editingProduct.oldPrice
        ? Number(editingProduct.oldPrice)
        : null,
      stockQuantity: editingProduct.stockQuantity
        ? Number(editingProduct.stockQuantity)
        : null,
    });

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

  return {
    isAdmin,
    adminProducts,
    orders,

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
    toggleProductActive,
    deleteProduct,

    startEditProduct,
    cancelEditProduct,
    saveEditedProduct,

    updateAnalyticsFilters,
    updateOrderAction,
  };
}