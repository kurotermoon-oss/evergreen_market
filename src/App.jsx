
import { useEffect, useState } from "react";

import { api } from "./api/client.js";
import {
  DEFAULT_FORM,
  PRODUCTS_PER_PAGE,
} from "./data/defaults.js";


import { useCart } from "./hooks/useCart.js";
import { useCatalogFilters } from "./hooks/useCatalogFilters.js";
import { useCustomerSession } from "./hooks/useCustomerSession.js";
import { useAdminData } from "./hooks/useAdminData.js";
import { usePublicData } from "./hooks/usePublicData.js";
import { useOrderSubmit } from "./hooks/useOrderSubmit.js";


import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import MobileNav from "./components/MobileNav.jsx";


import HomeView from "./views/HomeView.jsx";
import CatalogView from "./views/CatalogView.jsx";
import CartView from "./views/CartView.jsx";
import SuccessView from "./views/SuccessView.jsx";
import AdminView from "./views/AdminView.jsx";
import AdminLoginView from "./views/AdminLoginView.jsx";
import ProductDetailsView from "./views/ProductDetailsView.jsx";

import CustomerAuthView from "./views/CustomerAuthView.jsx";
import AccountView from "./views/AccountView.jsx";
const VIEW_STORAGE_KEY = "evergreen_current_view";

const RESTORABLE_VIEWS = new Set([
  "home",
  "catalog",
  "cart",
  "customer-auth",
  "account",
  "admin",
]);

function getInitialView() {
  const params = new URLSearchParams(window.location.search);

  if (params.get("admin") === "1") {
    return "admin";
  }

  const savedView = localStorage.getItem(VIEW_STORAGE_KEY);

  if (RESTORABLE_VIEWS.has(savedView)) {
    return savedView;
  }

  return "home";
}

export default function App() {
  const [view, setView] = useState(getInitialView);

  const {
    categories,
    products,
    loadPublicData,
  } = usePublicData();


const {
  cart,
  setCart,
  clearCart,
  cartItems,
  total,
  cartCount,
  addToCart,
  changeQuantity,
  removeFromCart,
} = useCart(products);


    const {
  selectedCategory,
  setSelectedCategory,

  selectedSubcategory,
  setSelectedSubcategory,

  query,
  setQuery,

  currentPage,
  setCurrentPage,

  minPrice,
  setMinPrice,

  maxPrice,
  setMaxPrice,

  sortBy,
  setSortBy,

  filteredProducts,
  paginatedProducts,
  totalProductPages,
  popularProducts,
} = useCatalogFilters({
  products,
  categories,
  productsPerPage: PRODUCTS_PER_PAGE,
});


  const [isAppLoading, setIsAppLoading] = useState(true);
  const [appError, setAppError] = useState("");

  const [selectedProduct, setSelectedProduct] = useState(null);


const [form, setForm] = useState(DEFAULT_FORM);

const {
  customer,
  customerOrders,
  setCustomer,
  checkCustomerSession,
  loadCustomerOrders,
  customerLogin,
  customerRegister,
  updateCustomerProfile,
  customerLogout: logoutCustomerSession,
} = useCustomerSession({
  applyCustomerToForm,
});


const {
  isAdmin,
  adminProducts,
  adminCategories,
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

  createCategory,
  updateCategory,
  deleteCategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
} = useAdminData({
  loadPublicData,
  setView,
});



const {
  orderMessage,
  setOrderMessage,
  createdOrder,
  setCreatedOrder,
  submitOrder,
} = useOrderSubmit({
  cart,
  cartItems,
  form,
  customer,
  isAdmin,
  loadAdminData,
  loadCustomerOrders,
  clearCart,
  setView,
});



useEffect(() => {
  async function bootstrap() {
    try {
      setAppError("");

      await loadPublicData();
      await checkCustomerSession();

      const adminAuthenticated = await checkAdminSession();

      if (adminAuthenticated) {
        const params = new URLSearchParams(window.location.search);

        if (params.get("admin") === "1" || view === "admin") {
          setView("admin");
        }
      }
    } catch (error) {
      console.error("Bootstrap error:", error);
      setAppError(
        "Не вдалося підключитися до backend. Перевір, чи запущено npm.cmd run server."
      );
    } finally {
      setIsAppLoading(false);
    }
  }

  bootstrap();
}, []);

  
useEffect(() => {
  let viewToSave = view;

  if (view === "product") {
    viewToSave = "catalog";
  }

  if (view === "success") {
    viewToSave = "home";
  }

  if (RESTORABLE_VIEWS.has(viewToSave)) {
    localStorage.setItem(VIEW_STORAGE_KEY, viewToSave);
  }
}, [view]);

useEffect(() => {
  window.scrollTo({ top: 0, behavior: "auto" });
}, [view]);


  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }


function applyCustomerToForm(customerData) {
  if (!customerData) return;

  setForm((current) => ({
    ...current,

    name: customerData.name || "",
    phone: customerData.phone || "",
    telegram: customerData.telegram ? `@${customerData.telegram}` : "",

    building: customerData.building || "",
    entrance: customerData.entrance || "",
    floor: customerData.floor || "",
    apartment: customerData.apartment || "",
  }));
}


  async function customerLogout() {
  await logoutCustomerSession();

  setView("home");
}

  function openProduct(product) {
    setSelectedProduct(product);
    setView("product");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }


  if (isAppLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 text-stone-950">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-lg font-bold">Завантаження Evergreen...</p>
        </div>
      </div>
    );
  }

  if (appError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 text-stone-950">
        <div className="max-w-xl rounded-3xl bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
            Backend error
          </p>

          <h1 className="mt-2 text-2xl font-black">
            Сайт запустився, але backend не відповідає
          </h1>

          <p className="mt-3 text-stone-600">{appError}</p>

          <div className="mt-5 rounded-2xl bg-stone-950 p-4 text-sm text-white">
            <p>1. Відкрий другий термінал</p>
            <p>2. Запусти: npm.cmd run server</p>
            <p>3. Перевір: http://localhost:3001/api/health</p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-2xl bg-emerald-900 px-5 py-3 font-bold text-white hover:bg-emerald-800"
          >
            Оновити сторінку
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-950">
      <Header
        view={view}
        setView={setView}
        cartCount={cartCount}
        isAdmin={isAdmin}
        customer={customer}
      />

      {view === "home" && (
      <HomeView
        setView={setView}
        popularProducts={popularProducts}
        categories={categories}
        addToCart={addToCart}
        openProduct={openProduct}
      />
      )}

      {view === "catalog" && (
        <CatalogView
          categories={categories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedSubcategory={selectedSubcategory}
          setSelectedSubcategory={setSelectedSubcategory}
          query={query}
          setQuery={setQuery}
          minPrice={minPrice}
          setMinPrice={setMinPrice}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          sortBy={sortBy}
          setSortBy={setSortBy}
          visibleProducts={paginatedProducts}
          totalProducts={filteredProducts.length}
          currentPage={currentPage}
          totalProductPages={totalProductPages}
          setCurrentPage={setCurrentPage}
          cartItems={cartItems}
          addToCart={addToCart}
          changeQuantity={changeQuantity}
          removeFromCart={removeFromCart}
          openProduct={openProduct}
        />
      )}
     
      {view === "product" && (
        <ProductDetailsView
          product={selectedProduct}
          categories={categories}
          products={products}
          cartItems={cartItems}
          addToCart={addToCart}
          changeQuantity={changeQuantity}
          removeFromCart={removeFromCart}
          setView={setView}
          setSelectedProduct={setSelectedProduct}
        />
      )}

      {view === "cart" && (
        <CartView
          cartItems={cartItems}
          total={total}
          form={form}
          updateForm={updateForm}
          changeQuantity={changeQuantity}
          removeFromCart={removeFromCart}
          setCart={setCart}
          setView={setView}
          submitOrder={submitOrder}
          customer={customer}
        />
      )}


      {view === "customer-auth" && (
      <CustomerAuthView
        customerLogin={customerLogin}
        customerRegister={customerRegister}
        setView={setView}
      />
    )}

    {view === "account" && (
        <AccountView
          customer={customer}
          setCustomer={setCustomer}
          customerOrders={customerOrders}
          loadCustomerOrders={loadCustomerOrders}
          customerLogout={customerLogout}
          updateCustomerProfile={updateCustomerProfile}
          setView={setView}
        />
    )}


      {view === "success" && (
        <SuccessView
          createdOrder={createdOrder}
          setCart={setCart}
          setOrderMessage={setOrderMessage}
          setCreatedOrder={setCreatedOrder}
          setView={setView}
        />
      )}

      {view === "admin" && !isAdmin && (
        <AdminLoginView loginAdmin={loginAdmin} />
      )}

      {view === "admin" && isAdmin && (
      <AdminView
        categories={categories}
        products={adminProducts}
        adminCategories={adminCategories}
        orders={orders}
        draftProduct={draftProduct}
        setDraftProduct={setDraftProduct}
        editingProduct={editingProduct}
        setEditingProduct={setEditingProduct}
        startEditProduct={startEditProduct}
        cancelEditProduct={cancelEditProduct}
        saveEditedProduct={saveEditedProduct}
        addDraftProduct={addDraftProduct}
        toggleProductActive={toggleProductActive}
        deleteProduct={deleteProduct}
        updateOrderAction={updateOrderAction}
        logoutAdmin={logoutAdmin}
        analytics={analytics}
        analyticsFilters={analyticsFilters}
        updateAnalyticsFilters={updateAnalyticsFilters}
        createCategory={createCategory}
        updateCategory={updateCategory}
        deleteCategory={deleteCategory}
        createSubcategory={createSubcategory}
        updateSubcategory={updateSubcategory}
        deleteSubcategory={deleteSubcategory}
      />
      )}

      <Footer />

      <MobileNav
        view={view}
        setView={setView}
        cartCount={cartCount}
        isAdmin={isAdmin}
      />
    </div>
  );
}