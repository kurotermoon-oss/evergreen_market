import { formatUAH } from "../../utils/formatUAH.js";
import OrderActions from "./OrderActions.jsx";
import {
  isFinalOrder,
  getOrderStatusClass,
  getOrderStatusLabel,
} from "./orderUiConfig.js";

export default function OrderCard({ order, updateOrderAction }) {
  const final = isFinalOrder(order);

  async function handleAction(action) {
    if (action === "cancel") {
      const reason = window.prompt("Причина скасування замовлення:");
      if (reason === null) return;

      await updateOrderAction(order.id, action, { reason });
      return;
    }

    await updateOrderAction(order.id, action);
  }

  return (
    <div className="rounded-3xl border border-stone-200 p-5">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-emerald-700">
            #{order.orderNumber} ·{" "}
            {new Date(order.createdAt).toLocaleString("uk-UA")}
          </p>

          <h3 className="mt-1 text-xl font-black text-stone-950">
            {order.customerName}
          </h3>

          <p className="mt-2 text-sm text-stone-600">
            Телефон: {order.customerPhone || "—"} · Telegram:{" "}
            {order.customerTelegram || "—"}
          </p>

          <p className="mt-1 text-sm text-stone-600">
            Отримання:{" "}
            {order.deliveryType === "pickup"
              ? "Самовивіз"
              : `ЖК (${order.building || "-"}/${order.apartment || "-"})`}
          </p>

          <p className="mt-1 text-sm text-stone-600">
            Оплата: {order.paymentMethod}
          </p>

          <p className="text-sm text-stone-500">
            Оплата здійснюється на місці
          </p>

          {order.cancelReason && (
            <p className="mt-2 text-sm font-semibold text-red-600">
              Причина скасування: {order.cancelReason}
            </p>
          )}
        </div>

        <div className="shrink-0 text-left xl:text-right">
          <p className="text-3xl font-black text-stone-950">
            {formatUAH(order.total)}
          </p>

          <div className="mt-3 flex flex-wrap gap-2 xl:justify-end">
            <span
              className={`rounded-full px-3 py-1 text-xs font-black ${getOrderStatusClass(
                order.status
              )}`}
            >
              {getOrderStatusLabel(order.status)}
            </span>
          </div>

          {order.finalizedAt && (
            <p className="mt-2 text-xs text-stone-500">
              Завершено: {new Date(order.finalizedAt).toLocaleString("uk-UA")}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-stone-50 p-4">
        <p className="mb-3 text-sm font-bold text-stone-700">
          Склад замовлення:
        </p>

        <div className="space-y-2">
          {(order.items || []).map((item) => (
            <div
              key={`${order.id}-${item.productId || item.id}-${item.name}`}
              className="flex justify-between gap-4 text-sm text-stone-700"
            >
              <span>
                {item.name} · {item.quantity} шт × {item.price} грн
              </span>

              <span className="font-bold">{formatUAH(item.total)}</span>
            </div>
          ))}
        </div>

        {order.comment && (
          <p className="mt-4 text-sm text-stone-500">
            Коментар: {order.comment}
          </p>
        )}
      </div>

      {!final && (
        <div className="mt-5">
          <OrderActions order={order} onAction={handleAction} />
        </div>
      )}

      {final && (
        <div className="mt-5 rounded-2xl bg-stone-50 p-4">
          <p className="text-sm font-black text-stone-700">
            Історія замовлення
          </p>

          {!order.statusHistory?.length && (
            <p className="mt-2 text-sm text-stone-500">
              Історія дій відсутня.
            </p>
          )}

          <div className="mt-3 space-y-2">
            {(order.statusHistory || []).map((item, index) => (
              <div
                key={`${order.id}-history-${index}`}
                className="text-sm text-stone-600"
              >
                <span className="font-semibold">
                  {new Date(item.at).toLocaleString("uk-UA")}
                </span>{" "}
                — <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}