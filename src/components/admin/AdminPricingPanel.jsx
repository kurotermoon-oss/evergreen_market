import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../api/client.js";
import { calculateMarketPrice, PRICE_MARKETS } from "../../utils/marketPricing.js";

const now = () => new Date().toISOString();
const currency = new Intl.NumberFormat("uk-UA", { style: "currency", currency: "UAH", minimumFractionDigits: 0, maximumFractionDigits: 2 });
const money = value => value == null || value === "" ? "—" : currency.format(Number(value));
const newOffer = market => ({
  id: crypto.randomUUID(), market, url: "", title: "", approvedTitle: "", seller: "",
  price: "", inboundShipping: "", retailShipping: "", batchUnits: 1,
  minimumUnits: 1, minimumOrder: 0, availability: "unknown", purchaseEnabled: false,
  benchmarkEnabled: true, matchConfirmed: false, termsConfirmed: false,
  checkedAt: null, termsCheckedAt: null, lastError: "",
});

function NumberField({ label, value, onChange, min = 0, step = "0.01", hint }) {
  return <label className="eg-admin-label">{label}
    <input className="eg-field" type="number" min={min} step={step} value={value ?? ""} onChange={event => onChange(event.target.value)} />
    {hint && <small>{hint}</small>}
  </label>;
}

function PricingWorkspace({ product, apiClient, startEditProduct, onDirty }) {
  const apiRef = useRef(apiClient);
  apiRef.current = apiClient;
  const [profile, setProfile] = useState(null);
  const [revision, setRevision] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reload, setReload] = useState(0);
  const [expanded, setExpanded] = useState("");
  const [clock, setClock] = useState(Date.now());
  useEffect(() => {
    let current = true;
    setError(""); setProfile(null); onDirty(false);
    apiRef.current.getAdminPriceProfile(product.id).then(data => {
      if (!current) return;
      setProfile(data.profile); setRevision(data.revision); setDirty(false);
    }).catch(error => { if (current) setError(error.message); });
    return () => { current = false; };
  }, [product.id, reload, onDirty]);
  useEffect(() => {
    const interval = window.setInterval(() => setClock(Date.now()), 60000);
    const warn = event => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => { window.clearInterval(interval); window.removeEventListener("beforeunload", warn); };
  }, [dirty]);
  const result = useMemo(() => profile ? calculateMarketPrice(profile, clock) : null, [profile, clock]);
  function change(update) {
    setProfile(current => typeof update === "function" ? update(current) : update);
    setDirty(true); onDirty(true); setNotice(""); setClock(Date.now());
  }
  function changeOffer(id, patch, invalidate = true) {
    change(current => ({ ...current, offers: current.offers.map(offer => {
      if (offer.id !== id) return offer;
      const next = { ...offer, ...patch };
      if (invalidate) next.termsConfirmed = false;
      if (invalidate && ["url", "market", "title", "seller"].some(key => key in patch)) {
        next.matchConfirmed = false; next.approvedTitle = "";
      }
      if (invalidate && ["url", "market", "price"].some(key => key in patch)) next.checkedAt = null;
      return next;
    }) }));
  }
  async function readOffer(offer) {
    setBusy(offer.id); setError("");
    try {
      const { quote } = await apiClient.fetchAdminMarketQuote({ url: offer.url, market: offer.market });
      const sameIdentity = offer.title === quote.title && quote.seller && offer.seller === quote.seller;
      const jump = Number(offer.price) > 0 && Math.abs(quote.price / Number(offer.price) - 1) > .3;
      changeOffer(offer.id, { ...quote, seller: quote.seller || offer.seller, lastError: "", matchConfirmed: Boolean(sameIdentity && offer.matchConfirmed), termsConfirmed: Boolean(sameIdentity && !jump && offer.termsConfirmed) }, false);
      setNotice("Ціну прочитано. Перевірте точний товар, продавця, фасовку та доставку. Збережіть результат.");
    } catch (error) {
      changeOffer(offer.id, { lastError: error.message }, false); setError(error.message);
    } finally { setBusy(""); }
  }
  async function save() {
    if (result.status === "invalid") { setError(result.message); return; }
    setBusy("save"); setError("");
    try {
      const data = await apiClient.saveAdminPriceProfile(product.id, profile, revision);
      setProfile(data.profile); setRevision(data.revision); setDirty(false); onDirty(false);
      setNotice("Розрахунок збережено. Ціна й постачальник у магазині не змінювалися.");
    } catch (error) { setError(error.message); }
    finally { setBusy(""); }
  }
  if (!profile) return <div className="eg-admin-empty" role="status">{error || "Завантажуємо розрахунок…"}{error && <button className="eg-button" onClick={() => setReload(value => value + 1)}>Спробувати ще раз</button>}</div>;

  return <>
    {error && <p className="eg-pricing-alert" role="alert">{error}</p>}
    {notice && <p className="eg-pricing-notice" role="status">{notice}</p>}
    <div className="eg-pricing-workspace">
      <fieldset className="eg-pricing-inputs" disabled={Boolean(busy)}>
        <details className="eg-admin-disclosure">
          <summary>Правила розрахунку · мінімум {money(profile.policy.minProfit)} прибутку</summary>
          <p className="eg-admin-caption">Розрахунок на одну одиницю у фасовці вашої картки. Це внесок у прибуток після вказаних витрат, а не обіцянка чистого прибутку бізнесу.</p>
          <div className="eg-pricing-fields">
            <NumberField label="Мінімальний прибуток, грн" value={profile.policy.minProfit} onChange={minProfit => change(p => ({ ...p, policy: { ...p.policy, minProfit } }))} />
            <NumberField label="Мінімальна націнка, %" value={profile.policy.markupPercent} onChange={markupPercent => change(p => ({ ...p, policy: { ...p.policy, markupPercent } }))} hint="Застосовується більша з двох вимог до прибутку." />
            <NumberField label="Інші витрати на одиницю, грн" value={profile.policy.operatingCost} onChange={operatingCost => change(p => ({ ...p, policy: { ...p.policy, operatingCost } }))} hint="Пакування, обробка, резерв втрат — внесіть свої витрати." />
            <NumberField label="Комісії з продажу, %" value={profile.policy.feePercent} onChange={feePercent => change(p => ({ ...p, policy: { ...p.policy, feePercent } }))} />
            <NumberField label="Дешевше ринку на, грн" min={0.01} value={profile.policy.undercut} onChange={undercut => change(p => ({ ...p, policy: { ...p.policy, undercut } }))} />
            <NumberField label="Покупка для порівняння, одиниць" min={1} step="1" value={profile.policy.customerUnits} onChange={customerUnits => change(p => ({ ...p, policy: { ...p.policy, customerUnits }, offers: p.offers.map(offer => ({ ...offer, termsConfirmed: false })) }))} hint="Змінили кількість — повторно перевірте доставку й умови продавців." />
            <NumberField label="Строк актуальності ціни, год" min={1} step="1" value={profile.policy.quoteMaxHours} onChange={quoteMaxHours => change(p => ({ ...p, policy: { ...p.policy, quoteMaxHours } }))} />
            <NumberField label="Строк перевірки умов, год" min={1} step="1" value={profile.policy.termsMaxHours} onChange={termsMaxHours => change(p => ({ ...p, policy: { ...p.policy, termsMaxHours } }))} />
          </div>
        </details>
        <div className="eg-pricing-source-heading"><h2>Пропозиції продавців</h2><span>{profile.offers.length} / 12</span></div>
        {!profile.offers.length && <p className="eg-admin-empty">Додайте точні картки цього товару на Milk Diller, Rozetka та Prom. Ціни пошукової видачі й схожі товари не є підтвердженням.</p>}
        {profile.offers.map(offer => {
          const row = result.rows.find(row => row.id === offer.id);
          return <details className="eg-pricing-source eg-admin-disclosure" key={offer.id} open={expanded === offer.id}>
            <summary onClick={event => { event.preventDefault(); setExpanded(expanded === offer.id ? "" : offer.id); }}>
              {PRICE_MARKETS[offer.market]} · {offer.seller || "Продавця не вказано"}<span>{money(offer.price)}</span>
            </summary>
            <fieldset disabled={Boolean(busy)}>
              <label className="eg-admin-label">Посилання на конкретну картку
                <input className="eg-field" type="url" value={offer.url} placeholder="https://…" onChange={e => changeOffer(offer.id, { url: e.target.value })} />
              </label>
              <div className="eg-pricing-source-actions"><button type="button" className="eg-button" onClick={() => readOffer(offer)}>{busy === offer.id ? "Перевіряємо…" : "Прочитати ціну"}</button>
                {offer.url && /^https:\/\//.test(offer.url) && <a href={offer.url} target="_blank" rel="noreferrer">Відкрити картку ↗</a>}
              </div>
              <div className="eg-pricing-fields">
                <label className="eg-admin-label">Назва на майданчику<input className="eg-field" value={offer.title} onChange={e => changeOffer(offer.id, { title: e.target.value })} /></label>
                <label className="eg-admin-label">Продавець<input className="eg-field" value={offer.seller} onChange={e => changeOffer(offer.id, { seller: e.target.value })} /></label>
                <NumberField label="Ціна за ту саму фасовку, грн" min={0.01} value={offer.price} onChange={price => changeOffer(offer.id, { price })} />
                <label className="eg-admin-label">Наявність<select className="eg-field" value={offer.availability} onChange={e => changeOffer(offer.id, { availability: e.target.value })}><option value="unknown">Не підтверджена</option><option value="available">В наявності</option><option value="unavailable">Немає в наявності</option></select></label>
                <NumberField label="Розмір нашої закупівлі, одиниць" min={1} step="1" value={offer.batchUnits} onChange={batchUnits => changeOffer(offer.id, { batchUnits })} />
                <NumberField label="Доставка всієї закупівлі, грн" value={offer.inboundShipping} onChange={inboundShipping => changeOffer(offer.id, { inboundShipping })} hint="Порожньо = невідомо. 0 = підтверджено безкоштовно." />
                <NumberField label="Доставка покупцю всієї покупки, грн" value={offer.retailShipping} onChange={retailShipping => changeOffer(offer.id, { retailShipping })} hint={`Для ${profile.policy.customerUnits} од. до Києва, включно з обов'язковими доплатами.`} />
                <NumberField label="Мінімальна сума продавця, грн" value={offer.minimumOrder} onChange={minimumOrder => changeOffer(offer.id, { minimumOrder })} />
                <NumberField label="Мінімальна кількість, одиниць" min={1} step="1" value={offer.minimumUnits} onChange={minimumUnits => changeOffer(offer.id, { minimumUnits })} />
              </div>
              <div className="eg-pricing-checks">
                <label><input type="checkbox" checked={offer.purchaseEnabled} onChange={e => changeOffer(offer.id, { purchaseEnabled: e.target.checked }, false)} />Можемо реально закупити на цих умовах</label>
                <label><input type="checkbox" checked={offer.benchmarkEnabled} onChange={e => changeOffer(offer.id, { benchmarkEnabled: e.target.checked }, false)} />Порівнювати як роздрібну пропозицію</label>
                <label><input type="checkbox" checked={offer.matchConfirmed} onChange={e => changeOffer(offer.id, { matchConfirmed: e.target.checked, approvedTitle: offer.title }, false)} />Звірено бренд, склад, вагу / обʼєм, кількість і варіант товару</label>
                <label><input type="checkbox" checked={offer.termsConfirmed} onChange={e => changeOffer(offer.id, { termsConfirmed: e.target.checked, termsCheckedAt: e.target.checked ? now() : null, checkedAt: e.target.checked ? now() : offer.checkedAt, lastError: e.target.checked ? "" : offer.lastError }, false)} />Щойно перевірено ціну, наявність, продавця, мінімум і доставку; ціна доступна без персональних знижок</label>
              </div>
              <p className="eg-admin-caption">Перевірено: {offer.checkedAt ? new Date(offer.checkedAt).toLocaleString("uk-UA") : "ще ні"}. При зміні продавця або різкому стрибку ціни потрібне повторне підтвердження.</p>
              {offer.lastError && <p className="eg-pricing-alert">{offer.lastError}</p>}
              {row && <p className="eg-admin-caption">Закупівля: {row.landedCost == null ? row.purchaseReasons.join("; ") || "не обрана" : money(row.landedCost) + "/од."}. Роздріб: {row.customerCost == null ? row.benchmarkReasons.join("; ") || "не обраний" : money(row.customerCost) + "/од."}.</p>}
              <button type="button" className="eg-button eg-pricing-remove" onClick={() => change(p => ({ ...p, offers: p.offers.filter(item => item.id !== offer.id) }))}>Прибрати пропозицію</button>
            </fieldset>
          </details>;
        })}
        <div className="eg-pricing-add">{Object.entries(PRICE_MARKETS).map(([market, label]) => <button className="eg-button" type="button" disabled={Boolean(busy) || profile.offers.length >= 12} key={market} onClick={() => { const offer = newOffer(market); if (market === "milkdiller") offer.url = product.supplierProductUrl || ""; change(p => ({ ...p, offers: [...p.offers, offer] })); setExpanded(offer.id); }}>+ {label}</button>)}</div>
        <details className="eg-admin-disclosure"><summary>Історія збережених цін</summary>{!profile.history?.length ? <p className="eg-admin-caption">Історія зʼявиться після збереження змін ціни або наявності.</p> : <ul className="eg-pricing-history">{profile.history.map((item, index) => <li key={index}><span>{new Date(item.at).toLocaleString("uk-UA")} · {PRICE_MARKETS[item.market]} · {item.seller}</span><strong>{money(item.price)}</strong></li>)}</ul>}</details>
      </fieldset>
      <aside className="eg-pricing-result" data-status={result.status} aria-label="Результат розрахунку">
        <p className="eg-admin-caption">Рекомендація на одиницю</p><h2>{money(result.suggestedPrice)}</h2><p role="status">{result.message}</p>
        <dl><div><dt>Повна закупівельна вартість</dt><dd>{money(result.purchase?.landedCost)}</dd></div><div><dt>Нижня межа з прибутком</dt><dd>{money(result.floor)}</dd></div><div><dt>Ринкова межа з доставкою</dt><dd>{money(result.ceiling)}</dd></div><div><dt>Прибуток за нижньою межею</dt><dd>{money(result.profit)}</dd></div></dl>
        {result.purchase && <p>Джерело: <strong>{PRICE_MARKETS[result.purchase.market]} · {result.purchase.seller}</strong></p>}
        {result.missingMarkets.length > 0 && <p className="eg-admin-caption">Бракує придатного порівняння: {result.missingMarkets.map(market => PRICE_MARKETS[market]).join(", ")}.</p>}
        <p className="eg-admin-caption">Це порівняння з доданими продавцями, а не гарантія мінімуму всього ринку. Поточна ціна магазину: {money(product.price)}; записана закупівельна: {money(product.costPrice)}.</p>
        <label className="eg-pricing-monitor"><input type="checkbox" disabled={Boolean(busy)} checked={profile.monitoring} onChange={e => change(p => ({ ...p, monitoring: e.target.checked }))} />Дозволити оновлення цих джерел окремим завданням моніторингу</label>
        <button type="button" className="eg-button eg-pricing-save" disabled={Boolean(busy) || !dirty} onClick={save}>{busy === "save" ? "Зберігаємо…" : "Зберегти розрахунок"}</button>
        <button type="button" className="eg-button" disabled={Boolean(busy)} onClick={() => startEditProduct(product)}>Відкрити редактор товару</button>
        <button type="button" className="eg-button" disabled={Boolean(busy)} onClick={() => { if (!dirty || window.confirm("Відкинути незбережені зміни розрахунку?")) setReload(value => value + 1); }}>Завантажити збережене</button>
        <p className="eg-admin-caption">Зміна джерела потребує перевірки фактичної закупівлі й налаштувань постачальника. Моніторинг не змінює ціни магазину автоматично.</p>
      </aside>
    </div>
  </>;
}

export default function AdminPricingPanel({ products = [], apiClient = api, startEditProduct, onDirtyChange }) {
  const [query, setQuery] = useState("");
  const [productId, setProductId] = useState(products[0]?.id || "");
  const [dirty, setDirty] = useState(false);
  const changeDirty = useCallback(value => { setDirty(value); onDirtyChange?.(value); }, [onDirtyChange]);
  const filtered = products.filter(product => [product.name, product.brand].join(" ").toLowerCase().includes(query.toLowerCase().trim()));
  const product = products.find(item => item.id === productId);
  return <section className="eg-admin-page eg-admin-pricing space-y-6">
    <div className="eg-glass"><h1 className="eg-admin-panel-title">Ціни та закупівлі</h1><p className="eg-admin-caption">Знайдіть джерело з вигідною повною вартістю та перевірте, чи вистачає різниці для прибутку.</p>
      <div className="eg-pricing-product-picker"><label className="eg-admin-label">Знайти товар<input className="eg-field" value={query} onChange={e => setQuery(e.target.value)} placeholder="Назва або бренд" /></label><label className="eg-admin-label">Товар для розрахунку<select className="eg-field" value={productId} onChange={e => { if (!dirty || window.confirm("Відкинути незбережений розрахунок і перейти до іншого товару?")) { setProductId(e.target.value); setDirty(false); } }}>
        {!product && <option value="">Оберіть товар</option>}{product && !filtered.includes(product) && <option value={product.id}>{product.name}</option>}{filtered.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}
      </select></label></div>{!filtered.length && <p className="eg-admin-caption">Товарів за пошуком не знайдено.</p>}
    </div>
    {product ? <PricingWorkspace key={product.id} product={product} apiClient={apiClient} startEditProduct={startEditProduct} onDirty={changeDirty} /> : <p className="eg-admin-empty">Для розрахунку потрібен товар у каталозі.</p>}
  </section>;
}
