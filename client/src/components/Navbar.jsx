import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="container navbar-content">
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          Shopping
        </Link>

        <button className="hamburger" onClick={toggleMenu} aria-label="Toggle menu">
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-links ${menuOpen ? 'active' : ''}`}>
          <Link to="/" onClick={closeMenu}>Products</Link>
          <Link to="/about" onClick={closeMenu}>About</Link>
          <Link to="/contact" onClick={closeMenu}>Contact</Link>
          <Link to="/orders" onClick={closeMenu}>My Orders</Link>
          <Link to="/checkout" className="cart-link" onClick={closeMenu}>
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
            <Link to="/login" className="btn btn-primary" onClick={closeMenu}>
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
