import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const handleAdd = () => {
    addToCart(product, quantity);
    showToast(`${product.name} added to cart`, 'View cart →', '/checkout');
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  async function fetchProduct() {
    try {
      const API_URL =
        import.meta.env.VITE_API_URL ||
        (window.location.hostname === 'localhost'
          ? 'http://localhost:3001/api'
          : 'https://shop-website-6o9u.onrender.com/api');

      const res = await fetch(`${API_URL}/products/${id}`);
      const data = await res.json();
      setProduct(data);
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setLoading(false);
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
            <span className="product-detail-placeholder">📦</span>
          )}
        </div>

        <div className="product-detail-info">
          <h1 className="product-detail-name">{product.name}</h1>
          <p className="product-detail-description">{product.description}</p>
          <p className="product-detail-price">₦{product.price.toFixed(2)}</p>

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

          <button
            className="btn btn-primary btn-block"
            onClick={handleAdd}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
