// models/Finance.js
const mongoose = require('mongoose');

const financeSchema = new mongoose.Schema({
  // Revenue & Income
  revenueYTD: {
    type: Number,
    default: 0
  },
  expenses: {
    type: Number,
    default: 0
  },
  netIncome: {
    type: Number,
    default: 0
  },
  
  // Monthly financial data
  monthlyData: [{
    month: {
      type: String,
      required: true
    },
    revenue: {
      type: Number,
      default: 0
    },
    expenses: {
      type: Number,
      default: 0
    }
  }],
  
  // Budget allocation
  budgetAllocation: [{
    name: {
      type: String,
      required: true
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    amount: {
      type: Number,
      required: true
    }
  }],
  
  // Invoices
  invoices: [{
    invoiceId: {
      type: String,
      unique: true
    },
    vendor: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ['Paid', 'Pending', 'Overdue', 'Cancelled'],
      default: 'Pending'
    },
    dueDate: {
      type: Date
    },
    issuedDate: {
      type: Date,
      default: Date.now
    },
    description: {
      type: String
    },
    category: {
      type: String,
      enum: ['Salaries', 'Infrastructure', 'Research', 'Scholarships', 'Utilities', 'Marketing', 'Other'],
      default: 'Other'
    }
  }],
  
  // Financial year
  fiscalYear: {
    type: String,
    default: new Date().getFullYear().toString()
  },
  
  // Total invoices count
  totalInvoices: {
    type: Number,
    default: 0
  },
  
  // Metadata
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate invoice ID
financeSchema.pre('save', function(next) {
  if (this.invoices && this.invoices.length > 0) {
    this.invoices.forEach(invoice => {
      if (!invoice.invoiceId) {
        const year = new Date().getFullYear().toString().slice(-2);
        const count = this.invoices.length + 1;
        invoice.invoiceId = `INV-${year}-${String(count).padStart(4, '0')}`;
      }
    });
    this.totalInvoices = this.invoices.length;
  }
  next();
});

// Calculate totals
financeSchema.methods.calculateTotals = function() {
  let totalRevenue = 0;
  let totalExpenses = 0;
  
  this.monthlyData.forEach(month => {
    totalRevenue += month.revenue || 0;
    totalExpenses += month.expenses || 0;
  });
  
  this.revenueYTD = totalRevenue;
  this.expenses = totalExpenses;
  this.netIncome = totalRevenue - totalExpenses;
  this.lastUpdated = new Date();
  
  return this.save();
};

module.exports = mongoose.model('Finance', financeSchema);