import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, actionLabel = null, actionTo = null) => {
    const id = Date.now();
    setToast({ id, message, actionLabel, actionTo });
    setTimeout(() => {
      setToast((current) => (current && current.id === id ? null : current));
    }, 3500);
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  return (
    <ToastContext.Provider value={{ toast, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
