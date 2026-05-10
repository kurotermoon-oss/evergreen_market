import { useState } from "react";

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
  return `w-full rounded-2xl border px-4 py-3 outline-none transition ${
    hasError
      ? "border-red-300 focus:border-red-500"
      : "border-stone-300 focus:border-emerald-700"
  } ${extraClass}`;
}

function FieldError({ children }) {
  if (!children) return null;

  return <p className="mt-1 text-sm font-semibold text-red-600">{children}</p>;
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
        <div className="mx-auto max-w-xl rounded-3xl bg-white px-16 py-20 text-center shadow-sm">
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
            className="mt-6 rounded-2xl bg-emerald-900 px-6 py-3 font-semibold text-white hover:bg-emerald-800"
          >
            Перейти до каталогу
          </button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr]">
          <section className="rounded-3xl bg-white p-6 shadow-sm">
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
                className="rounded-2xl border border-stone-300 px-4 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-100"
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
                    className="flex gap-4 rounded-3xl border border-stone-200 p-4"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-24 w-24 rounded-2xl object-cover"
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
                        <div className="flex items-center overflow-hidden rounded-2xl border border-stone-300 bg-white">
                          <button
                            type="button"
                            onClick={() => decreaseItem(item)}
                            className="p-3 text-stone-700 hover:text-emerald-800"
                            aria-label="Зменшити кількість"
                          >
                            <Icon name="minus" size={16} />
                          </button>

                          <span className="min-w-10 text-center font-bold">
                            {quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() => increaseItem(item)}
                            className="p-3 text-stone-700 hover:text-emerald-800"
                            aria-label="Збільшити кількість"
                          >
                            <Icon name="plus" size={16} />
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <p className="font-black text-stone-950">
                            {formatUAH(itemTotal)}
                          </p>

                          <button
                            type="button"
                            onClick={() => removeFromCart(productId)}
                            className="rounded-xl bg-stone-100 p-3 text-stone-500 hover:text-red-600"
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

            <div className="mt-6 rounded-3xl bg-stone-950 p-6 text-white">
              <div className="flex items-center justify-between">
                <span className="text-stone-300">Разом</span>
                <span className="text-3xl font-black">{formatUAH(total)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Оформлення
            </p>

            <h2 className="mt-2 text-3xl font-black text-stone-950">
              Куди надіслати замовлення
            </h2>
              <OrderRulesModal />
            {!customer && (
              <div className="mt-5 rounded-3xl bg-emerald-50 p-5 text-sm text-emerald-900">
                <p className="font-black">Можна замовити без реєстрації</p>

                <p className="mt-1 leading-6">
                  Але після входу сайт запамʼятає ваше імʼя, контакти, адресу
                  доставки та покаже історію замовлень.
                </p>

                <button
                  type="button"
                  onClick={() => setView("customer-auth")}
                  className="mt-4 rounded-2xl bg-white px-4 py-2 font-bold text-emerald-900 shadow-sm hover:bg-emerald-100"
                >
                  Увійти або зареєструватися
                </button>
              </div>
            )}

            <div className="mt-6 space-y-4">
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
                <div className="grid gap-3 rounded-3xl bg-stone-50 p-4 sm:grid-cols-2">
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
                <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
                  {formError}
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={!canSubmit}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-6 py-4 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-300"
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