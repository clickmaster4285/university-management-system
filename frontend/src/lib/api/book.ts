import api from './axios';

export interface Book {
  _id?: string;
  bookId?: string;
  isbn: string;
  title: string;
  subtitle?: string;
  authors: string[];
  publisher?: string;
  publishedYear?: number;
  edition?: string;
  category: string;
  subCategory?: string;
  department?: string;
  course?: string;
  language?: string;
  pages?: number;
  format?: string;
  location: string;
  shelf: string;
  rack?: string;
  totalCopies: number;
  availableCopies: number;
  reservedCopies: number;
  lostCopies: number;
  status: string;
  isActive: boolean;
  isReference: boolean;
  hasEbook: boolean;
  ebookUrl?: string;
  hasAudioBook: boolean;
  description?: string;
  tags?: string[];
  totalCheckouts: number;
  totalReservations: number;
  rating: number;
  ratingCount: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Borrowing {
  _id?: string;
  borrowingId?: string;
  bookId: string | Book;
  userId: string;
  userType: string;
  userDetails: {
    name: string;
    email: string;
    registrationNo?: string;
    department?: string;
  };
  checkoutDate: string;
  dueDate: string;
  returnDate?: string;
  actualReturnDate?: string;
  fineAmount: number;
  finePaid: boolean;
  finePaidDate?: string;
  daysLate: number;
  status: string;
  renewalCount: number;
  maxRenewals: number;
  lastRenewalDate?: string;
  remarks?: string;
  condition?: string;
}

class BookAPI {
  private baseUrl = '/books';

  async getAll(params?: {
    category?: string;
    status?: string;
    author?: string;
    search?: string;
    department?: string;
    location?: string;
    hasEbook?: boolean;
    limit?: number;
    page?: number;
  }) {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
          }
        });
      }
      const url = queryParams.toString() ? `${this.baseUrl}?${queryParams}` : this.baseUrl;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching books:', error);
      throw error;
    }
  }

  async getById(id: string) {
    try {
      const response = await api.get(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching book:', error);
      throw error;
    }
  }

  async getByISBN(isbn: string) {
    try {
      const response = await api.get(`${this.baseUrl}/isbn/${isbn}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching book by ISBN:', error);
      throw error;
    }
  }

  async create(data: any) {
    try {
      const response = await api.post(this.baseUrl, data);
      return response.data;
    } catch (error) {
      console.error('Error creating book:', error);
      throw error;
    }
  }

  async update(id: string, data: any) {
    try {
      const response = await api.put(`${this.baseUrl}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating book:', error);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      const response = await api.delete(`${this.baseUrl}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting book:', error);
      throw error;
    }
  }

  async getStats() {
    try {
      const response = await api.get(`${this.baseUrl}/stats/summary`);
      return response.data;
    } catch (error) {
      console.error('Error fetching book stats:', error);
      throw error;
    }
  }

  async borrowBook(id: string, data: any) {
    try {
      const response = await api.post(`${this.baseUrl}/${id}/borrow`, data);
      return response.data;
    } catch (error) {
      console.error('Error borrowing book:', error);
      throw error;
    }
  }

  async returnBook(borrowingId: string, data: any) {
    try {
      const response = await api.put(`${this.baseUrl}/borrowings/${borrowingId}/return`, data);
      return response.data;
    } catch (error) {
      console.error('Error returning book:', error);
      throw error;
    }
  }

  async getUserBorrowings(userId: string) {
    try {
      const response = await api.get(`${this.baseUrl}/borrowings/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user borrowings:', error);
      throw error;
    }
  }

  async getAllBorrowings(params?: { status?: string; search?: string; limit?: number; page?: number }) {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
          }
        });
      }
      const url = queryParams.toString() ? `${this.baseUrl}/borrowings/all?${queryParams}` : `${this.baseUrl}/borrowings/all`;
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching all borrowings:', error);
      throw error;
    }
  }

  async payFine(borrowingId: string, amount: number) {
    try {
      const response = await api.put(`${this.baseUrl}/borrowings/${borrowingId}/pay-fine`, { amount });
      return response.data;
    } catch (error) {
      console.error('Error paying fine:', error);
      throw error;
    }
  }
}

export const bookAPI = new BookAPI();