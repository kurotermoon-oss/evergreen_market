import { useState } from "react";
import { getRecentOrders, clearRecentOrders } from "../utils/recentOrders.js";
import Icon from "../components/Icon.jsx";
import OrderRulesModal from "../components/OrderRulesModal.jsx";
import { formatUAH } from "../utils/formatUAH.js";

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

function getInputClass(hasError, extraClass = "") {
  return `eg-field w-full rounded-[1.3rem] border px-5 py-3.5 outline-none transition ${
    hasError
      ? "eg-shake border-red-300 bg-red-50/40 focus:border-red-500"
      : "border-stone-200 bg-white/85 backdrop-blur focus:border-emerald-700 focus:bg-white"
  } ${extraClass}`;
}

function FieldError({ children }) {
  if (!children) return null;

  return (
    <p className="eg-error mt-1 text-sm font-semibold text-red-600">
      {children}
    </p>
  );
}


function formatRecentOrderDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RecentOrdersCard({ customer, setView }) {
  const [recentOrders, setRecentOrders] = useState(() => getRecentOrders());

  if (!recentOrders.length) return null;

  function handleClearRecentOrders() {
    clearRecentOrders();
    setRecentOrders([]);
  }

  return (
    <section className="eg-glass eg-premium-card mx-auto max-w-2xl rounded-[2rem] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-emerald-700">
            Історія
          </p>

          <h2 className="mt-1 text-2xl font-black text-stone-950">
            Останні замовлення на цьому пристрої
          </h2>

          <p className="mt-2 text-sm leading-6 text-stone-500">
            Це локальна історія цього браузера. Якщо очистити кеш або відкрити
            сайт з іншого пристрою, ці номери можуть не відображатися.
          </p>
        </div>

        <button
          type="button"
          onClick={handleClearRecentOrders}
          className="eg-button rounded-2xl border border-stone-300 bg-white/80 px-4 py-3 text-sm font-black text-stone-800 hover:bg-white"
        >
          Очистити
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {recentOrders.map((order) => (
          <div
            key={`${order.id}-${order.orderNumber}`}
            className="eg-card flex flex-col gap-3 rounded-[1.5rem] bg-white/85 p-4 ring-1 ring-stone-100 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="text-xl font-black text-stone-950">
                #{order.orderNumber}
              </p>

              <p className="mt-1 text-sm text-stone-500">
                {formatRecentOrderDate(order.createdAt)}
                {order.contact ? ` · ${order.contact}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-800 ring-1 ring-amber-200">
                Очікує підтвердження
              </span>

              <span className="font-black text-stone-950">
                {formatUAH(order.total)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-[1.5rem] bg-emerald-50/80 p-4 text-sm leading-6 text-emerald-900">
        {customer ? (
          <>
            Повна історія замовлень доступна в особистому кабінеті.
            <button
              type="button"
              onClick={() => setView("account")}
              className="eg-button ml-2 font-black text-emerald-950 underline"
            >
              Відкрити кабінет
            </button>
          </>
        ) : (
          <>
            Щоб історія зберігалась на будь-якому пристрої, створіть особистий
            кабінет.
            <button
              type="button"
              onClick={() => setView("customer-auth")}
              className="eg-button ml-2 font-black text-emerald-950 underline"
            >
              Увійти або зареєструватися
            </button>
          </>
        )}
      </div>
    </section>
  );
}


export default function CartView({
  cartItems,
  total,
  form,
  customer,
  updateForm,
  changeQuantity,
  removeFromCart,
  setCart,
  setView,
  submitOrder,
}) {
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");

  const needsDelivery = form.deliveryType === "building";
  const isEmpty = cartItems.length === 0;

  const hasBasicRequiredFields =
    cartItems.length > 0 &&
    String(form.name || "").trim() &&
    (String(form.phone || "").trim() || String(form.telegram || "").trim());

  const canSubmit = Boolean(hasBasicRequiredFields);

  function getItemId(item) {
    return item.productId || item.id;
  }

  function decreaseItem(item) {
    const productId = getItemId(item);
    const nextQuantity = Number(item.quantity || 1) - 1;

    changeQuantity(productId, Math.max(0, nextQuantity));
  }

  function increaseItem(item) {
    const productId = getItemId(item);
    const nextQuantity = Number(item.quantity || 0) + 1;

    changeQuantity(productId, nextQuantity);
  }

  function updateFormAndClearError(field, value) {
    updateForm(field, value);

    setFieldErrors((current) => ({
      ...current,
      [field]: "",
      contact: "",
      cart: "",
    }));

    setFormError("");
  }

  function validateOrderForm() {
    const errors = {};

    if (!cartItems.length) {
      errors.cart = "Кошик порожній";
    }

    const name = String(form.name || "").trim();
    const phone = String(form.phone || "").trim();
    const telegram = String(form.telegram || "").trim();

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

    if (needsDelivery) {
      if (!String(form.building || "").trim()) {
        errors.building = "Вкажіть будинок";
      }

      if (!String(form.apartment || "").trim()) {
        errors.apartment = "Вкажіть квартиру";
      }
    }

    return errors;
  }

  async function handleSubmitOrder() {
    const errors = validateOrderForm();

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Перевірте правильність заповнення форми.");
      return;
    }

    setFieldErrors({});
    setFormError("");

    const result = await submitOrder();

    if (result?.ok === false) {
      setFieldErrors(result.errors || {});
      setFormError(result.message || "Не вдалося створити замовлення.");
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {isEmpty ? (
          <div className="space-y-5">
            <div className="eg-glass eg-premium-card mx-auto max-w-2xl rounded-[2.5rem] px-16 py-24 text-center">
              <Icon name="package" className="mx-auto text-stone-400" size={72} />

              <p className="mt-6 text-2xl font-black text-stone-950">
                Кошик порожній
              </p>

              <p className="mt-2 text-sm leading-6 text-stone-500">
                Додайте щось смачне, щоб оформити замовлення.
              </p>

              <button
                type="button"
                onClick={() => setView("catalog")}
                className="eg-button eg-sweep mt-8 rounded-2xl bg-emerald-900 px-7 py-4 font-black text-white hover:bg-emerald-800 hover:shadow-lg hover:shadow-emerald-900/20"
              >
                Перейти до каталогу
              </button>
            </div>

            <RecentOrdersCard customer={customer} setView={setView} />
          </div>
        ) : (
        <div className="eg-stagger grid gap-8 lg:grid-cols-[1fr_0.88fr]">
          <section className="eg-glass eg-premium-card rounded-[2.2rem] p-6 lg:p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                  Кошик
                </p>

                <h1 className="mt-2 text-3xl font-black text-stone-950">
                  Ваше замовлення
                </h1>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCart({});
                  setFieldErrors({});
                  setFormError("");
                }}
                className="eg-button rounded-2xl border border-stone-300 px-4 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-100"
              >
                Очистити
              </button>
            </div>

            <div className="space-y-4">
              {cartItems.map((item) => {
                const productId = getItemId(item);
                const quantity = Number(item.quantity || 0);
                const itemTotal = Number(item.price || 0) * quantity;

                return (
                  <div
                    key={productId}
                    className="eg-card eg-premium-card flex gap-4 rounded-[2rem] border border-stone-200 bg-white/85 p-4 backdrop-blur hover:border-emerald-100 hover:shadow-lg hover:shadow-emerald-900/10"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="eg-image h-24 w-24 rounded-[1.4rem] object-cover hover:scale-[1.05]"
                    />

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-stone-950">
                        {item.name}
                      </h3>

                      {(item.brand || item.unit || item.packageInfo) && (
                        <p className="mt-1 text-sm text-stone-500">
                          {[item.brand, item.unit, item.packageInfo]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}

                      <p className="mt-1 text-sm text-stone-500">
                        {formatUAH(item.price)} за одиницю
                      </p>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 shadow-sm">
                          <div className="flex h-12 items-center">
                            <button
                              type="button"
                              onClick={() => decreaseItem(item)}
                              className="eg-counter-button flex h-12 w-12 items-center justify-center text-stone-700 transition hover:bg-emerald-100 hover:text-emerald-900"
                              aria-label="Зменшити кількість"
                            >
                              <Icon name="minus" size={16} />
                            </button>

                            <span className="flex h-12 min-w-12 items-center justify-center bg-white px-1 text-center font-black text-stone-950">
                              {quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() => increaseItem(item)}
                              className="eg-counter-button flex h-12 w-12 items-center justify-center text-stone-700 transition hover:bg-emerald-100 hover:text-emerald-900"
                              aria-label="Збільшити кількість"
                            >
                              <Icon name="plus" size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <p className="font-black text-stone-950">
                            {formatUAH(itemTotal)}
                          </p>

                          <button
                            type="button"
                            onClick={() => removeFromCart(productId)}
                            className="eg-icon-button rounded-xl bg-stone-100 p-3 text-stone-500 hover:bg-red-50 hover:text-red-600"
                            aria-label="Видалити товар"
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <FieldError>{fieldErrors.cart}</FieldError>

            <div className="eg-premium-card mt-6 overflow-hidden rounded-[2rem] bg-emerald-950 p-7 text-white shadow-xl shadow-emerald-950/20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_40%)]" />

              <div className="relative z-10 flex items-center justify-between">
                <span className="text-emerald-100">Разом</span>

                <span className="text-3xl font-black">
                  {formatUAH(total)}
                </span>
              </div>
            </div>
          </section>

          <section className="eg-glass eg-premium-card rounded-[2.2rem] p-6 lg:p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Оформлення
            </p>

            <h2 className="mt-2 text-3xl font-black text-stone-950">
              Куди надіслати замовлення
            </h2>

            <OrderRulesModal />

            {!customer && (
              <div className="eg-panel eg-premium-card mt-5 rounded-[2rem] bg-gradient-to-br from-emerald-50 to-white p-6 text-sm text-emerald-900">
                <p className="font-black">Можна замовити без реєстрації</p>

                <p className="mt-1 leading-6">
                  Але після входу сайт запамʼятає ваше імʼя, контакти, адресу
                  доставки та покаже історію замовлень.
                </p>

                <button
                  type="button"
                  onClick={() => setView("customer-auth")}
                  className="eg-button mt-4 rounded-2xl bg-white px-4 py-2 font-bold text-emerald-900 shadow-sm hover:bg-emerald-100"
                >
                  Увійти або зареєструватися
                </button>
              </div>
            )}

            <div className="mt-7 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-stone-700">
                  Імʼя *
                </span>

                <input
                  value={form.name}
                  onChange={(event) =>
                    updateFormAndClearError("name", event.target.value)
                  }
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
                      onChange={(event) =>
                        updateFormAndClearError("phone", event.target.value)
                      }
                      onBlur={() => {
                        if (form.phone && isValidPhone(form.phone)) {
                          updateForm("phone", normalizePhone(form.phone));
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
                        updateFormAndClearError("telegram", event.target.value)
                      }
                      onBlur={() => {
                        if (form.telegram && isValidTelegram(form.telegram)) {
                          updateForm(
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
                  Для оформлення замовлення достатньо вказати{" "}
                  <span className="font-semibold">телефон або Telegram</span>.
                </p>

                <FieldError>{fieldErrors.contact}</FieldError>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-stone-700">
                  Спосіб отримання
                </span>

                <select
                  value={form.deliveryType}
                  onChange={(event) => {
                    const nextDeliveryType = event.target.value;

                    updateFormAndClearError("deliveryType", nextDeliveryType);

                    if (nextDeliveryType === "pickup") {
                      updateForm("building", "");
                      updateForm("entrance", "");
                      updateForm("floor", "");
                      updateForm("apartment", "");

                      setFieldErrors((current) => ({
                        ...current,
                        building: "",
                        entrance: "",
                        floor: "",
                        apartment: "",
                      }));
                    }
                  }}
                  className={getInputClass(false)}
                >
                  <option value="pickup">Самовивіз з кавʼярні</option>
                  <option value="building">Доставка</option>
                </select>
              </label>

              {needsDelivery && (
                <div className="eg-panel eg-soft-ring eg-premium-card grid gap-3 rounded-[2rem] bg-stone-50/90 p-5 backdrop-blur sm:grid-cols-2">
                  <label>
                    <input
                      value={form.building}
                      onChange={(event) =>
                        updateFormAndClearError("building", event.target.value)
                      }
                      className={getInputClass(Boolean(fieldErrors.building))}
                      placeholder="Корпус / будинок"
                    />

                    <FieldError>{fieldErrors.building}</FieldError>
                  </label>

                  <label>
                    <input
                      value={form.entrance}
                      onChange={(event) =>
                        updateFormAndClearError("entrance", event.target.value)
                      }
                      className={getInputClass(Boolean(fieldErrors.entrance))}
                      placeholder="Підʼїзд"
                    />

                    <FieldError>{fieldErrors.entrance}</FieldError>
                  </label>

                  <label>
                    <input
                      value={form.floor}
                      onChange={(event) =>
                        updateFormAndClearError("floor", event.target.value)
                      }
                      className={getInputClass(Boolean(fieldErrors.floor))}
                      placeholder="Поверх"
                    />

                    <FieldError>{fieldErrors.floor}</FieldError>
                  </label>

                  <label>
                    <input
                      value={form.apartment}
                      onChange={(event) =>
                        updateFormAndClearError("apartment", event.target.value)
                      }
                      className={getInputClass(Boolean(fieldErrors.apartment))}
                      placeholder="Квартира"
                    />

                    <FieldError>{fieldErrors.apartment}</FieldError>
                  </label>
                </div>
              )}

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-stone-700">
                  Коментар
                </span>

                <textarea
                  value={form.comment}
                  onChange={(event) =>
                    updateFormAndClearError("comment", event.target.value)
                  }
                  rows={4}
                  className={getInputClass(false)}
                  placeholder="Побажання до замовлення"
                />
              </label>

              {formError && (
                <div className="eg-error eg-shake rounded-[1.4rem] border border-red-200 bg-red-50/80 p-4 text-sm font-semibold text-red-700 backdrop-blur">
                  {formError}
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={!canSubmit}
                className="eg-button eg-sweep flex w-full items-center justify-center gap-2 rounded-[1.4rem] bg-emerald-900 px-6 py-4 font-black text-white hover:bg-emerald-800 hover:shadow-lg hover:shadow-emerald-900/20 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                <Icon name="send" size={18} />
                Оформити замовлення
              </button>

              {!canSubmit && (
                <p className="text-center text-sm text-stone-500">
                  Додайте товари, імʼя та телефон або Telegram.
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}