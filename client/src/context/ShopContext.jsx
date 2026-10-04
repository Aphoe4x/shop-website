import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ShopContext = createContext();

const KEYS = {
  wishlist: 'wishlist',
  recent: 'recentlyViewed',
  theme: 'theme',
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function ShopProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => read(KEYS.wishlist, []));
  const [recent, setRecent] = useState(() => read(KEYS.recent, []));
  const [theme, setTheme] = useState(() => read(KEYS.theme, 'light'));

  useEffect(() => {
    localStorage.setItem(KEYS.wishlist, JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem(KEYS.recent, JSON.stringify(recent));
  }, [recent]);

  useEffect(() => {
    localStorage.setItem(KEYS.theme, JSON.stringify(theme));
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleWishlist = useCallback((product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      return exists ? prev.filter((p) => p.id !== product.id) : [...prev, product];
    });
  }, []);

  const isWished = useCallback(
    (id) => wishlist.some((p) => p.id === id),
    [wishlist]
  );

  const addRecent = useCallback((product) => {
    setRecent((prev) => [product, ...prev.filter((p) => p.id !== product.id)].slice(0, 8));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <ShopContext.Provider
      value={{ wishlist, toggleWishlist, isWished, recent, addRecent, theme, toggleTheme }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  return useContext(ShopContext);
}
