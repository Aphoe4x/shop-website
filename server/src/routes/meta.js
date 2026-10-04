import { Router } from 'express';

const router = Router();

// Promo codes: percent discount, or free shipping.
const PROMOS = {
  WELCOME10: { type: 'percent', value: 10, label: '10% off your first order' },
  KESTREL15: { type: 'percent', value: 15, label: '15% off — team Kestrel' },
  FREESHIP: { type: 'shipping', value: 100, label: 'Free delivery' },
};

// Delivery fees by Nigerian city (naira), with a nationwide default.
const DELIVERY_FEES = {
  Lagos: 1500,
  Abuja: 2500,
  Ibadan: 2000,
  'Port Harcourt': 2500,
  Kano: 3000,
  Enugu: 2800,
  default: 3000,
};

// Public config used by the web and mobile clients.
router.get('/', (req, res) => {
  res.json({
    deliveryFees: DELIVERY_FEES,
    promoHints: Object.keys(PROMOS),
  });
});

// Validate a promo code and return the computed discount.
router.post('/promo', (req, res) => {
  const code = String(req.body?.code || '').trim().toUpperCase();
  const subtotal = Number(req.body?.subtotal || 0);
  const shipping = Number(req.body?.shipping || 0);

  const promo = PROMOS[code];
  if (!promo) {
    return res.status(404).json({ error: 'Invalid promo code' });
  }

  const discount =
    promo.type === 'percent'
      ? Math.round((subtotal * promo.value) / 100)
      : Math.min(shipping, shipping); // free shipping removes the fee

  res.json({ code, label: promo.label, type: promo.type, discount });
});

export default router;
