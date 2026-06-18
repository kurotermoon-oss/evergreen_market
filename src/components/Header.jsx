import { CircleHelp, Menu, MapPin, Phone, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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

function InstagramMark({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle
        cx="12"
        cy="12"
        r="4"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

export default function Header({
  view,
  setView,
  onContactsClick,
  isAdmin = false,
  customer = null,
}) {
  const headerRef = useRef(null);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;
    const desktopQuery = window.matchMedia("(min-width: 768px)");

    function updateHeader() {
      const currentScrollY = Math.max(window.scrollY, 0);
      const scrollDifference = currentScrollY - lastScrollY;
      const isDesktopViewport = desktopQuery.matches;

      setIsScrolled(currentScrollY > 12);

      if (!isDesktopViewport) {
        setIsHeaderHidden(false);
        lastScrollY = currentScrollY;
        ticking = false;
        return;
      }

      if (currentScrollY < 80) {
        setIsHeaderHidden(false);
      } else if (scrollDifference > 6) {
        setIsHeaderHidden(true);
      } else if (scrollDifference < -2) {
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

    function handleViewportChange() {
      setIsHeaderHidden(false);
      lastScrollY = Math.max(window.scrollY, 0);
      handleScroll();
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    desktopQuery.addEventListener("change", handleViewportChange);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      desktopQuery.removeEventListener("change", handleViewportChange);
    };
  }, []);

  useEffect(() => {
    function updateHeaderOffset() {
      const headerHeight = headerRef.current?.getBoundingClientRect().height || 0;
      const headerOffset = isHeaderHidden ? 0 : Math.ceil(headerHeight);

      document.documentElement.style.setProperty(
        "--eg-header-offset",
        `${headerOffset}px`
      );
    }

    updateHeaderOffset();
    window.addEventListener("resize", updateHeaderOffset);

    return () => {
      window.removeEventListener("resize", updateHeaderOffset);
      document.documentElement.style.removeProperty("--eg-header-offset");
    };
  }, [isHeaderHidden, isScrolled]);

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;

    const desktopQuery = window.matchMedia("(min-width: 768px)");

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    }

    function closeOnDesktop(event) {
      if (event.matches) {
        setIsMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    desktopQuery.addEventListener("change", closeOnDesktop);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      desktopQuery.removeEventListener("change", closeOnDesktop);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [view]);

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
      id: "how-it-works",
      label: "Як це працює?",
      Icon: CircleHelp,
      isActive: view === "how-it-works",
      onClick: () => setView("how-it-works"),
    },
    {
      id: "contacts",
      label: "Контакти",
      Icon: ContactIcon,
      isActive: view === "contacts",
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
    <>
    <header
      ref={headerRef}
      className={`eg-site-header sticky top-0 z-40 overflow-visible border-b bg-white/80 backdrop-blur-2xl transition-all duration-500 ease-out ${
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
        className={`relative z-10 mx-auto grid max-w-7xl grid-cols-[74px_minmax(0,1fr)_56px] items-center gap-3 px-4 transition-all duration-300 md:flex md:justify-between md:gap-4 md:px-6 lg:px-8 ${
          isScrolled ? "py-3" : "py-4"
        }`}
      >
        <button
          type="button"
          onClick={() => setView("home")}
          className="group flex min-w-0 justify-self-start rounded-3xl transition duration-300 hover:scale-[1.01] md:items-center md:gap-3 md:justify-self-auto"
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

        <button
          type="button"
          onClick={() => {
            setView("catalog");
            window.dispatchEvent(new CustomEvent("eg-open-catalog-menu"));
          }}
          className={`eg-button eg-sweep flex min-h-11 w-full max-w-[190px] items-center justify-center justify-self-center rounded-full px-6 text-base font-black shadow-md md:hidden ${
            view === "catalog"
              ? "bg-emerald-900 text-white shadow-emerald-900/20"
              : "bg-emerald-900 text-white shadow-emerald-900/20 hover:bg-emerald-800"
          }`}
          aria-label="Каталог"
        >
          Каталог
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

        <div className="flex shrink-0 items-center justify-self-end gap-2 sm:gap-3 md:justify-self-auto">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            className="eg-icon-button grid h-11 w-11 place-items-center rounded-xl bg-white/90 text-emerald-950 shadow-sm ring-1 ring-emerald-100 hover:bg-emerald-50 md:hidden"
            aria-label={isMobileMenuOpen ? "Закрити меню" : "Відкрити меню"}
            aria-expanded={isMobileMenuOpen}
            aria-haspopup="menu"
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={30} />}
          </button>

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

        </div>
      </div>

    </header>

      {isMobileMenuOpen && (
        <div
          className="eg-mobile-header-menu fixed inset-x-0 z-[160] mx-auto flex max-h-[calc(100dvh-var(--eg-header-offset,0px)-0.75rem)] max-w-[560px] flex-col overflow-y-auto border-t border-stone-100 bg-white px-6 pb-[calc(env(safe-area-inset-bottom)+2rem)] pt-5 text-stone-950 shadow-2xl shadow-emerald-950/18 md:hidden"
          style={{ top: "var(--eg-header-offset, 0px)" }}
          role="navigation"
          aria-label="Мобільне меню"
        >
          <nav className="grid gap-2 text-left text-base font-semibold">
            {navItems.map((item) => {
              const Icon = item.Icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    item.onClick?.();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`eg-button flex min-h-[3.25rem] items-center gap-3 rounded-2xl px-4 text-left font-black ${
                    item.isActive
                      ? "bg-emerald-900 text-white shadow-lg shadow-emerald-900/18"
                      : "text-stone-800 hover:bg-emerald-50 hover:text-emerald-950"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 ${
                      item.isActive ? "text-emerald-100" : "text-emerald-700"
                    }`}
                  />
                  <span className="min-w-0 flex-1">{item.label}</span>
                </button>
              );
            })}

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setView("admin");
                  setIsMobileMenuOpen(false);
                }}
                className={`eg-button flex min-h-[3.25rem] items-center gap-3 rounded-2xl px-4 text-left font-black ${
                  view === "admin"
                    ? "bg-stone-950 text-white shadow-lg shadow-stone-950/18"
                    : "text-stone-800 hover:bg-stone-50 hover:text-stone-950"
                }`}
              >
                <SettingsIcon className="h-5 w-5 shrink-0" />
                <span className="min-w-0 flex-1">Адмін-панель</span>
              </button>
            )}
          </nav>

          <div className="my-5 h-px bg-stone-200" />

          <div className="space-y-3">
            <a
              href="tel:+380997592367"
              className="eg-button flex min-h-14 items-center gap-4 rounded-2xl text-left hover:bg-emerald-50"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-900">
                <Phone size={20} />
              </span>
              <span>
                <span className="block text-lg font-black text-stone-950">
                  +380 99 759 23 67
                </span>
                <span className="text-sm font-semibold text-stone-500">
                  Телефон для замовлень
                </span>
              </span>
            </a>

            <a
              href="https://t.me/EvergreeenCofee"
              target="_blank"
              rel="noopener noreferrer"
              className="eg-button flex min-h-14 items-center gap-4 rounded-2xl text-left hover:bg-emerald-50"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sky-100 text-sky-700">
                <Send size={20} />
              </span>
              <span className="text-lg font-black text-stone-950">
                Написати у Telegram
              </span>
            </a>

            <a
              href="https://instagram.com/evergreen___coffee/"
              target="_blank"
              rel="noopener noreferrer"
              className="eg-button flex min-h-14 items-center gap-4 rounded-2xl text-left hover:bg-emerald-50"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-pink-100 text-pink-700">
                <InstagramMark className="h-5 w-5" />
              </span>
              <span className="text-lg font-black text-stone-950">
                Instagram
              </span>
            </a>

            <a
              href="https://www.google.com/maps/search/?api=1&query=Київ%2C%20вул.%20Білицька%2020"
              target="_blank"
              rel="noopener noreferrer"
              className="eg-button flex min-h-14 items-center gap-4 rounded-2xl text-left hover:bg-emerald-50"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700">
                <MapPin size={20} />
              </span>
              <span>
                <span className="block text-lg font-black text-stone-950">
                  вул. Білицька 20
                </span>
                <span className="text-sm font-semibold text-stone-500">
                  Щодня 08:00-21:00
                </span>
              </span>
            </a>
          </div>
        </div>
      )}
    </>
  );
}
