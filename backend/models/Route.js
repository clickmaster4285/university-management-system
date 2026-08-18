import mongoose from 'mongoose';

const routeSchema = new mongoose.Schema({
  // Basic Information
  routeId: {
    type: String,
    unique: true
  },
  routeNumber: {
    type: String,
    required: [true, 'Route number is required'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Route name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  
  // Route Details
  startPoint: {
    type: String,
    required: [true, 'Start point is required'],
    trim: true
  },
  endPoint: {
    type: String,
    required: [true, 'End point is required'],
    trim: true
  },
  distance: {
    type: Number,
    required: [true, 'Distance in km is required'],
    min: 0
  },
  duration: {
    type: Number,
    required: [true, 'Duration in minutes is required'],
    min: 0
  },
  
  // Stops
  stops: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    order: {
      type: Number,
      required: true
    },
    latitude: Number,
    longitude: Number,
    timeFromStart: Number, // minutes from start
    fare: Number // fare to this stop
  }],
  
  // Schedule
  departureTimes: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    time: {
      type: String,
      required: true
    }
  }],
  
  // Bus Assignment
  assignedBusIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus'
  }],
  assignedBusNumbers: [{
    type: String,
    trim: true
  }],
  
  // Driver Assignment
  assignedDriverIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  }],
  
  // Fare
  baseFare: {
    type: Number,
    required: [true, 'Base fare is required'],
    min: 0,
    default: 50
  },
  farePerKm: {
    type: Number,
    min: 0,
    default: 10
  },
  
  // Status
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Suspended'],
    default: 'Active'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Type
  routeType: {
    type: String,
    enum: ['Local', 'Intercity', 'Airport', 'Campus', 'Student'],
    default: 'Campus'
  },
  
  // Statistics
  dailyRiders: {
    type: Number,
    default: 0
  },
  totalTrips: {
    type: Number,
    default: 0
  },
  
  // Audit
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
routeSchema.index({ startPoint: 1, endPoint: 1 });
routeSchema.index({ status: 1 });

// Pre-save middleware to generate route ID
routeSchema.pre('save', async function(next) {
  if (this.isNew && !this.routeId) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.routeId = `RTE-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

const Route = mongoose.model('Route', routeSchema);
export default Route;