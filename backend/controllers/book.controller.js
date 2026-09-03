import mongoose from 'mongoose';
import { handle } from "../utils/asyncHandler.js";

import { Book, Borrowing } from '../models/index.js';
const normalizeUserRef = (value) => {
  if (!value) return undefined;
  if (mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return undefined;
};

// Get all books with filtering
export const getAllBooks = handle(async (req, res) => {
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
  query.isDeleted = { $ne: true };
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
});

// Get single book by ID
export const getBookById = handle(async (req, res) => {
  const book = await Book.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  
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
});

// Get book by ISBN
export const getBookByISBN = handle(async (req, res) => {
  const { isbn } = req.params;
  const book = await Book.findOne({ isbn, isDeleted: { $ne: true } });
  
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
});

// Create new book
export const createBook = handle(async (req, res) => {
  
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
  const existing = await Book.findOne({ isbn: req.body.isbn, isDeleted: { $ne: true } });
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
  
  
  res.status(201).json({ 
    success: true, 
    data: book,
    message: `Book created successfully. ID: ${book.bookId}`
  });
});

// Update book
export const updateBook = handle(async (req, res) => {
  
  const book = await Book.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
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
  
  
  res.json({ 
    success: true, 
    data: book,
    message: 'Book updated successfully'
  });
});

// Delete book
export const deleteBook = handle(async (req, res) => {
  
  const book = await Book.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!book) {
    return res.status(404).json({ 
      success: false, 
      message: 'Book not found'
    });
  }

  // Check if book is currently borrowed
  const activeBorrowings = await Borrowing.countDocuments({
    bookId: req.params.id,
    status: 'Active',
    isDeleted: { $ne: true }
  });

  if (activeBorrowings > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete book. It has ${activeBorrowings} active borrowings.`
    });
  }

  await book.deleteOne();
  
  res.json({ 
    success: true, 
    message: 'Book deleted successfully' 
  });
});

// Get book statistics
export const getBookStats = handle(async (req, res) => {
  const total = await Book.countDocuments({ isDeleted: { $ne: true } }) || 0;
  const available = await Book.countDocuments({ status: 'Available', isDeleted: { $ne: true } }) || 0;
  const checkedOut = await Book.countDocuments({ status: 'Checked Out', isDeleted: { $ne: true } }) || 0;
  const reserved = await Book.countDocuments({ status: 'Reserved', isDeleted: { $ne: true } }) || 0;
  const lost = await Book.countDocuments({ status: 'Lost', isDeleted: { $ne: true } }) || 0;

  // Get categories
  const categories = await Book.aggregate([
    { $match: { isDeleted: { $ne: true } } },
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
});

// Borrow a book
export const borrowBook = handle(async (req, res) => {
  const { id } = req.params;
  const { userId, userType, userDetails, dueDate, finePerDay = 10 } = req.body;
  
  
  const book = await Book.findOne({ _id: id, isDeleted: { $ne: true } });
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
    status: 'Active',
    isDeleted: { $ne: true }
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

  
  res.status(201).json({ 
    success: true, 
    data: borrowing,
    message: `Book borrowed successfully. Due date: ${borrowing.dueDate.toLocaleDateString()}`
  });
});

// Return a book
export const returnBook = handle(async (req, res) => {
  const { id } = req.params;
  const { condition, finePerDay = 10 } = req.body;
  
  
  const borrowing = await Borrowing.findOne({ _id: id, isDeleted: { $ne: true } });
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
  const book = await Book.findOne({ _id: borrowing.bookId, isDeleted: { $ne: true } });
  if (book) {
    book.availableCopies += 1;
    book.updateStatus();
    await book.save();
  }

  
  res.json({ 
    success: true, 
    data: borrowing,
    message: borrowing.fineAmount > 0 
      ? `Book returned with fine: PKR ${borrowing.fineAmount}`
      : 'Book returned successfully'
  });
});

// Get user's borrowed books
export const getUserBorrowings = handle(async (req, res) => {
  const { userId } = req.params;
  
  const borrowings = await Borrowing.find({ userId, isDeleted: { $ne: true } })
    .populate('bookId')
    .sort({ createdAt: -1 });
  
  res.json({
    success: true,
    data: borrowings
  });
});

// Get all borrowings
export const getAllBorrowings = handle(async (req, res) => {
  const { status, search, limit = 50, page = 1 } = req.query;
  
  const query = {};
  query.isDeleted = { $ne: true };
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
});

// Pay fine
export const payFine = handle(async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;
  
  const borrowing = await Borrowing.findOne({ _id: id, isDeleted: { $ne: true } });
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

  
  res.json({ 
    success: true, 
    data: borrowing,
    message: `Fine of PKR ${borrowing.fineAmount} paid successfully`
  });
});
