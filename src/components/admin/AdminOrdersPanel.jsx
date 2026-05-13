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
    <section className="eg-glass eg-premium-card rounded-[2.5rem] p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-700">
            Адмінка
          </p>

          <h2 className="mt-2 text-3xl font-black text-stone-950">
            Замовлення
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
            Активні замовлення можна рухати тільки кнопками. Завершені та
            скасовані переходять в історію.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-[2rem] bg-stone-100/80 p-2 backdrop-blur">
          <button
            type="button"
            onClick={() => setSection("active")}
            className={`eg-button rounded-[1.4rem] px-4 py-3 text-sm font-black ${
              section === "active"
                ? "bg-emerald-900 text-white shadow-lg shadow-emerald-900/20"
                : "text-stone-700 hover:bg-white/80"
            }`}
          >
            Активні · {activeOrders.length}
          </button>

          <button
            type="button"
            onClick={() => setSection("history")}
            className={`eg-button rounded-[1.4rem] px-4 py-3 text-sm font-black ${
              section === "history"
                ? "bg-stone-950 text-white shadow-lg shadow-stone-950/20"
                : "text-stone-700 hover:bg-white/80"
            }`}
          >
            Історія · {historyOrders.length}
          </button>
        </div>
      </div>

      <div className="mt-6">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="eg-field w-full rounded-[1.4rem] border border-stone-200 bg-white/85 px-5 py-3.5 outline-none backdrop-blur focus:border-emerald-700 focus:bg-white"
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
                className={`eg-button whitespace-nowrap rounded-2xl px-4 py-3 text-sm font-bold ${
                  activeStatus === status
                    ? "bg-emerald-900 text-white shadow-lg shadow-emerald-900/20"
                    : "bg-white/80 text-stone-700 shadow-sm hover:bg-emerald-50 hover:text-emerald-900"
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
        <div className="eg-panel mt-6 rounded-[2rem] bg-stone-50/90 p-8 text-center text-stone-500">
          {section === "active"
            ? "Активних замовлень за цим фільтром немає."
            : "Історія замовлень поки що порожня."}
        </div>
      )}

      <div className="eg-stagger mt-6 space-y-4">
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