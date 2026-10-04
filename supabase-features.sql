-- Extra tables for app features (reviews). Run in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL DEFAULT 'Anonymous',
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reviews_product_id_idx ON reviews(product_id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews viewable by everyone" ON reviews;
DROP POLICY IF EXISTS "Anyone can add reviews" ON reviews;

CREATE POLICY "Reviews viewable by everyone" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Anyone can add reviews" ON reviews
  FOR INSERT WITH CHECK (true);

-- Sale support: optional discount percentage per product
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percent INTEGER NOT NULL DEFAULT 0;

UPDATE products SET discount_percent = 15
  WHERE name IN ('Ankara Print Dress', 'Wireless Earbuds');
UPDATE products SET discount_percent = 10
  WHERE name IN ('Shea Butter Body Cream', 'Throw Pillow Set');

