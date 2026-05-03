import { useMemo, useRef } from "react";

import Icon from "../components/Icon.jsx";
import ProductCard from "../components/ProductCard.jsx";
import HeroSection from "../components/HeroSection.jsx";
import { getRandomItems } from "../utils/products.js";


export default function HomeView({
  setView,
  popularProducts = [],
  categories,
  addToCart,
  openProduct,
}) {
  const popularCarouselRef = useRef(null);

const shownPopularProducts = useMemo(() => {
  return getRandomItems(popularProducts, 6);
}, [popularProducts]);

  const scrollToLocation = () => {
    document.getElementById("location")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const scrollPopularCarousel = (direction) => {
    if (!popularCarouselRef.current) return;

    popularCarouselRef.current.scrollBy({
      left: direction === "next" ? 360 : -360,
      behavior: "smooth",
    });
  };

  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-stone-200 bg-gradient-to-br from-stone-50 via-white to-emerald-50">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-700">
              Кава та смаколики поруч
            </p>

            <h1 className="mt-5 max-w-3xl text-5xl font-black leading-tight text-stone-950 sm:text-6xl">
              Evergreen coffee
            </h1>

            <p className="mt-5 max-w-2xl text-xl leading-8 text-stone-700">
              Свіжа кава, напої та товари для дому. Замовляйте онлайн —
              забирайте самостійно або отримуйте доставку.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/80 p-4 shadow-sm ring-1 ring-stone-200">
                <p className="text-2xl">☕</p>
                <p className="mt-2 font-black text-stone-950">
                  Самовивіз
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  Замовте заздалегідь і заберіть без черги.
                </p>
              </div>

              <div className="rounded-3xl bg-white/80 p-4 shadow-sm ring-1 ring-stone-200">
                <p className="text-2xl">🏡</p>
                <p className="mt-2 font-black text-stone-950">
                  Локальна доставка
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  Привеземо замовлення просто до вас.
                </p>
              </div>

              <div className="rounded-3xl bg-white/80 p-4 shadow-sm ring-1 ring-stone-200">
                <p className="text-2xl">💳</p>
                <p className="mt-2 font-black text-stone-950">
                  Оплата після підтвердження
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  Спочатку підтверджуємо замовлення, потім — оплата.
                </p>
              </div>

              <div className="rounded-3xl bg-white/80 p-4 shadow-sm ring-1 ring-stone-200">
                <p className="text-2xl">✨</p>
                <p className="mt-2 font-black text-stone-950">
                  Без обовʼязкової реєстрації
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  Замовляйте як гість або збережіть історію в кабінеті.
                </p>
              </div>
            </div>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setView("catalog")}
                className="rounded-2xl bg-emerald-900 px-7 py-4 text-base font-black text-white shadow-sm transition hover:bg-emerald-800"
              >
                Перейти до каталогу
              </button>

              <button
                type="button"
                onClick={scrollToLocation}
                className="rounded-2xl border border-stone-300 bg-white px-7 py-4 text-base font-black text-stone-900 transition hover:bg-stone-100"
              >
                Як нас знайти
              </button>
            </div>
          </div>

          <div className="relative hidden items-center justify-center lg:flex">
            <div className="absolute h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl" />

            <div className="relative w-full max-w-md rounded-[2rem] bg-white p-5 shadow-xl ring-1 ring-stone-200">
              <div className="overflow-hidden rounded-[1.5rem] bg-stone-100">
                <img
                  src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80"
                  alt="Evergreen coffee"
                  className="h-80 w-full object-cover"
                />
              </div>

              <div className="mt-5 rounded-3xl bg-emerald-950 p-5 text-white">
                <p className="text-sm text-emerald-100">
                  Місце, де час зупиняється на один ковток.
                </p>

                <p className="mt-3 text-2xl font-black">
                  Кава поруч, коли вона потрібна.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">
            Як це працює
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-stone-50 p-5">
              <p className="text-3xl font-black text-emerald-900">1</p>
              <h3 className="mt-3 text-lg font-black text-stone-950">
                Оберіть товари
              </h3>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Додайте каву, напої або продукти до кошика.
              </p>
            </div>

            <div className="rounded-3xl bg-stone-50 p-5">
              <p className="text-3xl font-black text-emerald-900">2</p>
              <h3 className="mt-3 text-lg font-black text-stone-950">
                Залиште контакти
              </h3>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Реєстрація необовʼязкова, але кабінет збереже вашу історію.
              </p>
            </div>

            <div className="rounded-3xl bg-stone-50 p-5">
              <p className="text-3xl font-black text-emerald-900">3</p>
              <h3 className="mt-3 text-lg font-black text-stone-950">
                Отримайте замовлення
              </h3>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Заберіть самостійно або чекайте на доставку.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* POPULAR PRODUCTS */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">
              Популярне
            </p>

            <h2 className="mt-3 text-4xl font-black text-stone-950">
              Товари, які швидко додати в кошик
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-500">
              Добірка може змінюватися при наступному переході на головну або
              після оновлення сторінки.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => scrollPopularCarousel("prev")}
              className="rounded-2xl border border-stone-300 bg-white px-4 py-3 font-black text-stone-900 transition hover:bg-stone-100"
              aria-label="Попередні популярні товари"
            >
              ←
            </button>

            <button
              type="button"
              onClick={() => scrollPopularCarousel("next")}
              className="rounded-2xl border border-stone-300 bg-white px-4 py-3 font-black text-stone-900 transition hover:bg-stone-100"
              aria-label="Наступні популярні товари"
            >
              →
            </button>

            <button
              type="button"
              onClick={() => setView("catalog")}
              className="rounded-2xl border border-stone-300 bg-white px-6 py-3 font-black text-stone-900 transition hover:bg-stone-100"
            >
              Увесь каталог
            </button>
          </div>
        </div>

        {shownPopularProducts.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center text-stone-500 shadow-sm">
            Популярні товари ще не додані.
          </div>
        ) : (
          <div
            ref={popularCarouselRef}
            className="flex snap-x gap-6 overflow-x-auto pb-4"
          >
            {shownPopularProducts.map((product) => (
              <div
                key={product.id}
                className="min-w-[280px] snap-start sm:min-w-[320px] lg:min-w-[300px]"
              >
                <ProductCard
                  product={product}
                  categories={categories}
                  addToCart={addToCart}
                  openProduct={openProduct}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* LOCATION */}
      <section
        id="location"
        className="scroll-mt-24 border-t border-stone-200 bg-white"
      >
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">
              Де ми
            </p>

            <h2 className="mt-3 text-3xl font-black text-stone-950">
              Evergreen coffee на Білицькій
            </h2>

            <p className="mt-4 leading-7 text-stone-600">
              Київ, Подільський район, вул. Білицька 20. Зупиніться на каву
              по дорозі або замовте доставку — ми поруч.
            </p>

            <div className="mt-6 rounded-3xl bg-stone-50 p-5">
              <p className="font-black text-stone-950">Контакти</p>
              <p className="mt-2 text-stone-600">Telegram: @EvergreeenCofee</p>
              <p className="mt-2 text-stone-600">Номер телефону: +380 99 759 23 67</p>
              <p className="mt-1 text-stone-600">
                Instagram: Evergreen coffee
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] bg-stone-100 p-6">
            <p className="text-sm font-bold text-stone-500">Орієнтир</p>
            <p className="mt-2 text-2xl font-black text-stone-950">
              Затишна кавʼярня у вашому районі
            </p>
            <p className="mt-3 leading-7 text-stone-600">
              Тут можна буде додати карту, фото входу або коротку інструкцію,
              як знайти нас.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}