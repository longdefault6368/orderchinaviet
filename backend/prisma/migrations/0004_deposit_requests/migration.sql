CREATE TABLE "DepositRequest" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "requestCode" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "amountVnd" INTEGER NOT NULL,
  "method" TEXT NOT NULL,
  "proofImage" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "reviewNote" TEXT,
  "reviewedBy" TEXT,
  "reviewedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "DepositRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "DepositRequest_requestCode_key" ON "DepositRequest"("requestCode");
