import Icon from "./Icon.jsx";
import BrandLogo from "./BrandLogo.jsx";

function TelegramIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M21.94 4.16a1.5 1.5 0 0 0-1.58-.2L3.04 10.7c-1.22.48-1.18 2.22.06 2.63l4.38 1.45 1.68 5.28c.37 1.17 1.84 1.52 2.69.64l2.38-2.47 4.32 3.18c1.05.77 2.55.16 2.77-1.12l2.1-14.63a1.5 1.5 0 0 0-.48-1.5ZM8.15 13.52l9.76-6.05-7.86 7.34-.3 3.24-1.6-4.53Zm3.07 5.18.2-2.1 1.46 1.08-1.66 1.02Z" />
    </svg>
  );
}

function InstagramIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="contacts" className="mt-0 border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
          {/* BRAND CARD */}
          <div className="rounded-[2rem] bg-stone-50 p-6 shadow-sm ring-1 ring-stone-100">
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
              <BrandLogo size="lg" showText={false} animated={true} />

              <div className="mt-5 sm:ml-5 sm:mt-0">
                <p className="text-2xl font-black text-stone-950">
                  Evergreen coffee
                </p>

                <p className="mt-1 text-sm font-medium text-stone-500">
                  local market
                </p>

                <p className="mt-4 max-w-xl text-sm leading-6 text-stone-600">
                  Кава, напої та товари поруч з домом. Можна швидко забрати
                  замовлення у кавʼярні або оформити локальну доставку.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-100">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">
                Місце, де час зупиняється на один ковток
              </p>

              <p className="mt-3 text-sm leading-6 text-stone-600">
                Evergreen coffee — маленька кавʼярня та локальний маркет для
                щоденних покупок поруч.
              </p>
            </div>
          </div>

          {/* MAP CARD */}
          <div className="rounded-[2rem] bg-stone-50 p-6 shadow-sm ring-1 ring-stone-100">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                  Як нас знайти
                </p>

                <p className="mt-1 text-2xl font-black text-stone-950">
                  Київ, вул. Білицька 20
                </p>
              </div>

              <a
                href="https://www.google.com/maps/search/?api=1&query=Київ%2C%20вул.%20Білицька%2020"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
              >
                <Icon name="navigation" size={16} />
                Маршрут
              </a>
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-stone-200 bg-stone-100">
              <iframe
                title="Evergreen coffee на карті"
                src="https://www.google.com/maps?q=Київ%2C%20вул.%20Білицька%2020&output=embed"
                className="h-[320px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>

        {/* CONTACT CARDS */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <a
            href="tel:+380997592367"
            className="flex min-h-[132px] items-start gap-4 rounded-3xl bg-stone-50 p-5 shadow-sm ring-1 ring-stone-100 transition hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-md"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-900">
              <Icon name="phone" size={18} />
            </span>

            <span>
              <span className="block font-black text-stone-950">Телефон</span>
              <span className="mt-2 block text-sm leading-6 text-stone-600">
                +380 99 759 23 67
              </span>
            </span>
          </a>

          <a
            href="https://t.me/EvergreeenCofee"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[132px] items-start gap-4 rounded-3xl bg-stone-50 p-5 shadow-sm ring-1 ring-stone-100 transition hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-md"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-900">
              <TelegramIcon size={18} />
            </span>

            <span>
              <span className="block font-black text-stone-950">Telegram</span>
              <span className="mt-2 block text-sm leading-6 text-stone-600">
                @EvergreeenCofee
              </span>
            </span>
          </a>

          <a
            href="https://instagram.com/evergreen___coffee/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[132px] items-start gap-4 rounded-3xl bg-stone-50 p-5 shadow-sm ring-1 ring-stone-100 transition hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-md"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-900">
              <InstagramIcon size={18} />
            </span>

            <span>
              <span className="block font-black text-stone-950">Instagram</span>
              <span className="mt-2 block text-sm leading-6 text-stone-600">
                evergreen___coffee
              </span>
            </span>
          </a>

          <div className="flex min-h-[132px] items-start gap-4 rounded-3xl bg-stone-50 p-5 shadow-sm ring-1 ring-stone-100">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-900">
              <Icon name="clock" size={18} />
            </span>

            <span>
              <span className="block font-black text-stone-950">
                Адреса та графік
              </span>

              <span className="mt-2 block text-sm leading-6 text-stone-600">
                вул. Білицька 20
                <br />
                Щодня · 08:00–21:00
              </span>
            </span>
          </div>
        </div>

        {/* BOTTOM LINE */}
        <div className="mt-10 border-t border-stone-100 pt-6">
          <div className="flex flex-col gap-2 text-center text-xs text-stone-400 sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <p>© {currentYear} Evergreen coffee. Усі права захищені.</p>

            <p>
              Самовивіз з кавʼярні · Локальна доставка · Замовлення без
              реєстрації
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}