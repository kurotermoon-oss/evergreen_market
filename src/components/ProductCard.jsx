import Icon from "./Icon.jsx";
import { formatUAH } from "../utils/formatUAH.js";
import {
  getCategoryName,
  getDiscountPercent,
  getProductPackage,
  getProductUnit,
  getStockLabel,
  getStockTone,
  isProductPopular,
  isProductAvailable,
} from "../utils/products.js";

function ProductBadges({ discountPercent, popular, available }) {
  const hasDiscount = Number(discountPercent || 0) > 0;

  if (!hasDiscount && !popular && available) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-x-4 top-4 z-20 flex items-start justify-between gap-2">
      <div className="flex flex-col items-start gap-2">
        {hasDiscount && (
          <span className="inline-flex items-center rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white shadow-sm ring-2 ring-white">
            -{discountPercent}%
          </span>
        )}
      </div>

      <div className="flex flex-col items-end gap-2">
        {popular && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-900 px-3 py-1 text-xs font-black text-white shadow-sm ring-2 ring-white">
            <Icon name="popular" size={14} className="text-emerald-100" />
            Популярне
          </span>
        )}

        {!available && (
          <span className="inline-flex items-center rounded-full bg-stone-900 px-3 py-1 text-xs font-black text-white shadow-sm ring-2 ring-white">
            Немає
          </span>
        )}
      </div>
    </div>
  );
}

export default function ProductCard({
  product,
  categories = [],
  cartItems = [],
  addToCart,
  changeQuantity,
  removeFromCart,
  openProduct,
}) {
  const category = getCategoryName(categories, product.category);
  const discountPercent = getDiscountPercent(product);
  const popular = isProductPopular(product);
  const unit = getProductUnit(product);
  const packageInfo = getProductPackage(product);

  const available = isProductAvailable(product);
  const stockLabel = getStockLabel(product);
  const stockTone = getStockTone(product);

  const cartItem = cartItems.find((item) => {
    return (
      String(item.id) === String(product.id) ||
      String(item.productId) === String(product.id)
    );
  });

  const cartQty = Number(cartItem?.quantity || 0);

  function handleAdd(event) {
    event.stopPropagation();

    if (!available) return;

    addToCart?.(product);
  }

  function handleIncrease(event) {
    event.stopPropagation();

    if (!available) return;

    addToCart?.(product);
  }

  function handleDecrease(event) {
    event.stopPropagation();

    if (!cartQty) return;

    const nextQuantity = cartQty - 1;

    if (nextQuantity <= 0) {
      if (removeFromCart) {
        removeFromCart(product.id);
      } else {
        changeQuantity?.(product.id, 0);
      }

      return;
    }

    changeQuantity?.(product.id, nextQuantity);
  }

  function handleImageError(event) {
    event.currentTarget.src = "/logo_evergreen.png";
    event.currentTarget.className =
      "relative z-0 max-h-[72%] max-w-[72%] object-contain opacity-80 transition duration-300 group-hover:scale-[1.03]";
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
      <button
        type="button"
        onClick={() => openProduct?.(product)}
        className="relative flex h-56 w-full items-center justify-center overflow-hidden bg-stone-50 p-5"
        aria-label={`Відкрити товар ${product.name}`}
      >
        <ProductBadges
          discountPercent={discountPercent}
          popular={popular}
          available={available}
        />

        <img
          src={product.image || "/logo_evergreen.png"}
          alt={product.name}
          onError={handleImageError}
          className="relative z-0 max-h-full max-w-full object-contain transition duration-300 group-hover:scale-[1.05]"
        />
      </button>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
              {category}
              {product.brand ? ` · ${product.brand}` : ""}
            </p>
          </div>

          <p
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${stockTone}`}
          >
            {available && <Icon name="success" size={12} />}
            {stockLabel}
          </p>
        </div>

        <button
          type="button"
          onClick={() => openProduct?.(product)}
          className="text-left"
        >
          <h3 className="line-clamp-2 min-h-[52px] text-base font-black leading-6 text-stone-950 transition hover:text-emerald-800">
            {product.name}
          </h3>
        </button>

        <p className="mt-3 min-h-[44px] text-sm leading-6 text-stone-500">
          {unit}
          {packageInfo ? ` · ${packageInfo}` : ""}
        </p>

        <div className="mt-auto pt-5">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div className="flex flex-wrap items-end gap-2">
              <p className="text-2xl font-black text-stone-950">
                {formatUAH(product.price)}
              </p>

              {product.oldPrice &&
                Number(product.oldPrice) > Number(product.price) && (
                  <p className="pb-1 text-sm text-stone-400 line-through">
                    {formatUAH(product.oldPrice)}
                  </p>
                )}
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-2">
            <button
              type="button"
              onClick={() => openProduct?.(product)}
              className="rounded-2xl border border-stone-300 px-4 py-3 text-sm font-bold text-stone-900 transition hover:bg-stone-100"
            >
              Детальніше
            </button>

            {cartQty > 0 ? (
              <div className="flex items-center overflow-hidden rounded-2xl bg-emerald-900 text-white">
                <button
                  type="button"
                  onClick={handleDecrease}
                  className="flex h-full items-center justify-center px-4 py-3 text-sm font-black transition hover:bg-emerald-800"
                  aria-label="Зменшити кількість"
                >
                  <Icon name="minus" size={14} />
                </button>

                <span className="min-w-8 px-1 text-center text-sm font-black">
                  {cartQty}
                </span>

                <button
                  type="button"
                  onClick={handleIncrease}
                  disabled={!available}
                  className="flex h-full items-center justify-center px-4 py-3 text-sm font-black transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-400"
                  aria-label="Збільшити кількість"
                >
                  <Icon name="plus" size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                disabled={!available}
                className={`rounded-2xl px-5 py-3 text-sm font-black text-white transition ${
                  available
                    ? "bg-emerald-900 hover:bg-emerald-800"
                    : "cursor-not-allowed bg-stone-400"
                }`}
              >
                {available ? "Додати" : "Немає"}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}