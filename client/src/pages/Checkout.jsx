import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

function Checkout() {
  const { cart, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
        customerName: form.name,
        customerEmail: form.email,
        totalAmount: totalPrice,
        shippingAddress: `${form.address}, ${form.city}, ${form.state}`,
        items: cart.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      };

      const res = await fetch('https://shop-website-6o9u.onrender.com/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) throw new Error('Order failed');

      const result = await res.json();
      clearCart();
      navigate('/orders', { state: { message: 'Order placed successfully! Check your email for confirmation.' } });
    } catch (error) {
      alert('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <h2>Your cart is empty</h2>
        <p style={{ color: 'var(--gray)', margin: '1rem 0' }}>Add some products before checking out.</p>
        <a href="/" className="btn btn-primary">Continue Shopping</a>
      </div>
    );
  }

  return (
    <div className="checkout">
      <h1 style={{ marginBottom: '1.5rem' }}>Checkout</h1>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>City</label>
              <input name="city" value={form.city} onChange={handleChange} required placeholder="Lagos" />
            </div>
            <div className="form-group">
              <label>State</label>
              <input name="state" value={form.state} onChange={handleChange} required placeholder="Lagos" />
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
            {loading ? 'Placing Order...' : 'Place Order'}
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
          <div className="summary-item" style={{ marginTop: '0.5rem', color: 'var(--gray)' }}>
            <span>Delivery</span>
            <span>Free</span>
          </div>
          <div className="summary-total">
            <span>Total</span>
            <span>₦{totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
