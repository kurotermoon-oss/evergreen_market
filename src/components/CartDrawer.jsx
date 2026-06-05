import {
  AlertTriangle,
  ArrowRight,
  Layers3,
  PackageOpen,
  ShoppingBasket,
  Store,
  Truck,
  X,
} from "lucide-react";
import { useEffect, useRef } from "react";
import Icon from "./Icon.jsx";
import logoEvergreen from "../img/logo_evergreen.webp";
import { formatUAH } from "../utils/formatUAH.js";
import {
  FULFILLMENT_SUPPLIER_ORDER,
  buildCartOrderGroups,
} from "../utils/cartSupplierRules.js";

function getItemId(item) {
  return item.productId || item.id;
}

function getProductWord(count) {
  const normalizedCount = Math.abs(Number(count) || 0);
  const lastDigit = normalizedCount % 10;
  const lastTwoDigits = normalizedCount % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return "товарів";
  if (lastDigit === 1) return "товар";
  if (lastDigit >= 2 && lastDigit <= 4) return "товари";

  return "товарів";
}

function CartItem({
  item,
  changeQuantity,
  removeFromCart,
  onImageError,
}) {
  const productId = getItemId(item);
  const quantity = Number(item.quantity || 0);
  const itemTotal = Number(item.price || 0) * quantity;

  function decreaseItem() {
    changeQuantity?.(productId, Math.max(0, quantity - 1));
  }

  function increaseItem() {
    changeQuantity?.(productId, quantity + 1);
  }

  return (
    <div className="eg-card flex gap-3 rounded-[1.2rem] border border-stone-200 bg-white p-3 shadow-sm hover:border-emerald-100 hover:shadow-md hover:shadow-emerald-900/10">
      <img
        src={item.image || logoEvergreen}
        alt={item.name}
        onError={onImageError}
        className="h-[68px] w-[68px] shrink-0 rounded-[0.95rem] bg-stone-50 object-cover"
      />

      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-sm font-black leading-5 text-stone-950">
          {item.name}
        </h3>

        {(item.brand || item.unit || item.packageInfo) && (
          <p className="mt-1 line-clamp-1 text-xs leading-5 text-stone-500">
            {[item.brand, item.unit, item.packageInfo].filter(Boolean).join(" · ")}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex h-10 overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
            <button
              type="button"
              onClick={decreaseItem}
              className="eg-counter-button flex h-10 w-10 items-center justify-center text-stone-700 hover:bg-emerald-100 hover:text-emerald-900"
              aria-label="Зменшити кількість"
            >
              <Icon name="minus" size={14} />
            </button>

            <span className="flex h-10 min-w-10 items-center justify-center bg-white px-2 text-sm font-black text-stone-950">
              {quantity}
            </span>

            <button
              type="button"
              onClick={increaseItem}
              className="eg-counter-button flex h-10 w-10 items-center justify-center text-stone-700 hover:bg-emerald-100 hover:text-emerald-900"
              aria-label="Збільшити кількість"
            >
              <Icon name="plus" size={14} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <p className="text-sm font-black text-stone-950">
              {formatUAH(itemTotal)}
            </p>

            <button
              type="button"
              onClick={() => removeFromCart?.(productId)}
              className="eg-icon-button flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-500 hover:bg-red-50 hover:text-red-600"
              aria-label="Видалити товар"
            >
              <Icon name="trash" size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartGroup({
  group,
  changeQuantity,
  removeFromCart,
  onImageError,
  onShowSupplierProducts,
}) {
  const isSupplierOrder = group.type === FULFILLMENT_SUPPLIER_ORDER;
  const GroupIcon = isSupplierOrder ? Truck : Store;

  return (
    <section className="rounded-[1.35rem] border border-stone-200 bg-stone-50/80 p-2.5">
      <div className="mb-2 flex items-start justify-between gap-3 px-1">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-[0.95rem] ${
              isSupplierOrder
                ? "bg-blue-50 text-blue-800"
                : "bg-emerald-50 text-emerald-800"
            }`}
          >
            <GroupIcon size={19} />
          </span>

          <div className="min-w-0">
            <h3 className="line-clamp-1 text-sm font-black text-stone-950">
              {group.label}
            </h3>
            <p className="mt-0.5 text-xs font-semibold text-stone-500">
              {group.count} {getProductWord(group.count)} · {formatUAH(group.total)}
            </p>
          </div>
        </div>

        {group.canCheckout ? (
          <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-900">
            Готово
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-900">
            Окремо
          </span>
        )}
      </div>

      {group.message && (
        <div className="mb-2 flex gap-2 rounded-[1rem] border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-950">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>{group.message}</span>
        </div>
      )}

      {isSupplierOrder && group.supplierId && (
        <button
          type="button"
          onClick={() =>
            onShowSupplierProducts?.(group.supplierId, group.supplierName)
          }
          className="eg-button mb-2 min-h-9 rounded-xl bg-white px-3 text-xs font-black text-stone-900 shadow-sm hover:bg-emerald-50"
        >
          Добрати товари цього постачальника
        </button>
      )}

      <div className="space-y-2">
        {group.items.map((item) => (
          <CartItem
            key={getItemId(item)}
            item={item}
            changeQuantity={changeQuantity}
            removeFromCart={removeFromCart}
            onImageError={onImageError}
          />
        ))}
      </div>
    </section>
  );
}

export default function CartDrawer({
  isOpen,
  cartItems = [],
  cartOrderGroups,
  total = 0,
  cartCount = 0,
  changeQuantity,
  removeFromCart,
  setCart,
  setView,
  onClose,
  onShowSupplierProducts,
}) {
  const closeButtonRef = useRef(null);
  const drawerRef = useRef(null);
  const previousFocusRef = useRef(null);
  const groups = cartOrderGroups?.length
    ? cartOrderGroups
    : buildCartOrderGroups(cartItems);

  useEffect(() => {
    if (!isOpen) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = drawerRef.current?.querySelectorAll(
        [
          "button:not([disabled])",
          "a[href]",
          "input:not([disabled])",
          "select:not([disabled])",
          "textarea:not([disabled])",
          "[tabindex]:not([tabindex='-1'])",
        ].join(",")
      );

      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    const previousOverflow = document.body.style.overflow;
    previousFocusRef.current = document.activeElement;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);

      if (previousFocusRef.current instanceof HTMLElement) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isEmpty = cartItems.length === 0;
  const isSegmented = groups.length > 1;

  function openCheckout() {
    onClose?.();
    setView?.("checkout");
  }

  function handleImageError(event) {
    event.currentTarget.src = logoEvergreen;
    event.currentTarget.alt = "Evergreen coffee";
    event.currentTarget.className =
      "h-[68px] w-[68px] shrink-0 rounded-[0.95rem] bg-emerald-50 object-contain p-2";
  }

  return (
    <div className="fixed inset-0 z-[900]" role="dialog" aria-modal="true">
      <div
        aria-hidden="true"
        className="absolute inset-0 cursor-default bg-stone-950/45 backdrop-blur-sm"
        onClick={onClose}
      />

      <aside
        ref={drawerRef}
        className="eg-panel absolute bottom-0 right-0 flex h-[min(92vh,760px)] w-full flex-col overflow-hidden rounded-t-[1.6rem] border border-white/70 bg-stone-50 shadow-[0_-22px_70px_rgba(2,44,34,0.28)] sm:bottom-4 sm:right-4 sm:h-[calc(100vh-2rem)] sm:max-h-[760px] sm:w-[430px] sm:rounded-[1.8rem]"
      >
        <div className="relative overflow-hidden bg-emerald-950 px-4 pb-4 pt-5 text-white sm:px-5 sm:pb-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(255,255,255,0.16),transparent_34%),radial-gradient(circle_at_92%_88%,rgba(251,191,36,0.16),transparent_32%)]" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.05rem] bg-white text-emerald-950 shadow-lg shadow-black/15">
                <ShoppingBasket size={25} strokeWidth={2.05} />
              </span>

              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-wide text-emerald-100">
                  Швидкий кошик
                </p>

                <h2 className="mt-1 truncate text-2xl font-black leading-tight">
                  Ваші покупки
                </h2>
              </div>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="eg-icon-button flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/12 text-white ring-1 ring-white/18 hover:bg-white hover:text-emerald-950"
              aria-label="Закрити кошик"
            >
              <X size={20} strokeWidth={2.2} />
            </button>
          </div>

          {!isEmpty && (
            <div className="relative z-10 mt-4 grid gap-2 rounded-[1.2rem] bg-white/12 px-4 py-3 text-sm ring-1 ring-white/14">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-emerald-50">
                  {cartCount} {getProductWord(cartCount)}
                </span>

                <span className="text-xl font-black">{formatUAH(total)}</span>
              </div>

              {isSegmented && (
                <p className="flex items-center gap-2 text-xs font-semibold leading-5 text-emerald-50/90">
                  <Layers3 size={15} className="shrink-0" />
                  Кошик розділено на {groups.length} окремі замовлення.
                </p>
              )}
            </div>
          )}
        </div>

        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center px-7 py-10 text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-900 ring-1 ring-emerald-100">
              <PackageOpen size={38} strokeWidth={1.9} />
            </span>

            <p className="mt-6 text-2xl font-black text-stone-950">
              Кошик порожній
            </p>

            <p className="mt-2 max-w-xs text-sm leading-6 text-stone-500">
              Додайте товари з каталогу, а кошик залишиться тут, поверх поточної сторінки.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="eg-button eg-sweep mt-7 rounded-2xl bg-emerald-900 px-6 py-3 font-black text-white hover:bg-emerald-800"
            >
              Продовжити покупки
            </button>
          </div>
        ) : (
          <>
            <div className="modal-scrollbar flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              <div className="space-y-3">
                {groups.map((group) => (
                  <CartGroup
                    key={group.id}
                    group={group}
                    changeQuantity={changeQuantity}
                    removeFromCart={removeFromCart}
                    onImageError={handleImageError}
                    onShowSupplierProducts={onShowSupplierProducts}
                  />
                ))}
              </div>
            </div>

            <div className="border-t border-stone-200 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pb-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-stone-500">
                    У кошику
                  </p>

                  <p className="mt-1 text-2xl font-black text-stone-950">
                    {formatUAH(total)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCart?.({})}
                  className="eg-button rounded-2xl border border-stone-300 px-4 py-2.5 text-sm font-black text-stone-700 hover:bg-stone-100"
                >
                  Очистити
                </button>
              </div>

              <div className="grid grid-cols-[0.8fr_1.2fr] gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="eg-button rounded-2xl border border-stone-300 px-4 py-3 text-sm font-black text-stone-800 hover:bg-stone-100"
                >
                  Продовжити
                </button>

                <button
                  type="button"
                  onClick={openCheckout}
                  className="eg-button eg-sweep flex items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-4 py-3 text-sm font-black text-white hover:bg-emerald-800 hover:shadow-lg hover:shadow-emerald-900/20"
                >
                  Обрати замовлення
                  <ArrowRight size={17} strokeWidth={2.2} />
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
