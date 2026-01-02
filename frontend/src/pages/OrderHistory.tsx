import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { formatCurrency } from '../utils/currency';

// Added a placeholder for useAuthGuard
const useAuthGuard = () => {
  // Placeholder logic for authentication guard
};

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  restaurantName: string;
  image?: string;
}
interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
  orderNumber: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';

const OrderHistory: React.FC = () => {  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useAuthGuard();

  useEffect(() => {
    const fetchOrders = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      const firebaseUid = user?.uid;
      if (!firebaseUid) {
        setError('You must be logged in to view your orders.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_URL}/api/orders/firebase/${firebaseUid}`);
        if (!res.ok) throw new Error('Failed to fetch orders');
        const orders = await res.json();
        setOrders(orders);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Helper function to get status badge styling
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'processing':
      case 'preparing':
        return 'bg-blue-100 text-blue-700';
      case 'outForDelivery':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'pending':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };
  
  // Helper function to format status display
  const formatStatus = (status: string) => {
    return status.replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, c => c.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Order History</h1>
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-12">{error}</div>
        ) : orders.length === 0 ? (
          <div className="text-center text-gray-500 py-12">No orders found.</div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="text-lg font-semibold">{order.items[0]?.restaurantName || 'Restaurant'}</div>
                    <div className="text-xs text-gray-500">Order ID: {order._id}</div>
                  </div>
                  <div className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleString()}</div>
                </div>
                <div className="mb-2">
                  <span className="font-medium">Items:</span>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {order.items.map((item, idx) => (
                      <li key={idx}>{item.name} x{item.quantity}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(order.status)}`}>
                      {formatStatus(order.status)}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-gray-800">{formatCurrency(order.total)}</div>
                </div>
                <button
                  onClick={() => navigate(`/cart-details/${order._id}`)}
                  className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => navigate(-1)} className="mt-8 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Back</button>
      </div>
    </div>
  );
};

export default OrderHistory;