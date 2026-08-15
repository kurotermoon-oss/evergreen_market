const assert = require("node:assert/strict");

const {
  normalizeCanonicalProductName,
  buildProductAutoMapping,
} = require("../services/supplierProductAutoMapping.cjs");

assert.equal(
  normalizeCanonicalProductName("Сироп Абрикос 0,7 л (0,9 кг)"),
  normalizeCanonicalProductName("Сироп  Абрикос 0.7л — (0.9кг)")
);
assert.equal(
  normalizeCanonicalProductName("Сироп Імбир 0,7 л скло Red Black"),
  normalizeCanonicalProductName("Сироп Імбир 0,7 л скло ТМ Red Black")
);
assert.equal(
  normalizeCanonicalProductName("Фруктове пюре (концентрат чаю) Обліпиха 1250 г"),
  normalizeCanonicalProductName(
    "Фруктове пюре для лимонадів та чаю Обліпиха 1250 г"
  )
);

const result = buildProductAutoMapping(
  [
    {
      id: "local-exact",
      name: "Ганчірка для підлоги 50*60см",
      supplierProductUrl: "",
      supplierSyncEnabled: false,
    },
    {
      id: "local-normalized",
      name: "Сироп Абрикос 0,7 л (0,9 кг)",
      supplierProductUrl: "",
      supplierSyncEnabled: false,
    },
    {
      id: "local-mapped",
      name: "Вже привʼязаний товар",
      supplierProductUrl: "https://milkdiller.ua/already-mapped",
      supplierSyncEnabled: true,
    },
    {
      id: "local-unmatched",
      name: "Товар, якого немає",
      supplierProductUrl: "",
      supplierSyncEnabled: false,
    },
  ],
  [
    {
      name: "Ганчірка для підлоги 50*60см",
      url: "https://milkdiller.ua/cloth",
      externalId: "1",
      status: "available",
    },
    {
      name: "Сироп Абрикос 0.7л (0.9 кг)",
      url: "https://milkdiller.ua/syrup",
      externalId: "2",
      status: "unavailable",
    },
  ]
);

assert.deepEqual(result.summary, {
  products: 4,
  alreadyMapped: 1,
  matched: 2,
  exact: 1,
  normalized: 1,
  ambiguous: 0,
  unmatched: 1,
});
assert.equal(result.matches[0].remote.url, "https://milkdiller.ua/cloth");
assert.equal(result.matches[1].remote.url, "https://milkdiller.ua/syrup");
assert.equal(result.unmatched[0].productId, "local-unmatched");

const duplicateResult = buildProductAutoMapping(
  [
    { id: "one", name: "Однакова назва", supplierProductUrl: "" },
    { id: "two", name: "Однакова назва", supplierProductUrl: "" },
  ],
  [
    {
      name: "Однакова назва",
      url: "https://milkdiller.ua/duplicate",
      status: "available",
    },
  ]
);

assert.equal(duplicateResult.summary.matched, 0);
assert.equal(duplicateResult.summary.ambiguous, 2);

console.log("Supplier product auto-mapping tests passed.");
