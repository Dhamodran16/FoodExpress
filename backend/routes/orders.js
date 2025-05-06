import express from 'express';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';
import Order from '../models/order.js';

const router = express.Router();

// Validation middleware
const validateOrder = [
  body('userId').isMongoId().withMessage('Invalid user ID'),
  body('items').isArray().withMessage('Items must be an array'),
  body('items.*.menuItemId').isMongoId().withMessage('Invalid menu item ID'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('total').isFloat({ min: 0 }).withMessage('Total amount must be a positive number'),
  validateRequest
];

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().populate('userId', 'name email');
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// Get orders by user ID
router.get('/user/:userId', 
  param('userId').isMongoId().withMessage('Invalid user ID'),
  validateRequest,
  async (req, res, next) => {
    try {
      const orders = await Order.find({ userId: req.params.userId })
        .populate('userId', 'name email');
      res.json(orders);
    } catch (err) {
      next(err);
    }
  }
);

// Get orders by Firebase UID
router.get('/firebase/:firebaseUid', async (req, res, next) => {
  try {
    const orders = await Order.find({ userFirebaseUid: req.params.firebaseUid }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// Get all orders for a user (by firebaseUid)
router.get('/user/:firebaseUid', async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.params.firebaseUid }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// Get a single order by ID
router.get('/:orderId', async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    next(err);
  }
});

// Create a new order
router.post('/', validateOrder, async (req, res, next) => {
  try {
    const order = new Order(req.body);
    await order.save();
    console.log('Order saved:', order);
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

// Update order status
router.patch('/:id',
  param('id').isMongoId().withMessage('Invalid order ID'),
  body('status').isIn(['pending', 'processing', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  validateRequest,
  async (req, res, next) => {
    try {
      const order = await Order.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true }
      );
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      res.json(order);
    } catch (err) {
      next(err);
    }
  }
);

// Delete an order
router.delete('/:id',
  param('id').isMongoId().withMessage('Invalid order ID'),
  validateRequest,
  async (req, res, next) => {
    try {
      const order = await Order.findByIdAndDelete(req.params.id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      res.json({ message: 'Order deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;