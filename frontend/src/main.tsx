import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CartProvider } from './context/CartContext';
import './index.css';
import '@fortawesome/fontawesome-free/css/all.css';
import { Toaster } from 'react-hot-toast';
import { disableRightClick } from './utils/disableRightClick';

// Disable right-click and developer tools shortcuts
disableRightClick();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <CartProvider>
        <App />
        <Toaster position="top-center" />
      </CartProvider>
    </BrowserRouter>
  </React.StrictMode>
);