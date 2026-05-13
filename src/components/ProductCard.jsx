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
    <div className="pointer-events-none absolute inset-x-2 top-2 z-20 flex items-start justify-between gap-2 sm:inset-x-4 sm:top-4">
      <div className="flex flex-col items-start gap-1.5">
        {hasDiscount && (
          <span className="eg-panel inline-flex items-center rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black text-white shadow-sm ring-2 ring-white sm:px-3 sm:py-1 sm:text-xs">
            -{discountPercent}%
          </span>
        )}
      </div>

      <div className="flex flex-col items-end gap-1.5">
        {popular && (
          <span className="eg-panel inline-flex items-center gap-1 rounded-full bg-emerald-900 px-2 py-0.5 text-[10px] font-black text-white shadow-sm ring-2 ring-white sm:px-3 sm:py-1 sm:text-xs">
            <Icon name="popular" size={12} className="text-emerald-100" />
            <span className="hidden min-[420px]:inline">Популярне</span>
          </span>
        )}

        {!available && (
          <span className="eg-panel inline-flex items-center rounded-full bg-stone-900 px-2 py-0.5 text-[10px] font-black text-white shadow-sm ring-2 ring-white sm:px-3 sm:py-1 sm:text-xs">
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
      "eg-image relative z-10 max-h-[72%] max-w-[72%] object-contain opacity-80 group-hover:scale-[1.04]";
  }

  return (
    <article className="eg-card eg-premium-card group flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-stone-200 bg-white shadow-sm hover:border-emerald-100 hover:shadow-lg hover:shadow-emerald-900/10 sm:rounded-3xl">
      <button
        type="button"
        onClick={() => openProduct?.(product)}
        className="relative flex h-36 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-stone-50 via-white to-emerald-50/40 p-3 sm:h-48 sm:p-4 lg:h-56 lg:p-5"
        aria-label={`Відкрити товар ${product.name}`}
      >
        <ProductBadges
          discountPercent={discountPercent}
          popular={popular}
          available={available}
        />

        <div className="pointer-events-none absolute inset-4 rounded-[1.5rem] bg-white/45 blur-2xl transition duration-300 group-hover:bg-emerald-100/50 sm:inset-6 sm:rounded-[2rem]" />

        <img
          src={product.image || "/logo_evergreen.png"}
          alt={product.name}
          onError={handleImageError}
          className="eg-image relative z-10 max-h-full max-w-full object-contain drop-shadow-sm group-hover:scale-[1.06]"
        />
      </button>

      <div className="flex flex-1 flex-col p-3 sm:p-4 lg:p-5">
        <div className="mb-2 flex items-start justify-between gap-2 sm:mb-3">
          <div className="min-w-0">
            <p className="line-clamp-1 text-[10px] font-black uppercase tracking-wide text-emerald-700 sm:text-xs">
              {category}
              {product.brand ? ` · ${product.brand}` : ""}
            </p>
          </div>

          <p
            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold sm:px-2.5 sm:py-1 sm:text-[11px] ${stockTone}`}
          >
            {available && <Icon name="success" size={11} />}
            <span className="max-w-[72px] truncate sm:max-w-none">
              {stockLabel}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => openProduct?.(product)}
          className="text-left"
        >
          <h3 className="line-clamp-2 min-h-[40px] text-sm font-black leading-5 text-stone-950 transition hover:text-emerald-800 sm:min-h-[48px] sm:text-base sm:leading-6">
            {product.name}
          </h3>
        </button>

        <p className="mt-1 line-clamp-1 text-xs leading-5 text-stone-500 sm:mt-2 sm:text-sm">
          {unit}
          {packageInfo ? ` · ${packageInfo}` : ""}
        </p>

        <div className="mt-auto pt-3 sm:pt-5">
          <div className="mb-3 flex min-h-[28px] flex-wrap items-end gap-1.5 sm:mb-4 sm:gap-2">
            <p className="text-lg font-black leading-none text-stone-950 sm:text-2xl">
              {formatUAH(product.price)}
            </p>

            {product.oldPrice &&
              Number(product.oldPrice) > Number(product.price) && (
                <p className="text-xs text-stone-400 line-through sm:pb-1 sm:text-sm">
                  {formatUAH(product.oldPrice)}
                </p>
              )}
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-2">
            <button
              type="button"
              onClick={() => openProduct?.(product)}
              className="eg-button rounded-xl border border-stone-300 px-3 py-2 text-xs font-bold text-stone-900 hover:bg-stone-100 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm"
            >
              Детальніше
            </button>

            {cartQty > 0 ? (
              <div className="flex h-9 items-center overflow-hidden rounded-xl bg-emerald-900 text-white shadow-sm sm:h-11 sm:rounded-2xl">
                <button
                  type="button"
                  onClick={handleDecrease}
                  className="eg-counter-button flex h-9 w-8 items-center justify-center text-sm font-black hover:bg-emerald-800 sm:h-11 sm:w-11"
                  aria-label="Зменшити кількість"
                >
                  <Icon name="minus" size={12} />
                </button>

                <span className="flex h-9 min-w-6 items-center justify-center px-1 text-center text-xs font-black sm:h-11 sm:min-w-8 sm:text-sm">
                  {cartQty}
                </span>

                <button
                  type="button"
                  onClick={handleIncrease}
                  disabled={!available}
                  className="eg-counter-button flex h-9 w-8 items-center justify-center text-sm font-black hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-400 sm:h-11 sm:w-11"
                  aria-label="Збільшити кількість"
                >
                  <Icon name="plus" size={12} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                disabled={!available}
                className={`eg-button eg-sweep rounded-xl px-3 py-2 text-xs font-black text-white sm:rounded-2xl sm:px-5 sm:py-3 sm:text-sm ${
                  available
                    ? "bg-emerald-900 hover:bg-emerald-800 hover:shadow-md hover:shadow-emerald-900/20"
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