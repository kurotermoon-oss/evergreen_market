const assert = require("node:assert/strict");

const adapter = require("../integrations/suppliers/milkDillerAdapter.cjs");

const catalogHtml = `
  <html>
    <body>
      <p>61 товарів</p>
      <div class="product-card" data-product-id="101">
        <a href="/moloko/test-milk">Тестове молоко</a>
        <div class="product-card__name"><a href="/moloko/test-milk">Тестове молоко</a></div>
        <div class="product-card__status instock"><span>В наявності</span></div>
      </div>
      <div class="product-card" data-product-id="102">
        <div class="product-card__name">
          <a href="https://www.milkdiller.ua/chaj/test-tea?tracking=1">Тестовий чай</a>
        </div>
        <div class="product-card__status outstock"><span>Очікується надходження</span></div>
      </div>
      <nav>
        <a href="/vsi-tovari?page=2">2</a>
        <a href="/vsi-tovari?page=3">3</a>
      </nav>
    </body>
  </html>
`;

const parsedCatalog = adapter.parseCatalogPage(
  catalogHtml,
  "https://milkdiller.ua/vsi-tovari"
);

assert.equal(parsedCatalog.maxPage, 3);
assert.equal(parsedCatalog.totalCount, 61);
assert.equal(parsedCatalog.products.length, 2);
assert.deepEqual(
  parsedCatalog.products.map((product) => ({
    url: product.url,
    status: product.status,
    externalId: product.externalId,
  })),
  [
    {
      url: "https://milkdiller.ua/moloko/test-milk",
      status: "available",
      externalId: "101",
    },
    {
      url: "https://milkdiller.ua/chaj/test-tea",
      status: "unavailable",
      externalId: "102",
    },
  ]
);

const productHtml = `
  <html>
    <head>
      <link rel="canonical" href="https://milkdiller.ua/chaj/test-tea" />
    </head>
    <body>
      <main>
        <h1>Тестовий чай</h1>
        <div class="head-info">
          <div class="status outstock"><span>Очікується надходження</span></div>
        </div>
        <input name="product_id" value="102" />
      </main>
    </body>
  </html>
`;
const parsedProduct = adapter.parseProductPage(
  productHtml,
  "https://milkdiller.ua/chaj/test-tea"
);

assert.equal(parsedProduct.status, "unavailable");
assert.equal(parsedProduct.externalId, "102");
assert.equal(parsedProduct.url, "https://milkdiller.ua/chaj/test-tea");

assert.equal(adapter.normalizeProductUrl("https://example.com/product"), "");
assert.equal(adapter.normalizeProductUrl("javascript:alert(1)"), "");

console.log("Milk Diller parser tests passed.");
