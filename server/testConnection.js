import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Log the connection string (without printing the full password)
const connectionStr = process.env.MONGODB_URI;
console.log('Connection string:', connectionStr ? connectionStr.replace(/:[^:]*@/, ':****@') : 'undefined');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas!');
    // Close connection after successful test
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('MongoDB connection error details:', err);
  }); 