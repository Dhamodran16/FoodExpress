import mongoose from 'mongoose';

const OrderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  restaurantName: { type: String, required: true },
  image: { type: String }
});

const OrderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: { type: [OrderItemSchema], required: true },
  total: { type: Number, required: true },
  status: { 
    type: String, 
    default: 'processing',
    enum: ['pending', 'processing', 'preparing', 'outForDelivery', 'delivered', 'completed', 'cancelled']
  },
  orderNumber: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
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
  userFirebaseUid: { type: String, required: true },
});

export default mongoose.model('Order', OrderSchema);
