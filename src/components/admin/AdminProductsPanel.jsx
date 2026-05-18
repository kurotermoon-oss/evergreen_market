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

function getCategoryLabel(categories, product) {
  const category = categories.find((item) => item.id === product.category);
  const subcategory = category?.subcategories?.find((item) => {
    return item.id === product.subcategory;
  });

  return [category?.name || "Без категорії", subcategory?.name]
    .filter(Boolean)
    .join(" / ");
}

function ProductThumbnail({ product }) {
  const [hasImageError, setHasImageError] = useState(false);
  const hasImage = Boolean(product.image) && !hasImageError;

  return (
    <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 text-emerald-900 shadow-sm sm:h-[72px] sm:w-[72px]">
      {hasImage ? (
        <img
          src={product.image}
          alt={product.name}
          onError={() => setHasImageError(true)}
          className="eg-image h-full w-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center gap-1 text-stone-400">
          <Icon name="package" size={22} />
          <span className="text-[9px] font-black uppercase leading-none">
            Без фото
          </span>
        </div>
      )}
    </div>
  );
}

function ProductActionButton({ children, label, tone = "neutral", onClick }) {
  const toneClasses = {
    neutral:
      "border-stone-200 bg-white text-stone-700 hover:bg-stone-100 hover:text-stone-950",
    green:
      "border-emerald-100 bg-white text-emerald-800 hover:bg-emerald-50 hover:text-emerald-950",
    red: "border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`eg-icon-button grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${toneClasses[tone]} shadow-sm`}
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  );
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

      <div className="eg-stagger mt-6 space-y-2.5">
        {filteredAdminProducts.map((product) => (
          <div
            key={product.id}
            className="eg-card eg-premium-card grid grid-cols-[64px_minmax(0,1fr)] gap-4 rounded-[1.5rem] border border-stone-200 bg-white/88 p-3.5 backdrop-blur transition hover:border-emerald-100 hover:shadow-lg hover:shadow-emerald-900/10 sm:grid-cols-[72px_minmax(0,1fr)] lg:grid-cols-[72px_minmax(0,1fr)_auto] lg:items-center"
          >
            <ProductThumbnail product={product} />

            <div className="min-w-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="line-clamp-2 text-base font-black leading-6 text-stone-950 lg:line-clamp-1">
                    {product.name}
                  </p>

                  <p className="mt-1 truncate text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    {getCategoryLabel(categories, product)}
                  </p>
                </div>

                <span
                  className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-black ring-1 ${
                    product.active !== false
                      ? "bg-emerald-50 text-emerald-900 ring-emerald-200"
                      : "bg-stone-100 text-stone-600 ring-stone-200"
                  }`}
                >
                  {product.active !== false ? "Активний" : "Схований"}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-600">
                <span className="font-black text-stone-950">
                  {formatUAH(product.price)}
                </span>

                <span>
                  Собівартість: {formatUAH(product.costPrice || 0)}
                </span>

                <span>{getStockLabel(product)}</span>
              </div>
            </div>

            <div className="col-span-2 grid grid-cols-3 gap-2 justify-self-start lg:col-span-1 lg:justify-self-end">
              <ProductActionButton
                onClick={() => startEditProduct(product)}
                label="Редагувати товар"
              >
                <Icon name="edit" size={18} />
              </ProductActionButton>

              <ProductActionButton
                onClick={() => toggleProductActive(product.id)}
                label={
                  product.active !== false ? "Сховати товар" : "Показати товар"
                }
                tone="green"
              >
                {product.active !== false ? (
                  <Icon name="eyeOff" size={18} />
                ) : (
                  <Icon name="eye" size={18} />
                )}
              </ProductActionButton>

              <ProductActionButton
                onClick={() => deleteProduct(product.id)}
                label="Видалити товар"
                tone="red"
              >
                <Icon name="trash" size={18} />
              </ProductActionButton>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
