import Icon from "../components/Icon.jsx";

export default function SuccessView({
  createdOrder,
  setCart,
  setOrderMessage,
  setCreatedOrder,
  setView,
}) {
  function returnToCatalog() {
    setCart([]);
    setOrderMessage("");
    setCreatedOrder(null);
    setView("catalog");
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-900">
          <Icon name="success" size={34} />
        </div>

        <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Замовлення прийнято
        </p>

        <h1 className="mt-2 text-3xl font-black text-stone-950">
          Дякуємо! Ми отримали ваше замовлення
        </h1>

        {createdOrder?.orderNumber && (
          <div className="mx-auto mt-5 w-fit rounded-2xl bg-stone-950 px-5 py-3 text-xl font-black text-white">
            #{createdOrder.orderNumber}
          </div>
        )}

        <p className="mx-auto mt-5 max-w-xl text-stone-600">
          Ми перевіримо замовлення та зв’яжемося з вами для підтвердження.
          Не оплачуйте замовлення до підтвердження.
        </p>

        <div className="mt-8 rounded-3xl bg-stone-50 p-5 text-left">
          <p className="font-bold text-stone-950">Що далі?</p>

          <ol className="mt-3 space-y-2 text-sm text-stone-600">
            <li>1. Ми побачимо ваше замовлення.</li>
            <li>2. Перевіримо наявність товарів.</li>
            <li>3. Напишемо вам у Telegram або зателефонуємо.</li>
            <li>4. Після підтвердження узгодимо оплату та видачу.</li>
          </ol>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={returnToCatalog}
            className="rounded-2xl bg-emerald-900 px-6 py-4 font-bold text-white hover:bg-emerald-800"
          >
            Повернутися до каталогу
          </button>

          <a
            href="https://t.me/EvergreeenCofee"
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-stone-300 px-6 py-4 font-bold text-stone-900 hover:bg-stone-100"
          >
            Написати в Telegram
          </a>
        </div>
      </div>
    </main>
  );
}