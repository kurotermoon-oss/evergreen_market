import {
  getActionClassName,
  getAvailableOrderActions,
  isFinalOrder,
} from "./orderUiConfig.js";

export default function OrderActions({ order, onAction }) {
  const actions = getAvailableOrderActions(order);

  if (!actions.length || isFinalOrder(order)) {
    return (
      <div className="rounded-2xl bg-stone-50 p-4 text-sm font-semibold text-stone-500">
        Замовлення завершене. Редагування недоступне.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          onClick={() => onAction(action.action)}
          className={`rounded-2xl px-4 py-3 text-sm font-black transition ${getActionClassName(
            action.variant
          )}`}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}