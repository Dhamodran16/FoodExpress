// Currency utility for Indian Rupee (INR)
// Conversion rate: 1 USD = 83 INR (approximate)

export const formatCurrency = (amount: number): string => {
  // Format number with Indian number system (lakhs, crores)
  return `₹${amount.toLocaleString('en-IN', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

export const formatCurrencyWithoutSymbol = (amount: number): string => {
  return amount.toLocaleString('en-IN', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};

// Convert USD to INR (if needed for legacy data)
export const usdToInr = (usdAmount: number): number => {
  const conversionRate = 83; // 1 USD = 83 INR
  return usdAmount * conversionRate;
};

// Delivery fee in INR
export const DELIVERY_FEE = 50; // ₹50 delivery fee
export const TAX_RATE = 0.18; // 18% GST (Indian tax rate)

