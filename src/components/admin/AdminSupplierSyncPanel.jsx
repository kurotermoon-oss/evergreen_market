import { useEffect, useMemo, useState } from "react";

import { api } from "../../api/client.js";

const ADAPTER_ID = "milkdiller_html";

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("uk-UA", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getStatusLabel(status) {
  const labels = {
    idle: "Ще не запускалась",
    running: "Виконується",
    completed: "Завершено",
    dry_run: "Тест завершено",
    blocked: "Потрібне підтвердження",
    failed: "Помилка",
  };

  return labels[status] || status || "Невідомо";
}

function getStatusClass(status) {
  if (status === "completed") return "bg-emerald-50 text-emerald-900 ring-emerald-200";
  if (status === "running") return "bg-blue-50 text-blue-800 ring-blue-200";
  if (status === "dry_run") return "bg-sky-50 text-sky-800 ring-sky-200";
  if (status === "blocked") return "bg-amber-50 text-amber-900 ring-amber-200";
  if (status === "failed") return "bg-red-50 text-red-800 ring-red-200";

  return "bg-stone-100 text-stone-700 ring-stone-200";
}

function getRemoteLabel(status) {
  if (status === "available") return "В наявності";
  if (status === "unavailable") return "Очікується";

  return "Не перевірено";
}

function StatCard({ label, value, tone = "stone" }) {
  const toneClass =
    tone === "green"
      ? "text-emerald-900"
      : tone === "red"
        ? "text-red-700"
        : tone === "amber"
          ? "text-amber-800"
          : "text-stone-950";

  return (
    <div className="eg-card rounded-[1.4rem] border border-stone-100 bg-white/80 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-stone-400">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-black ${toneClass}`}>{value}</p>
    </div>
  );
}

export default function AdminSupplierSyncPanel({
  suppliers = [],
  refreshAdminData,
  refreshPublicData,
}) {
  const initialSupplierId = useMemo(() => {
    const configured = suppliers.find((supplier) => {
      return supplier.availabilitySyncAdapter === ADAPTER_ID;
    });
    const milkDiller = suppliers.find((supplier) => {
      return /milk\s*diller|milkdiller|мілк\s*діллер/i.test(supplier.name || "");
    });

    return configured?.id || milkDiller?.id || suppliers[0]?.id || "";
  }, [suppliers]);
  const [supplierId, setSupplierId] = useState(initialSupplierId);
  const [dashboard, setDashboard] = useState(null);
  const [autoMapResult, setAutoMapResult] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("problems");
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!supplierId && initialSupplierId) {
      setSupplierId(initialSupplierId);
    }
  }, [initialSupplierId, supplierId]);

  async function loadDashboard(id = supplierId) {
    if (!id) return;

    setLoading(true);
    setError("");

    try {
      const response = await api.getAdminSupplierSync(id);
      setDashboard(response);
      setDrafts(
        Object.fromEntries(
          (response.products || []).map((product) => [
            product.id,
            {
              productUrl: product.productUrl || "",
              externalId: product.externalId || "",
              syncEnabled: product.syncEnabled === true,
              statusOverride: product.statusOverride || "auto",
            },
          ])
        )
      );
    } catch (requestError) {
      setDashboard(null);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setDashboard(null);
    setAutoMapResult(null);
    setDrafts({});
    setNotice("");

    if (supplierId) {
      loadDashboard(supplierId);
    }
    // loadDashboard is deliberately scoped to the selected supplier.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierId]);

  async function refreshApplicationData() {
    await Promise.all([
      refreshAdminData?.(),
      refreshPublicData?.(),
    ]);
  }

  async function updateSettings(payload, actionName) {
    if (!supplierId) return;

    setAction(actionName);
    setError("");
    setNotice("");

    try {
      await api.updateAdminSupplierSyncSettings(supplierId, payload);
      await Promise.all([loadDashboard(), refreshAdminData?.()]);
      setNotice("Налаштування синхронізації збережено.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setAction("");
    }
  }

  async function runSync({ dryRun = false, force = false } = {}) {
    if (!supplierId) return;

    if (
      force &&
      !window.confirm(
        "Повторно перевірити Milk Diller та застосувати масові зміни, якщо вони підтвердяться?"
      )
    ) {
      return;
    }

    setAction(force ? "force" : dryRun ? "dry-run" : "run");
    setError("");
    setNotice("");

    try {
      const response = await api.runAdminSupplierSync(supplierId, {
        dryRun,
        force,
      });

      await Promise.all([loadDashboard(), refreshApplicationData()]);
      setNotice(response.run?.message || "Перевірку завершено.");
    } catch (requestError) {
      await loadDashboard();
      setError(requestError.message);
    } finally {
      setAction("");
    }
  }

  async function runAutoMap({ apply = false } = {}) {
    if (!supplierId) return;

    if (
      apply &&
      !window.confirm(
        `Зберегти ${autoMapResult?.summary?.matched || 0} однозначних привʼязок і ввімкнути для них автоматичну перевірку?`
      )
    ) {
      return;
    }

    setAction(apply ? "auto-map-apply" : "auto-map-preview");
    setError("");
    setNotice("");

    try {
      const response = await api.autoMapAdminSupplierProducts(supplierId, {
        apply,
        enableSync: true,
      });

      setAutoMapResult(response.result);

      if (apply) {
        await Promise.all([loadDashboard(), refreshAdminData?.()]);
        setNotice(
          `Автоматично збережено ${response.result?.applied || 0} привʼязок. Перед застосуванням статусів виконайте тестову перевірку.`
        );
      } else {
        setNotice("Попередній перегляд автопривʼязки готовий. Дані товарів не змінено.");
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setAction("");
    }
  }

  async function toggleAutomaticSync() {
    if (!supplierId || !dashboard) return;

    const nextEnabled = !(
      dashboard.supplier.enabled && !dashboard.supplier.paused
    );
    let settingsSaved = false;

    setAction("automatic-sync");
    setError("");
    setNotice("");

    try {
      await api.updateAdminSupplierSyncSettings(supplierId, {
        adapter: ADAPTER_ID,
        enabled: nextEnabled,
        paused: false,
      });
      settingsSaved = true;

      let immediateRun = null;

      if (nextEnabled) {
        const response = await api.runAdminSupplierSync(supplierId, {
          dryRun: false,
          force: false,
        });
        immediateRun = response.run;
      }

      await Promise.all([loadDashboard(), refreshApplicationData()]);
      setNotice(
        nextEnabled
          ? `Автоматичну перевірку увімкнено. ${
              immediateRun?.message || "Першу перевірку завершено."
            }`
          : "Автоматичну перевірку вимкнено. Планові запуски не змінюватимуть статуси товарів."
      );
    } catch (requestError) {
      await loadDashboard();
      setError(
        settingsSaved && nextEnabled
          ? `Автоматичну перевірку увімкнено, але перший запуск не завершився: ${requestError.message}`
          : requestError.message
      );
    } finally {
      setAction("");
    }
  }

  function updateDraft(productId, field, value) {
    setDrafts((current) => ({
      ...current,
      [productId]: {
        ...(current[productId] || {}),
        [field]: value,
      },
    }));
  }

  async function saveProduct(productId) {
    const draft = drafts[productId];

    if (!draft) return;

    setAction(`product:${productId}`);
    setError("");
    setNotice("");

    try {
      await api.updateAdminSupplierSyncProduct(supplierId, productId, draft);
      setAutoMapResult(null);
      await Promise.all([loadDashboard(), refreshAdminData?.()]);
      setNotice("Привʼязку товару збережено.");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setAction("");
    }
  }

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return (dashboard?.products || []).filter((product) => {
      const queryMatch =
        !normalizedQuery ||
        [product.name, product.brand, product.productUrl]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const filterMatch =
        filter === "all" ||
        (filter === "problems" &&
          (!product.productUrl || product.lastError || !product.syncEnabled)) ||
        (filter === "unavailable" && product.stockStatus === "out_of_stock") ||
        (filter === "override" && product.statusOverride !== "auto");

      return queryMatch && filterMatch;
    });
  }, [dashboard?.products, filter, query]);

  const connected = dashboard?.supplier?.adapter === ADAPTER_ID;
  const automaticSyncEnabled =
    connected && dashboard?.supplier?.enabled && !dashboard?.supplier?.paused;
  const latestRun = dashboard?.runs?.[0] || null;

  return (
    <section className="space-y-6">
      <div className="eg-glass eg-premium-card rounded-[2.5rem] p-6 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-700">
              Автоматизація наявності
            </p>
            <h2 className="mt-2 text-3xl font-black text-stone-950">
              Синхронізація Milk Diller
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-600">
              Автоматичний режим перевіряє каталог кожні 6 годин через короткі
              запуски Railway Cron. Помилка сайту постачальника не змінює
              попередній статус товару.
            </p>
          </div>

          <label className="block min-w-64">
            <span className="mb-2 block text-xs font-black uppercase tracking-wide text-stone-500">
              Постачальник
            </span>
            <select
              value={supplierId}
              onChange={(event) => setSupplierId(event.target.value)}
              className="eg-field w-full rounded-[1.2rem] border border-stone-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-emerald-700"
            >
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error && (
        <div className="rounded-[1.4rem] border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-800">
          {error}
        </div>
      )}

      {notice && (
        <div className="rounded-[1.4rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-900">
          {notice}
        </div>
      )}

      {loading && !dashboard ? (
        <div className="eg-card rounded-[2rem] bg-white p-8 text-center text-sm font-bold text-stone-500">
          Завантаження синхронізації…
        </div>
      ) : dashboard ? (
        <>
          <div className="eg-glass eg-premium-card rounded-[2rem] p-5 lg:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full px-4 py-2 text-xs font-black ring-1 ${getStatusClass(
                    dashboard.supplier.lastStatus
                  )}`}
                >
                  {getStatusLabel(dashboard.supplier.lastStatus)}
                </span>
                <span className="text-sm text-stone-600">
                  Остання перевірка: {formatDateTime(dashboard.supplier.lastRunAt)}
                </span>
                <span className="text-sm text-stone-600">
                  {automaticSyncEnabled
                    ? "Автоматична перевірка: кожні 6 годин"
                    : "Автоматична перевірка вимкнена"}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {!connected ? (
                  <button
                    type="button"
                    disabled={Boolean(action)}
                    onClick={() =>
                      updateSettings(
                        {
                          adapter: ADAPTER_ID,
                          enabled: false,
                          paused: false,
                        },
                        "connect"
                      )
                    }
                    className="eg-button rounded-2xl bg-emerald-900 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                  >
                    Підключити Milk Diller
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={Boolean(action)}
                      onClick={() => runSync({ dryRun: true })}
                      className="eg-button rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-black text-sky-800 disabled:opacity-50"
                    >
                      Перевірити без змін
                    </button>
                    <button
                      type="button"
                      disabled={Boolean(action) || dashboard.supplier.paused}
                      onClick={() => runSync()}
                      className="eg-button rounded-2xl bg-emerald-900 px-4 py-3 text-sm font-black text-white disabled:opacity-50"
                    >
                      Перевірити зараз
                    </button>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={automaticSyncEnabled}
                      disabled={Boolean(action)}
                      onClick={toggleAutomaticSync}
                      className={`eg-button flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-black disabled:opacity-50 ${
                        automaticSyncEnabled
                          ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                          : "border-stone-300 bg-white text-stone-800"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                          automaticSyncEnabled
                            ? "bg-emerald-700"
                            : "bg-stone-300"
                        }`}
                      >
                        <span
                          className={`absolute left-0 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                            automaticSyncEnabled
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </span>
                      <span>
                        {action === "automatic-sync"
                          ? "Змінюємо режим…"
                          : `Автоматична перевірка: ${
                              automaticSyncEnabled ? "увімкнена" : "вимкнена"
                            }`}
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {dashboard.supplier.lastError && (
              <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
                {dashboard.supplier.lastError}
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Товарів" value={dashboard.stats.products} />
            <StatCard label="Привʼязано" value={dashboard.stats.mapped} tone="green" />
            <StatCard label="Доступно" value={dashboard.stats.available} tone="green" />
            <StatCard label="Очікується" value={dashboard.stats.unavailable} tone="amber" />
            <StatCard label="Помилки" value={dashboard.stats.errors} tone="red" />
          </div>

          {connected && (
            <div className="eg-glass eg-premium-card rounded-[2rem] p-5 lg:p-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <h3 className="text-xl font-black text-stone-950">
                    Масова автопривʼязка
                  </h3>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                    Парсер зіставить назви товарів Evergreen із каталогом Milk Diller.
                    Автоматично зберігаються лише однозначні збіги, а вже додані
                    посилання не перезаписуються.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={Boolean(action)}
                    onClick={() => runAutoMap()}
                    className="eg-button rounded-2xl border border-emerald-200 bg-white px-5 py-3 text-sm font-black text-emerald-900 disabled:opacity-50"
                  >
                    {action === "auto-map-preview"
                      ? "Шукаємо збіги…"
                      : "Знайти посилання"}
                  </button>

                  {autoMapResult?.summary?.matched > 0 &&
                    autoMapResult.applied === 0 && (
                      <button
                        type="button"
                        disabled={Boolean(action)}
                        onClick={() => runAutoMap({ apply: true })}
                        className="eg-button rounded-2xl bg-emerald-900 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                      >
                        {action === "auto-map-apply"
                          ? "Зберігаємо…"
                          : `Зберегти ${autoMapResult.summary.matched}`}
                      </button>
                    )}
                </div>
              </div>

              {autoMapResult && (
                <div className="mt-5 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <StatCard
                      label="Вже привʼязано"
                      value={autoMapResult.summary.alreadyMapped}
                    />
                    <StatCard
                      label="Точні збіги"
                      value={autoMapResult.summary.exact}
                      tone="green"
                    />
                    <StatCard
                      label="Нормалізовані"
                      value={autoMapResult.summary.normalized}
                      tone="green"
                    />
                    <StatCard
                      label="Спірні"
                      value={autoMapResult.summary.ambiguous}
                      tone="amber"
                    />
                    <StatCard
                      label="Не знайдено"
                      value={autoMapResult.summary.unmatched}
                      tone="red"
                    />
                  </div>

                  {autoMapResult.applied > 0 && (
                    <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">
                      Збережено привʼязок: {autoMapResult.applied}. Тепер виконайте
                      «Перевірити без змін».
                    </p>
                  )}

                  {autoMapResult.summary.ambiguous === 0 &&
                    autoMapResult.summary.unmatched === 0 && (
                      <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">
                        Усі непривʼязані товари мають однозначні відповідники.
                      </p>
                    )}

                  {autoMapResult.ambiguous?.length > 0 && (
                    <div className="rounded-[1.4rem] border border-amber-200 bg-amber-50 p-4">
                      <p className="font-black text-amber-950">
                        Потрібна ручна перевірка
                      </p>
                      <div className="mt-3 space-y-2 text-sm text-amber-900">
                        {autoMapResult.ambiguous.slice(0, 20).map((item) => (
                          <p key={item.productId}>
                            <span className="font-black">{item.productName}</span>
                            {item.candidates?.[0]?.name
                              ? ` → ${item.candidates[0].name}`
                              : ""}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {autoMapResult.unmatched?.length > 0 && (
                    <div className="rounded-[1.4rem] border border-stone-200 bg-stone-50 p-4">
                      <p className="font-black text-stone-900">Не знайдені автоматично</p>
                      <div className="mt-3 space-y-2 text-sm text-stone-700">
                        {autoMapResult.unmatched.slice(0, 20).map((item) => (
                          <p key={item.productId}>
                            <span className="font-black">{item.productName}</span>
                            {item.suggestions?.[0]?.name
                              ? ` — можливо: ${item.suggestions[0].name}`
                              : ""}
                          </p>
                        ))}
                      </div>
                      {autoMapResult.unmatched.length > 20 && (
                        <p className="mt-3 text-xs font-bold text-stone-500">
                          Показано перші 20 із {autoMapResult.unmatched.length}.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {latestRun?.status === "blocked" && (
            <div className="rounded-[1.6rem] border border-amber-200 bg-amber-50 p-5">
              <p className="font-black text-amber-950">Масові зміни не застосовано</p>
              <p className="mt-2 text-sm leading-6 text-amber-900">
                {latestRun.message}
              </p>
              <button
                type="button"
                disabled={Boolean(action) || dashboard.supplier.paused}
                onClick={() => runSync({ force: true })}
                className="eg-button mt-4 rounded-2xl bg-amber-900 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
              >
                Перевірити повторно та застосувати
              </button>
            </div>
          )}

          <div className="eg-glass eg-premium-card rounded-[2rem] p-5 lg:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h3 className="text-xl font-black text-stone-950">Привʼязка товарів</h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Вставте посилання на відповідну картку Milk Diller та увімкніть
                  автоматичну перевірку.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-[220px_170px]">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Пошук товару"
                  className="eg-field rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-700"
                />
                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  className="eg-field rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-emerald-700"
                >
                  <option value="problems">Потрібна увага</option>
                  <option value="all">Усі товари</option>
                  <option value="unavailable">Очікуються</option>
                  <option value="override">Ручний статус</option>
                </select>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {filteredProducts.length === 0 ? (
                <p className="rounded-2xl bg-stone-50 px-5 py-6 text-center text-sm font-bold text-stone-500">
                  За цим фільтром товарів немає.
                </p>
              ) : (
                filteredProducts.map((product) => {
                  const draft = drafts[product.id] || {};

                  return (
                    <div
                      key={product.id}
                      className="rounded-[1.5rem] border border-stone-200 bg-white/90 p-4"
                    >
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0">
                          <p className="font-black text-stone-950">{product.name}</p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                            <span className="rounded-full bg-stone-100 px-3 py-1 text-stone-700">
                              {getRemoteLabel(product.remoteStatus)}
                            </span>
                            <span
                              className={`rounded-full px-3 py-1 ${
                                product.stockStatus === "out_of_stock"
                                  ? "bg-amber-50 text-amber-900"
                                  : "bg-emerald-50 text-emerald-900"
                              }`}
                            >
                              Evergreen: {product.stockStatus === "out_of_stock" ? "недоступний" : "доступний"}
                            </span>
                            <span className="rounded-full bg-stone-50 px-3 py-1 text-stone-500">
                              {formatDateTime(product.lastCheckedAt)}
                            </span>
                          </div>
                          {product.lastError && (
                            <p className="mt-2 text-sm font-bold text-red-700">
                              {product.lastError}
                            </p>
                          )}
                        </div>

                        {product.productUrl && (
                          <a
                            href={product.productUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="shrink-0 text-sm font-black text-emerald-800 hover:text-emerald-950"
                          >
                            Відкрити у Milk Diller ↗
                          </a>
                        )}
                      </div>

                      <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(280px,1fr)_160px_170px_auto] xl:items-center">
                        <input
                          value={draft.productUrl || ""}
                          onChange={(event) =>
                            updateDraft(product.id, "productUrl", event.target.value)
                          }
                          placeholder="https://milkdiller.ua/..."
                          className="eg-field min-w-0 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-700"
                        />

                        <label className="flex min-h-[46px] items-center gap-2 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm font-black text-stone-800">
                          <input
                            type="checkbox"
                            checked={draft.syncEnabled === true}
                            onChange={(event) =>
                              updateDraft(product.id, "syncEnabled", event.target.checked)
                            }
                            className="h-4 w-4 accent-emerald-900"
                          />
                          Автоматично
                        </label>

                        <select
                          value={draft.statusOverride || "auto"}
                          onChange={(event) =>
                            updateDraft(product.id, "statusOverride", event.target.value)
                          }
                          className="eg-field rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-emerald-700"
                        >
                          <option value="auto">Статус: автоматично</option>
                          <option value="available">Завжди доступний</option>
                          <option value="unavailable">Недоступний</option>
                        </select>

                        <button
                          type="button"
                          disabled={Boolean(action)}
                          onClick={() => saveProduct(product.id)}
                          className="eg-button rounded-2xl bg-stone-900 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                        >
                          Зберегти
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="eg-glass eg-premium-card rounded-[2rem] p-5 lg:p-6">
            <h3 className="text-xl font-black text-stone-950">Останні запуски</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs font-black uppercase tracking-wide text-stone-400">
                  <tr>
                    <th className="px-3 py-3">Час</th>
                    <th className="px-3 py-3">Статус</th>
                    <th className="px-3 py-3">Перевірено</th>
                    <th className="px-3 py-3">Зміни</th>
                    <th className="px-3 py-3">Помилки</th>
                    <th className="px-3 py-3">Результат</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {(dashboard.runs || []).slice(0, 12).map((run) => (
                    <tr key={run.id}>
                      <td className="px-3 py-3 text-stone-600">
                        {formatDateTime(run.startedAt)}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${getStatusClass(
                            run.status
                          )}`}
                        >
                          {getStatusLabel(run.status)}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-bold text-stone-800">
                        {run.checkedCount} / {run.mappedCount}
                      </td>
                      <td className="px-3 py-3 font-bold text-stone-800">
                        {run.changedCount}
                      </td>
                      <td className="px-3 py-3 font-bold text-red-700">
                        {run.errorCount}
                      </td>
                      <td className="max-w-sm px-3 py-3 text-stone-600">
                        {run.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
