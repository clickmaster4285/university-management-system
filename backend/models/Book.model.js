import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema({
  // Basic Information
  bookId: {
    type: String,
    unique: true
  },
  isbn: {
    type: String,
    required: [true, 'ISBN is required'],
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    index: true
  },
  subtitle: {
    type: String,
    trim: true
  },
  authors: [{
    type: String,
    required: [true, 'At least one author is required'],
    trim: true
  }],
  publisher: {
    type: String,
    trim: true
  },
  publishedYear: {
    type: Number,
    min: 1000,
    max: new Date().getFullYear() + 1
  },
  edition: {
    type: String,
    trim: true
  },
  
  // Classification
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    index: true
  },
  subCategory: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  course: {
    type: String,
    trim: true
  },
  
  // Physical Details
  language: {
    type: String,
    default: 'English',
    trim: true
  },
  pages: {
    type: Number,
    min: 0
  },
  format: {
    type: String,
    enum: ['Hardcover', 'Paperback', 'E-book', 'Audio Book', 'Digital'],
    default: 'Paperback'
  },
  
  // Library Details
  location: {
    type: String,
    required: [true, 'Library location is required'],
    trim: true
  },
  shelf: {
    type: String,
    required: [true, 'Shelf number is required'],
    trim: true
  },
  rack: {
    type: String,
    trim: true
  },
  
  // Inventory
  totalCopies: {
    type: Number,
    required: [true, 'Total copies is required'],
    min: 0,
    default: 1
  },
  availableCopies: {
    type: Number,
    required: [true, 'Available copies is required'],
    min: 0,
    default: 1
  },
  reservedCopies: {
    type: Number,
    default: 0,
    min: 0
  },
  lostCopies: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Status
  status: {
    type: String,
    enum: ['Available', 'Partially Available', 'Checked Out', 'Reserved', 'Lost', 'Damaged', 'Under Repair'],
    default: 'Available'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isReference: {
    type: Boolean,
    default: false,
    comment: 'Reference books cannot be checked out'
  },
  
  // Digital Access
  hasEbook: {
    type: Boolean,
    default: false
  },
  ebookUrl: {
    type: String,
    trim: true
  },
  hasAudioBook: {
    type: Boolean,
    default: false
  },
  
  // Description
  description: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // Statistics
  totalCheckouts: {
    type: Number,
    default: 0
  },
  totalReservations: {
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
bookSchema.index({ title: 'text', authors: 'text', isbn: 'text', category: 'text', tags: 'text' });

bookSchema.index({ status: 1 });
bookSchema.index({ location: 1 });

// Pre-save middleware to generate book ID
bookSchema.pre('save', async function(next) {
  if (this.isNew && !this.bookId) {
    const year = new Date().getFullYear();
    const count = await this.constructor.countDocuments();
    this.bookId = `BK-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Method to check availability
bookSchema.methods.isAvailable = function() {
  return this.availableCopies > 0 && this.status === 'Available';
};

// Method to update status based on availability
bookSchema.methods.updateStatus = function() {
  if (this.lostCopies > 0 && this.availableCopies === 0 && this.reservedCopies === 0) {
    this.status = 'Lost';
  } else if (this.availableCopies === 0 && this.reservedCopies > 0) {
    this.status = 'Reserved';
  } else if (this.availableCopies === 0 && this.totalCopies > 0) {
    this.status = 'Checked Out';
  } else if (this.availableCopies > 0 && this.availableCopies < this.totalCopies) {
    this.status = 'Partially Available';
  } else if (this.availableCopies > 0) {
    this.status = 'Available';
  }
  return this;
};

const Book = mongoose.model('Book', bookSchema);
export default Book;