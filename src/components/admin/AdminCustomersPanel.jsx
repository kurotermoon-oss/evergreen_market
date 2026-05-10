import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../api/client.js";

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) return "—";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("uk-UA")} грн`;
}

function getVerificationLabel(customer) {
  if (customer.isFullyVerified) {
    return {
      label: "Підтверджено",
      className: "bg-emerald-50 text-emerald-800 ring-emerald-100",
    };
  }

  if (customer.isTelegramVerified || customer.isPhoneVerified) {
    return {
      label: "Частково",
      className: "bg-amber-50 text-amber-800 ring-amber-100",
    };
  }

  return {
    label: "Не підтверджено",
    className: "bg-stone-100 text-stone-700 ring-stone-200",
  };
}

function CustomerBadge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ring-1 ${className}`}
    >
      {children}
    </span>
  );
}

export default function AdminCustomersPanel() {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [expandedCustomerId, setExpandedCustomerId] = useState(null);
  const [customerOrders, setCustomerOrders] = useState({});
  const [loadingOrdersId, setLoadingOrdersId] = useState(null);

  const loadCustomers = useCallback(async (nextSearch = "") => {
  setIsLoading(true);
  setActionMessage("");

  try {
    const response = await api.getAdminCustomers({
      search: nextSearch,
    });

    setCustomers(response.customers || []);
  } catch (error) {
    setActionMessage(
      error?.message || "Не вдалося завантажити клієнтів."
    );
  } finally {
    setIsLoading(false);
  }
}, []);

useEffect(() => {
  const timeoutId = window.setTimeout(() => {
    loadCustomers(searchQuery.trim());
  }, 350);

  return () => {
    window.clearTimeout(timeoutId);
  };
}, [searchQuery, loadCustomers]);

async function handleSearch(event) {
  event.preventDefault();

  await loadCustomers(searchQuery.trim());
}

  async function loadCustomerOrders(customerId) {
    if (expandedCustomerId === customerId) {
      setExpandedCustomerId(null);
      return;
    }

    setExpandedCustomerId(customerId);

    if (customerOrders[customerId]) return;

    setLoadingOrdersId(customerId);

    try {
      const response = await api.getAdminCustomerOrders(customerId);

      setCustomerOrders((current) => ({
        ...current,
        [customerId]: response.orders || [],
      }));
    } catch (error) {
      setActionMessage(
        error?.message || "Не вдалося завантажити замовлення клієнта."
      );
    } finally {
      setLoadingOrdersId(null);
    }
  }

  async function blockCustomer(type, value, label) {
    const reason = window.prompt(
      `Причина блокування: ${label}`,
      "Підозріла активність"
    );

    if (reason === null) return;

    try {
      await api.createBlockedCustomer({
        type,
        value,
        reason,
      });

      setActionMessage("Блокування додано.");
      await loadCustomers(searchQuery);
    } catch (error) {
      setActionMessage(error?.message || "Не вдалося створити блокування.");
    }
  }

  async function unblockCustomer(blockedItem) {
    const confirmed = window.confirm(
      `Видалити блокування ${blockedItem.type}: ${blockedItem.value}?`
    );

    if (!confirmed) return;

    try {
      await api.deleteBlockedCustomer(blockedItem.id);

      setActionMessage("Блокування видалено.");
      await loadCustomers(searchQuery);
    } catch (error) {
      setActionMessage(error?.message || "Не вдалося видалити блокування.");
    }
  }

  const stats = useMemo(() => {
    return customers.reduce(
      (acc, customer) => {
        acc.total += 1;

        if (customer.isFullyVerified) acc.verified += 1;
        if (customer.isBlocked) acc.blocked += 1;
        if (customer.activeOrdersCount > 0) acc.withActiveOrders += 1;

        acc.revenue += Number(customer.completedRevenue || 0);

        return acc;
      },
      {
        total: 0,
        verified: 0,
        blocked: 0,
        withActiveOrders: 0,
        revenue: 0,
      }
    );
  }, [customers]);

  return (
    <section className="space-y-5">
      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-stone-100">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Адмінка
            </p>

            <h2 className="mt-1 text-3xl font-black text-stone-950">
              Клієнти
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">
              Зареєстровані користувачі, статус підтвердження, історія
              замовлень та блокування контактів.
            </p>
          </div>

            <form onSubmit={handleSearch} className="flex w-full gap-2 lg:w-auto">
            <div className="relative w-full lg:w-80">
                <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Пошук: імʼя, телефон, Telegram"
                className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 pr-12 text-sm outline-none focus:border-emerald-700"
                />

                {searchQuery && (
                <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-stone-100 px-2 py-1 text-xs font-black text-stone-500 hover:bg-stone-200"
                >
                    ×
                </button>
                )}
            </div>

            <button
                type="submit"
                className="rounded-2xl bg-emerald-900 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800"
            >
                Знайти
            </button>
            </form>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-3xl bg-stone-50 p-4">
            <p className="text-xs font-black uppercase text-stone-400">
              Клієнтів
            </p>
            <p className="mt-1 text-2xl font-black text-stone-950">
              {stats.total}
            </p>
          </div>

          <div className="rounded-3xl bg-stone-50 p-4">
            <p className="text-xs font-black uppercase text-stone-400">
              Підтверджені
            </p>
            <p className="mt-1 text-2xl font-black text-emerald-800">
              {stats.verified}
            </p>
          </div>

          <div className="rounded-3xl bg-stone-50 p-4">
            <p className="text-xs font-black uppercase text-stone-400">
              Активні замовлення
            </p>
            <p className="mt-1 text-2xl font-black text-blue-800">
              {stats.withActiveOrders}
            </p>
          </div>

          <div className="rounded-3xl bg-stone-50 p-4">
            <p className="text-xs font-black uppercase text-stone-400">
              Заблоковані
            </p>
            <p className="mt-1 text-2xl font-black text-red-800">
              {stats.blocked}
            </p>
          </div>

          <div className="rounded-3xl bg-stone-50 p-4">
            <p className="text-xs font-black uppercase text-stone-400">
              Виручка
            </p>
            <p className="mt-1 text-2xl font-black text-stone-950">
              {formatMoney(stats.revenue)}
            </p>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="rounded-3xl bg-amber-50 p-4 text-sm font-semibold text-amber-900 ring-1 ring-amber-100">
          {actionMessage}
        </div>
      )}

      <div className="rounded-[2rem] bg-white p-4 shadow-sm ring-1 ring-stone-100">
        {isLoading ? (
          <div className="rounded-3xl bg-stone-50 p-8 text-center font-bold text-stone-500">
            Завантажуємо клієнтів...
          </div>
        ) : customers.length === 0 ? (
          <div className="rounded-3xl bg-stone-50 p-8 text-center">
            <p className="font-black text-stone-900">Клієнтів не знайдено</p>
            <p className="mt-2 text-sm text-stone-500">
              Спробуйте змінити пошуковий запит.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {customers.map((customer) => {
              const verification = getVerificationLabel(customer);
              const orders = customerOrders[customer.id] || [];
              const isExpanded = expandedCustomerId === customer.id;

              return (
                <article
                  key={customer.id}
                  className={`rounded-3xl border p-4 ${
                    customer.isBlocked
                      ? "border-red-200 bg-red-50/50"
                      : "border-stone-200 bg-white"
                  }`}
                >
                  <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr_auto] xl:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-black text-stone-950">
                          {customer.name || "Без імені"}
                        </h3>

                        <CustomerBadge className={verification.className}>
                          {verification.label}
                        </CustomerBadge>

                        {customer.isBlocked && (
                          <CustomerBadge className="bg-red-100 text-red-800 ring-red-200">
                            Заблоковано
                          </CustomerBadge>
                        )}
                      </div>

                      <div className="mt-3 space-y-1 text-sm text-stone-600">
                        <p>
                          <span className="font-bold text-stone-900">
                            Телефон:
                          </span>{" "}
                          {customer.phone || "—"}
                        </p>

                        <p>
                          <span className="font-bold text-stone-900">
                            Telegram:
                          </span>{" "}
                          {customer.telegram
                            ? `@${customer.telegram}`
                            : "—"}
                        </p>

                        <p>
                          <span className="font-bold text-stone-900">
                            Адреса:
                          </span>{" "}
                          {[customer.building, customer.entrance, customer.floor, customer.apartment]
                            .filter(Boolean)
                            .join(", ") || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-2xl bg-stone-50 p-3">
                        <p className="text-xs font-black uppercase text-stone-400">
                          Замовлень
                        </p>
                        <p className="mt-1 font-black text-stone-950">
                          {customer.ordersCount}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-stone-50 p-3">
                        <p className="text-xs font-black uppercase text-stone-400">
                          Активні
                        </p>
                        <p className="mt-1 font-black text-blue-800">
                          {customer.activeOrdersCount}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-stone-50 p-3">
                        <p className="text-xs font-black uppercase text-stone-400">
                          Видано
                        </p>
                        <p className="mt-1 font-black text-emerald-800">
                          {customer.completedOrdersCount}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-stone-50 p-3">
                        <p className="text-xs font-black uppercase text-stone-400">
                          Скасовано
                        </p>
                        <p className="mt-1 font-black text-red-800">
                          {customer.cancelledOrdersCount}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-stone-600">
                      <p>
                        <span className="font-bold text-stone-900">
                          Сума виданих:
                        </span>{" "}
                        {formatMoney(customer.completedRevenue)}
                      </p>

                      <p>
                        <span className="font-bold text-stone-900">
                          Останнє замовлення:
                        </span>{" "}
                        {formatDate(customer.lastOrderAt)}
                      </p>

                      <p>
                        <span className="font-bold text-stone-900">
                          Реєстрація:
                        </span>{" "}
                        {formatDate(customer.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => loadCustomerOrders(customer.id)}
                        className="rounded-2xl bg-stone-900 px-4 py-3 text-sm font-black text-white hover:bg-stone-800"
                      >
                        {isExpanded ? "Сховати" : "Замовлення"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          blockCustomer(
                            "customerId",
                            customer.id,
                            `клієнта #${customer.id}`
                          )
                        }
                        className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-800 ring-1 ring-red-200 hover:bg-red-100"
                      >
                        Блок акаунта
                      </button>

                      {customer.phone && (
                        <button
                          type="button"
                          onClick={() =>
                            blockCustomer(
                              "phone",
                              customer.phone,
                              customer.phone
                            )
                          }
                          className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-black text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100"
                        >
                          Блок телефону
                        </button>
                      )}

                      {customer.telegram && (
                        <button
                          type="button"
                          onClick={() =>
                            blockCustomer(
                              "telegram",
                              customer.telegram,
                              `@${customer.telegram}`
                            )
                          }
                          className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-black text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100"
                        >
                          Блок Telegram
                        </button>
                      )}
                    </div>
                  </div>

                  {customer.blockedItems?.length > 0 && (
                    <div className="mt-4 rounded-3xl bg-white p-4 ring-1 ring-red-100">
                      <p className="text-sm font-black text-red-800">
                        Активні блокування
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {customer.blockedItems.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => unblockCustomer(item)}
                            className="rounded-full bg-red-50 px-3 py-2 text-xs font-black text-red-800 ring-1 ring-red-200 hover:bg-red-100"
                          >
                            {item.type}: {item.value} · видалити
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {isExpanded && (
                    <div className="mt-4 rounded-3xl bg-stone-50 p-4">
                      <p className="font-black text-stone-950">
                        Замовлення клієнта
                      </p>

                      {loadingOrdersId === customer.id ? (
                        <p className="mt-3 text-sm text-stone-500">
                          Завантажуємо замовлення...
                        </p>
                      ) : orders.length === 0 ? (
                        <p className="mt-3 text-sm text-stone-500">
                          Замовлень поки немає.
                        </p>
                      ) : (
                        <div className="mt-3 overflow-x-auto">
                          <table className="min-w-full text-left text-sm">
                            <thead>
                              <tr className="text-xs uppercase text-stone-400">
                                <th className="px-3 py-2">№</th>
                                <th className="px-3 py-2">Дата</th>
                                <th className="px-3 py-2">Статус</th>
                                <th className="px-3 py-2">Сума</th>
                                <th className="px-3 py-2">Товари</th>
                              </tr>
                            </thead>

                            <tbody>
                              {orders.map((order) => (
                                <tr
                                  key={order.id}
                                  className="border-t border-stone-200"
                                >
                                  <td className="px-3 py-3 font-black">
                                    #{order.orderNumber}
                                  </td>
                                  <td className="px-3 py-3">
                                    {formatDate(order.createdAt)}
                                  </td>
                                  <td className="px-3 py-3">
                                    {order.status}
                                  </td>
                                  <td className="px-3 py-3 font-bold">
                                    {formatMoney(order.total)}
                                  </td>
                                  <td className="px-3 py-3 text-stone-600">
                                    {(order.items || [])
                                      .map(
                                        (item) =>
                                          `${item.name} × ${item.quantity}`
                                      )
                                      .join(", ")}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}