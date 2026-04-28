import { useState } from "react";

export default function AdminLoginView({ loginAdmin }) {
  const [login, setLogin] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setError("");
      await loginAdmin({ login, password });
    } catch (error) {
      setError(error.message || "Помилка входу");
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-14 sm:px-6 lg:px-8">
      <form
        onSubmit={handleSubmit}
        className="w-full rounded-[2rem] bg-white p-8 shadow-sm"
      >
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Admin login
        </p>

        <h1 className="mt-2 text-3xl font-black text-stone-950">
          Вхід в адмін-панель
        </h1>

        <p className="mt-3 text-stone-600">
          Редагування товарів і перегляд замовлень доступні тільки після входу.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-stone-700">
              Логін
            </span>

            <input
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
              placeholder="admin"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-stone-700">
              Пароль
            </span>

            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              className="w-full rounded-2xl border border-stone-300 px-4 py-3 outline-none focus:border-emerald-700"
              placeholder="Ваш пароль"
            />
          </label>

          {error && (
            <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <button className="w-full rounded-2xl bg-emerald-900 px-6 py-4 font-bold text-white hover:bg-emerald-800">
            Увійти
          </button>
        </div>
      </form>
    </main>
  );
}