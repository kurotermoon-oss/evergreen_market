const cheerio = require("cheerio");

const MAX_BYTES = 2 * 1024 * 1024;
const error = (message, code = "QUOTE_UNAVAILABLE") => Object.assign(new Error(message), { status: 422, code });
const typeIs = (item, type) => [item?.["@type"]].flat().some(value => String(value).split(/[\/#]/).pop() === type);
const clean = value => String(value || "").replace(/\s+/g, " ").trim().slice(0, 500);

function parseMarketQuote(html, market) {
  const $ = cheerio.load(html);
  const nodes = [];
  const visit = value => {
    if (Array.isArray(value)) return value.forEach(visit);
    if (!value || typeof value !== "object") return;
    nodes.push(value);
    if (value["@graph"]) visit(value["@graph"]);
    if (value.mainEntity) visit(value.mainEntity);
  };
  $('script[type="application/ld+json"]').each((_, element) => {
    try { visit(JSON.parse($(element).html())); } catch { /* Invalid blocks are not evidence. */ }
  });
  const products = nodes.filter(item => typeIs(item, "Product"));
  if (products.length !== 1) throw error("Не вдалося однозначно визначити товар. Внесіть перевірену ціну вручну.", "AMBIGUOUS_PRODUCT");
  const product = products[0];
  const offers = [product.offers].flat().filter(Boolean);
  if (offers.length !== 1 || typeIs(offers[0], "AggregateOffer") || typeIs(offers[0], "AggregateOffers")) {
    throw error("На сторінці кілька пропозицій або лише мінімальна рекламна ціна. Оберіть конкретного продавця й внесіть ціну вручну.", "AMBIGUOUS_OFFER");
  }
  const offer = offers[0];
  if (String(offer.priceCurrency).toUpperCase() !== "UAH") throw error("Валюта ціни не підтверджена як гривня.", "WRONG_CURRENCY");
  const price = Number(String(offer.price ?? "").replace(/\s/g, "").replace(",", "."));
  if (!Number.isFinite(price) || price <= 0 || price > 1000000) throw error("Не вдалося прочитати поточну ціну.");
  if (offer.priceValidUntil && Date.parse(offer.priceValidUntil) < Date.now()) throw error("Термін дії ціни на сторінці минув.", "EXPIRED_QUOTE");
  const availability = String(offer.availability || "").split(/[\/#]/).pop();
  const seller = clean(offer.seller?.name || product.seller?.name || (market === "milkdiller" ? "Milk Diller" : ""));
  const title = clean(product.name);
  if (!title) throw error("Сторінка не містить назви товару.");
  return { title, seller, price, availability: availability === "InStock" ? "available" : ["OutOfStock", "SoldOut", "Discontinued"].includes(availability) ? "unavailable" : "unknown" };
}

async function fetchMarketQuote({ url, market }, fetchImpl = fetch) {
  const { priceSourceUrl } = await import("../../src/utils/marketPricing.js");
  let current = priceSourceUrl(url, market);
  const signal = AbortSignal.timeout(12000);
  for (let redirects = 0; redirects <= 3; redirects++) {
    const response = await fetchImpl(current, { redirect: "manual", signal, headers: {
      "User-Agent": "EvergreenMarket-PriceResearch/1.0", Accept: "text/html,application/xhtml+xml",
    } });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      await response.body?.cancel();
      const location = response.headers.get("location");
      if (!location) throw error("Некоректне перенаправлення джерела.");
      current = priceSourceUrl(new URL(location, current).toString(), market);
      continue;
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw error(`Джерело повернуло HTTP ${response.status}. Автоматичне читання недоступне; перевірте ціну вручну.`, "SOURCE_HTTP_ERROR");
    }
    if (!/text\/html|application\/xhtml\+xml/i.test(response.headers.get("content-type") || "")) {
      await response.body?.cancel();
      throw error("Джерело не повернуло HTML-сторінку.");
    }
    const reader = response.body.getReader();
    const chunks = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > MAX_BYTES) throw error("Сторінка перевищує допустимий розмір.");
        chunks.push(Buffer.from(value));
      }
    } finally { await reader.cancel(); }
    return { ...parseMarketQuote(Buffer.concat(chunks).toString("utf8"), market), checkedAt: new Date().toISOString(), url: current };
  }
  throw error("Забагато перенаправлень джерела.");
}

function mergeMarketQuote(offer, quote) {
  const sameIdentity = offer.title === quote.title && Boolean(quote.seller) && offer.seller === quote.seller;
  const priceJump = Number(offer.price) > 0 && Math.abs(quote.price / Number(offer.price) - 1) > 0.3;
  return {
    ...offer, ...quote, seller: quote.seller || offer.seller, lastError: "",
    matchConfirmed: sameIdentity && offer.matchConfirmed,
    termsConfirmed: sameIdentity && !priceJump && offer.termsConfirmed,
  };
}

module.exports = { fetchMarketQuote, parseMarketQuote, mergeMarketQuote };
