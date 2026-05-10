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
  const styles = {
    warning: {
      badge: "bg-amber-50 text-amber-800 ring-amber-200",
      button: "bg-emerald-900 text-white hover:bg-emerald-800",
      icon: "⚠️",
    },
    error: {
      badge: "bg-red-50 text-red-800 ring-red-200",
      button: "bg-red-700 text-white hover:bg-red-800",
      icon: "⛔",
    },
    success: {
      badge: "bg-emerald-50 text-emerald-800 ring-emerald-200",
      button: "bg-emerald-900 text-white hover:bg-emerald-800",
      icon: "✅",
    },
  };

  const currentStyle = styles[type] || styles.warning;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
        <div
          className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black ring-1 ${currentStyle.badge}`}
        >
          <span>{currentStyle.icon}</span>
          <span>{type === "error" ? "Помилка" : "Увага"}</span>
        </div>

        <h3 className="mt-5 text-2xl font-black text-stone-950">
          {title}
        </h3>

        <p className="mt-3 text-sm leading-6 text-stone-600">
          {message}
        </p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          {showCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="rounded-2xl border border-stone-300 px-5 py-3 text-sm font-black text-stone-900 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelLabel}
            </button>
          )}

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-2xl px-5 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:bg-stone-400 ${currentStyle.button}`}
          >
            {isLoading ? "Зачекайте..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}