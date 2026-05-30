import { ShoppingBasket } from "lucide-react";

export default function FloatingCartButton({
  isOpen = false,
  onOpen,
  cartCount = 0,
}) {
  const label =
    cartCount > 0 ? `Кошик, товарів: ${cartCount}` : "Кошик порожній";

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={label}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      title="Кошик"
      className={`eg-floating-cart eg-button group fixed z-[160] hidden h-[4.9rem] w-[4.9rem] items-center justify-center rounded-[1.55rem] border border-white/70 text-white shadow-2xl shadow-emerald-950/25 ring-4 ring-white/75 transition hover:-translate-y-1 md:flex ${
        isOpen
          ? "bg-stone-950 hover:bg-stone-900"
          : cartCount > 0
            ? "eg-cart-glow bg-emerald-950 hover:bg-emerald-900"
            : "bg-emerald-900 hover:bg-emerald-800"
      }`}
    >
      <span className="absolute inset-1.5 rounded-[1.25rem] bg-white/10 ring-1 ring-white/16 transition group-hover:bg-white/15" />
      <ShoppingBasket
        className="relative z-10 drop-shadow-sm"
        size={35}
        strokeWidth={2.05}
      />

      {cartCount > 0 && (
        <span className="eg-cart-badge absolute -right-1.5 -top-1.5 z-20 flex h-8 min-w-8 items-center justify-center rounded-full bg-amber-300 px-2 text-sm font-black text-stone-950 shadow-lg ring-[3px] ring-white">
          {cartCount}
        </span>
      )}
    </button>
  );
}
