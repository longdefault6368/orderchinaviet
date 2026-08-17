ALTER TABLE "ExchangeTransaction" ADD COLUMN "reviewedBy" TEXT;
ALTER TABLE "ExchangeTransaction" ADD COLUMN "reviewedAt" DATETIME;

CREATE TABLE "Order" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderCode" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "currency" TEXT NOT NULL DEFAULT 'CNY',
  "exchangeRate" DECIMAL NOT NULL,
  "subtotalVnd" INTEGER NOT NULL,
  "serviceFeeVnd" INTEGER NOT NULL DEFAULT 0,
  "totalVnd" INTEGER NOT NULL,
  "depositRequiredVnd" INTEGER NOT NULL,
  "depositPaidVnd" INTEGER NOT NULL DEFAULT 0,
  "notes" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Order_orderCode_key" ON "Order"("orderCode");

CREATE TABLE "OrderItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  "productUrl" TEXT,
  "imageUrl" TEXT,
  "attributes" TEXT,
  "quantity" INTEGER NOT NULL,
  "unitPriceCny" DECIMAL NOT NULL,
  "totalCny" DECIMAL NOT NULL,
  CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
