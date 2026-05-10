import { useState } from "react";
import { api } from "../../api/client.js";

export default function TelegramVerificationCard({
  customer,
  onCustomerUpdate,
}) {
  const [verification, setVerification] = useState(null);
  const [step, setStep] = useState("");
  const [message, setMessage] = useState("");
  const [hint, setHint] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isVerified = Boolean(
    customer?.telegramVerifiedAt && customer?.phoneVerifiedAt
  );

  const hasTelegram = Boolean(customer?.telegram);
  const hasPhone = Boolean(customer?.phone);

  const canStart = hasTelegram && hasPhone && !isVerified;

  async function startVerification() {
    setIsLoading(true);
    setMessage("");
    setHint("");
    setStep("");

    try {
      const response = await api.startTelegramVerification();

      setVerification(response);
      setStep("code_created");
      setMessage(response.message || "Код створено.");
      setHint(
        "Надішліть код боту, потім натисніть кнопку перевірки на сайті."
      );
    } catch (error) {
      setMessage(error.message);
      setHint(error.hint || "");
    } finally {
      setIsLoading(false);
    }
  }

  async function checkVerification() {
    setIsLoading(true);
    setMessage("");
    setHint("");

    try {
      const response = await api.checkTelegramVerification();

      setMessage(response.message || "Перевірку виконано.");
      setHint(response.hint || "");
      setStep(response.step || "");

      if (response.customer) {
        onCustomerUpdate?.(response.customer);
      }

      if (response.verified) {
        setVerification(null);
        setStep("verified");
      }
    } catch (error) {
      setMessage(error.message);
      setHint(error.hint || "");
    } finally {
      setIsLoading(false);
    }
  }

  function getStatusLabel() {
    if (isVerified) return "Підтверджено";
    if (step === "phone_contact_required") return "Підтвердіть телефон";
    if (step === "waiting_phone_contact") return "Очікуємо телефон";
    if (verification?.code) return "Код створено";
    return "Не підтверджено";
  }

  function getPrimaryButtonLabel() {
    if (isLoading) return "Перевіряємо...";

    if (step === "phone_contact_required" || step === "waiting_phone_contact") {
      return "Я поділився номером";
    }

    if (verification?.code) {
      return "Я надіслав код";
    }

    return "Підтвердити Telegram";
  }

  return (
    <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-stone-100">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-emerald-700">
            Підтвердження Telegram
          </p>

          <h2 className="mt-2 text-2xl font-black text-stone-950">
            {isVerified
              ? "Telegram і телефон підтверджено"
              : "Підтвердіть Telegram"}
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
            Підтверджений Telegram і номер телефону знімають більшість
            обмежень на замовлення та допомагають нам швидше звʼязатися з вами.
          </p>
        </div>

        <span
          className={`inline-flex shrink-0 rounded-full px-4 py-2 text-xs font-black ${
            isVerified
              ? "bg-emerald-100 text-emerald-900"
              : "bg-amber-100 text-amber-900"
          }`}
        >
          {getStatusLabel()}
        </span>
      </div>

      {!hasTelegram && (
        <div className="mt-5 rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-stone-600 ring-1 ring-stone-100">
          Спочатку додайте Telegram у профілі, наприклад{" "}
          <span className="font-black text-stone-900">@username</span>.
        </div>
      )}

      {!hasPhone && (
        <div className="mt-5 rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-stone-600 ring-1 ring-stone-100">
          Спочатку додайте номер телефону у профілі. Саме цей номер потрібно
          буде підтвердити через Telegram.
        </div>
      )}

      {verification?.code && !isVerified && (
        <div className="mt-6 rounded-3xl bg-white p-5 ring-1 ring-emerald-100">
          <p className="text-sm font-bold text-stone-600">
            Ваш код підтвердження:
          </p>

          <p className="mt-2 select-all text-4xl font-black tracking-[0.2em] text-emerald-900">
            {verification.code}
          </p>

          <p className="mt-4 text-sm leading-6 text-stone-600">
            Надішліть цей код нашому Telegram-боту. Після цього бот попросить
            вас поділитися номером телефону через кнопку Telegram. Номер має
            збігатися з номером у вашому профілі.
          </p>

          {verification.botUsername && (
            <a
              href={`https://t.me/${verification.botUsername.replace("@", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex rounded-2xl bg-emerald-900 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
            >
              Відкрити Telegram-бота
            </a>
          )}
        </div>
      )}

      {(step === "phone_contact_required" ||
        step === "waiting_phone_contact") &&
        !isVerified && (
          <div className="mt-5 rounded-3xl bg-emerald-50 p-5 text-emerald-950 ring-1 ring-emerald-100">
            <p className="font-black">Код підтверджено.</p>

            <p className="mt-2 text-sm leading-6">
              Тепер відкрийте Telegram-бота та натисніть кнопку{" "}
              <span className="font-black">“Поділитися телефоном”</span>. Після
              цього поверніться на сайт і натисніть{" "}
              <span className="font-black">“Я поділився номером”</span>.
            </p>
          </div>
        )}

      {message && (
        <div className="mt-5 rounded-2xl bg-stone-50 p-4 text-sm leading-6 text-stone-700 ring-1 ring-stone-100">
          <p className="font-black text-stone-950">{message}</p>

          {hint && <p className="mt-2 text-stone-500">{hint}</p>}
        </div>
      )}

      {isVerified && (
        <div className="mt-5 rounded-3xl bg-emerald-50 p-5 text-emerald-950 ring-1 ring-emerald-100">
          <p className="font-black">Профіль підтверджено.</p>
          <p className="mt-2 text-sm leading-6">
            Для цього акаунта знято більшість обмежень на оформлення замовлень.
          </p>
        </div>
      )}

      {!isVerified && (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={
              verification?.code ||
              step === "phone_contact_required" ||
              step === "waiting_phone_contact"
                ? checkVerification
                : startVerification
            }
            disabled={isLoading || !canStart}
            className="rounded-2xl bg-emerald-900 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {getPrimaryButtonLabel()}
          </button>

          {verification?.code && (
            <button
              type="button"
              onClick={startVerification}
              disabled={isLoading}
              className="rounded-2xl border border-stone-300 bg-white px-5 py-3 text-sm font-black text-stone-900 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Створити новий код
            </button>
          )}
        </div>
      )}
    </section>
  );
}