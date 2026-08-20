import express from 'express';
import { auth } from '../middleware/auth.js';
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

const router = express.Router();

router.use(auth);

router.get('/', getAllBooks);
router.get('/stats/summary', getBookStats);
router.get('/isbn/:isbn', getBookByISBN);
router.get('/:id', getBookById);
router.post('/', createBook);
router.put('/:id', updateBook);
router.delete('/:id', deleteBook);

// Borrowing routes
router.post('/:id/borrow', borrowBook);
router.put('/borrowings/:id/return', returnBook);
router.get('/borrowings/:userId', getUserBorrowings);
router.get('/borrowings/all', getAllBorrowings);
router.put('/borrowings/:id/pay-fine', payFine);

export default router;