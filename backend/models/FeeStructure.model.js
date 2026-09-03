// backend/src/models/FeeStructure.js
import mongoose from 'mongoose';

const feeStructureSchema = new mongoose.Schema({
  // ==================== BASIC INFORMATION ====================
  structureId: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Fee structure name is required'],
    trim: true
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
  academicYear: {
    type: String,
    required: [true, 'Academic year is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Draft', 'Archived'],
    default: 'Draft'
  },
  effectiveFrom: {
    type: Date,
    default: Date.now
  },
  effectiveTo: {
    type: Date
  },

  // ==================== FEE CALCULATION METHOD ====================
  calculationMethod: {
    type: String,
    enum: ['Fixed Semester Fee', 'Per Credit Hour', 'Course Based', 'Mixed'],
    default: 'Course Based'
  },

  // ==================== COURSES ====================
  courses: {
    type: [{
      courseCode: {
        type: String,
        required: true,
        trim: true
      },
      courseName: {
        type: String,
        required: true,
        trim: true
      },
      creditHours: {
        type: Number,
        required: true,
        min: 1,
        max: 6
      },
      feePerCredit: {
        type: Number,
        required: true,
        min: 0
      },
      totalFee: {
        type: Number,
        required: true,
        min: 0
      },
      isCore: {
        type: Boolean,
        default: true
      }
    }],
    default: []
  },

  // ==================== ADDITIONAL FEE COMPONENTS ====================
  additionalFees: {
    type: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      type: {
        type: String,
        enum: ['Fixed', 'Percentage'],
        default: 'Fixed'
      },
      amount: {
        type: Number,
        default: 0
      },
      percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
      },
      description: {
        type: String,
        trim: true
      }
    }],
    default: []
  },

  // ==================== SCHOLARSHIP / DISCOUNT ====================
  discountEnabled: {
    type: Boolean,
    default: false
  },
  discount: {
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
    description: {
      type: String,
      trim: true
    }
  },

  // ==================== LATE PAYMENT / FINE ====================
  lateFeeEnabled: {
    type: Boolean,
    default: false
  },
  lateFee: {
    gracePeriod: {
      type: Number,
      default: 7,
      min: 0
    },
    type: {
      type: String,
      enum: ['Fixed Amount', 'Percentage'],
      default: 'Fixed Amount'
    },
    amount: {
      type: Number,
      default: 0,
      min: 0
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    maximumFee: {
      type: Number,
      default: 0,
      min: 0
    }
  },

  // ==================== PAYMENT SCHEDULE ====================
  paymentType: {
    type: String,
    enum: ['Full Payment', 'Installments'],
    default: 'Full Payment'
  },
  installments: {
    type: [{
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
      description: {
        type: String,
        trim: true
      }
    }],
    default: []
  },

  // ==================== ADDITIONAL NOTES ====================
  notes: {
    type: String,
    trim: true
  },

  // ==================== CALCULATED FIELDS ====================
  totalCourseFee: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAdditionalFee: {
    type: Number,
    default: 0,
    min: 0
  },
  grossTotal: {
    type: Number,
    default: 0,
    min: 0
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  finalPayable: {
    type: Number,
    default: 0,
    min: 0
  },

  // ==================== STATUS & AUDIT ====================
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
feeStructureSchema.index({ department: 1 });
feeStructureSchema.index({ program: 1 });
feeStructureSchema.index({ semester: 1 });
feeStructureSchema.index({ status: 1 });
feeStructureSchema.index({ isActive: 1 });
feeStructureSchema.index({ createdAt: -1 });
feeStructureSchema.index({ department: 1, program: 1, semester: 1 });

// ==================== PRE-SAVE MIDDLEWARE ====================
feeStructureSchema.pre('save', async function(next) {
  // Generate structure ID
  if (this.isNew && !this.structureId) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.structureId = `FS-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  // Calculate totals
  this.totalCourseFee = (this.courses || []).reduce((sum, course) => sum + (course.totalFee || 0), 0);
  this.totalAdditionalFee = (this.additionalFees || []).reduce((sum, fee) => {
    if (fee.type === 'Fixed') {
      return sum + (fee.amount || 0);
    } else {
      return sum + (this.totalCourseFee * (fee.percentage || 0) / 100);
    }
  }, 0);
  this.grossTotal = this.totalCourseFee + this.totalAdditionalFee;

  // Calculate discount
  if (this.discountEnabled && this.discount && this.discount.value > 0) {
    const applicableAmount = this.discount.applicableTo === 'Tuition Fee' 
      ? this.totalCourseFee 
      : this.grossTotal;
    
    this.discountAmount = this.discount.type === 'Percentage'
      ? (applicableAmount * this.discount.value / 100)
      : this.discount.value;
  } else {
    this.discountAmount = 0;
  }

  this.finalPayable = Math.max(0, this.grossTotal - this.discountAmount);

  next();
});

// ==================== PRE-UPDATE MIDDLEWARE ====================
feeStructureSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  
  // If courses or additional fees are being updated, recalculate totals
  if (update.courses || update.additionalFees || update.discountEnabled || update.discount) {
    // We need to fetch the current document to recalculate properly
    // This is handled in the controller
  }
  
  next();
});

// ==================== INSTANCE METHODS ====================

// Recalculate totals for the structure
feeStructureSchema.methods.recalculateTotals = function() {
  this.totalCourseFee = (this.courses || []).reduce((sum, course) => sum + (course.totalFee || 0), 0);
  this.totalAdditionalFee = (this.additionalFees || []).reduce((sum, fee) => {
    if (fee.type === 'Fixed') {
      return sum + (fee.amount || 0);
    } else {
      return sum + (this.totalCourseFee * (fee.percentage || 0) / 100);
    }
  }, 0);
  this.grossTotal = this.totalCourseFee + this.totalAdditionalFee;

  if (this.discountEnabled && this.discount && this.discount.value > 0) {
    const applicableAmount = this.discount.applicableTo === 'Tuition Fee' 
      ? this.totalCourseFee 
      : this.grossTotal;
    
    this.discountAmount = this.discount.type === 'Percentage'
      ? (applicableAmount * this.discount.value / 100)
      : this.discount.value;
  } else {
    this.discountAmount = 0;
  }

  this.finalPayable = Math.max(0, this.grossTotal - this.discountAmount);
  
  return this;
};

// Get course count
feeStructureSchema.methods.getCourseCount = function() {
  return (this.courses || []).length;
};

// Get total credit hours
feeStructureSchema.methods.getTotalCreditHours = function() {
  return (this.courses || []).reduce((sum, course) => sum + (course.creditHours || 0), 0);
};

// Check if structure is active
feeStructureSchema.methods.isStructureActive = function() {
  return this.status === 'Active' && this.isActive === true;
};

// Check if structure is expired
feeStructureSchema.methods.isExpired = function() {
  if (!this.effectiveTo) return false;
  return new Date() > this.effectiveTo;
};

// ==================== STATIC METHODS ====================

// Get active structures
feeStructureSchema.statics.getActiveStructures = function() {
  return this.find({
    status: 'Active',
    isActive: true
  }).sort({ createdAt: -1 });
};

// Get structures by program and semester
feeStructureSchema.statics.getByProgramAndSemester = function(program, semester) {
  return this.find({
    program: program,
    semester: parseInt(semester),
    status: 'Active',
    isActive: true
  }).sort({ createdAt: -1 });
};

// Get structures for a student category
feeStructureSchema.statics.getByStudentCategory = function(category) {
  return this.find({
    studentCategory: category,
    status: 'Active',
    isActive: true
  }).sort({ createdAt: -1 });
};

// Get fee summary by program
feeStructureSchema.statics.getFeeSummaryByProgram = function(program) {
  return this.aggregate([
    { $match: { program: program, status: 'Active', isActive: true } },
    {
      $group: {
        _id: '$semester',
        totalStructures: { $sum: 1 },
        totalCourses: { $sum: { $size: '$courses' } },
        avgFee: { $avg: '$finalPayable' },
        minFee: { $min: '$finalPayable' },
        maxFee: { $max: '$finalPayable' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
};

// Get structure usage statistics
feeStructureSchema.statics.getUsageStats = function() {
  return this.aggregate([
    { $match: { status: 'Active', isActive: true } },
    {
      $group: {
        _id: '$department',
        totalStructures: { $sum: 1 },
        totalCourses: { $sum: { $size: '$courses' } },
        avgFee: { $avg: '$finalPayable' }
      }
    },
    { $sort: { totalStructures: -1 } }
  ]);
};

// ==================== VIRTUALS ====================
feeStructureSchema.virtual('courseCount').get(function() {
  return (this.courses || []).length;
});

feeStructureSchema.virtual('totalCreditHours').get(function() {
  return (this.courses || []).reduce((sum, course) => sum + (course.creditHours || 0), 0);
});

feeStructureSchema.virtual('isValid').get(function() {
  return this.status === 'Active' && this.isActive === true;
});

feeStructureSchema.virtual('isExpiredCheck').get(function() {
  if (!this.effectiveTo) return false;
  return new Date() > this.effectiveTo;
});

// ==================== OPTIONS ====================
feeStructureSchema.set('toJSON', { virtuals: true });
feeStructureSchema.set('toObject', { virtuals: true });

const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);
export default FeeStructure;