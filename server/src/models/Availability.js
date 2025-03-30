import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dayOfWeek: {
    type: Number, // 0-6 (Sunday-Saturday)
    required: true
  },
  startTime: {
    type: String, // Format: "HH:mm"
    required: true
  },
  endTime: {
    type: String, // Format: "HH:mm"
    required: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  timezone: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
availabilitySchema.index({ user: 1, dayOfWeek: 1 });

// Method to check if a time slot is available
availabilitySchema.methods.isTimeSlotAvailable = function(startTime, endTime) {
  const slotStart = new Date(`1970-01-01T${startTime}`);
  const slotEnd = new Date(`1970-01-01T${endTime}`);
  const availabilityStart = new Date(`1970-01-01T${this.startTime}`);
  const availabilityEnd = new Date(`1970-01-01T${this.endTime}`);

  return slotStart >= availabilityStart && slotEnd <= availabilityEnd;
};

const Availability = mongoose.model('Availability', availabilitySchema);

export default Availability; 