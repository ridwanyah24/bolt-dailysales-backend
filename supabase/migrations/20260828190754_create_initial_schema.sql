-- DailySales AI initial schema

-- Enums
CREATE TYPE "Role" AS ENUM ('OWNER', 'SALESPERSON');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INVITED', 'DISABLED');

-- Business
CREATE TABLE "Business" (
  "id"               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name"             TEXT NOT NULL,
  "storeName"        TEXT,
  "address"          TEXT,
  "currency"         TEXT NOT NULL DEFAULT 'NGN',
  "setupCompletedAt" TIMESTAMPTZ,
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User
CREATE TABLE "User" (
  "id"               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "businessId"       TEXT NOT NULL REFERENCES "Business"("id") ON DELETE CASCADE,
  "name"             TEXT NOT NULL,
  "email"            TEXT NOT NULL,
  "passwordHash"     TEXT,
  "role"             "Role" NOT NULL,
  "status"           "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "avatarUrl"        TEXT,
  "emailVerifiedAt"  TIMESTAMPTZ,
  "inviteTokenHash"  TEXT,
  "inviteExpiresAt"  TIMESTAMPTZ,
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("businessId", "email")
);
CREATE INDEX "User_email_idx" ON "User"("email");

-- RefreshToken
CREATE TABLE "RefreshToken" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"    TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "revokedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PasswordResetToken
CREATE TABLE "PasswordResetToken" (
  "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"     TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "tokenHash"  TEXT NOT NULL,
  "expiresAt"  TIMESTAMPTZ NOT NULL,
  "consumedAt" TIMESTAMPTZ,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Category
CREATE TABLE "Category" (
  "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "businessId" TEXT NOT NULL REFERENCES "Business"("id") ON DELETE CASCADE,
  "name"       TEXT NOT NULL,
  UNIQUE ("businessId", "name")
);

-- Product
CREATE TABLE "Product" (
  "id"                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "businessId"         TEXT NOT NULL REFERENCES "Business"("id") ON DELETE CASCADE,
  "categoryId"        TEXT NOT NULL REFERENCES "Category"("id"),
  "name"              TEXT NOT NULL,
  "sku"               TEXT,
  "barcode"           TEXT,
  "sellingPrice"      DECIMAL(12,2) NOT NULL,
  "costPrice"         DECIMAL(12,2),
  "stockQty"          INTEGER NOT NULL DEFAULT 0,
  "lowStockThreshold" INTEGER NOT NULL DEFAULT 0,
  "imageUrl"          TEXT,
  "isActive"           BOOLEAN NOT NULL DEFAULT true,
  "createdAt"          TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("businessId", "sku")
);
CREATE INDEX "Product_businessId_isActive_idx" ON "Product"("businessId", "isActive");
CREATE INDEX "Product_businessId_barcode_idx" ON "Product"("businessId", "barcode");

-- Sale
CREATE TABLE "Sale" (
  "id"            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "businessId"    TEXT NOT NULL REFERENCES "Business"("id") ON DELETE CASCADE,
  "salespersonId" TEXT NOT NULL REFERENCES "User"("id"),
  "subtotal"      DECIMAL(12,2) NOT NULL,
  "total"         DECIMAL(12,2) NOT NULL,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX "Sale_businessId_createdAt_idx" ON "Sale"("businessId", "createdAt");
CREATE INDEX "Sale_businessId_salespersonId_idx" ON "Sale"("businessId", "salespersonId");

-- SaleItem
CREATE TABLE "SaleItem" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "saleId"      TEXT NOT NULL REFERENCES "Sale"("id") ON DELETE CASCADE,
  "productId"   TEXT NOT NULL REFERENCES "Product"("id"),
  "productName" TEXT NOT NULL,
  "quantity"    INTEGER NOT NULL,
  "unitPrice"   DECIMAL(12,2) NOT NULL,
  "lineTotal"   DECIMAL(12,2) NOT NULL
);

-- NotificationRead
CREATE TABLE "NotificationRead" (
  "id"             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "businessId"      TEXT NOT NULL REFERENCES "Business"("id") ON DELETE CASCADE,
  "notificationId" TEXT NOT NULL,
  "readAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("businessId", "notificationId")
);

-- AiInsightCache
CREATE TABLE "AiInsightCache" (
  "businessId"  TEXT PRIMARY KEY REFERENCES "Business"("id") ON DELETE CASCADE,
  "payload"     JSONB NOT NULL,
  "generatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "expiresAt"   TIMESTAMPTZ NOT NULL
);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION "update_updatedAt"()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Business_updatedAt" BEFORE UPDATE ON "Business"
  FOR EACH ROW EXECUTE FUNCTION "update_updatedAt"();
CREATE TRIGGER "User_updatedAt" BEFORE UPDATE ON "User"
  FOR EACH ROW EXECUTE FUNCTION "update_updatedAt"();
CREATE TRIGGER "Product_updatedAt" BEFORE UPDATE ON "Product"
  FOR EACH ROW EXECUTE FUNCTION "update_updatedAt"();
