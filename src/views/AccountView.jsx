import { useEffect } from "react";
import Icon from "../components/Icon.jsx";
import { formatUAH } from "../utils/formatUAH.js";
import AdminOrdersPanel from "../components/admin/AdminOrdersPanel.jsx";
import AdminAnalyticsPanel from "../components/admin/AdminAnalyticsPanel.jsx";
import AdminProductForm from "../components/admin/AdminProductForm.jsx";
import AdminProductsPanel from "../components/admin/AdminProductsPanel.jsx";
import AdminProductEditModal from "../components/admin/AdminProductEditModal.jsx";

function getStatusClass(status) {
  const colors = {
    Новий: "bg-yellow-100 text-yellow-800",
    Підтверджено: "bg-blue-100 text-blue-800",
    Готується: "bg-orange-100 text-orange-800",
    "Готово до видачі": "bg-green-100 text-green-800",
    Завершено: "bg-emerald-100 text-emerald-900",
    Скасовано: "bg-red-100 text-red-800",
  };

  return colors[status] || "bg-stone-100 text-stone-700";
}

export default function AccountView({
  customer,
  customerOrders,
  loadCustomerOrders,
  customerLogout,
  setView,
}) {
  useEffect(() => {
    loadCustomerOrders();
  }, []);

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

        <div className="mt-6 space-y-4">
          {customerOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-3xl border border-stone-200 p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-700">
                    #{order.orderNumber} ·{" "}
                    {new Date(order.createdAt).toLocaleString("uk-UA")}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClass(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>

                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-700">
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>

                <p className="text-2xl font-black text-stone-950">
                  {formatUAH(order.total)}
                </p>
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
              </div>

              {order.statusHistory?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-black text-stone-700">
                    Історія:
                  </p>

                  <div className="mt-2 space-y-1">
                    {order.statusHistory.map((item, index) => (
                      <p
                        key={`${order.id}-history-${index}`}
                        className="text-sm text-stone-500"
                      >
                        {new Date(item.at).toLocaleString("uk-UA")} —{" "}
                        {item.label}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}