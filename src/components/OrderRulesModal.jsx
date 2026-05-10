import { useEffect, useState } from "react";

function RuleBlock({ title, children }) {
  return (
    <div className="rounded-3xl bg-stone-50 p-5 ring-1 ring-stone-100">
      <h4 className="font-black text-stone-950">{title}</h4>
      <div className="mt-2 text-sm leading-6 text-stone-600">{children}</div>
    </div>
  );
}

function LimitRow({ title, value, note }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
      <p className="font-black text-stone-950">{title}</p>
      <p className="mt-1 text-sm leading-6 text-stone-600">{value}</p>
      {note && <p className="mt-2 text-xs leading-5 text-stone-400">{note}</p>}
    </div>
  );
}

export default function OrderRulesModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (isOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-black text-emerald-900 transition hover:-translate-y-0.5 hover:bg-emerald-100 hover:shadow-sm sm:w-auto"
      >
        Правила та умови замовлення
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 p-4 backdrop-blur-sm sm:p-6"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="my-6 w-full max-w-3xl rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-emerald-700">
                  Evergreen coffee
                </p>

                <h3 className="mt-2 text-3xl font-black text-stone-950">
                  Правила замовлення
                </h3>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-500">
                  Ми залишаємо швидке оформлення без обовʼязкової реєстрації,
                  але для захисту від помилкових і спамних замовлень діють
                  базові обмеження.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-white font-black text-stone-600 transition hover:bg-stone-100"
                aria-label="Закрити правила замовлення"
              >
                ×
              </button>
            </div>

            <div className="mt-6 grid gap-4">
              <RuleBlock title="1. Як можна оформити замовлення">
                <p>
                  Ви можете оформити замовлення як гість або увійти в особистий
                  кабінет. Для оформлення достатньо вказати імʼя та один контакт:
                  телефон або Telegram.
                </p>
              </RuleBlock>

              <RuleBlock title="2. Навіщо потрібна реєстрація">
                <p>
                  Реєстрація зберігає ваші контактні дані, адресу доставки та
                  історію замовлень. Для зареєстрованих клієнтів діють мʼякші
                  обмеження, тому повторні замовлення оформлювати зручніше.
                </p>
              </RuleBlock>

              <RuleBlock title="3. Ліміти для замовлень">
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <LimitRow
                    title="Гість"
                    value="До 50 товарів сумарно. До 15 шт одного товару."
                    note="Підходить для швидкого разового замовлення."
                  />

                  <LimitRow
                    title="Зареєстрований клієнт"
                    value="До 70 товарів сумарно. Без окремого ліміту на один товар."
                    note="Потрібно увійти або створити акаунт."
                  />

                  <LimitRow
                    title="Підтверджений клієнт"
                    value="Без бізнес-лімітів на кількість товарів."
                    note="Після підтвердження телефону або Telegram."
                  />
                </div>
              </RuleBlock>

              <RuleBlock title="4. Чому замовлення може бути обмежене">
                <p>
                  Сайт може тимчасово обмежити оформлення, якщо замовлення
                  створюються занадто часто, якщо вже є кілька активних замовлень
                  або якщо перевищено денний ліміт. Це потрібно, щоб захистити
                  кавʼярню від випадкових повторних натискань, фейкових замовлень
                  і спаму.
                </p>
              </RuleBlock>

              <RuleBlock title="5. Оплата та підтвердження">
                <p>
                  Оплата здійснюється після підтвердження замовлення. Ми спочатку
                  перевіряємо наявність товарів і підтверджуємо замовлення, після
                  цього ви оплачуєте його при самовивозі або за домовленістю.
                </p>
              </RuleBlock>

              <RuleBlock title="6. Самовивіз і локальна доставка">
                <p>
                  Можна забрати замовлення самостійно в кавʼярні або оформити
                  локальну доставку в межах ЖК. Для доставки бажано вказати
                  будинок, підʼїзд, поверх і квартиру.
                </p>
              </RuleBlock>
            </div>

            <div className="mt-6 rounded-3xl bg-emerald-900 p-5 text-white">
              <p className="font-black">Порада</p>
              <p className="mt-2 text-sm leading-6 text-emerald-50">
                Якщо ви плануєте велике або нестандартне замовлення, краще
                написати нам у Telegram — так ми швидше уточнимо наявність і
                деталі.
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-2xl bg-emerald-900 px-6 py-3 font-black text-white transition hover:bg-emerald-800"
              >
                Зрозуміло
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}