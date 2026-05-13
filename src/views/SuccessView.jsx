import { useState } from "react";
import Icon from "../components/Icon.jsx";

export default function SuccessView({
  createdOrder,
  customer,
  setCart,
  setOrderMessage,
  setCreatedOrder,
  setView,
}) {
  const [copyMessage, setCopyMessage] = useState("");

  const orderNumber = createdOrder?.orderNumber;

  function returnToCatalog() {
    setCart([]);
    setOrderMessage("");
    setCreatedOrder(null);
    setView("catalog");
  }

  async function copyOrderNumber() {
    if (!orderNumber) return;

    try {
      await navigator.clipboard.writeText(`#${orderNumber}`);
      setCopyMessage("Номер скопійовано.");
    } catch {
      setCopyMessage("Не вдалося скопіювати. Запишіть номер вручну.");
    }
  }

  return (
    <main className="eg-ambient mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="eg-glass eg-premium-card overflow-hidden rounded-[2.5rem] p-8 text-center sm:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-emerald-100 text-emerald-900 shadow-lg shadow-emerald-900/10">
          <div className="eg-attention">
            <Icon name="success" size={42} />
          </div>
        </div>

        <p className="mt-7 text-sm font-black uppercase tracking-[0.24em] text-emerald-700">
          Замовлення прийнято
        </p>

        <h1 className="mx-auto mt-3 max-w-2xl text-4xl font-black leading-tight text-stone-950">
          Дякуємо! Ми отримали ваше замовлення
        </h1>

        {orderNumber && (
          <div className="eg-premium-card mx-auto mt-6 w-fit overflow-hidden rounded-[1.5rem] bg-emerald-950 px-6 py-4 text-2xl font-black text-white shadow-xl shadow-emerald-950/20">
            <span className="relative z-10">#{orderNumber}</span>
          </div>
        )}

        <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-stone-600">
          Ми перевіримо замовлення та зв’яжемося з вами для підтвердження.
          Не оплачуйте замовлення до підтвердження.
        </p>

        {orderNumber && (
          <div className="eg-panel mt-7 rounded-[2rem] bg-emerald-50/80 p-5 text-left ring-1 ring-emerald-100">
            <p className="font-black text-emerald-950">
              Номер замовлення збережено
            </p>

            <p className="mt-2 text-sm leading-6 text-emerald-900">
              Ми зберегли це замовлення на цьому пристрої. Пізніше його можна
              буде знайти у кошику в блоці “Останні замовлення на цьому
              пристрої”.
            </p>

            {customer && (
              <p className="mt-2 text-sm leading-6 text-emerald-900">
                Також замовлення доступне в особистому кабінеті у розділі “Мої
                замовлення”.
              </p>
            )}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={copyOrderNumber}
                className="eg-button rounded-2xl bg-white px-4 py-3 text-sm font-black text-emerald-900 shadow-sm hover:bg-emerald-100"
              >
                Скопіювати номер
              </button>

              {customer && (
                <button
                  type="button"
                  onClick={() => setView("account")}
                  className="eg-button rounded-2xl bg-emerald-900 px-4 py-3 text-sm font-black text-white hover:bg-emerald-800"
                >
                  Мої замовлення
                </button>
              )}
            </div>

            {copyMessage && (
              <p className="mt-3 text-sm font-semibold text-emerald-800">
                {copyMessage}
              </p>
            )}
          </div>
        )}

        <div className="eg-panel mt-9 rounded-[2rem] bg-white/75 p-6 text-left shadow-sm ring-1 ring-stone-200/70 backdrop-blur">
          <p className="text-lg font-black text-stone-950">Що далі?</p>

          <ol className="eg-stagger mt-4 grid gap-3 text-sm text-stone-600">
            {[
              "Ми побачимо ваше замовлення.",
              "Перевіримо наявність товарів.",
              "Напишемо вам у Telegram або зателефонуємо.",
              "Після підтвердження узгодимо оплату та видачу.",
            ].map((item, index) => (
              <li
                key={item}
                className="eg-card flex gap-3 rounded-2xl bg-stone-50 p-4 hover:bg-emerald-50/60"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-900 text-xs font-black text-white">
                  {index + 1}
                </span>

                <span className="pt-1 font-semibold leading-6">{item}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="eg-stagger mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={returnToCatalog}
            className="eg-button eg-sweep rounded-2xl bg-emerald-900 px-6 py-4 font-black text-white hover:bg-emerald-800 hover:shadow-lg hover:shadow-emerald-900/20"
          >
            Повернутися до каталогу
          </button>

          <a
            href="https://t.me/EvergreeenCofee"
            target="_blank"
            rel="noreferrer"
            className="eg-button rounded-2xl border border-stone-300 bg-white/80 px-6 py-4 font-black text-stone-900 backdrop-blur hover:bg-white"
          >
            Написати в Telegram
          </a>
        </div>
      </div>
    </main>
  );
}