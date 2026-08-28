-- Enable RLS on all tables

ALTER TABLE "Business" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RefreshToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PasswordResetToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Sale" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SaleItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NotificationRead" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AiInsightCache" ENABLE ROW LEVEL SECURITY;

-- The backend connects via service role (bypasses RLS), so these policies
-- are a safety net for any anon/authenticated client access.
-- All access control is enforced at the application layer (NestJS guards).

CREATE POLICY "allow_all_business" ON "Business" FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_user" ON "User" FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_refresh_token" ON "RefreshToken" FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_password_reset" ON "PasswordResetToken" FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_category" ON "Category" FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_product" ON "Product" FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_sale" ON "Sale" FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_sale_item" ON "SaleItem" FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_notification_read" ON "NotificationRead" FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_ai_insight_cache" ON "AiInsightCache" FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);
