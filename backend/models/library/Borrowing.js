import mongoose from 'mongoose';

const borrowingSchema = new mongoose.Schema({
  borrowingId: {
    type: String,
    unique: true
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userType: {
    type: String,
    enum: ['Student', 'Faculty', 'Staff', 'External'],
    required: true
  },
  userDetails: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    registrationNo: String,
    department: String
  },
  
  // Borrowing Details
  checkoutDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  returnDate: {
    type: Date
  },
  actualReturnDate: {
    type: Date
  },
  
  // Fine Details
  fineAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  finePaid: {
    type: Boolean,
    default: false
  },
  finePaidDate: {
    type: Date
  },
  daysLate: {
    type: Number,
    default: 0
  },
  
  // Status
  status: {
    type: String,
    enum: ['Active', 'Returned', 'Overdue', 'Lost', 'Renewed'],
    default: 'Active'
  },
  
  // Renewals
  renewalCount: {
    type: Number,
    default: 0,
    max: 2
  },
  maxRenewals: {
    type: Number,
    default: 2
  },
  lastRenewalDate: {
    type: Date
  },
  
  // Additional
  remarks: {
    type: String,
    trim: true
  },
  condition: {
    type: String,
    enum: ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged'],
    default: 'Good'
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
borrowingSchema.index({ bookId: 1 });
borrowingSchema.index({ userId: 1 });
borrowingSchema.index({ status: 1 });
borrowingSchema.index({ dueDate: 1 });


// Pre-save middleware to generate borrowing ID
borrowingSchema.pre('save', async function(next) {
  if (this.isNew && !this.borrowingId) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.borrowingId = `BOR-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Method to calculate fine
borrowingSchema.methods.calculateFine = function(finePerDay = 10) {
  if (this.returnDate) {
    const due = new Date(this.dueDate);
    const returned = new Date(this.returnDate);
    if (returned > due) {
      const diffTime = Math.abs(returned - due);
      this.daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      this.fineAmount = this.daysLate * finePerDay;
    } else {
      this.daysLate = 0;
      this.fineAmount = 0;
    }
  }
  return this;
};

const Borrowing = mongoose.model('Borrowing', borrowingSchema);
export default Borrowing;