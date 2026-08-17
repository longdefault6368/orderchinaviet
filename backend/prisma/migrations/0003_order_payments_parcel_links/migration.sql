ALTER TABLE "ExchangeTransaction" ADD COLUMN "heldAmountVnd" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "paidVnd" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "remainingVnd" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "deletedAt" DATETIME;
UPDATE "Order" SET "paidVnd" = "depositPaidVnd", "remainingVnd" = MAX(0, "totalVnd" - "depositPaidVnd");
ALTER TABLE "Parcel" ADD COLUMN "orderId" TEXT REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Parcel_orderId_idx" ON "Parcel"("orderId");

CREATE TABLE "Payment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "paymentCode" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "method" TEXT NOT NULL DEFAULT 'WALLET',
  "provider" TEXT,
  "providerRef" TEXT,
  "amountVnd" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "rawPayload" TEXT,
  "completedAt" DATETIME,
  "refundedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Payment_paymentCode_key" ON "Payment"("paymentCode");
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");
CREATE UNIQUE INDEX "Payment_providerRef_key" ON "Payment"("providerRef");
