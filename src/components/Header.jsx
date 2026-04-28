import Icon from "./Icon.jsx";

export default function Header({ view, setView, cartCount, isAdmin }) {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200 bg-stone-50/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <button onClick={() => setView("home")} className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-900 text-white">
            <Icon name="leaf" size={22} />
          </div>

          <div className="text-left">
            <p className="text-base font-bold leading-tight text-stone-950">
              Evergreen coffee
            </p>
            <p className="text-xs text-stone-500">local market</p>
          </div>
        </button>

        <nav className="hidden items-center gap-2 md:flex">
          <button
            onClick={() => setView("home")}
            className={`rounded-2xl px-4 py-2 text-sm font-medium ${
              view === "home"
                ? "bg-stone-900 text-white"
                : "text-stone-700 hover:bg-stone-200"
            }`}
          >
            Головна
          </button>

          <button
            onClick={() => setView("catalog")}
            className={`rounded-2xl px-4 py-2 text-sm font-medium ${
              view === "catalog"
                ? "bg-stone-900 text-white"
                : "text-stone-700 hover:bg-stone-200"
            }`}
          >
            Товари
          </button>

            {isAdmin && (
              <button
                onClick={() => setView("admin")}
                className={`rounded-2xl p-3 ${
                  view === "admin" ? "bg-stone-950 text-white" : "text-stone-600"
                }`}
              >
                <Icon name="settings" size={20} />
              </button>
            )}
        </nav>

        <button
          onClick={() => setView("cart")}
          className="relative flex items-center gap-2 rounded-2xl bg-emerald-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
        >
          <Icon name="cart" size={18} />
          <span className="hidden sm:inline">Кошик</span>

          {cartCount > 0 && (
            <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-stone-950">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}