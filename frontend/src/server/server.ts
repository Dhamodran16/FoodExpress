import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import foodRoutes from './routes/foodItems';
import orderRoutes from './routes/orders';
import userRoutes from './routes/users';
import cartRoutes from './routes/cartItems';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI as string)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('Mongo error', err));

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../../dist')));

// API routes
app.use('/api/food-items', foodRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);

// Fallback route handler for client-side routing
app.use((req: Request, res: Response, next: NextFunction) => {
  // Don't handle API routes
  if (req.url.startsWith('/api/')) {
    return next();
  }
  
  // Send the React app's index.html for all other routes
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

// 404 handler for API routes
app.use('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
