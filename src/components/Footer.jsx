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

function ContactCard({ href, target, rel, icon, title, children }) {
  const Component = href ? "a" : "div";

  return (
    <Component
      href={href}
      target={target}
      rel={rel}
      className="eg-card eg-premium-card flex min-h-[148px] items-start gap-4 rounded-[2rem] bg-white/75 p-5 shadow-sm ring-1 ring-stone-100 backdrop-blur hover:-translate-y-1 hover:bg-emerald-50/80 hover:shadow-lg hover:shadow-emerald-900/10"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-900 shadow-sm">
        {icon}
      </span>

      <span>
        <span className="block text-base font-black text-stone-950">
          {title}
        </span>

        <span className="mt-2 block text-sm leading-6 text-stone-600">
          {children}
        </span>
      </span>
    </Component>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      id="contacts"
      className="eg-ambient relative mt-0 overflow-hidden border-t border-stone-200 bg-gradient-to-b from-white to-emerald-50/40"
    >
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* TOP BLOCKS */}

        <div className="eg-stagger grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
          {/* BRAND */}

          <div className="eg-glass eg-premium-card rounded-[2.5rem] p-7">
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
              <div className="shrink-0">
                <BrandLogo
                  size="lg"
                  showText={false}
                  animated={true}
                />
              </div>

              <div className="mt-5 sm:ml-6 sm:mt-0">
                <p className="text-3xl font-black tracking-tight text-stone-950">
                  Evergreen coffee
                </p>

                <p className="mt-1 text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                  local coffee · market · cozy place
                </p>

                <p className="mt-5 max-w-xl text-sm leading-7 text-stone-600">
                  Кава, напої та товари поруч з домом. Замовляйте онлайн —
                  забирайте самостійно або оформлюйте локальну доставку.
                </p>
              </div>
            </div>

            <div className="eg-panel eg-premium-card mt-7 rounded-[2rem] bg-white/75 p-6 shadow-sm ring-1 ring-stone-100 backdrop-blur">
              <p className="text-xs font-black uppercase tracking-[0.26em] text-emerald-800">
                Місце, де час зупиняється на один ковток
              </p>

              <p className="mt-4 text-sm leading-7 text-stone-600">
                Evergreen coffee — маленька локальна кавʼярня та маркет для
                щоденних покупок поруч. Ми поєднуємо атмосферу затишної кави
                та швидкі покупки біля дому.
              </p>
            </div>
          </div>

          {/* MAP */}

          <div className="eg-glass eg-premium-card overflow-hidden rounded-[2.5rem] p-7">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-700">
                  Як нас знайти
                </p>

                <h2 className="mt-2 text-3xl font-black text-stone-950">
                  Київ, вул. Білицька 20
                </h2>
              </div>

              <a
                href="https://www.google.com/maps/search/?api=1&query=Київ%2C%20вул.%20Білицька%2020"
                target="_blank"
                rel="noopener noreferrer"
                className="eg-button eg-sweep inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800 hover:shadow-lg hover:shadow-emerald-900/20"
              >
                <Icon name="navigation" size={16} />
                Маршрут
              </a>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-white/70 shadow-lg shadow-emerald-950/5">
              <iframe
                title="Evergreen coffee на карті"
                src="https://www.google.com/maps?q=Київ%2C%20вул.%20Білицька%2020&output=embed"
                className="h-[340px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>

        {/* CONTACTS */}

        <div className="eg-stagger mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ContactCard
            href="tel:+380997592367"
            icon={<Icon name="phone" size={18} />}
            title="Телефон"
          >
            +380 99 759 23 67
          </ContactCard>

          <ContactCard
            href="https://t.me/EvergreeenCofee"
            target="_blank"
            rel="noopener noreferrer"
            icon={<TelegramIcon size={18} />}
            title="Telegram"
          >
            @EvergreeenCofee
          </ContactCard>

          <ContactCard
            href="https://instagram.com/evergreen___coffee/"
            target="_blank"
            rel="noopener noreferrer"
            icon={<InstagramIcon size={18} />}
            title="Instagram"
          >
            evergreen___coffee
          </ContactCard>

          <ContactCard
            icon={<Icon name="clock" size={18} />}
            title="Адреса та графік"
          >
            вул. Білицька 20
            <br />
            Щодня · 08:00–21:00
          </ContactCard>
        </div>

        {/* BOTTOM */}

        <div className="mt-12 border-t border-white/60 pt-6">
          <div className="flex flex-col gap-3 text-center text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <p className="font-medium">
              © {currentYear} Evergreen coffee. Усі права захищені.
            </p>

            <p className="font-medium">
              Самовивіз · Локальна доставка · Замовлення без реєстрації
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}