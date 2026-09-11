import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronDown, LayoutDashboard, LogOut, MapPin, Package, Pencil, ShieldCheck, UserRound } from "lucide-react";
import "../styles/account.css";
import { formatUAH } from "../utils/formatUAH.js";
import TelegramVerificationCard from "../components/customer/TelegramVerificationCard.jsx";

const ORDER_STATUS_LABELS = {
  new: "Нове",
  confirmed: "Підтверджено",
  preparing: "Готується",
  ready: "Готово до видачі",
  completed: "Завершено",
  canceled: "Скасовано",
  cancelled: "Скасовано",
  Новий: "Нове",
  Нове: "Нове",
  Підтверджено: "Підтверджено",
  Готується: "Готується",
  "Готово до видачі": "Готово до видачі",
  Завершено: "Завершено",
  Скасовано: "Скасовано",
};

const ORDER_STATUS_CLASS = {
  new: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
  confirmed: "bg-sky-50 text-sky-800 ring-1 ring-sky-200",
  preparing: "bg-orange-50 text-orange-800 ring-1 ring-orange-200",
  ready: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
  completed: "bg-stone-100 text-stone-700 ring-1 ring-stone-200",
  canceled: "bg-red-50 text-red-800 ring-1 ring-red-200",
  cancelled: "bg-red-50 text-red-800 ring-1 ring-red-200",
};

const ORDER_STEPS = [
  { id: "new", label: "Створено" },
  { id: "confirmed", label: "Підтверджено" },
  { id: "preparing", label: "Готується" },
  { id: "ready", label: "Готово до видачі" },
  { id: "completed", label: "Завершено" },
];

const STATUS_ALIASES = {
  Новий: "new",
  Нове: "new",
  Підтверджено: "confirmed",
  Готується: "preparing",
  "Готово до видачі": "ready",
  Завершено: "completed",
  Скасовано: "canceled",
  cancelled: "canceled",
};

function normalizeOrderStatus(status) {
  return STATUS_ALIASES[status] || status || "new";
}

function getOrderStatusLabel(status) {
  const normalizedStatus = normalizeOrderStatus(status);
  return ORDER_STATUS_LABELS[normalizedStatus] || "Нове";
}

function getOrderStatusClass(status) {
  const normalizedStatus = normalizeOrderStatus(status);
  return ORDER_STATUS_CLASS[normalizedStatus] || "bg-stone-100 text-stone-700";
}

function normalizePhone(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return "";

  if (digits.length === 10 && digits.startsWith("0")) {
    return `+38${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("380")) {
    return `+${digits}`;
  }

  return "";
}

function isValidPhone(value) {
  return /^\+380\d{9}$/.test(normalizePhone(value));
}

function normalizeTelegram(value) {
  return String(value || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}

function isValidTelegram(value) {
  const telegram = normalizeTelegram(value);

  if (!telegram) return false;

  return /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(telegram);
}

function getBackendErrors(error) {
  return error?.data?.errors || error?.errors || {};
}

function getInputClass(hasError) {
  return `eg-field w-full rounded-[1.3rem] border px-5 py-3.5 outline-none transition ${
    hasError
      ? "eg-shake border-red-300 bg-red-50/40 focus:border-red-500"
      : "border-stone-200 bg-white/85 backdrop-blur focus:border-emerald-700 focus:bg-white"
  }`;
}

function FieldError({ children }) {
  if (!children) return null;

  return (
    <p className="eg-error mt-1 text-sm font-semibold text-red-600">
      {children}
    </p>
  );
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

  if (normalizedStatus === "canceled") return -1;

  return ORDER_STEPS.findIndex((step) => step.id === normalizedStatus);
}

function getHistoryStepFromLabel(label = "") {
  const normalizedLabel = label.toLowerCase();

  if (normalizedLabel.includes("створено")) return "new";
  if (normalizedLabel.includes("підтверджено")) return "confirmed";
  if (normalizedLabel.includes("готується")) return "preparing";
  if (normalizedLabel.includes("готове")) return "ready";
  if (normalizedLabel.includes("готово")) return "ready";
  if (normalizedLabel.includes("завершено")) return "completed";
  if (normalizedLabel.includes("скасовано")) return "canceled";

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

function getDeliveryLabel(order) {
  if (order.deliveryType === "building") {
    return "Доставка";
  }

  return "Самовивіз";
}

function createProfileForm(customer) {
  return {
    name: customer?.name || "",
    phone: customer?.phone || "",
    telegram: customer?.telegram ? `@${customer.telegram}` : "",
    building: customer?.building || "",
    entrance: customer?.entrance || "",
    floor: customer?.floor || "",
    apartment: customer?.apartment || "",
  };
}

function OrderProgress({ order }) {
  const normalizedStatus = normalizeOrderStatus(order.status);
  const currentStepIndex = getStepIndex(normalizedStatus);
  const isCancelled = normalizedStatus === "canceled";

  if (isCancelled) {
    return (
      <div className="rounded-[2rem] border border-red-100 bg-red-50/80 p-5">
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
    <div className="eg-premium-card rounded-[2rem] bg-stone-50/90 p-5">
      <p className="mb-4 text-sm font-black text-stone-800">
        Прогрес замовлення
      </p>

      <div className="space-y-3">
        {ORDER_STEPS.map((step, index) => {
          const isDone = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const stepTime = getStepTime(order, step.id);

          return (
            <div key={step.id} className="grid grid-cols-[28px_1fr] gap-3">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
                  isDone
                    ? "bg-emerald-900 text-white shadow-md shadow-emerald-900/20"
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
  const visibleStatusEvents = getVisibleStatusEvents(order);

  return (
    <details className="eg-profile-order">
      <summary className="eg-profile-order-summary">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eg-profile-order-number">
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

            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-700 ring-1 ring-stone-200">
              {getDeliveryLabel(order)}
            </span>
          </div>
        </div>

        <p className="text-2xl font-black text-stone-950">
          {formatUAH(order.total)}
        </p>
      </div>

      <span className="eg-profile-order-expand">Деталі замовлення<ChevronDown size={17} aria-hidden="true" /></span>
      </summary>
      <div className="eg-profile-order-content">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
        <div className="space-y-4">
          <div className="rounded-[2rem] bg-stone-50/90 p-5">
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
                    className="eg-profile-order-item"
                  >
                    <span>
                      {item.name} · {quantity} шт × {formatUAH(price)}
                    </span>

                    <span className="font-bold">{formatUAH(total)}</span>
                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-sm text-stone-500">
              Оплата здійснюється на місці.
            </p>
          </div>

          {order.deliveryType === "building" && (
            <div className="rounded-[2rem] bg-stone-50/90 p-5">
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
            <div className="rounded-[2rem] bg-stone-50/90 p-5">
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

      {visibleStatusEvents.length > 0 && (
        <details className="mt-5 rounded-[2rem] bg-white/70 p-4">
          <summary className="cursor-pointer text-sm font-black text-stone-700 hover:text-emerald-800">
            Детальна історія
          </summary>

          <div className="mt-3 space-y-1">
            {visibleStatusEvents.map((item, index) => (
              <p
                key={`${order.id}-status-history-${index}`}
                className="text-sm text-stone-500"
              >
                {formatDate(item.at)} — {item.label}
              </p>
            ))}
          </div>
        </details>
      )}
      </div>
    </details>
  );
}

function ProfileEditor({
  customer,
  updateCustomerProfile,
  onCancel,
  onSaved,
}) {
  const [form, setForm] = useState(() => createProfileForm(customer));
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setFieldErrors((current) => ({
      ...current,
      [field]: "",
      contact: "",
    }));

    setFormError("");
  }

  function validateProfileForm() {
    const errors = {};
    const name = form.name.trim();
    const phone = form.phone.trim();
    const telegram = form.telegram.trim();

    if (!name) {
      errors.name = "Вкажіть імʼя";
    } else if (name.length < 2) {
      errors.name = "Імʼя має містити щонайменше 2 символи";
    }

    if (!phone && !telegram) {
      errors.contact = "Вкажіть телефон або Telegram";
    }

    if (phone && !isValidPhone(phone)) {
      errors.phone = "Телефон має бути у форматі +380XXXXXXXXX";
    }

    if (telegram && !isValidTelegram(telegram)) {
      errors.telegram =
        "Telegram має бути у форматі @username, мінімум 5 символів";
    }

    return errors;
  }

  async function handleSave() {
    if (isSaving) return;
    const errors = validateProfileForm();

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Перевірте правильність заповнення форми.");
      return;
    }

    try {
      setIsSaving(true);
      setFormError("");
      setFieldErrors({});

      await updateCustomerProfile({
        name: form.name.trim(),
        phone: normalizePhone(form.phone),
        telegram: normalizeTelegram(form.telegram),
        building: form.building.trim(),
        entrance: form.entrance.trim(),
        floor: form.floor.trim(),
        apartment: form.apartment.trim(),
      });

      onSaved?.();
    } catch (error) {
      console.error("Update customer profile error:", error);

      const backendErrors = getBackendErrors(error);

      if (Object.keys(backendErrors).length > 0) {
        setFieldErrors(backendErrors);
        setFormError("Перевірте дані у формі.");
        return;
      }

      setFormError("Не вдалося оновити профіль. Спробуйте ще раз.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={event => { event.preventDefault(); handleSave(); }} noValidate className="eg-panel eg-premium-card mt-6 rounded-[2rem] bg-stone-50/90 p-5 backdrop-blur">
      <p className="text-lg font-black text-stone-950">
        Редагування профілю
      </p>

      <p className="mt-1 text-sm leading-6 text-stone-500">
        Оновіть контакти — вони автоматично підставляться під час оформлення замовлення.
      </p>

      {formError && (
        <div role="alert" className="eg-error eg-shake mt-4 rounded-[1.4rem] border border-red-200 bg-red-50/80 p-4 text-sm font-semibold text-red-700">
          {formError}
        </div>
      )}

      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-stone-700">
            Імʼя
          </span>

          <input
            autoComplete="name"
            autoFocus
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            className={getInputClass(Boolean(fieldErrors.name))}
            placeholder="Ваше імʼя"
          />

          <FieldError>{fieldErrors.name}</FieldError>
        </label>

        <div>
          <p className="mb-2 text-sm font-semibold text-stone-700">
            Контакт для звʼязку
          </p>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
            <div>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                aria-label="Телефон"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                onBlur={() => {
                  if (form.phone && isValidPhone(form.phone)) {
                    updateField("phone", normalizePhone(form.phone));
                  }
                }}
                className={getInputClass(Boolean(fieldErrors.phone))}
                placeholder="+380XXXXXXXXX"
              />

              <FieldError>{fieldErrors.phone}</FieldError>
            </div>

            <div className="flex h-12 items-center justify-center text-sm font-black uppercase tracking-wide text-stone-400">
              або
            </div>

            <div>
              <input
                aria-label="Telegram"
                autoCapitalize="none"
                spellCheck={false}
                value={form.telegram}
                onChange={(event) =>
                  updateField("telegram", event.target.value)
                }
                onBlur={() => {
                  if (form.telegram && isValidTelegram(form.telegram)) {
                    updateField(
                      "telegram",
                      `@${normalizeTelegram(form.telegram)}`
                    );
                  }
                }}
                className={getInputClass(Boolean(fieldErrors.telegram))}
                placeholder="@username"
              />

              <FieldError>{fieldErrors.telegram}</FieldError>
            </div>
          </div>

          <p className="mt-2 text-sm leading-6 text-stone-500">
            Вкажіть <span className="font-semibold">телефон або Telegram</span>.
            Одного контакту достатньо.
          </p>

          <FieldError>{fieldErrors.contact}</FieldError>
        </div>

        <details className="eg-profile-address">
          <summary>Збережена адреса <span>Необов’язково</span></summary>
          <div className="my-4">
            <p className="font-bold text-stone-800">Адреса у профілі</p>

            <p className="mt-1 text-sm leading-6 text-stone-500">
              Зараз доступний лише самовивіз із кав’ярні. Ці дані можна залишити порожніми.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              aria-label="Будинок"
              value={form.building}
              onChange={(event) => updateField("building", event.target.value)}
              className={getInputClass(false)}
              placeholder="Будинок"
            />

            <input
              aria-label="Підʼїзд"
              value={form.entrance}
              onChange={(event) => updateField("entrance", event.target.value)}
              className={getInputClass(false)}
              placeholder="Підʼїзд"
            />

            <input
              aria-label="Поверх"
              value={form.floor}
              onChange={(event) => updateField("floor", event.target.value)}
              className={getInputClass(false)}
              placeholder="Поверх"
            />

            <input
              aria-label="Квартира"
              value={form.apartment}
              onChange={(event) =>
                updateField("apartment", event.target.value)
              }
              className={getInputClass(false)}
              placeholder="Квартира"
            />
          </div>
        </details>

        <div className="eg-profile-actions flex flex-col gap-2 sm:flex-row">
          <button
            type="submit"
            disabled={isSaving}
            aria-busy={isSaving}
            className="eg-button eg-sweep rounded-2xl bg-emerald-900 px-5 py-3 font-black text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          >
            {isSaving ? "Збереження..." : "Зберегти"}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="eg-button rounded-2xl border border-stone-300 bg-white/80 px-5 py-3 font-black text-stone-900 hover:bg-white disabled:cursor-not-allowed"
          >
            Скасувати
          </button>
        </div>
      </div>
    </form>
  );
}

export default function AccountView({
  customer, setCustomer, customerOrders = [], loadCustomerOrders,
  customerLogout, updateCustomerProfile, setView,
}) {
  const [section, setSection] = useState("overview");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [ordersState, setOrdersState] = useState("loading");
  const [reload, setReload] = useState(0);
  const [orderFilter, setOrderFilter] = useState("all");
  const [logoutError, setLogoutError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const headingRef = useRef(null);
  const editButtonRef = useRef(null);
  const didNavigate = useRef(false);
  const wasEditing = useRef(false);

  useLayoutEffect(() => {
    if (didNavigate.current) headingRef.current?.focus();
    didNavigate.current = false;
  }, [section]);

  useLayoutEffect(() => {
    if (wasEditing.current && !isEditingProfile) editButtonRef.current?.focus();
    wasEditing.current = isEditingProfile;
  }, [isEditingProfile]);

  useEffect(() => {
    if (!customer) return;
    let active = true;
    setOrdersState("loading");
    Promise.resolve().then(() => loadCustomerOrders({ throwOnError: true }))
      .then(() => { if (active) setOrdersState("ready"); })
      .catch(() => { if (active) setOrdersState("error"); });
    return () => { active = false; };
    // Session functions change identity on render; refresh on customer or explicit retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.id, reload]);

  function navigateSection(next) {
    didNavigate.current = section !== next;
    setSection(next);
    setProfileMessage("");
  }

  function finishEditing(message = "") {
    setIsEditingProfile(false);
    setProfileMessage(message);
  }

  async function logout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setLogoutError("");
    try { await customerLogout(); setView("home"); }
    catch { setLogoutError("Не вдалося вийти. Спробуйте ще раз."); }
    finally { setIsLoggingOut(false); }
  }

  if (!customer) return (
    <main className="eg-account-page eg-profile-page">
      <section className="eg-profile-panel eg-profile-empty">
        <UserRound size={32} aria-hidden="true" />
        <h1>Ваш профіль Evergreen</h1>
        <p>Увійдіть, щоб бачити замовлення та зберігати контактні дані.</p>
        <button className="eg-profile-primary" type="button" onClick={() => setView("customer-auth")}>Увійти або зареєструватися</button>
      </section>
    </main>
  );

  const orders = [...customerOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const isActive = order => !["completed", "canceled"].includes(normalizeOrderStatus(order.status));
  const activeOrders = orders.filter(isActive);
  const completedOrders = orders.filter(order => normalizeOrderStatus(order.status) === "completed");
  const shownOrders = orderFilter === "active" ? activeOrders : orderFilter === "completed" ? completedOrders : orders;
  const recentOrders = [...activeOrders, ...orders.filter(order => !isActive(order))].slice(0, 2);
  const initials = (customer.name || "Гість").trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  const verified = Boolean(customer.telegramVerifiedAt && customer.phoneVerifiedAt);
  const joinedDate = customer.createdAt && !Number.isNaN(new Date(customer.createdAt).getTime())
    ? new Date(customer.createdAt).toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" }) : "";
  const nav = [{ id: "overview", label: "Огляд", Icon: LayoutDashboard }, { id: "orders", label: "Замовлення", Icon: Package }, { id: "details", label: "Особисті дані", Icon: UserRound }];
  const ordersNotice = ordersState === "loading"
    ? <p className="eg-profile-notice" role="status">Завантажуємо замовлення…</p>
    : ordersState === "error"
      ? <div className="eg-profile-notice eg-profile-notice-error" role="alert"><p>Не вдалося завантажити історію замовлень.</p><button type="button" className="eg-profile-secondary" onClick={() => setReload(value => value + 1)}>Спробувати ще раз</button></div>
      : null;

  return (
    <main className="eg-account-page eg-profile-page">
      <div className="eg-profile-layout">
        <aside className="eg-profile-sidebar">
          <div className="eg-profile-identity">
            <div className="eg-profile-avatar" aria-hidden="true">{initials}</div>
            <div className="eg-profile-person">
              <p className="eg-profile-eyebrow">Мій профіль</p>
              <h1>{customer.name}</h1>
              {joinedDate && <p className="eg-profile-since">З нами з {joinedDate}</p>}
            </div>
            <span className={`eg-profile-verification${verified ? " is-verified" : ""}`}><ShieldCheck size={15} aria-hidden="true" />{verified ? "Контакти підтверджено" : "Контакти не підтверджено"}</span>
          </div>
          <nav className="eg-profile-nav" aria-label="Розділи профілю">
            {nav.map(({ id, label, Icon }) => <button key={id} type="button" aria-current={section === id ? "page" : undefined} onClick={() => navigateSection(id)}><Icon size={19} aria-hidden="true" /><span>{label}</span></button>)}
          </nav>
          <div className="eg-profile-sidebar-footer">
            <button type="button" className="eg-profile-logout" onClick={logout} disabled={isLoggingOut}><LogOut size={17} aria-hidden="true" />{isLoggingOut ? "Виходимо…" : "Вийти з акаунта"}</button>
            {logoutError && <p role="alert">{logoutError}</p>}
          </div>
        </aside>

        <div className="eg-profile-main">
          <header className="eg-profile-section-header">
            <div><h2 ref={headingRef} tabIndex={-1}>{section === "overview" ? "Раді бачити вас в Evergreen" : section === "orders" ? "Мої замовлення" : "Особисті дані"}</h2><p>{section === "overview" ? "Ваші покупки, контакти й усе для наступного візиту." : section === "orders" ? "Статус, склад і деталі ваших покупок." : "Контакти для зв’язку та швидкого оформлення."}</p></div>
            {section === "overview" && <button className="eg-profile-primary" type="button" onClick={() => setView("catalog")}>До каталогу<ArrowUpRight size={17} aria-hidden="true" /></button>}
          </header>

          {section === "overview" && <>
            <div className="eg-profile-stats" aria-label="Ваші замовлення">
              {[{ label: "Усього", count: orders.length, filter: "all" }, { label: "У роботі", count: activeOrders.length, filter: "active" }, { label: "Завершено", count: completedOrders.length, filter: "completed" }].map(stat => <button key={stat.filter} type="button" onClick={() => { setOrderFilter(stat.filter); navigateSection("orders"); }}><strong>{ordersState === "ready" ? stat.count : "—"}</strong><span>{stat.label}</span></button>)}
            </div>
            <section className="eg-profile-panel">
              <div className="eg-profile-panel-heading"><h3>{activeOrders.length ? "Поточні та останні замовлення" : "Останні замовлення"}</h3><button type="button" className="eg-profile-text-button" onClick={() => { setOrderFilter("all"); navigateSection("orders"); }}>Усі замовлення<ArrowUpRight size={16} aria-hidden="true" /></button></div>
              {ordersNotice}
              {ordersState === "ready" && (recentOrders.length ? <div className="eg-profile-orders">{recentOrders.map(order => <OrderCard key={order.id} order={order} />)}</div> : <div className="eg-profile-empty"><Package size={32} aria-hidden="true" /><h3>Тут будуть ваші покупки</h3><p>Оберіть товари в каталозі. Після оформлення вони з’являться у вашій історії.</p><button type="button" className="eg-profile-primary" onClick={() => setView("catalog")}>Обрати товари</button></div>)}
            </section>
            <div className="eg-profile-info-grid">
              <section className="eg-profile-panel eg-profile-contact-summary"><UserRound size={21} aria-hidden="true" /><h3>Ваші контакти</h3><dl><div><dt>Телефон</dt><dd>{customer.phone || "Не вказано"}</dd></div><div><dt>Telegram</dt><dd>{customer.telegram ? `@${customer.telegram}` : "Не вказано"}</dd></div></dl><button type="button" className="eg-profile-text-button" onClick={() => navigateSection("details")}>Керувати профілем<ArrowUpRight size={16} aria-hidden="true" /></button></section>
              <section className="eg-profile-panel eg-profile-pickup"><MapPin size={21} aria-hidden="true" /><h3>Зустрінемось у кав’ярні</h3><p className="eg-profile-pickup-address">Київ, Білицька, 20</p><p>Щодня · 09:00–21:00</p><p className="eg-profile-muted">Забирайте замовлення після повідомлення про готовність.</p><button type="button" className="eg-profile-text-button" onClick={() => setView("contacts")}>Контакти кав’ярні<ArrowUpRight size={16} aria-hidden="true" /></button></section>
            </div>
          </>}

          {section === "orders" && <section className="eg-profile-panel">
            <div className="eg-profile-order-filters" aria-label="Фільтр замовлень">{[{ id: "all", label: "Усі" }, { id: "active", label: "У роботі" }, { id: "completed", label: "Завершені" }].map(filter => <button key={filter.id} type="button" aria-pressed={orderFilter === filter.id} onClick={() => setOrderFilter(filter.id)}>{filter.label}</button>)}</div>
            {ordersNotice}
            {ordersState === "ready" && (shownOrders.length ? <div className="eg-profile-orders">{shownOrders.map(order => <OrderCard key={order.id} order={order} />)}</div> : <div className="eg-profile-empty"><Package size={30} aria-hidden="true" /><h3>{orderFilter === "active" ? "Немає поточних замовлень" : orderFilter === "completed" ? "Ще немає завершених замовлень" : "Ви ще нічого не замовляли"}</h3><p>Коли з’являться покупки, їх можна буде переглянути тут.</p><button type="button" className="eg-profile-primary" onClick={() => setView("catalog")}>До каталогу</button></div>)}
          </section>}

          <div hidden={section !== "details"}><div className="eg-profile-details-content">
            <section className="eg-profile-panel">
              <div className="eg-profile-panel-heading"><h3>Контактна інформація</h3>{!isEditingProfile && <button type="button" className="eg-profile-secondary" ref={editButtonRef} onClick={() => { setIsEditingProfile(true); setProfileMessage(""); }}><Pencil size={16} aria-hidden="true" />Редагувати</button>}</div>
              {profileMessage && <p className="eg-profile-notice" role="status">{profileMessage}</p>}
              {isEditingProfile ? <ProfileEditor customer={customer} updateCustomerProfile={updateCustomerProfile} onCancel={() => finishEditing()} onSaved={() => finishEditing("Дані профілю оновлено.")} /> : <dl className="eg-profile-details-grid"><div><dt>Ім’я</dt><dd>{customer.name}</dd></div><div><dt>Телефон</dt><dd>{customer.phone || "Не вказано"}</dd></div><div><dt>Telegram</dt><dd>{customer.telegram ? `@${customer.telegram}` : "Не вказано"}</dd></div><div><dt>Отримання замовлень</dt><dd>Самовивіз · Білицька, 20</dd></div></dl>}
            </section>
            <div className="eg-profile-telegram"><TelegramVerificationCard customer={customer} onCustomerUpdate={setCustomer} /></div>
          </div></div>
        </div>
      </div>
    </main>
  );
}
