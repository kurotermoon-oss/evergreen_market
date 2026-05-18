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
      className={`eg-floating-cart eg-button fixed bottom-8 right-8 z-[70] hidden h-16 w-16 items-center justify-center rounded-full text-white shadow-2xl shadow-emerald-950/25 ring-1 ring-white/70 transition md:flex ${
        view === "cart"
          ? "bg-stone-950 hover:bg-stone-900"
          : cartCount > 0
            ? "eg-cart-glow bg-emerald-900 hover:bg-emerald-800"
            : "bg-emerald-900 hover:bg-emerald-800"
      }`}
    >
      <ShoppingCart size={29} strokeWidth={2.35} />

      {cartCount > 0 && (
        <span className="eg-cart-badge absolute -right-1 -top-1 flex h-7 min-w-7 items-center justify-center rounded-full bg-amber-400 px-2 text-xs font-black text-stone-950 shadow-md ring-2 ring-white">
          {cartCount}
        </span>
      )}
    </button>
  );
}
