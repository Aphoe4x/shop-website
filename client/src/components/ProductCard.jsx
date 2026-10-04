import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useShop } from '../context/ShopContext';

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { isWished, toggleWishlist } = useShop();

  const discount = Number(product.discount_percent || 0);
  const price = Number(product.price) * (1 - discount / 100);
  const lowStock = Number(product.stock) > 0 && Number(product.stock) <= 10;

  const handleAdd = () => {
    addToCart({ ...product, price });
    showToast(`${product.name} added to cart`, 'View cart →', '/checkout');
  };

  const handleWish = (e) => {
    e.preventDefault();
    toggleWishlist(product);
    showToast(isWished(product.id) ? 'Removed from wishlist' : 'Added to wishlist');
  };

  return (
    <div className="product-card">
      <Link to={`/product/${product.id}`}>
        <div className="product-image">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} />
          ) : (
            <div className="product-placeholder">🛍️</div>
          )}
          {discount > 0 && <span className="product-badge sale">-{discount}%</span>}
          {lowStock && <span className="product-badge low">{product.stock} left</span>}
          <button
            className={`wish-heart ${isWished(product.id) ? 'active' : ''}`}
            onClick={handleWish}
            aria-label="Toggle wishlist"
          >
            {isWished(product.id) ? '❤️' : '🤍'}
          </button>
        </div>
      </Link>
      <div className="product-info">
        <Link to={`/product/${product.id}`}>
          <h3 className="product-name">{product.name}</h3>
        </Link>
        <p className="product-description">{product.description}</p>
        <div className="product-footer">
          <span className="product-price">
            ₦{price.toFixed(2)}
            {discount > 0 && (
              <span className="product-old-price">₦{Number(product.price).toFixed(2)}</span>
            )}
          </span>
          <button className="btn btn-primary add-to-cart" onClick={handleAdd}>
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
