import express from 'express';
import {
  getAllBooks,
  getBookById,
  getBookByISBN,
  createBook,
  updateBook,
  deleteBook,
  getBookStats,
  borrowBook,
  returnBook,
  getUserBorrowings,
  getAllBorrowings,
  payFine
} from '../controllers/book.controller.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllBooks);
router.get('/stats/summary', getBookStats);
router.get('/isbn/:isbn', getBookByISBN);
router.get('/:id', getBookById);

// Protected routes
router.post('/', auth, createBook);
router.put('/:id', auth, updateBook);
router.delete('/:id', auth, deleteBook);

// Borrowing routes
router.post('/:id/borrow', auth, borrowBook);
router.put('/borrowings/:id/return', auth, returnBook);
router.get('/borrowings/:userId', auth, getUserBorrowings);
router.get('/borrowings/all', auth, getAllBorrowings);
router.put('/borrowings/:id/pay-fine', auth, payFine);

export default router;