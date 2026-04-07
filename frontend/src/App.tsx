import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { ToastProvider } from './component/common/NotificationToast';
import Navbar from './component/layout/Navbar';
import Footer from './component/layout/Footer';
import Cart from './pages/Cart';
import Home from './pages/Home';
import Products from './pages/Products';
import Login from './pages/Login';
import Favorites from './pages/Favorites';

const Placeholder = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <h1 className="text-3xl font-bold text-gray-500">{title}</h1>
  </div>
);

// Redirect logged-in users away from login page
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/" replace /> : <>{children}</>;
};

function AppShell() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/about" element={<Placeholder title="About Us" />} />
          <Route path="/contact" element={<Placeholder title="Contact Us" />} />
          <Route path="/checkout" element={<Placeholder title="Checkout" />} />
          <Route path="/shipping" element={<Placeholder title="Shipping Policy" />} />
          <Route path="/terms" element={<Placeholder title="Terms of Service" />} />
          <Route path="/privacy" element={<Placeholder title="Privacy Policy" />} />
          <Route path="/faq" element={<Placeholder title="FAQs" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      {/* Cart slide-over renders on top of everything */}
      <Cart />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <FavoritesProvider>
          <ToastProvider>
            <AppShell />
          </ToastProvider>
        </FavoritesProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
