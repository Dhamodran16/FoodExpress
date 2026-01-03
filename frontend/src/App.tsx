import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ViewMenuItem from './pages/ViewMenuItem';
import RestaurantDetails from './pages/RestaurantDetails';
import Restaurants from './pages/Restaurants';
import CartDetails from './pages/CartDetails';
import BuyFood from './pages/BuyFood';
import OrderConf from './pages/orderConf';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import Profile from './components/Profile';
import OrderHistory from './pages/OrderHistory';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Home from './pages/home';
import Index from './pages/index';
import NotFound from './components/NotFound';

// ProtectedRoute component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user: any) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
};

// PublicRoute component (redirects to home if already authenticated)
const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user: any) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (user && (location.pathname === '/signin' || location.pathname === '/signup')) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicRoute><Index /></PublicRoute>} />
      <Route path="/signin" element={<PublicRoute><SignIn /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
      <Route path="/test" element={<div style={{ padding: "20px", fontSize: "24px" }}>🚀 Test Route is Working!</div>} />

      {/* Protected Routes */}
      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/menu-item/:id" element={<ProtectedRoute><ViewMenuItem /></ProtectedRoute>} />
      <Route path="/restaurant/:id" element={<ProtectedRoute><RestaurantDetails /></ProtectedRoute>} />
      <Route path="/restaurants" element={<ProtectedRoute><Restaurants /></ProtectedRoute>} />
      <Route path="/cart" element={<ProtectedRoute><BuyFood /></ProtectedRoute>} />
      <Route path="/order-confirmation" element={<ProtectedRoute><OrderConf /></ProtectedRoute>} />
      <Route path="/order-placed" element={<ProtectedRoute><CartDetails /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
      <Route path="/cart-details/:orderId" element={<ProtectedRoute><CartDetails /></ProtectedRoute>} />

      {/* Fallback Routes */}
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <>
      <AppRoutes />
      <ToastContainer 
        position="top-right" 
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </>
  );
};

export default App;