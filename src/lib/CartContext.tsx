import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type CartItem = {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
  amount: number;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'amount'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, amount: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('cart');
    if (stored) {
      try { setItems(JSON.parse(stored)); } catch (e) {}
    }
  }, []);

  const addToCart = (product: Omit<CartItem, 'amount'>) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      let updated;
      if (existing) {
        updated = prev.map((i) => (i.id === product.id ? { ...i, amount: i.amount + 1 } : i));
      } else {
        updated = [...prev, { ...product, amount: 1 }];
      }
      localStorage.setItem('cart', JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      localStorage.setItem('cart', JSON.stringify(updated));
      return updated;
    });
  };

  const updateQuantity = (id: string, amount: number) => {
    setItems((prev) => {
      const nextAmount = Math.max(1, Math.floor(amount));
      const updated = prev.map((i) => (i.id === id ? { ...i, amount: nextAmount } : i));
      localStorage.setItem('cart', JSON.stringify(updated));
      return updated;
    });
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem('cart');
  };

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
