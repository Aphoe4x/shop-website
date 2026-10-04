import { useCart } from '../context/CartContext';

/** Floating WhatsApp button, shown only when the cart has items (matches the cart). */
function FloatingWhatsApp() {
  const { totalItems } = useCart();

  if (totalItems === 0) return null;

  return (
    <a
      className="whatsapp-float"
      href="https://wa.me/2348000000000"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
    >
      💬
    </a>
  );
}

export default FloatingWhatsApp;
