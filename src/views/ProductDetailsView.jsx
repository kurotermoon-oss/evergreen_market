import ProductCard from "../components/ProductCard.jsx";
import { formatUAH } from "../utils/formatUAH.js";

export default function ProductDetailsView({
  product,
  categories,
  products,
  addToCart,
  setView,
  setSelectedProduct,
}) {
  if (!product) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10">
        <p>Товар не знайдено.</p>
        <button onClick={() => setView("catalog")}>Повернутися до каталогу</button>
      </main>
    );
  }

  const category =
    categories.find((item) => item.id === product.category)?.name || "Товар";

  const similarProducts = products
    .filter((item) => item.category === product.category && item.id !== product.id)
    .slice(0, 3);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => setView("catalog")}
        className="mb-6 rounded-2xl border border-stone-300 px-5 py-3 font-bold hover:bg-stone-100"
      >
        ← Назад до каталогу
      </button>

      <section className="grid gap-8 rounded-[2rem] bg-white p-6 shadow-sm lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
        <div className="flex min-h-[420px] items-center justify-center rounded-[2rem] bg-stone-50 p-8">
          <img
            src={product.image}
            alt={product.name}
            className="max-h-[520px] max-w-full object-contain"
          />
        </div>

        <div>
          <p className="text-sm font-black uppercase tracking-wide text-emerald-700">
            {category}
          </p>

          <h1 className="mt-3 text-4xl font-black leading-tight text-stone-950">
            {product.name}
          </h1>

          <p className="mt-4 inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-800">
            ✓ Доступно для замовлення
          </p>

          <div className="mt-7 rounded-3xl border border-stone-200 p-6">
            <div className="flex flex-wrap items-end gap-4">
              <p className="text-4xl font-black text-red-600">
                {formatUAH(product.price)}
              </p>

              {product.oldPrice && (
                <p className="pb-1 text-lg text-stone-400 line-through">
                  {formatUAH(product.oldPrice)}
                </p>
              )}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-stone-50 p-4">
                <p className="text-xs font-bold uppercase text-stone-500">
                  Обʼєм / кількість
                </p>
                <p className="mt-1 font-black text-stone-950">
                  {product.unit || "1 шт"}
                </p>
              </div>

              <div className="rounded-2xl bg-stone-50 p-4">
                <p className="text-xs font-bold uppercase text-stone-500">
                  Упаковка
                </p>
                <p className="mt-1 font-black text-stone-950">
                  {product.packageInfo || "продається поштучно"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => addToCart(product)}
              className="mt-6 w-full rounded-2xl bg-yellow-300 px-7 py-4 text-lg font-black text-stone-950 hover:bg-yellow-400"
            >
              🛒 Додати в кошик
            </button>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.75fr]">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm lg:p-8">
          <h2 className="text-2xl font-black text-stone-950">Опис товару</h2>

          <p className="mt-4 text-base leading-8 text-stone-700">
            {product.details ||
              product.description ||
              "Детальний опис товару буде додано пізніше."}
          </p>

          <h3 className="mt-8 text-xl font-black text-stone-950">
            Чому варто обрати
          </h3>

          <ul className="mt-4 space-y-3 text-stone-700">
            {(product.benefits || [
              "Зручно замовити без реєстрації",
              "Можна забрати в Evergreen coffee",
              "Ми підтвердимо замовлення перед оплатою",
            ]).map((item) => (
              <li key={item} className="rounded-2xl bg-stone-50 p-4">
                ✓ {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[2rem] bg-white p-6 shadow-sm lg:p-8">
          <h2 className="text-2xl font-black text-stone-950">Характеристики</h2>

          <div className="mt-5 divide-y divide-stone-200 rounded-3xl border border-stone-200">
            {[
              ["Категорія", category],
              ["Обʼєм / кількість", product.unit || "1 шт"],
              ["Упаковка", product.packageInfo || "продається поштучно"],
              ["Статус", "Доступно для замовлення"],
              ["Склад", product.composition || "інформація уточнюється"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex justify-between gap-4 px-5 py-4 text-sm"
              >
                <span className="text-stone-500">{label}</span>
                <span className="text-right font-bold text-stone-950">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {similarProducts.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-5 text-2xl font-black text-stone-950">
            Схожі товари
          </h2>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {similarProducts.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                categories={categories}
                addToCart={addToCart}
                openProduct={(selected) => {
                  setSelectedProduct(selected);
                  setView("product");
                }}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}