import React, { createContext, useContext, useState, useCallback } from 'react';

interface FavoritesContextType {
  favorites: string[];
  toggle: (product_id: string) => void;
  isFavorite: (product_id: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<string[]>([]);

  const toggle = useCallback((product_id: string) => {
    setFavorites((prev) =>
      prev.includes(product_id) ? prev.filter((id) => id !== product_id) : [...prev, product_id]
    );
  }, []);

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
