import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import Swal from 'sweetalert2';

interface FavoritesContextType {
  favorites: string[];
  toggle: (product_id: string) => void;
  isFavorite: (product_id: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);

  const toggle = useCallback((product_id: string) => {
    if (!user) {
      Swal.fire({
        icon: 'warning',
        title: 'Please Login',
        text: 'You must be logged in to add products to your favorites.',
        confirmButtonColor: '#FF922B'
      });
      return;
    }
    setFavorites((prev) =>
      prev.includes(product_id) ? prev.filter((id) => id !== product_id) : [...prev, product_id]
    );
  }, [user]);

  const isFavorite = useCallback((product_id: string) => favorites.includes(product_id), [favorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, toggle, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextType => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
};
