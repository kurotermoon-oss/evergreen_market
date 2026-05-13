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
  return `eg-field w-full rounded-[1.3rem] border px-5 py-3.5 outline-none transition ${
    hasError
      ? "eg-shake border-red-300 bg-red-50/40 focus:border-red-500"
      : "border-stone-200 bg-white/85 backdrop-blur focus:border-emerald-700 focus:bg-white"
  }`;
}

function FieldError({ children }) {
  if (!children) return null;

  return (
    <p className="eg-error mt-1 text-sm font-semibold text-red-600">
      {children}
    </p>
  );
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
          className="eg-icon-button absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-2 py-1 text-lg hover:bg-stone-100"
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

    setError("");
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

    setError("");
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
    <main className="eg-ambient mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="eg-glass eg-premium-card overflow-hidden rounded-[2.5rem] p-6 sm:p-8">
        <p className="w-fit rounded-full border border-emerald-200 bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-emerald-800 shadow-sm backdrop-blur">
          Особистий кабінет
        </p>

        <h1 className="mt-5 text-4xl font-black leading-tight text-stone-950">
          {mode === "login" ? "Вхід для клієнта" : "Реєстрація клієнта"}
        </h1>

        <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
          Реєстрація необовʼязкова. Ви можете оформити замовлення і без акаунта,
          але кабінет збереже ваші дані та історію замовлень.
        </p>

        <div className="mt-7 grid grid-cols-2 gap-2 rounded-[2rem] bg-stone-100/80 p-2 backdrop-blur">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`eg-button rounded-[1.4rem] px-4 py-3 text-sm font-black ${
              mode === "login"
                ? "bg-white text-stone-950 shadow-md"
                : "text-stone-600 hover:bg-white/70"
            }`}
          >
            Увійти
          </button>

          <button
            type="button"
            onClick={() => switchMode("register")}
            className={`eg-button rounded-[1.4rem] px-4 py-3 text-sm font-black ${
              mode === "register"
                ? "bg-white text-stone-950 shadow-md"
                : "text-stone-600 hover:bg-white/70"
            }`}
          >
            Створити акаунт
          </button>
        </div>

        {error && (
          <div className="eg-error eg-shake mt-5 rounded-[1.4rem] border border-red-200 bg-red-50/80 p-4 text-sm font-semibold text-red-700 backdrop-blur">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
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
                className="eg-button rounded-xl text-sm font-bold text-emerald-800 hover:text-emerald-950"
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
                  Вкажіть{" "}
                  <span className="font-semibold">телефон або Telegram</span>.
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

              <div className="eg-panel eg-premium-card rounded-[2rem] bg-stone-50/90 p-5 backdrop-blur">
                <div className="mb-4">
                  <p className="font-black text-stone-800">
                    Дані для доставки
                  </p>

                  <p className="mt-1 text-sm leading-6 text-stone-500">
                    Необовʼязково. Можете заповнити зараз або пізніше в
                    особистому кабінеті.
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
            className="eg-button eg-sweep w-full rounded-[1.4rem] bg-emerald-900 px-5 py-4 font-black text-white hover:bg-emerald-800 hover:shadow-lg hover:shadow-emerald-900/20 disabled:cursor-not-allowed disabled:bg-stone-400 disabled:hover:translate-y-0 disabled:hover:shadow-none"
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
          className="eg-button mt-4 w-full rounded-[1.4rem] border border-stone-300 bg-white/80 px-5 py-3 font-bold text-stone-900 backdrop-blur hover:bg-white"
        >
          Продовжити без реєстрації
        </button>
      </section>
    </main>
  );
}