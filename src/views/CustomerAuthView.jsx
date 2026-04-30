import { useState } from "react";

export default function CustomerAuthView({
  customerLogin,
  customerRegister,
  setView,
}) {
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loginForm, setLoginForm] = useState({
    login: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    name: "",
    phone: "",
    telegram: "",
    password: "",
    building: "",
    entrance: "",
    floor: "",
    apartment: "",
  });

  function updateLogin(field, value) {
    setLoginForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateRegister(field, value) {
    setRegisterForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setError("");
      setIsSubmitting(true);

      if (mode === "login") {
        await customerLogin(loginForm);
      } else {
        await customerRegister(registerForm);
      }

      setView("account");
    } catch (error) {
      console.error("Customer auth error:", error);
      setError(
        mode === "login"
          ? "Не вдалося увійти. Перевір телефон/Telegram та пароль."
          : "Не вдалося створити акаунт. Можливо, такий телефон або Telegram вже використовується."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Особистий кабінет
        </p>

        <h1 className="mt-2 text-3xl font-black text-stone-950">
          {mode === "login" ? "Вхід для клієнта" : "Реєстрація клієнта"}
        </h1>

        <p className="mt-3 text-stone-600">
          Реєстрація необовʼязкова. Ви можете оформити замовлення і без акаунта,
          але кабінет збереже ваші дані та історію замовлень.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-3xl bg-stone-100 p-2">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className={`rounded-2xl px-4 py-3 text-sm font-black ${
              mode === "login"
                ? "bg-white text-stone-950 shadow-sm"
                : "text-stone-600 hover:bg-stone-200"
            }`}
          >
            Увійти
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError("");
            }}
            className={`rounded-2xl px-4 py-3 text-sm font-black ${
              mode === "register"
                ? "bg-white text-stone-950 shadow-sm"
                : "text-stone-600 hover:bg-stone-200"
            }`}
          >
            Створити акаунт
          </button>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === "login" && (
            <>
              <input
                value={loginForm.login}
                onChange={(event) => updateLogin("login", event.target.value)}
                className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
                placeholder="Телефон або Telegram"
              />

              <input
                value={loginForm.password}
                onChange={(event) => updateLogin("password", event.target.value)}
                type="password"
                className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
                placeholder="Пароль"
              />
            </>
          )}

          {mode === "register" && (
            <>
              <input
                value={registerForm.name}
                onChange={(event) => updateRegister("name", event.target.value)}
                className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
                placeholder="Ваше імʼя"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  value={registerForm.phone}
                  onChange={(event) => updateRegister("phone", event.target.value)}
                  className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
                  placeholder="Телефон"
                />

                <input
                  value={registerForm.telegram}
                  onChange={(event) =>
                    updateRegister("telegram", event.target.value)
                  }
                  className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
                  placeholder="Telegram"
                />
              </div>

              <input
                value={registerForm.password}
                onChange={(event) =>
                  updateRegister("password", event.target.value)
                }
                type="password"
                className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
                placeholder="Пароль мінімум 6 символів"
              />

              <div className="rounded-3xl bg-stone-50 p-4">
                <p className="mb-3 font-bold text-stone-800">
                  Дані для доставки по ЖК
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    value={registerForm.building}
                    onChange={(event) =>
                      updateRegister("building", event.target.value)
                    }
                    className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
                    placeholder="Будинок"
                  />

                  <input
                    value={registerForm.entrance}
                    onChange={(event) =>
                      updateRegister("entrance", event.target.value)
                    }
                    className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
                    placeholder="Підʼїзд"
                  />

                  <input
                    value={registerForm.floor}
                    onChange={(event) =>
                      updateRegister("floor", event.target.value)
                    }
                    className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
                    placeholder="Поверх"
                  />

                  <input
                    value={registerForm.apartment}
                    onChange={(event) =>
                      updateRegister("apartment", event.target.value)
                    }
                    className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
                    placeholder="Квартира"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-emerald-900 px-5 py-4 font-black text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          >
            {isSubmitting
              ? "Зачекайте..."
              : mode === "login"
                ? "Увійти"
                : "Зареєструватися"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setView("cart")}
          className="mt-4 w-full rounded-2xl border border-stone-300 px-5 py-3 font-bold text-stone-900 hover:bg-stone-100"
        >
          Продовжити без реєстрації
        </button>
      </section>
    </main>
  );
}