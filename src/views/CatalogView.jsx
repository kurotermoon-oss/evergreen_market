import {
  ChevronLeft,
  ChevronRight,
  Menu,
  MoreHorizontal,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import BrandLogo from "../components/BrandLogo.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { formatUAH } from "../utils/formatUAH.js";

function getPaginationItems(currentPage, totalPages) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, "end-ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, "start-ellipsis", totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "start-ellipsis", currentPage, "end-ellipsis", totalPages];
}

function getProductWord(count) {
  const normalizedCount = Math.abs(Number(count) || 0);
  const lastDigit = normalizedCount % 10;
  const lastTwoDigits = normalizedCount % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return "товарів";
  }

  if (lastDigit === 1) {
    return "товар";
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return "товари";
  }

  return "товарів";
}

export default function CatalogView({
  categories,
  products = [],
  selectedCategory,
  setSelectedCategory,
  selectedSubcategory,
  setSelectedSubcategory,
  query,
  setQuery,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  sortBy,
  setSortBy,
  setSelectedBrands,
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
  visibleProducts,
  totalProducts,
  currentPage,
  totalProductPages,
  setCurrentPage,
  cartItems,
  addToCart,
  changeQuantity,
  removeFromCart,
  openProduct,
}) {
  const catalogToolbarShellRef = useRef(null);
  const catalogToolbarRef = useRef(null);
  const [isCatalogMenuOpen, setIsCatalogMenuOpen] = useState(false);
  const [isCatalogToolbarPinned, setIsCatalogToolbarPinned] = useState(false);
  const [catalogToolbarHeight, setCatalogToolbarHeight] = useState(0);
  const [hoveredCategoryId, setHoveredCategoryId] = useState(null);
  const [mobileCategoryId, setMobileCategoryId] = useState(null);
  const [catalogMenuTop, setCatalogMenuTop] = useState(96);

  const catalogCategories = useMemo(() => {
    return categories.filter((category) => category.id !== "all");
  }, [categories]);

  const activeCategory = categories.find(
    (category) => category.id === selectedCategory
  );

  const activeSubcategory = activeCategory?.subcategories?.find(
    (subcategory) => subcategory.id === selectedSubcategory
  );

  const previewCategoryId =
    hoveredCategoryId ||
    (selectedCategory !== "all" ? selectedCategory : catalogCategories[0]?.id);

  const previewCategory = categories.find(
    (category) => category.id === previewCategoryId
  );

  const previewSubcategories = (previewCategory?.subcategories || []).filter(
    (subcategory) => subcategory.active !== false
  );

  const mobileCategory = categories.find(
    (category) => category.id === mobileCategoryId
  );

  const mobileSubcategories = (mobileCategory?.subcategories || []).filter(
    (subcategory) => subcategory.active !== false
  );

  const activeSubcategories = (activeCategory?.subcategories || []).filter(
    (subcategory) => subcategory.active !== false
  );
  const paginationItems = getPaginationItems(currentPage, totalProductPages);

  const fulfillmentCounts = useMemo(() => {
    return products.reduce(
      (result, product) => {
        if (product.active === false) return result;

        if (product.fulfillmentType === "supplier_order") {
          result.supplierOrder += 1;
        } else {
          result.inStock += 1;
        }

        return result;
      },
      {
        inStock: 0,
        supplierOrder: 0,
      }
    );
  }, [products]);

  const supplierFilters = useMemo(() => {
    const suppliersById = new Map();

    products.forEach((product) => {
      if (
        product.active === false ||
        product.fulfillmentType !== "supplier_order" ||
        !product.supplierId
      ) {
        return;
      }

      const current = suppliersById.get(product.supplierId) || {
        id: product.supplierId,
        name: product.supplier?.name || "Постачальник",
        minOrderAmount: Number(product.supplier?.minOrderAmount || 0),
        count: 0,
      };

      current.count += 1;
      suppliersById.set(product.supplierId, current);
    });

    return [...suppliersById.values()].sort((a, b) => {
      return a.name.localeCompare(b.name, "uk");
    });
  }, [products]);

  const catalogScopeProducts = useMemo(() => {
    return products.filter((product) => {
      if (product.active === false) return false;

      const isSupplierOrder = product.fulfillmentType === "supplier_order";

      if (selectedFulfillmentType === "supplier_order") {
        return (
          isSupplierOrder &&
          (!selectedSupplierId ||
            String(product.supplierId || "") === String(selectedSupplierId))
        );
      }

      return !isSupplierOrder;
    });
  }, [products, selectedFulfillmentType, selectedSupplierId]);

  const productCounts = useMemo(() => {
    const categoryCounts = {};
    const subcategoryCounts = {};

    catalogScopeProducts.forEach((product) => {
      if (product.active === false) return;

      if (product.category) {
        categoryCounts[product.category] =
          (categoryCounts[product.category] || 0) + 1;
      }

      if (product.category && product.subcategory) {
        const subcategoryKey = `${product.category}:${product.subcategory}`;
        subcategoryCounts[subcategoryKey] =
          (subcategoryCounts[subcategoryKey] || 0) + 1;
      }
    });

    return { categories: categoryCounts, subcategories: subcategoryCounts };
  }, [catalogScopeProducts]);

  const pageTitle =
    selectedCategory === "all"
      ? "Каталог товарів"
      : activeCategory?.name || "Каталог товарів";

  useEffect(() => {
    setSelectedBrands([]);
  }, [setSelectedBrands]);

  useEffect(() => {
    function updateCatalogToolbarPin() {
      const shell = catalogToolbarShellRef.current;
      const toolbar = catalogToolbarRef.current;

      if (!shell || !toolbar) return;

      const shellTop = shell.getBoundingClientRect().top + window.scrollY;
      const nextToolbarHeight = toolbar.getBoundingClientRect().height;
      const shouldPin = window.scrollY > shellTop - 12;

      setCatalogToolbarHeight(nextToolbarHeight);
      setIsCatalogToolbarPinned(shouldPin);
    }

    updateCatalogToolbarPin();

    window.addEventListener("resize", updateCatalogToolbarPin);
    window.addEventListener("scroll", updateCatalogToolbarPin, {
      passive: true,
    });

    return () => {
      window.removeEventListener("resize", updateCatalogToolbarPin);
      window.removeEventListener("scroll", updateCatalogToolbarPin);
    };
  }, []);

  useEffect(() => {
    if (!isCatalogMenuOpen) return undefined;

    const lockedScrollY = window.scrollY;
    const previousOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousPosition = document.body.style.position;
    const previousTop = document.body.style.top;
    const previousLeft = document.body.style.left;
    const previousRight = document.body.style.right;
    const previousWidth = document.body.style.width;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.classList.add("eg-catalog-open");

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousOverflow;
      document.body.style.position = previousPosition;
      document.body.style.top = previousTop;
      document.body.style.left = previousLeft;
      document.body.style.right = previousRight;
      document.body.style.width = previousWidth;
      document.body.classList.remove("eg-catalog-open");
      window.scrollTo({ top: lockedScrollY, behavior: "auto" });
    };
  }, [isCatalogMenuOpen]);

  useEffect(() => {
    if (!isCatalogMenuOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key !== "Escape") return;

      closeCatalogMenu();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCatalogMenuOpen]);

  useEffect(() => {
    if (!isCatalogMenuOpen) return undefined;

    updateCatalogMenuMetrics();

    window.addEventListener("resize", updateCatalogMenuMetrics);
    window.addEventListener("scroll", updateCatalogMenuMetrics, {
      passive: true,
    });

    return () => {
      window.removeEventListener("resize", updateCatalogMenuMetrics);
      window.removeEventListener("scroll", updateCatalogMenuMetrics);
    };
  }, [isCatalogMenuOpen]);

  function updateCatalogMenuMetrics() {
    const toolbarRect = catalogToolbarRef.current?.getBoundingClientRect();
    const toolbarBottom = toolbarRect?.bottom || 84;
    const nextTop = Math.max(8, Math.round(toolbarBottom + 8));

    setCatalogMenuTop(nextTop);
  }

  function closeCatalogMenu() {
    setIsCatalogMenuOpen(false);
    setHoveredCategoryId(null);
    setMobileCategoryId(null);
  }

  function openCatalogMenu() {
    updateCatalogMenuMetrics();
    setIsCatalogMenuOpen(true);
    setMobileCategoryId(null);
    setHoveredCategoryId(
      selectedCategory !== "all"
        ? selectedCategory
        : catalogCategories[0]?.id || null
    );
  }

  function showCategoryPreview(categoryId) {
    setHoveredCategoryId(categoryId);
  }

  function openMobileCategory(category) {
    const visibleSubcategories = (category.subcategories || []).filter(
      (subcategory) => subcategory.active !== false
    );

    if (visibleSubcategories.length > 0) {
      setMobileCategoryId(category.id);
      return;
    }

    selectCategory(category.id);
  }

  function resetCatalogFilters() {
    setSelectedCategory("all");
    setSelectedSubcategory("all");
    setCurrentPage(1);
    closeCatalogMenu();
  }

  function resetAllFilters() {
    setSelectedCategory("all");
    setSelectedSubcategory("all");
    setQuery("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("default");
    setSelectedBrands([]);
    setSelectedProductTypes([]);
    setSelectedCountries([]);
    setSelectedStockStatuses([]);
    setShowPopularOnly(false);
    setSelectedSupplierId("");
    setCurrentPage(1);
    closeCatalogMenu();
  }

  function selectFulfillmentTab(nextFulfillmentType) {
    setSelectedFulfillmentType(nextFulfillmentType);
    setSelectedSupplierId("");
    setCurrentPage(1);
  }

  function selectSupplierFilter(supplierId) {
    setSelectedSupplierId(supplierId);
    setCurrentPage(1);
  }

  function selectCategory(categoryId) {
    setSelectedCategory(categoryId);
    setSelectedSubcategory("all");
    setCurrentPage(1);
    closeCatalogMenu();
  }

  function selectSubcategory(categoryId, subcategoryId) {
    setSelectedCategory(categoryId);
    setSelectedSubcategory(subcategoryId);
    setCurrentPage(1);
    closeCatalogMenu();
  }

  return (
    <main
      id="catalog"
      className="scroll-mt-24 mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8"
    >
      <section
        ref={catalogToolbarShellRef}
        className="relative z-[85] mb-7 sm:mb-10"
        style={{
          height: isCatalogToolbarPinned
            ? `${catalogToolbarHeight}px`
            : undefined,
        }}
      >
        <div
          ref={catalogToolbarRef}
          className={`eg-catalog-toolbar ${
            isCatalogToolbarPinned ? "eg-catalog-toolbar-pinned" : ""
          }`}
        >
          <div className="eg-glass eg-premium-card rounded-[1.6rem] border border-white/80 bg-white/85 p-2 shadow-lg shadow-emerald-950/5 sm:rounded-[2rem] sm:p-3">
          <div className="grid gap-2 lg:grid-cols-[minmax(230px,330px)_minmax(0,1fr)] lg:items-center">
            <button
              type="button"
              onClick={() =>
                isCatalogMenuOpen ? closeCatalogMenu() : openCatalogMenu()
              }
              aria-expanded={isCatalogMenuOpen}
              aria-controls="catalog-menu-panel"
              className="eg-button eg-sweep flex min-h-12 w-full items-center justify-center gap-2 rounded-[1.25rem] bg-emerald-900 px-4 py-3 text-sm font-black text-white shadow-sm shadow-emerald-900/20 hover:bg-emerald-800 hover:shadow-md hover:shadow-emerald-900/25 sm:min-h-[58px] sm:gap-3 sm:rounded-[1.7rem] sm:px-7 sm:text-base"
            >
              {isCatalogMenuOpen ? <X size={20} /> : <Menu size={21} />}
              <span>Каталог товарів</span>
            </button>

            <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
              <label className="eg-field flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-[1.25rem] border border-stone-100 bg-white/90 px-4 text-stone-500 shadow-sm shadow-stone-900/[0.03] backdrop-blur focus-within:border-emerald-700 sm:min-h-[58px] sm:rounded-[1.7rem] sm:px-5">
                <Search size={20} className="shrink-0 text-emerald-900/70" />

                <input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Пошук"
                  className="min-w-0 flex-1 bg-transparent text-sm text-stone-950 outline-none placeholder:text-stone-400 sm:text-base"
                />
              </label>

              <div className="min-w-0 sm:shrink-0">
                <select
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="eg-field min-h-12 w-full rounded-[1.15rem] border border-stone-100 bg-white/90 px-4 text-sm font-semibold text-stone-800 outline-none shadow-sm shadow-stone-900/[0.03] backdrop-blur focus:border-emerald-700 sm:min-h-[58px] sm:w-auto sm:min-w-[220px] sm:rounded-[1.35rem] sm:px-5 sm:text-base"
                >
                  <option value="default">За замовчуванням</option>
                  <option value="popular">Популярні</option>
                  <option value="price-asc">Спочатку дешевші</option>
                  <option value="price-desc">Спочатку дорожчі</option>
                  <option value="name-asc">За назвою</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        </div>

        {isCatalogMenuOpen && (
          <>
            <div className="fixed inset-0 z-[120] overflow-hidden bg-stone-50 text-stone-950 md:hidden">
              <div className="flex h-16 items-center justify-between border-b border-emerald-100/70 bg-white/95 px-4 shadow-sm shadow-emerald-950/5 backdrop-blur-xl">
                <BrandLogo
                  size="sm"
                  showText={false}
                  animated={false}
                  className="gap-0"
                />

                <button
                  type="button"
                  onClick={() =>
                    mobileCategory ? setMobileCategoryId(null) : closeCatalogMenu()
                  }
                  className="eg-button min-h-10 min-w-[120px] rounded-full bg-emerald-900 px-5 text-sm font-black text-white shadow-sm shadow-emerald-900/20 hover:bg-emerald-800"
                >
                  Каталог
                </button>

                <div className="h-11 w-11 shrink-0" aria-hidden="true" />
              </div>

              {mobileCategory ? (
                <div className="flex h-[calc(100dvh-4rem)] min-h-0 flex-col">
                  <div className="flex min-h-14 shrink-0 items-center gap-3 border-b border-emerald-100/70 bg-white px-5 text-left">
                    <button
                      type="button"
                      onClick={() => setMobileCategoryId(null)}
                      aria-label="Назад до категорій"
                      className="eg-icon-button grid h-10 w-10 shrink-0 place-items-center rounded-xl text-emerald-950 hover:bg-emerald-50"
                    >
                      <ChevronLeft size={22} />
                    </button>

                    <button
                      type="button"
                      onClick={() => selectCategory(mobileCategory.id)}
                      className="min-w-0 text-left text-base font-black uppercase tracking-normal text-emerald-950"
                    >
                      {mobileCategory.name}
                    </button>
                  </div>

                  <div className="eg-catalog-mobile-scroll modal-scrollbar min-h-0 flex-1 overflow-y-auto bg-stone-50 py-2">
                    <button
                      type="button"
                      onClick={() => selectCategory(mobileCategory.id)}
                      className="flex min-h-14 w-full items-center border-b border-stone-100/80 bg-white px-7 text-left text-sm font-black uppercase tracking-wide text-emerald-950 hover:bg-emerald-50"
                    >
                      Усі товари категорії
                    </button>

                    {mobileSubcategories.map((subcategory) => (
                      <button
                        key={subcategory.id}
                        type="button"
                        onClick={() =>
                          selectSubcategory(mobileCategory.id, subcategory.id)
                        }
                        className="flex min-h-14 w-full items-center border-b border-stone-100/80 bg-white px-7 text-left text-sm font-semibold uppercase tracking-wide text-stone-950 hover:bg-emerald-50 hover:text-emerald-950"
                      >
                        {subcategory.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="eg-catalog-mobile-scroll modal-scrollbar h-[calc(100dvh-4rem)] overflow-y-auto bg-white px-5 py-4">
                  <button
                    type="button"
                    onClick={resetCatalogFilters}
                    className="flex min-h-14 w-full items-center rounded-2xl px-4 text-left text-base font-black uppercase text-emerald-950 hover:bg-emerald-50"
                  >
                    <span className="min-w-0 flex-1">Усі товари</span>
                  </button>

                  {catalogCategories.map((category) => {
                    const visibleSubcategories = (
                      category.subcategories || []
                    ).filter((subcategory) => subcategory.active !== false);
                    const hasSubcategories = visibleSubcategories.length > 0;

                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => openMobileCategory(category)}
                        className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 text-left text-base font-semibold uppercase text-stone-800 hover:bg-emerald-50 hover:text-emerald-950"
                      >
                        <span className="min-w-0 flex-1 truncate leading-5">
                          {category.name}
                        </span>

                        {hasSubcategories && (
                          <ChevronRight
                            size={21}
                            className="shrink-0 text-emerald-800/70"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div
              className="eg-overlay fixed inset-0 z-[80] hidden bg-stone-950/35 backdrop-blur-[6px] md:block"
              style={{ top: `${Math.max(catalogMenuTop - 8, 0)}px` }}
              onClick={closeCatalogMenu}
            />

            <div
              id="catalog-menu-panel"
              className="eg-menu eg-glass fixed inset-x-3 z-[90] mx-auto hidden max-w-7xl overflow-hidden rounded-[1.6rem] border border-white/80 bg-white/95 shadow-2xl shadow-emerald-950/20 sm:inset-x-4 sm:rounded-[2rem] md:block"
              style={{
                top: `${catalogMenuTop}px`,
                height: `calc(100dvh - ${catalogMenuTop + 12}px)`,
              }}
            >
              <div className="eg-catalog-sheet-grid">
                <div className="flex min-h-0 flex-col border-b border-stone-100 bg-stone-50/90 p-3 backdrop-blur sm:p-5 lg:border-b-0 lg:border-r">
                  <div className="mb-3 flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={resetCatalogFilters}
                      className={`eg-button flex min-h-12 min-w-0 flex-1 items-center justify-between rounded-[1.05rem] px-4 text-left text-sm font-black sm:min-h-[58px] sm:rounded-[1.45rem] sm:px-5 sm:text-base ${
                        selectedCategory === "all"
                          ? "bg-emerald-900 text-white shadow-lg shadow-emerald-900/20"
                          : "bg-white text-stone-950 shadow-sm shadow-stone-900/[0.04] hover:bg-emerald-50"
                      }`}
                    >
                      <span>Усі товари</span>
                      {selectedCategory === "all" && <span>✓</span>}
                    </button>

                    <button
                      type="button"
                      onClick={closeCatalogMenu}
                      aria-label="Закрити каталог"
                      className="eg-icon-button grid h-12 w-12 shrink-0 place-items-center rounded-[1.05rem] bg-white text-emerald-900 shadow-sm ring-1 ring-stone-100 hover:bg-emerald-50 sm:h-[58px] sm:w-[58px] sm:rounded-[1.45rem]"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="modal-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1">
                    {catalogCategories.map((category) => {
                      const isPreviewed = previewCategoryId === category.id;
                      const categoryCount =
                        productCounts.categories[category.id] || 0;
                      const hasSubcategories =
                        (category.subcategories || []).filter(
                          (subcategory) => subcategory.active !== false
                        ).length > 0;

                      return (
                        <button
                          key={category.id}
                          type="button"
                          onMouseEnter={() =>
                            showCategoryPreview(category.id)
                          }
                          onFocus={() => showCategoryPreview(category.id)}
                          onClick={() => selectCategory(category.id)}
                          className={`eg-button flex min-h-[58px] w-full items-center justify-between rounded-[1.05rem] px-4 py-3 text-left sm:rounded-[1.35rem] sm:px-5 ${
                            isPreviewed
                              ? "bg-emerald-100 text-emerald-950 shadow-sm shadow-emerald-900/5"
                              : "text-stone-900 hover:bg-white"
                          }`}
                        >
                          <span className="min-w-0 flex-1 truncate whitespace-nowrap text-sm font-black uppercase leading-5 tracking-wide">
                            {category.name}
                          </span>

                          <span className="ml-2 flex shrink-0 items-center gap-2 sm:ml-3">
                            <span className="hidden rounded-full bg-white/70 px-2 py-1 text-[10px] font-black text-stone-500 sm:inline">
                              {categoryCount}
                            </span>

                            {hasSubcategories && (
                              <ChevronRight
                                size={18}
                                className="text-stone-400"
                              />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="modal-scrollbar min-h-0 overflow-y-auto bg-white/95 p-4 backdrop-blur sm:p-6 lg:p-7">
                  {previewCategory ? (
                    <>
                      <div className="mb-5 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.22em] text-stone-400">
                            Підкатегорії
                          </p>

                          <h2 className="mt-1 text-2xl font-black text-stone-950 sm:mt-2 sm:text-3xl">
                            {previewCategory.name}
                          </h2>

                          <p className="mt-1 text-sm font-semibold text-stone-500">
                            {productCounts.categories[previewCategory.id] || 0}{" "}
                            {getProductWord(
                              productCounts.categories[previewCategory.id] || 0
                            )}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => selectCategory(previewCategory.id)}
                          className="eg-button min-h-12 rounded-[1.15rem] bg-stone-50 px-5 py-3 text-sm font-black text-stone-950 shadow-sm ring-1 ring-stone-100 hover:bg-emerald-50 sm:rounded-[1.35rem]"
                        >
                          Усі товари категорії
                        </button>
                      </div>

                      {previewSubcategories.length > 0 ? (
                        <div className="eg-stagger grid gap-3 sm:grid-cols-2 lg:gap-4 xl:grid-cols-3">
                          {previewSubcategories.map((subcategory) => {
                            const isActive =
                              selectedCategory === previewCategory.id &&
                              selectedSubcategory === subcategory.id;
                            const subcategoryCount =
                              productCounts.subcategories[
                                `${previewCategory.id}:${subcategory.id}`
                              ] || 0;

                            return (
                              <button
                                key={subcategory.id}
                                type="button"
                                onClick={() =>
                                  selectSubcategory(
                                    previewCategory.id,
                                    subcategory.id
                                  )
                                }
                                className={`eg-button eg-premium-card flex min-h-[74px] items-center justify-between gap-3 rounded-[1.35rem] px-5 py-4 text-left text-sm font-black uppercase tracking-wide sm:min-h-[78px] ${
                                  isActive
                                    ? "bg-emerald-900 text-white shadow-lg shadow-emerald-900/20"
                                    : "bg-stone-50 text-stone-950 shadow-sm ring-1 ring-stone-100 hover:bg-emerald-50"
                                }`}
                              >
                                <span className="min-w-0 leading-5">
                                  {subcategory.name}
                                </span>

                                <span
                                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${
                                    isActive
                                      ? "bg-white/15 text-white"
                                      : "bg-white text-stone-500"
                                  }`}
                                >
                                  {subcategoryCount}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="eg-panel flex min-h-[220px] items-center justify-center rounded-[1.6rem] border border-dashed border-stone-200 bg-stone-50 px-6 text-center sm:min-h-[260px] sm:px-8">
                          <div>
                            <p className="text-lg font-black text-stone-950">
                              У цій категорії поки немає підкатегорій
                            </p>

                            <p className="mt-2 text-sm leading-6 text-stone-500">
                              Натисніть “Усі товари категорії”, щоб переглянути
                              товари з цього розділу.
                            </p>

                            <button
                              type="button"
                              onClick={() => selectCategory(previewCategory.id)}
                              className="eg-button mt-5 rounded-[1.1rem] bg-emerald-900 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 hover:bg-emerald-800"
                            >
                              Показати товари
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center text-stone-500">
                      Оберіть категорію
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="mb-6 sm:mb-8">
        <div className="eg-glass eg-premium-card grid gap-2 rounded-[1.35rem] border border-white/80 bg-white/90 p-1.5 shadow-lg shadow-emerald-950/5 sm:grid-cols-2 sm:rounded-[1.7rem] sm:p-2">
          <button
            type="button"
            onClick={() => selectFulfillmentTab("in_stock")}
            className={`eg-button min-h-[62px] rounded-[1.05rem] border px-4 text-left transition sm:rounded-[1.35rem] sm:px-5 ${
              selectedFulfillmentType === "in_stock"
                ? "border-emerald-900 bg-emerald-900 text-white shadow-lg shadow-emerald-900/20"
                : "border-stone-100 bg-white/75 text-stone-800 hover:border-emerald-100 hover:bg-emerald-50 hover:text-emerald-950"
            }`}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="font-black">Є в наявності</span>
              <span
                className={`grid min-h-8 min-w-8 shrink-0 place-items-center rounded-full px-2.5 text-xs font-black ${
                  selectedFulfillmentType === "in_stock"
                    ? "bg-white/18 text-white ring-1 ring-white/20"
                    : "bg-emerald-100 text-emerald-950"
                }`}
              >
                {fulfillmentCounts.inStock}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => selectFulfillmentTab("supplier_order")}
            className={`eg-button min-h-[62px] rounded-[1.05rem] border px-4 text-left transition sm:rounded-[1.35rem] sm:px-5 ${
              selectedFulfillmentType === "supplier_order"
                ? "border-emerald-900 bg-emerald-900 text-white shadow-lg shadow-emerald-900/20"
                : "border-stone-100 bg-white/75 text-stone-800 hover:border-emerald-100 hover:bg-emerald-50 hover:text-emerald-950"
            }`}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="font-black">Під замовлення</span>
              <span
                className={`grid min-h-8 min-w-8 shrink-0 place-items-center rounded-full px-2.5 text-xs font-black ${
                  selectedFulfillmentType === "supplier_order"
                    ? "bg-white/18 text-white ring-1 ring-white/20"
                    : "bg-emerald-100 text-emerald-950"
                }`}
              >
                {fulfillmentCounts.supplierOrder}
              </span>
            </span>
          </button>
        </div>

        {selectedFulfillmentType === "supplier_order" &&
          supplierFilters.length > 0 && (
            <div className="mt-3 min-w-0 rounded-[1.35rem] border border-emerald-100/80 bg-emerald-50/55 p-2 shadow-inner shadow-emerald-950/[0.03]">
              <div className="modal-scrollbar flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => selectSupplierFilter("")}
                  className={`eg-button flex min-h-[58px] shrink-0 items-center rounded-[1.05rem] px-4 py-3 text-sm font-black shadow-sm ${
                    !selectedSupplierId
                      ? "bg-emerald-900 text-white shadow-lg shadow-emerald-900/20"
                      : "bg-white text-stone-800 ring-1 ring-emerald-100 hover:bg-emerald-50 hover:text-emerald-950"
                  }`}
                >
                  Усі постачальники
                </button>

                {supplierFilters.map((supplier) => (
                  <button
                    key={supplier.id}
                    type="button"
                    onClick={() => selectSupplierFilter(supplier.id)}
                    className={`eg-button min-h-[58px] min-w-[178px] shrink-0 rounded-[1.05rem] px-4 py-3 text-left text-sm shadow-sm ${
                      selectedSupplierId === supplier.id
                        ? "bg-emerald-900 text-white shadow-lg shadow-emerald-900/20"
                        : "bg-white text-stone-800 ring-1 ring-emerald-100 hover:bg-emerald-50 hover:text-emerald-950"
                    }`}
                  >
                    <span className="block truncate font-black">{supplier.name}</span>
                    <span
                      className={`mt-0.5 block text-xs font-semibold ${
                        selectedSupplierId === supplier.id
                          ? "text-emerald-100"
                          : "text-stone-500"
                      }`}
                    >
                      Мінімум {formatUAH(supplier.minOrderAmount)} ·{" "}
                      {supplier.count} {getProductWord(supplier.count)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
      </section>

      <section className="mb-8 sm:mb-10">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-stone-500">
          <button
            type="button"
            onClick={resetCatalogFilters}
            className="eg-button rounded-xl px-1 hover:text-emerald-800"
          >
            Головна
          </button>

          {selectedCategory !== "all" && (
            <>
              <span>›</span>
              <button
                type="button"
                onClick={() => selectCategory(activeCategory.id)}
                className="eg-button rounded-xl px-1 font-semibold text-stone-700 hover:text-emerald-800"
              >
                {activeCategory?.name}
              </button>
            </>
          )}

          {selectedSubcategory !== "all" && activeSubcategory && (
            <>
              <span>›</span>
              <span className="font-semibold text-stone-950">
                {activeSubcategory.name}
              </span>
            </>
          )}
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center">
          <h1 className="text-3xl font-black uppercase tracking-wide text-stone-950 sm:text-4xl">
            {pageTitle}
          </h1>

          <span className="w-fit rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-950">
            {totalProducts} товарів
          </span>
        </div>

        {selectedCategory !== "all" && activeSubcategories.length > 0 && (
          <div className="eg-stagger mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:max-w-5xl">
            {selectedSubcategory !== "all" && (
              <button
                type="button"
                onClick={() => {
                  setSelectedSubcategory("all");
                  setCurrentPage(1);
                }}
                className="eg-button min-h-12 rounded-[22px] bg-emerald-900 px-5 text-left text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-emerald-900/15 hover:bg-emerald-800"
              >
                Усі товари категорії
              </button>
            )}

            {activeSubcategories.map((subcategory) => (
              <button
                key={subcategory.id}
                type="button"
                onClick={() => {
                  setSelectedSubcategory(subcategory.id);
                  setCurrentPage(1);
                }}
                className={`eg-button min-h-12 rounded-[22px] px-5 text-left text-sm font-black uppercase tracking-wide shadow-sm ring-1 ${
                  selectedSubcategory === subcategory.id
                    ? "bg-emerald-900 text-white ring-emerald-900 shadow-lg shadow-emerald-900/15"
                    : "bg-white/90 text-stone-950 ring-stone-100 hover:bg-emerald-50 hover:text-emerald-950 hover:ring-emerald-100"
                }`}
              >
                {subcategory.name}
              </button>
            ))}
          </div>
        )}

        {(selectedCategory !== "all" || selectedSubcategory !== "all") && (
          <button
            type="button"
            onClick={resetCatalogFilters}
            className="eg-button mb-6 rounded-xl text-sm font-black text-emerald-800 hover:text-emerald-950"
          >
            Скинути категорію
          </button>
        )}
      </section>

      <section className="min-w-0">
          {visibleProducts.length > 0 ? (
            <div className="eg-stagger grid grid-cols-1 gap-3 min-[430px]:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  categories={categories}
                  cartItems={cartItems}
                  addToCart={addToCart}
                  changeQuantity={changeQuantity}
                  removeFromCart={removeFromCart}
                  openProduct={openProduct}
                />
              ))}
            </div>
          ) : (
            <div className="eg-panel rounded-[2rem] border border-dashed border-stone-200 bg-white p-10 text-center shadow-sm">
              <p className="text-xl font-black text-stone-950">
                Товарів не знайдено
              </p>

              <p className="mt-2 text-sm leading-6 text-stone-500">
                Спробуйте змінити пошук або категорію.
              </p>

              <button
                type="button"
                onClick={resetAllFilters}
                className="eg-button eg-sweep mt-5 rounded-2xl bg-emerald-900 px-6 py-3 font-bold text-white hover:bg-emerald-800 hover:shadow-md hover:shadow-emerald-900/20"
              >
                Показати всі товари
              </button>
            </div>
          )}

          {totalProductPages > 1 && (
            <nav
              className="mt-8 flex flex-col items-center justify-center gap-3"
              aria-label="Пагінація товарів"
            >
              <p className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-emerald-900">
                Сторінка {currentPage} з {totalProductPages}
              </p>

              <div className="flex max-w-full items-center justify-center gap-1.5 rounded-[22px] bg-white/85 p-1.5 shadow-sm ring-1 ring-stone-200/70">
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  aria-label="Попередня сторінка"
                  className="eg-button grid h-10 w-10 place-items-center rounded-2xl text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ChevronLeft size={18} />
                </button>

                {paginationItems.map((item) => {
                  if (typeof item === "string") {
                    return (
                      <span
                        key={item}
                        className="grid h-10 w-8 place-items-center text-stone-400"
                        aria-hidden="true"
                      >
                        <MoreHorizontal size={18} />
                      </span>
                    );
                  }

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCurrentPage(item)}
                      aria-current={currentPage === item ? "page" : undefined}
                      className={`eg-button h-10 min-w-10 rounded-2xl px-3 text-sm font-black ${
                        currentPage === item
                          ? "bg-emerald-900 text-white shadow-lg shadow-emerald-900/20"
                          : "text-stone-700 hover:bg-stone-100"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage(Math.min(totalProductPages, currentPage + 1))
                  }
                  disabled={currentPage === totalProductPages}
                  aria-label="Наступна сторінка"
                  className="eg-button grid h-10 w-10 place-items-center rounded-2xl text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </nav>
          )}
      </section>
    </main>
  );
}
