import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  cuisine: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
    default: 0
  },
  deliveryTime: {
    type: String,
    required: true
  },
  minOrder: {
    type: Number,
    required: true,
    min: 0
  },
  distance: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String,
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound indexes for common query patterns
restaurantSchema.index({ isActive: 1, cuisine: 1 }); // For filtering active restaurants by cuisine
restaurantSchema.index({ isActive: 1, rating: -1 }); // For sorting active restaurants by rating

export default mongoose.model('Restaurant', restaurantSchema);