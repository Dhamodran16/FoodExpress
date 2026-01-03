import express from 'express';
import MenuItem from '../models/MenuItem.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get all menu items - Optimized for production
router.get('/', async (req, res, next) => {
  try {
    // Only fetch available items, use lean() for performance, limit results
    const menuItems = await MenuItem.find({ isAvailable: true })
      .populate('restaurantId', 'name cuisine')
      .select('name description price category image isVegetarian isSpicy restaurantId')
      .lean()
      .limit(200); // Limit to prevent large payloads
    res.json(menuItems);
  } catch (error) {
    next(error);
  }
});

// Get menu items for a specific restaurant - Optimized
router.get('/restaurant/:restaurantId', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.restaurantId)) {
      return res.status(400).json({ message: 'Invalid restaurant ID' });
    }

    // Only fetch available items, use lean() and select only needed fields
    const menuItems = await MenuItem.find({ 
      restaurantId: req.params.restaurantId,
      isAvailable: true 
    })
      .select('name description price category image isVegetarian isSpicy')
      .lean();
    res.json(menuItems);
  } catch (err) {
    console.error('Error fetching menu items:', err);
    next(err);
  }
});

// Get a single menu item - Optimized
router.get('/:id', async (req, res, next) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id)
      .populate('restaurantId', 'name cuisine rating')
      .select('name description price category image isVegetarian isSpicy isAvailable restaurantId')
      .lean();
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    res.json(menuItem);
  } catch (error) {
    next(error);
  }
});

// Create a menu item
router.post('/', async (req, res) => {
  const menuItem = new MenuItem(req.body);
  try {
    const newMenuItem = await menuItem.save();
    res.status(201).json(newMenuItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a menu item
router.put('/:id', async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    Object.assign(menuItem, req.body);
    const updatedMenuItem = await menuItem.save();
    res.json(updatedMenuItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a menu item
router.delete('/:id', async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    await menuItem.deleteOne();
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Filter menu items by category - Optimized
router.get('/category/:category', async (req, res, next) => {
  try {
    const menuItems = await MenuItem.find({ 
      category: req.params.category,
      isAvailable: true 
    })
      .select('name description price category image isVegetarian isSpicy restaurantId')
      .lean()
      .limit(100);
    res.json(menuItems);
  } catch (error) {
    next(error);
  }
});

// Search menu items by name - Optimized
router.get('/search/:query', async (req, res, next) => {
  try {
    const menuItems = await MenuItem.find({
      name: { $regex: req.params.query, $options: 'i' },
      isAvailable: true
    })
      .select('name description price category image isVegetarian isSpicy restaurantId')
      .lean()
      .limit(50); // Limit search results
    res.json(menuItems);
  } catch (error) {
    next(error);
  }
});

export default router; 