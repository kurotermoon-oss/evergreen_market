-- CreateTable
CREATE TABLE "customer_feedback" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER,
    "customerName" TEXT NOT NULL DEFAULT '',
    "customerPhone" TEXT NOT NULL DEFAULT '',
    "customerTelegram" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'other',
    "subject" TEXT NOT NULL DEFAULT '',
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_feedback_customerId_idx" ON "customer_feedback"("customerId");

-- CreateIndex
CREATE INDEX "customer_feedback_status_idx" ON "customer_feedback"("status");

-- CreateIndex
CREATE INDEX "customer_feedback_type_idx" ON "customer_feedback"("type");

-- CreateIndex
CREATE INDEX "customer_feedback_createdAt_idx" ON "customer_feedback"("createdAt");

-- AddForeignKey
ALTER TABLE "customer_feedback" ADD CONSTRAINT "customer_feedback_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
