import Icon from "./Icon.jsx";

export default function MobileNav({ view, setView, cartCount }) {
  return (
    <div className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 gap-2 rounded-3xl border border-stone-200 bg-white/95 p-2 shadow-xl backdrop-blur md:hidden">
      <button
        onClick={() => setView("home")}
        className={`rounded-2xl p-3 ${
          view === "home" ? "bg-stone-950 text-white" : "text-stone-600"
        }`}
      >
        <Icon name="home" size={20} />
      </button>

      <button
        onClick={() => setView("catalog")}
        className={`rounded-2xl p-3 ${
          view === "catalog" ? "bg-stone-950 text-white" : "text-stone-600"
        }`}
      >
        <Icon name="package" size={20} />
      </button>

      <button
        onClick={() => setView("cart")}
        className={`relative rounded-2xl p-3 ${
          view === "cart" ? "bg-stone-950 text-white" : "text-stone-600"
        }`}
      >
        <Icon name="cart" size={20} />

        {cartCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[11px] font-bold text-stone-950">
            {cartCount}
          </span>
        )}
      </button>

      <button
        onClick={() => setView("admin")}
        className={`rounded-2xl p-3 ${
          view === "admin" ? "bg-stone-950 text-white" : "text-stone-600"
        }`}
      >
        <Icon name="settings" size={20} />
      </button>
    </div>
  );
}