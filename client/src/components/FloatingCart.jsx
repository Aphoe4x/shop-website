import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function FloatingCart() {
  const { totalItems, totalPrice } = useCart();

  if (totalItems === 0) return null;

  return (
    <Link to="/checkout" className="floating-cart" aria-label={`View cart, ${totalItems} items`}>
      <span className="floating-cart-icon" aria-hidden="true">🛒</span>
      <span className="floating-cart-text">
        <strong>{totalItems}</strong> item{totalItems > 1 ? 's' : ''}
      </span>
      <span className="floating-cart-total">₦{totalPrice.toFixed(2)}</span>
    </Link>
  );
}

export default FloatingCart;
