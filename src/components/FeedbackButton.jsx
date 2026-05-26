import { useState } from "react";
import {
  AlertTriangle,
  Bug,
  Lightbulb,
  LogIn,
  MessageSquare,
  Send,
  X,
} from "lucide-react";
import { api } from "../api/client.js";

const FEEDBACK_TYPES = [
  {
    id: "complaint",
    label: "Скарга",
    Icon: AlertTriangle,
  },
  {
    id: "wish",
    label: "Побажання",
    Icon: Lightbulb,
  },
  {
    id: "bug",
    label: "Баг",
    Icon: Bug,
  },
  {
    id: "other",
    label: "Інше",
    Icon: MessageSquare,
  },
];

const EMPTY_FORM = {
  type: "wish",
  subject: "",
  message: "",
};

function FieldError({ children }) {
  if (!children) return null;

  return (
    <p className="mt-1 text-sm font-semibold text-red-600">
      {children}
    </p>
  );
}

function getInputClass(hasError) {
  return `eg-field w-full rounded-[1.2rem] border px-4 py-3 text-sm outline-none transition ${
    hasError
      ? "border-red-300 bg-red-50/70 focus:border-red-500"
      : "border-stone-200 bg-white/90 focus:border-emerald-700 focus:bg-white"
  }`;
}

export default function FeedbackButton({ customer = null, setView }) {
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  function closeModal() {
    if (isSubmitting) return;

    setIsOpen(false);
    setFieldErrors({});
    setFormMessage("");
    setIsSent(false);
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setFieldErrors((current) => ({
      ...current,
      [field]: "",
    }));

    setFormMessage("");
    setIsSent(false);
  }

  function openAuth() {
    closeModal();
    setView?.("customer-auth");
  }

  async function submitFeedback(event) {
    event.preventDefault();

    if (!customer) {
      setFormMessage("Увійдіть в акаунт, щоб залишити звернення.");
      return;
    }

    const message = form.message.trim();

    if (message.length < 8) {
      setFieldErrors({
        message: "Опишіть звернення трохи детальніше.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setFormMessage("");
      setFieldErrors({});

      await api.createCustomerFeedback({
        type: form.type,
        subject: form.subject.trim(),
        message,
      });

      setForm(EMPTY_FORM);
      setIsSent(true);
      setFormMessage("Дякуємо, звернення надіслано.");
    } catch (error) {
      const errors = error?.errors || error?.data?.errors || {};

      setFieldErrors(errors);
      setFormMessage(error?.message || "Не вдалося надіслати звернення.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`eg-button group fixed bottom-[6.8rem] right-4 z-[68] flex h-14 w-14 items-center justify-center overflow-hidden rounded-[1.2rem] border text-white shadow-2xl ring-4 ring-white/70 md:bottom-8 md:right-[8.4rem] md:h-[4.9rem] md:w-[4.9rem] md:rounded-[1.55rem] ${
          isOpen
            ? "border-emerald-950 bg-white text-emerald-950 shadow-emerald-950/12"
            : "border-emerald-700/50 bg-emerald-950 shadow-emerald-950/24 hover:bg-emerald-900"
        }`}
        aria-label="Зворотний зв'язок"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        title="Зворотний зв'язок"
      >
        <span className="absolute inset-1.5 rounded-[0.9rem] bg-white/10 ring-1 ring-white/15 transition group-hover:bg-white/15 md:rounded-[1.2rem]" />
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.26),transparent_58%)]" />
        <MessageSquare
          className="relative z-10 h-6 w-6 drop-shadow-sm md:h-8 md:w-8"
          strokeWidth={2.1}
        />
      </button>

      {isOpen && (
        <div
          className="eg-overlay fixed inset-0 z-[1300] flex items-end justify-center bg-stone-950/50 px-3 py-4 backdrop-blur-sm sm:items-center sm:px-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-title"
        >
          <div className="eg-panel w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-2xl shadow-stone-950/20">
            <div className="flex items-start justify-between gap-4 border-b border-stone-100 bg-stone-50/80 p-5 sm:p-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">
                  Evergreen coffee
                </p>

                <h2
                  id="feedback-title"
                  className="mt-2 text-2xl font-black text-stone-950"
                >
                  Зворотний зв'язок
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="eg-icon-button flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-100"
                aria-label="Закрити"
                title="Закрити"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!customer ? (
              <div className="p-5 sm:p-6">
                <div className="rounded-[1.6rem] bg-emerald-50/80 p-5 text-emerald-950 ring-1 ring-emerald-100">
                  <p className="text-lg font-black">Потрібен вхід</p>
                  <p className="mt-2 text-sm leading-6 text-emerald-900">
                    Звернення приймаються тільки від зареєстрованих користувачів.
                  </p>
                </div>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="eg-button rounded-[1.1rem] border border-stone-300 bg-white px-5 py-3 text-sm font-black text-stone-900 hover:bg-stone-50"
                  >
                    Закрити
                  </button>

                  <button
                    type="button"
                    onClick={openAuth}
                    className="eg-button eg-sweep inline-flex items-center justify-center gap-2 rounded-[1.1rem] bg-emerald-900 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800"
                  >
                    <LogIn className="h-4 w-4" />
                    Увійти
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submitFeedback} className="p-5 sm:p-6">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {FEEDBACK_TYPES.map((item) => {
                    const Icon = item.Icon;
                    const isActive = form.type === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => updateField("type", item.id)}
                        className={`eg-button flex min-h-[4.25rem] flex-col items-center justify-center gap-1 rounded-[1.1rem] px-3 py-2 text-sm font-black ring-1 ${
                          isActive
                            ? "bg-emerald-900 text-white ring-emerald-900"
                            : "bg-stone-50 text-stone-700 ring-stone-200 hover:bg-white hover:text-emerald-900"
                        }`}
                        aria-pressed={isActive}
                        title={item.label}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-black text-stone-700">
                      Тема
                    </span>

                    <input
                      value={form.subject}
                      onChange={(event) =>
                        updateField("subject", event.target.value)
                      }
                      maxLength={120}
                      className={getInputClass(Boolean(fieldErrors.subject))}
                      placeholder="Коротко про звернення"
                    />

                    <FieldError>{fieldErrors.subject}</FieldError>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-black text-stone-700">
                      Повідомлення
                    </span>

                    <textarea
                      value={form.message}
                      onChange={(event) =>
                        updateField("message", event.target.value)
                      }
                      rows={6}
                      maxLength={2000}
                      className={`${getInputClass(
                        Boolean(fieldErrors.message)
                      )} min-h-[11rem] resize-y`}
                      placeholder="Опишіть, що сталося або що варто покращити"
                    />

                    <div className="mt-1 flex items-center justify-between gap-3">
                      <FieldError>{fieldErrors.message}</FieldError>

                      <span className="ml-auto text-xs font-bold text-stone-400">
                        {form.message.length}/2000
                      </span>
                    </div>
                  </label>
                </div>

                {formMessage && (
                  <div
                    className={`mt-5 rounded-[1.2rem] p-4 text-sm font-semibold ${
                      isSent
                        ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100"
                        : "bg-red-50 text-red-700 ring-1 ring-red-100"
                    }`}
                  >
                    {formMessage}
                  </div>
                )}

                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSubmitting}
                    className="eg-button rounded-[1.1rem] border border-stone-300 bg-white px-5 py-3 text-sm font-black text-stone-900 hover:bg-stone-50 disabled:cursor-not-allowed"
                  >
                    Скасувати
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="eg-button eg-sweep inline-flex items-center justify-center gap-2 rounded-[1.1rem] bg-emerald-900 px-5 py-3 text-sm font-black text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-400"
                  >
                    <Send className="h-4 w-4" />
                    {isSubmitting ? "Надсилання..." : "Надіслати"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
