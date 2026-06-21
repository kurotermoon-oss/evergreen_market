
import { useCallback, useEffect, useState } from "react";
import PageLoader from "./components/PageLoader.jsx";
import {
  DEFAULT_FORM,
  PRODUCTS_PER_PAGE,
} from "./data/defaults.js";
import { applyPageMeta, getPageMeta } from "./utils/pageMeta.js";
import {
  getPathForView,
  getRouteFromLocation,
  isCartRoute,
  normalizePathname,
} from "./utils/routes.js";


import { useCart } from "./hooks/useCart.js";
import { useCatalogFilters } from "./hooks/useCatalogFilters.js";
import { useCustomerSession } from "./hooks/useCustomerSession.js";
import { useAdminData } from "./hooks/useAdminData.js";
import { usePublicData } from "./hooks/usePublicData.js";
import { useOrderSubmit } from "./hooks/useOrderSubmit.js";


import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import MobileNav from "./components/MobileNav.jsx";
import FloatingCartButton from "./components/FloatingCartButton.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import AdminProductEditModal from "./components/admin/AdminProductEditModal.jsx";
import BrandLogo from "./components/BrandLogo.jsx";
import FeedbackButton from "./components/FeedbackButton.jsx";


import HomeView from "./views/HomeView.jsx";
import CatalogView from "./views/CatalogView.jsx";
import HowItWorksView from "./views/HowItWorksView.jsx";
import CartView from "./views/CartView.jsx";
import ContactsView from "./views/ContactsView.jsx";
import SuccessView from "./views/SuccessView.jsx";
import AdminView from "./views/AdminView.jsx";
import AdminLoginView from "./views/AdminLoginView.jsx";
import ProductDetailsView from "./views/ProductDetailsView.jsx";

import CustomerAuthView from "./views/CustomerAuthView.jsx";
import AccountView from "./views/AccountView.jsx";

export default function App() {
  const [route, setRoute] = useState(() =>
    getRouteFromLocation(window.location)
  );
  const view = route.view;
  const setView = useCallback((nextView, options = {}) => {
    const targetPath = getPathForView(nextView, options);
    const currentPath = `${normalizePathname(window.location.pathname)}${
      window.location.search || ""
    }`;

    if (currentPath === targetPath) {
      return;
    }

    if (currentPath !== targetPath) {
      window.history.pushState({ view: nextView }, "", targetPath);
    }

    const nextRoute = getRouteFromLocation(window.location);

    setRoute((currentRoute) => {
      if (
        currentRoute.view === nextRoute.view &&
        currentRoute.path === nextRoute.path &&
        currentRoute.productId === nextRoute.productId
      ) {
        return currentRoute;
      }

      return nextRoute;
    });
  }, []);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isDesktopViewport, setIsDesktopViewport] = useState(() => {
    return window.matchMedia("(min-width: 768px)").matches;
  });

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

useEffect(() => {
  function handleRouteChange() {
    setRoute(getRouteFromLocation(window.location));
  }

  window.addEventListener("popstate", handleRouteChange);

  return () => {
    window.removeEventListener("popstate", handleRouteChange);
  };
}, []);

useEffect(() => {
  const desktopQuery = window.matchMedia("(min-width: 768px)");

  function handleViewportChange(event) {
    setIsDesktopViewport(event.matches);
  }

  setIsDesktopViewport(desktopQuery.matches);

  if (desktopQuery.addEventListener) {
    desktopQuery.addEventListener("change", handleViewportChange);
  } else {
    desktopQuery.addListener(handleViewportChange);
  }

  return () => {
    if (desktopQuery.removeEventListener) {
      desktopQuery.removeEventListener("change", handleViewportChange);
    } else {
      desktopQuery.removeListener(handleViewportChange);
    }
  };
}, []);

useEffect(() => {
  if (!route.isNotFound) return;

  window.history.replaceState({ view: "home" }, "", getPathForView("home"));
  setRoute(getRouteFromLocation(window.location));
}, [route.isNotFound]);




const {
  cart,
  setCart,
  clearCart,
  clearCartItems,
  cartItems,
  cartOrderGroups,
  total,
  cartCount,
  cartNotice,
  clearCartNotice,
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

  selectedFulfillmentType,
  setSelectedFulfillmentType,

  selectedSupplierId,
  setSelectedSupplierId,

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
  clearCartItems,
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
  window.scrollTo({ top: 0, behavior: "auto" });
}, [view]);

useEffect(() => {
  if (view !== "catalog") {
    setIsMobileSearchOpen(false);
  }
}, [view]);

useEffect(() => {
  if (view !== "product" || !route.productId) return;

  const sourceProducts =
    isAdmin && adminProducts.length ? adminProducts : products;
  const routedProduct = sourceProducts.find((item) => {
    return String(item.id) === String(route.productId);
  });

  setSelectedProduct(routedProduct || null);
}, [adminProducts, isAdmin, products, route.productId, view]);

useEffect(() => {
  const meta = getPageMeta(view, {
    product: selectedProduct,
  });

  applyPageMeta(meta, route.path);
}, [
  route.path,
  selectedProduct?.brand,
  selectedProduct?.description,
  selectedProduct?.details,
  selectedProduct?.name,
  view,
]);

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

function openContacts() {
  setView("contacts");
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
    setView("product", {
      productId: product?.id,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openCartDrawer() {
    setIsCartDrawerOpen(true);
  }

  function closeCartDrawer() {
    setIsCartDrawerOpen(false);
  }

  function showSupplierProducts(supplierId, supplierName) {
    setSelectedCategory("all");
    setSelectedSubcategory("all");
    setSelectedFulfillmentType("supplier_order");
    setSelectedSupplierId(supplierId || "");
    setQuery("");
    setCurrentPage(1);
    setView("catalog");
    closeCartDrawer();
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
        isAdmin={isAdmin}
        customer={customer}
      />
<div
  className={`eg-page pb-24 md:pb-0 ${
    view === "catalog" ? "eg-catalog-page" : ""
  } ${
    view === "product" ? "eg-fixed-actions-page" : ""
  }`}
>

      {view === "home" && (
      <HomeView
        setView={setView}
        openCategory={(categoryId) => {
          setSelectedCategory(categoryId);
          setSelectedSubcategory("all");
          setCurrentPage(1);
          setView("catalog");
        }}
        popularProducts={popularProducts}
        categories={categories}
        cartItems={cartItems}
        addToCart={addToCart}
        changeQuantity={changeQuantity}
        removeFromCart={removeFromCart}
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
          selectedFulfillmentType={selectedFulfillmentType}
          setSelectedFulfillmentType={setSelectedFulfillmentType}
          selectedSupplierId={selectedSupplierId}
          setSelectedSupplierId={setSelectedSupplierId}
          isMobileSearchOpen={isMobileSearchOpen}
          setIsMobileSearchOpen={setIsMobileSearchOpen}
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

      {view === "how-it-works" && (
        <HowItWorksView setView={setView} />
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
          onCartOpen={openCartDrawer}
        />
      )}

      {view === "contacts" && (
        <ContactsView setView={setView} />
      )}

      {isCartRoute(view) && (
        <CartView
          cartItems={cartItems}
          cartOrderGroups={cartOrderGroups}
          total={total}
          form={form}
          updateForm={updateForm}
          changeQuantity={changeQuantity}
          removeFromCart={removeFromCart}
          setCart={setCart}
          setView={setView}
          submitOrder={submitOrder}
          customer={customer}
          onShowSupplierProducts={showSupplierProducts}
          startCheckoutOpen={view === "checkout"}
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
        suppliers={adminSuppliers}
        adminCategories={adminCategories}
        orders={orders}
        feedback={adminFeedback}
        draftProduct={draftProduct}
        setDraftProduct={setDraftProduct}
        startEditProduct={startEditProduct}
        addDraftProduct={addDraftProduct}
        importProductsCsv={importProductsCsv}
        toggleProductActive={toggleProductActive}
        deleteProduct={deleteProduct}
        createSupplier={createSupplier}
        updateSupplier={updateSupplier}
        deleteSupplier={deleteSupplier}
        updateOrderAction={updateOrderAction}
        updateFeedbackStatus={updateFeedbackStatus}
        logoutAdmin={logoutAdmin}
        analytics={analytics}
        analyticsFilters={analyticsFilters}
        updateAnalyticsFilters={updateAnalyticsFilters}
        createCategory={createCategory}
        updateCategory={updateCategory}
        applyCategoryMarkup={applyCategoryMarkup}
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
          suppliers={adminSuppliers}
          editingProduct={editingProduct}
          setEditingProduct={setEditingProduct}
          saveEditedProduct={saveEditedProduct}
          cancelEditProduct={cancelEditProduct}
        />
      )}

      {view !== "contacts" &&
        (view === "home" || view === "how-it-works" || isDesktopViewport) && (
        <Footer setView={setView} />
      )}

      <FloatingCartButton
        isOpen={isCartDrawerOpen}
        onOpen={openCartDrawer}
        cartCount={cartCount}
      />

      {view !== "admin" && (
        <FeedbackButton
          customer={customer}
          setView={setView}
          isProductView={view === "product"}
        />
      )}

      <MobileNav
        view={view}
        setView={setView}
        onContactsClick={openContacts}
        onCartOpen={openCartDrawer}
        onSearchOpen={() => {
          setView("catalog");
          closeCartDrawer();
          setIsMobileSearchOpen(true);
        }}
        onSearchClose={() => setIsMobileSearchOpen(false)}
        isSearchOpen={isMobileSearchOpen}
        isCartOpen={isCartDrawerOpen}
        cartCount={cartCount}
        isAdmin={isAdmin}
        customer={customer}
      />

      <CartDrawer
        isOpen={isCartDrawerOpen}
        cartItems={cartItems}
        cartOrderGroups={cartOrderGroups}
        total={total}
        cartCount={cartCount}
        changeQuantity={changeQuantity}
        removeFromCart={removeFromCart}
        setCart={setCart}
        setView={setView}
        onClose={closeCartDrawer}
        onShowSupplierProducts={showSupplierProducts}
      />

      {cartNotice && (
        <div className="fixed inset-x-3 bottom-24 z-[1200] mx-auto max-w-xl rounded-[1.4rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-950 shadow-xl shadow-amber-900/10 md:bottom-6">
          <div className="flex items-start justify-between gap-3">
            <span className="whitespace-pre-line">{cartNotice}</span>

            <button
              type="button"
              onClick={clearCartNotice}
              className="eg-button shrink-0 rounded-xl px-2 py-1 text-xs font-black text-amber-900 hover:bg-amber-100"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
