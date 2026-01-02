// Install Tailwind CSS in your project for the styles to work
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useCart } from '../context/CartContext';

interface MenuItem {
  _id: string;
  id?: string; // Optional for MongoDB compatibility
  restaurantId: {
    _id: string;
    name: string;
    // Add other restaurant fields as needed
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

interface Restaurant {
  _id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  minOrder: number;
  distance: number;
  image: string;
  address: string;
  isActive: boolean;
}

const ViewMenuItem: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const [menuItem, setMenuItem] = useState<MenuItem | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem } = useCart();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch menu item details
        const menuItemResponse = await fetch(`${API_URL}/api/menu/${itemId}`);
        if (!menuItemResponse.ok) throw new Error('Failed to fetch menu item details');
        const menuItemData = await menuItemResponse.json();
        setMenuItem(menuItemData);

        // Fetch restaurant details
        const restaurantResponse = await fetch(`${API_URL}/api/restaurants/${menuItemData.restaurantId._id}`);
        if (!restaurantResponse.ok) throw new Error('Failed to fetch restaurant details');
        const restaurantData = await restaurantResponse.json();
        setRestaurant(restaurantData);

        // Set page title
        document.title = `${menuItemData.name} | ${restaurantData.name}`;

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [itemId]);

  const handleAddToCart = () => {
    if (!menuItem) return;

    try {
      if (!menuItem.isAvailable) {
        toast.error('This item is currently unavailable');
        return;
      }

      addItem({
        id: menuItem._id || menuItem.id || '', // Handle both _id and id
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1,
        image: menuItem.image,
        restaurantId: menuItem.restaurantId._id,
        restaurantName: menuItem.restaurantId.name,
        deliveryTime: menuItem.deliveryTime
      });
      
      toast.success(`${menuItem.name} added to cart!`);
    } catch (error) {
      console.error('Error adding item to cart:', error);
      toast.error('Failed to add item to cart. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-lg text-gray-600">Loading item details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-lg text-red-500">{error}</p>
      </div>
    );
  }

  if (!menuItem || !restaurant) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-lg text-gray-500">Item not found.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-10">
      <div className="max-w-3xl mx-auto pt-8">
        <button
          onClick={() => navigate(`/restaurant/${restaurant._id}`)}
          className="text-indigo-600 hover:underline mb-4 flex items-center text-sm font-medium"
        >
          ← Back to Restaurant
        </button>

        <div className="bg-white rounded-xl shadow p-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/2">
              <img
                src={menuItem.image || 'https://via.placeholder.com/400x400?text=No+Image'}
                alt={menuItem.name || 'Menu item image'}
                className="w-full h-96 object-cover rounded-lg"
              />
            </div>

            <div className="w-full md:w-1/2">
              <h1 className="text-3xl font-bold mb-4">{menuItem.name}</h1>
              <p className="text-gray-600 mb-6">{menuItem.description}</p>

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Restaurant Details</h2>
                <p className="text-gray-600">{restaurant.name}</p>
                <p className="text-gray-600">Cuisine: {restaurant.cuisine}</p>
                <p className="text-gray-600">Rating: {restaurant.rating}</p>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Item Details</h2>
                <p className="text-gray-600">Category: {menuItem.category}</p>
                <p className="text-gray-600">Price: ₹{menuItem.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-gray-600">Vegetarian: {menuItem.isVegetarian ? 'Yes' : 'No'}</p>
                <p className="text-gray-600">Spicy: {menuItem.isSpicy ? 'Yes' : 'No'}</p>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!menuItem.isAvailable}
                className={`w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors ${
                  !menuItem.isAvailable ? 'cursor-not-allowed bg-gray-300' : ''
                }`}
              >
                {menuItem.isAvailable ? 'Add to Cart' : 'Unavailable'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewMenuItem;
