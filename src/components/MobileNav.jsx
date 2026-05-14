function HomeIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M4 11.5 12 5l8 6.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.8 10.5V19h10.4v-8.5"
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

export default function MobileNav({
  view,
  setView,
  cartCount = 0,
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
      Icon: CatalogIcon,
      isActive: view === "catalog",
      onClick: () => setView("catalog"),
    },
    {
      id: "cart",
      label: "Кошик",
      Icon: CartIcon,
      isActive: view === "cart",
      onClick: () => setView("cart"),
      badge: cartCount,
      hasGlow: cartCount > 0,
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
    <nav className="eg-panel fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] left-1/2 z-40 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-1.5 overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 p-1.5 shadow-2xl shadow-emerald-950/10 backdrop-blur-2xl md:hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_55%)]" />

      {navItems.map((item) => {
        const Icon = item.Icon;

        return (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            className={`eg-icon-button relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl ${
              item.isActive
                ? "bg-emerald-900 text-white shadow-lg shadow-emerald-900/20"
                : item.hasGlow
                  ? "eg-cart-glow bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
                  : "text-emerald-800 hover:bg-emerald-50"
            }`}
            aria-label={item.label}
            title={item.label}
          >
            <Icon className="h-5 w-5" />

            {item.badge > 0 && (
              <span className="eg-cart-badge absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-400 px-1.5 text-xs font-black text-stone-950 shadow-md ring-2 ring-white">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
