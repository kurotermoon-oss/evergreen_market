import { useEffect, useRef, useState } from "react";
import { ShoppingBasket } from "lucide-react";
import Icon from "../components/Icon.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { formatUAH } from "../utils/formatUAH.js";
import {
  getDiscountPercent,
  getProductPackage,
  getProductUnit,
  getStockLabel,
  getStockTone,
  isProductAvailable,
} from "../utils/products.js";
import { parseTextList } from "../utils/textList.js";

const SAFE_TEXT_CLASS = "min-w-0 break-words [overflow-wrap:anywhere]";

function getCategoryName(categories, categoryId) {
  return categories.find((item) => item.id === categoryId)?.name || "Товар";
}

function getSubcategoryName(categories, product) {
  if (!product?.subcategory) return "";

  const category = categories.find((item) => item.id === product.category);

  const subcategory = category?.subcategories?.find(
    (item) => item.id === product.subcategory
  );

  return subcategory?.name || "";
}

function InfoRow({ label, value }) {
  if (!value) return null;

  return (
    <div className="grid min-w-0 grid-cols-[0.9fr_1.1fr] gap-4 border-b border-stone-200/70 px-0 py-4 text-sm last:border-b-0">
      <span className={`font-medium text-stone-500 ${SAFE_TEXT_CLASS}`}>
        {label}
      </span>

      <span
        className={`text-right font-black text-stone-950 ${SAFE_TEXT_CLASS}`}
      >
        {value}
      </span>
    </div>
  );
}

export default function ProductDetailsView({
  product,
  categories = [],
  products = [],
  cartItems = [],
  addToCart,
  changeQuantity,
  removeFromCart,
  setView,
  setSelectedProduct,
  isAdmin = false,
  onAdminEditProduct,
  onCartOpen,
}) {
  const similarCarouselRef = useRef(null);
  const inlineActionsRef = useRef(null);
  const [activeSimilarIndex, setActiveSimilarIndex] = useState(0);
  const [showFloatingActions, setShowFloatingActions] = useState(true);

  useEffect(() => {
    const node = inlineActionsRef.current;

    if (!product || !node || typeof IntersectionObserver === "undefined") {
      setShowFloatingActions(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowFloatingActions(!entry.isIntersecting);
      },
      {
        threshold: 0.35,
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [product?.id]);

  if (!product) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="eg-glass rounded-[2rem] p-8">
          <h1 className="text-2xl font-black text-stone-950">
            Товар не знайдено
          </h1>

          <p className="mt-3 text-stone-600">
            Можливо, товар було видалено або він більше не доступний.
          </p>

          <button
            type="button"
            onClick={() => setView("catalog")}
            className="eg-button eg-sweep mt-6 rounded-2xl bg-emerald-900 px-6 py-3 font-bold text-white hover:bg-emerald-800 hover:shadow-md hover:shadow-emerald-900/20"
          >
            Повернутися до каталогу
          </button>
        </div>
      </main>
    );
  }

  const category = getCategoryName(categories, product.category);
  const subcategory = getSubcategoryName(categories, product);

  const unit = getProductUnit(product);
  const packageInfo = getProductPackage(product);

  const available = isProductAvailable(product);

  const stockLabel = getStockLabel(product);
  const stockTone = getStockTone(product);
  const isSupplierOrder = product.fulfillmentType === "supplier_order";
  const supplierName = product.supplier?.name || "";

  const discountPercent = getDiscountPercent(product);

  const cartItem = cartItems.find((item) => {
    return (
      String(item.id) === String(product.id) ||
      String(item.productId) === String(product.id)
    );
  });

  const cartQty = Number(cartItem?.quantity || 0);

  const similarProducts = products
    .filter((item) => {
      return (
        item.active !== false &&
        item.category === product.category &&
        item.fulfillmentType === product.fulfillmentType &&
        (product.fulfillmentType !== "supplier_order" ||
          String(item.supplierId || "") === String(product.supplierId || "")) &&
        String(item.id) !== String(product.id)
      );
    })
    .slice(0, 8);

  const activeSimilarProductIndex = Math.min(
    activeSimilarIndex,
    Math.max(similarProducts.length - 1, 0)
  );

  const benefits = parseTextList(product.benefits);

  const defaultBenefits = [
    "Зручно замовити без обовʼязкової реєстрації",
    "Можна забрати в Evergreen coffee",
    "Доступна доставка по ЖК",
    "Ми підтвердимо замовлення перед оплатою",
  ];

  const benefitItems = benefits.length ? benefits : defaultBenefits;

  const description =
    product.details ||
    product.description ||
    "Детальний опис товару буде додано пізніше.";

  function handleAdd() {
    if (!available) return;

    addToCart?.(product);
  }

  function handleIncrease() {
    if (!available) return;

    addToCart?.(product);
  }

  function handleDecrease() {
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

  function handleAdminEdit() {
    onAdminEditProduct?.(product);
  }

  function handleOpenCart() {
    if (onCartOpen) {
      onCartOpen();
      return;
    }

    setView("cart");
  }

  function renderPurchaseActions(isFloating = false) {
    if (cartQty > 0) {
      return (
        <div
          className={`grid gap-3 ${
            isFloating
              ? "grid-cols-[7.25rem_minmax(0,1fr)] gap-2"
              : "grid-cols-[8.25rem_minmax(0,1fr)] gap-2 sm:grid-cols-[auto_1fr] sm:gap-3"
          }`}
        >
          <div
            className={`flex h-14 w-full items-center overflow-hidden rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20 ${
              isFloating ? "max-w-[7.25rem]" : "max-w-[8.25rem]"
            }`}
          >
            <button
              type="button"
              onClick={handleDecrease}
              className="eg-counter-button flex h-full w-10 shrink-0 items-center justify-center text-lg font-black hover:bg-emerald-800 sm:w-12"
              aria-label="Зменшити кількість"
            >
              <Icon name="minus" size={15} />
            </button>

            <span
              className={`flex h-full min-w-0 flex-1 items-center justify-center px-1 text-center font-black ${
                isFloating ? "text-sm" : "text-base"
              }`}
            >
              {cartQty}
            </span>

            <button
              type="button"
              onClick={handleIncrease}
              disabled={!available}
              className="eg-counter-button flex h-full w-10 shrink-0 items-center justify-center text-lg font-black hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-400 sm:w-12"
              aria-label="Збільшити кількість"
            >
              <Icon name="plus" size={15} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenCart}
            className={`eg-button flex h-14 min-w-0 items-center justify-center gap-2 rounded-2xl border border-emerald-900 bg-white font-black text-emerald-950 hover:bg-emerald-50 ${
              isFloating ? "px-3 text-sm" : "px-3 text-sm sm:px-7 sm:text-base"
            }`}
          >
            <ShoppingBasket size={isFloating ? 17 : 19} strokeWidth={2.05} />
            <span className="truncate sm:hidden">У кошик</span>
            <span className="hidden truncate sm:inline">У кошику · перейти</span>
          </button>
        </div>
      );
    }

    return (
      <button
        type="button"
        onClick={handleAdd}
        disabled={!available}
        className={`eg-button eg-sweep w-full rounded-2xl font-black text-white ${
          isFloating ? "px-5 py-3.5 text-sm" : "px-7 py-4 text-base"
        } ${
          available
            ? "bg-emerald-900 hover:bg-emerald-800 hover:shadow-lg hover:shadow-emerald-900/20"
            : "cursor-not-allowed bg-stone-400"
        }`}
      >
        {available ? (
          <span className="flex items-center justify-center gap-2">
            <ShoppingBasket size={isFloating ? 17 : 19} strokeWidth={2.05} />
            Додати в кошик
          </span>
        ) : (
          "Немає в наявності"
        )}
      </button>
    );
  }

  function scrollSimilarProduct(index) {
    const card = similarCarouselRef.current?.children?.[index];

    if (!card) return;

    card.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });

    setActiveSimilarIndex(index);
  }

  function handleSimilarCarouselScroll(event) {
    const carousel = event.currentTarget;
    const cards = Array.from(carousel.children);

    if (!cards.length) return;

    const nextIndex = cards.reduce(
      (closestIndex, card, index) => {
        const currentDistance = Math.abs(card.offsetLeft - carousel.scrollLeft);
        const closestDistance = Math.abs(
          cards[closestIndex].offsetLeft - carousel.scrollLeft
        );

        return currentDistance < closestDistance ? index : closestIndex;
      },
      0
    );

    setActiveSimilarIndex((currentIndex) =>
      currentIndex === nextIndex ? currentIndex : nextIndex
    );
  }

  return (
    <main className="eg-ambient eg-product-details-page mx-auto max-w-7xl px-4 pb-44 pt-8 sm:px-6 md:pb-32 lg:px-8">
      {/* BREADCRUMBS */}

      <nav className="mb-6 flex min-w-0 flex-wrap items-center gap-2 text-sm text-stone-500">
        <button
          type="button"
          onClick={() => setView("home")}
          className="eg-button rounded-xl px-1 hover:text-emerald-800"
        >
          Головна
        </button>

        <span>/</span>

        <button
          type="button"
          onClick={() => setView("catalog")}
          className="hover:text-emerald-800"
        >
          Каталог
        </button>

        <span>/</span>

        <span className={SAFE_TEXT_CLASS}>{category}</span>

        <span>/</span>

        <span
          className={`line-clamp-1 font-semibold text-stone-950 ${SAFE_TEXT_CLASS}`}
        >
          {product.name}
        </span>
      </nav>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setView("catalog")}
          className="eg-button w-fit rounded-2xl border border-stone-300 bg-white/80 px-5 py-3 text-sm font-black text-stone-950 backdrop-blur hover:bg-white"
        >
          ← Назад до каталогу
        </button>

        {isAdmin && (
          <div className="eg-glass flex min-w-0 flex-col gap-2 rounded-[1.35rem] border border-emerald-100 bg-white/85 p-2 shadow-sm sm:flex-row sm:items-center">
            <span className="px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
              Адмін
            </span>

            <button
              type="button"
              onClick={handleAdminEdit}
              className="eg-button eg-sweep inline-flex items-center justify-center gap-2 rounded-[1.1rem] bg-emerald-900 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/20 hover:bg-emerald-800"
            >
              <Icon name="edit" size={17} />
              <span>Редагувати товар</span>
            </button>
          </div>
        )}
      </div>

      {/* PRODUCT HERO */}

      <section className="eg-glass eg-premium-card min-w-0 overflow-hidden rounded-[2.4rem] p-5 lg:p-8">
        <div className="mb-5 min-w-0 lg:hidden">
          <p
            className={`text-xs font-black uppercase tracking-[0.2em] text-emerald-700 ${SAFE_TEXT_CLASS}`}
          >
            {category}
            {product.brand ? ` · ${product.brand}` : ""}
          </p>

          <h1
            className={`mt-3 text-3xl font-medium leading-tight text-stone-950 ${SAFE_TEXT_CLASS}`}
          >
            {product.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black ${stockTone}`}
            >
              {available ? "✓ " : ""}
              {stockLabel}
            </span>

            {subcategory && (
              <span
                className={`rounded-full bg-white/80 px-3 py-1.5 text-xs font-black text-stone-700 ring-1 ring-stone-200 ${SAFE_TEXT_CLASS}`}
              >
                {subcategory}
              </span>
            )}
          </div>
        </div>

        <div className="grid min-w-0 gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          {/* IMAGE */}

          <div className="relative min-w-0">
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-emerald-100/70 via-white to-amber-50 blur-3xl" />

            <div className="eg-steam relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-stone-50 via-white to-emerald-50/40 p-6 lg:min-h-[620px]">
              {discountPercent && (
                <span className="absolute left-5 top-5 z-20 rounded-full bg-red-600 px-4 py-2 text-sm font-black text-white shadow-lg">
                  -{discountPercent}%
                </span>
              )}

              {!available && (
                <span className="absolute right-5 top-5 z-20 rounded-full bg-stone-900 px-4 py-2 text-sm font-black text-white shadow-lg">
                  Немає в наявності
                </span>
              )}

              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08),transparent_60%)]" />

              <img
                src={product.image}
                alt={product.name}
                className="eg-image relative z-10 max-h-[520px] max-w-full object-contain drop-shadow-[0_24px_60px_rgba(0,0,0,0.18)] hover:scale-[1.04]"
              />
            </div>
          </div>

          {/* INFO */}

          <div className="flex min-w-0 flex-col justify-center">
            <div className="hidden min-w-0 lg:block">
            <p
              className={`text-sm font-black uppercase tracking-[0.22em] text-emerald-700 ${SAFE_TEXT_CLASS}`}
            >
              {category}
              {product.brand ? ` · ${product.brand}` : ""}
            </p>

            <h1
              className={`mt-4 text-4xl font-medium leading-tight text-stone-950 sm:text-5xl ${SAFE_TEXT_CLASS}`}
            >
              {product.name}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex rounded-full px-4 py-2 text-sm font-black ${stockTone}`}
              >
                {available ? "✓ " : ""}
                {stockLabel}
              </span>

              {subcategory && (
                <span
                  className={`rounded-full bg-white/80 px-4 py-2 text-sm font-black text-stone-700 ring-1 ring-stone-200 ${SAFE_TEXT_CLASS}`}
                >
                  {subcategory}
                </span>
              )}

              {isSupplierOrder && supplierName && (
                <span
                  className={`rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-800 ring-1 ring-blue-100 ${SAFE_TEXT_CLASS}`}
                >
                  {supplierName}
                  {product.supplier?.minOrderAmount
                    ? ` · мінімум ${formatUAH(product.supplier.minOrderAmount)}`
                    : ""}
                </span>
              )}
            </div>
            </div>

            {/* PRICE BLOCK */}

            <div className="eg-premium-card mt-8 min-w-0 rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-lg shadow-emerald-900/5 backdrop-blur">
              <div className="flex flex-wrap items-end gap-3">
                <p className="text-5xl font-black tracking-tight text-stone-950">
                  {formatUAH(product.price)}
                </p>

                {product.oldPrice &&
                  Number(product.oldPrice) > Number(product.price) && (
                    <p className="pb-2 text-xl text-stone-400 line-through">
                      {formatUAH(product.oldPrice)}
                    </p>
                  )}
              </div>

              {discountPercent > 0 && (
                <div className="mt-4 inline-flex rounded-full bg-red-50 px-4 py-2 text-sm font-black text-red-600">
                  Вигода -{discountPercent}%
                </div>
              )}

              <div className="eg-stagger mt-6 grid min-w-0 gap-3 sm:grid-cols-2">
                <div className="eg-card min-w-0 rounded-2xl bg-stone-50/90 p-4 hover:bg-emerald-50/60">
                  <p className="text-xs font-black uppercase tracking-wide text-stone-500">
                    Обʼєм / кількість
                  </p>

                  <p
                    className={`mt-1 text-base font-black text-stone-950 ${SAFE_TEXT_CLASS}`}
                  >
                    {unit}
                  </p>
                </div>

                <div className="eg-card min-w-0 rounded-2xl bg-stone-50/90 p-4 hover:bg-emerald-50/60">
                  <p className="text-xs font-black uppercase tracking-wide text-stone-500">
                    Упаковка
                  </p>

                  <p
                    className={`mt-1 text-base font-black text-stone-950 ${SAFE_TEXT_CLASS}`}
                  >
                    {packageInfo}
                  </p>
                </div>
              </div>

              {/* ACTIONS */}

              <div ref={inlineActionsRef} className="mt-6">
                {renderPurchaseActions()}
              </div>
            </div>
          </div>
        </div>
      </section>

      {showFloatingActions && (
        <div className="eg-product-floating-actions fixed z-[80] md:z-[110]">
          <div className="rounded-[1.45rem] border border-white/75 bg-white/95 p-2 shadow-[0_18px_46px_rgba(6,78,59,0.22)] backdrop-blur-2xl">
            {renderPurchaseActions(true)}
          </div>
        </div>
      )}

      {/* CONTENT */}

      <section className="eg-stagger mt-8 grid min-w-0 gap-8 lg:grid-cols-[1fr_0.72fr]">
        <div className="min-w-0 space-y-8">
          <section className="eg-glass min-w-0 rounded-[2rem] p-6 lg:p-8">
            <h2 className="text-2xl font-black text-stone-950">
              Опис товару
            </h2>

            <p
              className={`mt-4 whitespace-pre-line text-base leading-8 text-stone-700 ${SAFE_TEXT_CLASS}`}
            >
              {description}
            </p>
          </section>

          <section className="eg-glass min-w-0 rounded-[2rem] p-6 lg:p-8">
            <h2 className="text-2xl font-black text-stone-950">
              Чому варто обрати
            </h2>

            <div className="eg-stagger mt-5 grid min-w-0 gap-3 sm:grid-cols-2">
              {benefitItems.map((item) => (
                <div
                  key={item}
                  className={`eg-card min-w-0 rounded-2xl bg-stone-50/90 p-4 text-sm font-semibold leading-6 text-stone-700 hover:bg-emerald-50/60 ${SAFE_TEXT_CLASS}`}
                >
                  ✓ {item}
                </div>
              ))}
            </div>
          </section>

          {(product.composition ||
            product.allergens ||
            product.storageConditions) && (
            <section className="eg-glass min-w-0 rounded-[2rem] p-6 lg:p-8">
              <h2 className="text-2xl font-black text-stone-950">
                Додаткова інформація
              </h2>

              {product.composition && (
                <div className="mt-5 min-w-0">
                  <h3 className="font-black text-stone-950">Склад</h3>

                  <p
                    className={`mt-2 whitespace-pre-line leading-7 text-stone-700 ${SAFE_TEXT_CLASS}`}
                  >
                    {product.composition}
                  </p>
                </div>
              )}

              {product.allergens && (
                <div className="mt-5 min-w-0">
                  <h3 className="font-black text-stone-950">Алергени</h3>

                  <p
                    className={`mt-2 whitespace-pre-line leading-7 text-stone-700 ${SAFE_TEXT_CLASS}`}
                  >
                    {product.allergens}
                  </p>
                </div>
              )}

              {product.storageConditions && (
                <div className="mt-5 min-w-0">
                  <h3 className="font-black text-stone-950">
                    Умови зберігання
                  </h3>

                  <p
                    className={`mt-2 whitespace-pre-line leading-7 text-stone-700 ${SAFE_TEXT_CLASS}`}
                  >
                    {product.storageConditions}
                  </p>
                </div>
              )}
            </section>
          )}
        </div>

        {/* SIDEBAR */}

        <aside className="min-w-0 space-y-8">
          <section className="eg-glass min-w-0 rounded-[2rem] p-6 lg:p-8">
            <h2 className="text-2xl font-black text-stone-950">
              Характеристики
            </h2>

            <div className="mt-5 min-w-0">
              <InfoRow label="Категорія" value={category} />
              <InfoRow label="Підкатегорія" value={subcategory} />
              <InfoRow label="Бренд" value={product.brand} />
              <InfoRow label="Обʼєм / кількість" value={unit} />
              <InfoRow label="Упаковка" value={packageInfo} />
              <InfoRow
                label="Країна виробництва"
                value={product.countryOfOrigin}
              />
              <InfoRow label="Тип товару" value={product.productType} />
              <InfoRow label="Статус" value={stockLabel} />
            </div>
          </section>

        </aside>
      </section>

      {/* SIMILAR PRODUCTS */}

      {similarProducts.length > 0 && (
        <section className="mt-10 min-w-0 overflow-hidden">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-2xl font-medium text-stone-950">
                Інші товари обраної категорії
              </h2>

              <p className="mt-1 text-sm text-stone-500">
                Інші позиції з цієї категорії
              </p>
            </div>
          </div>

          <div
            ref={similarCarouselRef}
            onScroll={handleSimilarCarouselScroll}
            className="eg-similar-carousel -mx-4 flex min-w-0 snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-4 pb-4 sm:-mx-6 sm:gap-5 sm:px-6 lg:mx-0 lg:px-0"
            aria-label="Інші товари обраної категорії"
          >
            {similarProducts.map((item, index) => (
              <div
                key={item.id}
                className="w-[78vw] max-w-[320px] shrink-0 snap-center sm:w-[19rem] lg:w-[20rem]"
              >
                <ProductCard
                  product={item}
                  categories={categories}
                  cartItems={cartItems}
                  addToCart={addToCart}
                  changeQuantity={changeQuantity}
                  removeFromCart={removeFromCart}
                  openProduct={(selected) => {
                    setSelectedProduct(selected);
                    setView("product");
                    setActiveSimilarIndex(index);

                    window.scrollTo({
                      top: 0,
                      behavior: "smooth",
                    });
                  }}
                />
              </div>
            ))}
          </div>

          {similarProducts.length > 1 && (
            <div className="mt-2 flex justify-center gap-3">
              {similarProducts.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollSimilarProduct(index)}
                  className={`eg-icon-button h-3 w-3 rounded-full ${
                    index === activeSimilarProductIndex
                      ? "bg-emerald-900 shadow-md shadow-emerald-900/20 ring-4 ring-emerald-100"
                      : "bg-white ring-2 ring-emerald-200 hover:bg-emerald-100 hover:ring-emerald-300"
                  }`}
                  aria-label={`Показати товар ${index + 1}`}
                  aria-current={
                    index === activeSimilarProductIndex ? "true" : undefined
                  }
                />
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
