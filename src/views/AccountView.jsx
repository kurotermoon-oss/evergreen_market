import { useEffect, useState } from "react";
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
    <div className="eg-card eg-premium-card rounded-[2rem] border border-stone-200 bg-white/85 p-5 backdrop-blur hover:border-emerald-100 hover:shadow-lg hover:shadow-emerald-900/10">
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

            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-700 ring-1 ring-stone-200">
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
    <div className="eg-panel eg-premium-card mt-6 rounded-[2rem] bg-stone-50/90 p-5 backdrop-blur">
      <p className="text-lg font-black text-stone-950">
        Редагування профілю
      </p>

      <p className="mt-1 text-sm leading-6 text-stone-500">
        Оновіть контактні дані та адресу для швидшого оформлення майбутніх
        замовлень.
      </p>

      {formError && (
        <div className="eg-error eg-shake mt-4 rounded-[1.4rem] border border-red-200 bg-red-50/80 p-4 text-sm font-semibold text-red-700">
          {formError}
        </div>
      )}

      <div className="mt-5 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-stone-700">
            Імʼя
          </span>

          <input
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

        <div className="eg-premium-card rounded-[2rem] bg-white/80 p-4">
          <div className="mb-4">
            <p className="font-bold text-stone-800">Дані для доставки</p>

            <p className="mt-1 text-sm leading-6 text-stone-500">
              Необовʼязково. Можете залишити порожнім або заповнити для
              майбутніх замовлень.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              value={form.building}
              onChange={(event) => updateField("building", event.target.value)}
              className={getInputClass(false)}
              placeholder="Будинок"
            />

            <input
              value={form.entrance}
              onChange={(event) => updateField("entrance", event.target.value)}
              className={getInputClass(false)}
              placeholder="Підʼїзд"
            />

            <input
              value={form.floor}
              onChange={(event) => updateField("floor", event.target.value)}
              className={getInputClass(false)}
              placeholder="Поверх"
            />

            <input
              value={form.apartment}
              onChange={(event) =>
                updateField("apartment", event.target.value)
              }
              className={getInputClass(false)}
              placeholder="Квартира"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
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
    </div>
  );
}

export default function AccountView({
  customer,
  setCustomer,
  customerOrders,
  loadCustomerOrders,
  customerLogout,
  updateCustomerProfile,
  setView,
}) {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  useEffect(() => {
    if (!customer) return;

    loadCustomerOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.id]);

  if (!customer) {
    return (
      <main className="eg-ambient mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="eg-glass eg-premium-card rounded-[2.5rem] p-8 text-center">
          <h1 className="text-2xl font-black text-stone-950">
            Ви ще не увійшли
          </h1>

          <button
            type="button"
            onClick={() => setView("customer-auth")}
            className="eg-button eg-sweep mt-5 rounded-2xl bg-emerald-900 px-5 py-3 font-bold text-white hover:bg-emerald-800"
          >
            Увійти або зареєструватися
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="eg-ambient mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="eg-glass eg-premium-card rounded-[2.5rem] p-6 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="w-fit rounded-full border border-emerald-200 bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-emerald-800 shadow-sm backdrop-blur">
              Особистий кабінет
            </p>

            <h1 className="mt-4 text-4xl font-black text-stone-950">
              {customer.name}
            </h1>

            <p className="mt-3 text-stone-600">
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
              onClick={() => {
                setIsEditingProfile((current) => !current);
                setProfileMessage("");
              }}
              className="eg-button rounded-2xl border border-stone-300 bg-white/80 px-5 py-3 font-bold text-stone-900 hover:bg-white"
            >
              {isEditingProfile ? "Закрити" : "Редагувати"}
            </button>

            <button
              type="button"
              onClick={() => setView("catalog")}
              className="eg-button eg-sweep rounded-2xl bg-emerald-900 px-5 py-3 font-bold text-white hover:bg-emerald-800"
            >
              До каталогу
            </button>

            <button
              type="button"
              onClick={customerLogout}
              className="eg-button rounded-2xl border border-stone-300 bg-white/80 px-5 py-3 font-bold text-stone-900 hover:bg-white"
            >
              Вийти
            </button>
          </div>
        </div>

        {profileMessage && (
          <div className="eg-panel mt-5 rounded-[1.4rem] bg-emerald-50/90 p-4 text-sm font-semibold text-emerald-800">
            {profileMessage}
          </div>
        )}

        {isEditingProfile && (
          <ProfileEditor
            customer={customer}
            updateCustomerProfile={updateCustomerProfile}
            onCancel={() => setIsEditingProfile(false)}
            onSaved={() => {
              setIsEditingProfile(false);
              setProfileMessage("Дані профілю оновлено.");
            }}
          />
        )}
      </section>

      <div className="mt-6">
        <TelegramVerificationCard
          customer={customer}
          onCustomerUpdate={setCustomer}
        />
      </div>

      <section className="eg-glass eg-premium-card mt-8 rounded-[2.5rem] p-6 lg:p-8">
        <h2 className="text-2xl font-black text-stone-950">Мої замовлення</h2>

        {!customerOrders.length && (
          <div className="eg-panel mt-6 rounded-[2rem] bg-stone-50/90 p-8 text-center text-stone-500">
            У вас ще немає замовлень.
          </div>
        )}

        <div className="eg-stagger mt-6 space-y-5">
          {customerOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      </section>
    </main>
  );
}