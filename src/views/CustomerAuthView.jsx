import { useState } from "react";

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

function getBackendErrors(error) {
  return (
    error?.response?.data?.errors ||
    error?.data?.errors ||
    error?.errors ||
    {}
  );
}

function getInputClass(hasError) {
  return `w-full rounded-2xl border bg-white px-4 py-3 outline-none transition ${
    hasError
      ? "border-red-300 focus:border-red-500"
      : "border-stone-300 focus:border-emerald-700"
  }`;
}

function FieldError({ children }) {
  if (!children) return null;

  return <p className="mt-1 text-sm font-semibold text-red-600">{children}</p>;
}

function PasswordInput({
  value,
  onChange,
  placeholder,
  showPassword,
  setShowPassword,
  error,
}) {
  return (
    <div>
      <div className="relative">
        <input
          value={value}
          onChange={onChange}
          type={showPassword ? "text" : "password"}
          className={`${getInputClass(Boolean(error))} pr-14`}
          placeholder={placeholder}
          autoComplete="current-password"
        />

        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-2 py-1 text-lg hover:bg-stone-100"
          aria-label={showPassword ? "Приховати пароль" : "Показати пароль"}
        >
          {showPassword ? "🙈" : "👁️"}
        </button>
      </div>

      <FieldError>{error}</FieldError>
    </div>
  );
}

export default function CustomerAuthView({
  customerLogin,
  customerRegister,
  setView,
}) {
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterPasswordConfirm, setShowRegisterPasswordConfirm] =
    useState(false);

  const [loginForm, setLoginForm] = useState({
    login: "",
    password: "",
  });

  const [registerForm, setRegisterForm] = useState({
    name: "",
    phone: "",
    telegram: "",
    password: "",
    passwordConfirm: "",
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

    setFieldErrors((current) => ({
      ...current,
      [field]: "",
    }));
  }

  function updateRegister(field, value) {
    setRegisterForm((current) => ({
      ...current,
      [field]: value,
    }));

    setFieldErrors((current) => ({
      ...current,
      [field]: "",
      contact: "",
    }));
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setFieldErrors({});
  }

  function validateLogin() {
    const errors = {};
    const login = loginForm.login.trim();
    const password = loginForm.password;

    if (!login) {
      errors.login = "Вкажіть телефон або Telegram";
    } else {
      const looksLikeTelegram = /[a-zA-Z_@]/.test(login);

      if (looksLikeTelegram && !isValidTelegram(login)) {
        errors.login = "Telegram має бути у форматі @username";
      }

      if (!looksLikeTelegram && !isValidPhone(login)) {
        errors.login = "Телефон має бути у форматі +380XXXXXXXXX";
      }
    }

    if (!password) {
      errors.password = "Вкажіть пароль";
    }

    return errors;
  }

  function validateRegister() {
    const errors = {};
    const name = registerForm.name.trim();
    const phone = registerForm.phone.trim();
    const telegram = registerForm.telegram.trim();
    const password = registerForm.password;
    const passwordConfirm = registerForm.passwordConfirm;

    if (name.length < 2) {
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

    if (password.length < 8) {
      errors.password = "Пароль має містити щонайменше 8 символів";
    }

    if (/\s/.test(password)) {
      errors.password = "Пароль не повинен містити пробілів";
    }

    if (!passwordConfirm) {
      errors.passwordConfirm = "Повторіть пароль";
    } else if (password !== passwordConfirm) {
      errors.passwordConfirm = "Паролі не співпадають";
    }

    return errors;
  }

  function buildRegisterPayload() {
    return {
      ...registerForm,
      name: registerForm.name.trim(),
      phone: normalizePhone(registerForm.phone),
      telegram: normalizeTelegram(registerForm.telegram),
    };
  }

  function buildLoginPayload() {
    const login = loginForm.login.trim();
    const looksLikeTelegram = /[a-zA-Z_@]/.test(login);

    return {
      login: looksLikeTelegram ? normalizeTelegram(login) : normalizePhone(login),
      password: loginForm.password,
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const errors = mode === "login" ? validateLogin() : validateRegister();

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Перевірте правильність заповнення форми.");
      return;
    }

    try {
      setError("");
      setFieldErrors({});
      setIsSubmitting(true);

      if (mode === "login") {
        await customerLogin(buildLoginPayload());
      } else {
        await customerRegister(buildRegisterPayload());
      }

      setView("account");
    } catch (error) {
      console.error("Customer auth error:", error);

      const backendErrors = getBackendErrors(error);

      if (Object.keys(backendErrors).length > 0) {
        setFieldErrors(backendErrors);
        setError("Перевірте дані у формі.");
        return;
      }

      setError(
        mode === "login"
          ? "Не вдалося увійти. Перевір телефон/Telegram та пароль."
          : "Не вдалося створити акаунт. Можливо, такий телефон або Telegram вже використовується."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleForgotPassword() {
    alert(
      "Для відновлення пароля напишіть нам у Telegram. Ми перевіримо ваші дані та допоможемо відновити доступ."
    );
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
            onClick={() => switchMode("login")}
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
            onClick={() => switchMode("register")}
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
              <div>
                <input
                  value={loginForm.login}
                  onChange={(event) => updateLogin("login", event.target.value)}
                  className={getInputClass(Boolean(fieldErrors.login))}
                  placeholder="Телефон або Telegram"
                  autoComplete="username"
                />
                <FieldError>{fieldErrors.login}</FieldError>
              </div>

              <PasswordInput
                value={loginForm.password}
                onChange={(event) =>
                  updateLogin("password", event.target.value)
                }
                placeholder="Пароль"
                showPassword={showLoginPassword}
                setShowPassword={setShowLoginPassword}
                error={fieldErrors.password}
              />

              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm font-bold text-emerald-800 hover:text-emerald-950"
              >
                Забули пароль?
              </button>
            </>
          )}

          {mode === "register" && (
            <>
              <div>
                <input
                  value={registerForm.name}
                  onChange={(event) =>
                    updateRegister("name", event.target.value)
                  }
                  className={getInputClass(Boolean(fieldErrors.name))}
                  placeholder="Ваше імʼя"
                  autoComplete="name"
                />
                <FieldError>{fieldErrors.name}</FieldError>
              </div>

                <div>
  <p className="mb-2 text-sm font-semibold text-stone-700">
    Контакт для звʼязку
  </p>

  <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
    <div>
      <input
        value={registerForm.phone}
        onChange={(event) =>
          updateRegister("phone", event.target.value)
        }
        className={getInputClass(Boolean(fieldErrors.phone))}
        placeholder="+380XXXXXXXXX"
        autoComplete="tel"
      />
      <FieldError>{fieldErrors.phone}</FieldError>
    </div>

    <div className="flex h-12 items-center justify-center text-sm font-black uppercase tracking-wide text-stone-400">
      або
    </div>

    <div>
      <input
        value={registerForm.telegram}
        onChange={(event) =>
          updateRegister("telegram", event.target.value)
        }
        className={getInputClass(Boolean(fieldErrors.telegram))}
        placeholder="@username"
        autoComplete="username"
      />
      <FieldError>{fieldErrors.telegram}</FieldError>
    </div>
  </div>

  <p className="mt-2 text-sm leading-6 text-stone-500">
    Вкажіть <span className="font-semibold">телефон або Telegram</span>.
    Одного контакту достатньо.
  </p>

  <FieldError>{fieldErrors.contact}</FieldError>
</div>

              <PasswordInput
                value={registerForm.password}
                onChange={(event) =>
                  updateRegister("password", event.target.value)
                }
                placeholder="Пароль мінімум 8 символів"
                showPassword={showRegisterPassword}
                setShowPassword={setShowRegisterPassword}
                error={fieldErrors.password}
              />

              <PasswordInput
                value={registerForm.passwordConfirm}
                onChange={(event) =>
                  updateRegister("passwordConfirm", event.target.value)
                }
                placeholder="Повторіть пароль"
                showPassword={showRegisterPasswordConfirm}
                setShowPassword={setShowRegisterPasswordConfirm}
                error={fieldErrors.passwordConfirm}
              />

          <div className="rounded-3xl bg-stone-50 p-4">
            <div className="mb-4">
              <p className="font-bold text-stone-800">
                Дані для доставки
              </p>

              <p className="mt-1 text-sm leading-6 text-stone-500">
                Необовʼязково. Можете заповнити зараз або пізніше в особистому кабінеті.
              </p>
            </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    value={registerForm.building}
                    onChange={(event) =>
                      updateRegister("building", event.target.value)
                    }
                    className={getInputClass(false)}
                    placeholder="Будинок"
                  />

                  <input
                    value={registerForm.entrance}
                    onChange={(event) =>
                      updateRegister("entrance", event.target.value)
                    }
                    className={getInputClass(false)}
                    placeholder="Підʼїзд"
                  />

                  <input
                    value={registerForm.floor}
                    onChange={(event) =>
                      updateRegister("floor", event.target.value)
                    }
                    className={getInputClass(false)}
                    placeholder="Поверх"
                  />

                  <input
                    value={registerForm.apartment}
                    onChange={(event) =>
                      updateRegister("apartment", event.target.value)
                    }
                    className={getInputClass(false)}
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