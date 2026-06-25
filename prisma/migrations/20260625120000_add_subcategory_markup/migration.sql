ALTER TABLE "categories" ADD COLUMN "markupPercent" DOUBLE PRECISION;

ALTER TABLE "subcategories" ADD COLUMN "markupPercent" DOUBLE PRECISION;

ALTER TABLE "products" ADD COLUMN "priceMode" TEXT NOT NULL DEFAULT 'auto';
