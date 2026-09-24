import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);

const CART_KEY = "foodrush_cart";

function readCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => readCart());

  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const addItem = (food) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.food._id === food._id);
      if (existing) {
        return prev.map((item) =>
          item.food._id === food._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { food, quantity: 1 }];
    });
  };

  const removeOne = (foodId) => {
    setCart((prev) => {
      const item = prev.find((entry) => entry.food._id === foodId);
      if (!item) return prev;
      if (item.quantity > 1) {
        return prev.map((entry) =>
          entry.food._id === foodId ? { ...entry, quantity: entry.quantity - 1 } : entry
        );
      }
      return prev.filter((entry) => entry.food._id !== foodId);
    });
  };

  const clearCart = () => setCart([]);
  
  const addMultipleItems = (items) => {
    // items is an array of orderItem ({ foodId, name, price, quantity })
    setCart(items.map(item => ({
      food: { _id: item.foodId, name: item.name, price: item.price },
      quantity: item.quantity
    })));
  };

  const value = useMemo(() => ({ cart, addItem, removeOne, clearCart, addMultipleItems, isCartOpen, setIsCartOpen }), [cart, isCartOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
