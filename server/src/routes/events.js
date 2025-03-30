import express from 'express';
import { protect } from '../middleware/auth.js';
import Event from '../models/Event.js';
import Availability from '../models/Availability.js';

const router = express.Router();

// Create a new event
router.post('/', protect, async (req, res) => {
  try {
    const { title, backgroundColor, link, emails, description } = req.body;

    // Create the event with the required fields
    const event = await Event.create({
      title,
      backgroundColor,
      link,
      emails,
      description,
      createdBy: req.user._id
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get all events for the current user
router.get('/', protect, async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(400).json({ message: error.message });
  }
});

// Get a specific event
router.get('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update an event
router.put('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete an event
router.delete('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id
    });
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(400).json({ message: error.message });
  }
});

// Join event
router.post('/:id/join', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is already a participant
    const isParticipant = event.participants.some(
      p => p.user.toString() === req.user._id.toString()
    );

    if (isParticipant) {
      return res.status(400).json({ message: 'Already joined this event' });
    }

    // Add user to participants
    event.participants.push({
      user: req.user._id,
      status: 'pending'
    });

    await event.save();
    res.json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update participant status
router.put('/:id/participants/:userId', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is creator
    if (event.creator.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update participant status' });
    }

    const participant = event.participants.find(
      p => p.user.toString() === req.params.userId
    );

    if (!participant) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    participant.status = req.body.status;
    await event.save();

    res.json(event);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router; 