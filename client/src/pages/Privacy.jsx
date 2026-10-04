import { Link } from 'react-router-dom';

function Privacy() {
  return (
    <div className="info-page">
      <div className="page-hero">
        <div className="container">
          <h1>Privacy Policy</h1>
          <p>How Shopping handles your information</p>
        </div>
      </div>
      <div className="container info-content">
        <h2>What we collect</h2>
        <p>
          When you sign in with Google we store your name, email and profile photo.
          When you place an order we store your shipping details so we can deliver it.
        </p>

        <h2>How we use it</h2>
        <p>
          Your details are used only to process orders, send order confirmations, and
          keep your cart and order history in sync across your devices. We never sell
          your data.
        </p>

        <h2>Payments</h2>
        <p>
          We do not store card details. Payments are handled by our payment provider.
        </p>

        <h2>Your choices</h2>
        <p>
          You can sign out at any time, and request deletion of your data by contacting
          us via the <Link to="/contact">Contact</Link> page.
        </p>
      </div>
    </div>
  );
}

export default Privacy;
