import { useEffect, useMemo, useState } from "react";
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

function getRiskClass(level) {
  if (level === "high") {
    return "bg-red-50 text-red-800 ring-red-200";
  }

  if (level === "medium") {
    return "bg-amber-50 text-amber-800 ring-amber-200";
  }

  return "bg-emerald-50 text-emerald-800 ring-emerald-100";
}

function getTypeLabel(type) {
  const labels = {
    ip: "IP",
    phone: "Телефон",
    telegram: "Telegram",
    guestId: "Гість",
    customerId: "Клієнт",
  };

  return labels[type] || type;
}

function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ring-1 ${className}`}
    >
      {children}
    </span>
  );
}

export default function AdminSecurityPanel() {
  const [guests, setGuests] = useState([]);
  const [blockedCustomers, setBlockedCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeView, setActiveView] = useState("guests");
  const [expandedGuestKey, setExpandedGuestKey] = useState(null);

  async function loadSecurityData() {
    setIsLoading(true);
    setMessage("");

    try {
      const [guestResponse, blockedResponse] = await Promise.all([
        api.getAdminGuestActivity(),
        api.getAdminSecurityBlockedCustomers(),
      ]);

      setGuests(guestResponse.guests || []);
      setBlockedCustomers(blockedResponse.blockedCustomers || []);
    } catch (error) {
      setMessage(error?.message || "Не вдалося завантажити безпеку.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSecurityData();
  }, []);

  async function createBlock(type, value, defaultReason = "Підозріла активність") {
    if (!value) return;

    const reason = window.prompt(
      `Причина блокування: ${getTypeLabel(type)} ${value}`,
      defaultReason
    );

    if (reason === null) return;

    try {
      await api.createAdminSecurityBlockedCustomer({
        type,
        value,
        reason,
      });

      setMessage("Блокування додано.");
      await loadSecurityData();
    } catch (error) {
      setMessage(error?.message || "Не вдалося створити блокування.");
    }
  }

  async function deleteBlock(item) {
    const confirmed = window.confirm(
      `Видалити блокування ${getTypeLabel(item.type)}: ${item.value}?`
    );

    if (!confirmed) return;

    try {
      await api.deleteAdminSecurityBlockedCustomer(item.id);

      setMessage("Блокування видалено.");
      await loadSecurityData();
    } catch (error) {
      setMessage(error?.message || "Не вдалося видалити блокування.");
    }
  }

  const stats = useMemo(() => {
    return guests.reduce(
      (acc, guest) => {
        acc.total += 1;
        acc.orders += Number(guest.ordersCount || 0);
        acc.active += Number(guest.activeOrdersCount || 0);
        acc.cancelled += Number(guest.cancelledOrdersCount || 0);

        if (guest.risk?.level === "high") acc.highRisk += 1;
        if (guest.isBlocked) acc.blocked += 1;

        return acc;
      },
      {
        total: 0,
        orders: 0,
        active: 0,
        cancelled: 0,
        highRisk: 0,
        blocked: 0,
      }
    );
  }, [guests]);

  return (
    <section className="space-y-5">
      <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-stone-100">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Адмінка
            </p>

            <h2 className="mt-1 text-3xl font-black text-stone-950">
              Безпека
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-500">
              Гостьові замовлення, підозріла активність, IP, контакти та ручні
              блокування.
            </p>
          </div>

          <button
            type="button"
            onClick={loadSecurityData}
            className="rounded-2xl border border-stone-300 px-5 py-3 text-sm font-black text-stone-900 hover:bg-stone-100"
          >
            Оновити
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-3xl bg-stone-50 p-4">
            <p className="text-xs font-black uppercase text-stone-400">
              Гостей
            </p>
            <p className="mt-1 text-2xl font-black text-stone-950">
              {stats.total}
            </p>
          </div>

          <div className="rounded-3xl bg-stone-50 p-4">
            <p className="text-xs font-black uppercase text-stone-400">
              Замовлень
            </p>
            <p className="mt-1 text-2xl font-black text-stone-950">
              {stats.orders}
            </p>
          </div>

          <div className="rounded-3xl bg-stone-50 p-4">
            <p className="text-xs font-black uppercase text-stone-400">
              Активні
            </p>
            <p className="mt-1 text-2xl font-black text-blue-800">
              {stats.active}
            </p>
          </div>

          <div className="rounded-3xl bg-stone-50 p-4">
            <p className="text-xs font-black uppercase text-stone-400">
              Скасовані
            </p>
            <p className="mt-1 text-2xl font-black text-red-800">
              {stats.cancelled}
            </p>
          </div>

          <div className="rounded-3xl bg-stone-50 p-4">
            <p className="text-xs font-black uppercase text-stone-400">
              Високий ризик
            </p>
            <p className="mt-1 text-2xl font-black text-red-800">
              {stats.highRisk}
            </p>
          </div>

          <div className="rounded-3xl bg-stone-50 p-4">
            <p className="text-xs font-black uppercase text-stone-400">
              Блокувань
            </p>
            <p className="mt-1 text-2xl font-black text-stone-950">
              {blockedCustomers.length}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto rounded-3xl bg-white p-2 shadow-sm ring-1 ring-stone-100">
        <button
          type="button"
          onClick={() => setActiveView("guests")}
          className={`rounded-2xl px-5 py-3 text-sm font-black transition ${
            activeView === "guests"
              ? "bg-emerald-900 text-white"
              : "text-stone-700 hover:bg-stone-100"
          }`}
        >
          Гостьові замовлення
        </button>

        <button
          type="button"
          onClick={() => setActiveView("blocked")}
          className={`rounded-2xl px-5 py-3 text-sm font-black transition ${
            activeView === "blocked"
              ? "bg-emerald-900 text-white"
              : "text-stone-700 hover:bg-stone-100"
          }`}
        >
          Заблоковані
        </button>
      </div>

      {message && (
        <div className="rounded-3xl bg-amber-50 p-4 text-sm font-semibold text-amber-900 ring-1 ring-amber-100">
          {message}
        </div>
      )}

      {isLoading ? (
        <div className="rounded-[2rem] bg-white p-8 text-center font-bold text-stone-500 shadow-sm ring-1 ring-stone-100">
          Завантажуємо дані безпеки...
        </div>
      ) : activeView === "guests" ? (
        <div className="rounded-[2rem] bg-white p-4 shadow-sm ring-1 ring-stone-100">
          {guests.length === 0 ? (
            <div className="rounded-3xl bg-stone-50 p-8 text-center">
              <p className="font-black text-stone-900">
                Гостьових замовлень немає
              </p>
              <p className="mt-2 text-sm text-stone-500">
                Тут зʼявляться користувачі, які оформлювали замовлення без
                реєстрації.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {guests.map((guest) => {
                const isExpanded = expandedGuestKey === guest.key;

                return (
                  <article
                    key={guest.key}
                    className={`rounded-3xl border p-4 ${
                      guest.isBlocked
                        ? "border-red-200 bg-red-50/50"
                        : "border-stone-200 bg-white"
                    }`}
                  >
                    <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr_1fr_auto]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black text-stone-950">
                            {guest.mainName || "Гість"}
                          </h3>

                          <Badge className={getRiskClass(guest.risk?.level)}>
                            {guest.risk?.label || "Низький ризик"}
                          </Badge>

                          {guest.isBlocked && (
                            <Badge className="bg-red-100 text-red-800 ring-red-200">
                              Заблоковано
                            </Badge>
                          )}
                        </div>

                        <div className="mt-3 space-y-1 text-sm text-stone-600">
                          <p>
                            <span className="font-bold text-stone-900">
                              Телефон:
                            </span>{" "}
                            {guest.mainPhone || "—"}
                          </p>

                          <p>
                            <span className="font-bold text-stone-900">
                              Telegram:
                            </span>{" "}
                            {guest.mainTelegram
                              ? `@${String(guest.mainTelegram).replace(/^@/, "")}`
                              : "—"}
                          </p>

                          <p>
                            <span className="font-bold text-stone-900">
                              IP:
                            </span>{" "}
                            {guest.clientIp || "—"}
                          </p>

                          <p>
                            <span className="font-bold text-stone-900">
                              Guest ID:
                            </span>{" "}
                            {guest.guestId || "—"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-2xl bg-stone-50 p-3">
                          <p className="text-xs font-black uppercase text-stone-400">
                            Замовлень
                          </p>
                          <p className="mt-1 font-black text-stone-950">
                            {guest.ordersCount}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-stone-50 p-3">
                          <p className="text-xs font-black uppercase text-stone-400">
                            Сьогодні
                          </p>
                          <p className="mt-1 font-black text-blue-800">
                            {guest.ordersTodayCount}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-stone-50 p-3">
                          <p className="text-xs font-black uppercase text-stone-400">
                            Активні
                          </p>
                          <p className="mt-1 font-black text-blue-800">
                            {guest.activeOrdersCount}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-stone-50 p-3">
                          <p className="text-xs font-black uppercase text-stone-400">
                            Скасовані
                          </p>
                          <p className="mt-1 font-black text-red-800">
                            {guest.cancelledOrdersCount}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-stone-600">
                        <p>
                          <span className="font-bold text-stone-900">
                            Сума:
                          </span>{" "}
                          {formatMoney(guest.totalRevenue)}
                        </p>

                        <p>
                          <span className="font-bold text-stone-900">
                            Видано:
                          </span>{" "}
                          {formatMoney(guest.completedRevenue)}
                        </p>

                        <p>
                          <span className="font-bold text-stone-900">
                            Останнє:
                          </span>{" "}
                          {formatDate(guest.lastOrderAt)}
                        </p>

                        {guest.risk?.reasons?.length > 0 && (
                          <p>
                            <span className="font-bold text-stone-900">
                              Причини:
                            </span>{" "}
                            {guest.risk.reasons.join(", ")}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedGuestKey(isExpanded ? null : guest.key)
                          }
                          className="rounded-2xl bg-stone-900 px-4 py-3 text-sm font-black text-white hover:bg-stone-800"
                        >
                          {isExpanded ? "Сховати" : "Замовлення"}
                        </button>

                        {guest.clientIp && (
                          <button
                            type="button"
                            onClick={() =>
                              createBlock(
                                "ip",
                                guest.clientIp,
                                "Підозріла активність з IP"
                              )
                            }
                            className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-800 ring-1 ring-red-200 hover:bg-red-100"
                          >
                            Блок IP
                          </button>
                        )}

                        {guest.guestId && (
                          <button
                            type="button"
                            onClick={() =>
                              createBlock(
                                "guestId",
                                guest.guestId,
                                "Підозріла гостьова активність"
                              )
                            }
                            className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-800 ring-1 ring-red-200 hover:bg-red-100"
                          >
                            Блок гостя
                          </button>
                        )}

                        {guest.mainPhone && (
                          <button
                            type="button"
                            onClick={() =>
                              createBlock(
                                "phone",
                                guest.mainPhone,
                                "Підозрілі замовлення за телефоном"
                              )
                            }
                            className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-black text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100"
                          >
                            Блок телефону
                          </button>
                        )}

                        {guest.mainTelegram && (
                          <button
                            type="button"
                            onClick={() =>
                              createBlock(
                                "telegram",
                                guest.mainTelegram,
                                "Підозрілі замовлення за Telegram"
                              )
                            }
                            className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-black text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100"
                          >
                            Блок Telegram
                          </button>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 rounded-3xl bg-stone-50 p-4">
                        <p className="font-black text-stone-950">
                          Замовлення гостя
                        </p>

                        <div className="mt-3 overflow-x-auto">
                          <table className="min-w-full text-left text-sm">
                            <thead>
                              <tr className="text-xs uppercase text-stone-400">
                                <th className="px-3 py-2">№</th>
                                <th className="px-3 py-2">Дата</th>
                                <th className="px-3 py-2">Статус</th>
                                <th className="px-3 py-2">Контакт</th>
                                <th className="px-3 py-2">Сума</th>
                              </tr>
                            </thead>

                            <tbody>
                              {(guest.orders || []).map((order) => (
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
                                  <td className="px-3 py-3 text-stone-600">
                                    {order.customerPhone ||
                                      order.customerTelegram ||
                                      "—"}
                                  </td>
                                  <td className="px-3 py-3 font-bold">
                                    {formatMoney(order.total)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-[2rem] bg-white p-4 shadow-sm ring-1 ring-stone-100">
          {blockedCustomers.length === 0 ? (
            <div className="rounded-3xl bg-stone-50 p-8 text-center">
              <p className="font-black text-stone-900">Блокувань немає</p>
              <p className="mt-2 text-sm text-stone-500">
                Тут будуть IP, телефони, Telegram або гості, яких ви
                заблокували.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {blockedCustomers.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col gap-3 rounded-3xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-red-50 text-red-800 ring-red-200">
                        {getTypeLabel(item.type)}
                      </Badge>

                      <p className="font-black text-stone-950">
                        {item.value}
                      </p>
                    </div>

                    <p className="mt-2 text-sm text-stone-500">
                      {item.reason || "Без причини"} ·{" "}
                      {formatDate(item.createdAt)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteBlock(item)}
                    className="rounded-2xl bg-stone-900 px-4 py-3 text-sm font-black text-white hover:bg-stone-800"
                  >
                    Видалити
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}