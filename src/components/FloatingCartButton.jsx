import { ShoppingCart } from "lucide-react";

export default function FloatingCartButton({
  view,
  setView,
  cartCount = 0,
}) {
  const label =
    cartCount > 0 ? `Кошик, товарів: ${cartCount}` : "Кошик порожній";

  return (
    <button
      type="button"
      onClick={() => setView("cart")}
      aria-label={label}
      title="Кошик"
      className={`eg-floating-cart eg-button fixed bottom-8 right-8 z-[70] hidden h-[5.4rem] w-[5.4rem] items-center justify-center rounded-full text-white shadow-2xl shadow-emerald-950/30 ring-4 ring-white/80 transition hover:-translate-y-1 md:flex ${
        view === "cart"
          ? "bg-stone-950 hover:bg-stone-900"
          : cartCount > 0
            ? "eg-cart-glow bg-emerald-900 hover:bg-emerald-800"
            : "bg-emerald-900 hover:bg-emerald-800"
      }`}
    >
      <ShoppingCart size={42} strokeWidth={2.45} />

      {cartCount > 0 && (
        <span className="eg-cart-badge absolute -right-1.5 -top-1.5 flex h-9 min-w-9 items-center justify-center rounded-full bg-amber-400 px-2.5 text-sm font-black text-stone-950 shadow-lg ring-[3px] ring-white">
          {cartCount}
        </span>
      )}
    </button>
  );
}
