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

export default function CatalogView({
  categories,
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

  const pageTitle =
    selectedCategory === "all"
      ? "Каталог товарів"
      : activeCategory?.name || "Каталог товарів";

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
      className="scroll-mt-24 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
    >
      <section className="relative mb-10">
        <div className="eg-glass eg-premium-card rounded-[2rem] p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <button
              type="button"
              onClick={() =>
                isCatalogMenuOpen ? closeCatalogMenu() : openCatalogMenu()
              }
              className="eg-button eg-sweep flex w-full items-center justify-center gap-3 rounded-[28px] bg-emerald-900 px-7 py-4 text-base font-black text-white shadow-sm hover:bg-emerald-800 hover:shadow-md hover:shadow-emerald-900/20 lg:w-[320px]"
            >
              <span className="text-xl leading-none">
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
                className="eg-field min-h-[56px] flex-1 rounded-[28px] border border-white/80 bg-white/80 px-6 text-base outline-none backdrop-blur focus:border-emerald-700"
              />

              <div className="flex flex-wrap gap-3">
                <input
                  value={minPrice}
                  onChange={(event) => {
                    setMinPrice(event.target.value);
                    setCurrentPage(1);
                  }}
                  type="number"
                  placeholder="від"
                  className="eg-field min-h-[56px] w-28 rounded-[22px] border border-white/80 bg-white/80 px-5 outline-none backdrop-blur focus:border-emerald-700"
                />

                <input
                  value={maxPrice}
                  onChange={(event) => {
                    setMaxPrice(event.target.value);
                    setCurrentPage(1);
                  }}
                  type="number"
                  placeholder="до"
                  className="eg-field min-h-[56px] w-28 rounded-[22px] border border-white/80 bg-white/80 px-5 outline-none backdrop-blur focus:border-emerald-700"
                />

                <select
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="eg-field min-h-[56px] rounded-[22px] border border-white/80 bg-white/80 px-5 outline-none backdrop-blur focus:border-emerald-700"
                >
                  <option value="default">За замовчуванням</option>
                  <option value="price-asc">Спочатку дешевші</option>
                  <option value="price-desc">Спочатку дорожчі</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {isCatalogMenuOpen && (
          <>
            <div
              className="eg-overlay fixed inset-0 z-30 bg-emerald-950/20 backdrop-blur-[2px]"
              onClick={closeCatalogMenu}
            />

            <div className="eg-menu eg-glass absolute left-0 top-full z-40 mt-4 w-full overflow-hidden rounded-[34px] border border-white/70 shadow-2xl shadow-emerald-950/10">
              <div className="grid min-h-[460px] lg:grid-cols-[360px_1fr]">
                <div className="bg-stone-50/80 p-5 backdrop-blur">
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
                      const mark = CATEGORY_MARKS[category.id] || "•";
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
                          className={`eg-button flex w-full items-center justify-between rounded-[24px] px-4 py-4 text-left ${
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

                <div className="bg-white/90 p-7 backdrop-blur">
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

      <section className="mb-10">
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

        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <h1 className="text-4xl font-black uppercase tracking-wide text-stone-950">
            {pageTitle}
          </h1>

          <span className="w-fit rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-950">
            {totalProducts} товарів
          </span>
        </div>

        {selectedCategory !== "all" && activeSubcategories.length > 0 && (
          <div className="eg-stagger mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <section>
        {visibleProducts.length > 0 ? (
          <div className="eg-stagger grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
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
              onClick={resetCatalogFilters}
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
    </main>
  );
}