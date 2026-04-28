import Icon from "../components/Icon.jsx";
import ProductCard from "../components/ProductCard.jsx";

export default function HomeView({ setView, popularProducts, categories, addToCart }) {
  return (
    <main>
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
        <div className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900">
            <Icon name="coffee" size={16} />
            Кава, напої та товари поруч
          </div>

          <div className="space-y-5">
            <h1 className="text-4xl font-black tracking-tight text-stone-950 sm:text-6xl">
              Evergreen coffee & local market
            </h1>

            <p className="max-w-2xl text-lg leading-8 text-stone-600">
              Замовляйте каву, молоко, сиропи, снеки, напої та товари для дому.
              Забирайте в кав’ярні або отримуйте доставку по ЖК.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => setView("catalog")}
              className="rounded-2xl bg-emerald-900 px-6 py-4 font-semibold text-white transition hover:bg-emerald-800"
            >
              Перейти до товарів
            </button>

            <button
              onClick={() => setView("cart")}
              className="rounded-2xl border border-stone-300 px-6 py-4 font-semibold text-stone-900 transition hover:bg-stone-100"
            >
              Відкрити кошик
            </button>
          </div>

          <div className="grid max-w-3xl gap-3 pt-3 sm:grid-cols-3">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-lg font-black text-stone-950">Поруч з домом</p>
              <p className="mt-2 text-xs leading-5 text-stone-500">
                Забирайте замовлення в Evergreen coffee або отримуйте доставку по ЖК.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-lg font-black text-stone-950">Без реєстрації</p>
              <p className="mt-2 text-xs leading-5 text-stone-500">
                Оберіть товари, залиште контакт — і ми зв’яжемось з вами.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-lg font-black text-stone-950">Після підтвердження</p>
              <p className="mt-2 text-xs leading-5 text-stone-500">
                Ми перевіримо замовлення, узгодимо оплату та видачу.
              </p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-4 -top-4 h-36 w-36 rounded-full bg-emerald-200 blur-3xl" />
          <div className="absolute -bottom-6 -right-2 h-36 w-36 rounded-full bg-amber-200 blur-3xl" />

          <div className="relative overflow-hidden rounded-[2.5rem] bg-white p-3 shadow-xl">
            <img
              src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1400&auto=format&fit=crop"
              alt="Evergreen coffee"
              className="h-[520px] w-full rounded-[2rem] object-cover"
            />

            <div className="absolute bottom-8 left-8 right-8 rounded-3xl bg-white/90 p-5 shadow-lg backdrop-blur">
              <p className="font-bold text-stone-950">
                Місце, де час зупиняється на один ковток
              </p>

              <p className="mt-2 text-sm text-stone-600">
                І тепер ще й зручна точка локальних покупок для мешканців ЖК.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Популярне
            </p>

            <h2 className="mt-2 text-3xl font-black text-stone-950">
              Товари, які швидко додати в кошик
            </h2>
          </div>

          <button
            onClick={() => setView("catalog")}
            className="hidden rounded-2xl border border-stone-300 px-4 py-3 text-sm font-semibold text-stone-900 hover:bg-stone-100 sm:block"
          >
            Увесь каталог
          </button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {popularProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              categories={categories}
              addToCart={addToCart}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-3xl bg-emerald-900 p-7 text-white lg:col-span-2">
            <h2 className="text-2xl font-black">Як замовити?</h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-4">
              {[
                "Оберіть товари в каталозі",
                "Додайте їх у кошик",
                "Залиште ім’я та Telegram/телефон",
                "Ми підтвердимо замовлення",
              ].map((item, index) => (
                <div key={item} className="rounded-3xl bg-white/10 p-5">
                  <p className="text-3xl font-black">{index + 1}</p>
                  <p className="mt-3 text-sm font-semibold leading-5">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-7 shadow-sm">
            <h3 className="text-xl font-black text-stone-950">Контакти</h3>

            <div className="mt-5 space-y-4 text-sm text-stone-600">
              <p className="flex items-start gap-3">
                <Icon name="pin" className="mt-0.5 text-emerald-800" size={18} />
                Київ, Подільський район, вул. Білицька 20
              </p>

              <p className="flex items-center gap-3">
                <Icon name="telegram" className="text-emerald-800" size={18} />
                Telegram для замовлень
              </p>

              <p className="flex items-center gap-3">
                <Icon name="instagram" className="text-emerald-800" size={18} />
                Instagram Evergreen coffee
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}