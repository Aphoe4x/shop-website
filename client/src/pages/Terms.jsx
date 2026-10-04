import { Link } from 'react-router-dom';

function Terms() {
  return (
    <div className="info-page">
      <div className="page-hero">
        <div className="container">
          <h1>Terms &amp; Conditions</h1>
          <p>The rules for shopping with us</p>
        </div>
      </div>
      <div className="container info-content">
        <h2>Using our store</h2>
        <p>
          By shopping with Shopping you agree to provide accurate delivery details and
          to use the store for lawful purposes only.
        </p>

        <h2>Orders &amp; pricing</h2>
        <p>
          All prices are in Nigerian Naira (₦). We do our best to keep prices and stock
          accurate; if an item is unavailable we'll contact you to arrange a refund or
          alternative.
        </p>

        <h2>Returns</h2>
        <p>
          Unused items can be returned within 7 days of delivery. Contact us via the{" "}
          <Link to="/contact">Contact</Link> page to start a return.
        </p>

        <h2>Delivery</h2>
        <p>
          Delivery times and fees are outlined on the{" "}
          <Link to="/shipping">Shipping &amp; Delivery</Link> page.
        </p>
      </div>
    </div>
  );
}

export default Terms;
