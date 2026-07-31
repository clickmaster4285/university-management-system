import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  // Basic Information
  eventId: {
    type: String,
    unique: true
  },
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true
  },
  
  // Event Type
  type: {
    type: String,
    enum: ['Seminar', 'Workshop', 'Conference', 'Sports', 'Cultural', 'Academic', 'Career Fair', 'Hackathon', 'Convocation', 'Other'],
    required: [true, 'Event type is required']
  },
  category: {
    type: String,
    enum: ['Academic', 'Sports', 'Cultural', 'Social', 'Career', 'Technical', 'Other'],
    required: [true, 'Event category is required']
  },
  
  // Date & Time
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required']
  },
  
  // Location
  venue: {
    type: String,
    required: [true, 'Venue is required'],
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  campus: {
    type: String,
    required: [true, 'Campus is required'],
    trim: true
  },
  
  // Organizer Information
  organizer: {
    type: String,
    required: [true, 'Organizer is required'],
    trim: true
  },
  organizerEmail: {
    type: String,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  organizerPhone: {
    type: String,
    trim: true
  },
  
  // Capacity & Registration
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: 1,
    default: 50
  },
  registeredCount: {
    type: Number,
    default: 0,
    min: 0
  },
  waitlistCount: {
    type: Number,
    default: 0,
    min: 0
  },
  registrationDeadline: {
    type: Date
  },
  isRegistrationRequired: {
    type: Boolean,
    default: true
  },
  registrationFee: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Event Features
  speakers: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    title: String,
    company: String,
    bio: String,
    email: String,
    photo: String
  }],
  
  schedule: [{
    time: String,
    activity: String,
    speaker: String,
    location: String
  }],
  
  // Event Status
  status: {
    type: String,
    enum: ['Upcoming', 'Ongoing', 'Completed', 'Cancelled', 'Postponed'],
    default: 'Upcoming'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  
  // Media
  imageUrl: {
    type: String,
    trim: true
  },
  bannerImage: {
    type: String,
    trim: true
  },
  gallery: [{
    url: String,
    caption: String
  }],
  
  // Documents
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  
  // Tags & Keywords
  tags: [{
    type: String,
    trim: true
  }],
  
  // Target Audience
  targetAudience: [{
    type: String,
    enum: ['Students', 'Faculty', 'Staff', 'Public', 'Industry', 'Alumni']
  }],
  
  // Statistics
  totalAttendees: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  
  // Additional
  prerequisites: {
    type: String,
    trim: true
  },
  dressCode: {
    type: String,
    trim: true
  },
  parkingInfo: {
    type: String,
    trim: true
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
eventSchema.index({ title: 'text', description: 'text', tags: 'text' });
eventSchema.index({ startDate: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ type: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ campus: 1 });
eventSchema.index({ eventId: 1 });

// Pre-save middleware to generate event ID
eventSchema.pre('save', async function(next) {
  if (this.isNew && !this.eventId) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.eventId = `EVT-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

// Method to check if event is upcoming
eventSchema.methods.isUpcoming = function() {
  const now = new Date();
  return this.startDate > now && this.status === 'Upcoming';
};

// Method to check if event is ongoing
eventSchema.methods.isOngoing = function() {
  const now = new Date();
  return this.startDate <= now && this.endDate >= now && this.status === 'Ongoing';
};

const Event = mongoose.model('Event', eventSchema);
export default Event;