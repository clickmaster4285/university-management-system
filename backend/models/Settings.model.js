// backend/src/models/Settings.js
import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  // University Profile
  universityName: {
    type: String,
    default: 'ScholarOS University'
  },
  shortCode: {
    type: String,
    default: 'SU'
  },
  contactEmail: {
    type: String,
    default: 'registrar@scholaros.edu'
  },
  phone: {
    type: String,
    default: '+92 51 111 111 111'
  },
  currency: {
    type: String,
    enum: ['PKR', 'USD', 'GBP', 'EUR', 'AED'],
    default: 'PKR'
  },
  language: {
    type: String,
    enum: ['en', 'ur', 'ar', 'zh'],
    default: 'en'
  },
  address: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  logo: {
    type: String,
    default: ''
  },

  // Preferences
  preferences: {
    darkMode: { type: Boolean, default: false },
    emailDigests: { type: Boolean, default: true },
    publicPortal: { type: Boolean, default: false },
    aiInsights: { type: Boolean, default: true },
    faceRecognitionAttendance: { type: Boolean, default: false }
  },

  // ✅ Campuses - Make sure this is defined correctly
  campuses: {
    type: [{
      name: {
        type: String,
        required: true
      },
      location: {
        type: String,
        default: ''
      },
      students: {
        type: Number,
        default: 0
      },
      staff: {
        type: Number,
        default: 0
      },
      isActive: {
        type: Boolean,
        default: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    default: []
  },

  // Integrations
  integrations: {
    email: {
      type: Object,
      default: {
        enabled: false,
        provider: '',
        apiKey: '',
        fromEmail: ''
      }
    },
    sms: {
      type: Object,
      default: {
        enabled: false,
        provider: '',
        apiKey: '',
        senderId: ''
      }
    },
    payment: {
      type: Object,
      default: {
        enabled: false,
        provider: '',
        apiKey: '',
        secretKey: ''
      }
    },
    lms: {
      type: Object,
      default: {
        enabled: false,
        provider: '',
        apiKey: '',
        baseUrl: ''
      }
    }
  },

  // Branding
  branding: {
    primaryColor: { type: String, default: '#6366f1' },
    secondaryColor: { type: String, default: '#8b5cf6' },
    accentColor: { type: String, default: '#ec4899' },
    fontFamily: { type: String, default: 'Inter' }
  },

  // Security
  security: {
    sessionTimeout: { type: Number, default: 60 },
    maxLoginAttempts: { type: Number, default: 5 },
    twoFactorAuth: { type: Boolean, default: false },
    passwordPolicy: {
      type: Object,
      default: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true
      }
    }
  },

  // Maintenance
  maintenance: {
    isEnabled: { type: Boolean, default: false },
    message: { type: String, default: 'We are currently performing maintenance. Please check back later.' },
    scheduledAt: { type: Date }
  },

  // Audit
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this();
    await settings.save();
  }
  return settings;
};

export default mongoose.model('Settings', settingsSchema);