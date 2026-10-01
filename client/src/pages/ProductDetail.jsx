import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  async function fetchProduct() {
    try {
      const res = await fetch(`https://shop-website-6o9u.onrender.com/api/products/${id}`);
      const data = await res.json();
      setProduct(data);
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p style={{ textAlign: 'center', padding: '3rem' }}>Loading...</p>;
  if (!product) return <p style={{ textAlign: 'center', padding: '3rem' }}>Product not found.</p>;

  return (
    <div style={{ padding: '2rem 0' }}>
      <Link to="/" style={{ color: 'var(--green)', fontWeight: 500 }}>&larr; Back to Shop</Link>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '3rem',
        marginTop: '2rem',
        background: 'var(--white)',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 4px 15px rgba(0,0,0,0.06)'
      }}>
        <div style={{
          background: 'var(--light-gray)',
          borderRadius: '12px',
          height: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '6rem',
          overflow: 'hidden'
        }}>
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            '📦'
          )}
        </div>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{product.name}</h1>
          <p style={{ color: 'var(--gray)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>{product.description}</p>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--green)', marginBottom: '1.5rem' }}>
            ₦{product.price.toFixed(2)}
          </p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 500 }}>Quantity:</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              style={{ width: '80px' }}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={() => addToCart(product, quantity)}
            style={{ width: '100%', padding: '1rem' }}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
