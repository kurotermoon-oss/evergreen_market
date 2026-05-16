
import { useEffect, useState } from "react";
import PageLoader from "./components/PageLoader.jsx";
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
import AdminProductEditModal from "./components/admin/AdminProductEditModal.jsx";


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
  const [shouldScrollToContacts, setShouldScrollToContacts] = useState(false);

  const {
    categories,
    products,
    loadPublicData,
  } = usePublicData();


const [showPageLoader, setShowPageLoader] = useState(true);

useEffect(() => {
  const timeoutId = window.setTimeout(() => {
    setShowPageLoader(false);
  }, 1400);

  return () => window.clearTimeout(timeoutId);
}, []);




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
  importProductsCsv,
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

useEffect(() => {
  if (!shouldScrollToContacts || view !== "home") return;

  const timeoutId = window.setTimeout(() => {
    scrollToContacts();
    setShouldScrollToContacts(false);
  }, 120);

  return () => window.clearTimeout(timeoutId);
}, [shouldScrollToContacts, view]);

useEffect(() => {
  const sourceProducts =
    isAdmin && adminProducts.length ? adminProducts : products;

  setSelectedProduct((currentProduct) => {
    if (!currentProduct?.id) return currentProduct;

    const freshProduct = sourceProducts.find((item) => {
      return String(item.id) === String(currentProduct.id);
    });

    return freshProduct || currentProduct;
  });
}, [adminProducts, isAdmin, products, selectedProduct?.id]);


  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

function scrollToContacts() {
  const contacts = document.getElementById("contacts");

  if (!contacts) return false;

  contacts.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

  return true;
}

function openContacts() {
  const contacts = document.getElementById("contacts");

  if (contacts?.getClientRects().length) {
    scrollToContacts();
    return;
  }

  setShouldScrollToContacts(true);
  setView("home");
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

  function openAdminProductEditor(product) {
    if (!isAdmin || !product) return;

    const adminProduct = adminProducts.find((item) => {
      return String(item.id) === String(product.id);
    });

    startEditProduct(adminProduct || product);
  }



  if (appError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 text-stone-950">
        <div className="eg-panel max-w-xl rounded-3xl bg-white p-8 shadow-sm">
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
            className="eg-button mt-6 rounded-2xl bg-emerald-900 px-5 py-3 font-bold text-white hover:bg-emerald-800 hover:shadow-md hover:shadow-emerald-900/20"
          >
            Оновити сторінку
          </button>
        </div>
      </div>
    );
  }

return (
  <div className="min-h-screen bg-stone-50 text-stone-950">
    <PageLoader show={showPageLoader || isAppLoading} />

    <Header
        view={view}
        setView={setView}
        onContactsClick={openContacts}
        cartCount={cartCount}
        isAdmin={isAdmin}
        customer={customer}
      />
<div key={view} className="eg-page pb-24 md:pb-0">

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
          categories={
            isAdmin && adminCategories.length ? adminCategories : categories
          }
          products={isAdmin && adminProducts.length ? adminProducts : products}
          cartItems={cartItems}
          addToCart={addToCart}
          changeQuantity={changeQuantity}
          removeFromCart={removeFromCart}
          setView={setView}
          setSelectedProduct={setSelectedProduct}
          isAdmin={isAdmin}
          onAdminEditProduct={openAdminProductEditor}
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
          customer={customer}
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
        startEditProduct={startEditProduct}
        addDraftProduct={addDraftProduct}
        importProductsCsv={importProductsCsv}
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
</div>
      {isAdmin && editingProduct && (
        <AdminProductEditModal
          categories={adminCategories.length ? adminCategories : categories}
          editingProduct={editingProduct}
          setEditingProduct={setEditingProduct}
          saveEditedProduct={saveEditedProduct}
          cancelEditProduct={cancelEditProduct}
        />
      )}

      <div className={view === "home" ? "" : "hidden md:block"}>
        <Footer />
      </div>

      <MobileNav
        view={view}
        setView={setView}
        onContactsClick={openContacts}
        cartCount={cartCount}
        isAdmin={isAdmin}
        customer={customer}
      />
    </div>
  );
}
