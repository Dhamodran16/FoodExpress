import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  restaurantName: { type: String, required: true },
  image: { type: String }
});

const OrderSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  items: { type: [OrderItemSchema], required: true },
  total: { type: Number, required: true },
  status: { 
    type: String, 
    default: 'processing',
    enum: ['pending', 'processing', 'preparing', 'outForDelivery', 'delivered', 'completed', 'cancelled'],
    index: true
  },
  orderNumber: { type: String, required: true, unique: true, index: true },
  createdAt: { type: Date, default: Date.now, index: true },
  paymentMethod: { 
    type: { 
      type: String, 
      enum: ['credit', 'digital', 'cash'],
      required: true 
    },
    details: {
      cardNumber: String,
      cardName: String,
      cardExpiry: String,
      cardCVV: String,
      digitalPaymentCode: String
    }
  },
  deliveryAddress: { type: Object, required: true },
  userFirebaseUid: { type: String, required: true, index: true },
});

// Compound indexes for common query patterns
OrderSchema.index({ userFirebaseUid: 1, createdAt: -1 }); // For user order history
OrderSchema.index({ status: 1, createdAt: -1 }); // For order status queries
OrderSchema.index({ userId: 1, status: 1 }); // For user orders by status

export default mongoose.model('Order', OrderSchema);
