import { createContext, useContext, useState, useEffect } from 'react';
import { getCart } from '../backend/cart';
import { useAuth } from './AuthContext';

const CartContext = createContext({});

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartLoading, setCartLoading] = useState(true);

  const fetchCartItems = async () => {
    if (!user) {
      setCartItems([]);
      setCartCount(0);
      setCartLoading(false);
      return;
    }
    setCartLoading(true);
    try {
      const items = await getCart(user.id);
      setCartItems(items || []);
      const count = (items || []).reduce((acc, item) => acc + item.quantity, 0);
      setCartCount(count);
    } catch (err) {
      console.error('Failed to fetch cart', err);
    } finally {
      setCartLoading(false);
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, [user]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const openCheckout = () => {
    setIsCartOpen(false); // close cart when opening checkout
    setIsCheckoutOpen(true);
  };
  const closeCheckout = () => setIsCheckoutOpen(false);

  const value = {
    isCartOpen,
    openCart,
    closeCart,
    isCheckoutOpen,
    openCheckout,
    closeCheckout,
    cartItems,
    cartCount,
    cartLoading,
    refreshCart: fetchCartItems
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
