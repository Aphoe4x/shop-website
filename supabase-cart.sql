-- Cart persistence for cross-device sync (website + mobile PWA)
-- Run this in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS cart_items_user_id_idx ON cart_items(user_id);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cart items viewable by everyone" ON cart_items;
DROP POLICY IF EXISTS "Anyone can insert cart items" ON cart_items;
DROP POLICY IF EXISTS "Anyone can update cart items" ON cart_items;
DROP POLICY IF EXISTS "Anyone can delete cart items" ON cart_items;

CREATE POLICY "Cart items viewable by everyone" ON cart_items
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert cart items" ON cart_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update cart items" ON cart_items
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete cart items" ON cart_items
  FOR DELETE USING (true);
