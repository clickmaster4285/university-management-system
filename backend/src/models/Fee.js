import mongoose from 'mongoose';

const feeSchema = new mongoose.Schema({
  // Basic Information
  feeId: {
    type: String,
    unique: true
  },
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    trim: true
  },
  studentName: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true
  },
  studentEmail: {
    type: String,
    required: [true, 'Student email is required'],
    trim: true,
    lowercase: true
  },
  studentRegistrationNo: {
    type: String,
    trim: true,
    default: '',
    required: false // Made optional
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  program: {
    type: String,
    required: [true, 'Program is required'],
    trim: true
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    min: 1,
    max: 8
  },

  // Fee Details
  feeType: {
    type: String,
    enum: ['Tuition', 'Hostel', 'Transport', 'Library', 'Sports', 'Lab', 'Other'],
    required: [true, 'Fee type is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  paidDate: {
    type: Date
  },

  // Payment Details
  paymentMethod: {
    type: String,
    enum: ['Cash', 'Bank Transfer', 'Stripe', 'JazzCash', 'EasyPaisa', 'Cheque', 'Other'],
    default: 'Cash'
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending', 'Partial', 'Overdue', 'Scholarship', 'Waived'],
    default: 'Pending'
  },
  transactionId: {
    type: String,
    trim: true
  },
  paymentReference: {
    type: String,
    trim: true
  },

  // Scholarship Details
  isScholarship: {
    type: Boolean,
    default: false
  },
  scholarshipPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  scholarshipAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  scholarshipType: {
    type: String,
    enum: ['Merit', 'Need-based', 'Sports', 'Other'],
    default: 'Merit'
  },

  // Installment Details
  isInstallment: {
    type: Boolean,
    default: false
  },
  installmentCount: {
    type: Number,
    default: 1,
    min: 1
  },
  installmentPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  installmentDetails: [{
    installmentNumber: Number,
    amount: Number,
    dueDate: Date,
    paidDate: Date,
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Overdue'],
      default: 'Pending'
    }
  }],

  // Late Fee
  lateFee: {
    type: Number,
    default: 0,
    min: 0
  },
  lateFeeApplied: {
    type: Boolean,
    default: false
  },
  lateFeeAppliedDate: {
    type: Date
  },

  // Invoice
  invoiceNumber: {
    type: String,
    trim: true
  },
  invoiceGenerated: {
    type: Boolean,
    default: false
  },
  invoiceGeneratedDate: {
    type: Date
  },

  // Additional
  remarks: {
    type: String,
    trim: true
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
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
feeSchema.index({ studentId: 1 });
feeSchema.index({ studentName: 1 });
feeSchema.index({ studentEmail: 1 });
feeSchema.index({ paymentStatus: 1 });
feeSchema.index({ dueDate: 1 });
feeSchema.index({ feeId: 1 });

// Pre-save middleware to generate fee ID and calculate amounts
feeSchema.pre('save', async function(next) {
  if (this.isNew && !this.feeId) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.feeId = `FEE-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  // Calculate remaining amount
  this.remainingAmount = this.amount - this.paidAmount - this.scholarshipAmount;

  // Update status based on payment
  if (this.remainingAmount <= 0) {
    this.paymentStatus = 'Paid';
  } else if (this.paidAmount > 0 && this.remainingAmount > 0) {
    this.paymentStatus = 'Partial';
  } else if (new Date(this.dueDate) < new Date() && this.remainingAmount > 0) {
    this.paymentStatus = 'Overdue';
  }

  next();
});

// Method to apply late fee
feeSchema.methods.applyLateFee = function(lateFeePercentage = 5) {
  if (this.paymentStatus === 'Paid') return;
  
  const now = new Date();
  if (now > this.dueDate && this.remainingAmount > 0) {
    this.lateFee = (this.remainingAmount * lateFeePercentage) / 100;
    this.lateFeeApplied = true;
    this.lateFeeAppliedDate = now;
    return true;
  }
  return false;
};

const Fee = mongoose.model('Fee', feeSchema);
export default Fee;