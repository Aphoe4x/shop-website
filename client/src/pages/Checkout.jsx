import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';

const API_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api'
    : 'https://shop-website-6o9u.onrender.com/api');

function Checkout() {
  const { cart, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [deliveryFees, setDeliveryFees] = useState({ default: 3000 });
  const [promo, setPromo] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoError, setPromoError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: 'Lagos',
    state: 'Lagos',
  });

  useEffect(() => {
    fetch(`${API_URL}/meta`)
      .then((r) => r.json())
      .then((d) => setDeliveryFees(d.deliveryFees || { default: 3000 }))
      .catch(() => {});
  }, []);

  const shipping = cart.length ? deliveryFees[form.city] ?? deliveryFees.default : 0;
  const discount = promo
    ? promo.type === 'percent'
      ? Math.round((totalPrice * promo.value) / 100)
      : shipping
    : 0;
  const grandTotal = Math.max(0, totalPrice + shipping - discount);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const applyPromo = async () => {
    setPromoError('');
    try {
      const res = await fetch(`${API_URL}/meta/promo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode, subtotal: totalPrice, shipping }),
      });
      if (!res.ok) throw new Error('invalid');
      const data = await res.json();
      setPromo({ code: data.code, type: data.type, value: data.value });
    } catch {
      setPromo(null);
      setPromoError('Invalid promo code');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
        customerName: form.name,
        customerEmail: form.email,
        totalAmount: grandTotal,
        shippingAddress: `${form.address}, ${form.city}, ${form.state}`,
        items: cart.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      };

      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) throw new Error('Order failed');

      clearCart();
      navigate('/orders', {
        state: { message: 'Order placed successfully! Check your email for confirmation.' },
      });
    } catch (error) {
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon" aria-hidden="true">🛒</div>
        <h2>Your cart is empty</h2>
        <p className="checkout-empty-text">Add some products before checking out.</p>
        <Link to="/" className="btn btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  const cities = Object.keys(deliveryFees).filter((c) => c !== 'default');

  return (
    <div className="checkout">
      <div className="checkout-heading">
        <h1>Checkout</h1>
        <Link to="/" className="continue-link">&larr; Continue Shopping</Link>
      </div>
      <div className="checkout-grid">
        <form onSubmit={handleSubmit} className="checkout-form">
          <h2>Shipping Details</h2>
          <div className="form-group">
            <label>Full Name</label>
            <input name="name" value={form.name} onChange={handleChange} required placeholder="Ade Ogunleye" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="ade@example.com" />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} required placeholder="+234 800 000 0000" />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input name="address" value={form.address} onChange={handleChange} required placeholder="123 Broad Street" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <select name="city" value={form.city} onChange={handleChange}>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c} — ₦{(deliveryFees[c] ?? deliveryFees.default).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>State</label>
              <input name="state" value={form.state} onChange={handleChange} required placeholder="Lagos" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
            {loading ? 'Placing Order...' : `Place Order · ₦${grandTotal.toFixed(2)}`}
          </button>
        </form>

        <div className="order-summary">
          <h3>Order Summary</h3>
          {cart.map((item) => (
            <div key={item.id} className="summary-item">
              <span>{item.name} x{item.quantity}</span>
              <span>₦{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="summary-item summary-delivery">
            <span>Delivery</span>
            <span>₦{shipping.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="summary-item summary-delivery">
              <span>Promo ({promo.code})</span>
              <span>-₦{discount.toFixed(2)}</span>
            </div>
          )}
          <div className="summary-promo">
            <input
              type="text"
              placeholder="Promo code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
            />
            <button type="button" className="btn btn-outline" onClick={applyPromo}>
              Apply
            </button>
          </div>
          {promoError && <p className="promo-error">{promoError}</p>}
          <div className="summary-total">
            <span>Total</span>
            <span>₦{grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
