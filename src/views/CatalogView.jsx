import {
  ArrowDownUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  Menu,
  MoreHorizontal,
  Search,
  Truck,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import BrandLogo from "../components/BrandLogo.jsx";
import ProductCard from "../components/ProductCard.jsx";
import logoEvergreen from "../img/logo_evergreen.webp";
import { formatUAH } from "../utils/formatUAH.js";

function getPaginationItems(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "end-ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "start-ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "start-ellipsis",
    currentPage - 2,
    currentPage - 1,
    currentPage,
    currentPage + 1,
    currentPage + 2,
    "end-ellipsis",
    totalPages,
  ];
}

function getPaginationJumpTarget(item, currentPage, totalPages) {
  const pageStep = 5;

  if (item === "start-ellipsis") {
    return Math.max(1, currentPage - pageStep);
  }

  return Math.min(totalPages, currentPage + pageStep);
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

const SORT_OPTIONS = [
  { value: "default", label: "За замовчуванням" },
  { value: "popular", label: "Популярні" },
  { value: "price-asc", label: "Спочатку дешевші" },
  { value: "price-desc", label: "Спочатку дорожчі" },
  { value: "name-asc", label: "За назвою" },
];

function SupplierTileGrid({ suppliers = [], onSelect }) {
  if (!suppliers.length) {
    return (
      <div className="eg-panel rounded-[2rem] border border-dashed border-stone-200 bg-white p-10 text-center shadow-sm">
        <p className="text-xl font-black text-stone-950">
          Постачальників поки немає
        </p>

        <p className="mt-2 text-sm leading-6 text-stone-500">
          Коли зʼявляться товари під замовлення, тут будуть плитки постачальників.
        </p>
      </div>
    );
  }

  return (
    <div className="eg-catalog-results grid grid-cols-1 gap-3 min-[520px]:grid-cols-2 lg:grid-cols-3">
      {suppliers.map((supplier) => (
        <button
          key={supplier.id}
          type="button"
          onClick={() => onSelect?.(supplier.id)}
          className="eg-button eg-premium-card min-h-[168px] rounded-[1.6rem] border border-emerald-100 bg-white/92 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/70 hover:shadow-lg hover:shadow-emerald-900/10"
        >
          <span className="flex items-start justify-between gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[1.05rem] bg-blue-50 text-blue-800 ring-1 ring-blue-100">
              <Truck size={23} />
            </span>

            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-950">
              {supplier.count} {getProductWord(supplier.count)}
            </span>
          </span>

          <span className="mt-5 block text-xl font-black leading-tight text-stone-950">
            {supplier.name}
          </span>

          <span className="mt-2 block text-sm font-semibold leading-6 text-stone-600">
            Мінімальне замовлення:{" "}
            <span className="font-black text-stone-950">
              {formatUAH(supplier.minOrderAmount)}
            </span>
          </span>

          <span className="mt-4 inline-flex min-h-10 items-center rounded-2xl bg-emerald-900 px-4 text-sm font-black text-white">
            Відкрити каталог
          </span>
        </button>
      ))}
    </div>
  );
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
  isMobileSearchOpen = false,
  setIsMobileSearchOpen = () => {},
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
  const catalogRootRef = useRef(null);
  const catalogToolbarShellRef = useRef(null);
  const catalogToolbarRef = useRef(null);
  const desktopSortMenuRef = useRef(null);
  const mobileSortMenuRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const [isCatalogMenuOpen, setIsCatalogMenuOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isCatalogToolbarPinned, setIsCatalogToolbarPinned] = useState(false);
  const [catalogToolbarHeight, setCatalogToolbarHeight] = useState(0);
  const [hoveredCategoryId, setHoveredCategoryId] = useState(null);
  const [mobileCategoryId, setMobileCategoryId] = useState(null);
  const [catalogMenuTop, setCatalogMenuTop] = useState(96);

  const catalogScopeProducts = useMemo(() => {
    return products.filter((product) => {
      if (product.active === false) return false;

      const isSupplierOrder = product.fulfillmentType === "supplier_order";

      if (selectedFulfillmentType === "supplier_order") {
        return (
          isSupplierOrder &&
          selectedSupplierId &&
          String(product.supplierId || "") === String(selectedSupplierId)
        );
      }

      return !isSupplierOrder;
    });
  }, [products, selectedFulfillmentType, selectedSupplierId]);

  const catalogCategoryIds = useMemo(() => {
    return new Set(
      catalogScopeProducts
        .map((product) => product.category)
        .filter(Boolean)
    );
  }, [catalogScopeProducts]);

  const catalogCategories = useMemo(() => {
    return categories.filter((category) => {
      return category.id !== "all" && catalogCategoryIds.has(category.id);
    });
  }, [categories, catalogCategoryIds]);

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
    (subcategory) =>
      subcategory.active !== false &&
      catalogScopeProducts.some((product) => {
        return (
          product.category === previewCategory?.id &&
          product.subcategory === subcategory.id
        );
      })
  );

  const mobileCategory = categories.find(
    (category) => category.id === mobileCategoryId
  );

  const mobileSubcategories = (mobileCategory?.subcategories || []).filter(
    (subcategory) =>
      subcategory.active !== false &&
      catalogScopeProducts.some((product) => {
        return (
          product.category === mobileCategory?.id &&
          product.subcategory === subcategory.id
        );
      })
  );

  const activeSubcategories = (activeCategory?.subcategories || []).filter(
    (subcategory) =>
      subcategory.active !== false &&
      catalogScopeProducts.some((product) => {
        return (
          product.category === activeCategory?.id &&
          product.subcategory === subcategory.id
        );
      })
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

  const mobileSearchResults = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return [];

    return catalogScopeProducts
      .filter((product) => {
        const searchableText = [
          product.name,
          product.brand,
          product.productType,
          product.countryOfOrigin,
          product.description,
          product.details,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedQuery);
      })
      .slice(0, 6);
  }, [catalogScopeProducts, query]);

  const selectedSupplier = supplierFilters.find((supplier) => {
    return String(supplier.id) === String(selectedSupplierId);
  });

  const isSupplierSelectionMode =
    selectedFulfillmentType === "supplier_order" && !selectedSupplierId;

  const pageTitle = isSupplierSelectionMode
    ? "Постачальники"
    : selectedSupplier
      ? selectedSupplier.name
      : selectedCategory === "all"
        ? "Каталог товарів"
        : activeCategory?.name || "Каталог товарів";

  const pageCountLabel = isSupplierSelectionMode
    ? `${supplierFilters.length} постачальників`
    : `${totalProducts} ${getProductWord(totalProducts)}`;

  const selectedSortOption =
    SORT_OPTIONS.find((option) => option.value === sortBy) || SORT_OPTIONS[0];

  const catalogResultsKey = [
    selectedFulfillmentType,
    selectedSupplierId,
    selectedCategory,
    selectedSubcategory,
    query,
    sortBy,
    currentPage,
    visibleProducts.map((product) => product.id).join("-"),
  ].join("|");

  useEffect(() => {
    setSelectedBrands([]);
  }, [setSelectedBrands]);

  useEffect(() => {
    let animationFrameId = 0;
    let lastToolbarHeight = 0;
    let lastPinnedState = false;
    const desktopQuery = window.matchMedia("(min-width: 768px)");

    function applyCatalogToolbarPin() {
      animationFrameId = 0;

      if (!desktopQuery.matches) {
        if (lastToolbarHeight !== 0) {
          lastToolbarHeight = 0;
          setCatalogToolbarHeight(0);
        }

        if (lastPinnedState) {
          lastPinnedState = false;
          setIsCatalogToolbarPinned(false);
        }

        return;
      }

      const shell = catalogToolbarShellRef.current;
      const toolbar = catalogToolbarRef.current;

      if (!shell || !toolbar) return;

      const shellTop = shell.getBoundingClientRect().top + window.scrollY;
      const nextToolbarHeight = toolbar.getBoundingClientRect().height;
      const shouldPin = window.scrollY > shellTop - 12;

      if (Math.abs(nextToolbarHeight - lastToolbarHeight) > 1) {
        lastToolbarHeight = nextToolbarHeight;
        setCatalogToolbarHeight(nextToolbarHeight);
      }

      if (shouldPin !== lastPinnedState) {
        lastPinnedState = shouldPin;
        setIsCatalogToolbarPinned(shouldPin);
      }
    }

    function scheduleCatalogToolbarPin() {
      if (animationFrameId) return;
      animationFrameId = window.requestAnimationFrame(applyCatalogToolbarPin);
    }

    scheduleCatalogToolbarPin();

    window.addEventListener("resize", scheduleCatalogToolbarPin);
    window.addEventListener("scroll", scheduleCatalogToolbarPin, {
      passive: true,
    });
    if (desktopQuery.addEventListener) {
      desktopQuery.addEventListener("change", scheduleCatalogToolbarPin);
    } else {
      desktopQuery.addListener(scheduleCatalogToolbarPin);
    }

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }

      window.removeEventListener("resize", scheduleCatalogToolbarPin);
      window.removeEventListener("scroll", scheduleCatalogToolbarPin);
      if (desktopQuery.removeEventListener) {
        desktopQuery.removeEventListener("change", scheduleCatalogToolbarPin);
      } else {
        desktopQuery.removeListener(scheduleCatalogToolbarPin);
      }
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
    if (!isMobileSearchOpen) return undefined;

    if (isCatalogMenuOpen) {
      closeCatalogMenu();
    }

    const lockedScrollY = window.scrollY;
    const previousOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousPosition = document.body.style.position;
    const previousTop = document.body.style.top;
    const previousLeft = document.body.style.left;
    const previousRight = document.body.style.right;
    const previousWidth = document.body.style.width;
    const focusTimeout = window.setTimeout(() => {
      mobileSearchInputRef.current?.focus();
    }, 220);

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsMobileSearchOpen(false);
      }
    }

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    document.body.classList.add("eg-mobile-search-open");
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimeout);
      window.removeEventListener("keydown", handleKeyDown);
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousOverflow;
      document.body.style.position = previousPosition;
      document.body.style.top = previousTop;
      document.body.style.left = previousLeft;
      document.body.style.right = previousRight;
      document.body.style.width = previousWidth;
      document.body.classList.remove("eg-mobile-search-open");
      window.scrollTo({ top: lockedScrollY, behavior: "auto" });
    };
  }, [isCatalogMenuOpen, isMobileSearchOpen, setIsMobileSearchOpen]);

  useEffect(() => {
    if (!isSortMenuOpen) return undefined;

    function handlePointerDown(event) {
      if (desktopSortMenuRef.current?.contains(event.target)) return;
      if (mobileSortMenuRef.current?.contains(event.target)) return;

      setIsSortMenuOpen(false);
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsSortMenuOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSortMenuOpen]);

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

  useEffect(() => {
    function handleOpenCatalogMenu() {
      setIsMobileSearchOpen(false);
      openCatalogMenu();
    }

    window.addEventListener("eg-open-catalog-menu", handleOpenCatalogMenu);

    return () => {
      window.removeEventListener("eg-open-catalog-menu", handleOpenCatalogMenu);
    };
  }, [catalogCategories, selectedCategory, setIsMobileSearchOpen]);

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
    setSelectedCategory("all");
    setSelectedSubcategory("all");
    setCurrentPage(1);
  }

  function selectSupplierFilter(supplierId) {
    setSelectedSupplierId(supplierId);
    setSelectedCategory("all");
    setSelectedSubcategory("all");
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

  function selectSortOption(value) {
    setSortBy(value);
    setCurrentPage(1);
    setIsSortMenuOpen(false);
  }

  function scrollCatalogToTop() {
    const catalogRoot = catalogRootRef.current;

    if (!catalogRoot) return;

    const headerOffsetValue = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue("--eg-header-offset");
    const currentHeaderOffset = Number.parseFloat(headerOffsetValue) || 0;
    const headerHeight =
      document
        .querySelector(".eg-site-header")
        ?.getBoundingClientRect().height || 0;
    const topOffset = Math.max(currentHeaderOffset, headerHeight) + 12;
    const catalogTop = catalogRoot.getBoundingClientRect().top + window.scrollY;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    window.scrollTo({
      top: Math.max(0, catalogTop - topOffset),
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }

  function changeProductPage(nextPage) {
    const normalizedPage = Math.min(totalProductPages, Math.max(1, nextPage));

    if (normalizedPage === currentPage) return;

    setCurrentPage(normalizedPage);
    window.requestAnimationFrame(scrollCatalogToTop);
  }

  return (
    <main
      ref={catalogRootRef}
      id="catalog"
      className="scroll-mt-24 mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-10 lg:px-8"
    >
      <section
        ref={catalogToolbarShellRef}
        className="relative z-[85] mb-0 md:mb-10"
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
          <div className="eg-glass eg-premium-card eg-toolbar-card hidden rounded-[1.6rem] border border-white/80 bg-white/85 p-2 shadow-lg shadow-emerald-950/5 sm:rounded-[2rem] sm:p-3 md:block">
          <div className="grid gap-2 lg:grid-cols-[minmax(230px,330px)_minmax(0,1fr)] lg:items-center">
            <button
              type="button"
              onClick={() =>
                isCatalogMenuOpen ? closeCatalogMenu() : openCatalogMenu()
              }
              aria-expanded={isCatalogMenuOpen}
              aria-controls="catalog-menu-panel"
              className="eg-button eg-sweep hidden min-h-[58px] w-full items-center justify-center gap-3 rounded-[1.7rem] bg-emerald-900 px-7 py-3 text-base font-black text-white shadow-sm shadow-emerald-900/20 hover:bg-emerald-800 hover:shadow-md hover:shadow-emerald-900/25 md:flex"
            >
              {isCatalogMenuOpen ? <X size={20} /> : <Menu size={21} />}
              <span className="md:hidden">Каталог</span>
              <span className="hidden md:inline">Каталог товарів</span>
            </button>

            <div className="flex min-w-0 flex-col gap-2 md:flex-row">
              <label className="eg-field hidden min-h-12 min-w-0 flex-1 items-center gap-3 rounded-[1.25rem] border border-stone-100 bg-white/90 px-4 text-stone-500 shadow-sm shadow-stone-900/[0.03] backdrop-blur focus-within:border-emerald-700 md:flex md:min-h-[58px] md:rounded-[1.7rem] md:px-5">
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

              <div
                ref={desktopSortMenuRef}
                className="relative min-w-0 md:shrink-0"
              >
                <button
                  type="button"
                  onClick={() => setIsSortMenuOpen((current) => !current)}
                  aria-haspopup="listbox"
                  aria-expanded={isSortMenuOpen}
                  className={`eg-field flex min-h-12 w-full items-center justify-between gap-4 rounded-[1.15rem] border bg-white/92 px-4 text-left text-sm font-semibold text-stone-800 outline-none shadow-sm shadow-stone-900/[0.03] backdrop-blur md:min-h-[58px] md:w-auto md:min-w-[240px] md:rounded-[1.35rem] md:px-5 md:text-base ${
                    isSortMenuOpen
                      ? "border-emerald-700 shadow-lg shadow-emerald-950/10 ring-4 ring-emerald-100/70"
                      : "border-stone-100 hover:border-emerald-200 hover:bg-white"
                  }`}
                >
                  <span className="truncate">{selectedSortOption.label}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-emerald-900 transition-transform duration-200 ${
                      isSortMenuOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isSortMenuOpen && (
                  <div
                    className="eg-sort-menu absolute right-0 top-full z-[95] mt-2 w-full min-w-[240px] overflow-hidden rounded-[1.35rem] border border-emerald-100 bg-white/96 p-1.5 shadow-2xl shadow-emerald-950/14 ring-1 ring-white/80 backdrop-blur-2xl"
                    role="listbox"
                    aria-label="Сортування товарів"
                  >
                    {SORT_OPTIONS.map((option) => {
                      const isSelected = option.value === sortBy;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => selectSortOption(option.value)}
                          role="option"
                          aria-selected={isSelected}
                          className={`eg-button flex min-h-11 w-full items-center justify-between gap-3 rounded-[1rem] px-4 text-left text-sm font-black sm:text-[15px] ${
                            isSelected
                              ? "bg-emerald-900 text-white shadow-lg shadow-emerald-900/18"
                              : "text-stone-800 hover:bg-emerald-50 hover:text-emerald-950"
                          }`}
                        >
                          <span className="truncate">{option.label}</span>
                          {isSelected && (
                            <Check className="h-4 w-4 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        </div>

        {isMobileSearchOpen && (
          <>
            <div
              className="eg-mobile-search-backdrop fixed inset-x-0 z-[100] bg-stone-50/95 backdrop-blur-[6px] md:hidden"
              style={{
                top: "var(--eg-header-offset, 0px)",
                bottom: "max(5.75rem, calc(env(safe-area-inset-bottom) + 5.75rem))",
              }}
              onClick={() => setIsMobileSearchOpen(false)}
            />

            <aside
              className="eg-mobile-search-panel fixed inset-x-4 z-[120] mx-auto flex max-w-[500px] flex-col overflow-hidden rounded-[1.45rem] border border-emerald-100/80 border-t-2 border-t-emerald-700 bg-white/96 px-3.5 pb-3.5 pt-3.5 text-stone-950 shadow-[0_18px_54px_rgba(20,83,45,0.16)] backdrop-blur md:hidden"
              style={{
                top: "calc(var(--eg-header-offset, 0px) + 0.75rem)",
                maxHeight:
                  "calc(100dvh - var(--eg-header-offset, 0px) - max(6.8rem, calc(env(safe-area-inset-bottom) + 6.8rem)) - 1rem)",
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Пошук товарів"
            >
              <label className="flex min-h-[54px] shrink-0 items-center gap-2.5 rounded-[1.25rem] border border-emerald-100 bg-emerald-50/35 px-3.5 text-stone-500 shadow-inner shadow-stone-900/[0.025] focus-within:border-emerald-700 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-100/80">
                <input
                  ref={mobileSearchInputRef}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Пошук"
                  className="min-w-0 flex-1 bg-transparent text-[15px] font-bold text-stone-950 outline-none placeholder:text-stone-400"
                />

                <button
                  type="button"
                  onClick={() => setIsMobileSearchOpen(false)}
                  className="eg-icon-button grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-900 text-white shadow-md shadow-emerald-900/18"
                  aria-label="Знайти"
                >
                  <Search size={20} />
                </button>
              </label>

              <div className="modal-scrollbar mt-3 max-h-[38dvh] min-h-0 overflow-y-auto pr-1">
                {query.trim() ? (
                  mobileSearchResults.length > 0 ? (
                    <div className="divide-y divide-stone-200">
                      {mobileSearchResults.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => {
                            setIsMobileSearchOpen(false);
                            openProduct?.(product);
                          }}
                          className="eg-button flex w-full items-center gap-3 py-3 text-left hover:bg-emerald-50/70"
                        >
                          <span className="grid h-16 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-stone-50">
                            <img
                              src={product.image || logoEvergreen}
                              alt=""
                              className="max-h-full max-w-full object-contain"
                              onError={(event) => {
                                event.currentTarget.src = logoEvergreen;
                              }}
                            />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="block text-[11px] font-bold text-stone-400">
                              Код:
                            </span>
                            <span className="mt-0.5 line-clamp-2 block text-[14px] font-semibold leading-5 text-stone-950">
                              {product.name}
                            </span>
                            <span className="mt-1.5 block text-base font-black text-stone-950">
                              {formatUAH(product.price)}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex min-h-[120px] items-center justify-center px-4 text-center">
                      <div>
                        <p className="text-base font-black text-stone-950">
                          Нічого не знайдено
                        </p>
                        <p className="mt-1.5 text-xs font-semibold leading-5 text-stone-500">
                          Спробуйте іншу назву товару.
                        </p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex min-h-[120px] items-center justify-center px-4 text-center">
                    <p className="text-xs font-semibold leading-5 text-stone-500">
                      Почніть вводити назву товару.
                    </p>
                  </div>
                )}
              </div>

              <div className="shrink-0 border-t border-stone-200 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMobileSearchOpen(false)}
                  className="eg-button flex min-h-11 w-full items-center gap-2.5 rounded-[1.1rem] px-2.5 text-left text-sm font-black text-emerald-900 hover:bg-emerald-50"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-50 text-emerald-900">
                    <ChevronRight size={18} />
                  </span>
                  Дивитися всі результати
                </button>

                {query.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setCurrentPage(1);
                      mobileSearchInputRef.current?.focus();
                    }}
                    className="eg-button mt-1 min-h-9 rounded-full px-3 text-xs font-black text-stone-500 hover:bg-stone-50 hover:text-emerald-900"
                  >
                    Очистити пошук
                  </button>
                )}
              </div>
            </aside>
          </>
        )}

        {isCatalogMenuOpen && (
          <>
            <div className="eg-mobile-catalog-panel fixed inset-0 z-[120] overflow-hidden bg-stone-50 text-stone-950 md:hidden">
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

      <section className="mb-6 hidden sm:mb-8 md:block">
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

      <section className="mb-4 sm:mb-10">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-stone-500 sm:text-sm">
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

        <div className="mb-4 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center">
          <h1 className="text-[1.72rem] font-extrabold uppercase leading-[1.08] tracking-normal text-stone-950 sm:text-4xl">
            {pageTitle}
          </h1>

          <span className="w-fit rounded-full bg-emerald-100 px-3.5 py-1.5 text-[13px] font-extrabold text-emerald-950 ring-1 ring-emerald-200/70">
            {pageCountLabel}
          </span>
        </div>

        {query.trim() && (
          <div className="mb-4 flex md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(true)}
              className="eg-button flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-full border border-emerald-100 bg-white/92 px-4 text-left text-xs font-bold text-emerald-950 shadow-sm shadow-emerald-950/5"
            >
              <Search size={16} className="shrink-0 text-emerald-800" />
              <span className="min-w-0 flex-1 truncate">Пошук: {query}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCurrentPage(1);
              }}
              className="eg-icon-button ml-2 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-emerald-900 shadow-sm ring-1 ring-emerald-100"
              aria-label="Очистити пошук"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {selectedCategory !== "all" && activeSubcategories.length > 0 && (
          <div className="eg-stagger mb-8 hidden gap-3 md:grid md:grid-cols-2 lg:grid-cols-3 xl:max-w-5xl">
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
            className="eg-button mb-6 hidden rounded-xl text-sm font-black text-emerald-800 hover:text-emerald-950 md:inline-flex"
          >
            Скинути категорію
          </button>
        )}
      </section>

      <section className="relative z-30 mb-6 space-y-2.5 md:hidden">
        <div className="eg-glass eg-premium-card rounded-[1.45rem] border border-emerald-100/80 bg-white/92 p-2 shadow-lg shadow-emerald-950/8">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => selectFulfillmentTab("in_stock")}
              aria-pressed={selectedFulfillmentType === "in_stock"}
              className={`eg-button min-h-[74px] rounded-[1.15rem] border px-3 py-3 text-left transition ${
                selectedFulfillmentType === "in_stock"
                  ? "border-emerald-900 bg-emerald-900 text-white shadow-lg shadow-emerald-900/22"
                  : "border-emerald-100 bg-emerald-50/70 text-stone-950 shadow-sm hover:border-emerald-200 hover:bg-emerald-50"
              }`}
            >
              <span className="flex h-full flex-col justify-between gap-3">
                <span className="text-[13px] font-black leading-tight">
                  Є в наявності
                </span>

                <span
                  className={`w-fit rounded-full px-2.5 py-1 text-xs font-black ${
                    selectedFulfillmentType === "in_stock"
                      ? "bg-white/18 text-white ring-1 ring-white/20"
                      : "bg-white text-emerald-950 ring-1 ring-emerald-100"
                  }`}
                >
                  {fulfillmentCounts.inStock}
                </span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => selectFulfillmentTab("supplier_order")}
              aria-pressed={selectedFulfillmentType === "supplier_order"}
              className={`eg-button min-h-[74px] rounded-[1.15rem] border px-3 py-3 text-left transition ${
                selectedFulfillmentType === "supplier_order"
                  ? "border-emerald-900 bg-emerald-900 text-white shadow-lg shadow-emerald-900/22"
                  : "border-emerald-100 bg-white text-stone-950 shadow-sm hover:border-emerald-200 hover:bg-emerald-50"
              }`}
            >
              <span className="flex h-full flex-col justify-between gap-3">
                <span className="text-[13px] font-black leading-tight">
                  Під замовлення
                </span>

                <span
                  className={`w-fit rounded-full px-2.5 py-1 text-xs font-black ${
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
        </div>

        <div ref={mobileSortMenuRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setIsSortMenuOpen((current) => !current);
              setIsMobileFilterOpen(false);
            }}
            aria-haspopup="listbox"
            aria-expanded={isSortMenuOpen}
            className={`eg-button flex min-h-[54px] w-full items-center justify-between gap-3 rounded-[1.25rem] border px-3.5 text-left text-[15px] font-semibold text-stone-900 outline-none transition ${
              isSortMenuOpen
                ? "border-emerald-700 bg-white shadow-lg shadow-emerald-950/10 ring-2 ring-emerald-100/80"
                : "border-emerald-100 bg-white/88 shadow-sm shadow-emerald-950/[0.04] hover:border-emerald-200 hover:bg-white"
            }`}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <ArrowDownUp size={19} className="shrink-0 text-emerald-900" />
              <span className="truncate">{selectedSortOption.label}</span>
            </span>

            <ChevronDown
              size={17}
              className={`shrink-0 text-emerald-900 transition-transform duration-200 ${
                isSortMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isSortMenuOpen && (
            <div
              className="eg-sort-menu absolute inset-x-0 top-full z-[95] mt-2 overflow-hidden rounded-[1.2rem] border border-emerald-100 bg-white/98 p-1.5 shadow-2xl shadow-emerald-950/14 ring-1 ring-white/80 backdrop-blur-2xl"
              role="listbox"
              aria-label="Сортування товарів"
            >
              {SORT_OPTIONS.map((option) => {
                const isSelected = option.value === sortBy;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => selectSortOption(option.value)}
                    role="option"
                    aria-selected={isSelected}
                    className={`eg-button flex min-h-10 w-full items-center justify-between gap-3 rounded-[0.95rem] px-3.5 text-left text-[13px] font-bold ${
                      isSelected
                        ? "bg-emerald-900 text-white shadow-lg shadow-emerald-900/18"
                        : "text-stone-800 hover:bg-emerald-50 hover:text-emerald-950"
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsMobileFilterOpen((current) => !current);
              setIsSortMenuOpen(false);
            }}
            aria-expanded={isMobileFilterOpen}
            className="eg-button flex min-h-[56px] w-full items-center justify-between gap-3 rounded-[1.2rem] bg-emerald-900 px-4 text-left text-[15px] font-extrabold text-white shadow-lg shadow-emerald-900/18 hover:bg-emerald-800"
          >
            <span className="flex min-w-0 items-center gap-3">
              <ListFilter size={19} className="shrink-0 text-emerald-100" />
              <span className="truncate">Фільтр</span>
            </span>

            <ChevronDown
              size={18}
              className={`shrink-0 text-emerald-100 transition-transform duration-200 ${
                isMobileFilterOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isMobileFilterOpen && (
            <div className="eg-mobile-filter-panel mt-2 rounded-[1.2rem] border border-emerald-100 bg-white/96 p-2 shadow-xl shadow-emerald-950/10 ring-1 ring-white/80 backdrop-blur">
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => selectFulfillmentTab("in_stock")}
                  className={`eg-button flex min-h-11 items-center justify-between rounded-[1rem] px-3.5 text-left text-[13px] font-bold ${
                    selectedFulfillmentType === "in_stock"
                      ? "bg-emerald-900 text-white shadow-lg shadow-emerald-900/18"
                      : "bg-emerald-50/70 text-stone-900 hover:bg-emerald-50"
                  }`}
                >
                  <span>Є в наявності</span>
                  <span
                    className={`grid min-h-6 min-w-6 place-items-center rounded-full px-2 text-[11px] font-extrabold ${
                      selectedFulfillmentType === "in_stock"
                        ? "bg-white/18 text-white"
                        : "bg-white text-emerald-950"
                    }`}
                  >
                    {fulfillmentCounts.inStock}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => selectFulfillmentTab("supplier_order")}
                  className={`eg-button flex min-h-11 items-center justify-between rounded-[1rem] px-3.5 text-left text-[13px] font-bold ${
                    selectedFulfillmentType === "supplier_order"
                      ? "bg-emerald-900 text-white shadow-lg shadow-emerald-900/18"
                      : "bg-stone-50 text-stone-900 hover:bg-emerald-50"
                  }`}
                >
                  <span>Під замовлення</span>
                  <span
                    className={`grid min-h-6 min-w-6 place-items-center rounded-full px-2 text-[11px] font-extrabold ${
                      selectedFulfillmentType === "supplier_order"
                        ? "bg-white/18 text-white"
                        : "bg-emerald-100 text-emerald-950"
                    }`}
                  >
                    {fulfillmentCounts.supplierOrder}
                  </span>
                </button>
              </div>

              {selectedFulfillmentType === "supplier_order" &&
                supplierFilters.length > 0 && (
                  <div className="modal-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
                    <button
                      type="button"
                      onClick={() => selectSupplierFilter("")}
                      className={`eg-button min-h-9 shrink-0 rounded-full px-3.5 text-[11px] font-bold ${
                        !selectedSupplierId
                          ? "bg-emerald-900 text-white"
                          : "bg-stone-50 text-stone-800 ring-1 ring-stone-100"
                      }`}
                    >
                      Усі постачальники
                    </button>

                    {supplierFilters.map((supplier) => (
                      <button
                        key={supplier.id}
                        type="button"
                        onClick={() => selectSupplierFilter(supplier.id)}
                        className={`eg-button min-h-9 max-w-[180px] shrink-0 rounded-full px-3.5 text-left text-[11px] font-bold ${
                          selectedSupplierId === supplier.id
                            ? "bg-emerald-900 text-white"
                            : "bg-stone-50 text-stone-800 ring-1 ring-stone-100"
                        }`}
                      >
                        <span className="block truncate">{supplier.name}</span>
                      </button>
                    ))}
                  </div>
                )}

              {(selectedCategory !== "all" ||
                selectedSubcategory !== "all" ||
                selectedFulfillmentType !== "in_stock" ||
                selectedSupplierId) && (
                <button
                  type="button"
                  onClick={() => {
                    resetAllFilters();
                    setIsMobileFilterOpen(false);
                  }}
                  className="eg-button mt-2 min-h-9 w-full rounded-[0.95rem] bg-emerald-50 px-3.5 text-[13px] font-bold text-emerald-900 hover:bg-emerald-100"
                >
                  Скинути фільтри
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="min-w-0">
          {isSupplierSelectionMode ? (
            <SupplierTileGrid
              suppliers={supplierFilters}
              onSelect={selectSupplierFilter}
            />
          ) : visibleProducts.length > 0 ? (
            <div
              key={catalogResultsKey}
              className="eg-catalog-results grid grid-cols-2 gap-2.5 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4"
            >
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
            <div
              key={catalogResultsKey}
              className="eg-catalog-results eg-panel rounded-[2rem] border border-dashed border-stone-200 bg-white p-10 text-center shadow-sm"
            >
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

          {!isSupplierSelectionMode && totalProductPages > 1 && (
            <nav
              className="mt-8 flex flex-col items-center justify-center gap-3"
              aria-label="Пагінація товарів"
            >
              <p className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-emerald-900">
                Сторінка {currentPage} з {totalProductPages}
              </p>

              <div className="flex max-w-full items-center justify-center gap-1 rounded-[22px] bg-white/85 p-1 shadow-sm ring-1 ring-stone-200/70 sm:gap-1.5 sm:p-1.5">
                <button
                  type="button"
                  onClick={() => changeProductPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Попередня сторінка"
                  className="eg-button grid h-8 w-8 place-items-center rounded-xl text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-35 sm:h-10 sm:w-10 sm:rounded-2xl"
                >
                  <ChevronLeft size={18} />
                </button>

                {paginationItems.map((item) => {
                  if (typeof item === "string") {
                    const jumpTarget = getPaginationJumpTarget(
                      item,
                      currentPage,
                      totalProductPages
                    );

                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => changeProductPage(jumpTarget)}
                        className="eg-button grid h-8 w-5 place-items-center rounded-xl text-stone-400 hover:bg-stone-100 hover:text-emerald-900 sm:h-10 sm:w-8 sm:rounded-2xl"
                        aria-label={`Перейти до сторінки ${jumpTarget}`}
                        title={`Сторінка ${jumpTarget}`}
                      >
                        <MoreHorizontal size={18} />
                      </button>
                    );
                  }

                  const isDistantMobilePage =
                    item !== 1 &&
                    item !== totalProductPages &&
                    Math.abs(item - currentPage) > 1;

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => changeProductPage(item)}
                      aria-current={currentPage === item ? "page" : undefined}
                      className={`eg-button h-8 min-w-8 place-items-center rounded-xl px-2 text-xs font-black sm:h-10 sm:min-w-10 sm:rounded-2xl sm:px-3 sm:text-sm ${
                        isDistantMobilePage ? "hidden sm:grid" : "grid"
                      } ${
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
                  onClick={() => changeProductPage(currentPage + 1)}
                  disabled={currentPage === totalProductPages}
                  aria-label="Наступна сторінка"
                  className="eg-button grid h-8 w-8 place-items-center rounded-xl text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-35 sm:h-10 sm:w-10 sm:rounded-2xl"
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
