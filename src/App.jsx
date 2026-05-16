
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
import BrandLogo from "./components/BrandLogo.jsx";


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

  selectedBrands,
  setSelectedBrands,

  selectedProductTypes,
  setSelectedProductTypes,

  selectedCountries,
  setSelectedCountries,

  selectedStockStatuses,
  setSelectedStockStatuses,

  showPopularOnly,
  setShowPopularOnly,

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
        "Тимчасово не вдалося завантажити каталог. Спробуйте оновити сторінку трохи пізніше."
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
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f5ef] px-4 py-10 text-stone-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.16),transparent_38%)]" />
        <div className="absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-white/70 blur-3xl" />

        <div className="eg-glass eg-premium-card relative w-full max-w-3xl overflow-hidden rounded-[2.2rem] border border-white/80 bg-white/90 p-6 shadow-[0_28px_90px_rgba(20,83,45,0.16)] sm:p-8 lg:p-10">
          <div className="absolute right-0 top-0 h-40 w-40 translate-x-12 -translate-y-12 rounded-full bg-emerald-100/80 blur-2xl" />

          <div className="relative z-10">
            <BrandLogo size="lg" animated />

            <div className="mt-8 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-emerald-900">
              Evergreen coffee поруч
            </div>

            <h1 className="mt-4 max-w-2xl text-3xl font-black leading-tight text-stone-950 sm:text-4xl">
              Кавова пауза: ми оновлюємо каталог
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600">
              Evergreen coffee зовсім скоро повернеться до роботи. Ми вже
              готуємо вітрину, товари та замовлення, щоб ви могли зручно
              обрати каву й маркет поруч із домом.
            </p>

            <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold leading-6 text-amber-900 ring-1 ring-amber-100">
              Напис на вітрині: готуємо каву, оновлюємо полиці, повертаємося
              зовсім скоро.
            </p>

            <div className="mt-6 rounded-[1.6rem] bg-stone-50/90 p-5 ring-1 ring-stone-100">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-800">
                Що можна зробити
              </p>

              <p className="mt-3 text-sm leading-7 text-stone-600">
                Спробуйте оновити сторінку за кілька хвилин. Якщо вам потрібно
                швидко зробити замовлення, напишіть нам у Telegram або
                зверніться до кавʼярні напряму.
              </p>
            </div>

            <div className="mt-7">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="eg-button eg-sweep w-full rounded-2xl bg-emerald-900 px-6 py-4 text-sm font-black text-white shadow-lg shadow-emerald-900/20 hover:bg-emerald-800 sm:w-auto"
              >
                Оновити сторінку
              </button>
            </div>
          </div>
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
          products={products}
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
          selectedBrands={selectedBrands}
          setSelectedBrands={setSelectedBrands}
          selectedProductTypes={selectedProductTypes}
          setSelectedProductTypes={setSelectedProductTypes}
          selectedCountries={selectedCountries}
          setSelectedCountries={setSelectedCountries}
          selectedStockStatuses={selectedStockStatuses}
          setSelectedStockStatuses={setSelectedStockStatuses}
          showPopularOnly={showPopularOnly}
          setShowPopularOnly={setShowPopularOnly}
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
