import { useEffect, useRef, useState } from "react";
import { ShoppingBasket, Package, MapPin, Check } from "lucide-react";
import Icon from "../components/Icon.jsx";
import QuantityControl from "../components/QuantityControl.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { formatUAH } from "../utils/formatUAH.js";
import {
  compareProductAvailability,
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
    <div className="shop-product-fact">
      <dt className={SAFE_TEXT_CLASS}>
        {label}
      </dt>

      <dd className={SAFE_TEXT_CLASS}>
        {value}
      </dd>
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
  const [showFloatingActions, setShowFloatingActions] = useState(false);
  const [pendingQuantity, setPendingQuantity] = useState(1);
  const [failedImage, setFailedImage] = useState(null);

  useEffect(() => {
    setPendingQuantity(1);
  }, [product?.id]);

  useEffect(() => {
    const node = inlineActionsRef.current;

    if (!product || !node || typeof IntersectionObserver === "undefined") {
      setShowFloatingActions(false);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowFloatingActions(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      {
        threshold: 0,
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
  const supplierMinOrderAmount = Number(
    product.supplier?.minOrderAmount || 0
  );

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
    .sort(compareProductAvailability)
    .slice(0, 8);

  const activeSimilarProductIndex = Math.min(
    activeSimilarIndex,
    Math.max(similarProducts.length - 1, 0)
  );

  const benefits = parseTextList(product.benefits);

  const description = String(product.description || "").trim();
  const details = String(product.details || "").trim();
  const showDescription = Boolean(description || details || benefits.length);
  const additionalInfo = [
    ["Склад", product.composition],
    ["Алергени", product.allergens],
    ["Умови зберігання", product.storageConditions ?? product.storage],
  ].filter(([, value]) => String(value || "").trim());

  function scrollBehavior() {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  }

  function handleAdd() {
    if (!available) return;

    const desiredQuantity = Math.max(1, Number(pendingQuantity) || 1);
    const addResult = addToCart?.(product);

    if (addResult === false) return;

    if (desiredQuantity > 1) {
      changeQuantity?.(product.id, desiredQuantity);
    }
  }

  function handleQuantityChange(nextQuantity) {
    if (cartQty > 0) {
      changeQuantity?.(product.id, nextQuantity);
      return;
    }

    setPendingQuantity(nextQuantity);
  }

  function handleQuantityRemove() {
    if (cartQty > 0) {
      if (removeFromCart) {
        removeFromCart(product.id);
      } else {
        changeQuantity?.(product.id, 0);
      }
    }

    setPendingQuantity(1);
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
    const actionQuantity = cartQty > 0 ? cartQty : pendingQuantity;
    const quantityWidthClass = isFloating ? "max-w-[7.25rem]" : "max-w-36";
    const buttonClassName =
      cartQty > 0
        ? `eg-button flex h-14 min-w-0 items-center justify-center gap-2 rounded-2xl border border-emerald-900 bg-white font-black text-emerald-950 hover:bg-emerald-50 ${
            isFloating
              ? "px-3 text-sm"
              : "px-3 text-sm sm:px-7 sm:text-base"
          }`
        : `eg-button eg-sweep flex h-14 min-w-0 items-center justify-center rounded-2xl font-black text-white ${
            isFloating ? "px-4 text-sm" : "px-3 text-sm sm:px-7 sm:text-base"
          } ${
            available
              ? "bg-emerald-900 hover:bg-emerald-800 hover:shadow-lg hover:shadow-emerald-900/20"
              : "cursor-not-allowed bg-stone-400"
          }`;

    return (
      <div
        className={`grid min-w-0 gap-2 ${
          isFloating
            ? "grid-cols-[7.25rem_minmax(0,1fr)]"
            : "grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] sm:gap-3"
        }`}
      >
        <QuantityControl
          value={actionQuantity}
          onChange={handleQuantityChange}
          disabled={!available && cartQty <= 0}
          min={1}
          size={isFloating ? "compact" : "regular"}
          tone="dark"
          className={`w-full ${quantityWidthClass}`}
          ariaLabel="Кількість товару"
          onRemove={cartQty > 0 ? handleQuantityRemove : undefined}
        />

        <button
          type="button"
          onClick={cartQty > 0 ? handleOpenCart : handleAdd}
          disabled={!available && cartQty <= 0}
          className={buttonClassName}
          aria-label={cartQty > 0 ? "Перейти до кошика" : available ? "Додати в кошик" : "Немає в наявності"}
        >
          <span className="flex min-w-0 items-center justify-center gap-2">
            <ShoppingBasket className="shrink-0" size={isFloating ? 17 : 19} strokeWidth={2.05} />
            {cartQty > 0 ? (
              <>
                <span className="sm:hidden">У кошик</span>
                <span className="hidden sm:inline">
                  У кошику · перейти
                </span>
              </>
            ) : available ? (
              <>
                <span className="sm:hidden">Додати</span>
                <span className="hidden sm:inline">Додати в кошик</span>
              </>
            ) : (
              <>
                <span className="sm:hidden">Немає</span>
                <span className="hidden sm:inline">Немає в наявності</span>
              </>
            )}
          </span>
        </button>
      </div>
    );
  }
  function scrollSimilarProduct(index) {
    const card = similarCarouselRef.current?.children?.[index];

    if (!card) return;

    card.scrollIntoView({
      behavior: scrollBehavior(),
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
    <main className="eg-product-details-page shop-product-page mx-auto max-w-7xl px-4 pb-44 pt-6 sm:px-6 md:pb-32 lg:px-8">
      <nav className="shop-product-breadcrumbs" aria-label="Навігація сторінкою">
        <button type="button" onClick={() => setView("catalog")}>← Каталог</button>
        <span aria-hidden="true">/</span>
        <span>{category}</span>
        {subcategory && <><span aria-hidden="true">/</span><span>{subcategory}</span></>}
      </nav>

      {isAdmin && (
        <div className="shop-product-admin">
          <button type="button" onClick={handleAdminEdit} className="eg-button">
            <Icon name="edit" size={17} />
            Редагувати товар
          </button>
        </div>
      )}

      <section className="shop-product-hero" aria-labelledby="product-title">
        <header className="shop-product-heading">
          <p className="shop-product-eyebrow">{product.brand || category}</p>
          <h1 id="product-title">{product.name}</h1>
          <span className={`shop-product-stock ${stockTone}`}>{stockLabel}</span>
        </header>

        <div className="shop-product-media">
          {discountPercent > 0 && <span className="shop-product-discount">−{discountPercent}%</span>}
          {product.image && product.image !== failedImage ? (
            <img key={product.image} src={product.image} alt={product.name} className="shop-product-image"
              onError={() => setFailedImage(product.image)} />
          ) : (
            <div className="shop-product-no-image"><Package size={48} strokeWidth={1} /><span>Фото товару ще немає</span></div>
          )}
        </div>

        <div className="shop-product-purchase">
          <div className="shop-product-price-line">
            <p className="shop-product-price">{formatUAH(product.price)}</p>
            {Number(product.oldPrice) > Number(product.price) && (
              <del className="shop-product-old-price">{formatUAH(product.oldPrice)}</del>
            )}
          </div>
          <p className="shop-product-unit">Обʼєм / кількість: {unit}</p>
          <div className="shop-product-buy" ref={inlineActionsRef}>
            {renderPurchaseActions()}
          </div>

          <div className="shop-product-order-info">
            <Package size={20} strokeWidth={1.6} aria-hidden="true" />
            <div>
              <strong>{isSupplierOrder ? "Замовлення у постачальника" : "Покупка у кавʼярні"}</strong>
              {isSupplierOrder ? (
                <p>{supplierName && <>{supplierName} · </>}
                  {supplierMinOrderAmount > 0
                    ? `Від ${formatUAH(supplierMinOrderAmount)} разом з іншими товарами цього постачальника.`
                    : "Без мінімальної суми замовлення."}</p>
              ) : <p>Без мінімальної суми замовлення.</p>}
            </div>
          </div>
          <div className="shop-product-pickup">
            <MapPin size={20} strokeWidth={1.6} aria-hidden="true" />
            <div><strong>Самовивіз з Evergreen</strong><p>Київ, Білицька, 20 · щодня 09:00–21:00</p></div>
          </div>
        </div>
      </section>

      {showFloatingActions && (
        <div className="eg-product-floating-actions shop-product-floating fixed z-[80] md:z-[110]">
          <div className="shop-product-floating-inner">{renderPurchaseActions(true)}</div>
        </div>
      )}

      <div className={`shop-product-content ${showDescription ? "" : "shop-product-content--single"}`}>
        {showDescription && (
          <section className="shop-product-panel" aria-labelledby="product-description-title">
            <h2 id="product-description-title">Про товар</h2>
            {description && <p className="shop-product-copy">{description}</p>}
            {details && details !== description && <p className="shop-product-copy">{details}</p>}
            {benefits.length > 0 && (
              <div className="shop-product-benefits">
                <h3>Особливості</h3>
                <ul>{benefits.map((item, index) => <li key={index}><Check size={17} aria-hidden="true" /><span>{item}</span></li>)}</ul>
              </div>
            )}
          </section>
        )}

        <section className="shop-product-panel" aria-labelledby="product-facts-title">
          <h2 id="product-facts-title">Характеристики</h2>
          <dl className="shop-product-facts">
            <InfoRow label="Бренд" value={product.brand} />
            <InfoRow label="Обʼєм / кількість" value={unit} />
            <InfoRow label="Упаковка" value={packageInfo} />
            <InfoRow label="Країна виробництва" value={product.countryOfOrigin} />
            <InfoRow label="Тип товару" value={product.productType} />
            <InfoRow label="Категорія" value={category} />
            <InfoRow label="Підкатегорія" value={subcategory} />
          </dl>
          {additionalInfo.map(([label, value]) => (
            <div className="shop-product-additional" key={label}>
              <h3>{label}</h3>
              <p className="shop-product-copy">{value}</p>
            </div>
          ))}
        </section>
      </div>

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
                    setView("product", {
                      productId: selected?.id,
                    });
                    setActiveSimilarIndex(index);

                    window.scrollTo({
                      top: 0,
                      behavior: scrollBehavior(),
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
