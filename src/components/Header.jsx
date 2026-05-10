import BrandLogo from "./BrandLogo.jsx";

function LeafIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 19c7.5-.4 12.8-5.4 14-14-7.7 1-12.9 6.2-14 14Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 19c3.4-4.8 7.4-8.2 12-10.2"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M8.2 14.5 6 12.3M11.5 11.2 9.2 8.9M14.7 8.7l-1.9-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

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

function CoffeeIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M7 8h9v6a4 4 0 0 1-4 4H11a4 4 0 0 1-4-4V8Z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 10h1.2a2.3 2.3 0 0 1 0 4.6H16"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 21h8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M9 4c-.5.7-.5 1.3 0 2M12 3.5c-.5.8-.5 1.5 0 2.3M15 4c-.5.7-.5 1.3 0 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
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
  cartCount = 0,
  isAdmin = false,
  customer = null,
}) {
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
      Icon: CoffeeIcon,
      isActive: view === "catalog",
      onClick: () => setView("catalog"),
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
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => setView("home")}
          className="group flex min-w-0 items-center gap-3 rounded-3xl transition"
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
        <nav className="hidden items-center rounded-3xl border border-stone-200 bg-stone-50/90 p-1.5 shadow-sm md:flex">
          {navItems.map((item) => {
            const Icon = item.Icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={`group flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition-all duration-200 ${
                  item.isActive
                    ? "bg-emerald-900 text-white shadow-sm"
                    : "text-stone-700 hover:-translate-y-0.5 hover:bg-white hover:text-emerald-900 hover:shadow-sm"
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] transition duration-200 group-hover:scale-110 ${
                    item.isActive
                      ? "text-emerald-100"
                      : "text-emerald-700"
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
            className={`group hidden h-12 w-12 items-center justify-center rounded-2xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md md:flex ${
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
            className={`relative flex items-center gap-2 rounded-2xl px-5 py-3 font-black shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
              view === "cart"
                ? "bg-stone-950 text-white"
                : "bg-emerald-900 text-white hover:bg-emerald-800"
            }`}
          >
            <CartIcon className="h-5 w-5" />
            <span className="hidden sm:inline">Кошик</span>

            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-amber-400 px-2 text-xs font-black text-stone-950 shadow-md ring-2 ring-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

<div className="border-t border-stone-100 bg-white/95 px-4 py-2 md:hidden">
  <nav className="mx-auto grid max-w-7xl grid-cols-3 gap-2">
    {navItems.map((item) => {
      const Icon = item.Icon;

      return (
        <button
          key={item.id}
          type="button"
          onClick={item.onClick}
          className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-black transition-all ${
            item.isActive
              ? "bg-emerald-900 text-white shadow-sm"
              : "bg-stone-50 text-stone-700 hover:bg-emerald-50 hover:text-emerald-900"
          }`}
        >
          <Icon className="h-[18px] w-[18px]" />
          <span>{item.label}</span>
        </button>
      );
    })}
  </nav>
</div>
    </header>
  );
}