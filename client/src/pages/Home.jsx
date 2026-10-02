import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';

const API_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api'
    : 'https://shop-website-6o9u.onrender.com/api');

const CATEGORIES = [
  { icon: '👗', name: 'Fashion', desc: 'Ankara, Agbada & more' },
  { icon: '🍲', name: 'Food & Groceries', desc: 'Local & imported' },
  { icon: '💻', name: 'Electronics', desc: 'Phones, laptops & more' },
  { icon: '💄', name: 'Beauty', desc: 'Skincare & cosmetics' },
  { icon: '🏠', name: 'Home & Living', desc: 'Decor & furniture' },
  { icon: '👶', name: 'Kids', desc: 'Toys, clothes & more' },
];

const TRUST_BADGES = [
  { icon: '✅', title: 'Authentic Products', desc: '100% genuine items' },
  { icon: '🚚', title: 'Nationwide Delivery', desc: 'Lagos, Abuja, PH & more' },
  { icon: '🔒', title: 'Secure Payment', desc: 'Pay safely online' },
  { icon: '💬', title: 'Customer Support', desc: "We're here to help" },
];

function Home() {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, selectedCategory, products]);

  async function fetchProducts() {
    try {
      const res = await fetch(`${API_URL}/products`);
      const data = await res.json();
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterProducts() {
    let result = products;

    if (selectedCategory !== 'All') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          (p.category && p.category.toLowerCase().includes(query))
      );
    }

    setFilteredProducts(result);
  }

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="container">
          <h1>Quality Goods, Delivered.</h1>
          <p>
            Shop the best of Nigerian fashion, food, electronics and more.
            Authentic products with nationwide delivery.
          </p>
          <div className="hero-buttons">
            <a href="#products" className="btn btn-primary">Shop Now</a>
            {user ? (
              <>
                <Link to="/orders" className="btn btn-outline">My Orders</Link>
                <button onClick={logout} className="btn btn-outline">Logout</button>
              </>
            ) : (
              <Link to="/login" className="btn btn-outline">Sign In</Link>
            )}
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="search-section">
        <div className="container">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="btn btn-primary" onClick={filterProducts}>
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="categories">
        <div className="container">
          <h2 className="section-title">Shop by Category</h2>
          <p className="section-subtitle">Find exactly what you need</p>
          <div className="categories-grid">
            <div
              className={`category-card ${selectedCategory === 'All' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('All')}
            >
              <div className="category-icon">🛍️</div>
              <h3>All Products</h3>
              <p>View everything</p>
            </div>
            {CATEGORIES.map((cat) => (
              <div
                key={cat.name}
                className={`category-card ${selectedCategory === cat.name ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.name)}
              >
                <div className="category-icon">{cat.icon}</div>
                <h3>{cat.name}</h3>
                <p>{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="products" id="products">
        <div className="container">
          <h2 className="section-title">
            {selectedCategory === 'All'
              ? 'Featured Products'
              : `${selectedCategory} Products`}
          </h2>
          <p className="section-subtitle">
            {searchQuery
              ? `${filteredProducts.length} products found`
              : `${filteredProducts.length} products`}
          </p>
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading products...</p>
          ) : filteredProducts.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
              No products found. Try a different search or category.
            </p>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trust Badges */}
      <section className="trust-badges">
        <div className="container">
          <div className="trust-grid">
            {TRUST_BADGES.map((badge) => (
              <div key={badge.title} className="trust-item">
                <div className="trust-icon">{badge.icon}</div>
                <h4>{badge.title}</h4>
                <p>{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="newsletter">
        <div className="container">
          <h2>Join the List</h2>
          <p>Get updates on new arrivals, offers and exclusive deals.</p>
          <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Your email address" required />
            <button type="submit" className="btn btn-primary">Subscribe</button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <h4>Shop</h4>
              <Link to="/">All Products</Link>
              <a href="#products">New Arrivals</a>
              <a href="#products">Best Sellers</a>
            </div>
            <div>
              <h4>Help</h4>
              <Link to="/contact">Contact Us</Link>
              <Link to="/orders">Track Order</Link>
              <a href="#">Shipping & Delivery</a>
              <a href="#">FAQs</a>
            </div>
            <div>
              <h4>Company</h4>
              <Link to="/about">About Us</Link>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms & Conditions</a>
            </div>
            <div>
              <h4>Contact</h4>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                Lagos, Nigeria<br />
                abdulbasitafolabi7@gmail.com<br />
                +234 800 000 0000
              </p>
            </div>
          </div>
          <div className="footer-bottom">
            &copy; 2026 Shopping. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}

export default Home;
