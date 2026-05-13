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

function StatCard({ label, value, tone = "stone" }) {
  const valueClass = {
    stone: "text-stone-950",
    emerald: "text-emerald-900",
    blue: "text-blue-800",
    red: "text-red-800",
    amber: "text-amber-800",
  }[tone];

  return (
    <div className="eg-card rounded-[1.6rem] bg-white/75 p-4 shadow-sm ring-1 ring-stone-100 backdrop-blur hover:-translate-y-1 hover:bg-emerald-50/50 hover:shadow-lg hover:shadow-emerald-900/10">
      <p className="text-xs font-black uppercase tracking-wide text-stone-400">
        {label}
      </p>

      <p className={`mt-1 text-2xl font-black ${valueClass}`}>{value}</p>
    </div>
  );
}

function MiniMetric({ label, value, tone = "stone" }) {
  const valueClass = {
    stone: "text-stone-950",
    blue: "text-blue-800",
    red: "text-red-800",
    emerald: "text-emerald-800",
  }[tone];

  return (
    <div className="rounded-[1.2rem] bg-white/80 p-3 shadow-sm ring-1 ring-stone-100">
      <p className="text-xs font-black uppercase text-stone-400">{label}</p>

      <p className={`mt-1 font-black ${valueClass}`}>{value}</p>
    </div>
  );
}

function ActionButton({ children, tone = "stone", onClick }) {
  const className =
    tone === "red"
      ? "bg-red-50 text-red-800 ring-1 ring-red-200 hover:bg-red-100"
      : tone === "amber"
        ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100"
        : "bg-stone-950 text-white hover:bg-stone-800";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`eg-button rounded-[1.2rem] px-4 py-2.5 text-sm font-black shadow-sm hover:-translate-y-[2px] hover:shadow-md ${className}`}
    >
      {children}
    </button>
  );
}

export default function AdminSecurityPanel() {
  const [guests, setGuests] = useState([]);
  const [blockedCustomers, setBlockedCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeView, setActiveView] = useState("guests");
  const [expandedGuestKey, setExpandedGuestKey] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  async function createBlock(
    type,
    value,
    defaultReason = "Підозріла активність"
  ) {
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

  const visibleGuests = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return guests;

    return guests.filter((guest) => {
      const text = [
        guest.mainName,
        guest.mainPhone,
        guest.mainTelegram,
        guest.clientIp,
        guest.guestId,
        guest.risk?.label,
        ...(guest.risk?.reasons || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(query);
    });
  }, [guests, searchQuery]);

  const visibleBlockedCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return blockedCustomers;

    return blockedCustomers.filter((item) => {
      const text = [
        getTypeLabel(item.type),
        item.type,
        item.value,
        item.reason,
        item.createdAt,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(query);
    });
  }, [blockedCustomers, searchQuery]);

  return (
    <section className="eg-ambient space-y-6">
      <div className="eg-glass eg-premium-card rounded-[2.5rem] p-6 shadow-sm ring-1 ring-stone-100 lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="w-fit rounded-full border border-emerald-200 bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-emerald-800 shadow-sm backdrop-blur">
              Адмінка
            </p>

            <h2 className="mt-4 text-4xl font-black leading-tight text-stone-950">
              Безпека
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-600">
              Гостьові замовлення, підозріла активність, IP, контакти та ручні
              блокування.
            </p>
          </div>

          <button
            type="button"
            onClick={loadSecurityData}
            disabled={isLoading}
            className="eg-button rounded-[1.3rem] border border-stone-300 bg-white/80 px-5 py-3 text-sm font-black text-stone-900 backdrop-blur hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Оновлюємо..." : "Оновити"}
          </button>
        </div>

        <div className="eg-stagger mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard label="Гостей" value={stats.total} />
          <StatCard label="Замовлень" value={stats.orders} />
          <StatCard label="Активні" value={stats.active} tone="blue" />
          <StatCard label="Скасовані" value={stats.cancelled} tone="red" />
          <StatCard label="Високий ризик" value={stats.highRisk} tone="red" />
          <StatCard label="Блокувань" value={blockedCustomers.length} />
        </div>
      </div>

      <div className="eg-glass eg-premium-card rounded-[2rem] p-3">
        <div className="grid gap-3 lg:grid-cols-[auto_1fr] lg:items-center">
          <div className="flex gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveView("guests")}
              className={`eg-button whitespace-nowrap rounded-[1.3rem] px-5 py-3 text-sm font-black ${
                activeView === "guests"
                  ? "bg-emerald-900 text-white shadow-lg shadow-emerald-900/20"
                  : "bg-white/80 text-stone-700 hover:bg-white hover:text-emerald-900"
              }`}
            >
              Гостьові · {guests.length}
            </button>

            <button
              type="button"
              onClick={() => setActiveView("blocked")}
              className={`eg-button whitespace-nowrap rounded-[1.3rem] px-5 py-3 text-sm font-black ${
                activeView === "blocked"
                  ? "bg-stone-950 text-white shadow-lg shadow-stone-950/20"
                  : "bg-white/80 text-stone-700 hover:bg-white hover:text-emerald-900"
              }`}
            >
              Заблоковані · {blockedCustomers.length}
            </button>
          </div>

          <div className="relative">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="eg-field w-full rounded-[1.3rem] border border-stone-200 bg-white/85 px-5 py-3 pr-12 text-sm outline-none backdrop-blur focus:border-emerald-700 focus:bg-white"
              placeholder={
                activeView === "guests"
                  ? "Пошук: імʼя, телефон, Telegram, IP, Guest ID..."
                  : "Пошук блокувань..."
              }
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
        </div>
      </div>

      {message && (
        <div className="eg-panel rounded-[1.6rem] bg-amber-50/90 p-4 text-sm font-semibold text-amber-900 ring-1 ring-amber-100">
          {message}
        </div>
      )}

      {isLoading ? (
        <div className="eg-glass rounded-[2rem] p-8 text-center font-bold text-stone-500 shadow-sm ring-1 ring-stone-100">
          Завантажуємо дані безпеки...
        </div>
      ) : activeView === "guests" ? (
        <div className="eg-glass rounded-[2.5rem] p-5 shadow-sm ring-1 ring-stone-100">
          {visibleGuests.length === 0 ? (
            <div className="rounded-[2rem] bg-stone-50/90 p-8 text-center">
              <p className="font-black text-stone-900">
                Гостьових замовлень не знайдено
              </p>

              <p className="mt-2 text-sm text-stone-500">
                Спробуйте змінити пошуковий запит або очистити пошук.
              </p>
            </div>
          ) : (
            <div className="eg-stagger space-y-4">
              {visibleGuests.map((guest) => {
                const isExpanded = expandedGuestKey === guest.key;

                return (
                  <article
                    key={guest.key}
                    className={`eg-card rounded-[2rem] border p-5 backdrop-blur transition-all duration-500 hover:-translate-y-1 hover:shadow-xl ${
                      guest.isBlocked
                        ? "border-red-200 bg-red-50/70 shadow-red-100/40"
                        : "border-stone-200 bg-white/80 hover:border-emerald-100 hover:shadow-emerald-900/10"
                    }`}
                  >
                    <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr_1fr_auto]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-2xl font-black tracking-tight text-stone-950">
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

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Badge className="bg-white/80 text-stone-700 ring-stone-200">
                            Телефон: {guest.mainPhone || "—"}
                          </Badge>

                          <Badge className="bg-white/80 text-stone-700 ring-stone-200">
                            Telegram:{" "}
                            {guest.mainTelegram
                              ? `@${String(guest.mainTelegram).replace(
                                  /^@/,
                                  ""
                                )}`
                              : "—"}
                          </Badge>

                          <Badge className="bg-white/80 text-stone-700 ring-stone-200">
                            IP: {guest.clientIp || "—"}
                          </Badge>

                          <Badge className="bg-white/80 text-stone-700 ring-stone-200">
                            Guest ID: {guest.guestId || "—"}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <MiniMetric label="Замовлень" value={guest.ordersCount} />
                        <MiniMetric
                          label="Сьогодні"
                          value={guest.ordersTodayCount}
                          tone="blue"
                        />
                        <MiniMetric
                          label="Активні"
                          value={guest.activeOrdersCount}
                          tone="blue"
                        />
                        <MiniMetric
                          label="Скасовані"
                          value={guest.cancelledOrdersCount}
                          tone="red"
                        />
                      </div>

                      <div className="rounded-[1.4rem] bg-stone-50/90 p-4 text-sm leading-6 text-stone-600">
                        <p>
                          <span className="font-black text-stone-900">
                            Сума:
                          </span>{" "}
                          {formatMoney(guest.totalRevenue)}
                        </p>

                        <p>
                          <span className="font-black text-stone-900">
                            Видано:
                          </span>{" "}
                          {formatMoney(guest.completedRevenue)}
                        </p>

                        <p>
                          <span className="font-black text-stone-900">
                            Останнє:
                          </span>{" "}
                          {formatDate(guest.lastOrderAt)}
                        </p>

                        {guest.risk?.reasons?.length > 0 && (
                          <p className="mt-2">
                            <span className="font-black text-stone-900">
                              Причини:
                            </span>{" "}
                            {guest.risk.reasons.join(", ")}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <ActionButton
                          onClick={() =>
                            setExpandedGuestKey(isExpanded ? null : guest.key)
                          }
                        >
                          {isExpanded ? "Сховати" : "Замовлення"}
                        </ActionButton>

                        {guest.clientIp && (
                          <ActionButton
                            tone="red"
                            onClick={() =>
                              createBlock(
                                "ip",
                                guest.clientIp,
                                "Підозріла активність з IP"
                              )
                            }
                          >
                            Блок IP
                          </ActionButton>
                        )}

                        {guest.guestId && (
                          <ActionButton
                            tone="red"
                            onClick={() =>
                              createBlock(
                                "guestId",
                                guest.guestId,
                                "Підозріла гостьова активність"
                              )
                            }
                          >
                            Блок гостя
                          </ActionButton>
                        )}

                        {guest.mainPhone && (
                          <ActionButton
                            tone="amber"
                            onClick={() =>
                              createBlock(
                                "phone",
                                guest.mainPhone,
                                "Підозрілі замовлення за телефоном"
                              )
                            }
                          >
                            Блок телефону
                          </ActionButton>
                        )}

                        {guest.mainTelegram && (
                          <ActionButton
                            tone="amber"
                            onClick={() =>
                              createBlock(
                                "telegram",
                                guest.mainTelegram,
                                "Підозрілі замовлення за Telegram"
                              )
                            }
                          >
                            Блок Telegram
                          </ActionButton>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="eg-panel mt-5 rounded-[1.8rem] bg-stone-50/90 p-5 backdrop-blur">
                        <p className="font-black text-stone-950">
                          Замовлення гостя
                        </p>

                        <div className="mt-3 overflow-x-auto rounded-[1.4rem] bg-white/80 ring-1 ring-stone-100">
                          <table className="min-w-full text-left text-sm">
                            <thead>
                              <tr className="text-xs uppercase text-stone-400">
                                <th className="px-4 py-3">№</th>
                                <th className="px-4 py-3">Дата</th>
                                <th className="px-4 py-3">Статус</th>
                                <th className="px-4 py-3">Контакт</th>
                                <th className="px-4 py-3">Сума</th>
                              </tr>
                            </thead>

                            <tbody>
                              {(guest.orders || []).map((order) => (
                                <tr
                                  key={order.id}
                                  className="border-t border-stone-200 transition-colors hover:bg-stone-50"
                                >
                                  <td className="px-4 py-3 font-black">
                                    #{order.orderNumber}
                                  </td>

                                  <td className="px-4 py-3">
                                    {formatDate(order.createdAt)}
                                  </td>

                                  <td className="px-4 py-3">{order.status}</td>

                                  <td className="px-4 py-3 text-stone-600">
                                    {order.customerPhone ||
                                      order.customerTelegram ||
                                      "—"}
                                  </td>

                                  <td className="px-4 py-3 font-bold">
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
        <div className="eg-glass rounded-[2.5rem] p-5 shadow-sm ring-1 ring-stone-100">
          {visibleBlockedCustomers.length === 0 ? (
            <div className="rounded-[2rem] bg-stone-50/90 p-8 text-center">
              <p className="font-black text-stone-900">Блокувань не знайдено</p>

              <p className="mt-2 text-sm text-stone-500">
                Тут будуть IP, телефони, Telegram або гості, яких ви
                заблокували.
              </p>
            </div>
          ) : (
            <div className="eg-stagger space-y-3">
              {visibleBlockedCustomers.map((item) => (
                <article
                  key={item.id}
                  className="eg-card flex flex-col gap-3 rounded-[2rem] border border-stone-200 bg-white/80 p-5 backdrop-blur hover:-translate-y-1 hover:border-red-100 hover:shadow-lg hover:shadow-red-900/10 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-red-50 text-red-800 ring-red-200">
                        {getTypeLabel(item.type)}
                      </Badge>

                      <p className="font-black text-stone-950">{item.value}</p>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-stone-500">
                      {item.reason || "Без причини"} ·{" "}
                      {formatDate(item.createdAt)}
                    </p>
                  </div>

                  <ActionButton tone="red" onClick={() => deleteBlock(item)}>
                    Видалити блокування
                  </ActionButton>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}