import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, Leaf, RefreshCw, Search, ShieldCheck, X } from "lucide-react";
import Modal from "../components/Modal.jsx";
import { getAvailableOrderActions, getOrderStatusLabel, getPaymentStatusLabel } from "../components/admin/orderUiConfig.js";
import { formatUAH } from "../utils/formatUAH.js";
import { getStockLabel } from "../utils/products.js";
import { getProductPath } from "../utils/routes.js";
import { loadTelegram, initializeTelegram } from "./platform.js";
import { createAdminClient } from "./adminClient.js";
import "./admin.css";

const date = value => value ? new Date(value).toLocaleString("uk-UA", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "—";
function safeLink(value) {
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : ""; } catch { return ""; }
}
function Status({ status }) { return <span className={`mini-status mini-status-${status}`}>{getOrderStatusLabel(status)}</span>; }

export default function AdminApp({ previewClient }) {
  const client = useMemo(() => previewClient || createAdminClient(), [previewClient]);
  const [session, setSession] = useState(null);
  const [accessError, setAccessError] = useState("");
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [nextOffset, setNextOffset] = useState(null);
  const [scope, setScope] = useState("active");
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(() => new URLSearchParams(location.search).get("order") || "");
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [reason, setReason] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const telegram = useRef(null);
  const requestVersion = useRef(0);
  const actionPending = useRef(false);
  const heading = useRef(null);

  const handleError = useCallback(err => {
    if ([401, 403].includes(err.status)) {
      client.clear(); setSession(null); setOrders([]); setDetail(null); setConfirm(null);
      setAccessError(err.message); requestVersion.current++;
    } else setError(err.message);
  }, [client]);

  useEffect(() => {
    let live = true;
    let cleanup;
    document.title = "Замовлення · Evergreen";
    const meta = document.createElement("meta"); meta.name = "robots"; meta.content = "noindex,nofollow"; document.head.append(meta);
    (async () => {
      try {
        const app = previewClient ? null : await loadTelegram();
        if (!live) return;
        telegram.current = app;
        cleanup = initializeTelegram(app);
        if (!previewClient && !app?.initData) throw new Error("Відкрийте панель через кнопку меню адміністративного Telegram-бота.");
        const result = await client.session(app?.initData);
        if (live) setSession(result.user);
      } catch (err) { if (live) setAccessError(err.message); }
    })();
    return () => { live = false; cleanup?.(); meta.remove(); };
  }, [client, previewClient]);

  const refresh = useCallback(async (offset = 0) => {
    const version = ++requestVersion.current;
    setLoading(true);
    try {
      if (selected) {
        const result = await client.detail(selected);
        if (version !== requestVersion.current) return;
        setDetail(result.order);
      } else {
        const result = await client.list({ scope, status, q: query, offset });
        if (version !== requestVersion.current) return;
        setOrders(previous => offset ? [...previous, ...result.orders] : result.orders);
        setTotal(result.total); setActiveCount(result.activeCount); setNextOffset(result.nextOffset);
      }
      setError(""); setLastUpdated(new Date());
    } catch (err) { if (version === requestVersion.current) handleError(err); }
    finally { if (version === requestVersion.current) setLoading(false); }
  }, [client, selected, scope, status, query, handleError]);

  useEffect(() => {
    if (!session) return;
    setDetail(null); setOrders([]); setError(""); setNotice(""); setLoading(true);
    const timer = setTimeout(() => refresh(), 200);
    return () => { clearTimeout(timer); requestVersion.current++; };
  }, [refresh, session]);
  useEffect(() => {
    if (!session) return;
    const update = () => { if (!document.hidden && !actionPending.current && !confirm) refresh(); };
    const timer = setInterval(update, 60000);
    document.addEventListener("visibilitychange", update);
    telegram.current?.onEvent("activated", update);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", update); telegram.current?.offEvent("activated", update); };
  }, [session, refresh, confirm]);
  const goBack = useCallback(() => {
    if (actionPending.current) return;
    if (confirm) { setConfirm(null); return; }
    setSelected(""); const url = new URL(location.href); url.searchParams.delete("order"); history.replaceState(null, "", url);
  }, [confirm]);
  useEffect(() => {
    const back = telegram.current?.BackButton;
    if (selected) back?.show(); else back?.hide();
    back?.onClick(goBack);
    return () => { back?.offClick(goBack); back?.hide(); };
  }, [selected, session, goBack]);
  useEffect(() => { heading.current?.focus(); }, [selected]);

  function openOrder(id) {
    setSelected(id); const url = new URL(location.href); url.searchParams.set("order", id); history.replaceState(null, "", url);
    window.scrollTo({ top: 0 });
  }
  async function submitAction() {
    if (actionPending.current || !confirm || (confirm.action === "cancel" && !reason.trim())) return;
    actionPending.current = true; setBusy(true); setError(""); requestVersion.current++;
    try {
      const result = await client.action(selected, { action: confirm.action, expectedStatus: confirm.status, reason });
      setConfirm(null); setReason("");
      setNotice(result.customerTelegramResult && result.customerTelegramResult.ok !== true
        ? "Статус збережено. Сповіщення покупцю не доставлено — зв’яжіться з ним за контактами в замовленні."
        : "Статус замовлення збережено.");
      await refresh();
    } catch (err) {
      setConfirm(null);
      // A lost response may follow a successful save. Always reload before retrying.
      if (![401, 403].includes(err.status)) await refresh();
      handleError(err);
    } finally { actionPending.current = false; setBusy(false); }
  }

  return <div className="eg-mini">
    <header className="mini-header"><a href="/" aria-label="Evergreen — до магазину"><Leaf size={24} /><span>evergreen<small>Керування замовленнями</small></span></a><ShieldCheck size={21} aria-label="Доступ для команди" /></header>
    <main className="mini-main">
      {previewClient && <p className="mini-demo">Демонстрація · зміни лише в цій вкладці</p>}
      {!session ? <section className="mini-empty"><ShieldCheck size={32} /><h1>Робочий простір Evergreen</h1><p role={accessError ? "alert" : "status"}>{accessError || "Перевіряємо доступ…"}</p><a href="/admin">Відкрити веб-адмінку <ArrowUpRight size={16} /></a></section> : <>
        <div className="mini-toolbar">{selected ? <button disabled={busy} onClick={goBack}><ArrowLeft size={18} /> До замовлень</button> : <span>{session.name}</span>}<button disabled={loading || busy} onClick={() => refresh()} aria-label="Оновити замовлення"><RefreshCw size={18} /> Оновити</button></div>
        <div className="mini-title"><div><p className="mini-eyebrow">EVERGREEN · КОМАНДА</p><h1 ref={heading} tabIndex={-1}>{selected ? `Замовлення${detail ? ` #${detail.orderNumber}` : ""}` : "Замовлення"}</h1></div>{!selected && <span className="mini-count">{activeCount}<small>активних</small></span>}</div>
        <p className="mini-updated" role="status">{loading ? "Оновлюємо…" : lastUpdated ? `Оновлено о ${lastUpdated.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}` : ""}</p>
        {error && <div className="mini-error" role="alert">{error}</div>}
        {notice && <div className="mini-notice" role="status"><Check size={18} />{notice}</div>}
        {!selected ? <>
          <div className="mini-tabs" aria-label="Список замовлень">{[["active", "Активні"], ["history", "Історія"]].map(([id, label]) => <button key={id} aria-pressed={scope === id} onClick={() => { setScope(id); setStatus("all"); }}>{label}</button>)}</div>
          <div className="mini-filters"><label className="mini-search"><Search size={19} /><input aria-label="Пошук замовлень" placeholder="Номер, ім’я або контакт" value={query} onChange={event => setQuery(event.target.value)} /></label><label><span className="sr-only">Статус</span><select aria-label="Статус замовлення" value={status} onChange={event => setStatus(event.target.value)}><option value="all">Усі статуси</option>{(scope === "active" ? ["new", "confirmed", "preparing", "ready"] : ["completed", "cancelled"]).map(value => <option key={value} value={value}>{getOrderStatusLabel(value)}</option>)}</select></label></div>
          <div className="mini-list">{orders.map(order => <button className="mini-order-row" key={order.id} onClick={() => openOrder(order.id)}><span className="mini-row-top"><strong>#{order.orderNumber}</strong><Status status={order.status} /></span><span className="mini-row-name">{order.customerName}</span><span className="mini-row-bottom"><span>{date(order.createdAt)} · {order.itemCount} поз.</span><strong>{formatUAH(order.total)}</strong></span></button>)}</div>
          {!loading && !error && !orders.length && <div className="mini-empty"><Check size={28} /><h2>{query || status !== "all" ? "Нічого не знайдено" : scope === "active" ? "Усі замовлення опрацьовані" : "Історія поки порожня"}</h2><p>{query || status !== "all" ? "Спробуйте інший запит або статус." : "Нові замовлення з’являться тут."}</p></div>}
          {nextOffset !== null && <button className="mini-more" disabled={loading} onClick={() => refresh(nextOffset)}>Показати ще · {orders.length} із {total}</button>}
        </> : detail && <>
          <section className="mini-card"><div className="mini-card-heading"><Status status={detail.status} /><span>{date(detail.createdAt)}</span></div><h2>{detail.customerName}</h2><div className="mini-contacts">{detail.customerPhone && <a href={`tel:${detail.customerPhone.replace(/[^+\d]/g, "")}`}>{detail.customerPhone}</a>}{detail.customerTelegram && (/^@?[a-zA-Z0-9_]{5,32}$/.test(detail.customerTelegram) ? <a href={`https://t.me/${detail.customerTelegram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer">{detail.customerTelegram} <ArrowUpRight size={15} /></a> : <span>{detail.customerTelegram}</span>)}</div><div className="mini-total"><span>Самовивіз · {getPaymentStatusLabel(detail.paymentStatus)}</span><strong>{formatUAH(detail.total)}</strong></div>{detail.comment && <p className="mini-comment"><strong>Коментар покупця</strong>{detail.comment}</p>}{detail.cancelReason && <p className="mini-comment"><strong>Причина скасування</strong>{detail.cancelReason}</p>}</section>
          <section className="mini-card"><h2>Склад замовлення <small>· {detail.items.length} поз.</small></h2>{detail.items.map((item, index) => <article className="mini-item" key={`${item.productId}-${index}`}><h3>{item.name}</h3><div className="mini-item-price"><span>{item.quantity} × {formatUAH(item.price)}{item.packageInfo ? ` · ${item.packageInfo}` : ""}</span><strong>{formatUAH(item.total)}</strong></div>{item.product ? <><div className="mini-product-state"><span>{getStockLabel(item.product)}</span>{item.product.active === false && <span>Приховано з вітрини</span>}{item.product.fulfillmentType !== "supplier_order" && item.product.stockQuantity != null && <span>Залишок: {item.product.stockQuantity} шт.</span>}{item.product.supplier && <span>{item.product.supplier.name}</span>}</div><div className="mini-item-links">{item.product.active !== false && item.product.stockStatus !== "out_of_stock" && <a href={getProductPath(item.product.id)} target="_blank" rel="noopener noreferrer">Товар на сайті <ArrowUpRight size={15} /></a>}{safeLink(item.product.supplierProductUrl) && <a href={safeLink(item.product.supplierProductUrl)} target="_blank" rel="noopener noreferrer">У постачальника <ArrowUpRight size={15} /></a>}</div></> : <p className="mini-muted">Товар видалено. Склад і ціна замовлення збережені.</p>}</article>)}</section>
          {detail.statusHistory?.length > 0 && <details className="mini-card mini-history"><summary>Історія дій</summary>{detail.statusHistory.map((event, index) => <p key={index}><time>{date(event.at)}</time>{event.label}</p>)}</details>}
          <div className="mini-actions">{getAvailableOrderActions(detail).map(action => <button key={action.id} disabled={busy || loading || Boolean(error)} className={action.action === "cancel" ? "mini-danger" : "mini-primary"} onClick={() => { setReason(""); setConfirm({ ...action, status: detail.status }); }}>{action.action === "complete" ? "Замовлення видано" : action.action === "mark_ready" ? "Готово до видачі" : action.label}</button>)}</div>
        </>}
      </>}
    </main>
    {confirm && <Modal className="eg-mini mini-dialog" label="Підтвердження дії" maxWidth={440} onClose={() => { if (!busy) setConfirm(null); }}><div className="mini-dialog-body"><button className="mini-close" disabled={busy} aria-label="Закрити" onClick={() => setConfirm(null)}><X size={21} /></button><p className="mini-eyebrow">ЗАМОВЛЕННЯ #{detail?.orderNumber}</p><h2>{confirm.action === "cancel" ? "Скасувати замовлення?" : confirm.action === "complete" ? "Замовлення вже видано?" : confirm.action === "mark_ready" ? "Позначити готовим до видачі?" : `${confirm.label} замовлення?`}</h2><p>{confirm.action === "mark_ready" ? "Збережемо статус і спробуємо сповістити покупця через підключений Telegram." : confirm.action === "cancel" ? "Обліковий залишок буде відновлено. Вкажіть причину для історії." : "Зміна одразу з’явиться в адмінці та історії замовлення."}</p>{confirm.action === "cancel" && <label>Причина скасування<textarea autoFocus maxLength={500} value={reason} onChange={event => setReason(event.target.value)} /></label>}<div className="mini-dialog-actions"><button disabled={busy} onClick={() => setConfirm(null)}>Назад</button><button className={confirm.action === "cancel" ? "mini-danger" : "mini-primary"} disabled={busy || (confirm.action === "cancel" && !reason.trim())} onClick={submitAction}>{busy ? "Зберігаємо…" : "Підтвердити"}</button></div></div></Modal>}
  </div>;
}
