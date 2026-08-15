require("dotenv").config();

const {
  crawlCatalog,
} = require("../integrations/suppliers/milkDillerAdapter.cjs");

async function main() {
  const result = await crawlCatalog();
  const products = [...result.products.values()];
  const counts = products.reduce(
    (summary, product) => {
      summary[product.status] = (summary[product.status] || 0) + 1;
      return summary;
    },
    {
      available: 0,
      unavailable: 0,
      unknown: 0,
    }
  );

  if (counts.available + counts.unavailable === 0) {
    throw new Error("Milk Diller availability statuses were not recognized.");
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        pages: result.pageCount,
        advertisedProducts: result.totalCount,
        products: products.length,
        statuses: counts,
        sample: products.slice(0, 3).map((product) => ({
          name: product.name,
          status: product.status,
          url: product.url,
        })),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("Milk Diller live parser check failed:", error.message);
  process.exitCode = 1;
});
