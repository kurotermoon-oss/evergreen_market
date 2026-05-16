import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  MoreHorizontal,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import ProductCard from "../components/ProductCard.jsx";

const CATEGORY_MARKS = {
  coffee: "КА",
  milk: "МЛ",
  "alt-milk": "РМ",
  syrups: "СИ",
  sweets: "СЛ",
  snacks: "СН",
  drinks: "НА",
};

function getCategoryMark(category) {
  if (CATEGORY_MARKS[category.id]) {
    return CATEGORY_MARKS[category.id];
  }

  return (category.name || "")
    .trim()
    .slice(0, 2)
    .toUpperCase() || "•";
}

function getUniqueOptions(products, key) {
  return [
    ...new Set(
      products
        .map((product) => String(product[key] || "").trim())
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b, "uk"));
}

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

function FilterSection({ title, children }) {
  if (!children) return null;

  return (
    <details
      open
      className="group border-b border-stone-200 py-4 last:border-b-0"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-stone-800 [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <ChevronDown
          size={17}
          className="text-stone-700 transition group-open:rotate-180"
        />
      </summary>

      <div className="mt-3">{children}</div>
    </details>
  );
}

function FilterCheckbox({ checked, label, onChange }) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2.5 rounded-xl py-1.5 text-sm transition ${
        checked ? "font-semibold text-emerald-950" : "text-stone-700"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition ${
          checked
            ? "border-emerald-900 bg-emerald-900 shadow-sm shadow-emerald-900/20"
            : "border-emerald-900/25 bg-white"
        }`}
      >
        <span
          className={`text-[11px] font-black leading-none text-white transition ${
            checked ? "opacity-100" : "opacity-0"
          }`}
        >
          ✓
        </span>
      </span>
      <span className="min-w-0 leading-5">{label}</span>
    </label>
  );
}

function OptionList({ options, selectedValues, onToggle, maxHeight = false }) {
  if (!options.length) {
    return (
      <p className="rounded-xl bg-white px-3 py-2 text-sm text-stone-500">
        Немає варіантів
      </p>
    );
  }

  return (
    <div
      className={`space-y-1 ${
        maxHeight ? "modal-scrollbar max-h-56 overflow-y-auto pr-2" : ""
      }`}
    >
      {options.map((option) => (
        <FilterCheckbox
          key={option}
          label={option}
          checked={selectedValues.includes(option)}
          onChange={() => onToggle(option)}
        />
      ))}
    </div>
  );
}

function CatalogFilterPanel({
  className = "",
  onClose,
  resetAllFilters,
  brandOptions,
  selectedBrands,
  toggleBrand,
  productTypeOptions,
  selectedProductTypes,
  toggleProductType,
  activeFilterCount,
  totalProducts,
}) {
  return (
    <aside className={className}>
      <div className="eg-glass eg-premium-card h-full overflow-hidden rounded-[1.6rem] border border-emerald-100/80 bg-white/92 shadow-sm shadow-emerald-950/5">
        <div className="flex items-center justify-between gap-3 border-b border-emerald-100/80 bg-gradient-to-br from-emerald-50/90 via-white to-white px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-900 text-white shadow-sm shadow-emerald-900/25">
              <SlidersHorizontal size={15} />
            </span>

            <div className="min-w-0">
              <p className="text-xl font-black leading-tight text-emerald-950">
                Фільтр
              </p>

              <p className="mt-0.5 text-xs font-semibold text-emerald-900/65">
                {totalProducts} товарів
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-emerald-900 px-2.5 py-1 text-xs font-semibold text-white">
                {activeFilterCount}
              </span>
            )}

            <button
              type="button"
              onClick={resetAllFilters}
              className="rounded-lg px-2 py-1 text-xs font-black text-emerald-800 hover:bg-emerald-50 hover:text-emerald-950"
            >
              Скинути
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрити фільтри"
                className="grid h-9 w-9 place-items-center rounded-full bg-white text-emerald-900 shadow-sm ring-1 ring-emerald-100 hover:bg-emerald-50 lg:hidden"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="modal-scrollbar max-h-[calc(100dvh-8rem)] overflow-y-auto px-4 py-1">
          <FilterSection title="Тип товару">
            <OptionList
              options={productTypeOptions}
              selectedValues={selectedProductTypes}
              onToggle={toggleProductType}
              maxHeight={productTypeOptions.length > 6}
            />
          </FilterSection>

          <FilterSection title="Торгова марка">
            <OptionList
              options={brandOptions}
              selectedValues={selectedBrands}
              onToggle={toggleBrand}
              maxHeight={brandOptions.length > 6}
            />
          </FilterSection>
        </div>
      </div>
    </aside>
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
  const [isCatalogMenuOpen, setIsCatalogMenuOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [hoveredCategoryId, setHoveredCategoryId] = useState(null);

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

  const activeSubcategories = (activeCategory?.subcategories || []).filter(
    (subcategory) => subcategory.active !== false
  );
  const paginationItems = getPaginationItems(currentPage, totalProductPages);

  const filterOptions = useMemo(() => {
    const activeProducts = products.filter((product) => product.active !== false);

    return {
      brands: getUniqueOptions(activeProducts, "brand"),
      productTypes: getUniqueOptions(activeProducts, "productType"),
      countries: getUniqueOptions(activeProducts, "countryOfOrigin"),
    };
  }, [products]);

  const pageTitle =
    selectedCategory === "all"
      ? "Каталог товарів"
      : activeCategory?.name || "Каталог товарів";

  const activeFilterCount =
    selectedBrands.length + selectedProductTypes.length;

  function closeCatalogMenu() {
    setIsCatalogMenuOpen(false);
    setHoveredCategoryId(null);
  }

  function openCatalogMenu() {
    setIsCatalogMenuOpen(true);
    setHoveredCategoryId(
      selectedCategory !== "all"
        ? selectedCategory
        : catalogCategories[0]?.id || null
    );
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
    setCurrentPage(1);
    setIsFiltersOpen(false);
    closeCatalogMenu();
  }

  function resetProductFilters() {
    setSelectedBrands([]);
    setSelectedProductTypes([]);
    setCurrentPage(1);
    setIsFiltersOpen(false);
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

  function toggleFilterValue(setter, value) {
    setter((currentValues) => {
      return currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];
    });
    setCurrentPage(1);
  }

  const filterPanelProps = {
    resetAllFilters: resetProductFilters,
    brandOptions: filterOptions.brands,
    selectedBrands,
    toggleBrand(value) {
      toggleFilterValue(setSelectedBrands, value);
    },
    productTypeOptions: filterOptions.productTypes,
    selectedProductTypes,
    toggleProductType(value) {
      toggleFilterValue(setSelectedProductTypes, value);
    },
    activeFilterCount,
    totalProducts,
  };

  return (
    <main
      id="catalog"
      className="scroll-mt-24 mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8"
    >
      <section className="relative mb-7 sm:mb-10">
        <div className="grid gap-3 lg:grid-cols-[minmax(240px,360px)_minmax(0,1fr)] lg:items-start">
          <div className="eg-glass eg-premium-card rounded-[1.5rem] p-3 sm:rounded-[2rem]">
            <button
              type="button"
              onClick={() =>
                isCatalogMenuOpen ? closeCatalogMenu() : openCatalogMenu()
              }
              className="eg-button eg-sweep flex w-full items-center justify-center gap-2 rounded-[22px] bg-emerald-900 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-emerald-800 hover:shadow-md hover:shadow-emerald-900/20 sm:gap-3 sm:rounded-[28px] sm:px-7 sm:py-4 sm:text-base"
            >
              {isCatalogMenuOpen ? <X size={20} /> : <Menu size={21} />}
              <span>Каталог товарів</span>
            </button>
          </div>

          <div className="eg-glass eg-premium-card rounded-[1.5rem] p-3 sm:rounded-[2rem] sm:p-4">
            <div className="flex min-w-0 flex-1 flex-col gap-3 xl:flex-row">
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Пошук"
                className="eg-field min-h-12 flex-1 rounded-[22px] border border-white/80 bg-white/80 px-4 text-sm outline-none backdrop-blur focus:border-emerald-700 sm:min-h-[56px] sm:rounded-[28px] sm:px-6 sm:text-base"
              />

              <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2 sm:gap-3 xl:grid-cols-[auto_minmax(220px,auto)]">
                <button
                  type="button"
                  onClick={() => setIsFiltersOpen((current) => !current)}
                  aria-label="Відкрити фільтри"
                  className="eg-button relative flex min-h-12 items-center justify-center gap-2 rounded-[20px] border border-emerald-100 bg-emerald-50 px-4 text-sm font-black text-emerald-950 hover:bg-emerald-100 sm:min-h-[56px] sm:rounded-[22px] sm:px-5 lg:hidden"
                >
                  <SlidersHorizontal size={18} />
                  <span>Фільтри</span>
                  {activeFilterCount > 0 && (
                    <span className="rounded-full bg-emerald-900 px-2 py-0.5 text-xs text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <select
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="eg-field min-h-12 w-full rounded-[20px] border border-white/80 bg-white/80 px-4 text-sm outline-none backdrop-blur focus:border-emerald-700 sm:min-h-[56px] sm:w-auto sm:rounded-[22px] sm:px-5 sm:text-base"
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

        {isFiltersOpen && (
          <>
            <div
              className="eg-overlay fixed inset-0 z-[80] bg-emerald-950/25 backdrop-blur-[2px] lg:hidden"
              onClick={() => setIsFiltersOpen(false)}
            />

            <div className="fixed bottom-0 left-0 top-0 z-[90] w-[min(88vw,360px)] max-w-full overflow-hidden rounded-r-[2rem] bg-white/95 shadow-2xl shadow-emerald-950/25 lg:hidden">
              <CatalogFilterPanel
                {...filterPanelProps}
                className="h-full"
                onClose={() => setIsFiltersOpen(false)}
              />
            </div>
          </>
        )}

        {isCatalogMenuOpen && (
          <>
            <div
              className="eg-overlay fixed inset-0 z-[80] bg-emerald-950/20 backdrop-blur-[2px] lg:z-30"
              onClick={closeCatalogMenu}
            />

            <div className="eg-menu eg-glass fixed left-3 right-3 top-24 z-[90] max-h-[calc(100dvh-11rem)] w-auto overflow-y-auto overscroll-contain rounded-[24px] border border-white/70 shadow-2xl shadow-emerald-950/10 sm:left-4 sm:right-4 sm:rounded-[28px] lg:absolute lg:left-0 lg:right-auto lg:top-full lg:z-[60] lg:mt-4 lg:max-h-none lg:w-full lg:overflow-hidden lg:rounded-[34px]">
              <div className="grid lg:min-h-[460px] lg:grid-cols-[360px_1fr]">
                <div className="bg-stone-50/80 p-3 backdrop-blur sm:p-5">
                  <button
                    type="button"
                    onClick={resetCatalogFilters}
                    className={`eg-button mb-2 flex w-full items-center justify-between rounded-[18px] px-4 py-3 text-left text-sm font-black sm:mb-3 sm:rounded-[24px] sm:px-5 sm:py-4 sm:text-base ${
                      selectedCategory === "all"
                        ? "bg-emerald-900 text-white shadow-lg shadow-emerald-900/20"
                        : "bg-white/85 text-stone-950 hover:bg-emerald-50"
                    }`}
                  >
                    <span>Усі товари</span>
                    {selectedCategory === "all" && <span>✓</span>}
                  </button>

                  <div className="space-y-2">
                    {catalogCategories.map((category) => {
                      const isPreviewed = previewCategoryId === category.id;
                      const isActive = selectedCategory === category.id;
                      const mark = getCategoryMark(category);
                      const hasSubcategories =
                        (category.subcategories || []).filter(
                          (subcategory) => subcategory.active !== false
                        ).length > 0;

                      return (
                        <button
                          key={category.id}
                          type="button"
                          onMouseEnter={() =>
                            setHoveredCategoryId(category.id)
                          }
                          onFocus={() => setHoveredCategoryId(category.id)}
                          onClick={() => selectCategory(category.id)}
                          className={`eg-button flex w-full items-center justify-between rounded-[18px] px-2.5 py-2.5 text-left sm:rounded-[24px] sm:px-4 sm:py-4 ${
                            isPreviewed
                              ? "bg-emerald-100 text-emerald-950 shadow-sm"
                              : "text-stone-900 hover:bg-white/95"
                          }`}
                        >
                          <span className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-black shadow-sm sm:h-11 sm:w-11 sm:rounded-2xl sm:text-xs ${
                                isPreviewed
                                  ? "bg-white text-emerald-900"
                                  : "bg-white/85 text-emerald-900"
                              }`}
                            >
                              {mark}
                            </span>

                            <span className="min-w-0 text-[13px] font-black uppercase leading-5 tracking-normal sm:text-sm sm:tracking-wide">
                              {category.name}
                            </span>
                          </span>

                          <span className="ml-2 flex shrink-0 items-center gap-2 sm:ml-3">
                            {isActive && (
                              <span className="hidden rounded-full bg-white/70 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-800 sm:inline">
                                Активна
                              </span>
                            )}

                            {hasSubcategories && (
                              <span className="text-xl text-stone-400">›</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="hidden bg-white/90 p-7 backdrop-blur lg:block">
                  {previewCategory ? (
                    <>
                      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.22em] text-stone-400">
                            Підкатегорії
                          </p>

                          <h2 className="mt-2 text-3xl font-black text-stone-950">
                            {previewCategory.name}
                          </h2>
                        </div>

                        <button
                          type="button"
                          onClick={() => selectCategory(previewCategory.id)}
                          className="eg-button rounded-[22px] bg-stone-50 px-5 py-3 text-sm font-black text-stone-950 hover:bg-emerald-50"
                        >
                          Усі товари категорії
                        </button>
                      </div>

                      {previewSubcategories.length > 0 ? (
                        <div className="eg-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                          {previewSubcategories.map((subcategory) => {
                            const isActive =
                              selectedCategory === previewCategory.id &&
                              selectedSubcategory === subcategory.id;

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
                                className={`eg-button eg-premium-card min-h-[72px] rounded-[24px] px-6 py-4 text-left text-sm font-black uppercase tracking-wide ${
                                  isActive
                                    ? "bg-emerald-900 text-white shadow-lg shadow-emerald-900/20"
                                    : "bg-stone-50 text-stone-950 hover:bg-emerald-50"
                                }`}
                              >
                                {subcategory.name}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="eg-panel flex min-h-[260px] items-center justify-center rounded-[28px] border border-dashed border-stone-200 bg-stone-50 px-8 text-center">
                          <div>
                            <p className="text-lg font-black text-stone-950">
                              У цій категорії поки немає підкатегорій
                            </p>

                            <p className="mt-2 text-sm leading-6 text-stone-500">
                              Натисніть “Усі товари категорії”, щоб переглянути
                              товари з цього розділу.
                            </p>
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

      <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="sticky top-28 hidden self-start lg:block">
          <CatalogFilterPanel {...filterPanelProps} />
        </div>

        <section className="min-w-0">
          {visibleProducts.length > 0 ? (
            <div className="eg-stagger grid grid-cols-1 gap-3 min-[430px]:grid-cols-2 sm:gap-5 xl:grid-cols-3">
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
                Спробуйте змінити параметри пошуку або фільтрів.
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
      </div>
    </main>
  );
}
