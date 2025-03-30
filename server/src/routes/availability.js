import express from 'express';
import { protect } from '../middleware/auth.js';
import Availability from '../models/Availability.js';

const router = express.Router();

// Get user's availability
router.get('/', protect, async (req, res) => {
  try {
    const availability = await Availability.find({ user: req.user._id });
    res.json(availability);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Set availability
router.post('/', protect, async (req, res) => {
  try {
    const { dayOfWeek, startTime, endTime, isAvailable, timezone } = req.body;

    // Check if availability already exists for this day
    const existingAvailability = await Availability.findOne({
      user: req.user._id,
      dayOfWeek
    });

    if (existingAvailability) {
      // Update existing availability
      existingAvailability.startTime = startTime;
      existingAvailability.endTime = endTime;
      existingAvailability.isAvailable = isAvailable;
      existingAvailability.timezone = timezone;
      await existingAvailability.save();
      return res.json(existingAvailability);
    }

    // Create new availability
    const availability = await Availability.create({
      user: req.user._id,
      dayOfWeek,
      startTime,
      endTime,
      isAvailable,
      timezone
    });

    res.status(201).json(availability);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update availability
router.put('/:id', protect, async (req, res) => {
  try {
    const availability = await Availability.findById(req.params.id);

    if (!availability) {
      return res.status(404).json({ message: 'Availability not found' });
    }

    // Check if user owns this availability
    if (availability.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this availability' });
    }

    const updatedAvailability = await Availability.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updatedAvailability);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete availability
router.delete('/:id', protect, async (req, res) => {
  try {
    const availability = await Availability.findById(req.params.id);

    if (!availability) {
      return res.status(404).json({ message: 'Availability not found' });
    }

    // Check if user owns this availability
    if (availability.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this availability' });
    }

    await availability.remove();
    res.json({ message: 'Availability removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get available time slots for a specific day
router.get('/slots/:date', protect, async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const dayOfWeek = date.getDay();

    const availability = await Availability.findOne({
      user: req.user._id,
      dayOfWeek,
      isAvailable: true
    });

    if (!availability) {
      return res.json([]);
    }

    // Generate time slots based on availability
    const slots = [];
    const start = new Date(date);
    const [startHour, startMinute] = availability.startTime.split(':');
    const [endHour, endMinute] = availability.endTime.split(':');

    start.setHours(parseInt(startHour), parseInt(startMinute), 0);
    const end = new Date(date);
    end.setHours(parseInt(endHour), parseInt(endMinute), 0);

    while (start < end) {
      slots.push(new Date(start));
      start.setMinutes(start.getMinutes() + 30);
    }

    res.json(slots);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router; 