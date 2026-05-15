import { useEffect, useState } from "react";
import BrandLogo from "./BrandLogo.jsx";

function HomeIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M4 11.4 12 5l8 6.4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.8 10.4V19h10.4v-8.6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 19v-4h4v4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CatalogIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M4.5 6.5A1.5 1.5 0 0 1 6 5h4.5v6H4.5V6.5ZM13.5 5H18a1.5 1.5 0 0 1 1.5 1.5V11h-6V5ZM4.5 14h6v5h-4.5A1.5 1.5 0 0 1 4.5 17.5V14ZM13.5 14h6v3.5A1.5 1.5 0 0 1 18 19h-4.5v-5Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 5v14M13.5 5v14M4.5 11h15M4.5 14h15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ContactIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="10"
        r="2.2"
        stroke="currentColor"
        strokeWidth="2.2"
      />
    </svg>
  );
}

function UserIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 20a7 7 0 0 1 14 0"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SettingsIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <path
        d="M19 12a7.9 7.9 0 0 0-.1-1.1l2-1.5-2-3.4-2.4 1a8.6 8.6 0 0 0-1.9-1.1L14.3 3h-4.6l-.4 2.9A8.6 8.6 0 0 0 7.5 7l-2.4-1-2 3.4 2 1.5A7.9 7.9 0 0 0 5 12c0 .4 0 .8.1 1.1l-2 1.5 2 3.4 2.4-1c.6.5 1.2.9 1.9 1.1l.4 2.9h4.6l.4-2.9c.7-.3 1.3-.7 1.9-1.1l2.4 1 2-3.4-2-1.5c0-.3.1-.7.1-1.1Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CartIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M4 5h2l1.7 9.2a2 2 0 0 0 2 1.6h6.9a2 2 0 0 0 1.9-1.4L20 8H7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 20h.1M17 20h.1"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Header({
  view,
  setView,
  onContactsClick,
  cartCount = 0,
  isAdmin = false,
  customer = null,
}) {
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    function updateHeader() {
      const currentScrollY = window.scrollY;
      const scrollDifference = currentScrollY - lastScrollY;
      const isMobileViewport = window.matchMedia("(max-width: 767px)").matches;

      setIsScrolled(currentScrollY > 12);

      if (isMobileViewport) {
        setIsHeaderHidden(false);
        lastScrollY = currentScrollY;
        ticking = false;
        return;
      }

      if (currentScrollY < 80) {
        setIsHeaderHidden(false);
      } else if (scrollDifference > 8) {
        setIsHeaderHidden(true);
      } else if (scrollDifference < -8) {
        setIsHeaderHidden(false);
      }

      lastScrollY = currentScrollY;
      ticking = false;
    }

    function handleScroll() {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const navItems = [
    {
      id: "home",
      label: "Головна",
      Icon: HomeIcon,
      isActive: view === "home",
      onClick: () => setView("home"),
    },
    {
      id: "catalog",
      label: "Товари",
      Icon: CatalogIcon,
      isActive: view === "catalog",
      onClick: () => setView("catalog"),
    },
    {
      id: "contacts",
      label: "Контакти",
      Icon: ContactIcon,
      isActive: false,
      onClick: onContactsClick,
    },
    {
      id: "account",
      label: customer ? "Кабінет" : "Увійти",
      Icon: UserIcon,
      isActive: view === "account" || view === "customer-auth",
      onClick: () => setView(customer ? "account" : "customer-auth"),
    },
  ];

  return (
    <header
      className={`eg-site-header sticky top-0 z-40 overflow-hidden border-b bg-white/80 backdrop-blur-2xl transition-all duration-500 ease-out ${
        isHeaderHidden ? "-translate-y-full" : "translate-y-0"
      } ${
        isScrolled
          ? "border-stone-200/80 shadow-lg shadow-stone-900/[0.06]"
          : "border-stone-200/60 shadow-sm shadow-stone-900/[0.02]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[8%] top-[-120px] h-[240px] w-[240px] rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute right-[12%] top-[-160px] h-[280px] w-[280px] rounded-full bg-amber-300/10 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      </div>

      <div
        className={`relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 transition-all duration-300 sm:px-6 lg:px-8 ${
          isScrolled ? "py-3" : "py-4"
        }`}
      >
        <button
          type="button"
          onClick={() => setView("home")}
          className="group flex min-w-0 items-center gap-3 rounded-3xl transition duration-300 hover:scale-[1.01]"
        >
          <BrandLogo size="md" showText={false} animated={true} />

          <div className="hidden text-left sm:block">
            <p className="text-lg font-black leading-tight text-emerald-950">
              Evergreen coffee
            </p>

            <p className="mt-0.5 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
              кава · маркет · поруч
            </p>
          </div>
        </button>

        <nav className="eg-glass hidden items-center rounded-[1.6rem] border border-white/70 bg-white/55 p-1.5 shadow-lg shadow-emerald-950/5 md:flex">
          {navItems.map((item) => {
            const Icon = item.Icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={`group relative flex items-center gap-2 rounded-2xl px-3 py-3 text-sm font-black transition-all duration-300 lg:px-5 ${
                  item.isActive
                    ? "bg-emerald-900 text-white shadow-lg shadow-emerald-900/20"
                    : "text-stone-700 hover:-translate-y-0.5 hover:bg-white/90 hover:text-emerald-900 hover:shadow-md"
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] transition duration-200 group-hover:scale-110 ${
                    item.isActive ? "text-emerald-100" : "text-emerald-700"
                  }`}
                />

                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {isAdmin && (
            <button
              type="button"
              onClick={() => setView("admin")}
              className={`eg-icon-button group hidden h-12 w-12 items-center justify-center rounded-2xl shadow-sm hover:shadow-md md:flex ${
                view === "admin"
                  ? "bg-stone-950 text-white"
                  : "bg-stone-100 text-emerald-800 hover:bg-emerald-50"
              }`}
              title="Адмін-панель"
              aria-label="Адмін-панель"
            >
              <SettingsIcon className="h-5 w-5 transition duration-200 group-hover:rotate-45" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setView("cart")}
            className={`eg-button relative flex items-center gap-2 rounded-2xl px-5 py-3 font-black shadow-sm hover:shadow-md ${
              view === "cart"
                ? "bg-stone-950 text-white"
                : cartCount > 0
                  ? "eg-cart-glow bg-emerald-900 text-white shadow-lg shadow-emerald-900/20 hover:bg-emerald-800"
                  : "bg-emerald-900 text-white hover:bg-emerald-800"
            }`}
          >
            <CartIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Кошик</span>

            {cartCount > 0 && (
              <span className="eg-cart-badge absolute -right-2 -top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-amber-400 px-2 text-xs font-black text-stone-950 shadow-md ring-2 ring-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

    </header>
  );
}
