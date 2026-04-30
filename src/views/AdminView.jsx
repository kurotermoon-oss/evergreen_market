import { useState } from "react";

import AdminOrdersPanel from "../components/admin/AdminOrdersPanel.jsx";
import AdminAnalyticsPanel from "../components/admin/AdminAnalyticsPanel.jsx";
import AdminProductForm from "../components/admin/AdminProductForm.jsx";
import AdminProductsPanel from "../components/admin/AdminProductsPanel.jsx";
import AdminProductEditModal from "../components/admin/AdminProductEditModal.jsx";

export default function AdminView({
  categories,
  products,
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
}) {
  const [adminTab, setAdminTab] = useState("orders");

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            Адмін-панель
          </p>

          <h1 className="mt-2 text-4xl font-black text-stone-950">
            Товари та замовлення
          </h1>

          <p className="mt-3 max-w-3xl text-stone-600">
            Керуйте замовленнями, товарами та позиціями каталогу.
          </p>
        </div>

        <button
          type="button"
          onClick={logoutAdmin}
          className="rounded-2xl border border-stone-300 px-5 py-3 font-bold text-stone-900 hover:bg-stone-100"
        >
          Вийти
        </button>
      </div>

      <div className="mb-8 flex gap-2 overflow-x-auto rounded-3xl bg-white p-2 shadow-sm">
        {[
          { id: "orders", label: "Замовлення" },
          { id: "products", label: "Товари" },
          { id: "add-product", label: "Додати товар" },
          { id: "analytics", label: "Аналітика" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setAdminTab(tab.id)}
            className={`whitespace-nowrap rounded-2xl px-5 py-3 text-sm font-black transition ${
              adminTab === tab.id
                ? "bg-emerald-900 text-white"
                : "text-stone-700 hover:bg-stone-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {adminTab === "orders" && (
        <AdminOrdersPanel
          orders={orders}
          updateOrderAction={updateOrderAction}
        />
      )}

      {adminTab === "products" && (
        <AdminProductsPanel
          products={products}
          categories={categories}
          startEditProduct={startEditProduct}
          toggleProductActive={toggleProductActive}
          deleteProduct={deleteProduct}
        />
      )}

      {adminTab === "add-product" && (
        <AdminProductForm
          categories={categories}
          draftProduct={draftProduct}
          setDraftProduct={setDraftProduct}
          addDraftProduct={addDraftProduct}
        />
      )}

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