import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const API_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api'
    : 'https://shop-website-6o9u.onrender.com/api');

/**
 * Convert cart rows from the API into local cart products.
 * @param {Array} items - Rows shaped { productId, quantity, product }.
 * @returns {Array} Products with a quantity field.
 */
function mapServerItems(items) {
  return (items || [])
    .filter((row) => row.product)
    .map((row) => ({ ...row.product, quantity: row.quantity }));
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const cartRef = useRef(cart);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  // Persist the guest cart locally, and restore it when logged out.
  useEffect(() => {
    if (!user) {
      const saved = localStorage.getItem('cart');
      setCart(saved ? JSON.parse(saved) : []);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart, user]);

  /**
   * Push the full cart to the server so other devices stay in sync.
   * @param {Array} items - The new cart items.
   */
  const pushCart = useCallback(
    async (items) => {
      if (!user) return;
      try {
        await fetch(`${API_URL}/cart/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map((item) => ({
              productId: item.id,
              quantity: item.quantity,
            })),
          }),
        });
      } catch (error) {
        console.error('Cart sync failed:', error);
      }
    },
    [user]
  );

  // Load the server cart and subscribe to live updates while signed in.
  useEffect(() => {
    if (!user) return undefined;

    let active = true;

    fetch(`${API_URL}/cart/${user.id}`)
      .then((res) => res.json())
      .then((items) => {
        if (active) setCart(mapServerItems(items));
      })
      .catch((error) => console.error('Failed to load cart:', error));

    const stream = new EventSource(`${API_URL}/cart/${user.id}/stream`);
    stream.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'cart') setCart(mapServerItems(data.items));
      } catch (error) {
        console.error('Cart stream parse error:', error);
      }
    };

    return () => {
      active = false;
      stream.close();
    };
  }, [user]);

  const setAndPush = (next) => {
    cartRef.current = next;
    setCart(next);
    pushCart(next);
  };

  const addToCart = (product, quantity = 1) => {
    const prev = cartRef.current;
    const existing = prev.find((item) => item.id === product.id);
    const next = existing
      ? prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      : [...prev, { ...product, quantity }];
    setAndPush(next);
  };

  const removeFromCart = (productId) => {
    setAndPush(cartRef.current.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setAndPush(
      cartRef.current.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => setAndPush([]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
