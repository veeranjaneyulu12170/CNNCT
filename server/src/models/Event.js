import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  backgroundColor: {
    type: String,
    default: '#4A4A4A',
    trim: true
  },
  link: {
    type: String,
    required: true,
    trim: true
  },
  emails: [{
    type: String,
    required: true,
    trim: true
  }],
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Event = mongoose.model('Event', eventSchema);

export default Event; 