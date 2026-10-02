// backend/src/models/Notification.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  notificationId: {
    type: String,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['alert', 'broadcast', 'reminder', 'announcement', 'emergency'],
    default: 'announcement'
  },
  channel: {
    type: String,
    enum: ['email', 'sms', 'whatsapp', 'push', 'all'],
    default: 'email'
  },
  recipients: {
    type: [String],
    default: []
  },
  recipientCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'scheduled'],
    default: 'pending'
  },
  sentAt: {
    type: Date
  },
  deliveredCount: {
    type: Number,
    default: 0
  },
  failedCount: {
    type: Number,
    default: 0
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['academic', 'administrative', 'emergency', 'event', 'fee', 'general'],
    default: 'general'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  createdBy: {
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

notificationSchema.pre('save', function(next) {
  if (!this.notificationId) {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.notificationId = `NOT-${year}-${random}`;
  }
  next();
});

export default mongoose.model('Notification', notificationSchema);