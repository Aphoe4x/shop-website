import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { totalItems } = useCart();
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="container navbar-content">
        <Link to="/" className="navbar-logo">
          Shopping
        </Link>
        <div className="navbar-links">
          <Link to="/">Products</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/orders">My Orders</Link>
          <Link to="/checkout" className="cart-link">
            Cart
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </Link>
          {user ? (
            <div className="user-menu">
              <span className="user-name">Hi, {user.name?.split(' ')[0]}</span>
              <button onClick={logout} className="btn btn-outline">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
