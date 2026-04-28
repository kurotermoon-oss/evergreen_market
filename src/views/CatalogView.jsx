import Icon from "../components/Icon.jsx";
import ProductCard from "../components/ProductCard.jsx";

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
  addToCart,
  openProduct,
}) {
  const activeCategory = categories.find(
    (item) => item.id === selectedCategory
  );

  const subcategories = activeCategory?.subcategories || [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      
      {/* HEADER */}
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-black text-stone-950">
            Каталог товарів
          </h1>
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Пошук..."
            className="rounded-2xl border px-4 py-3"
          />

          <input
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            type="number"
            placeholder="від"
            className="rounded-2xl border px-4 py-3 w-24"
          />

          <input
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            type="number"
            placeholder="до"
            className="rounded-2xl border px-4 py-3 w-24"
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-2xl border px-4 py-3"
          >
            <option value="default">Сортування</option>
            <option value="price-asc">Дешеві</option>
            <option value="price-desc">Дорогі</option>
          </select>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">

        {/* SIDEBAR */}
        <aside className="rounded-3xl bg-white p-4 shadow-sm">
          <p className="mb-4 font-bold">Категорії</p>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSelectedSubcategory("all");
              }}
              className={`block w-full text-left px-4 py-3 rounded-xl ${
                selectedCategory === cat.id
                  ? "bg-emerald-900 text-white"
                  : "hover:bg-stone-100"
              }`}
            >
              {cat.name}
            </button>
          ))}

          {/* SUBCATEGORIES */}
          {selectedCategory !== "all" && (
            <div className="mt-6">
              <p className="mb-3 text-sm font-bold text-stone-500">
                Підкатегорії
              </p>

              <button
                onClick={() => setSelectedSubcategory("all")}
                className={`block w-full text-left px-4 py-2 ${
                  selectedSubcategory === "all"
                    ? "font-bold text-emerald-700"
                    : ""
                }`}
              >
                Усі
              </button>

              {subcategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubcategory(sub.id)}
                  className={`block w-full text-left px-4 py-2 ${
                    selectedSubcategory === sub.id
                      ? "font-bold text-emerald-700"
                      : ""
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* PRODUCTS */}
        <section>
          <p className="mb-4 text-sm text-stone-500">
            Знайдено: {totalProducts}
          </p>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {visibleProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                categories={categories}
                addToCart={addToCart}
                openProduct={openProduct}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}