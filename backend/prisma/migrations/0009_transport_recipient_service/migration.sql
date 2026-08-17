PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TransportRequest" (
    "id" TEXT NOT NULL PRIMARY KEY, "requestCode" TEXT NOT NULL, "customerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL, "categoryName" TEXT NOT NULL, "goodsDescription" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1, "weightKg" REAL NOT NULL, "lengthCm" REAL NOT NULL,
    "widthCm" REAL NOT NULL, "heightCm" REAL NOT NULL, "chargeableWeight" REAL NOT NULL,
    "shippingMethod" TEXT NOT NULL DEFAULT 'STANDARD', "destinationWarehouse" TEXT,
    "recipientName" TEXT NOT NULL DEFAULT '', "recipientPhone" TEXT NOT NULL DEFAULT '',
    "province" TEXT NOT NULL DEFAULT '', "district" TEXT NOT NULL DEFAULT '', "ward" TEXT NOT NULL DEFAULT '',
    "addressLine" TEXT NOT NULL DEFAULT '', "deliveryNote" TEXT,
    "declaredValueVnd" INTEGER NOT NULL DEFAULT 0, "insurance" BOOLEAN NOT NULL DEFAULT false,
    "estimatedShippingFeeVnd" INTEGER NOT NULL, "insuranceFeeVnd" INTEGER NOT NULL DEFAULT 0,
    "estimatedTotalVnd" INTEGER NOT NULL, "trackingCodeChina" TEXT, "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TransportRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TransportRequest" ("id","requestCode","customerId","categoryId","categoryName","goodsDescription","quantity","weightKg","lengthCm","widthCm","heightCm","chargeableWeight","shippingMethod","destinationWarehouse","declaredValueVnd","insurance","estimatedShippingFeeVnd","insuranceFeeVnd","estimatedTotalVnd","trackingCodeChina","status","adminNote","createdAt","updatedAt") SELECT "id","requestCode","customerId","categoryId","categoryName","goodsDescription","quantity","weightKg","lengthCm","widthCm","heightCm","chargeableWeight",CASE WHEN "shippingMethod"='ROAD' THEN 'STANDARD' ELSE "shippingMethod" END,"destinationWarehouse","declaredValueVnd","insurance","estimatedShippingFeeVnd","insuranceFeeVnd","estimatedTotalVnd","trackingCodeChina","status","adminNote","createdAt","updatedAt" FROM "TransportRequest";
DROP TABLE "TransportRequest";
ALTER TABLE "new_TransportRequest" RENAME TO "TransportRequest";
CREATE UNIQUE INDEX "TransportRequest_requestCode_key" ON "TransportRequest"("requestCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
