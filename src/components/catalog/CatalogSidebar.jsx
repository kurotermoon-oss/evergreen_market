import { useMemo } from "react";

const CATEGORY_ICONS = {
  coffee: "☕",
  milk: "🥛",
  "alt-milk": "🌱",
  syrups: "🍯",
  sweets: "🍫",
  snacks: "🥨",
  drinks: "🥤",
};

export default function CatalogSidebar({
  categories = [],
  selectedCategory = "all",
  setSelectedCategory,
  selectedSubcategory = "all",
  setSelectedSubcategory,
}) {
  const visibleCategories = useMemo(() => {
    return categories.filter((category) => category.id !== "all");
  }, [categories]);

  const activeCategory = useMemo(() => {
    return categories.find((category) => category.id === selectedCategory);
  }, [categories, selectedCategory]);

  const subcategories = useMemo(() => {
    if (!activeCategory || selectedCategory === "all") return [];
    return (activeCategory.subcategories || []).filter(
      (subcategory) => subcategory.active !== false
    );
  }, [activeCategory, selectedCategory]);

  function handleCategoryClick(categoryId) {
    setSelectedCategory(categoryId);
    setSelectedSubcategory("all");
  }

  function handleAllProductsClick() {
    setSelectedCategory("all");
    setSelectedSubcategory("all");
  }

  return (
    <aside className="rounded-[32px] border border-stone-200 bg-white p-4 shadow-sm">
      <button
        type="button"
        onClick={handleAllProductsClick}
        className={`mb-4 flex w-full items-center justify-between rounded-[22px] px-5 py-4 text-left text-base font-black transition ${
          selectedCategory === "all"
            ? "bg-emerald-900 text-white"
            : "bg-stone-50 text-stone-900 hover:bg-emerald-50"
        }`}
      >
        <span>Усі товари</span>
        {selectedCategory === "all" && <span>✓</span>}
      </button>

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(220px,1fr)]">
        <div className="space-y-2">
          {visibleCategories.map((category) => {
            const isActive = selectedCategory === category.id;
            const icon = CATEGORY_ICONS[category.id] || "📦";

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => handleCategoryClick(category.id)}
                className={`flex w-full items-center justify-between rounded-[22px] px-4 py-4 text-left transition ${
                  isActive
                    ? "bg-emerald-100 text-emerald-950"
                    : "text-stone-800 hover:bg-stone-50"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-lg shadow-sm">
                    {icon}
                  </span>

                  <span className="truncate text-sm font-black uppercase tracking-wide">
                    {category.name}
                  </span>
                </div>

                {(category.subcategories || []).length > 0 && (
                  <span className="text-lg text-stone-400">›</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="rounded-[28px] bg-stone-50 p-5">
          {selectedCategory === "all" ? (
            <div className="flex h-full min-h-[220px] items-center justify-center rounded-[24px] border border-dashed border-stone-200 bg-white px-6 text-center text-sm leading-6 text-stone-500">
              Оберіть категорію зліва, щоб переглянути підкатегорії.
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
                  Підкатегорії
                </p>

                <h3 className="mt-2 text-lg font-black text-stone-950">
                  {activeCategory?.name || "Категорія"}
                </h3>
              </div>

              {subcategories.length > 0 ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSubcategory("all")}
                    className={`w-full rounded-[18px] px-4 py-3 text-left text-sm font-bold transition ${
                      selectedSubcategory === "all"
                        ? "bg-emerald-900 text-white"
                        : "bg-white text-stone-800 hover:bg-emerald-50"
                    }`}
                  >
                    Усі підкатегорії
                  </button>

                  {subcategories.map((subcategory) => {
                    const isActive = selectedSubcategory === subcategory.id;

                    return (
                      <button
                        key={subcategory.id}
                        type="button"
                        onClick={() => setSelectedSubcategory(subcategory.id)}
                        className={`w-full rounded-[18px] px-4 py-3 text-left text-sm font-semibold transition ${
                          isActive
                            ? "bg-emerald-900 text-white"
                            : "bg-white text-stone-800 hover:bg-emerald-50"
                        }`}
                      >
                        {subcategory.name}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-[220px] items-center justify-center rounded-[24px] border border-dashed border-stone-200 bg-white px-6 text-center text-sm leading-6 text-stone-500">
                  У цій категорії поки немає підкатегорій.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  );
}