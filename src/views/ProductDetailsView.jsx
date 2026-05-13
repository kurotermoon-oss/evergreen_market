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

function normalizeTextList(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\n|;|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
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
}) {
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
        String(item.id) !== String(product.id)
      );
    })
    .slice(0, 3);

  const benefits = normalizeTextList(product.benefits);

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

  return (
    <main className="eg-ambient mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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

      <button
        type="button"
        onClick={() => setView("catalog")}
        className="eg-button mb-6 rounded-2xl border border-stone-300 bg-white/80 px-5 py-3 text-sm font-black text-stone-950 backdrop-blur hover:bg-white"
      >
        ← Назад до каталогу
      </button>

      {/* PRODUCT HERO */}

      <section className="eg-glass eg-premium-card min-w-0 overflow-hidden rounded-[2.4rem] p-5 lg:p-8">
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
            <p
              className={`text-sm font-black uppercase tracking-[0.22em] text-emerald-700 ${SAFE_TEXT_CLASS}`}
            >
              {category}
              {product.brand ? ` · ${product.brand}` : ""}
            </p>

            <h1
              className={`mt-4 text-4xl font-black leading-tight text-stone-950 sm:text-5xl ${SAFE_TEXT_CLASS}`}
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

              {/* DELIVERY */}

              <div className="eg-panel mt-6 rounded-2xl bg-emerald-50 p-5">
                <p className="text-sm font-black text-emerald-950">
                  Отримання замовлення
                </p>

                <div className="mt-3 grid gap-2 text-sm text-emerald-900">
                  <p>✓ Самовивіз з Evergreen coffee</p>
                  <p>✓ Доставка по ЖК</p>
                  <p>✓ Підтвердження перед оплатою</p>
                </div>
              </div>

              {/* ACTIONS */}

              <div className="mt-6">
                {cartQty > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
                    <div className="flex items-center overflow-hidden rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
                      <button
                        type="button"
                        onClick={handleDecrease}
                        className="eg-counter-button px-5 py-4 text-lg font-black hover:bg-emerald-800"
                      >
                        −
                      </button>

                      <span className="min-w-12 px-2 text-center text-base font-black">
                        {cartQty}
                      </span>

                      <button
                        type="button"
                        onClick={handleIncrease}
                        disabled={!available}
                        className="eg-counter-button px-5 py-4 text-lg font-black hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-400"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setView("cart")}
                      className="eg-button rounded-2xl border border-emerald-900 bg-white px-7 py-4 text-base font-black text-emerald-950 hover:bg-emerald-50"
                    >
                      У кошику · перейти
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleAdd}
                    disabled={!available}
                    className={`eg-button eg-sweep w-full rounded-2xl px-7 py-4 text-base font-black text-white ${
                      available
                        ? "bg-emerald-900 hover:bg-emerald-800 hover:shadow-lg hover:shadow-emerald-900/20"
                        : "cursor-not-allowed bg-stone-400"
                    }`}
                  >
                    {available
                      ? "🛒 Додати в кошик"
                      : "Немає в наявності"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

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

          <section className="eg-premium-card relative min-w-0 overflow-hidden rounded-[2rem] bg-emerald-950 p-6 text-white shadow-xl shadow-emerald-950/20 lg:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_40%)]" />

            <div className="relative z-10 min-w-0">
              <h2 className={`text-xl font-black ${SAFE_TEXT_CLASS}`}>
                Evergreen coffee поруч
              </h2>

              <p
                className={`mt-3 text-sm leading-7 text-emerald-50 ${SAFE_TEXT_CLASS}`}
              >
                Додайте товари в кошик, залиште контактні дані, і ми
                підтвердимо замовлення перед оплатою.
              </p>

              <button
                type="button"
                onClick={() => setView("cart")}
                className="eg-button mt-5 w-full rounded-2xl bg-white px-5 py-3 font-black text-emerald-950 hover:bg-emerald-50"
              >
                Перейти до кошика
              </button>
            </div>
          </section>
        </aside>
      </section>

      {/* SIMILAR PRODUCTS */}

      {similarProducts.length > 0 && (
        <section className="mt-10 min-w-0">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-2xl font-black text-stone-950">
                Схожі товари
              </h2>

              <p className="mt-1 text-sm text-stone-500">
                Інші позиції з цієї категорії
              </p>
            </div>
          </div>

          <div className="eg-stagger grid min-w-0 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {similarProducts.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                categories={categories}
                cartItems={cartItems}
                addToCart={addToCart}
                changeQuantity={changeQuantity}
                removeFromCart={removeFromCart}
                openProduct={(selected) => {
                  setSelectedProduct(selected);
                  setView("product");

                  window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                  });
                }}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}