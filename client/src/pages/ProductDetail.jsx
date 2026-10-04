import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useShop } from '../context/ShopContext';
import ProductCard from '../components/ProductCard';

const API_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api'
    : 'https://shop-website-6o9u.onrender.com/api');

function Stars({ rating }) {
  const full = Math.round(rating);
  return <span className="stars">{'★★★★★'.slice(0, full) + '☆☆☆☆☆'.slice(0, 5 - full)}</span>;
}

function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { isWished, toggleWishlist, addRecent } = useShop();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState({ reviews: [], average: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const discount = Number(product?.discount_percent || 0);
  const price = product ? Number(product.price) * (1 - discount / 100) : 0;

  const handleAdd = () => {
    addToCart({ ...product, price }, quantity);
    showToast(`${product.name} added to cart`, 'View cart →', '/checkout');
  };

  useEffect(() => {
    fetchProduct();
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchProduct() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/products/${id}`);
      const data = await res.json();
      setProduct(data);
      addRecent(data);
      const all = await fetch(`${API_URL}/products`).then((r) => r.json());
      setRelated(
        all.filter((p) => p.category === data.category && p.id !== data.id).slice(0, 4)
      );
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchReviews() {
    try {
      const res = await fetch(`${API_URL}/reviews/${id}`);
      const data = await res.json();
      setReviews(data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  }

  async function submitReview(e) {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) {
      showToast('Sign in to leave a review');
      return;
    }
    try {
      await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: id,
          userId: user.id,
          userName: user.name,
          rating,
          comment,
        }),
      });
      setComment('');
      fetchReviews();
      showToast('Review submitted');
    } catch (error) {
      console.error(error);
    }
  }

  if (loading) return <p className="state-message">Loading...</p>;
  if (!product) return <p className="state-message">Product not found.</p>;

  return (
    <div className="product-detail">
      <Link to="/" className="back-link">&larr; Back to Shop</Link>

      <div className="product-detail-grid">
        <div className="product-detail-image">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} />
          ) : (
            <span className="product-detail-placeholder">🛍️</span>
          )}
        </div>

        <div className="product-detail-info">
          <h1 className="product-detail-name">{product.name}</h1>
          <div className="detail-rating">
            <Stars rating={reviews.average} />
            <span className="detail-rating-count">({reviews.count} reviews)</span>
          </div>
          <p className="product-detail-description">{product.description}</p>
          <p className="product-detail-price">
            ₦{price.toFixed(2)}
            {discount > 0 && (
              <span className="product-old-price">₦{Number(product.price).toFixed(2)}</span>
            )}
          </p>
          <p className="detail-stock">
            {Number(product.stock) <= 10
              ? `Only ${product.stock} left in stock`
              : 'In stock'}
          </p>

          <div className="quantity-row">
            <label htmlFor="quantity">Quantity:</label>
            <input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>

          <div className="detail-buttons">
            <button className="btn btn-primary btn-block" onClick={handleAdd}>
              Add to Cart
            </button>
            <button
              className="btn btn-outline"
              onClick={() => {
                toggleWishlist(product);
                showToast(isWished(product.id) ? 'Removed from wishlist' : 'Added to wishlist');
              }}
            >
              {isWished(product.id) ? '❤️' : '🤍'}
            </button>
            <a
              className="btn btn-whatsapp"
              href={`https://wa.me/?text=${encodeURIComponent(
                `${product.name} — ₦${price.toFixed(2)} on Shopping`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Share
            </a>
          </div>
        </div>
      </div>

      <section className="reviews-section">
        <h2>Reviews</h2>
        {reviews.reviews.length === 0 ? (
          <p className="state-message">No reviews yet. Be the first!</p>
        ) : (
          reviews.reviews.map((r) => (
            <div key={r.id} className="review-item">
              <div className="review-head">
                <strong>{r.user_name}</strong>
                <Stars rating={r.rating} />
              </div>
              {r.comment && <p className="review-comment">{r.comment}</p>}
            </div>
          ))
        )}
        <form className="review-form" onSubmit={submitReview}>
          <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
            <option value={5}>★★★★★ Excellent</option>
            <option value={4}>★★★★☆ Good</option>
            <option value={3}>★★★☆☆ Okay</option>
            <option value={2}>★★☆☆☆ Poor</option>
            <option value={1}>★☆☆☆☆ Bad</option>
          </select>
          <textarea
            rows="2"
            placeholder="Share your thoughts…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button type="submit" className="btn btn-outline">Submit review</button>
        </form>
      </section>

      {related.length > 0 && (
        <section className="related-section">
          <h2>You may also like</h2>
          <div className="products-grid">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default ProductDetail;
