import { useMemo, useState } from "react";
import Icon from "../Icon.jsx";
import { formatUAH } from "../../utils/formatUAH.js";

function getStockLabel(product) {
  if (product.stockStatus === "out_of_stock") return "Немає";
  if (product.stockStatus === "limited") {
    return `Залишилось: ${product.stockQuantity || 0}`;
  }
  if (product.stockStatus === "preorder") return "Під замовлення";

  return "В наявності";
}

export default function AdminProductsPanel({
  products,
  categories,
  startEditProduct,
  toggleProductActive,
  deleteProduct,
}) {
  const [adminProductQuery, setAdminProductQuery] = useState("");

  const filteredAdminProducts = useMemo(() => {
    const normalizedQuery = adminProductQuery.toLowerCase().trim();

    return products.filter((product) => {
      const categoryName =
        categories.find((category) => category.id === product.category)?.name ||
        "";

      const searchableText = [
        product.name,
        product.description,
        product.details,
        product.unit,
        product.packageInfo,
        product.price,
        product.costPrice,
        categoryName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return !normalizedQuery || searchableText.includes(normalizedQuery);
    });
  }, [products, categories, adminProductQuery]);

  return (
    <section className="eg-glass eg-premium-card rounded-[2.5rem] p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-700">
            Адмінка
          </p>

          <h2 className="mt-2 text-3xl font-black text-stone-950">
            Список товарів
          </h2>
        </div>

        <span className="w-fit rounded-full bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-950">
          {filteredAdminProducts.length} товарів
        </span>
      </div>

      <div className="mt-6">
        <input
          value={adminProductQuery}
          onChange={(event) => setAdminProductQuery(event.target.value)}
          className="eg-field w-full rounded-[1.4rem] border border-stone-200 bg-white/85 px-5 py-3.5 outline-none backdrop-blur focus:border-emerald-700 focus:bg-white"
          placeholder="Пошук товарів в адмінці..."
        />
      </div>

      {!filteredAdminProducts.length && (
        <div className="eg-panel mt-6 rounded-[2rem] bg-stone-50/90 p-8 text-center text-stone-500">
          Товарів за цим запитом не знайдено.
        </div>
      )}

      <div className="eg-stagger mt-6 space-y-3">
        {filteredAdminProducts.map((product) => (
          <div
            key={product.id}
            className="eg-card eg-premium-card flex flex-col gap-4 rounded-[2rem] border border-stone-200 bg-white/85 p-4 backdrop-blur hover:border-emerald-100 hover:shadow-lg hover:shadow-emerald-900/10 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-center gap-4">
              <img
                src={product.image}
                alt={product.name}
                className="eg-image h-16 w-16 rounded-2xl object-cover hover:scale-[1.05]"
              />

              <div className="min-w-0">
                <p className="truncate font-black text-stone-950">
                  {product.name}
                </p>

                <p className="mt-1 text-sm text-stone-500">
                  {formatUAH(product.price)} · собівартість{" "}
                  {formatUAH(product.costPrice || 0)}
                </p>

                <p className="mt-1 text-xs text-stone-500">
                  {categories.find((item) => item.id === product.category)
                    ?.name || "Без категорії"}{" "}
                  · {getStockLabel(product)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${
                  product.active
                    ? "bg-emerald-50 text-emerald-900 ring-emerald-200"
                    : "bg-stone-100 text-stone-600 ring-stone-200"
                }`}
              >
                {product.active ? "Активний" : "Схований"}
              </span>

              <button
                type="button"
                onClick={() => startEditProduct(product)}
                className="eg-icon-button rounded-2xl border border-stone-200 bg-white/80 p-3 text-stone-700 hover:bg-stone-100"
                title="Редагувати товар"
              >
                ✏️
              </button>

              <button
                type="button"
                onClick={() => toggleProductActive(product.id)}
                className="eg-icon-button rounded-2xl border border-stone-200 bg-white/80 p-3 text-stone-700 hover:bg-emerald-50 hover:text-emerald-900"
                title={product.active ? "Сховати товар" : "Показати товар"}
              >
                {product.active ? (
                  <Icon name="eyeOff" size={18} />
                ) : (
                  <Icon name="eye" size={18} />
                )}
              </button>

              <button
                type="button"
                onClick={() => deleteProduct(product.id)}
                className="eg-icon-button rounded-2xl border border-red-200 bg-white/80 p-3 text-red-600 hover:bg-red-50"
                title="Видалити товар"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}