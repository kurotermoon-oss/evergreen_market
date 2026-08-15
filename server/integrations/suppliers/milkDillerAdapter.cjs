const cheerio = require("cheerio");

const ADAPTER_ID = "milkdiller_html";
const BASE_URL = "https://milkdiller.ua/";
const CATALOG_URL = "https://milkdiller.ua/vsi-tovari";
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRIES = 2;
const DEFAULT_CONCURRENCY = 3;
const DEFAULT_MAX_PAGES = 40;

function toPositiveInt(value, fallback) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function normalizeProductUrl(value) {
  const cleanValue = String(value || "").trim();

  if (!cleanValue) return "";

  try {
    const url = new URL(cleanValue, BASE_URL);

    if (!/(^|\.)milkdiller\.ua$/i.test(url.hostname)) return "";

    url.protocol = "https:";
    url.hostname = "milkdiller.ua";
    url.hash = "";
    url.search = "";
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";

    return url.toString();
  } catch {
    return "";
  }
}

function normalizeStatusText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function parseAvailability(statusElement) {
  if (!statusElement?.length) return "unknown";

  const classTokens = String(statusElement.attr("class") || "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const text = normalizeStatusText(statusElement.text());

  if (
    classTokens.includes("outstock") ||
    classTokens.includes("out-of-stock") ||
    text.includes("очікується надходження") ||
    text.includes("немає в наявності") ||
    text.includes("немає у наявності") ||
    text.includes("відсутній") ||
    text.includes("відсутня")
  ) {
    return "unavailable";
  }

  if (
    classTokens.includes("instock") ||
    classTokens.includes("in-stock") ||
    text.includes("в наявності") ||
    text.includes("у наявності")
  ) {
    return "available";
  }

  return "unknown";
}

function parseMaxPage($) {
  let maxPage = 1;

  $("a[href*='page=']").each((_, element) => {
    const href = $(element).attr("href");

    try {
      const page = Number(new URL(href, CATALOG_URL).searchParams.get("page"));

      if (Number.isInteger(page) && page > maxPage) {
        maxPage = page;
      }
    } catch {
      // Ignore malformed pagination links from third-party markup.
    }
  });

  return maxPage;
}

function parseTotalCount($) {
  const bodyText = String($("body").text() || "").replace(/\s+/g, " ");
  const match = bodyText.match(/(\d[\d\s]*)\s+товар(?:ів|и)?/i);

  if (!match) return 0;

  const count = Number(match[1].replace(/\s+/g, ""));

  return Number.isInteger(count) && count > 0 ? count : 0;
}

function parseCatalogPage(html, pageUrl = CATALOG_URL) {
  const $ = cheerio.load(String(html || ""));
  const products = [];

  $(".product-card").each((_, card) => {
    const $card = $(card);
    const statusElement = $card.find(".product-card__status").first();
    const href =
      $card.find(".product-card__name a[href]").first().attr("href") ||
      $card.find("a[href]").first().attr("href") ||
      "";
    const url = normalizeProductUrl(href);

    if (!url) return;

    products.push({
      url,
      externalId: String($card.attr("data-product-id") || "").trim(),
      name: String(
        $card.find(".product-card__name").first().text() ||
          $card.find("a[href]").last().text() ||
          ""
      )
        .replace(/\s+/g, " ")
        .trim(),
      status: parseAvailability(statusElement),
      statusText: String(statusElement.text() || "").replace(/\s+/g, " ").trim(),
      sourceUrl: pageUrl,
    });
  });

  return {
    products,
    maxPage: parseMaxPage($),
    totalCount: parseTotalCount($),
  };
}

function parseProductPage(html, pageUrl = "") {
  const $ = cheerio.load(String(html || ""));
  const statusElement = $(".head-info .status").first();
  const canonical = $("link[rel='canonical']").attr("href") || pageUrl;

  return {
    url: normalizeProductUrl(canonical),
    externalId: String($("input[name='product_id']").first().attr("value") || "").trim(),
    name: String($("h1").first().text() || "").replace(/\s+/g, " ").trim(),
    status: parseAvailability(statusElement),
    statusText: String(statusElement.text() || "").replace(/\s+/g, " ").trim(),
    sourceUrl: pageUrl,
  };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchHtml(
  url,
  {
    fetchImpl = global.fetch,
    timeoutMs = toPositiveInt(process.env.MILKDILLER_FETCH_TIMEOUT_MS, DEFAULT_TIMEOUT_MS),
    retries = toPositiveInt(process.env.MILKDILLER_FETCH_RETRIES, DEFAULT_RETRIES),
  } = {}
) {
  if (typeof fetchImpl !== "function") {
    throw new Error("HTTP fetch is not available in this Node.js runtime.");
  }

  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(url, {
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "uk-UA,uk;q=0.9",
          "User-Agent":
            process.env.SUPPLIER_SYNC_USER_AGENT ||
            "EvergreenMarket-AvailabilitySync/1.0 (+https://evergreen-market.com.ua)",
        },
        redirect: "follow",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Milk Diller returned HTTP ${response.status} for ${url}`);
      }

      return await response.text();
    } catch (error) {
      lastError = error;

      if (attempt < retries) {
        await wait(400 * (attempt + 1));
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError || new Error(`Failed to fetch ${url}`);
}

function buildCatalogPageUrl(page) {
  if (page <= 1) return CATALOG_URL;

  const url = new URL(CATALOG_URL);
  url.searchParams.set("page", String(page));

  return url.toString();
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  const workerCount = Math.min(Math.max(1, limit), items.length || 1);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return results;
}

async function crawlCatalog(options = {}) {
  const fetchOptions = {
    fetchImpl: options.fetchImpl,
    timeoutMs: options.timeoutMs,
    retries: options.retries,
  };
  const firstHtml = await fetchHtml(CATALOG_URL, fetchOptions);
  const firstPage = parseCatalogPage(firstHtml, CATALOG_URL);
  const maxPages = toPositiveInt(process.env.MILKDILLER_MAX_PAGES, DEFAULT_MAX_PAGES);
  const estimatedPageCount =
    firstPage.totalCount > 0 && firstPage.products.length > 0
      ? Math.ceil(firstPage.totalCount / firstPage.products.length)
      : 1;
  const pageCount = Math.min(
    Math.max(firstPage.maxPage, estimatedPageCount),
    maxPages
  );
  const remainingPages = Array.from(
    { length: Math.max(0, pageCount - 1) },
    (_, index) => index + 2
  );
  const concurrency = toPositiveInt(
    process.env.MILKDILLER_FETCH_CONCURRENCY,
    DEFAULT_CONCURRENCY
  );
  const parsedPages = await mapWithConcurrency(remainingPages, concurrency, async (page) => {
    const pageUrl = buildCatalogPageUrl(page);
    const html = await fetchHtml(pageUrl, fetchOptions);

    return parseCatalogPage(html, pageUrl);
  });
  const products = new Map();

  [firstPage, ...parsedPages].forEach((page) => {
    page.products.forEach((product) => {
      if (!products.has(product.url) || product.status !== "unknown") {
        products.set(product.url, product);
      }
    });
  });

  if (products.size === 0) {
    throw new Error("Milk Diller catalog markup did not contain any product cards.");
  }

  if (
    firstPage.totalCount > 0 &&
    products.size < Math.floor(firstPage.totalCount * 0.8)
  ) {
    throw new Error(
      `Milk Diller catalog coverage is incomplete: parsed ${products.size} of ${firstPage.totalCount} advertised products.`
    );
  }

  return {
    products,
    pageCount,
    totalCount: firstPage.totalCount,
  };
}

async function fetchProductAvailability(url, options = {}) {
  const normalizedUrl = normalizeProductUrl(url);

  if (!normalizedUrl) {
    throw new Error("Invalid Milk Diller product URL.");
  }

  const html = await fetchHtml(normalizedUrl, options);

  return parseProductPage(html, normalizedUrl);
}

module.exports = {
  ADAPTER_ID,
  BASE_URL,
  CATALOG_URL,
  normalizeProductUrl,
  parseAvailability,
  parseCatalogPage,
  parseProductPage,
  fetchHtml,
  crawlCatalog,
  fetchProductAvailability,
  mapWithConcurrency,
};
