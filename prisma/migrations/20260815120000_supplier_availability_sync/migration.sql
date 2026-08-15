-- AlterTable
ALTER TABLE "suppliers"
ADD COLUMN "availabilitySyncAdapter" TEXT NOT NULL DEFAULT '',
ADD COLUMN "availabilitySyncEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "availabilitySyncPaused" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "availabilitySyncLastRunAt" TIMESTAMP(3),
ADD COLUMN "availabilitySyncLastOkAt" TIMESTAMP(3),
ADD COLUMN "availabilitySyncLastStatus" TEXT NOT NULL DEFAULT 'idle',
ADD COLUMN "availabilitySyncLastError" TEXT NOT NULL DEFAULT '',
ADD COLUMN "availabilitySyncLockUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "products"
ADD COLUMN "supplierProductUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN "supplierExternalId" TEXT NOT NULL DEFAULT '',
ADD COLUMN "supplierSyncEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "supplierRemoteStatus" TEXT NOT NULL DEFAULT 'unknown',
ADD COLUMN "supplierStatusOverride" TEXT NOT NULL DEFAULT 'auto',
ADD COLUMN "supplierLastCheckedAt" TIMESTAMP(3),
ADD COLUMN "supplierLastError" TEXT NOT NULL DEFAULT '',
ADD COLUMN "supplierStatusChangedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "supplier_sync_runs" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "trigger" TEXT NOT NULL DEFAULT 'cron',
    "status" TEXT NOT NULL DEFAULT 'running',
    "dryRun" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "mappedCount" INTEGER NOT NULL DEFAULT 0,
    "checkedCount" INTEGER NOT NULL DEFAULT 0,
    "availableCount" INTEGER NOT NULL DEFAULT 0,
    "unavailableCount" INTEGER NOT NULL DEFAULT 0,
    "changedCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "changeRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "message" TEXT NOT NULL DEFAULT '',
    "details" JSONB,

    CONSTRAINT "supplier_sync_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "products_supplierSyncEnabled_idx" ON "products"("supplierSyncEnabled");

-- CreateIndex
CREATE INDEX "supplier_sync_runs_supplierId_startedAt_idx" ON "supplier_sync_runs"("supplierId", "startedAt");

-- CreateIndex
CREATE INDEX "supplier_sync_runs_status_idx" ON "supplier_sync_runs"("status");

-- AddForeignKey
ALTER TABLE "supplier_sync_runs" ADD CONSTRAINT "supplier_sync_runs_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
