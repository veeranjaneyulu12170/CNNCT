import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import availabilityRoutes from './routes/availability.js';
import userRoutes from './routes/users.js';

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration based on environment
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://cnnct-1.onrender.com', 'https://cnnct-scheduler.onrender.com', 'https://p2-ivory.vercel.app'] // Update with your actual frontend URLs
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Root route handler
app.get('/', (req, res) => {
  res.json({
    message: 'CNNCT Scheduler API',
    status: 'online',
    endpoints: {
      auth: '/api/auth',
      events: '/api/events',
      availability: '/api/availability',
      users: '/api/users'
    }
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/users', userRoutes);

// MongoDB Connection
console.log('Connecting to MongoDB at:', process.env.MONGODB_URI?.replace(/:[^:]*@/, ':****@'));
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`CORS origins: ${JSON.stringify(corsOptions.origin)}`);
}); 