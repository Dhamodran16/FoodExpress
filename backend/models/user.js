import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  label: String,
  street: String,
  city: String,
  state: String,
  postalCode: String,
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true, index: true },
  displayName: String,
  email: { type: String, required: true, index: true },
  phone: String,
  photoURL: String,
  addresses: [addressSchema],
  address: String,
  deliveryAddress: String,
  defaultAddress: String,
  specialInstructions: String,
  preferredPaymentMethod: { type: String, enum: ['Google Pay', 'Apple Pay', 'Cash on Delivery', 'Credit/Debit Card'], default: 'Cash on Delivery' },
  password: { type: String, default: null },
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },
});

// Compound index for common query patterns
userSchema.index({ firebaseUid: 1, email: 1 });

// Middleware to keep defaultAddress in sync with addresses array
userSchema.pre('save', function(next) {
  if (this.addresses && this.addresses.length > 0) {
    const def = this.addresses.find(a => a.isDefault);
    if (def) {
      this.defaultAddress = [def.street, def.city, def.state, def.postalCode].filter(Boolean).join(', ');
    }
  }
  next();
});

// Cleanup middleware when user is deleted
userSchema.pre('remove', async function(next) {
  try {
    // Delete all orders associated with this user
    await this.model('Order').deleteMany({ userFirebaseUid: this.firebaseUid });
    next();
  } catch (error) {
    next(error);
  }
});

export default mongoose.model('User', userSchema); 