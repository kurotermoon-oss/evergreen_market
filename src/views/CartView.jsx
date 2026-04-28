import Icon from "../components/Icon.jsx";
import { formatUAH } from "../utils/formatUAH.js";

export default function CartView({
  cartItems,
  total,
  form,
  updateForm,
  changeQuantity,
  removeFromCart,
  setCart,
  setView,
  submitOrder,
}) {
  const needsDelivery = form.deliveryType === "building";
  const canSubmit = cartItems.length > 0 && form.name && (form.phone || form.telegram);
  const DELIVERY_TYPES = [
  { id: "pickup", label: "Самовивіз з кавʼярні" },
  { id: "building", label: "Доставка по ЖК" },
];
  return (
    <main className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:px-8">
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

          {cartItems.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="rounded-2xl border border-stone-300 px-4 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-100"
            >
              Очистити
            </button>
          )}
        </div>

        <div className="space-y-4">
          {cartItems.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-3xl border border-stone-200 p-4"
            >
              <img
                src={item.image}
                alt={item.name}
                className="h-24 w-24 rounded-2xl object-cover"
              />

              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-stone-950">{item.name}</h3>

                <p className="mt-1 text-sm text-stone-500">
                  {formatUAH(item.price)} за одиницю
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center rounded-2xl border border-stone-300">
                    <button
                      onClick={() => changeQuantity(item.id, -1)}
                      className="p-3 text-stone-700 hover:text-emerald-800"
                    >
                      <Icon name="minus" size={16} />
                    </button>

                    <span className="min-w-10 text-center font-bold">
                      {item.quantity}
                    </span>

                    <button
                      onClick={() => changeQuantity(item.id, 1)}
                      className="p-3 text-stone-700 hover:text-emerald-800"
                    >
                      <Icon name="plus" size={16} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="font-black text-stone-950">
                      {formatUAH(item.price * item.quantity)}
                    </p>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="rounded-xl bg-stone-100 p-3 text-stone-500 hover:text-red-600"
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!cartItems.length && (
          <div className="rounded-3xl bg-stone-50 p-10 text-center">
            <Icon name="package" className="mx-auto text-stone-400" size={44} />

            <p className="mt-4 text-lg font-bold text-stone-950">
              Кошик порожній
            </p>

            <button
              onClick={() => setView("catalog")}
              className="mt-5 rounded-2xl bg-emerald-900 px-5 py-3 font-semibold text-white hover:bg-emerald-800"
            >
              Перейти до каталогу
            </button>
          </div>
        )}

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

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-stone-700">
              Ім’я *
            </span>

            <input
              value={form.name}
              onChange={(event) => updateForm("name", event.target.value)}
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
              placeholder="Ваше ім’я"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-stone-700">
              Телефон
            </span>

            <input
              value={form.phone}
              onChange={(event) => updateForm("phone", event.target.value)}
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
              placeholder="+380..."
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-stone-700">
              Telegram username
            </span>

            <input
              value={form.telegram}
              onChange={(event) => updateForm("telegram", event.target.value)}
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
              placeholder="@username"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-stone-700">
              Спосіб отримання
            </span>

          <select
            value={form.deliveryType}
            onChange={(event) => updateForm("deliveryType", event.target.value)}
            className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
          >
            <option value="pickup">Самовивіз з кавʼярні</option>
            <option value="building">Доставка по ЖК</option>
          </select>

          </label>

          {needsDelivery && (
            <div className="grid gap-3 rounded-3xl bg-stone-50 p-4 sm:grid-cols-2">
              <input
                value={form.building}
                onChange={(event) => updateForm("building", event.target.value)}
                className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
                placeholder="Корпус / будинок"
              />

              <input
                value={form.entrance}
                onChange={(event) => updateForm("entrance", event.target.value)}
                className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
                placeholder="Під’їзд"
              />

              <input
                value={form.floor}
                onChange={(event) => updateForm("floor", event.target.value)}
                className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
                placeholder="Поверх"
              />

              <input
                value={form.apartment}
                onChange={(event) => updateForm("apartment", event.target.value)}
                className="rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
                placeholder="Квартира"
              />
            </div>
          )}

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-stone-700">
              Коментар
            </span>

            <textarea
              value={form.comment}
              onChange={(event) => updateForm("comment", event.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
              placeholder="Побажання до замовлення"
            />
          </label>

          <button
            onClick={submitOrder}
            disabled={!canSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-900 px-6 py-4 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            <Icon name="send" size={18} />
            Оформити замовлення
          </button>

          {!canSubmit && (
            <p className="text-center text-sm text-stone-500">
              Додайте товари, ім’я та телефон або Telegram.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}