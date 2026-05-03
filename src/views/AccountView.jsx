import { useEffect } from "react";
import { formatUAH } from "../utils/formatUAH.js";

const ORDER_STATUS_LABELS = {
  new: "Нове",
  confirmed: "Підтверджено",
  preparing: "Готується",
  ready: "Готово до видачі",
  completed: "Завершено",
  cancelled: "Скасовано",

  Новий: "Нове",
  Нове: "Нове",
  Підтверджено: "Підтверджено",
  Готується: "Готується",
  "Готово до видачі": "Готово до видачі",
  Завершено: "Завершено",
  Скасовано: "Скасовано",
};

const PAYMENT_STATUS_LABELS = {
  unpaid: "Не оплачено",
  paid: "Оплачено",
  refunded: "Повернення",

  "Не оплачено": "Не оплачено",
  Оплачено: "Оплачено",
  Повернення: "Повернення",
};

const ORDER_STATUS_CLASS = {
  new: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-orange-100 text-orange-800",
  ready: "bg-green-100 text-green-800",
  completed: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-red-100 text-red-800",
};

const PAYMENT_STATUS_CLASS = {
  unpaid: "bg-stone-100 text-stone-700",
  paid: "bg-emerald-100 text-emerald-900",
  refunded: "bg-orange-100 text-orange-800",
};

const ORDER_STEPS = [
  {
    id: "new",
    label: "Створено",
  },
  {
    id: "confirmed",
    label: "Підтверджено",
  },
  {
    id: "preparing",
    label: "Готується",
  },
  {
    id: "ready",
    label: "Готово до видачі",
  },
  {
    id: "completed",
    label: "Завершено",
  },
];

const STATUS_ALIASES = {
  Новий: "new",
  Нове: "new",
  Підтверджено: "confirmed",
  Готується: "preparing",
  "Готово до видачі": "ready",
  Завершено: "completed",
  Скасовано: "cancelled",
};

const PAYMENT_ALIASES = {
  "Не оплачено": "unpaid",
  Оплачено: "paid",
  Повернення: "refunded",
};

function normalizeOrderStatus(status) {
  return STATUS_ALIASES[status] || status || "new";
}

function normalizePaymentStatus(status) {
  return PAYMENT_ALIASES[status] || status || "unpaid";
}

function getOrderStatusLabel(status) {
  const normalizedStatus = normalizeOrderStatus(status);
  return ORDER_STATUS_LABELS[normalizedStatus] || "Нове";
}

function getPaymentStatusLabel(status) {
  const normalizedStatus = normalizePaymentStatus(status);
  return PAYMENT_STATUS_LABELS[normalizedStatus] || "Не оплачено";
}

function getOrderStatusClass(status) {
  const normalizedStatus = normalizeOrderStatus(status);
  return ORDER_STATUS_CLASS[normalizedStatus] || "bg-stone-100 text-stone-700";
}

function getPaymentStatusClass(status) {
  const normalizedStatus = normalizePaymentStatus(status);
  return PAYMENT_STATUS_CLASS[normalizedStatus] || "bg-stone-100 text-stone-700";
}

function formatDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStepIndex(status) {
  const normalizedStatus = normalizeOrderStatus(status);

  if (normalizedStatus === "cancelled") {
    return -1;
  }

  return ORDER_STEPS.findIndex((step) => step.id === normalizedStatus);
}

function getHistoryStepFromLabel(label = "") {
  const normalizedLabel = label.toLowerCase();

  if (normalizedLabel.includes("створено")) return "new";
  if (normalizedLabel.includes("підтверджено")) return "confirmed";
  if (normalizedLabel.includes("готується")) return "preparing";
  if (normalizedLabel.includes("готове")) return "ready";
  if (normalizedLabel.includes("завершено")) return "completed";
  if (normalizedLabel.includes("скасовано")) return "cancelled";

  return null;
}

function getStepTime(order, stepId) {
  if (stepId === "new") {
    const createdEvent = order.statusHistory?.find((event) => {
      return event.type === "order_created" || event.type === "created";
    });

    return createdEvent?.at || order.createdAt;
  }

  const event = order.statusHistory?.find((historyItem) => {
    const normalizedTo = normalizeOrderStatus(historyItem.to);
    const stepFromLabel = getHistoryStepFromLabel(historyItem.label);

    return normalizedTo === stepId || stepFromLabel === stepId;
  });

  return event?.at || "";
}

function getVisibleStatusEvents(order) {
  return (order.statusHistory || []).filter((event) => {
    if (event.type === "payment_changed") return false;

    const stepFromLabel = getHistoryStepFromLabel(event.label);
    return Boolean(stepFromLabel);
  });
}

function getPaymentEvents(order) {
  return (order.statusHistory || []).filter((event) => {
    return event.type === "payment_changed";
  });
}

function getDeliveryLabel(order) {
  if (order.deliveryType === "building") {
    return "Доставка по ЖК";
  }

  return "Самовивіз з кавʼярні";
}

function OrderProgress({ order }) {
  const normalizedStatus = normalizeOrderStatus(order.status);
  const currentStepIndex = getStepIndex(normalizedStatus);
  const isCancelled = normalizedStatus === "cancelled";

  if (isCancelled) {
    return (
      <div className="rounded-3xl border border-red-100 bg-red-50 p-5">
        <p className="font-black text-red-800">Замовлення скасовано</p>

        {order.cancelReason && (
          <p className="mt-2 text-sm leading-6 text-red-700">
            Причина: {order.cancelReason}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-stone-50 p-5">
      <p className="mb-4 text-sm font-black text-stone-800">
        Прогрес замовлення
      </p>

      <div className="space-y-3">
        {ORDER_STEPS.map((step, index) => {
          const isDone = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const stepTime = getStepTime(order, step.id);

          return (
            <div
              key={step.id}
              className="grid grid-cols-[28px_1fr] gap-3"
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
                  isDone
                    ? "bg-emerald-900 text-white"
                    : "bg-white text-stone-400"
                }`}
              >
                {isDone ? "✓" : index + 1}
              </div>

              <div>
                <p
                  className={`text-sm font-black ${
                    isCurrent
                      ? "text-emerald-900"
                      : isDone
                        ? "text-stone-950"
                        : "text-stone-400"
                  }`}
                >
                  {step.label}
                </p>

                {stepTime && (
                  <p className="mt-0.5 text-xs text-stone-500">
                    {formatDate(stepTime)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderCard({ order }) {
  const normalizedStatus = normalizeOrderStatus(order.status);
  const normalizedPaymentStatus = normalizePaymentStatus(order.paymentStatus);
  const visibleStatusEvents = getVisibleStatusEvents(order);
  const paymentEvents = getPaymentEvents(order);

  return (
    <div className="rounded-3xl border border-stone-200 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            #{order.orderNumber} · {formatDate(order.createdAt)}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-black ${getOrderStatusClass(
                normalizedStatus
              )}`}
            >
              {getOrderStatusLabel(normalizedStatus)}
            </span>

            <span
              className={`rounded-full px-3 py-1 text-xs font-black ${getPaymentStatusClass(
                normalizedPaymentStatus
              )}`}
            >
              {getPaymentStatusLabel(normalizedPaymentStatus)}
            </span>

            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-700">
              {getDeliveryLabel(order)}
            </span>
          </div>
        </div>

        <p className="text-2xl font-black text-stone-950">
          {formatUAH(order.total)}
        </p>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.85fr]">
        <div className="space-y-4">
          <div className="rounded-3xl bg-stone-50 p-5">
            <p className="mb-3 text-sm font-black text-stone-800">
              Склад замовлення
            </p>

            <div className="space-y-2">
              {(order.items || []).map((item) => {
                const quantity = Number(item.quantity || 0);
                const price = Number(item.price || 0);
                const total = Number(item.total || price * quantity);

                return (
                  <div
                    key={`${order.id}-${item.productId || item.id}-${item.name}`}
                    className="flex justify-between gap-4 text-sm text-stone-700"
                  >
                    <span>
                      {item.name} · {quantity} шт × {formatUAH(price)}
                    </span>

                    <span className="font-bold">{formatUAH(total)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {order.deliveryType === "building" && (
            <div className="rounded-3xl bg-stone-50 p-5">
              <p className="mb-3 text-sm font-black text-stone-800">
                Адреса доставки
              </p>

              <div className="grid gap-2 text-sm text-stone-600 sm:grid-cols-2">
                <p>Корпус/будинок: {order.building || "—"}</p>
                <p>Підʼїзд: {order.entrance || "—"}</p>
                <p>Поверх: {order.floor || "—"}</p>
                <p>Квартира: {order.apartment || "—"}</p>
              </div>
            </div>
          )}

          {order.comment && (
            <div className="rounded-3xl bg-stone-50 p-5">
              <p className="mb-2 text-sm font-black text-stone-800">
                Коментар
              </p>

              <p className="text-sm leading-6 text-stone-600">
                {order.comment}
              </p>
            </div>
          )}
        </div>

        <OrderProgress order={order} />
      </div>

      {(visibleStatusEvents.length > 0 || paymentEvents.length > 0) && (
        <details className="mt-5 rounded-3xl bg-white">
          <summary className="cursor-pointer text-sm font-black text-stone-700 hover:text-emerald-800">
            Детальна історія
          </summary>

          <div className="mt-3 space-y-4">
            {visibleStatusEvents.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-wide text-stone-400">
                  Замовлення
                </p>

                <div className="space-y-1">
                  {visibleStatusEvents.map((item, index) => (
                    <p
                      key={`${order.id}-status-history-${index}`}
                      className="text-sm text-stone-500"
                    >
                      {formatDate(item.at)} — {item.label}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {paymentEvents.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-black uppercase tracking-wide text-stone-400">
                  Оплата
                </p>

                <div className="space-y-1">
                  {paymentEvents.map((item, index) => (
                    <p
                      key={`${order.id}-payment-history-${index}`}
                      className="text-sm text-stone-500"
                    >
                      {formatDate(item.at)} — {item.label}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}

export default function AccountView({
  customer,
  customerOrders,
  loadCustomerOrders,
  customerLogout,
  setView,
}) {
useEffect(() => {
  if (!customer) return;

  loadCustomerOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [customer?.id]);

  if (!customer) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="rounded-3xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-black text-stone-950">
            Ви ще не увійшли
          </h1>

          <button
            type="button"
            onClick={() => setView("customer-auth")}
            className="mt-5 rounded-2xl bg-emerald-900 px-5 py-3 font-bold text-white hover:bg-emerald-800"
          >
            Увійти або зареєструватися
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Особистий кабінет
            </p>

            <h1 className="mt-2 text-3xl font-black text-stone-950">
              {customer.name}
            </h1>

            <p className="mt-2 text-stone-600">
              Телефон: {customer.phone || "—"} · Telegram:{" "}
              {customer.telegram ? `@${customer.telegram}` : "—"}
            </p>

            <p className="mt-1 text-sm text-stone-500">
              Адреса: буд. {customer.building || "—"}, підʼїзд{" "}
              {customer.entrance || "—"}, поверх {customer.floor || "—"}, кв.{" "}
              {customer.apartment || "—"}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setView("catalog")}
              className="rounded-2xl bg-emerald-900 px-5 py-3 font-bold text-white hover:bg-emerald-800"
            >
              До каталогу
            </button>

            <button
              type="button"
              onClick={customerLogout}
              className="rounded-2xl border border-stone-300 px-5 py-3 font-bold text-stone-900 hover:bg-stone-100"
            >
              Вийти
            </button>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black text-stone-950">Мої замовлення</h2>

        {!customerOrders.length && (
          <div className="mt-6 rounded-3xl bg-stone-50 p-8 text-center text-stone-500">
            У вас ще немає замовлень.
          </div>
        )}

        <div className="mt-6 space-y-5">
          {customerOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </section>
    </main>
  );
}