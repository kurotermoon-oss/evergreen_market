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
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-black text-stone-950">Список товарів</h2>

      <div className="mt-5">
        <input
          value={adminProductQuery}
          onChange={(event) => setAdminProductQuery(event.target.value)}
          className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
          placeholder="Пошук товарів в адмінці..."
        />
      </div>

      {!filteredAdminProducts.length && (
        <div className="mt-6 rounded-3xl bg-stone-50 p-8 text-center text-stone-500">
          Товарів за цим запитом не знайдено.
        </div>
      )}

      <div className="mt-6 space-y-3">
        {filteredAdminProducts.map((product) => (
          <div
            key={product.id}
            className="flex flex-col gap-4 rounded-3xl border border-stone-200 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-center gap-4">
              <img
                src={product.image}
                alt={product.name}
                className="h-16 w-16 rounded-2xl object-cover"
              />

              <div className="min-w-0">
                <p className="truncate font-bold text-stone-950">
                  {product.name}
                </p>

                <p className="text-sm text-stone-500">
                  {formatUAH(product.price)} · собівартість{" "}
                  {formatUAH(product.costPrice || 0)}
                </p>

                <p className="text-xs text-stone-500">
                  {categories.find((item) => item.id === product.category)?.name ||
                    "Без категорії"}{" "}
                  · {getStockLabel(product)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  product.active
                    ? "bg-emerald-100 text-emerald-900"
                    : "bg-stone-200 text-stone-600"
                }`}
              >
                {product.active ? "Активний" : "Схований"}
              </span>

              <button
                type="button"
                onClick={() => startEditProduct(product)}
                className="rounded-2xl border border-stone-300 p-3 text-stone-700 hover:bg-stone-100"
                title="Редагувати товар"
              >
                ✏️
              </button>

              <button
                type="button"
                onClick={() => toggleProductActive(product.id)}
                className="rounded-2xl border border-stone-300 p-3 text-stone-700 hover:bg-stone-100"
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
                className="rounded-2xl border border-red-200 p-3 text-red-600 hover:bg-red-50"
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