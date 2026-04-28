import { useEffect, useMemo, useState } from "react";

import { api } from "./api/client.js";

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
export default function App() {
  const [view, setView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("admin") === "1" ? "admin" : "home";
  });

  const [categories, setCategories] = useState([{ id: "all", name: "Усі товари" }]);
  const [products, setProducts] = useState([]);
  const [adminProducts, setAdminProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [appError, setAppError] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 9;
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [orderMessage, setOrderMessage] = useState("");
  const [createdOrder, setCreatedOrder] = useState(null);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [analytics, setAnalytics] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    telegram: "",
    deliveryType: "pickup",
    building: "",
    entrance: "",
    floor: "",
    apartment: "",
    payment: "Після підтвердження",
    comment: "",
  });

const emptyDraftProduct = {
  name: "",
  category: "coffee",
  subcategory: "",
  newCategoryName: "",
  newSubcategoryName: "",
  description: "",
  details: "",
  unit: "1 шт",
  packageInfo: "продається поштучно",
  composition: "",
  statusLabel: "В наявності",
  price: "",
  oldPrice: "",
  image: "",
  popular: false,
  active: true,
};

  const [draftProduct, setDraftProduct] = useState(emptyDraftProduct);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    async function bootstrap() {
      try {
        setAppError("");
        await loadPublicData();

        const adminStatus = await api.adminMe();

        if (adminStatus.authenticated) {
          setIsAdmin(true);
          await loadAdminData();

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
// сброс подкатегории при смене категории
useEffect(() => {
  setSelectedSubcategory("all");
  setCurrentPage(1);
}, [selectedCategory]);

// сброс страницы при фильтрах
useEffect(() => {
  setCurrentPage(1);
}, [query, selectedCategory, selectedSubcategory, minPrice, maxPrice, sortBy]);
  

async function loadPublicData() {
    const [categoriesResponse, productsResponse] = await Promise.all([
      api.getCategories(),
      api.getProducts(),
    ]);

    setCategories([{ id: "all", name: "Усі товари" }, ...categoriesResponse.categories]);
    setProducts(productsResponse.products);
  }

  async function loadAdminData() {
    const [productsResponse, ordersResponse, analyticsResponse] = await Promise.all([
      api.getAdminProducts(),
      api.getAdminOrders(),
      api.getAdminAnalytics(),
    ]);

    setAnalytics(analyticsResponse);

    setAdminProducts(productsResponse.products);
    setOrders(ordersResponse.orders);
  }

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim();
    const subcategoryMatch =
        selectedSubcategory === "all" || product.subcategory === selectedSubcategory;

    const filtered = products.filter((product) => {
      
      const categoryName =
        categories.find((category) => category.id === product.category)?.name || "";

      const searchableText = [
        product.name,
        product.description,
        product.details,
        product.unit,
        product.packageInfo,
        product.price,
        categoryName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const categoryMatch =
        selectedCategory === "all" || product.category === selectedCategory;
      
      const subcategoryMatch =
        selectedSubcategory === "all" || product.subcategory === selectedSubcategory;

      const queryMatch =
        !normalizedQuery || searchableText.includes(normalizedQuery);

      const minPriceMatch =
        minPrice === "" || Number(product.price) >= Number(minPrice);

      const maxPriceMatch =
        maxPrice === "" || Number(product.price) <= Number(maxPrice);

      return (
          product.active &&
          categoryMatch &&
          subcategoryMatch &&
          queryMatch &&
          minPriceMatch &&
          maxPriceMatch
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "price-asc") return Number(a.price) - Number(b.price);
      if (sortBy === "price-desc") return Number(b.price) - Number(a.price);
      if (sortBy === "name-asc") return a.name.localeCompare(b.name, "uk");
      return 0;
    });
        }, [
        products,
        categories,
        selectedCategory,
        selectedSubcategory,
        query,
        minPrice,
        maxPrice,
        sortBy,
      ]);


  const totalProductPages = Math.ceil(visibleProducts.length / productsPerPage) || 1;

  const paginatedProducts = visibleProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

const popularProducts = useMemo(() => {
  return [...products]
    .filter((product) => product.active)
    .sort((a, b) => {
      const purchasesDiff =
        Number(b.purchaseCount || 0) - Number(a.purchaseCount || 0);

      if (purchasesDiff !== 0) return purchasesDiff;

      return Number(b.popular) - Number(a.popular);
    })
    .slice(0, 6);
}, [products]);

  const cartItems = cart
    .map((cartItem) => {
      const product = products.find((item) => item.id === cartItem.id);
      return product ? { ...product, quantity: cartItem.quantity } : null;
    })
    .filter(Boolean);

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  function addToCart(product) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...current, { id: product.id, quantity: 1 }];
    });
  }

  function changeQuantity(id, delta) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(id) {
    setCart((current) => current.filter((item) => item.id !== id));
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitOrder() {
    if (!cartItems.length || !form.name || (!form.phone && !form.telegram)) {
      return;
    }

    try {
      const result = await api.createOrder({
        items: cart.map((item) => ({
          id: item.id,
          quantity: item.quantity,
        })),
        form,
      });

      setOrderMessage(result.telegramMessage);
      setCreatedOrder(result.order);
      setView("success");

      if (isAdmin) {
        await loadAdminData();
      }
    } catch (error) {
      console.error("Create order error:", error);
      alert("Не вдалося створити замовлення. Перевір backend.");
    }
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
    setView("home");
  }

  async function addDraftProduct() {
    if (!draftProduct.name || !draftProduct.price) return;

    await api.createAdminProduct({
      ...draftProduct,
      price: Number(draftProduct.price),
      oldPrice: draftProduct.oldPrice ? Number(draftProduct.oldPrice) : null,
    });

    setDraftProduct(emptyDraftProduct);

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
    oldPrice: product.oldPrice ? String(product.oldPrice) : "",
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
    oldPrice: editingProduct.oldPrice ? Number(editingProduct.oldPrice) : null,
  });

  setEditingProduct(null);

  await loadPublicData();
  await loadAdminData();
}

  async function updateOrderStatus(orderId, status) {
    await api.updateAdminOrder(orderId, { status });
    await loadAdminData();
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
      />

      {view === "home" && (
        <HomeView
          setView={setView}
          popularProducts={popularProducts}
          categories={categories}
          addToCart={addToCart}
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
          totalProducts={visibleProducts.length}
          currentPage={currentPage}
          totalProductPages={totalProductPages}
          setCurrentPage={setCurrentPage}
          addToCart={addToCart}
          openProduct={(product) => {
            setSelectedProduct(product);
            setView("product");
          }}
        />
      )}
     
      {view === "product" && (
        <ProductDetailsView
          product={selectedProduct}
          categories={categories}
          products={products}
          addToCart={addToCart}
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
        updateOrderStatus={updateOrderStatus}
        logoutAdmin={logoutAdmin}
        analytics={analytics}
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