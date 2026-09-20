-- Internal café purchasing only. No foreign keys or writes to customer/storefront data.
CREATE TABLE "supply_workspace" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "data" JSONB NOT NULL,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE "supply_notifications" (
  "event_key" TEXT NOT NULL PRIMARY KEY,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sent_at" TIMESTAMPTZ,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "next_attempt_at" TIMESTAMPTZ,
  "last_error" TEXT
);
CREATE INDEX "supply_notifications_created_at_idx" ON "supply_notifications"("created_at");
CREATE TABLE "supply_worker_status" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "last_tick_at" TIMESTAMPTZ,
  "last_sent_at" TIMESTAMPTZ,
  "last_error" TEXT
);
