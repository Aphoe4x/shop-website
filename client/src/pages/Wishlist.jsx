import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useShop } from '../context/ShopContext';

function Wishlist() {
  const { wishlist } = useShop();

  if (wishlist.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon" aria-hidden="true">❤️</div>
        <h2>Your wishlist is empty</h2>
        <p className="checkout-empty-text">Tap the heart on a product to save it here.</p>
        <Link to="/" className="btn btn-primary">Browse Products</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="orders-title">My Wishlist</h1>
      <div className="products-grid">
        {wishlist.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

export default Wishlist;
