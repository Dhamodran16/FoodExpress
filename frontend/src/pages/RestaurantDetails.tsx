// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { restaurantAPI, menuAPI } from '../services/api';
import { getAuth } from 'firebase/auth';

interface Restaurant {
  _id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  minOrder: number;
  distance: number;
  image: string;
  address: string | { street?: string; city?: string; state?: string; zipCode?: string };
  isActive: boolean;
}

interface MenuItem {
  _id: string;
  id?: string;
  restaurantId: {
    _id: string;
    name: string;
  };
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isVegetarian: boolean;
  isSpicy: boolean;
  isAvailable: boolean;
  deliveryTime?: string;
}

const RestaurantDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch restaurant details
        const restaurantData = await restaurantAPI.getById(id ?? '');
        setRestaurant(restaurantData.data);

        // Fetch menu items for this restaurant
        const menuItemsData = await menuAPI.getAll();
        setMenuItems(menuItemsData.data.filter((item: MenuItem) => item.restaurantId._id === id));

        // Fetch and store MongoDB userId if not present
        const auth = getAuth();
        const user = auth.currentUser;
        if (user && !window.localStorage.getItem('userId')) {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/firebase/${user.uid}`);
          if (res.ok) {
            const mongoUser = await res.json();
            if (mongoUser && mongoUser._id) {
              window.localStorage.setItem('userId', mongoUser._id);
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleAddToCart = async (item: any) => {
    try {
      // Add to cart context
      addItem({
        id: item._id ?? item.id ?? '',
        name: item.name,
        price: item.price,
        quantity: 1,
        image: item.image,
        restaurantId: item.restaurantId._id,
        restaurantName: item.restaurantId.name,
        deliveryTime: item.deliveryTime || ''
      });
      toast.success(`${item.name} added to cart!`);
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    }
  };

  const formatAddress = (address: any) => {
    if (!address) return '';
    if (typeof address === 'string') return address;
    return [address.street, address.city, address.state, address.zipCode].filter(Boolean).join(', ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading restaurant details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-exclamation-circle text-5xl text-red-500 mb-4"></i>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-orange-600 text-white rounded-button hover:bg-orange-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Restaurant Header */}
      <div className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-6">
          <button 
            onClick={() => navigate('/')}
            className="text-orange-600 hover:text-orange-700 mb-4 flex items-center"
          >
            <i className="fas fa-arrow-left mr-2"></i> Back to Restaurants
          </button>
          
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3">
              <img
                src={restaurant.image}
                alt={restaurant.name}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
            <div className="w-full md:w-2/3">
              <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>
              <div className="flex items-center mb-4">
                <div className="flex items-center bg-green-100 px-2 py-1 rounded mr-4">
                  <span className="text-sm font-medium text-green-800">{restaurant.rating}</span>
                  <i className="fas fa-star text-yellow-500 ml-1 text-xs"></i>
                </div>
                <span className="text-gray-600">{restaurant.cuisine} Cuisine</span>
              </div>
              <p className="text-gray-600 mb-4">{formatAddress(restaurant.address)}</p>
              <div className="flex items-center text-gray-500 text-sm">
                <div className="flex items-center mr-4">
                  <i className="fas fa-clock mr-1"></i>
                  <span>{restaurant.deliveryTime} min delivery</span>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-map-marker-alt mr-1"></i>
                  <span>{restaurant.distance} mi away</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Menu</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="h-48 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{item.name}</h3>
                  <span className="text-orange-600 font-bold">₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <p className="text-gray-600 text-sm mb-4">{item.description}</p>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  {item.isVegetarian && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded mr-2">
                      Vegetarian
                    </span>
                  )}
                  {item.isSpicy && (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                      Spicy
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleAddToCart(item)}
                  disabled={!item.isAvailable}
                  className={`w-full py-2 px-4 rounded-lg ${
                    item.isAvailable
                      ? 'bg-orange-600 text-white hover:bg-orange-700'
                      : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {item.isAvailable ? 'Add to Cart' : 'Unavailable'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetails;
