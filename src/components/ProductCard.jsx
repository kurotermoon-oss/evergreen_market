import { formatUAH } from "../utils/formatUAH.js";

export default function ProductCard({
  product,
  categories,
  addToCart,
  openProduct,
}) {
  const category =
    categories.find((item) => item.id === product.category)?.name || "Товар";

  const isOutOfStock = product.stockStatus === "out_of_stock";
  const isLimited = product.stockStatus === "limited";
  const isPreorder = product.stockStatus === "preorder";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <button
        type="button"
        onClick={() => openProduct?.(product)}
        className="relative flex h-56 items-center justify-center bg-white p-5"
      >
        {product.popular && (
          <span className="absolute left-4 top-4 rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white">
            %
          </span>
        )}

        <img
          src={product.image}
          alt={product.name}
          className="max-h-full max-w-full object-contain transition group-hover:scale-105"
        />
      </button>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
            {category}
          </p>

          {/* 🔥 СТАТУС ТОВАРА */}
          {isOutOfStock && (
            <p className="text-xs font-semibold text-red-600">
              Немає в наявності
            </p>
          )}

          {isLimited && (
            <p className="text-xs font-semibold text-orange-500">
              Залишилось: {product.stockQuantity} шт
            </p>
          )}

          {isPreorder && (
            <p className="text-xs font-semibold text-blue-500">
              Під замовлення
            </p>
          )}

          {!isOutOfStock && !isLimited && !isPreorder && (
            <p className="text-xs font-semibold text-emerald-700">
              ✓ в наявності
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => openProduct?.(product)}
          className="text-left"
        >
          <h3 className="line-clamp-2 min-h-[52px] text-base font-bold leading-6 text-stone-950 hover:text-emerald-800">
            {product.name}
          </h3>
        </button>

        <div className="mt-3 space-y-1 text-sm text-stone-500">
          <p>Обʼєм: {product.unit || "1 шт"}</p>
          <p>{product.packageInfo || "продається поштучно"}</p>
        </div>

        <p className="mt-3 line-clamp-2 min-h-[48px] text-sm leading-6 text-stone-600">
          {product.description}
        </p>

        <div className="mt-auto pt-5">
          <div className="mb-4 flex items-end justify-between gap-3">
            <p className="text-2xl font-black text-stone-950">
              {formatUAH(product.price)}
            </p>

            {product.oldPrice && (
              <p className="text-sm text-stone-400 line-through">
                {formatUAH(product.oldPrice)}
              </p>
            )}
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-2">
            <button
              type="button"
              onClick={() => openProduct?.(product)}
              className="rounded-2xl border border-stone-300 px-4 py-3 text-sm font-bold text-stone-900 hover:bg-stone-100"
            >
              Детальніше
            </button>

            {/* 🔥 КНОПКА С ЛОГИКОЙ */}
            <button
              type="button"
              onClick={() => addToCart(product)}
              disabled={isOutOfStock}
              className={`rounded-2xl px-5 py-3 text-sm font-bold text-white ${
                isOutOfStock
                  ? "bg-stone-400 cursor-not-allowed"
                  : "bg-emerald-900 hover:bg-emerald-800"
              }`}
            >
              {isOutOfStock ? "Немає" : "Додати"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}