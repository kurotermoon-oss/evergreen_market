import { useMemo, useRef } from "react";

import ProductCard from "../components/ProductCard.jsx";
import { getRandomItems } from "../utils/products.js";

import {
  PickupIcon,
  DeliveryIcon,
  PaymentIcon,
  GuestIcon,
} from "../components/icons/HomeFeatureIcons.jsx";

const CATEGORY_ICONS = {
  coffee: "☕",
  milk: "🥛",
  "alt-milk": "🌱",
  syrups: "🍯",
  sweets: "🍫",
  snacks: "🥨",
  drinks: "🥤",
};

function HeroFeatureCard({ icon, title, text }) {
  return (
    <div className="group rounded-3xl bg-white/90 p-5 shadow-sm ring-1 ring-stone-200 transition duration-200 hover:-translate-y-1 hover:shadow-md hover:ring-emerald-200">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100 transition duration-200 group-hover:bg-emerald-900 group-hover:text-white">
        {icon}
      </div>

      <p className="mt-4 font-black text-stone-950">{title}</p>

      <p className="mt-2 text-sm leading-6 text-stone-500">{text}</p>
    </div>
  );
}

export default function HomeView({
  setView,
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

  function scrollToContacts() {
    document.getElementById("contacts")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

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
      <section className="border-b border-emerald-100 bg-gradient-to-b from-emerald-50/70 to-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8 lg:py-20">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-800">
              Кава та товари поруч
            </p>

            <h1 className="mt-5 max-w-3xl text-5xl font-black leading-tight text-stone-950 lg:text-6xl">
              Evergreen coffee
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-stone-600">
              Свіжа кава, напої та товари для дому. Замовляйте онлайн —
              забирайте самостійно або оформлюйте доставку по ЖК.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <HeroFeatureCard
                icon={<PickupIcon />}
                title="Самовивіз"
                text="Замовте заздалегідь і заберіть у кавʼярні без зайвого очікування."
              />

              <HeroFeatureCard
                icon={<DeliveryIcon />}
                title="Локальна доставка"
                text="Привеземо замовлення просто до вас у межах комплексу."
              />

              <HeroFeatureCard
                icon={<PaymentIcon />}
                title="Оплата після підтвердження"
                text="Спочатку підтвердимо замовлення, а потім ви оплатите його на місці."
              />

              <HeroFeatureCard
                icon={<GuestIcon />}
                title="Без обовʼязкової реєстрації"
                text="Можна оформити замовлення як гість або зберегти історію в кабінеті."
              />
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setView("catalog")}
                className="rounded-2xl bg-emerald-900 px-6 py-4 text-sm font-black text-white transition hover:bg-emerald-800"
              >
                Перейти до каталогу
              </button>

              <button
                type="button"
                onClick={scrollToContacts}
                className="rounded-2xl border border-stone-300 bg-white px-6 py-4 text-sm font-black text-stone-950 transition hover:bg-stone-100"
              >
                Як нас знайти
              </button>
            </div>
          </div>

          <div className="lg:justify-self-end">
            <div className="rounded-[2rem] bg-white p-4 shadow-xl shadow-emerald-900/10">
              <img
                src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200&auto=format&fit=crop"
                alt="Evergreen coffee"
                className="h-[340px] w-full rounded-[1.5rem] object-cover lg:h-[420px]"
              />

              <div className="mt-4 rounded-[1.5rem] bg-emerald-900 p-6 text-white">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-100">
                  Місце, де час зупиняється на один ковток
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
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm lg:p-8">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-700">
            Як це працює
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] bg-stone-50 p-5">
              <p className="text-3xl font-black text-emerald-900">1</p>

              <h3 className="mt-3 font-black text-stone-950">
                Оберіть товари
              </h3>

              <p className="mt-2 text-sm leading-6 text-stone-500">
                Додайте каву, напої або продукти до кошика.
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-stone-50 p-5">
              <p className="text-3xl font-black text-emerald-900">2</p>

              <h3 className="mt-3 font-black text-stone-950">
                Залиште контакти
              </h3>

              <p className="mt-2 text-sm leading-6 text-stone-500">
                Вкажіть телефон або Telegram, щоб ми підтвердили замовлення.
              </p>
            </div>

            <div className="rounded-[1.5rem] bg-stone-50 p-5">
              <p className="text-3xl font-black text-emerald-900">3</p>

              <h3 className="mt-3 font-black text-stone-950">
                Отримайте замовлення
              </h3>

              <p className="mt-2 text-sm leading-6 text-stone-500">
                Заберіть самостійно або замовте доставку по ЖК.
              </p>
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
              className="w-fit rounded-2xl bg-emerald-900 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
            >
              Весь каталог
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shownCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setView("catalog")}
                className="group rounded-[1.5rem] border border-stone-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-50 text-xl group-hover:bg-white">
                    {CATEGORY_ICONS[category.id] || "📦"}
                  </span>

                  <span className="text-stone-300 group-hover:text-emerald-800">
                    →
                  </span>
                </div>

                <p className="mt-4 text-sm font-black uppercase tracking-wide text-emerald-800">
                  {category.name}
                </p>

                <p className="mt-2 text-sm leading-6 text-stone-500">
                  Переглянути товари категорії
                </p>
              </button>
            ))}
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
                  className="h-11 w-11 rounded-2xl border border-stone-300 bg-white text-lg font-black text-stone-900 transition hover:bg-stone-100"
                  aria-label="Попередні товари"
                >
                  ←
                </button>

                <button
                  type="button"
                  onClick={() => scrollPopularCarousel("next")}
                  className="h-11 w-11 rounded-2xl border border-stone-300 bg-white text-lg font-black text-stone-900 transition hover:bg-stone-100"
                  aria-label="Наступні товари"
                >
                  →
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setView("catalog")}
              className="rounded-2xl border border-stone-300 bg-white px-5 py-3 text-sm font-black text-stone-900 transition hover:bg-stone-100"
            >
              Увесь каталог
            </button>
          </div>
        </div>

        {shownPopularProducts.length > 0 ? (
          <div
            ref={popularCarouselRef}
            className="flex snap-x gap-6 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
          <div className="rounded-[2rem] bg-white p-8 text-center text-stone-500 shadow-sm">
            Популярні товари поки не визначені.
          </div>
        )}
      </section>

      {/* CONTACT CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-emerald-900 p-8 text-white shadow-sm lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-100">
                Завітайте до нас
              </p>

              <h2 className="mt-3 text-3xl font-black">
                Evergreen coffee на Білицькій
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50">
                Заберіть замовлення самостійно в кавʼярні або оформіть
                локальну доставку по ЖК. Карта, графік роботи та контакти —
                внизу сторінки.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={scrollToContacts}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-emerald-950 transition hover:bg-emerald-50"
              >
                Адреса та контакти
              </button>

              <a
                href="https://t.me/EvergreeenCofee"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-2xl border border-white/30 px-5 py-3 text-center text-sm font-black text-white transition hover:bg-white/10"
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