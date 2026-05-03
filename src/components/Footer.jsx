import Icon from "./Icon.jsx";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="contacts" className="mt-0 border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.35fr_0.9fr] lg:items-center">
          {/* BRAND */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-emerald-900 text-3xl text-white shadow-sm">
              🌿
            </div>

            <p className="mt-4 text-2xl font-black text-stone-950">
              Evergreen coffee
            </p>

            <p className="mt-1 text-sm font-medium text-stone-500">
              local market
            </p>

            <p className="mt-5 max-w-xs text-sm leading-6 text-stone-600">
              Кава, напої та товари поруч з домом. Самовивіз з кавʼярні або
              доставка по ЖК.
            </p>

            <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-emerald-800">
              Місце, де час зупиняється на один ковток
            </p>
          </div>

          {/* MAP */}
          <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-stone-100 shadow-sm">
            <iframe
              title="Evergreen coffee на карті"
              src="https://www.google.com/maps?q=Київ%2C%20вул.%20Білицька%2020&output=embed"
              className="h-[280px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* CONTACTS */}
          <div className="rounded-[2rem] bg-stone-50 p-6">
            <p className="text-2xl font-black text-stone-950">
              Наші контакти
            </p>

            <div className="mt-5 space-y-4">
              <a
                href="tel:+380997592367"
                className="flex items-start gap-3 rounded-2xl bg-white p-4 text-sm text-stone-700 shadow-sm transition hover:bg-emerald-50 hover:text-emerald-800"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-900">
                  <Icon name="phone" size={16} />
                </span>

                <span>
                  <span className="block font-black text-stone-950">
                    Телефон
                  </span>
                  <span className="mt-1 block">+380 99 759 23 67</span>
                </span>
              </a>

              <a
                href="https://t.me/EvergreeenCofee"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 rounded-2xl bg-white p-4 text-sm text-stone-700 shadow-sm transition hover:bg-emerald-50 hover:text-emerald-800"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-900">
                  <Icon name="send" size={16} />
                </span>

                <span>
                  <span className="block font-black text-stone-950">
                    Telegram
                  </span>
                  <span className="mt-1 block">@EvergreeenCofee</span>
                </span>
              </a>

              <a
                href="https://instagram.com/evergreen___coffee/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 rounded-2xl bg-white p-4 text-sm text-stone-700 shadow-sm transition hover:bg-emerald-50 hover:text-emerald-800"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-900">
                  <Icon name="camera" size={16} />
                </span>

                <span>
                  <span className="block font-black text-stone-950">
                    Instagram
                  </span>
                  <span className="mt-1 block">evergreen___coffee</span>
                </span>
              </a>

              <div className="flex items-start gap-3 rounded-2xl bg-white p-4 text-sm text-stone-700 shadow-sm">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-900">
                  <Icon name="mapPin" size={16} />
                </span>

                <span>
                  <span className="block font-black text-stone-950">
                    Адреса
                  </span>
                  <span className="mt-1 block leading-6">
                    м. Київ, Подільський район,
                    <br />
                    вул. Білицька 20
                  </span>
                </span>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-white p-4 text-sm text-stone-700 shadow-sm">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-900">
                  <Icon name="clock" size={16} />
                </span>

                <span>
                  <span className="block font-black text-stone-950">
                    Графік роботи
                  </span>
                  <span className="mt-1 block">Щодня · 08:00–21:00</span>
                </span>
              </div>
            </div>

            <a
              href="https://www.google.com/maps/search/?api=1&query=Київ%2C%20вул.%20Білицька%2020"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
            >
              <Icon name="navigation" size={16} />
              Прокласти маршрут
            </a>
          </div>
        </div>

        {/* BOTTOM LINE */}
        <div className="mt-10 border-t border-stone-100 pt-6">
          <div className="flex flex-col gap-2 text-center text-xs text-stone-400 sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <p>© {currentYear} Evergreen coffee. Усі права захищені.</p>

            <p>Самовивіз з кавʼярні · Доставка по ЖК · Замовлення без реєстрації</p>
          </div>
        </div>
      </div>
    </footer>
  );
}