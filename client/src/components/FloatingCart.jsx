import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

/** Small floating cart button, shown only once there are items (like Bumpa). */
function FloatingCart() {
  const { totalItems } = useCart();

  if (totalItems === 0) return null;

  return (
    <Link
      to="/checkout"
      className="floating-cart-btn"
      aria-label={`View cart, ${totalItems} items`}
    >
      🛒
      <span className="floating-cart-count">{totalItems}</span>
    </Link>
  );
}

export default FloatingCart;
