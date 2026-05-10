import { useMemo, useState } from "react";
import OrderCard from "./OrderCard.jsx";
import {
  ACTIVE_ORDER_STATUSES,
  getOrderStatusLabel,
  isFinalOrder,
  normalizeOrderStatus,
} from "./orderUiConfig.js";

export default function AdminOrdersPanel({ orders, updateOrderAction }) {
  const [section, setSection] = useState("active");
  const [activeStatus, setActiveStatus] = useState("all");
  const [query, setQuery] = useState("");

  const activeOrders = useMemo(
    () => orders.filter((order) => !isFinalOrder(order)),
    [orders]
  );

  const historyOrders = useMemo(
    () => orders.filter((order) => isFinalOrder(order)),
    [orders]
  );

  const visibleOrders = useMemo(() => {
    const base = section === "active" ? activeOrders : historyOrders;
    const normalizedQuery = query.toLowerCase().trim();

    return base.filter((order) => {
      const normalizedStatus = normalizeOrderStatus(order.status);

      const statusMatch =
        section !== "active" ||
        activeStatus === "all" ||
        normalizedStatus === activeStatus;

      const searchableText = [
        order.orderNumber,
        order.customerName,
        order.customerPhone,
        order.customerTelegram,
        getOrderStatusLabel(order.status),
        order.status,
        order.paymentStatus,
        order.total,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const queryMatch =
        !normalizedQuery || searchableText.includes(normalizedQuery);

      return statusMatch && queryMatch;
    });
  }, [section, activeOrders, historyOrders, activeStatus, query]);

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-black text-stone-950">Замовлення</h2>

          <p className="mt-2 text-sm text-stone-500">
            Активні замовлення можна рухати тільки кнопками. Завершені та
            скасовані переходять в історію.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSection("active")}
            className={`rounded-2xl px-4 py-3 text-sm font-black ${
              section === "active"
                ? "bg-stone-950 text-white"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            Активні · {activeOrders.length}
          </button>

          <button
            type="button"
            onClick={() => setSection("history")}
            className={`rounded-2xl px-4 py-3 text-sm font-black ${
              section === "history"
                ? "bg-stone-950 text-white"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            Історія · {historyOrders.length}
          </button>
        </div>
      </div>

      <div className="mt-5">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
          placeholder="Пошук за номером, імʼям, телефоном або Telegram..."
        />
      </div>

      {section === "active" && (
        <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
          {ACTIVE_ORDER_STATUSES.map((status) => {
            const count =
              status === "all"
                ? activeOrders.length
                : activeOrders.filter(
                    (order) => normalizeOrderStatus(order.status) === status
                  ).length;

            return (
              <button
                key={status}
                type="button"
                onClick={() => setActiveStatus(status)}
                className={`whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  activeStatus === status
                    ? "bg-emerald-900 text-white"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                {status === "all" ? "Усі" : getOrderStatusLabel(status)} ·{" "}
                {count}
              </button>
            );
          })}
        </div>
      )}

      {!visibleOrders.length && (
        <div className="mt-6 rounded-3xl bg-stone-50 p-8 text-center text-stone-500">
          {section === "active"
            ? "Активних замовлень за цим фільтром немає."
            : "Історія замовлень поки що порожня."}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {visibleOrders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            updateOrderAction={updateOrderAction}
          />
        ))}
      </div>
    </section>
  );
}