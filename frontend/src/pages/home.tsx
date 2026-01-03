// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserCircle } from 'react-icons/fa';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CartIcon from '../components/CartIcon';
// import { useCart } from '../context/CartContext'; // Unused - add to cart handled inline
import { getAuth } from 'firebase/auth';
import { getCurrentLocation, formatLocationString } from '../utils/geolocation';

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

const RestaurantMenu: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [location, setLocation] = useState('Loading location...');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [sortOption, setSortOption] = useState('Rating');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const { addItem } = useCart(); // Unused - add to cart handled inline
  const [userInitial, setUserInitial] = useState('C');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';

  // Cuisine types for filter
  const cuisineTypes = ['All', 'Indian', 'Italian', 'Chinese', 'Mexican', 'Thai', 'Japanese'];
  
  // Sort options
  const sortOptions = ['Rating', 'Delivery Time', 'Distance', 'Price: Low to High', 'Price: High to Low'];

  useEffect(() => {
    // Get current location on component mount
    const fetchLocation = async () => {
      console.log('🔄 Fetching current location...');
      try {
        const locationData = await getCurrentLocation();
        const formatted = formatLocationString(locationData);
        console.log('✅ Setting location to:', formatted);
        
        // Also log coordinates for debugging
        if (locationData.coordinates) {
          console.log('📍 Coordinates:', locationData.coordinates);
          console.log('🔗 Google Maps:', `https://www.google.com/maps?q=${locationData.coordinates.latitude},${locationData.coordinates.longitude}`);
        }
        
        setLocation(formatted);
      } catch (error) {
        console.error('❌ Failed to get location:', error);
        setLocation('Erode, 638052'); // Fallback
      }
    };
    
    fetchLocation();
  }, []);

  // Fetch restaurants and menu items from MongoDB
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch restaurants
        const restaurantsResponse = await fetch(`${API_URL}/api/restaurants`);
        if (!restaurantsResponse.ok) {
          throw new Error('Failed to fetch restaurants');
        }
        const restaurantsData = await restaurantsResponse.json();
        setRestaurants(restaurantsData);
        // Fetch menu items
        const menuItemsResponse = await fetch(`${API_URL}/api/menu`);
        if (!menuItemsResponse.ok) {
          throw new Error('Failed to fetch menu items');
        }
        const menuItemsData = await menuItemsResponse.json();
        setMenuItems(menuItemsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // Set up polling for real-time updates (every 30 seconds)
    const intervalId = setInterval(fetchData, 30000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      console.log(user.uid); // This is the firebaseUid
    }
    const unsubscribe = auth.onAuthStateChanged((user: any) => {
      setIsLoggedIn(!!user);
      if (user) {
        if (user.displayName && user.displayName.length > 0) {
          setUserInitial(user.displayName[0].toUpperCase());
        } else if (user.email && user.email.length > 0) {
          setUserInitial(user.email[0].toUpperCase());
        } else {
          setUserInitial('U');
        }
      } else {
        setUserInitial('U');
      }
    });
    return () => unsubscribe();
  }, []);

  // Filter restaurants based on selected cuisine and search term
  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesCuisine = selectedCuisine === 'All' || restaurant.cuisine === selectedCuisine;
    const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          restaurant.cuisine.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCuisine && matchesSearch && restaurant.isActive;
  });

  // Sort restaurants based on selected sort option
  const sortedRestaurants = [...filteredRestaurants].sort((a, b) => {
    switch (sortOption) {
      case 'Rating':
        return b.rating - a.rating;
      case 'Delivery Time':
        return parseInt(a.deliveryTime.split('-')[0]) - parseInt(b.deliveryTime.split('-')[0]);
      case 'Distance':
        return a.distance - b.distance;
      case 'Price: Low to High':
        return a.minOrder - b.minOrder;
      case 'Price: High to Low':
        return b.minOrder - a.minOrder;
      default:
        return 0;
    }
  });

  // Add this helper inside the component
  const formatAddress = (address: any) => {
    if (!address) return '';
    if (typeof address === 'string') return address;
    return [address.street, address.city, address.state, address.zipCode].filter(Boolean).join(', ');
  };

  // Unused function - add to cart is handled inline
  /*
  const handleAddToCart = (item: MenuItem) => {
    try {
      if (!item.isAvailable) {
        toast.error('This item is currently unavailable');
        return;
      }

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
    } catch (error) {
      console.error('Error adding item to cart:', error);
      toast.error('Failed to add item to cart. Please try again.');
    }
  };
  */

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading restaurants...</p>
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
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-orange-600 text-white rounded-button hover:bg-orange-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ToastContainer />
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-orange-600">FoodExpress</h1>
          </div>

          {/* Location Selector */}
          <div className="hidden md:flex items-center mx-4 text-gray-700">
            <i className="fas fa-map-marker-alt text-orange-500 mr-2"></i>
            <div className="flex items-center space-x-2">
            <span className="text-sm">{location}</span>
              <button
                onClick={async () => {
                  console.log('Refreshing location...');
                  setLocation('Loading location...');
                  try {
                    const locationData = await getCurrentLocation();
                    const formatted = formatLocationString(locationData);
                    console.log('New location:', formatted);
                    setLocation(formatted);
                  } catch (error) {
                    console.error('Failed to get location:', error);
                    setLocation('Erode, 638052');
                  }
                }}
                className="text-orange-600 hover:text-orange-800 text-xs ml-1"
                title="Refresh location"
              >
                <i className="fas fa-sync-alt"></i>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-xl mx-4">
            <input
              type="text"
              placeholder="Search for restaurants, cuisines..."
              className="w-full py-2 px-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer" 
              title="Search"
              aria-label="Search"
            >
              <i className="fas fa-search" aria-hidden="true"></i>
            </button>
          </div>

          {/* Login/User Info */}
          <div className="flex items-center ml-4">
            <div className="relative mr-4">
              <CartIcon className="text-4xl" />
            </div>
            <button
              onClick={() => navigate('/profile')}
              className="mr-2 focus:outline-none"
              title="Profile"
              aria-label="Profile"
            >
              {isLoggedIn ? (
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full text-white text-3xl font-bold uppercase"
                  style={{ background: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)' }}>
                  {userInitial}
                </span>
              ) : (
                <FaUserCircle className="w-12 h-12 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="container mx-auto px-4 py-3 border-t border-gray-200">
          <div className="flex flex-wrap items-center justify-between">
            {/* Cuisine Filters */}
            <div className="flex overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
              {cuisineTypes.map((cuisine) => (
                <button
                  key={cuisine}
                  className={`px-4 py-1.5 mr-2 rounded-full text-sm whitespace-nowrap cursor-pointer ${
                    selectedCuisine === cuisine
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setSelectedCuisine(cuisine)}
                >
                  {cuisine}
                </button>
              ))}
            </div>

            {/* Sort Options */}
            <div className="relative mt-2 md:mt-0">
              <select
                title="Sort Options"
                className="appearance-none bg-white border border-gray-300 rounded-full px-4 py-1.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                {sortOptions.map((option) => (
                  <option key={option} value={option}>
                    Sort by: {option}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <i className="fas fa-chevron-down text-xs"></i>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="relative rounded-xl overflow-hidden mb-10 h-96">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-900 to-transparent z-10"></div>
          <div className="absolute inset-0">
            <img 
              src="https://readdy.ai/api/search-image?query=A%20stunning%20food%20delivery%20hero%20image%20showcasing%20a%20variety%20of%20delicious%20dishes%20including%20pizza%2C%20burgers%2C%20sushi%2C%20and%20salads%20arranged%20beautifully%20on%20a%20modern%20dining%20table.%20The%20left%20side%20has%20a%20gradient%20overlay%20that%20seamlessly%20blends%20with%20text.%20The%20image%20has%20professional%20food%20photography%20lighting%20with%20vibrant%20colors%20and%20appetizing%20presentation%20against%20a%20clean%20minimal%20background&width=1440&height=500&seq=9&orientation=landscape" 
              alt="Food delivery" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="relative z-20 h-full flex flex-col justify-center px-8 md:px-16 text-white max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Delicious Food Delivered To Your Doorstep</h2>
            <p className="text-lg md:text-xl mb-6">Order from your favorite restaurants with just a few clicks</p>
            <div className="flex">
              <button className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-button whitespace-nowrap font-medium cursor-pointer"
                onClick={() => navigate('/cart')}
              >
                Order Now
              </button>
              <button 
                className="ml-4 bg-white hover:bg-gray-100 text-orange-600 px-6 py-3 rounded-button whitespace-nowrap font-medium cursor-pointer"
                onClick={() => navigate('/restaurants')}
              >
                View Restaurants
              </button>
            </div>
          </div>
        </div>

        {/* Restaurant Grid */}
        <h2 className="text-2xl font-bold mb-6">Restaurants Near You</h2>
        
        {sortedRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedRestaurants.map((restaurant) => (
              <div 
                key={restaurant._id} 
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                onClick={() => navigate(`/restaurant/${restaurant._id}`)}
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{restaurant.name}</h3>
                    <div className="flex items-center bg-green-100 px-2 py-1 rounded">
                      <span className="text-sm font-medium text-green-800">{restaurant.rating}</span>
                      <i className="fas fa-star text-yellow-500 ml-1 text-xs"></i>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{formatAddress(restaurant.address)}</p>
                  <div className="flex items-center text-gray-500 text-sm mb-3">
                    <div className="flex items-center mr-3">
                      <i className="fas fa-clock mr-1"></i>
                      <span>{restaurant.deliveryTime} min</span>
                    </div>
                    <div className="flex items-center">
                      <i className="fas fa-map-marker-alt mr-1"></i>
                      <span>{restaurant.distance} mi</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Min. order: ${restaurant.minOrder}</span>
                    <button 
                      className="text-orange-600 hover:text-orange-700 text-sm font-medium cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/restaurant/${restaurant._id}`);
                      }}
                    >
                      View Restaurant <i className="fas fa-chevron-right ml-1 text-xs"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <i className="fas fa-search text-5xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-semibold mb-2">No restaurants found</h3>
            <p className="text-gray-600">
              We couldn't find any restaurants matching your search criteria. Please try different filters.
            </p>
            <button 
              className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-button whitespace-nowrap hover:bg-orange-700 cursor-pointer"
              onClick={() => {
                setSelectedCuisine('All');
                setSearchTerm('');
              }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </main>

      {/* Features Section */}
      <section className="bg-orange-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose FoodExpress?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Fast Delivery */}
            <div className="bg-white rounded-lg p-6 shadow-md text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <img
                  src="https://img.icons8.com/ios-filled/50/000000/lightning-bolt.png"
                  alt="Fast Delivery"
                  className="w-8 h-8"
                />
              </div>
              <h3 className="text-xl font-semibold mb-3">Fast Delivery</h3>
              <p className="text-gray-600">
                Your favorite food delivered hot and fresh to your doorstep in under 35 minutes.
              </p>
            </div>

            {/* Local Restaurants */}
            <div className="bg-white rounded-lg p-6 shadow-md text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8">
                  <svg
                    fill="#000000"
                    viewBox="-38.07 -38.07 456.86 456.86"
                    xmlns="http://www.w3.org/2000/svg"
                    stroke="#000000"
                    strokeWidth="0.0038"
                    className="w-full h-full"
                  >
                    <g>
                      <g>
                        <path d="M190.372,29.813c-88.673,0-160.546,71.873-160.546,160.547c0,65.89,39.73,122.438,96.504,147.173l2.092-40.525 c0-32.242-23.83-21.912-23.83-44.465c0-12.641,0.395-38.98,0.395-58.755c0-52.697,22.377-103.673,27.874-115.048 c5.53-11.363,18.537-23.76,18.677-11.828c0,17.312,0.738,218.618,0.738,218.618h-0.035l2.463,61.241 c11.497,2.626,23.395,4.125,35.669,4.125c6.728,0,13.304-0.546,19.822-1.349l5.31-102.906 c-13.106-2.869-24.283-11.212-31.295-21.68c-8.685-13.014,6.675-128.067,6.675-128.067h10.004v107.978h9.922V96.894h10.84v107.978 h9.889V96.894h11.258v107.978h9.911V96.894h7.668c0,0,15.349,115.054,6.669,128.067c-6.947,10.363-18.009,18.682-30.952,21.633 c-0.232,0.07-0.441,0.163-0.441,0.163l5.02,95.993c63.995-21.11,110.249-81.307,110.249-152.39 C350.907,101.687,279.034,29.813,190.372,29.813z"></path>
                        <path d="M190.372,0C85.415,0,0,85.397,0,190.36C0,295.3,85.415,380.721,190.372,380.721c104.952,0,190.35-85.421,190.35-190.361 C380.721,85.397,295.324,0,190.372,0z M190.372,366.523c-97.144,0-176.18-79.03-176.18-176.163 c0-97.144,79.036-176.18,176.18-176.18c97.133,0,176.175,79.036,176.175,176.18C366.546,287.493,287.504,366.523,190.372,366.523z"></path>
                      </g>
                    </g>
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">Local Restaurants</h3>
              <p className="text-gray-600">
                Support local businesses by ordering from the best restaurants in your neighborhood.
              </p>
            </div>

            {/* Live Tracking */}
            <div className="bg-white rounded-lg p-6 shadow-md text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <img
                  src="https://img.icons8.com/ios-filled/50/000000/map-marker.png"
                  alt="Live Tracking"
                  className="w-8 h-8"
                />
              </div>
              <h3 className="text-xl font-semibold mb-3">Live Tracking</h3>
              <p className="text-gray-600">
                Track your order in real-time and know exactly when your food will arrive—all from your browser, no app needed!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Cuisines */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Popular Cuisines</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {cuisineTypes.filter(cuisine => cuisine !== 'All').map((cuisine) => (
              <div 
                key={cuisine} 
                className="bg-gray-50 rounded-lg p-4 text-center hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedCuisine(cuisine)}
              >
                <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden">
                  <img 
                    src={`https://readdy.ai/api/search-image?query=${cuisine}%20cuisine%20food%20dish%20presented%20beautifully%20on%20a%20clean%20white%20plate%20with%20minimal%20styling%20and%20soft%20natural%20lighting%2C%20showcasing%20authentic%20traditional%20preparation%20with%20vibrant%20colors%20and%20fresh%20ingredients&width=100&height=100&seq=${cuisineTypes.indexOf(cuisine)}&orientation=squarish`} 
                    alt={cuisine} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-medium">{cuisine}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold">1</div>
              <h3 className="text-xl font-semibold mb-3">Choose a Restaurant</h3>
              <p className="text-gray-600">Browse through our extensive list of restaurants near you</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold">2</div>
              <h3 className="text-xl font-semibold mb-3">Select Your Meal</h3>
              <p className="text-gray-600">Choose from a variety of delicious dishes on the menu</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold">3</div>
              <h3 className="text-xl font-semibold mb-3">Place Your Order</h3>
              <p className="text-gray-600">Confirm your order and choose cash on delivery</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold">4</div>
              <h3 className="text-xl font-semibold mb-3">Enjoy Your Food</h3>
              <p className="text-gray-600">Track your order and enjoy your meal when it arrives</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-12 pb-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">WT-FoodExpress</h3>
              <p className="text-gray-400 mb-4">Delivering happiness with every order.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white cursor-pointer">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white cursor-pointer">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white cursor-pointer">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white cursor-pointer">
                  <i className="fab fa-linkedin-in"></i>
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white cursor-pointer">Home</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white cursor-pointer">Restaurants</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white cursor-pointer">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white cursor-pointer">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white cursor-pointer">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white cursor-pointer">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white cursor-pointer">Refund Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white cursor-pointer">Cookie Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-start">
                  <i className="fas fa-map-marker-alt mt-1 mr-2"></i>
                  <span>123 Food Street, Delivery City, DC 12345</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-phone-alt mr-2"></i>
                  <span>+1 (555) 123-4567</span>
                </li>
                <li className="flex items-center">
                  <i className="fas fa-envelope mr-2"></i>
                  <span>support@foodexpress.com</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-gray-800 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()}FoodExpress. All rights reserved.</p>
            <div className="flex justify-center mt-4 space-x-4">
              <i className="fab fa-cc-visa text-2xl"></i>
              <i className="fab fa-cc-mastercard text-2xl"></i>
              <i className="fab fa-cc-amex text-2xl"></i>
              <i className="fab fa-cc-paypal text-2xl"></i>
            </div>
          </div>
        </div>
      </footer>

      {/* Custom CSS */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .rounded-button {
          border-radius: 9999px;
        }
      `}</style>
    </div>
  );
};

export default RestaurantMenu;