// The exported code uses Tailwind CSS. Install Tailwind CSS in your dev environment to ensure all styles work.
import React from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, DELIVERY_FEE, TAX_RATE } from '../utils/currency';

const BuyFood: React.FC = () => {
  const { items, updateQuantity, removeItem, getTotalPrice, clearCart } = useCart();
  const [couponCode, setCouponCode] = React.useState('');
  const [discount, setDiscount] = React.useState(0);
  const [isEmptyCart, setIsEmptyCart] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    setIsEmptyCart(items.length === 0);
  }, [items]);

  const handleQuantityChange = (id: string, change: number) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newQty = Math.max(1, item.quantity + change);
    updateQuantity(id, newQty);
  };

  const handleRemoveItem = (id: string) => {
    removeItem(id);
  };

  const handleCouponApply = () => {
    if (couponCode.toLowerCase() === 'discount20') {
      setDiscount(20);
    } else if (couponCode.toLowerCase() === 'save10') {
      setDiscount(10);
    } else {
      setDiscount(0);
      alert('Invalid coupon code');
    }
  };

  // Calculate cart totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = DELIVERY_FEE;
  const tax = subtotal * TAX_RATE; // 18% GST (Indian tax rate)
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal + deliveryFee + tax - discountAmount;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Cart Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <i className="fas fa-shopping-cart text-2xl text-indigo-600 mr-3"></i>
            <h1 className="text-3xl font-semibold text-gray-800">Your Cart</h1>
            <span className="ml-3 bg-indigo-100 text-indigo-800 py-1 px-3 rounded-full text-sm">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center cursor-pointer whitespace-nowrap" onClick={() => navigate('/')}> 
            <i className="fas fa-arrow-left mr-2"></i>
            Continue Shopping
          </button>
        </div>
        {isEmptyCart ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <div className="mb-6">
              <i className="fas fa-shopping-cart text-gray-300 text-6xl"></i>
            </div>
            <h2 className="text-2xl font-medium text-gray-700 mb-4">Your cart is empty</h2>
            <p className="text-gray-500 mb-8">Start adding delicious meals to your cart!</p>
            <button className="bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition duration-200 !rounded-button cursor-pointer whitespace-nowrap" onClick={() => navigate('/')}>Browse Menu</button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items List */}
            <div className="lg:w-2/3">
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {items.map((item, index) => (
                  <div key={item.id} className="p-6 border-b border-gray-100 last:border-b-0">
                    <div className="flex flex-col sm:flex-row">
                      {/* Item Image */}
                      <div className="sm:w-24 h-24 flex-shrink-0 mb-4 sm:mb-0">
                        <div className="w-24 h-24 rounded-lg overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover object-top"
                          />
                        </div>
                      </div>
                      {/* Item Details */}
                      <div className="sm:ml-6 flex-grow">
                        <div className="flex flex-col sm:flex-row justify-between">
                          <div>
                            <h3 className="font-medium text-lg text-gray-800">{item.name}</h3>
                            {item.restaurantName && <p className="text-gray-500 text-sm">{item.restaurantName}</p>}
                            {item.customization && (
                              <p className="text-sm text-gray-600 mt-1">
                                <span className="font-medium">Customization:</span> {item.customization}
                              </p>
                            )}
                            {item.specialInstructions && (
                              <p className="text-sm text-gray-600 mt-1 italic">
                                "{item.specialInstructions}"
                              </p>
                            )}
                          </div>
                          <div className="mt-4 sm:mt-0">
                            <div className="flex items-center justify-end">
                              <button
                                onClick={() => handleQuantityChange(item.id, -1)}
                                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 !rounded-button cursor-pointer whitespace-nowrap"
                              >
                                <i className="fas fa-minus text-gray-600 text-xs"></i>
                              </button>
                              <span className="mx-3 w-8 text-center">{item.quantity}</span>
                              <button
                                onClick={() => handleQuantityChange(item.id, 1)}
                                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 !rounded-button cursor-pointer whitespace-nowrap"
                              >
                                <i className="fas fa-plus text-gray-600 text-xs"></i>
                              </button>
                            </div>
                            <div className="text-right mt-2">
                              <p className="font-medium text-gray-800">{formatCurrency(item.price * item.quantity)}</p>
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-red-500 text-sm hover:text-red-700 mt-1 cursor-pointer whitespace-nowrap"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Order Summary */}
            <div className="lg:w-1/3">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Order Summary</h2>
                {/* Price Breakdown */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-800">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="text-gray-800">{formatCurrency(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax (GST 18%)</span>
                    <span className="text-gray-800">{formatCurrency(tax)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({discount}%)</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="border-t pt-4 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span className="text-gray-800">Total</span>
                      <span className="text-xl text-gray-900">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
                {/* Coupon Code */}
                <div className="mb-6">
                  <label htmlFor="coupon" className="block text-sm font-medium text-gray-700 mb-2">
                    Apply Coupon
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      id="coupon"
                      className="flex-grow px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />
                    <button
                      onClick={handleCouponApply}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-r-lg hover:bg-indigo-700 transition duration-200 !rounded-button cursor-pointer whitespace-nowrap"
                    >
                      Apply
                    </button>
                  </div>
                  {discount > 0 && (
                    <p className="text-green-600 text-sm mt-2">
                      <i className="fas fa-check-circle mr-1"></i>
                      Coupon applied successfully!
                    </p>
                  )}
                </div>
                {/* Delivery Time */}
                <div className="mb-6 bg-indigo-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <i className="fas fa-clock text-indigo-600 mr-3"></i>
                    <div>
                      <p className="text-sm text-gray-600">Estimated Delivery Time</p>
                      <p className="font-medium text-gray-800">30-45 minutes</p>
                    </div>
                  </div>
                </div>
                {/* Checkout Button */}
                <button
                  className="block w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition duration-200 !rounded-button cursor-pointer whitespace-nowrap"
                  onClick={() => navigate('/order-confirmation')}
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BuyFood;
