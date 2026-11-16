import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, MaterialProduct, Order } from '../types/index.js';
import { api, getAuthToken, clearAuthToken } from '../services/api.js';

export interface CartLineItem {
  productId: string;
  product: MaterialProduct;
  quantity: number;
}

interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  authLoading: boolean;
  allUsers: User[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  cart: CartLineItem[];
  addToCart: (product: MaterialProduct, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  toasts: Toast[];
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
  logout: () => Promise<void>;
  activeTrackingOrder: Order | null;
  setActiveTrackingOrder: (order: Order | null) => void;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  refreshUsers: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedCity, setSelectedCity] = useState<string>('Bengaluru');
  const [cart, setCart] = useState<CartLineItem[]>(() => {
    try {
      const saved = localStorage.getItem('bc_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('bc_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('Storage error:', e);
    }
  }, [cart]);

  const showToast = (title: string, message?: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshUsers = async () => {
    try {
      const res = await api.getAllUsers();
      setAllUsers(res.users);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const res = await api.getCurrentUser();
          setCurrentUser(res.user);
        } catch {
          clearAuthToken();
          setCurrentUser(null);
        }
      }
      setAuthLoading(false);
    };
    initAuth();
    refreshUsers();
  }, []);

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      clearAuthToken();
    }
    setCurrentUser(null);
    if (['dashboard', 'customer_dashboard', 'admin'].includes(activeTab)) {
      setActiveTab('home');
    }
    showToast('Signed Out', 'You have been signed out of your BuildNiva account.', 'info');
  };

  const addToCart = (product: MaterialProduct, quantity: number = 1) => {
    const minQty = product.minOrderQty || 1;
    const qtyToAdd = Math.max(quantity, minQty);

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + qtyToAdd }
            : item
        );
      }
      return [...prev, { productId: product.id, product, quantity: qtyToAdd }];
    });

    showToast(
      'Added to Site Cart',
      `${qtyToAdd} ${product.unit} of ${product.name} added.`,
      'success'
    );
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const enforced = Math.max(quantity, item.product.minOrderQty || 1);
          return { ...item, quantity: enforced };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
    showToast('Item removed', 'Product removed from your site cart.', 'info');
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        authLoading,
        allUsers,
        activeTab,
        setActiveTab,
        selectedCity,
        setSelectedCity,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        isCartOpen,
        setIsCartOpen,
        toasts,
        showToast,
        dismissToast,
        logout,
        activeTrackingOrder,
        setActiveTrackingOrder,
        authModalOpen,
        setAuthModalOpen,
        refreshUsers,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
