import express from 'express';
import FoodItem from '../model/FoodItem';

const router = express.Router();

router.get('/', async (_req: any, res: any) => {
  const items = await FoodItem.find();
  res.json(items);
});

export default router;
