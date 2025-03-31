import express from 'express';
import { protect } from '../middleware/auth.js';
import { generateToken } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Register user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, name } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      name
    });

    if (user) {
      // Generate token
      const token = generateToken(user._id);

      // Send response with token and user data
      res.status(201).json({
        _id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        token: token
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    console.log('Login request received with raw data:', { 
      email: email || 'not provided',
      username: username || 'not provided',
      hasPassword: !!password 
    });

    if (!email && !username) {
      console.log('Missing credentials: no email or username provided');
      return res.status(400).json({ message: 'Please provide email or username' });
    }

    if (!password) {
      console.log('Missing credentials: no password provided');
      return res.status(400).json({ message: 'Please provide password' });
    }

    // Create query based on what was provided
    const query = email ? { email } : { username };
    console.log('Attempting to find user with query:', query);

    // Find user by email or username
    const user = await User.findOne(query).select('+password');
    
    // Log the raw database response
    console.log('Database response:', user ? {
      found: true,
      id: user._id,
      username: user.username,
      hasPassword: !!user.password
    } : {
      found: false,
      query
    });

    if (!user) {
      console.log('User not found with query:', query);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    console.log('Password comparison:', {
      username: user.username,
      providedPassword: !!password,
      storedPasswordExists: !!user.password,
      isMatch
    });
    
    if (!isMatch) {
      console.log('Password mismatch for user:', user.username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log('Login successful, generating token for user:', user.username);

    // Create response data
    const responseData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      name: user.name,
      token: generateToken(user._id)
    };

    console.log('Sending response with user data (excluding token):', {
      _id: responseData._id,
      username: responseData.username,
      email: responseData.email,
      name: responseData.name
    });

    res.json(responseData);
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get user profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, email, password, timezone } = req.body;

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password;
    if (timezone) user.timezone = timezone;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      name: updatedUser.name,
      timezone: updatedUser.timezone,
      token: generateToken(updatedUser._id)
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get user by ID
router.get('/user/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router; 