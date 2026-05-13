import { useMemo, useState } from "react";

import AdminOrdersPanel from "../components/admin/AdminOrdersPanel.jsx";
import AdminAnalyticsPanel from "../components/admin/AdminAnalyticsPanel.jsx";
import AdminProductEditModal from "../components/admin/AdminProductEditModal.jsx";
import AdminCatalogPanel from "../components/admin/AdminCatalogPanel.jsx";
import AdminCustomersPanel from "../components/admin/AdminCustomersPanel.jsx";
import AdminSecurityPanel from "../components/admin/AdminSecurityPanel.jsx";

export default function AdminView({
  categories,
  products,
  adminCategories,
  orders,

  draftProduct,
  setDraftProduct,

  editingProduct,
  setEditingProduct,

  startEditProduct,
  cancelEditProduct,
  saveEditedProduct,

  addDraftProduct,
  toggleProductActive,
  deleteProduct,

  updateOrderAction,
  logoutAdmin,

  analytics,
  analyticsFilters,
  updateAnalyticsFilters,

  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
}) {
  const [adminTab, setAdminTab] = useState("orders");

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
    };
  }, [products, orders, safeCategories]);

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
      id: "customers",
      label: "Клієнти",
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

  return (
    <main className="eg-ambient mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="eg-glass eg-premium-card mb-8 overflow-hidden rounded-[2.5rem] p-6 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="w-fit rounded-full border border-emerald-200 bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-emerald-800 shadow-sm backdrop-blur">
              Адмін-панель
            </p>

            <h1 className="mt-4 text-4xl font-black leading-tight text-stone-950">
              Керування магазином
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-600">
              Керуйте замовленнями, каталогом товарів, клієнтами, безпекою та
              аналітикою Evergreen coffee.
            </p>
          </div>

          <button
            type="button"
            onClick={logoutAdmin}
            className="eg-button rounded-2xl border border-stone-300 bg-white/80 px-5 py-3 font-black text-stone-900 backdrop-blur hover:bg-white"
          >
            Вийти
          </button>
        </div>

        <div className="eg-stagger mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="eg-card rounded-[1.6rem] bg-white/75 p-5 shadow-sm ring-1 ring-stone-100 hover:bg-emerald-50/60">
            <p className="text-xs font-black uppercase tracking-wide text-stone-400">
              Товарів
            </p>
            <p className="mt-2 text-3xl font-black text-stone-950">
              {stats.products}
            </p>
          </div>

          <div className="eg-card rounded-[1.6rem] bg-white/75 p-5 shadow-sm ring-1 ring-stone-100 hover:bg-emerald-50/60">
            <p className="text-xs font-black uppercase tracking-wide text-stone-400">
              Активних
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-900">
              {stats.activeProducts}
            </p>
          </div>

          <div className="eg-card rounded-[1.6rem] bg-white/75 p-5 shadow-sm ring-1 ring-stone-100 hover:bg-amber-50/70">
            <p className="text-xs font-black uppercase tracking-wide text-stone-400">
              Прихованих
            </p>
            <p className="mt-2 text-3xl font-black text-amber-800">
              {stats.hiddenProducts}
            </p>
          </div>

          <div className="eg-card rounded-[1.6rem] bg-white/75 p-5 shadow-sm ring-1 ring-stone-100 hover:bg-emerald-50/60">
            <p className="text-xs font-black uppercase tracking-wide text-stone-400">
              Категорій / підкатегорій
            </p>
            <p className="mt-2 text-3xl font-black text-stone-950">
              {stats.categories} / {stats.subcategories}
            </p>
          </div>
        </div>
      </section>

      <div className="eg-glass eg-premium-card mb-8 overflow-x-auto rounded-[2rem] p-2">
        <div className="flex min-w-max gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setAdminTab(tab.id)}
              className={`eg-button whitespace-nowrap rounded-[1.4rem] px-5 py-3 text-sm font-black ${
                adminTab === tab.id
                  ? "bg-emerald-900 text-white shadow-lg shadow-emerald-900/20"
                  : "text-stone-700 hover:bg-white/80 hover:text-emerald-900"
              }`}
            >
              {tab.label}
              {typeof tab.count === "number" && (
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                    adminTab === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

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
          draftProduct={draftProduct}
          setDraftProduct={setDraftProduct}
          addDraftProduct={addDraftProduct}
          startEditProduct={startEditProduct}
          toggleProductActive={toggleProductActive}
          deleteProduct={deleteProduct}
          createCategory={createCategory}
          updateCategory={updateCategory}
          deleteCategory={deleteCategory}
          createSubcategory={createSubcategory}
          updateSubcategory={updateSubcategory}
          deleteSubcategory={deleteSubcategory}
        />
      )}

      {adminTab === "customers" && <AdminCustomersPanel />}

      {adminTab === "security" && <AdminSecurityPanel />}

      {adminTab === "analytics" && (
        <AdminAnalyticsPanel
          analytics={analytics}
          analyticsFilters={analyticsFilters}
          updateAnalyticsFilters={updateAnalyticsFilters}
        />
      )}

      {editingProduct && (
        <AdminProductEditModal
          categories={categories}
          editingProduct={editingProduct}
          setEditingProduct={setEditingProduct}
          saveEditedProduct={saveEditedProduct}
          cancelEditProduct={cancelEditProduct}
        />
      )}
    </main>
  );
}