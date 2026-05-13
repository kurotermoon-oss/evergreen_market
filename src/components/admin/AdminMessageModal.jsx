import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function AdminMessageModal({
  type = "warning",
  title,
  message,
  confirmLabel = "Підтвердити",
  cancelLabel = "Скасувати",
  onConfirm,
  onCancel,
  isLoading = false,
  showCancel = true,
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const styles = {
    warning: {
      badge: "bg-amber-50 text-amber-800 ring-amber-200",
      confirmButton:
        "bg-emerald-900 text-white hover:bg-emerald-800 hover:shadow-emerald-900/20",
      iconBox: "bg-amber-100 text-amber-800",
      icon: "⚠️",
      label: "Увага",
    },
    error: {
      badge: "bg-red-50 text-red-800 ring-red-200",
      confirmButton:
        "bg-red-700 text-white hover:bg-red-800 hover:shadow-red-900/20",
      iconBox: "bg-red-100 text-red-800",
      icon: "⛔",
      label: "Помилка",
    },
    success: {
      badge: "bg-emerald-50 text-emerald-800 ring-emerald-200",
      confirmButton:
        "bg-emerald-900 text-white hover:bg-emerald-800 hover:shadow-emerald-900/20",
      iconBox: "bg-emerald-100 text-emerald-800",
      icon: "✅",
      label: "Готово",
    },
  };

  const currentStyle = styles[type] || styles.warning;

  function handleOverlayClick() {
    if (isLoading) return;
    if (!showCancel) return;

    onCancel?.();
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/55 p-4 backdrop-blur-md"
      onClick={handleOverlayClick}
    >
      <div
        className="eg-glass eg-premium-card w-full max-w-lg overflow-hidden rounded-[2rem] bg-white/95 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.25)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] text-2xl shadow-sm ${currentStyle.iconBox}`}
          >
            {currentStyle.icon}
          </div>

          <div className="min-w-0 flex-1">
            <div
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ring-1 ${currentStyle.badge}`}
            >
              {currentStyle.label}
            </div>

            <h3 className="mt-3 text-2xl font-black leading-tight text-stone-950">
              {title}
            </h3>

            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-stone-600">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-end">
          {showCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="eg-button rounded-[1.25rem] border border-stone-300 bg-white/85 px-5 py-3 text-sm font-black text-stone-900 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelLabel}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`eg-button rounded-[1.25rem] px-5 py-3 text-sm font-black shadow-lg transition disabled:cursor-not-allowed disabled:bg-stone-400 disabled:shadow-none ${currentStyle.confirmButton}`}
          >
            {isLoading ? "Зачекайте..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}