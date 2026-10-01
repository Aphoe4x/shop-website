import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (user?.email) {
      fetchOrders();
    }
  }, [user]);

  async function fetchOrders() {
    try {
      const API_URL =
        import.meta.env.VITE_API_URL ||
        (window.location.hostname === 'localhost'
          ? 'http://localhost:3001/api'
          : 'https://shop-website-6o9u.onrender.com/api');

      const res = await fetch(`${API_URL}/orders/${user.email}`);
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="state-message">
        <h2>Please sign in to view your orders</h2>
      </div>
    );
  }

  return (
    <div className="orders">
      <h1 className="orders-title">My Orders</h1>

      {location.state?.message && (
        <div className="alert alert-success">{location.state.message}</div>
      )}

      {loading ? (
        <p className="state-message">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="state-message">No orders yet.</p>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <strong>Order #{order.id.slice(0, 8)}</strong>
                <span className={`order-status order-status-${order.status}`}>
                  {order.status}
                </span>
              </div>
              <p className="order-date">
                {new Date(order.created_at).toLocaleDateString('en-NG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <div className="order-items">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="order-item-row">
                    <span>{item.product_name} x{item.quantity}</span>
                    <span>₦{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="order-total">
                <span>Total</span>
                <span>₦{order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;
