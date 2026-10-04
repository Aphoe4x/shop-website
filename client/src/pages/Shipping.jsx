import { Link } from 'react-router-dom';

function Shipping() {
  return (
    <div className="info-page">
      <div className="page-hero">
        <div className="container">
          <h1>Shipping &amp; Delivery</h1>
          <p>Fast, tracked delivery across Nigeria</p>
        </div>
      </div>
      <div className="container info-content">
        <h2>Delivery times</h2>
        <ul>
          <li><strong>Lagos:</strong> 1–2 business days</li>
          <li><strong>Abuja, Ibadan, Port Harcourt:</strong> 2–3 business days</li>
          <li><strong>Other states:</strong> 3–5 business days</li>
        </ul>

        <h2>Delivery fees</h2>
        <p>
          Delivery is calculated at checkout based on your city — from ₦1,500 in
          Lagos to ₦3,000 nationwide. Orders over ₦100,000 ship free.
        </p>

        <h2>Tracking</h2>
        <p>
          After checkout you'll receive a confirmation email. You can view all your
          orders any time on the <Link to="/orders">My Orders</Link> page.
        </p>

        <h2>Questions?</h2>
        <p>
          Reach us on the <Link to="/contact">Contact</Link> page or message us on
          WhatsApp — we're happy to help.
        </p>
      </div>
    </div>
  );
}

export default Shipping;
