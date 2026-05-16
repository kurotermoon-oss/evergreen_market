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

const STOCK_FILTERS = [
  {
    value: "in_stock",
    label: "У наявності",
  },
  {
    value: "limited",
    label: "Мало в наявності",
  },
  {
    value: "preorder",
    label: "Під замовлення",
  },
  {
    value: "out_of_stock",
    label: "Немає в наявності",
  },
];

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

function FilterSection({ title, children }) {
  if (!children) return null;

  return (
    <div className="border-t border-stone-200/80 py-5 first:border-t-0 first:pt-0 last:pb-0">
      <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-stone-500">
        {title}
      </p>

      {children}
    </div>
  );
}

function FilterCheckbox({ checked, label, onChange }) {
  return (
    <label
      className={`eg-button flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition ${
        checked
          ? "bg-emerald-50 text-emerald-950 ring-1 ring-emerald-100"
          : "text-stone-700 hover:bg-stone-50"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 shrink-0 accent-emerald-900"
      />
      <span className="min-w-0 break-words">{label}</span>
    </label>
  );
}

function OptionList({ options, selectedValues, onToggle }) {
  if (!options.length) {
    return (
      <p className="rounded-2xl bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-500">
        Немає варіантів
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
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
  categories,
  activeCategory,
  activeSubcategories,
  selectedCategory,
  selectedSubcategory,
  selectCategory,
  selectSubcategory,
  resetAllFilters,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  brandOptions,
  selectedBrands,
  toggleBrand,
  productTypeOptions,
  selectedProductTypes,
  toggleProductType,
  countryOptions,
  selectedCountries,
  toggleCountry,
  selectedStockStatuses,
  toggleStockStatus,
  showPopularOnly,
  setShowPopularOnly,
  activeFilterCount,
  totalProducts,
}) {
  return (
    <aside className={className}>
      <div className="eg-glass eg-premium-card overflow-hidden rounded-[2rem] bg-white/90 shadow-sm ring-1 ring-white/70">
        <div className="flex items-start justify-between gap-3 border-b border-stone-200/80 px-5 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
              Фільтри
            </p>

            <p className="mt-1 text-sm font-semibold text-stone-500">
              {totalProducts} товарів
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-950">
                {activeFilterCount}
              </span>
            )}

            <button
              type="button"
              onClick={resetAllFilters}
              className="eg-button rounded-xl px-2 py-1 text-xs font-black text-emerald-800 hover:bg-emerald-50"
            >
              Скинути
            </button>
          </div>
        </div>

        <div className="modal-scrollbar max-h-[calc(100dvh-9rem)] overflow-y-auto px-5 py-5">
          <FilterSection title="Категорія">
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => selectCategory("all")}
                className={`eg-button flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-black ${
                  selectedCategory === "all"
                    ? "bg-emerald-900 text-white shadow-lg shadow-emerald-900/20"
                    : "bg-stone-50 text-stone-900 hover:bg-emerald-50"
                }`}
              >
                <span>Усі товари</span>
                {selectedCategory === "all" && <span>✓</span>}
              </button>

              {categories.map((category) => {
                const isActive = selectedCategory === category.id;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => selectCategory(category.id)}
                    className={`eg-button flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left ${
                      isActive
                        ? "bg-emerald-50 text-emerald-950 ring-1 ring-emerald-100"
                        : "text-stone-800 hover:bg-stone-50"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[11px] font-black ${
                        isActive
                          ? "bg-emerald-900 text-white"
                          : "bg-white text-emerald-900 shadow-sm"
                      }`}
                    >
                      {getCategoryMark(category)}
                    </span>

                    <span className="min-w-0 break-words text-sm font-black">
                      {category.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </FilterSection>

          {selectedCategory !== "all" && (
            <FilterSection title={activeCategory?.name || "Підкатегорії"}>
              <div className="space-y-1.5">
                <FilterCheckbox
                  checked={selectedSubcategory === "all"}
                  label="Усі підкатегорії"
                  onChange={() => selectSubcategory(selectedCategory, "all")}
                />

                {activeSubcategories.map((subcategory) => (
                  <FilterCheckbox
                    key={subcategory.id}
                    checked={selectedSubcategory === subcategory.id}
                    label={subcategory.name}
                    onChange={() =>
                      selectSubcategory(selectedCategory, subcategory.id)
                    }
                  />
                ))}
              </div>
            </FilterSection>
          )}

          <FilterSection title="Ціна">
            <div className="grid grid-cols-2 gap-2">
              <input
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                type="number"
                min="0"
                placeholder="від"
                className="eg-field min-h-11 min-w-0 rounded-2xl border border-stone-200 bg-white px-4 text-sm outline-none focus:border-emerald-700"
              />

              <input
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                type="number"
                min="0"
                placeholder="до"
                className="eg-field min-h-11 min-w-0 rounded-2xl border border-stone-200 bg-white px-4 text-sm outline-none focus:border-emerald-700"
              />
            </div>
          </FilterSection>

          <FilterSection title="Наявність">
            <div className="space-y-1.5">
              {STOCK_FILTERS.map((item) => (
                <FilterCheckbox
                  key={item.value}
                  checked={selectedStockStatuses.includes(item.value)}
                  label={item.label}
                  onChange={() => toggleStockStatus(item.value)}
                />
              ))}
            </div>
          </FilterSection>

          <FilterSection title="Добірки">
            <FilterCheckbox
              checked={showPopularOnly}
              label="Популярні товари"
              onChange={() => setShowPopularOnly(!showPopularOnly)}
            />
          </FilterSection>

          <FilterSection title="Бренд">
            <OptionList
              options={brandOptions}
              selectedValues={selectedBrands}
              onToggle={toggleBrand}
            />
          </FilterSection>

          <FilterSection title="Тип товару">
            <OptionList
              options={productTypeOptions}
              selectedValues={selectedProductTypes}
              onToggle={toggleProductType}
            />
          </FilterSection>

          <FilterSection title="Країна">
            <OptionList
              options={countryOptions}
              selectedValues={selectedCountries}
              onToggle={toggleCountry}
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
    Number(Boolean(query.trim())) +
    Number(Boolean(minPrice)) +
    Number(Boolean(maxPrice)) +
    Number(selectedCategory !== "all") +
    Number(selectedSubcategory !== "all") +
    selectedBrands.length +
    selectedProductTypes.length +
    selectedCountries.length +
    selectedStockStatuses.length +
    Number(showPopularOnly);

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

  function setPopularOnly(nextValue) {
    setShowPopularOnly(nextValue);
    setCurrentPage(1);
  }

  const filterPanelProps = {
    categories: catalogCategories,
    activeCategory,
    activeSubcategories,
    selectedCategory,
    selectedSubcategory,
    selectCategory,
    selectSubcategory,
    resetAllFilters,
    minPrice,
    setMinPrice(value) {
      setMinPrice(value);
      setCurrentPage(1);
    },
    maxPrice,
    setMaxPrice(value) {
      setMaxPrice(value);
      setCurrentPage(1);
    },
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
    countryOptions: filterOptions.countries,
    selectedCountries,
    toggleCountry(value) {
      toggleFilterValue(setSelectedCountries, value);
    },
    selectedStockStatuses,
    toggleStockStatus(value) {
      toggleFilterValue(setSelectedStockStatuses, value);
    },
    showPopularOnly,
    setShowPopularOnly: setPopularOnly,
    activeFilterCount,
    totalProducts,
  };

  return (
    <main
      id="catalog"
      className="scroll-mt-24 mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8"
    >
      <section className="relative mb-7 sm:mb-10">
        <div className="eg-glass eg-premium-card rounded-[1.5rem] p-3 sm:rounded-[2rem] sm:p-4">
          <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center">
            <button
              type="button"
              onClick={() =>
                isCatalogMenuOpen ? closeCatalogMenu() : openCatalogMenu()
              }
              className="eg-button eg-sweep flex w-full items-center justify-center gap-2 rounded-[22px] bg-emerald-900 px-4 py-3 text-sm font-black text-white shadow-sm hover:bg-emerald-800 hover:shadow-md hover:shadow-emerald-900/20 sm:gap-3 sm:rounded-[28px] sm:px-7 sm:py-4 sm:text-base lg:hidden"
            >
              <span className="text-lg leading-none sm:text-xl">
                {isCatalogMenuOpen ? "×" : "☰"}
              </span>
              <span>Каталог товарів</span>
            </button>

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

              <div className="grid gap-3 sm:grid-cols-[auto_minmax(180px,auto)] xl:grid-cols-[auto_minmax(220px,auto)]">
                <button
                  type="button"
                  onClick={() => setIsFiltersOpen((current) => !current)}
                  className="eg-button flex min-h-12 items-center justify-center gap-2 rounded-[20px] border border-emerald-100 bg-emerald-50 px-4 text-sm font-black text-emerald-950 hover:bg-emerald-100 sm:min-h-[56px] sm:rounded-[22px] sm:px-5 lg:hidden"
                >
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
          <div className="mt-4 lg:hidden">
            <CatalogFilterPanel {...filterPanelProps} />
          </div>
        )}

        {isCatalogMenuOpen && (
          <>
            <div
              className="eg-overlay fixed inset-0 z-30 bg-emerald-950/20 backdrop-blur-[2px]"
              onClick={closeCatalogMenu}
            />

            <div className="eg-menu eg-glass fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+7.5rem)] top-24 z-40 w-auto overflow-y-auto rounded-[28px] border border-white/70 shadow-2xl shadow-emerald-950/10 lg:absolute lg:left-0 lg:top-full lg:bottom-auto lg:mt-4 lg:w-full lg:overflow-hidden lg:rounded-[34px]">
              <div className="grid lg:min-h-[460px] lg:grid-cols-[360px_1fr]">
                <div className="bg-stone-50/80 p-3 backdrop-blur sm:p-5">
                  <button
                    type="button"
                    onClick={resetCatalogFilters}
                    className={`eg-button mb-3 flex w-full items-center justify-between rounded-[24px] px-5 py-4 text-left font-black ${
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
                          className={`eg-button flex w-full items-center justify-between rounded-[20px] px-3 py-3 text-left sm:rounded-[24px] sm:px-4 sm:py-4 ${
                            isPreviewed
                              ? "bg-emerald-100 text-emerald-950 shadow-sm"
                              : "text-stone-900 hover:bg-white/95"
                          }`}
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xs font-black shadow-sm ${
                                isPreviewed
                                  ? "bg-white text-emerald-900"
                                  : "bg-white/85 text-emerald-900"
                              }`}
                            >
                              {mark}
                            </span>

                            <span className="truncate text-sm font-black uppercase tracking-wide">
                              {category.name}
                            </span>
                          </span>

                          <span className="ml-3 flex items-center gap-2">
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
          <div className="eg-stagger mb-8 grid gap-4 sm:grid-cols-2 lg:hidden">
            <button
              type="button"
              onClick={() => {
                setSelectedSubcategory("all");
                setCurrentPage(1);
              }}
              className={`eg-button eg-premium-card min-h-[76px] rounded-[24px] px-6 py-4 text-left text-sm font-black uppercase tracking-wide ${
                selectedSubcategory === "all"
                  ? "bg-emerald-900 text-white shadow-lg shadow-emerald-900/20"
                  : "bg-white text-stone-950 shadow-sm hover:bg-emerald-50"
              }`}
            >
              Усі товари категорії
            </button>

            {activeSubcategories.map((subcategory) => (
              <button
                key={subcategory.id}
                type="button"
                onClick={() => {
                  setSelectedSubcategory(subcategory.id);
                  setCurrentPage(1);
                }}
                className={`eg-button eg-premium-card min-h-[76px] rounded-[24px] px-6 py-4 text-left text-sm font-black uppercase tracking-wide ${
                  selectedSubcategory === subcategory.id
                    ? "bg-emerald-900 text-white shadow-lg shadow-emerald-900/20"
                    : "bg-white text-stone-950 shadow-sm hover:bg-emerald-50"
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
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {Array.from({ length: totalProductPages }, (_, index) => {
                const page = index + 1;

                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`eg-button h-10 min-w-10 rounded-xl px-3 text-sm font-bold ${
                      currentPage === page
                        ? "bg-emerald-900 text-white shadow-lg shadow-emerald-900/20"
                        : "bg-white text-stone-700 shadow-sm hover:bg-stone-100"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
