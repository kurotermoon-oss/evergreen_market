import { ShoppingBag, Package, Truck, RefreshCw, Users, MessageSquare, ShieldCheck, ChartNoAxesCombined, ArrowUpRight, LogOut } from "lucide-react";
import logo from "../img/logo_evergreen.webp";
import { api } from "../api/client.js";
import { lazy, Suspense, useMemo, useState } from "react";

const AdminOrdersPanel = lazy(() => import("../components/admin/AdminOrdersPanel.jsx"));
const AdminAnalyticsPanel = lazy(() => import("../components/admin/AdminAnalyticsPanel.jsx"));
const AdminCatalogPanel = lazy(() => import("../components/admin/AdminCatalogPanel.jsx"));
const AdminCustomersPanel = lazy(() => import("../components/admin/AdminCustomersPanel.jsx"));
const AdminFeedbackPanel = lazy(() => import("../components/admin/AdminFeedbackPanel.jsx"));
const AdminSecurityPanel = lazy(() => import("../components/admin/AdminSecurityPanel.jsx"));
const AdminSuppliersPanel = lazy(() => import("../components/admin/AdminSuppliersPanel.jsx"));
const AdminSupplierSyncPanel = lazy(() => import("../components/admin/AdminSupplierSyncPanel.jsx"));

export default function AdminView({
  adminApi = api,
  categories,
  products,
  suppliers = [],
  adminCategories,
  orders,
  feedback = [],

  draftProduct,
  setDraftProduct,

  startEditProduct,

  addDraftProduct,
  importProductsCsv,
  toggleProductActive,
  deleteProduct,

  createSupplier,
  updateSupplier,
  deleteSupplier,
  refreshAdminData,
  refreshPublicData,

  updateOrderAction,
  updateFeedbackStatus,
  logoutAdmin,

  analytics,
  analyticsFilters,
  updateAnalyticsFilters,

  createCategory,
  updateCategory,
  applyCategoryMarkup,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
}) {
  const [adminTab, setAdminTab] = useState("orders");
  function selectAdminTab(tab) {
    setAdminTab(tab);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  const safeCategories = adminCategories?.length ? adminCategories : categories;

  const stats = useMemo(() => {
    const activeProducts = products.filter((product) => product.active !== false);
    const hiddenProducts = products.filter((product) => product.active === false);
    const activeOrders = orders.filter((order) => {
      const status = String(order.status || "").toLowerCase();
      return !["completed", "canceled", "cancelled", "завершено", "скасовано"].includes(status);
    });

    const visibleCategories = safeCategories.filter((category) => category.id !== "all");
    const subcategoriesCount = visibleCategories.reduce((sum, category) => {
      return sum + Number(category.subcategories?.length || 0);
    }, 0);

    return {
      products: products.length,
      activeProducts: activeProducts.length,
      hiddenProducts: hiddenProducts.length,
      orders: orders.length,
      activeOrders: activeOrders.length,
      categories: visibleCategories.length,
      subcategories: subcategoriesCount,
      suppliers: suppliers.length,
      feedback: feedback.length,
      newFeedback: feedback.filter((item) => item.status === "new").length,
    };
  }, [products, orders, safeCategories, suppliers, feedback]);

  const tabs = [
    {
      id: "orders",
      label: "Замовлення",
      count: stats.activeOrders,
    },
    {
      id: "catalog",
      label: "Каталог",
      count: stats.products,
    },
    {
      id: "suppliers",
      label: "Постачальники",
      count: stats.suppliers,
    },
    {
      id: "supplier-sync",
      label: "Синхронізація",
    },
    {
      id: "customers",
      label: "Клієнти",
    },
    {
      id: "feedback",
      label: "Звернення",
      count: stats.newFeedback,
    },
    {
      id: "security",
      label: "Безпека",
    },
    {
      id: "analytics",
      label: "Аналітика",
    },
  ];

  const tabIcons = { orders: ShoppingBag, catalog: Package, suppliers: Truck, "supplier-sync": RefreshCw, customers: Users, feedback: MessageSquare, security: ShieldCheck, analytics: ChartNoAxesCombined };
  return (
    <div className="eg-admin eg-admin-shell">
      <header className="eg-admin-topbar">
        <a href="/" className="eg-admin-brand" aria-label="Evergreen coffee — до магазину"><img src={logo} alt="Evergreen coffee" /><span>Керування магазином</span></a>
        <div className="eg-admin-topbar-actions"><a href="/">До магазину <ArrowUpRight size={17} /></a><button type="button" onClick={logoutAdmin}><LogOut size={17} />Вийти</button></div>
      </header>
      <div className="eg-admin-layout">
        <aside className="eg-admin-sidebar">
          <p>РОБОЧИЙ ПРОСТІР</p>
          <nav className="eg-admin-nav" aria-label="Розділи адмін-панелі">
            {tabs.map(tab => { const TabIcon = tabIcons[tab.id]; return <button key={tab.id} type="button" onClick={() => selectAdminTab(tab.id)} aria-current={adminTab === tab.id ? "page" : undefined}><TabIcon size={18} aria-hidden="true" /><span>{tab.label}</span>{typeof tab.count === "number" && <span className="eg-admin-count">{tab.count}</span>}</button>; })}
          </nav>
        </aside>
        <label className="eg-admin-mobile-nav">Розділ панелі<select value={adminTab} onChange={event => selectAdminTab(event.target.value)}>{tabs.map(tab => <option key={tab.id} value={tab.id}>{tab.label}{typeof tab.count === "number" ? ' · ' + tab.count : ''}</option>)}</select></label>
        <main className="eg-admin-content" id="admin-content">
          <Suspense fallback={<div className="shop-loading" role="status">Завантажуємо розділ…</div>}>
      {adminTab === "orders" && (
        <AdminOrdersPanel
          orders={orders}
          updateOrderAction={updateOrderAction}
        />
      )}

      {adminTab === "catalog" && (
        <AdminCatalogPanel
          categories={safeCategories}
          products={products}
          suppliers={suppliers}
          draftProduct={draftProduct}
          setDraftProduct={setDraftProduct}
          addDraftProduct={addDraftProduct}
          importProductsCsv={importProductsCsv}
          startEditProduct={startEditProduct}
          toggleProductActive={toggleProductActive}
          deleteProduct={deleteProduct}
          createCategory={createCategory}
          updateCategory={updateCategory}
          applyCategoryMarkup={applyCategoryMarkup}
          deleteCategory={deleteCategory}
          createSubcategory={createSubcategory}
          updateSubcategory={updateSubcategory}
          deleteSubcategory={deleteSubcategory}
        />
      )}

      {adminTab === "suppliers" && (
        <AdminSuppliersPanel
          suppliers={suppliers}
          products={products}
          createSupplier={createSupplier}
          updateSupplier={updateSupplier}
          deleteSupplier={deleteSupplier}
        />
      )}

      {adminTab === "supplier-sync" && (
        <AdminSupplierSyncPanel
          apiClient={adminApi}
          suppliers={suppliers}
          refreshAdminData={refreshAdminData}
          refreshPublicData={refreshPublicData}
        />
      )}

      {adminTab === "customers" && <AdminCustomersPanel apiClient={adminApi} />}

      {adminTab === "feedback" && (
        <AdminFeedbackPanel
          feedback={feedback}
          updateFeedbackStatus={updateFeedbackStatus}
        />
      )}

      {adminTab === "security" && <AdminSecurityPanel apiClient={adminApi} />}

      {adminTab === "analytics" && (
        <AdminAnalyticsPanel
          analytics={analytics}
          analyticsFilters={analyticsFilters}
          updateAnalyticsFilters={updateAnalyticsFilters}
        />
      )}

          </Suspense>
        </main>
      </div>
    </div>
  );
}
