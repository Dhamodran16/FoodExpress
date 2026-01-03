import express from 'express';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';
import Order from '../models/order.js';

const router = express.Router();

// Validation middleware
const validateOrder = [
  body('userId').isMongoId().withMessage('Invalid user ID'),
  body('items').isArray().withMessage('Items must be an array'),
  body('items.*.menuItemId').optional().isMongoId().withMessage('Invalid menu item ID'),
  body('items.*.name').notEmpty().withMessage('Item name is required'),
  body('items.*.price').isFloat({ min: 0 }).withMessage('Item price must be a positive number'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.restaurantName').notEmpty().withMessage('Restaurant name is required'),
  body('total').isFloat({ min: 0 }).withMessage('Total amount must be a positive number'),
  validateRequest
];

// Get all orders
router.get('/', async (req, res, next) => {
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

// Get orders by Firebase UID - Optimized with pagination
router.get('/firebase/:firebaseUid', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Use lean() for better performance and select only needed fields
    const orders = await Order.find({ userFirebaseUid: req.params.firebaseUid })
      .select('items total status orderNumber createdAt paymentMethod deliveryAddress')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Order.countDocuments({ userFirebaseUid: req.params.firebaseUid });

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
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

// Auto-update order status based on time elapsed
router.post('/:id/auto-update-status', async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only auto-update if order is in a progressing state
    if (!['processing', 'preparing', 'outForDelivery'].includes(order.status)) {
      return res.json(order);
    }

    const orderTime = new Date(order.createdAt);
    const now = new Date();
    const elapsedMinutes = (now.getTime() - orderTime.getTime()) / (1000 * 60);

    let newStatus = order.status;

    // Auto-progress status based on time elapsed
    // processing -> preparing (after 1 minute for faster progression)
    if (order.status === 'processing' && elapsedMinutes >= 1) {
      newStatus = 'preparing';
    }
    // preparing -> outForDelivery (after 5 minutes from order creation)
    else if (order.status === 'preparing' && elapsedMinutes >= 5) {
      newStatus = 'outForDelivery';
    }
    // outForDelivery -> delivered (after 15 minutes from order creation)
    else if (order.status === 'outForDelivery' && elapsedMinutes >= 15) {
      newStatus = 'delivered';
    }

    // Update status if it changed
    if (newStatus !== order.status) {
      order.status = newStatus;
      await order.save();
    }

    res.json(order);
  } catch (err) {
    next(err);
  }
});

// Update order status
router.patch('/:id',
  param('id').isMongoId().withMessage('Invalid order ID'),
  body('status').isIn(['pending', 'processing', 'preparing', 'outForDelivery', 'delivered', 'completed', 'cancelled'])
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