import express from 'express';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Availability from '../models/Availability.js';

const router = express.Router();

// Get user profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
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
      timezone: updatedUser.timezone
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete user account
router.delete('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.remove();
    res.json({ message: 'User account deleted' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get user's events
router.get('/events', protect, async (req, res) => {
  try {
    const events = await Event.find({
      $or: [
        { creator: req.user._id },
        { 'participants.user': req.user._id }
      ]
    })
    .populate('creator', 'name email')
    .populate('participants.user', 'name email')
    .sort({ startTime: 1 });

    res.json(events);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get user's availability
router.get('/availability', protect, async (req, res) => {
  try {
    const availability = await Availability.find({ user: req.user._id });
    res.json(availability);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router; 