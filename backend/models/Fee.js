// backend/src/models/Fee.js
import mongoose from 'mongoose';

const feeSchema = new mongoose.Schema({
  // ==================== BASIC INFORMATION ====================
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
    default: ''
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
  studentCategory: {
    type: String,
    enum: ['Regular', 'Self-Finance', 'Scholarship', 'International'],
    default: 'Regular'
  },

  // ==================== FEE STRUCTURE REFERENCE ====================
  feeStructureId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeStructure'
  },
  feeStructureName: {
    type: String,
    trim: true
  },

  // ==================== FEE BREAKDOWN ====================
  feeBreakdown: {
    courseFees: {
      type: Map,
      of: Number,
      default: {}
    },
    additionalFees: {
      type: Map,
      of: Number,
      default: {}
    },
    discountApplied: {
      type: Number,
      default: 0,
      min: 0
    },
    lateFeeApplied: {
      type: Number,
      default: 0,
      min: 0
    }
  },

  // ==================== FEE DETAILS ====================
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

  // ==================== PAYMENT DETAILS ====================
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
  paymentHistory: [{
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    method: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'Stripe', 'JazzCash', 'EasyPaisa', 'Cheque', 'Other'],
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    transactionId: {
      type: String,
      trim: true
    },
    reference: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
      default: 'Completed'
    },
    notes: {
      type: String,
      trim: true
    }
  }],

  // ==================== SCHOLARSHIP DETAILS ====================
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
  scholarshipReference: {
    type: String,
    trim: true
  },
  scholarshipApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  scholarshipApprovedDate: {
    type: Date
  },

  // ==================== INSTALLMENT DETAILS ====================
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
    installmentNumber: {
      type: Number,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    dueDate: {
      type: Date,
      required: true
    },
    paidDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Overdue', 'Partial'],
      default: 'Pending'
    },
    transactionId: {
      type: String,
      trim: true
    },
    paymentMethod: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    }
  }],

  // ==================== LATE FEE ====================
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
  lateFeeDetails: {
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    calculatedOn: {
      type: Date
    },
    notes: {
      type: String,
      trim: true
    }
  },

  // ==================== INVOICE ====================
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
  invoiceDetails: {
    template: {
      type: String,
      default: 'Standard'
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: {
      type: String,
      trim: true
    }
  },

  // ==================== DISCOUNT ====================
  discountApplied: {
    type: Number,
    default: 0,
    min: 0
  },
  discountDetails: {
    type: {
      type: String,
      enum: ['Percentage', 'Fixed'],
      default: 'Percentage'
    },
    value: {
      type: Number,
      default: 0,
      min: 0
    },
    applicableTo: {
      type: String,
      enum: ['Tuition Fee', 'Total Fee'],
      default: 'Tuition Fee'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedDate: {
      type: Date
    },
    notes: {
      type: String,
      trim: true
    }
  },

  // ==================== WAIVER ====================
  isWaived: {
    type: Boolean,
    default: false
  },
  waiverDetails: {
    reason: {
      type: String,
      enum: ['Financial Hardship', 'Medical', 'Academic Excellence', 'Other'],
      default: 'Other'
    },
    amount: {
      type: Number,
      default: 0,
      min: 0
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedDate: {
      type: Date
    },
    notes: {
      type: String,
      trim: true
    }
  },

  // ==================== REFUND ====================
  isRefunded: {
    type: Boolean,
    default: false
  },
  refundDetails: {
    amount: {
      type: Number,
      default: 0,
      min: 0
    },
    date: {
      type: Date
    },
    method: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'Cheque', 'Other'],
      default: 'Cash'
    },
    transactionId: {
      type: String,
      trim: true
    },
    reason: {
      type: String,
      trim: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedDate: {
      type: Date
    }
  },

  // ==================== ADDITIONAL ====================
  remarks: {
    type: String,
    trim: true
  },
  attachments: [{
    name: {
      type: String,
      trim: true
    },
    url: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      trim: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  notified: {
    type: Boolean,
    default: false
  },
  lastNotificationDate: {
    type: Date
  },

  // ==================== STATUS ====================
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },

  // ==================== AUDIT ====================
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// ==================== INDEXES ====================

feeSchema.index({ studentName: 1 });
feeSchema.index({ studentEmail: 1 });
feeSchema.index({ paymentStatus: 1 });
feeSchema.index({ dueDate: 1 });
feeSchema.index({ feeStructureId: 1 });
feeSchema.index({ program: 1 });
feeSchema.index({ semester: 1 });
feeSchema.index({ isActive: 1 });
feeSchema.index({ invoiceNumber: 1 });
feeSchema.index({ 'installmentDetails.dueDate': 1 });
feeSchema.index({ createdAt: -1 });

// ==================== PRE-SAVE MIDDLEWARE ====================
feeSchema.pre('save', async function(next) {
  // Generate fee ID
  if (this.isNew && !this.feeId) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.feeId = 'FEE-' + year + '-' + String(count + 1).padStart(5, '0');
  }

  // Calculate remaining amount
  const totalPaid = this.paidAmount || 0;
  const totalScholarship = this.scholarshipAmount || 0;
  const totalDiscount = this.discountApplied || 0;
  const totalLateFee = this.lateFee || 0;
  const totalWaived = this.waiverDetails?.amount || 0;
  
  this.remainingAmount = this.amount - totalPaid - totalScholarship - totalDiscount - totalWaived + totalLateFee;

  // Update payment status
  if (this.remainingAmount <= 0) {
    this.paymentStatus = 'Paid';
  } else if (this.paidAmount > 0 && this.remainingAmount > 0) {
    this.paymentStatus = 'Partial';
  } else if (new Date(this.dueDate) < new Date() && this.remainingAmount > 0) {
    this.paymentStatus = 'Overdue';
  }

  // Update scholarship amount if percentage is provided
  if (this.isScholarship && this.scholarshipPercentage > 0) {
    this.scholarshipAmount = (this.amount * this.scholarshipPercentage) / 100;
  }

  next();
});

// ==================== INSTANCE METHODS ====================

// Apply late fee
feeSchema.methods.applyLateFee = function(lateFeePercentage) {
  lateFeePercentage = lateFeePercentage || 5;
  
  if (this.paymentStatus === 'Paid') return false;
  
  const now = new Date();
  if (now > this.dueDate && this.remainingAmount > 0) {
    const feeAmount = (this.remainingAmount * lateFeePercentage) / 100;
    this.lateFee = feeAmount;
    this.lateFeeApplied = true;
    this.lateFeeAppliedDate = now;
    this.lateFeeDetails = {
      percentage: lateFeePercentage,
      calculatedOn: now,
      notes: 'Late fee applied automatically'
    };
    this.remainingAmount = this.remainingAmount + feeAmount;
    return true;
  }
  return false;
};

// Record payment
feeSchema.methods.recordPayment = function(paymentData) {
  const { amount, method, transactionId, reference, notes } = paymentData;
  
  // Update payment history
  this.paymentHistory.push({
    amount: amount,
    method: method || this.paymentMethod || 'Cash',
    date: new Date(),
    transactionId: transactionId,
    reference: reference,
    notes: notes,
    status: 'Completed'
  });
  
  // Update paid amount
  this.paidAmount = (this.paidAmount || 0) + amount;
  
  // Update transaction details
  if (transactionId) this.transactionId = transactionId;
  if (reference) this.paymentReference = reference;
  this.paymentMethod = method || this.paymentMethod || 'Cash';
  this.paidDate = new Date();
  
  // Update installment if applicable
  if (this.isInstallment && this.installmentDetails && this.installmentDetails.length > 0) {
    let paymentLeft = amount;
    for (let i = this.installmentPaid || 0; i < this.installmentDetails.length && paymentLeft > 0; i++) {
      const installment = this.installmentDetails[i];
      if (installment.status === 'Pending' || installment.status === 'Partial') {
        const paidForInstallment = Math.min(paymentLeft, installment.amount - (installment.paidAmount || 0));
        installment.paidAmount = (installment.paidAmount || 0) + paidForInstallment;
        installment.paidDate = new Date();
        installment.status = installment.paidAmount >= installment.amount ? 'Paid' : 'Partial';
        installment.transactionId = transactionId || installment.transactionId;
        installment.paymentMethod = method || installment.paymentMethod;
        paymentLeft -= paidForInstallment;
        if (installment.status === 'Paid') {
          this.installmentPaid = i + 1;
        }
      }
    }
  }
  
  // Recalculate remaining amount
  this.remainingAmount = this.amount - this.paidAmount - this.scholarshipAmount - this.discountApplied - (this.waiverDetails?.amount || 0) + this.lateFee;
  
  // Update status
  if (this.remainingAmount <= 0) {
    this.paymentStatus = 'Paid';
  } else if (this.paidAmount > 0 && this.remainingAmount > 0) {
    this.paymentStatus = 'Partial';
  }
  
  return this;
};

// Generate invoice number
feeSchema.methods.generateInvoice = function() {
  if (this.invoiceGenerated) {
    return this.invoiceNumber;
  }
  
  const year = new Date().getFullYear();
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  this.invoiceNumber = 'INV-' + year + '-' + random;
  this.invoiceGenerated = true;
  this.invoiceGeneratedDate = new Date();
  this.invoiceDetails = {
    ...this.invoiceDetails,
    generatedBy: this._id
  };
  return this.invoiceNumber;
};

// ==================== STATIC METHODS ====================

// Get fee summary by student
feeSchema.statics.getStudentFeeSummary = function(studentId) {
  return this.aggregate([
    { $match: { studentId: studentId } },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        totalPaid: { $sum: '$paidAmount' },
        totalRemaining: { $sum: '$remainingAmount' },
        totalScholarship: { $sum: '$scholarshipAmount' },
        totalLateFee: { $sum: '$lateFee' },
        count: { $sum: 1 }
      }
    }
  ]);
};

// Get overdue fees
feeSchema.statics.getOverdueFees = function() {
  return this.find({
    dueDate: { $lt: new Date() },
    paymentStatus: { $in: ['Pending', 'Partial'] },
    remainingAmount: { $gt: 0 },
    isActive: true
  }).sort({ dueDate: 1 });
};

// Get fee statistics by program
feeSchema.statics.getProgramFeeStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$program',
        totalAmount: { $sum: '$amount' },
        totalPaid: { $sum: '$paidAmount' },
        totalRemaining: { $sum: '$remainingAmount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);
};

// ==================== VIRTUALS ====================
feeSchema.virtual('isOverdue').get(function() {
  return this.remainingAmount > 0 && new Date(this.dueDate) < new Date();
});

feeSchema.virtual('isFullyPaid').get(function() {
  return this.remainingAmount <= 0;
});

feeSchema.virtual('paymentPercentage').get(function() {
  if (this.amount === 0) return 100;
  return Math.round(((this.amount - this.remainingAmount) / this.amount) * 100);
});

feeSchema.virtual('totalPaidIncludingScholarship').get(function() {
  return this.paidAmount + this.scholarshipAmount + this.discountApplied + (this.waiverDetails?.amount || 0);
});

// ==================== OPTIONS ====================
feeSchema.set('toJSON', { virtuals: true });
feeSchema.set('toObject', { virtuals: true });

const Fee = mongoose.model('Fee', feeSchema);
export default Fee;