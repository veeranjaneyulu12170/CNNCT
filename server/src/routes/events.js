import express from 'express';
import { protect } from '../middleware/auth.js';
import Event from '../models/Event.js';
import Availability from '../models/Availability.js';

const router = express.Router();

// Create a new event
router.post('/', protect, async (req, res) => {
  try {
    // Ensure required fields
    const { title, description, link, emails } = req.body;
    
    if (!title || !description || !link || !emails || !Array.isArray(emails)) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Create participants array from emails
    const participants = emails.map(email => ({
      email,
      status: 'Pending'
    }));
    
    // Set default status
    const status = req.body.status || 'Pending';
    
    // Parse meetingDetails safely
    let meetingDetails = req.body.meetingDetails;
    if (!meetingDetails) {
      try {
        meetingDetails = JSON.parse(description);
      } catch (err) {
        console.error('Error parsing description as meetingDetails:', err);
        meetingDetails = {
          date: '',
          time: '',
          duration: '',
          meetingType: '',
          hostName: '',
          eventTopic: title,
          description: description
        };
      }
    }
    
    // Create the event
    const event = await Event.create({
      ...req.body,
      user: req.user._id,
      createdBy: req.user._id,
      status,
      participants,
      meetingDetails,
      createdAt: new Date()
    });
    
    console.log('Created event:', event);
    
    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(400).json({ message: 'Failed to create event. Please check all required fields and try again.' });
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
    console.log('Incoming PUT request payload:', req.body);
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // If status is being updated to 'Accepted', update all participants
    if (req.body.status === 'Accepted') {
      event.status = 'Accepted';
      
      // Initialize participants array if it doesn't exist
      if (!event.participants) {
        event.participants = event.emails?.map(email => ({
          email,
          status: 'Accepted'
        })) || [];
      } else {
        event.participants = event.participants.map(participant => ({
          ...participant,
          status: 'Accepted'
        }));
      }
    } else if (req.body.participantUpdate) {
      // Handle single participant update
      const { email, status } = req.body.participantUpdate;
      const participant = event.participants.find(
        p => p.email === email || p.user?.email === email
      );

      if (participant) {
        participant.status = status;
      } else {
        event.participants.push({ email, status });
      }

      // Update event status if needed
      if (status === 'Accepted') {
        event.status = 'Accepted';
      } else if (status === 'Rejected' && 
                 event.participants.every(p => p.status === 'Rejected')) {
        event.status = 'Rejected';
      }
    } else {
      // Regular update
      Object.assign(event, req.body);
    }

    await event.save();
    await event.populate('participants.user', 'name email');
    
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

    // Find participant by either userId or email
    const participant = event.participants.find(
      p => p.user?.toString() === req.params.userId || p.email === req.params.userId
    );

    if (!participant) {
      // If participant not found, create a new one
      event.participants.push({
        email: req.params.userId,
        status: req.body.status
      });
    } else {
      // Update existing participant status
      participant.status = req.body.status;
    }
    
    // If participant is accepted, update event status to Accepted
    if (req.body.status === 'Accepted') {
      event.status = 'Accepted';
    }
    
    // If all participants are rejected, update event status to Rejected
    if (req.body.status === 'Rejected' && 
        event.participants.every(p => p.status === 'Rejected')) {
      event.status = 'Rejected';
    }

    await event.save();

    // Populate user details before sending response
    await event.populate('participants.user', 'name email');

    res.json(event);
  } catch (error) {
    console.error('Error updating participant status:', error);
    res.status(400).json({ message: error.message });
  }
});

export default router; 