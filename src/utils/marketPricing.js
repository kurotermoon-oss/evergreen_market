export const PRICE_MARKETS = { milkdiller: "Milk Diller", rozetka: "Rozetka", prom: "Prom" };
export const DEFAULT_PRICE_POLICY = {
  minProfit: 20, markupPercent: 0, operatingCost: 0, feePercent: 0,
  undercut: 1, customerUnits: 1, quoteMaxHours: 24, termsMaxHours: 168,
};
export const emptyPriceProfile = () => ({ policy: { ...DEFAULT_PRICE_POLICY }, offers: [], monitoring: false });

export function priceSourceUrl(value, market) {
  let url;
  try { url = new URL(String(value || "")); }
  catch { throw new Error("Додайте повне HTTPS-посилання на конкретний товар."); }
  const host = url.hostname.replace(/^www\./, "");
  const allowed = { milkdiller: "milkdiller.ua", rozetka: "rozetka.com.ua", prom: "prom.ua" };
  if (url.protocol !== "https:" || url.username || url.password || url.port || host !== allowed[market]) {
    throw new Error("Вкажіть HTTPS-посилання на картку саме цього майданчика.");
  }
  if (url.pathname === "/") throw new Error("Потрібне посилання на товар, а не головну сторінку.");
  url.hash = "";
  return url.toString();
}

function number(value, label, { min = 0, max = 1000000, optional = false, integer = false } = {}) {
  if (value === "" || value == null) {
    if (optional) return null;
    throw new Error(`Заповніть поле «${label}».`);
  }
  const parsed = Number(String(value).replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < min || parsed > max || (integer && !Number.isInteger(parsed))) {
    throw new Error(`Перевірте поле «${label}».`);
  }
  return parsed;
}

function timestamp(value, now) {
  if (!value) return null;
  const time = Date.parse(value);
  if (!Number.isFinite(time) || time > now + 60000) throw new Error("Некоректна дата перевірки ціни.");
  return new Date(time).toISOString();
}

export function normalizePriceProfile(input, now = Date.now()) {
  if (!input || !Array.isArray(input.offers) || input.offers.length > 12) throw new Error("Дозволено до 12 пропозицій на товар.");
  const policy = {};
  for (const [key, fallback] of Object.entries(DEFAULT_PRICE_POLICY)) {
    policy[key] = number(input.policy?.[key] ?? fallback, key, {
      min: ["customerUnits", "quoteMaxHours", "termsMaxHours"].includes(key) ? 1 : 0,
      max: key === "feePercent" ? 50 : key.includes("Hours") ? 720 : 100000,
      integer: ["customerUnits", "quoteMaxHours", "termsMaxHours"].includes(key),
    });
  }
  if (policy.undercut < 0.01) throw new Error("Різниця з ринком має бути не меншою за 0,01 грн.");
  const ids = new Set();
  const text = value => String(value || "").trim().slice(0, 500);
  const offers = input.offers.map(offer => {
    const id = text(offer.id);
    if (!id || ids.has(id) || !PRICE_MARKETS[offer.market]) throw new Error("Некоректна пропозиція.");
    ids.add(id);
    const result = {
      id, market: offer.market, url: priceSourceUrl(offer.url, offer.market),
      seller: text(offer.seller), title: text(offer.title), approvedTitle: text(offer.approvedTitle),
      price: number(offer.price, "Ціна", { min: 0.01, optional: true }),
      inboundShipping: number(offer.inboundShipping, "Доставка закупівлі", { optional: true }),
      retailShipping: number(offer.retailShipping, "Доставка покупцю", { optional: true }),
      batchUnits: number(offer.batchUnits ?? 1, "Одиниць у закупівлі", { min: 1, integer: true }),
      minimumUnits: number(offer.minimumUnits ?? 1, "Мінімум одиниць", { min: 1, integer: true }),
      minimumOrder: number(offer.minimumOrder ?? 0, "Мінімальна сума"),
      availability: ["available", "unavailable", "unknown"].includes(offer.availability) ? offer.availability : "unknown",
      purchaseEnabled: offer.purchaseEnabled === true, benchmarkEnabled: offer.benchmarkEnabled !== false,
      matchConfirmed: offer.matchConfirmed === true, termsConfirmed: offer.termsConfirmed === true,
      checkedAt: timestamp(offer.checkedAt, now), termsCheckedAt: timestamp(offer.termsCheckedAt, now),
      lastError: text(offer.lastError),
    };
    return result;
  });
  return { policy, offers, monitoring: input.monitoring === true };
}

const roundMoney = value => Math.round((value + Number.EPSILON) * 100) / 100;
const fresh = (value, hours, now) => value && now - Date.parse(value) >= -60000 && now - Date.parse(value) <= hours * 3600000;

export function calculateMarketPrice(input, now = Date.now()) {
  let profile;
  try { profile = normalizePriceProfile(input, now); }
  catch (error) { return { status: "invalid", message: error.message, rows: [], missingMarkets: Object.keys(PRICE_MARKETS) }; }
  const { policy, offers } = profile;
  const rows = offers.map(offer => {
    const reasons = [];
    if (!offer.matchConfirmed || !offer.title || offer.title !== offer.approvedTitle) reasons.push("Не підтверджено точний товар і фасовку");
    if (!offer.seller || !offer.termsConfirmed || !fresh(offer.termsCheckedAt, policy.termsMaxHours, now)) reasons.push("Перевірте продавця й умови");
    if (offer.price == null || !fresh(offer.checkedAt, policy.quoteMaxHours, now)) reasons.push("Немає свіжої ціни");
    if (offer.availability !== "available") reasons.push("Наявність не підтверджена");
    if (offer.lastError) reasons.push("Остання перевірка не вдалася");
    const purchaseReasons = [...reasons];
    const benchmarkReasons = [...reasons];
    if (offer.inboundShipping == null) purchaseReasons.push("Невідома доставка закупівлі");
    if (offer.retailShipping == null) benchmarkReasons.push("Невідома доставка покупцю");
    if (offer.batchUnits < offer.minimumUnits || offer.batchUnits * offer.price < offer.minimumOrder) purchaseReasons.push("Закупівля не досягає мінімуму");
    if (policy.customerUnits < offer.minimumUnits || policy.customerUnits * offer.price < offer.minimumOrder) benchmarkReasons.push("Покупка не досягає мінімуму продавця");
    const landedCost = offer.purchaseEnabled && !purchaseReasons.length ? roundMoney(offer.price + offer.inboundShipping / offer.batchUnits + policy.operatingCost) : null;
    const customerCost = offer.benchmarkEnabled && !benchmarkReasons.length ? roundMoney(offer.price + offer.retailShipping / policy.customerUnits) : null;
    return { id: offer.id, market: offer.market, seller: offer.seller, landedCost, customerCost, purchaseReasons, benchmarkReasons };
  });
  const purchases = rows.filter(row => row.landedCost != null).sort((a, b) => a.landedCost - b.landedCost);
  const benchmarks = rows.filter(row => row.customerCost != null).sort((a, b) => a.customerCost - b.customerCost);
  const missingMarkets = Object.keys(PRICE_MARKETS).filter(market => !benchmarks.some(row => row.market === market));
  const base = { rows, missingMarkets, purchase: purchases[0] || null, benchmark: benchmarks[0] || null };
  if (!purchases.length) return { ...base, status: "no_source", message: "Підтвердьте хоча б одне доступне джерело закупівлі з доставкою." };
  const cost = purchases[0].landedCost;
  const requiredProfit = Math.max(policy.minProfit, cost * policy.markupPercent / 100);
  // Public product prices are whole UAH: round the floor up and the market ceiling down.
  const floor = Math.ceil((cost + requiredProfit) / (1 - policy.feePercent / 100) - 1e-9);
  const ceiling = benchmarks.length ? Math.floor(benchmarks[0].customerCost - policy.undercut + 1e-9) : null;
  const profit = roundMoney(floor * (1 - policy.feePercent / 100) - cost);
  const result = { ...base, floor, ceiling, profit, suggestedPrice: null };
  if (ceiling == null) return { ...result, status: "no_market", message: "Собівартість відома, але немає надійної роздрібної ціни для порівняння." };
  if (floor > ceiling) return { ...result, status: "uncompetitive", gap: floor - ceiling, message: "Потрібне дешевше джерело або перегляд асортименту. Продаж нижче ринку не покриває задану прибутковість." };
  return { ...result, suggestedPrice: floor, status: missingMarkets.length ? "partial" : "competitive", message: missingMarkets.length ? "Ціна вигідніша за перевірені пропозиції. Даних з усіх трьох майданчиків ще немає." : "Ціна нижча за перевірені пропозиції трьох майданчиків у заданому сценарії доставки." };
}
