import mongoose from 'mongoose';
import Book from '../models/Book.js';
import Borrowing from '../models/Borrowing.js';

const normalizeUserRef = (value) => {
  if (!value) return undefined;
  if (mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return undefined;
};

// Get all books with filtering
export const getAllBooks = async (req, res) => {
  try {
    const { 
      category, 
      status, 
      author,
      search,
      department,
      location,
      hasEbook,
      limit = 50, 
      page = 1 
    } = req.query;
    
    const query = {};
    if (category) query.category = { $regex: category, $options: 'i' };
    if (status) query.status = status;
    if (author) query.authors = { $in: [new RegExp(author, 'i')] };
    if (department) query.department = department;
    if (location) query.location = { $regex: location, $options: 'i' };
    if (hasEbook) query.hasEbook = hasEbook === 'true';
    
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let findQuery = Book.find(query);
    if (search) {
      findQuery = findQuery.sort({ score: { $meta: 'textScore' } });
    } else {
      findQuery = findQuery.sort({ title: 1 });
    }
    
    const [books, total] = await Promise.all([
      findQuery.skip(skip).limit(parseInt(limit)).populate('createdBy', 'name email'),
      Book.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: books || [],
      pagination: {
        total: total || 0,
        page: parseInt(page) || 1,
        pages: Math.ceil((total || 0) / parseInt(limit)) || 0,
        limit: parseInt(limit) || 50
      }
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.json({
      success: false,
      data: [],
      pagination: {
        total: 0,
        page: 1,
        pages: 0,
        limit: 50
      },
      message: error.message || 'Failed to fetch books'
    });
  }
};

// Get single book by ID
export const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ 
        success: false, 
        message: 'Book not found',
        data: null
      });
    }
    
    res.json({ 
      success: true, 
      data: book 
    });
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch book',
      error: error.message,
      data: null
    });
  }
};

// Get book by ISBN
export const getBookByISBN = async (req, res) => {
  try {
    const { isbn } = req.params;
    const book = await Book.findOne({ isbn });
    
    if (!book) {
      return res.status(404).json({ 
        success: false, 
        message: 'Book not found',
        data: null
      });
    }
    
    res.json({ 
      success: true, 
      data: book 
    });
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch book',
      error: error.message,
      data: null
    });
  }
};

// Create new book
export const createBook = async (req, res) => {
  try {
    console.log('📝 Creating book with data:', req.body);
    
    const requiredFields = ['isbn', 'title', 'authors', 'category', 'location', 'shelf', 'totalCopies'];
    const missingFields = requiredFields.filter(field => !req.body[field] || req.body[field] === '');
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        data: null
      });
    }

    // Check for duplicate ISBN
    const existing = await Book.findOne({ isbn: req.body.isbn });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Book with this ISBN already exists',
        data: null
      });
    }

    const book = new Book({
      ...req.body,
      authors: Array.isArray(req.body.authors) ? req.body.authors : [req.body.authors],
      totalCopies: parseInt(req.body.totalCopies) || 1,
      availableCopies: parseInt(req.body.totalCopies) || 1,
      createdBy: normalizeUserRef(req.user?.id)
    });
    
    book.updateStatus();
    await book.save();
    
    console.log('✅ Book created successfully:', book.bookId);
    
    res.status(201).json({ 
      success: true, 
      data: book,
      message: `Book created successfully. ID: ${book.bookId}`
    });
  } catch (error) {
    console.error('❌ Error creating book:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors,
        data: null
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create book',
      error: error.message,
      data: null
    });
  }
};

// Update book
export const updateBook = async (req, res) => {
  try {
    console.log('📝 Updating book:', req.params.id);
    
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ 
        success: false, 
        message: 'Book not found',
        data: null
      });
    }

    const updateableFields = [
      'isbn', 'title', 'subtitle', 'authors', 'publisher', 'publishedYear',
      'edition', 'category', 'subCategory', 'department', 'course',
      'language', 'pages', 'format', 'location', 'shelf', 'rack',
      'totalCopies', 'availableCopies', 'reservedCopies', 'lostCopies',
      'isActive', 'isReference', 'hasEbook', 'ebookUrl', 'hasAudioBook',
      'description', 'tags'
    ];
    
    updateableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        const value = req.body[field];
        
        if (field === 'totalCopies' || field === 'availableCopies' || field === 'reservedCopies' || field === 'lostCopies') {
          book[field] = parseInt(value) || 0;
        } else if (field === 'publishedYear' || field === 'pages') {
          book[field] = parseInt(value) || 0;
        } else if (field === 'authors') {
          book[field] = Array.isArray(value) ? value : [value];
        } else if (field === 'tags') {
          book[field] = Array.isArray(value) ? value : value.split(',').map(t => t.trim());
        } else {
          book[field] = value;
        }
      }
    });

    book.updateStatus();
    book.updatedBy = normalizeUserRef(req.user?.id);
    await book.save();
    
    console.log('✅ Book updated successfully:', book.bookId);
    
    res.json({ 
      success: true, 
      data: book,
      message: 'Book updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating book:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors,
        data: null
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update book',
      error: error.message,
      data: null
    });
  }
};

// Delete book
export const deleteBook = async (req, res) => {
  try {
    console.log('📝 Deleting book:', req.params.id);
    
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ 
        success: false, 
        message: 'Book not found'
      });
    }

    // Check if book is currently borrowed
    const activeBorrowings = await Borrowing.countDocuments({
      bookId: req.params.id,
      status: 'Active'
    });

    if (activeBorrowings > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete book. It has ${activeBorrowings} active borrowings.`
      });
    }

    await book.deleteOne();
    console.log('✅ Book deleted successfully:', book.bookId);
    
    res.json({ 
      success: true, 
      message: 'Book deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete book',
      error: error.message
    });
  }
};

// Get book statistics
export const getBookStats = async (req, res) => {
  try {
    const total = await Book.countDocuments() || 0;
    const available = await Book.countDocuments({ status: 'Available' }) || 0;
    const checkedOut = await Book.countDocuments({ status: 'Checked Out' }) || 0;
    const reserved = await Book.countDocuments({ status: 'Reserved' }) || 0;
    const lost = await Book.countDocuments({ status: 'Lost' }) || 0;

    // Get categories
    const categories = await Book.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        total,
        available,
        checkedOut,
        reserved,
        lost,
        categories: categories.map(c => ({ category: c._id, count: c.count }))
      }
    });
  } catch (error) {
    console.error('Error fetching book stats:', error);
    res.json({
      success: false,
      data: {
        total: 0,
        available: 0,
        checkedOut: 0,
        reserved: 0,
        lost: 0,
        categories: []
      },
      message: error.message || 'Failed to fetch statistics'
    });
  }
};

// Borrow a book
export const borrowBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userType, userDetails, dueDate, finePerDay = 10 } = req.body;
    
    console.log('📝 Borrowing book:', id);
    
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ 
        success: false, 
        message: 'Book not found'
      });
    }

    if (book.isReference) {
      return res.status(400).json({
        success: false,
        message: 'This is a reference book and cannot be checked out'
      });
    }

    if (book.availableCopies <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No copies available for borrowing'
      });
    }

    // Check if user already has this book borrowed
    const existingBorrowing = await Borrowing.findOne({
      bookId: id,
      userId: userId,
      status: 'Active'
    });

    if (existingBorrowing) {
      return res.status(400).json({
        success: false,
        message: 'You already have this book borrowed'
      });
    }

    // Create borrowing record
    const borrowing = new Borrowing({
      bookId: id,
      userId: userId,
      userType: userType || 'Student',
      userDetails: userDetails,
      dueDate: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days default
      status: 'Active',
      createdBy: req.user?.id || null
    });

    await borrowing.save();

    // Update book availability
    book.availableCopies -= 1;
    book.totalCheckouts += 1;
    book.updateStatus();
    await book.save();

    console.log('✅ Book borrowed successfully');
    
    res.status(201).json({ 
      success: true, 
      data: borrowing,
      message: `Book borrowed successfully. Due date: ${borrowing.dueDate.toLocaleDateString()}`
    });
  } catch (error) {
    console.error('❌ Error borrowing book:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to borrow book',
      error: error.message
    });
  }
};

// Return a book
export const returnBook = async (req, res) => {
  try {
    const { id } = req.params;
    const { condition, finePerDay = 10 } = req.body;
    
    console.log('📝 Returning book:', id);
    
    const borrowing = await Borrowing.findById(id);
    if (!borrowing) {
      return res.status(404).json({ 
        success: false, 
        message: 'Borrowing record not found'
      });
    }

    if (borrowing.status === 'Returned') {
      return res.status(400).json({
        success: false,
        message: 'Book already returned'
      });
    }

    borrowing.returnDate = new Date();
    borrowing.actualReturnDate = new Date();
    borrowing.condition = condition || 'Good';
    
    // Calculate fine
    borrowing.calculateFine(finePerDay);
    
    if (borrowing.fineAmount > 0) {
      borrowing.status = 'Overdue';
    } else {
      borrowing.status = 'Returned';
    }

    await borrowing.save();

    // Update book availability
    const book = await Book.findById(borrowing.bookId);
    if (book) {
      book.availableCopies += 1;
      book.updateStatus();
      await book.save();
    }

    console.log('✅ Book returned successfully');
    
    res.json({ 
      success: true, 
      data: borrowing,
      message: borrowing.fineAmount > 0 
        ? `Book returned with fine: PKR ${borrowing.fineAmount}`
        : 'Book returned successfully'
    });
  } catch (error) {
    console.error('❌ Error returning book:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to return book',
      error: error.message
    });
  }
};

// Get user's borrowed books
export const getUserBorrowings = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const borrowings = await Borrowing.find({ userId })
      .populate('bookId')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: borrowings
    });
  } catch (error) {
    console.error('Error fetching user borrowings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch borrowings',
      error: error.message
    });
  }
};

// Get all borrowings
export const getAllBorrowings = async (req, res) => {
  try {
    const { status, search, limit = 50, page = 1 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    
    if (search) {
      query.$or = [
        { 'userDetails.name': { $regex: search, $options: 'i' } },
        { 'userDetails.email': { $regex: search, $options: 'i' } },
        { 'userDetails.registrationNo': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [borrowings, total] = await Promise.all([
      Borrowing.find(query)
        .populate('bookId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Borrowing.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: borrowings || [],
      pagination: {
        total: total || 0,
        page: parseInt(page) || 1,
        pages: Math.ceil((total || 0) / parseInt(limit)) || 0,
        limit: parseInt(limit) || 50
      }
    });
  } catch (error) {
    console.error('Error fetching borrowings:', error);
    res.json({
      success: false,
      data: [],
      pagination: {
        total: 0,
        page: 1,
        pages: 0,
        limit: 50
      },
      message: error.message || 'Failed to fetch borrowings'
    });
  }
};

// Pay fine
export const payFine = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;
    
    const borrowing = await Borrowing.findById(id);
    if (!borrowing) {
      return res.status(404).json({ 
        success: false, 
        message: 'Borrowing record not found'
      });
    }

    if (borrowing.finePaid) {
      return res.status(400).json({
        success: false,
        message: 'Fine already paid'
      });
    }

    if (borrowing.fineAmount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fine to pay'
      });
    }

    borrowing.finePaid = true;
    borrowing.finePaidDate = new Date();
    borrowing.status = 'Returned';
    await borrowing.save();

    console.log('✅ Fine paid successfully');
    
    res.json({ 
      success: true, 
      data: borrowing,
      message: `Fine of PKR ${borrowing.fineAmount} paid successfully`
    });
  } catch (error) {
    console.error('Error paying fine:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to pay fine',
      error: error.message
    });
  }
};