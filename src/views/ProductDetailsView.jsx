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
    <div className="grid grid-cols-[0.9fr_1.1fr] gap-4 border-b border-stone-200 px-0 py-4 text-sm last:border-b-0">
      <span className="text-stone-500">{label}</span>
      <span className="text-right font-bold text-stone-950">{value}</span>
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
        <div className="rounded-[2rem] bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-black text-stone-950">
            Товар не знайдено
          </h1>

          <p className="mt-3 text-stone-600">
            Можливо, товар було видалено або він більше не доступний.
          </p>

          <button
            type="button"
            onClick={() => setView("catalog")}
            className="mt-6 rounded-2xl bg-emerald-900 px-6 py-3 font-bold text-white hover:bg-emerald-800"
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
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-stone-500">
        <button
          type="button"
          onClick={() => setView("home")}
          className="hover:text-emerald-800"
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

        <span className="text-stone-700">{category}</span>

        <span>/</span>

        <span className="line-clamp-1 font-semibold text-stone-950">
          {product.name}
        </span>
      </nav>

      <button
        type="button"
        onClick={() => setView("catalog")}
        className="mb-6 rounded-2xl border border-stone-300 bg-white px-5 py-3 text-sm font-black text-stone-950 transition hover:bg-stone-100"
      >
        ← Назад до каталогу
      </button>

      <section className="grid gap-8 rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm lg:grid-cols-[0.95fr_1.05fr] lg:p-8">
        <div className="relative flex min-h-[360px] items-center justify-center rounded-[2rem] bg-stone-50 p-6 lg:min-h-[520px]">
          {discountPercent && (
            <span className="absolute left-5 top-5 rounded-full bg-red-600 px-4 py-2 text-sm font-black text-white shadow-sm">
              -{discountPercent}%
            </span>
          )}

          {!available && (
            <span className="absolute right-5 top-5 rounded-full bg-stone-900 px-4 py-2 text-sm font-black text-white shadow-sm">
              Немає в наявності
            </span>
          )}

          <img
            src={product.image}
            alt={product.name}
            className="max-h-[460px] max-w-full object-contain"
          />
        </div>

        <div className="flex flex-col justify-center">
          <p className="text-sm font-black uppercase tracking-wide text-emerald-700">
            {category}
            {product.brand ? ` · ${product.brand}` : ""}
          </p>

          <h1 className="mt-3 text-3xl font-black leading-tight text-stone-950 sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex rounded-full px-4 py-2 text-sm font-bold ${stockTone}`}
            >
              {available ? "✓ " : ""}
              {stockLabel}
            </span>

            {subcategory && (
              <span className="rounded-full bg-stone-100 px-4 py-2 text-sm font-bold text-stone-600">
                {subcategory}
              </span>
            )}
          </div>

          <div className="mt-7 rounded-[1.75rem] border border-stone-200 p-5 sm:p-6">
            <div className="flex flex-wrap items-end gap-3">
              <p className="text-4xl font-black text-stone-950">
                {formatUAH(product.price)}
              </p>

              {product.oldPrice &&
                Number(product.oldPrice) > Number(product.price) && (
                  <p className="pb-1 text-lg text-stone-400 line-through">
                    {formatUAH(product.oldPrice)}
                  </p>
                )}

              {discountPercent && (
                <span className="mb-1 rounded-full bg-red-50 px-3 py-1 text-sm font-black text-red-600">
                  Вигода -{discountPercent}%
                </span>
              )}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-stone-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-stone-500">
                  Обʼєм / кількість
                </p>

                <p className="mt-1 text-base font-black text-stone-950">
                  {unit}
                </p>
              </div>

              <div className="rounded-2xl bg-stone-50 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-stone-500">
                  Упаковка
                </p>

                <p className="mt-1 text-base font-black text-stone-950">
                  {packageInfo}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-emerald-50 p-4">
              <p className="text-sm font-black text-emerald-950">
                Отримання замовлення
              </p>

              <div className="mt-3 grid gap-2 text-sm text-emerald-900">
                <p>✓ Самовивіз з Evergreen coffee</p>
                <p>✓ Доставка по ЖК</p>
                <p>✓ Підтвердження замовлення перед оплатою</p>
              </div>
            </div>

            <div className="mt-5">
              {cartQty > 0 ? (
                <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
                  <div className="flex items-center overflow-hidden rounded-2xl bg-emerald-900 text-white">
                    <button
                      type="button"
                      onClick={handleDecrease}
                      className="px-5 py-4 text-lg font-black transition hover:bg-emerald-800"
                      aria-label="Зменшити кількість"
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
                      className="px-5 py-4 text-lg font-black transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-400"
                      aria-label="Збільшити кількість"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setView("cart")}
                    className="rounded-2xl border border-emerald-900 bg-white px-7 py-4 text-base font-black text-emerald-950 transition hover:bg-emerald-50"
                  >
                    У кошику · перейти
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!available}
                  className={`w-full rounded-2xl px-7 py-4 text-base font-black text-white transition ${
                    available
                      ? "bg-emerald-900 hover:bg-emerald-800"
                      : "cursor-not-allowed bg-stone-400"
                  }`}
                >
                  {available ? "🛒 Додати в кошик" : "Немає в наявності"}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.72fr]">
        <div className="space-y-8">
          <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm lg:p-8">
            <h2 className="text-2xl font-black text-stone-950">
              Опис товару
            </h2>

            <p className="mt-4 whitespace-pre-line text-base leading-8 text-stone-700">
              {description}
            </p>
          </section>

          <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm lg:p-8">
            <h2 className="text-2xl font-black text-stone-950">
              Чому варто обрати
            </h2>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {benefitItems.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl bg-stone-50 p-4 text-sm font-semibold leading-6 text-stone-700"
                >
                  ✓ {item}
                </div>
              ))}
            </div>
          </section>

          {(product.composition ||
            product.allergens ||
            product.storageConditions) && (
            <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm lg:p-8">
              <h2 className="text-2xl font-black text-stone-950">
                Додаткова інформація
              </h2>

              {product.composition && (
                <div className="mt-5">
                  <h3 className="font-black text-stone-950">Склад</h3>
                  <p className="mt-2 whitespace-pre-line leading-7 text-stone-700">
                    {product.composition}
                  </p>
                </div>
              )}

              {product.allergens && (
                <div className="mt-5">
                  <h3 className="font-black text-stone-950">Алергени</h3>
                  <p className="mt-2 whitespace-pre-line leading-7 text-stone-700">
                    {product.allergens}
                  </p>
                </div>
              )}

              {product.storageConditions && (
                <div className="mt-5">
                  <h3 className="font-black text-stone-950">
                    Умови зберігання
                  </h3>
                  <p className="mt-2 whitespace-pre-line leading-7 text-stone-700">
                    {product.storageConditions}
                  </p>
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="space-y-8">
          <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm lg:p-8">
            <h2 className="text-2xl font-black text-stone-950">
              Характеристики
            </h2>

            <div className="mt-5">
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

          <section className="rounded-[2rem] border border-emerald-100 bg-emerald-950 p-6 text-white shadow-sm lg:p-8">
            <h2 className="text-xl font-black">
              Evergreen coffee поруч з домом
            </h2>

            <p className="mt-3 text-sm leading-7 text-emerald-50">
              Додайте товари в кошик, залиште контактні дані, і ми підтвердимо
              замовлення перед оплатою.
            </p>

            <button
              type="button"
              onClick={() => setView("cart")}
              className="mt-5 w-full rounded-2xl bg-white px-5 py-3 font-black text-emerald-950 transition hover:bg-emerald-50"
            >
              Перейти до кошика
            </button>
          </section>
        </aside>
      </section>

      {similarProducts.length > 0 && (
        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-stone-950">
                Схожі товари
              </h2>

              <p className="mt-1 text-sm text-stone-500">
                Інші позиції з цієї категорії
              </p>
            </div>

            <button
              type="button"
              onClick={() => setView("catalog")}
              className="hidden rounded-2xl border border-stone-300 px-5 py-3 text-sm font-bold text-stone-900 hover:bg-stone-100 sm:block"
            >
              До каталогу
            </button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
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
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}