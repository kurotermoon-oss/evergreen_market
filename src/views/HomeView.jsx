import { useMemo, useRef } from "react";

import ProductCard from "../components/ProductCard.jsx";
import { getRandomItems } from "../utils/products.js";

import {
  PickupIcon,
  PaymentIcon,
  GuestIcon,
} from "../components/icons/HomeFeatureIcons.jsx";

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

function HeroStepCard({ number, icon, title, text }) {
  return (
    <div className="eg-card rounded-[1.35rem] bg-white/90 p-4 shadow-sm ring-1 ring-emerald-100 hover:bg-emerald-50/60 hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-900 text-sm font-black text-white shadow-md shadow-emerald-900/15">
          {number}
        </div>

        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100">
          {icon}
        </div>
      </div>

      <p className="mt-3 font-black text-stone-950">{title}</p>

      <p className="mt-1 text-sm leading-6 text-stone-500">{text}</p>
    </div>
  );
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
      {/* HERO */}
      <section className="eg-ambient border-b border-emerald-100 bg-gradient-to-b from-emerald-50/70 to-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-20">
          <div className="eg-page">
            <p className="w-fit rounded-full border border-emerald-200 bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-emerald-800 shadow-sm backdrop-blur">
              Кава та товари поруч
            </p>

            <h1 className="mt-5 max-w-3xl text-5xl font-black leading-tight text-stone-950 lg:text-6xl">
              Evergreen coffee
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-stone-600">
              Кава, напої та товари для дому поруч. Замовляйте онлайн і
              забирайте в кавʼярні на Білицькій, 20 без зайвого очікування.
            </p>

            <div className="mt-7 flex flex-wrap gap-2 text-sm font-bold text-emerald-950">
              <span className="rounded-full bg-white/75 px-4 py-2 shadow-sm ring-1 ring-emerald-100 backdrop-blur">
                Самовивіз на Білицькій, 20
              </span>
              <span className="rounded-full bg-white/75 px-4 py-2 shadow-sm ring-1 ring-emerald-100 backdrop-blur">
                Підтвердимо телефоном або в Telegram
              </span>
              <span className="rounded-full bg-white/75 px-4 py-2 shadow-sm ring-1 ring-emerald-100 backdrop-blur">
                Без обовʼязкової реєстрації
              </span>
            </div>

            <div className="mt-5 rounded-[1.35rem] border border-emerald-200 bg-white/80 p-4 text-sm leading-6 text-stone-600 shadow-sm backdrop-blur">
              <p className="font-black text-emerald-950">
                Доставка скоро повернеться
              </p>

              <p className="mt-1">
                Поки налаштовуємо маршрут, доставку поставили на кавову паузу.
                Зараз замовлення можна забрати в кавʼярні, а ми підготуємо його
                після підтвердження.
              </p>
            </div>

            <div className="eg-stagger mt-8 grid gap-3 md:grid-cols-3">
              <HeroStepCard
                number="1"
                icon={<GuestIcon />}
                title="Оберіть товари"
                text="Кава, напої та товари для дому в одному каталозі."
              />

              <HeroStepCard
                number="2"
                icon={<PaymentIcon />}
                title="Залиште контакт"
                text="Швидко підтвердимо замовлення телефоном або в Telegram."
              />

              <HeroStepCard
                number="3"
                icon={<PickupIcon />}
                title="Заберіть без черги"
                text="Підготуємо покупку в кавʼярні на Білицькій, 20."
              />
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setView("catalog")}
                className="eg-button eg-sweep rounded-2xl bg-emerald-900 px-6 py-4 text-sm font-black text-white hover:bg-emerald-800 hover:shadow-md hover:shadow-emerald-900/20"
              >
                Перейти до каталогу
              </button>

              <button
                type="button"
                onClick={() => setView("contacts")}
                className="eg-button rounded-2xl border border-stone-300 bg-white/80 px-6 py-4 text-sm font-black text-stone-950 backdrop-blur hover:bg-white"
              >
                Як нас знайти
              </button>
            </div>
          </div>

          <div className="lg:justify-self-end">
            <div className="eg-glass eg-premium-card rounded-[2rem] p-4">
              <div className="overflow-hidden rounded-[1.5rem]">
                <img
                  src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200&auto=format&fit=crop"
                  alt="Evergreen coffee"
                  className="h-[340px] w-full object-cover lg:h-[420px]"
                />
              </div>

              <div className="eg-panel mt-4 rounded-[1.5rem] bg-emerald-900 p-6 text-white">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-100">
                  Самовивіз щодня
                </p>

                <p className="mt-3 text-2xl font-black">
                  Білицька, 20 · 09:00-21:00
                </p>

                <p className="mt-2 text-sm leading-6 text-emerald-50">
                  Підтвердимо замовлення і підготуємо його до вашого приходу.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      {shownCategories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
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
                роботи та контакти вже на окремій сторінці, а доставку ми ще
                готуємо до повернення.
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
