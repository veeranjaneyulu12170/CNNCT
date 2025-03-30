import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const listUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB successfully');

    // Find all users
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
    console.error('Error:', error.message);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

// Run the script
listUsers(); 