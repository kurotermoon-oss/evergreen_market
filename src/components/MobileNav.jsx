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

export default function MobileNav({
  view,
  setView,
  onContactsClick,
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
    <nav className="eg-mobile-nav eg-panel fixed left-1/2 z-[70] flex w-[calc(100vw-1rem)] max-w-[430px] -translate-x-1/2 items-center gap-1 rounded-[1.6rem] border border-emerald-700/50 bg-emerald-950/95 p-1.5 shadow-[0_18px_44px_rgba(2,44,34,0.38)] backdrop-blur-2xl md:hidden">
      <div className="pointer-events-none absolute inset-0 rounded-[1.6rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_55%)]" />

      {navItems.map((item) => {
        const Icon = item.Icon;

        return (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            className={`eg-icon-button relative z-10 flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-[1.15rem] px-1 ${
              item.isActive
                ? "bg-white text-emerald-950 shadow-lg shadow-black/20"
                : item.hasGlow
                  ? "eg-cart-glow bg-emerald-800 text-white hover:bg-emerald-700"
                  : "text-emerald-50/85 hover:bg-white/10 hover:text-white"
            }`}
            aria-label={item.label}
            title={item.label}
          >
            <Icon className="h-5 w-5" />
            <span className="max-w-full truncate text-[10px] font-black leading-none">
              {item.label}
            </span>

            {item.badge > 0 && (
              <span className="eg-cart-badge absolute -right-1 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-400 px-1.5 text-xs font-black text-stone-950 shadow-md ring-2 ring-emerald-950">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
