import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Bell, Check, CheckCheck, ChevronRight, ClipboardCheck, Copy, Leaf, Package, Plus, RefreshCw, Settings, ShoppingBasket, Store, Truck, X } from "lucide-react";
import Modal from "../components/Modal.jsx";
import { loadTelegram, initializeTelegram } from "../telegram/platform.js";
import { createSupplyClient } from "./client.js";
import { CheckForm, Field, ProductForm, SupplierForm, TaskForm, dayNames } from "./forms.jsx";
import "./supply.css";

const dateLabel = value => value ? new Date(value.length === 10 ? `${value}T12:00:00Z` : value).toLocaleDateString("uk-UA", { timeZone: "Europe/Kyiv", day: "numeric", month: "short" }) : "уточнюється";
const timeLabel = value => value ? new Date(value).toLocaleTimeString("uk-UA", { timeZone: "Europe/Kyiv", hour: "2-digit", minute: "2-digit" }) : "";
const screens = { today: "Сьогодні", checks: "Перевірки", purchases: "Закупки", suppliers: "Постачальники", products: "Позиції", history: "Історія", settings: "Налаштування" };
const statuses = [{ id: "enough", label: "Вистачає", symbol: "✓" }, { id: "low", label: "Замовити", symbol: "↓" }, { id: "critical", label: "Критично", symbol: "!" }];
function SupplierTiming({ supplier }) {
  if (!supplier?.confirmed) return <p className="supply-warning-text">Графік ще не підтверджений</p>;
  const window = supplier.schedule?.nextOrder;
  return <p className="supply-muted">{window ? `Замовити ${dateLabel(window.date)} до ${window.time}` : "Уточніть наступне вікно замовлення"}{supplier.schedule?.delivery && <> · Поставка від {dateLabel(supplier.schedule.delivery)}</>}</p>;
}
function SettingsForm({ data, busy, onSave }) {
  const [form, setForm] = useState(data.settings);
  const health = data.deliveryHealth || {};
  const stale = !health.last_tick_at || Date.now() - new Date(health.last_tick_at) > 10 * 60000;
  return <><section className="supply-card"><div className="supply-section-heading"><h2>Спільні нагадування</h2><Bell size={20} /></div>
    <p className="supply-muted">Повідомлення в робочий Telegram-акаунт. Без призначення відповідальних. Час — Київ.</p>
    <form onSubmit={e => { e.preventDefault(); onSave(form); }}>
      <label className="supply-checkbox"><input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} />Увімкнути нагадування</label>
      <div className="supply-form-grid"><Field label="Перша перевірка"><input type="time" required value={form.morning} onChange={e => setForm({ ...form, morning: e.target.value })} /></Field><Field label="Повторна перевірка"><input type="time" required value={form.evening} onChange={e => setForm({ ...form, evening: e.target.value })} /></Field></div>
      <p className="supply-muted">Друга перевірка нагадує тільки про невирішені питання. Час перед дедлайном задається в картці кожного постачальника.</p>
      <button className="supply-primary" disabled={busy}>Зберегти налаштування</button>
    </form></section><section className="supply-card"><h2>Зв’язок із Telegram</h2><dl className="supply-meta"><dt>Бот</dt><dd>{health.configured ? "Підключений" : "Очікує підключення"}</dd><dt>Перевірка нагадувань</dt><dd>{stale ? "Немає свіжого сигналу" : `${dateLabel(health.last_tick_at)}, ${timeLabel(health.last_tick_at)}`}</dd><dt>Останнє повідомлення</dt><dd>{health.last_sent_at ? `${dateLabel(health.last_sent_at)}, ${timeLabel(health.last_sent_at)}` : "Ще не надсилали"}</dd></dl>{health.last_error && <p className="supply-alert">{health.last_error}</p>}{!health.configured && <p className="supply-muted">Для підключення потрібні налаштування бота на сервері. До цього чеклисти й закупки працюють, повідомлення не надсилаються.</p>}</section></>;
}
export default function SupplyApp({ previewClient }) {
  const client = useMemo(() => previewClient || createSupplyClient(), [previewClient]);
  const [data, setData] = useState(null), [accessError, setAccessError] = useState("");
  const [screen, setScreen] = useState(() => { const value = new URLSearchParams(location.search).get("screen"); return Object.hasOwn(screens, value) ? value : "today"; });
  const [kind, setKind] = useState("stock"), [modal, setModal] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState(""), [query, setQuery] = useState("");
  const pending = useRef(false), editing = useRef(false), telegram = useRef(null), requestNumber = useRef(0);
  editing.current = !!modal || screen === "settings";
  const handleError = useCallback(e => {
    if ([401, 403].includes(e.status)) { client.clear(); setData(null); setModal(null); setAccessError(e.message); }
    else setError(e.message);
  }, [client]);
  const refresh = useCallback(async () => {
    if (pending.current) return;
    const request = ++requestNumber.current;
    try { const result = await client.read(); if (request === requestNumber.current) { setData(result); setError(""); } }
    catch (e) { if (request === requestNumber.current) handleError(e); }
  }, [client, handleError]);
  useEffect(() => {
    let live = true, cleanup;
    document.title = "Закупівлі · Evergreen";
    const meta = document.createElement("meta"); meta.name = "robots"; meta.content = "noindex,nofollow"; document.head.append(meta);
    (async () => {
      try {
        const app = previewClient ? null : await loadTelegram();
        if (!live) return;
        telegram.current = app; cleanup = initializeTelegram(app);
        if (!previewClient && !app?.initData) throw new Error("Відкрийте закупівлі кнопкою в Telegram-боті з робочого акаунта.");
        await client.session(app?.initData);
        if (live) await refresh();
      } catch (e) { if (live) setAccessError(e.message); }
    })();
    return () => { live = false; cleanup?.(); meta.remove(); requestNumber.current++; };
  }, [client, previewClient, refresh]);
  useEffect(() => {
    if (!data) return;
    const update = () => { if (document.visibilityState === "visible" && !editing.current) refresh(); };
    const interval = setInterval(update, 30000);
    document.addEventListener("visibilitychange", update); window.addEventListener("online", update); telegram.current?.onEvent("activated", update);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", update); window.removeEventListener("online", update); telegram.current?.offEvent("activated", update); };
  }, [!!data, refresh]);
  useEffect(() => {
    const app = telegram.current;
    const back = () => { if (pending.current) return; modal ? setModal(null) : setScreen("today"); };
    if (modal || screen !== "today") app?.BackButton?.show(); else app?.BackButton?.hide();
    app?.BackButton?.onClick(back); return () => { app?.BackButton?.offClick(back); app?.BackButton?.hide(); };
  }, [screen, modal, !!data]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); setQuery(""); }, [screen]);
  async function run(type, values = {}, message = "Збережено") {
    if (pending.current || !data) return false;
    pending.current = true; setBusy(true); setError(""); setNotice(""); requestNumber.current++;
    try { const result = await client.command({ type, data: values }, data.revision); setData(result); setNotice(message); return true; }
    catch (e) {
      handleError(e);
      if (e.status === 409) { try { setData(await client.read()); } catch {} }
      return false;
    } finally { pending.current = false; setBusy(false); }
  }
  const close = () => { if (!pending.current) { setModal(null); setError(""); } };
  async function saveModal(type, values) { if (await run(type, values)) setModal(null); }
  async function copy(task) {
    const value = task.items.map(i => `${i.name}${i.quantity ? ` — ${i.quantity} ${i.unit}` : ""}${i.comment ? ` (${i.comment})` : ""}`).join("\n");
    try { await navigator.clipboard.writeText(value); setNotice("Список скопійовано"); }
    catch { setModal({ type: "copy", title: "Список для замовлення", value }); }
  }
  if (!data) return <div className="supply-app supply-access"><Leaf size={38} /><p className="supply-eyebrow">EVERGREEN · ЗАКУПІВЛІ</p><h1>{accessError ? "Вхід через Telegram" : "Відкриваємо робочий простір…"}</h1><p role={accessError ? "alert" : "status"}>{accessError || error || "Завантажуємо спільні чеклисти та закупки."}</p>{error && !accessError && <button className="supply-secondary" onClick={refresh}>Повторити</button>}</div>;
  const supplierById = Object.fromEntries(data.suppliers.map(s => [s.id, s]));
  const pendingTasks = data.tasks.filter(t => t.status === "pending");
  const incoming = data.tasks.filter(t => t.status === "ordered");
  const checklist = data.checklists.find(c => c.kind === kind);
  const missing = data.checklists.reduce((sum, c) => sum + c.remaining, 0);
  const unconfirmed = data.suppliers.filter(s => s.active && !s.confirmed).length;
  function openTask(task, action) { setModal({ type: "task", title: task.supplierName, task, action, suggestedDate: supplierById[task.supplierId]?.schedule?.delivery }); }
  function taskCard(task) {
    const supplier = supplierById[task.supplierId], ordered = task.status === "ordered", late = ordered && task.expectedDelivery < data.date;
    return <article className="supply-card supply-purchase" key={task.id}>
      <div className="supply-section-heading"><h2>{task.supplierName}</h2><span className={`supply-badge ${late ? "critical" : ordered ? "enough" : "low"}`}>{late ? "Поставка затримується" : ordered ? "Очікуємо" : "До замовлення"}</span></div>
      {ordered ? <p className="supply-muted">Очікуємо {dateLabel(task.expectedDelivery)} · замовили {dateLabel(task.orderedAt)}</p> : <><SupplierTiming supplier={supplier} />{task.orderBy && task.orderBy < data.now && <p className="supply-warning-text">Попередній термін минув. Потреба залишається відкритою.</p>}</>}
      <ul className="supply-order-items">{task.items.map(item => <li key={item.productId}><span>{item.name}{item.comment && <small>{item.comment}</small>}</span><strong>{item.quantity ? `${item.quantity} ${item.unit}` : "уточнити кількість"}</strong></li>)}</ul>
      {task.comment && <p className="supply-muted">{task.comment}</p>}
      {!ordered && <div className="supply-row-actions"><button className="supply-link" onClick={() => copy(task)}><Copy size={16} />Скопіювати список</button>{supplier?.url && <a className="supply-link" href={supplier.url} target="_blank" rel="noopener noreferrer">До постачальника<ArrowUpRight size={16} /></a>}</div>}
      <div className="supply-task-actions"><button className="supply-primary" disabled={busy} onClick={() => openTask(task, ordered ? "received" : "ordered")}>{ordered ? <CheckCheck size={18} /> : <Check size={18} />}{ordered ? "Отримали" : "Замовили"}</button><button className="supply-secondary" disabled={busy} onClick={() => openTask(task, ordered ? "reschedule" : "skip")}>{ordered ? "Змінилася дата" : "Не замовляємо"}</button></div>
    </article>;
  }
  return <div className="supply-app">
    {previewClient && <div className="supply-demo">Демонстрація · вигадані залишки · повідомлення не надсилаються</div>}
    <header className="supply-header"><a href="#" onClick={e => { e.preventDefault(); setScreen("today"); }} aria-label="Закупівлі — сьогодні"><Leaf size={27} /><span>Evergreen<small>закупівлі кав’ярні</small></span></a><div><button className="supply-icon" aria-label="Оновити дані" disabled={busy || !!modal} onClick={refresh}><RefreshCw size={19} /></button><button className="supply-icon" aria-label="Налаштування закупівель" aria-pressed={screen === "settings"} onClick={() => setScreen("settings")}><Settings size={21} /></button></div></header>
    <main className="supply-main">
      <nav className="supply-tabs" aria-label="Закупівлі"><button aria-current={screen === "today" ? "page" : undefined} onClick={() => setScreen("today")}><Store size={18} />Сьогодні</button><button aria-current={screen === "checks" ? "page" : undefined} onClick={() => setScreen("checks")}><ClipboardCheck size={18} />Перевірки</button><button aria-current={screen === "purchases" ? "page" : undefined} onClick={() => setScreen("purchases")}><ShoppingBasket size={18} />Закупки{pendingTasks.length > 0 && <span>{pendingTasks.length}</span>}</button></nav>
      {!modal && error && <div className="supply-alert" role="alert">{error}<button className="supply-link" onClick={refresh}>Оновити список</button></div>}
      {notice && <p className="supply-notice" role="status"><Check size={17} />{notice}</p>}
      {!data.suppliers.length ? <section className="supply-card supply-empty"><Package size={38} /><h1>Почнімо з ваших закупівель</h1><p>Додайте постачальників і позиції. Можна почати з редагованої чернетки: Milk Diller, Maya Cake, Panini Grill та OMOM. Перевірте також постачальника та одиницю замовлення кожної позиції.</p><button className="supply-primary" disabled={busy} onClick={() => run("seed", {}, "Чернетки додано. Перевірте постачальників і графіки.")}>Додати початковий список</button><button className="supply-link" onClick={() => setModal({ type: "supplier", title: "Новий постачальник" })}>Створити постачальника самостійно</button></section> : <>
      {screen === "today" && <>
        <section className="supply-hero"><p className="supply-eyebrow">{new Date(`${data.date}T12:00Z`).toLocaleDateString("uk-UA", { weekday: "long", day: "numeric", month: "long" })} · КИЇВ</p><h1>Сьогодні у кав’ярні</h1><p>Перевірити запаси. Замовити вчасно.</p><div className="supply-stats"><span><strong>{missing}</strong>перевірити</span><span><strong>{pendingTasks.length}</strong>замовити</span><span><strong>{incoming.length}</strong>очікуємо</span></div></section>
        {unconfirmed > 0 && <button className="supply-callout" onClick={() => setScreen("suppliers")}><Bell size={20} /><span>Підтвердіть графіки постачальників<small>Неперевірених: {unconfirmed}. До підтвердження нагадування про їхні дедлайни вимкнені.</small></span><ChevronRight size={18} /></button>}
        <div className="supply-section-heading"><h2>Коротка перевірка</h2><span className="supply-muted">Спільна для обох</span></div>
        <div className="supply-check-grid">{data.checklists.map(c => <button className="supply-check-card" key={c.kind} onClick={() => { setKind(c.kind); setScreen("checks"); }}><span className="supply-check-icon">{c.kind === "stock" ? <Package size={23} /> : <Store size={23} />}</span><strong>{c.kind === "stock" ? "Склад" : "Вітрина"}</strong><span>{c.completedAt ? `Перевірено о ${timeLabel(c.completedAt)}` : c.products.length ? `${c.products.length - c.remaining} із ${c.products.length} перевірено` : "На сьогодні позицій немає"}</span><ChevronRight size={20} /></button>)}</div>
        <div className="supply-section-heading"><h2>Потрібно замовити</h2><button className="supply-link" onClick={() => setScreen("purchases")}>Усі закупки<ArrowUpRight size={16} /></button></div>
        {pendingTasks.length ? pendingTasks.slice(0, 3).map(t => <button key={t.id} className="supply-supplier-row" onClick={() => setScreen("purchases")}><span><strong>{t.supplierName}</strong><small>{t.items.length} поз. · {supplierById[t.supplierId]?.schedule?.nextOrder ? `до ${supplierById[t.supplierId].schedule.nextOrder.time}, ${dateLabel(supplierById[t.supplierId].schedule.nextOrder.date)}` : "уточніть графік"}</small></span><ChevronRight size={20} /></button>) : <div className="supply-quiet"><CheckCheck size={22} /><p>{missing ? "Закупки з’являться після перевірки запасів." : "Нових закупок поки немає."}</p></div>}
        {incoming.length > 0 && <button className="supply-callout" onClick={() => setScreen("purchases")}><Truck size={21} /><span>Очікуємо поставки: {incoming.length}<small>Відмітьте отримання, коли товари приїдуть.</small></span><ChevronRight size={18} /></button>}
      </>}
      {screen === "checks" && <><div className="supply-page-heading"><p className="supply-eyebrow">{dateLabel(data.date)}</p><h1>Перевірка запасів</h1><p>«Вистачає» — до наступної можливої поставки. Неперевірені позиції залишаються відкритими.</p></div><div className="supply-segment">{data.checklists.map(c => <button key={c.kind} aria-pressed={kind === c.kind} onClick={() => setKind(c.kind)}>{c.kind === "stock" ? "Склад" : "Вітрина"} · {c.products.length - c.remaining}/{c.products.length}</button>)}</div>
        {!checklist.products.length && <div className="supply-quiet">На сьогодні перевірок немає. Частоту можна змінити в списку позицій.</div>}
        {checklist.products.map(product => <article className="supply-card supply-check-item" key={product.id}><div className="supply-section-heading"><h2>{product.name}</h2><small>{product.result ? "Перевірено" : "Не перевірено"}</small></div><p className="supply-muted">{supplierById[product.supplierId]?.name}</p>{product.threshold && <p className="supply-threshold">{product.threshold}</p>}{product.incoming && <p className="supply-incoming"><Truck size={15} />Уже замовлено · очікуємо {dateLabel(product.incoming)}</p>}<div className="supply-status-buttons">{statuses.map(status => <button key={status.id} className={`supply-status-${status.id}`} aria-pressed={product.result?.status === status.id} disabled={busy} onClick={() => run("check", { productId: product.id, date: data.date, status: status.id, quantity: product.result?.quantity ?? "", comment: product.result?.comment || "" }, `${product.name}: ${status.label.toLowerCase()}`)}><span aria-hidden="true">{status.symbol}</span>{status.label}</button>)}</div><button className="supply-link" disabled={busy} onClick={() => setModal({ type: "check", title: product.name, product })}>{product.result?.quantity ? `До замовлення: ${product.result.quantity} ${product.unit}` : "Кількість і примітка"}<ChevronRight size={16} /></button>{product.result?.comment && <p className="supply-muted">{product.result.comment}</p>}</article>)}
        {checklist.products.length > 0 && <button className="supply-primary supply-wide" disabled={busy || checklist.remaining > 0 || !!checklist.completedAt} onClick={() => run("complete_check", { kind, date: data.date }, "Перевірку завершено для всього робочого акаунта")}>{checklist.completedAt ? "Перевірку завершено" : checklist.remaining ? `Залишилось перевірити: ${checklist.remaining}` : "Завершити перевірку"}</button>}
      </>}
      {screen === "purchases" && <><div className="supply-page-heading"><h1>Закупки та поставки</h1><p>Оформлення відмічаємо після замовлення у постачальника.</p></div>{pendingTasks.length > 0 && <h2 className="supply-group-title">До замовлення · {pendingTasks.length}</h2>}{pendingTasks.map(taskCard)}{incoming.length > 0 && <h2 className="supply-group-title">Очікуємо поставку · {incoming.length}</h2>}{incoming.map(taskCard)}{!pendingTasks.length && !incoming.length && <div className="supply-quiet"><ShoppingBasket size={27} /><p>Відкритих закупок немає. Перевірте запаси, щоб сформувати список.</p><button className="supply-secondary" onClick={() => setScreen("checks")}>До перевірок</button></div>}</>}
      {["settings", "suppliers", "products", "history"].includes(screen) && <><div className="supply-page-heading"><h1>{screens[screen]}</h1></div><nav className="supply-management-nav" aria-label="Керування закупівлями">{["settings", "suppliers", "products", "history"].map(key => <button key={key} aria-current={screen === key ? "page" : undefined} onClick={() => setScreen(key)}>{screens[key]}</button>)}</nav></>}
      {screen === "settings" && <SettingsForm key={data.revision} data={data} busy={busy} onSave={values => run("settings", values)} />}
      {screen === "suppliers" && <><button className="supply-secondary supply-wide" onClick={() => setModal({ type: "supplier", title: "Новий постачальник" })}><Plus size={18} />Додати постачальника</button>{data.suppliers.map(s => <button className="supply-supplier-row" key={s.id} onClick={() => setModal({ type: "supplier", title: s.name, initial: s })}><span><strong>{s.name}{!s.active && " · вимкнений"}</strong><SupplierTiming supplier={s} /></span><ChevronRight size={20} /></button>)}</>}
      {screen === "products" && <><button className="supply-secondary supply-wide" onClick={() => setModal({ type: "product", title: "Нова позиція" })}><Plus size={18} />Додати позицію</button><Field label="Пошук позиції"><input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Молоко, кава, стакани…" /></Field>{data.products.filter(p => p.name.toLocaleLowerCase("uk").includes(query.toLocaleLowerCase("uk"))).map(p => <button className="supply-supplier-row" key={p.id} onClick={() => setModal({ type: "product", title: p.name, initial: p })}><span><strong>{p.name}{!p.active && " · вимкнено"}</strong><small>{supplierById[p.supplierId]?.name} · {p.days.length === 7 ? "щодня" : p.days.map(d => dayNames[d]).join(", ")}</small></span><ChevronRight size={20} /></button>)}</>}
      {screen === "history" && <><p className="supply-muted">Останні 100 дій спільного робочого акаунта.</p><ol className="supply-history">{data.history.map(h => <li key={h.id}><span>{h.label}</span><time dateTime={h.at}>{dateLabel(h.at)} · {timeLabel(h.at)}</time></li>)}</ol>{!data.history.length && <div className="supply-quiet">Історія з’явиться після першої перевірки.</div>}</>}
      </>}
      <footer className="supply-footer"><span>Спільний робочий простір</span><button onClick={() => setScreen("history")}>Історія дій</button></footer>
    </main>
    {modal && <Modal label={modal.title} className="supply-dialog" maxWidth={640} onClose={close}><div className="supply-modal-heading"><h2>{modal.title}</h2><button className="supply-icon" aria-label="Закрити вікно" disabled={busy} onClick={close}><X size={21} /></button></div><div className="supply-modal-body">{error && <p className="supply-alert" role="alert">{error}</p>}
      {modal.type === "supplier" && <SupplierForm initial={modal.initial} busy={busy} onSave={values => saveModal("supplier", values)} />}
      {modal.type === "product" && <ProductForm initial={modal.initial} suppliers={data.suppliers} busy={busy} onSave={values => saveModal("product", values)} />}
      {modal.type === "check" && <CheckForm product={modal.product} busy={busy} onSave={values => saveModal("check", { ...values, date: data.date })} />}
      {modal.type === "task" && <TaskForm {...modal} today={data.date} busy={busy} onSave={values => saveModal("task", values)} />}
      {modal.type === "copy" && <Field label="Виділіть і скопіюйте список"><textarea readOnly rows={8} value={modal.value} onFocus={e => e.target.select()} /></Field>}
    </div></Modal>}
  </div>;
}
