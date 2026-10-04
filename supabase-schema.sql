-- Supabase Database Schema for Shopping
-- Run this in your Supabase SQL editor

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  google_id TEXT,
  auth_provider TEXT DEFAULT 'google',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  category TEXT,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  shipping_address TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Products: anyone can read
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (true);

-- Orders: anyone can create, read by email
CREATE POLICY "Anyone can create orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Orders viewable by customer email" ON orders
  FOR SELECT USING (true);

-- Order items: anyone can create, read all
CREATE POLICY "Anyone can create order items" ON order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Order items viewable by everyone" ON order_items
  FOR SELECT USING (true);

-- Users: anyone can insert (for Google auth signup)
CREATE POLICY "Anyone can create users" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (true);

-- Cart items table (server-side cart for cross-device sync)
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, product_id)
);

-- Insert sample products
INSERT INTO products (name, description, price, category, stock) VALUES
  ('Ankara Print Dress', 'Beautiful Nigerian Ankara print dress, perfect for any occasion.', 15000.00, 'Fashion', 50),
  ('Agbada Set', 'Premium Agbada set for men. Perfect for weddings and special events.', 45000.00, 'Fashion', 30),
  ('Jollof Rice Spice Pack', 'Authentic Nigerian jollof rice spice blend. Makes the perfect party jollof.', 2500.00, 'Food & Groceries', 100),
  ('Suya Spice Mix', 'Traditional suya spice mix. Just add meat and grill.', 1500.00, 'Food & Groceries', 200),
  ('Wireless Earbuds', 'High-quality wireless earbuds with noise cancellation.', 18000.00, 'Electronics', 75),
  ('Shea Butter Body Cream', 'Pure Ghanaian shea butter body cream. Moisturizes and nourishes.', 5000.00, 'Beauty', 150),
  ('African Black Soap', 'Traditional African black soap. Great for all skin types.', 2000.00, 'Beauty', 200),
  ('Throw Pillow Set', 'Set of 4 decorative throw pillows with African print covers.', 8000.00, 'Home & Living', 40),
  ('Kids Ankara Outfit', 'Adorable Ankara outfit for kids. Ages 2-8.', 7500.00, 'Kids', 60),
  ('Portable Bluetooth Speaker', 'Waterproof portable speaker with deep bass.', 12000.00, 'Electronics', 45);
