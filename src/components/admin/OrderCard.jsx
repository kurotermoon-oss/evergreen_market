import { formatUAH } from "../../utils/formatUAH.js";
import OrderActions from "./OrderActions.jsx";
import {
  isFinalOrder,
  getOrderStatusClass,
  getOrderStatusLabel,
} from "./orderUiConfig.js";

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InfoPill({ children }) {
  return (
    <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-black text-stone-600 ring-1 ring-stone-200">
      {children}
    </span>
  );
}

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
    <div className="eg-card eg-premium-card rounded-[2rem] border border-stone-200 bg-white/85 p-5 backdrop-blur hover:border-emerald-100 hover:shadow-lg hover:shadow-emerald-900/10">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-black text-emerald-700">
            #{order.orderNumber} · {formatDate(order.createdAt)}
          </p>

          <h3 className="mt-2 text-2xl font-black text-stone-950">
            {order.customerName}
          </h3>

          <div className="mt-3 flex flex-wrap gap-2">
            <InfoPill>Телефон: {order.customerPhone || "—"}</InfoPill>
            <InfoPill>Telegram: {order.customerTelegram || "—"}</InfoPill>
            <InfoPill>
              {order.deliveryType === "pickup"
                ? "Самовивіз"
                : `Доставка: ${order.building || "-"}/${order.apartment || "-"}`}
            </InfoPill>
            <InfoPill>Оплата: {order.paymentMethod || "на місці"}</InfoPill>
          </div>

          <p className="mt-3 text-sm text-stone-500">
            Оплата здійснюється на місці після підтвердження.
          </p>

          {order.cancelReason && (
            <div className="eg-panel mt-4 rounded-[1.4rem] border border-red-100 bg-red-50/80 p-4 text-sm font-semibold text-red-700">
              Причина скасування: {order.cancelReason}
            </div>
          )}
        </div>

        <div className="shrink-0 rounded-[1.7rem] bg-stone-50/90 p-5 text-left shadow-sm ring-1 ring-stone-100 xl:min-w-[220px] xl:text-right">
          <p className="text-xs font-black uppercase tracking-wide text-stone-400">
            Сума
          </p>

          <p className="mt-1 text-3xl font-black text-stone-950">
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
            <p className="mt-3 text-xs leading-5 text-stone-500">
              Завершено:
              <br />
              {formatDate(order.finalizedAt)}
            </p>
          )}
        </div>
      </div>

      <div className="eg-panel mt-5 rounded-[1.7rem] bg-stone-50/90 p-5">
        <p className="mb-3 text-sm font-black text-stone-800">
          Склад замовлення
        </p>

        <div className="space-y-2">
          {(order.items || []).map((item) => (
            <div
              key={`${order.id}-${item.productId || item.id}-${item.name}`}
              className="flex justify-between gap-4 rounded-2xl bg-white/75 px-4 py-3 text-sm text-stone-700 ring-1 ring-stone-100"
            >
              <span>
                {item.name} · {item.quantity} шт × {formatUAH(item.price)}
              </span>

              <span className="font-black text-stone-950">
                {formatUAH(item.total)}
              </span>
            </div>
          ))}
        </div>

        {order.comment && (
          <div className="mt-4 rounded-2xl bg-white/75 p-4 text-sm text-stone-600 ring-1 ring-stone-100">
            <span className="font-black text-stone-800">Коментар:</span>{" "}
            {order.comment}
          </div>
        )}
      </div>

      {!final && (
        <div className="mt-5 rounded-[1.7rem] bg-white/70 p-4 ring-1 ring-stone-100">
          <p className="mb-3 text-sm font-black text-stone-700">
            Дії із замовленням
          </p>

          <OrderActions order={order} onAction={handleAction} />
        </div>
      )}

      {final && (
        <div className="eg-panel mt-5 rounded-[1.7rem] bg-stone-50/90 p-5">
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
                className="rounded-2xl bg-white/75 px-4 py-3 text-sm text-stone-600 ring-1 ring-stone-100"
              >
                <span className="font-black text-stone-800">
                  {formatDate(item.at)}
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