import express, { Request, Response } from 'express';
const router = express.Router();

// Get all orders
router.get('/', async (_req: Request, res: Response) => {
  try {
    // TODO: Implement orders retrieval from database
    res.json([]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

export default router; 