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
      const res = await fetch(`http://localhost:3001/api/orders/${user.email}`);
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
      <div style={{ textAlign: 'center', padding: '4rem 0' }}>
        <h2>Please sign in to view your orders</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem 0' }}>
      <h1 style={{ marginBottom: '1.5rem' }}>My Orders</h1>

      {location.state?.message && (
        <div style={{
          background: '#d4edda',
          color: '#155724',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem'
        }}>
          {location.state.message}
        </div>
      )}

      {loading ? (
        <p>Loading orders...</p>
      ) : orders.length === 0 ? (
        <p style={{ color: 'var(--gray)' }}>No orders yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {orders.map((order) => (
            <div key={order.id} style={{
              background: 'var(--white)',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <strong>Order #{order.id.slice(0, 8)}</strong>
                <span style={{
                  background: order.status === 'pending' ? '#fff3cd' : '#d4edda',
                  color: order.status === 'pending' ? '#856404' : '#155724',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}>
                  {order.status}
                </span>
              </div>
              <p style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>
                {new Date(order.created_at).toLocaleDateString('en-NG', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>
              <div style={{ marginTop: '0.75rem' }}>
                {order.order_items?.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span>{item.product_name} x{item.quantity}</span>
                    <span>₦{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div style={{
                marginTop: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--light-gray)',
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
                color: 'var(--green)'
              }}>
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
