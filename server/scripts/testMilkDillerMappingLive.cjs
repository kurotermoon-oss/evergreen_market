require("dotenv").config();

const prisma = require("../database/prisma.cjs");
const adapter = require("../integrations/suppliers/milkDillerAdapter.cjs");
const {
  buildProductAutoMapping,
} = require("../services/supplierProductAutoMapping.cjs");

async function main() {
  if (process.env.USE_POSTGRES !== "true") {
    throw new Error("Live mapping check requires USE_POSTGRES=true.");
  }

  const supplier = await prisma.supplier.findFirst({
    where: {
      availabilitySyncAdapter: adapter.ADAPTER_ID,
    },
    orderBy: {
      name: "asc",
    },
  });

  if (!supplier) {
    throw new Error("No supplier with the Milk Diller adapter was found.");
  }

  const [products, catalogResult] = await Promise.all([
    prisma.product.findMany({
      where: {
        supplierId: supplier.id,
        fulfillmentType: "supplier_order",
      },
      select: {
        id: true,
        name: true,
        supplierProductUrl: true,
        supplierSyncEnabled: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
    adapter.crawlCatalog(),
  ]);
  const mapping = buildProductAutoMapping(
    products,
    [...catalogResult.products.values()]
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        supplier: supplier.name,
        catalog: {
          pages: catalogResult.pageCount,
          advertisedProducts: catalogResult.totalCount,
          parsedProducts: catalogResult.products.size,
        },
        summary: mapping.summary,
        ambiguous: mapping.ambiguous.slice(0, 20),
        unmatched: mapping.unmatched.slice(0, 30),
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error("Milk Diller live mapping check failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
