import express from 'express';
import Restaurant from '../models/Restaurant.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get all restaurants - Optimized for production
router.get('/', async (req, res, next) => {
  try {
    // Use lean() for read-only queries (faster, returns plain JS objects)
    // Only fetch active restaurants and select only needed fields
    const restaurants = await Restaurant.find({ isActive: true })
      .select('name cuisine rating deliveryTime minOrder distance image address isActive')
      .lean()
      .limit(100); // Limit results to prevent large payloads
    res.json(restaurants);
  } catch (err) {
    console.error('Error fetching restaurants:', err);
    next(err);
  }
});

// Get a single restaurant by ID - Optimized
router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid restaurant ID' });
    }

    const restaurant = await Restaurant.findById(req.params.id)
      .select('name cuisine rating deliveryTime minOrder distance image address isActive')
      .lean();
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json(restaurant);
  } catch (err) {
    console.error('Error fetching restaurant:', err);
    next(err);
  }
});

// Create a restaurant
router.post('/', async (req, res) => {
  const restaurant = new Restaurant(req.body);
  try {
    const newRestaurant = await restaurant.save();
    res.status(201).json(newRestaurant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a restaurant
router.put('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    Object.assign(restaurant, req.body);
    const updatedRestaurant = await restaurant.save();
    res.json(updatedRestaurant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a restaurant
router.delete('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    await restaurant.deleteOne();
    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Filter restaurants by cuisine
router.get('/cuisine/:cuisine', async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ cuisine: req.params.cuisine });
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search restaurants by name
router.get('/search/:query', async (req, res) => {
  try {
    const restaurants = await Restaurant.find({
      name: { $regex: req.params.query, $options: 'i' }
    });
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 