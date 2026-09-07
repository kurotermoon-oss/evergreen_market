import { useMemo, useRef } from "react";

import ProductCard from "../components/ProductCard.jsx";
import { getRandomItems } from "../utils/products.js";

import HomeIntro from "../components/storefront/HomeIntro.jsx";

function getVisibleSubcategories(category) {
  return (category?.subcategories || []).filter((subcategory) => {
    return subcategory.active !== false;
  });
}

function getSubcategoryLabel(count) {
  if (!count) return "Товари розділу";
  if (count === 1) return "1 підкатегорія";
  if (count > 1 && count < 5) return `${count} підкатегорії`;
  return `${count} підкатегорій`;
}

export default function HomeView({
  setView,
  openCategory,
  popularProducts = [],
  categories = [],
  cartItems = [],
  addToCart,
  changeQuantity,
  removeFromCart,
  openProduct,
}) {
  const popularCarouselRef = useRef(null);

  const shownPopularProducts = useMemo(() => {
    const activePopularProducts = popularProducts.filter((product) => {
      return product.active !== false;
    });

    return getRandomItems(activePopularProducts, 6);
  }, [popularProducts]);

  const shownCategories = useMemo(() => {
    return categories
      .filter((category) => category.id !== "all")
      .filter((category) => category.active !== false)
      .slice(0, 6);
  }, [categories]);

  function scrollPopularCarousel(direction) {
    if (!popularCarouselRef.current) return;

    popularCarouselRef.current.scrollBy({
      left: direction === "next" ? 360 : -360,
      behavior: "smooth",
    });
  }

  return (
    <main>
      <HomeIntro setView={setView} />

      {/* CATEGORIES */}
      {shownCategories.length > 0 && (
        <section className="shop-home-sections mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-700">
                Категорії
              </p>

              <h2 className="mt-2 text-3xl font-black text-stone-950">
                Що можна замовити
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setView("catalog")}
              className="eg-button eg-sweep w-fit rounded-2xl bg-emerald-900 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800 hover:shadow-md hover:shadow-emerald-900/20"
            >
              Весь каталог
            </button>
          </div>

          <div className="eg-stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shownCategories.map((category) => {
              const subcategories = getVisibleSubcategories(category);
              const previewSubcategories = subcategories.slice(0, 3);

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => openCategory?.(category.id)}
                  className="eg-card eg-premium-card group relative min-h-[170px] overflow-hidden rounded-[1.6rem] border border-emerald-100/70 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/10"
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_34%),linear-gradient(135deg,rgba(236,253,245,0.7),rgba(255,255,255,0.35)_52%,rgba(255,251,235,0.4))] opacity-70 transition group-hover:opacity-100" />
                  <div className="pointer-events-none absolute bottom-0 right-0 h-24 w-24 translate-x-8 translate-y-8 rounded-full border border-emerald-100 bg-emerald-50/60" />

                  <div className="relative z-10 flex h-full min-h-[130px] flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-800 ring-1 ring-emerald-100">
                        {getSubcategoryLabel(subcategories.length)}
                      </span>

                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-900 text-white shadow-sm transition group-hover:translate-x-1 group-hover:bg-emerald-800">
                        →
                      </span>
                    </div>

                    <p className="mt-5 text-base font-black uppercase leading-6 tracking-wide text-emerald-950">
                      {category.name}
                    </p>

                    <div className="mt-auto pt-5">
                      {previewSubcategories.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {previewSubcategories.map((subcategory) => (
                            <span
                              key={subcategory.id}
                              className="rounded-full bg-white/85 px-3 py-1 text-xs font-bold text-stone-600 ring-1 ring-stone-200"
                            >
                              {subcategory.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm font-semibold text-stone-500">
                          Переглянути товари категорії
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* POPULAR PRODUCTS */}
      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-700">
              Популярне
            </p>

            <h2 className="mt-2 text-3xl font-black text-stone-950">
              Часто замовляють
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
              Товари, які найчастіше додають у замовлення або які ми
              рекомендуємо гостям Evergreen coffee.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {shownPopularProducts.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => scrollPopularCarousel("prev")}
                  className="eg-icon-button h-11 w-11 rounded-2xl border border-stone-300 bg-white text-lg font-black text-stone-900 hover:bg-stone-100"
                  aria-label="Попередні товари"
                >
                  ←
                </button>

                <button
                  type="button"
                  onClick={() => scrollPopularCarousel("next")}
                  className="eg-icon-button h-11 w-11 rounded-2xl border border-stone-300 bg-white text-lg font-black text-stone-900 hover:bg-stone-100"
                  aria-label="Наступні товари"
                >
                  →
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setView("catalog")}
              className="eg-button rounded-2xl border border-stone-300 bg-white px-5 py-3 text-sm font-black text-stone-900 hover:bg-stone-100"
            >
              Увесь каталог
            </button>
          </div>
        </div>

        {shownPopularProducts.length > 0 ? (
          <div
            ref={popularCarouselRef}
            className="eg-stagger flex snap-x gap-6 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {shownPopularProducts.map((product) => (
              <div
                key={product.id}
                className="min-w-[280px] max-w-[330px] snap-start sm:min-w-[300px]"
              >
                <ProductCard
                  product={product}
                  categories={categories}
                  cartItems={cartItems}
                  addToCart={addToCart}
                  changeQuantity={changeQuantity}
                  removeFromCart={removeFromCart}
                  openProduct={openProduct}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="eg-panel rounded-[2rem] bg-white p-8 text-center text-stone-500 shadow-sm">
            Популярні товари поки не визначені.
          </div>
        )}
      </section>

      {/* CONTACT CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="eg-ambient eg-panel overflow-hidden rounded-[2rem] bg-emerald-900 p-8 text-white shadow-sm lg:p-10">
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-100">
                Завітайте до нас
              </p>

              <h2 className="mt-3 text-3xl font-black">
                Evergreen coffee на Білицькій
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50">
                Заберіть замовлення самостійно в кавʼярні. Карта, графік
                роботи та контакти — на окремій сторінці. Повідомимо, коли ваше замовлення буде готове.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setView("contacts")}
                className="eg-button rounded-2xl bg-white px-5 py-3 text-sm font-black text-emerald-950 hover:bg-emerald-50"
              >
                Адреса та контакти
              </button>

              <a
                href="https://t.me/EvergreeenCofee"
                target="_blank"
                rel="noopener noreferrer"
                className="eg-button rounded-2xl border border-white/30 px-5 py-3 text-center text-sm font-black text-white hover:bg-white/10"
              >
                Написати в Telegram
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
