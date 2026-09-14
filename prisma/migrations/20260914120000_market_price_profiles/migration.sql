CREATE TABLE "market_price_profiles" (
  "productId" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "market_price_profiles_pkey" PRIMARY KEY ("productId"),
  CONSTRAINT "market_price_profiles_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
