import express, { Request, Response } from 'express';
const router = express.Router();

// Get all food items
router.get('/', async (_req: Request, res: Response) => {
  try {
    // TODO: Implement food items retrieval from database
    res.json([]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching food items' });
  }
});

export default router; 