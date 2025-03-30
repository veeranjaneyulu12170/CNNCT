import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cnnct-scheduler';

// Define User Schema
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  name: String,
  password: String,
  createdAt: Date
});

const User = mongoose.model('User', userSchema);

async function listUsers() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({}).select('-password');
    
    console.log('\nRegistered Users:');
    console.log('================');
    
    if (users.length === 0) {
      console.log('No users found in the database');
    } else {
      users.forEach((user, index) => {
        console.log(`\nUser ${index + 1}:`);
        console.log('Username:', user.username);
        console.log('Email:', user.email);
        console.log('Name:', user.name);
        console.log('ID:', user._id);
        console.log('Created at:', user.createdAt);
        console.log('----------------');
      });
      
      console.log(`\nTotal users: ${users.length}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

listUsers(); 