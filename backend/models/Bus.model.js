import mongoose from 'mongoose';

const busSchema = new mongoose.Schema({
  // Basic Information
  busId: {
    type: String,
    unique: true
  },
  busNumber: {
    type: String,
    required: [true, 'Bus number is required'],
    unique: true,
    trim: true
  },
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true,
    trim: true
  },
  
  // Bus Details
  model: {
    type: String,
    required: [true, 'Bus model is required'],
    trim: true
  },
  make: {
    type: String,
    required: [true, 'Bus make is required'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'Manufacturing year is required'],
    min: 1980,
    max: new Date().getFullYear() + 1
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: 10,
    max: 80,
    default: 40
  },
  fuelType: {
    type: String,
    enum: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'],
    default: 'Diesel'
  },
  
  // Route Information
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  },
  routeName: {
    type: String,
    trim: true
  },
  
  // Driver Information
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  driverName: {
    type: String,
    trim: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Maintenance', 'Retired', 'On Route'],
    default: 'Active'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Maintenance
  lastMaintenanceDate: {
    type: Date
  },
  nextMaintenanceDate: {
    type: Date
  },
  maintenanceHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    description: {
      type: String,
      trim: true
    },
    cost: {
      type: Number,
      default: 0
    },
    type: {
      type: String,
      enum: ['Regular', 'Repair', 'Inspection', 'Accident', 'Other'],
      default: 'Regular'
    }
  }],
  
  // Fuel Tracking
  fuelLevel: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  fuelConsumption: {
    type: Number,
    default: 0,
    comment: 'Liters per 100km'
  },
  lastFuelRefill: {
    type: Date
  },
  
  // Tracking
  currentLocation: {
    latitude: Number,
    longitude: Number,
    lastUpdated: Date
  },
  speed: {
    type: Number,
    default: 0
  },
  
  // Statistics
  totalTrips: {
    type: Number,
    default: 0
  },
  totalKilometers: {
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
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

}, {
  timestamps: true
});

// Indexes
busSchema.index({ status: 1 });
busSchema.index({ routeId: 1 });

// Pre-save middleware to generate bus ID
busSchema.pre('save', async function(next) {
  if (this.isNew && !this.busId) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.busId = `BUS-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

const Bus = mongoose.model('Bus', busSchema);
export default Bus;