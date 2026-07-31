// models/Payroll.js
const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  payrollId: {
    type: String,
    unique: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  employeeName: {
    type: String,
    required: true
  },
  month: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  baseSalary: {
    type: Number,
    required: true
  },
  allowances: {
    type: Number,
    default: 0
  },
  bonuses: {
    type: Number,
    default: 0
  },
  deductions: {
    tax: { type: Number, default: 0 },
    insurance: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  netPay: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Processed', 'Paid', 'Cancelled'],
    default: 'Draft'
  },
  paymentDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['Bank Transfer', 'Cash', 'Cheque'],
    default: 'Bank Transfer'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Calculate net pay before save
payrollSchema.pre('save', function(next) {
  const totalDeductions = (this.deductions.tax || 0) + 
                         (this.deductions.insurance || 0) + 
                         (this.deductions.other || 0);
  this.netPay = (this.baseSalary || 0) + (this.allowances || 0) + (this.bonuses || 0) - totalDeductions;
  
  if (!this.payrollId) {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.payrollId = `PR-${year}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Payroll', payrollSchema);