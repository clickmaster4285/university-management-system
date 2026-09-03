import { useState, useEffect } from "react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { bookAPI, Book as BookType } from "@/features/book";
import { 
  Library, 
  BookOpen, 
  Users, 
  Clock,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Search,
  FileText,
  User,
  Database,
  X,
  Save,
  Loader2,
  AlertCircle,
  Book as BookIcon,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  PieChart,
  BookMarked,
  GraduationCap,
  Layers,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart as RePieChart, Pie, Cell, Legend, AreaChart, Area, Treemap } from "recharts";

// Constants
const bookCategories = ['Computer Science', 'Programming', 'Artificial Intelligence', 'Data Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Engineering', 'Business', 'Economics', 'Law', 'Medicine', 'Literature', 'History', 'Philosophy', 'Psychology', 'Education'];
const bookFormats = ['Hardcover', 'Paperback', 'E-book', 'Audio Book', 'Digital'];
const bookStatuses = ['Available', 'Partially Available', 'Checked Out', 'Reserved', 'Lost', 'Damaged', 'Under Repair'];
const departments = ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Business Administration', 'Economics', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English Literature', 'Psychology', 'Law', 'Medicine', 'Pharmacy', 'Architecture', 'Design', 'Fine Arts', 'Media Studies', 'Data Science'];

// Colors for charts
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#8b5cf6'];

// Types
interface CategoryStats {
  category?: string;
  _id?: string;
  count?: number;
}

export function LibraryPage() {
  const [books, setBooks] = useState<BookType[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<BookType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    isbn: '',
    title: '',
    subtitle: '',
    authors: '',
    publisher: '',
    publishedYear: new Date().getFullYear(),
    edition: '',
    category: '',
    subCategory: '',
    department: '',
    course: '',
    language: 'English',
    pages: 0,
    format: 'Paperback',
    location: '',
    shelf: '',
    rack: '',
    totalCopies: 1,
    availableCopies: 1,
    reservedCopies: 0,
    lostCopies: 0,
    isReference: false,
    hasEbook: false,
    ebookUrl: '',
    hasAudioBook: false,
    description: '',
    tags: '',
    status: 'Available'
  });

  // Fetch books
  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await bookAPI.getAll({ limit: 100 });
      
      let data: BookType[] = [];
      if (response && response.success) {
        data = response.data || [];
      } else if (response && response.data) {
        data = response.data || [];
      }
      
      setBooks(data);
      setFilteredBooks(data);
      
    } catch (error: any) {
      console.error('❌ Failed to fetch books:', error);
      if (error.message?.includes('NetworkError') || 
          error.message?.includes('Failed to fetch') ||
          error.code === 'ERR_NETWORK') {
        setError('Cannot connect to backend. Please check if server is running.');
      } else {
        setError(null);
      }
      setBooks([]);
      setFilteredBooks([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await bookAPI.getStats();
      
      if (response && response.success) {
        setStats(response.data);
      } else {
        setStats({
          total: 0,
          available: 0,
          checkedOut: 0,
          reserved: 0,
          lost: 0,
          categories: []
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStats({
        total: 0,
        available: 0,
        checkedOut: 0,
        reserved: 0,
        lost: 0,
        categories: []
      });
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchStats();
  }, []);

  // Prepare chart data - FIXED
  const getCategoryChartData = (): { name: string; value: number }[] => {
    if (!stats || !stats.categories) return [];
    return stats.categories.map((item: CategoryStats) => ({
      name: item.category || item._id || 'Other',
      value: item.count || 0
    }));
  };

  const getTopBooksData = (): { name: string; copies: number; available: number }[] => {
    return books.slice(0, 6).map((book) => ({
      name: book.title?.substring(0, 20) + (book.title?.length > 20 ? '...' : ''),
      copies: book.totalCopies || 0,
      available: book.availableCopies || 0
    }));
  };

  const getFormatDistribution = (): { name: string; value: number }[] => {
    const formats = ['Hardcover', 'Paperback', 'E-book', 'Audio Book', 'Digital'];
    return formats.map((format) => ({
      name: format,
      value: books.filter(b => b.format === format).length
    }));
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredBooks(books);
      return;
    }
    
    const searchLower = query.toLowerCase().trim();
    const filtered = books.filter(b => {
      const titleMatch = b.title?.toLowerCase().includes(searchLower) || false;
      const authorMatch = b.authors?.some(a => a.toLowerCase().includes(searchLower)) || false;
      const isbnMatch = b.isbn?.toLowerCase().includes(searchLower) || false;
      const categoryMatch = b.category?.toLowerCase().includes(searchLower) || false;
      const idMatch = b.bookId?.toLowerCase().includes(searchLower) || false;
      
      return titleMatch || authorMatch || isbnMatch || categoryMatch || idMatch;
    });
    
    setFilteredBooks(filtered);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'totalCopies' || name === 'availableCopies' || name === 'reservedCopies' || 
                name === 'lostCopies' || name === 'publishedYear' || name === 'pages'
          ? parseInt(value) || 0
          : value
      }));
    }
  };

  // Open add modal
  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      isbn: '',
      title: '',
      subtitle: '',
      authors: '',
      publisher: '',
      publishedYear: new Date().getFullYear(),
      edition: '',
      category: '',
      subCategory: '',
      department: '',
      course: '',
      language: 'English',
      pages: 0,
      format: 'Paperback',
      location: '',
      shelf: '',
      rack: '',
      totalCopies: 1,
      availableCopies: 1,
      reservedCopies: 0,
      lostCopies: 0,
      isReference: false,
      hasEbook: false,
      ebookUrl: '',
      hasAudioBook: false,
      description: '',
      tags: '',
      status: 'Available'
    });
    setIsModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (book: BookType) => {
    setIsEditMode(true);
    setEditingId(book._id || null);
    setFormData({
      isbn: book.isbn || '',
      title: book.title || '',
      subtitle: book.subtitle || '',
      authors: book.authors?.join(', ') || '',
      publisher: book.publisher || '',
      publishedYear: book.publishedYear || new Date().getFullYear(),
      edition: book.edition || '',
      category: book.category || '',
      subCategory: book.subCategory || '',
      department: book.department || '',
      course: book.course || '',
      language: book.language || 'English',
      pages: book.pages || 0,
      format: book.format || 'Paperback',
      location: book.location || '',
      shelf: book.shelf || '',
      rack: book.rack || '',
      totalCopies: book.totalCopies || 1,
      availableCopies: book.availableCopies || 1,
      reservedCopies: book.reservedCopies || 0,
      lostCopies: book.lostCopies || 0,
      isReference: book.isReference || false,
      hasEbook: book.hasEbook || false,
      ebookUrl: book.ebookUrl || '',
      hasAudioBook: book.hasAudioBook || false,
      description: book.description || '',
      tags: book.tags?.join(', ') || '',
      status: book.status || 'Available'
    });
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingId(null);
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      const requiredFields = ['isbn', 'title', 'category', 'location', 'shelf', 'totalCopies'];
      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
      
      if (missingFields.length > 0) {
        toast.error(`Please fill all required fields: ${missingFields.join(', ')}`);
        setIsSubmitting(false);
        return;
      }

      const bookData = {
        isbn: formData.isbn.trim(),
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        authors: formData.authors.split(',').map(a => a.trim()).filter(a => a),
        publisher: formData.publisher.trim(),
        publishedYear: Number(formData.publishedYear),
        edition: formData.edition.trim(),
        category: formData.category.trim(),
        subCategory: formData.subCategory.trim(),
        department: formData.department.trim(),
        course: formData.course.trim(),
        language: formData.language.trim(),
        pages: Number(formData.pages),
        format: formData.format,
        location: formData.location.trim(),
        shelf: formData.shelf.trim(),
        rack: formData.rack.trim(),
        totalCopies: Number(formData.totalCopies),
        availableCopies: Number(formData.availableCopies),
        reservedCopies: Number(formData.reservedCopies),
        lostCopies: Number(formData.lostCopies),
        isReference: formData.isReference,
        hasEbook: formData.hasEbook,
        ebookUrl: formData.ebookUrl.trim(),
        hasAudioBook: formData.hasAudioBook,
        description: formData.description.trim(),
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        status: formData.status
      };

      let response;
      if (isEditMode && editingId) {
        response = await bookAPI.update(editingId, bookData);
        if (response && response.success) {
          toast.success(`Book updated successfully!`);
        } else {
          toast.error(response?.message || 'Failed to update book');
          setIsSubmitting(false);
          return;
        }
      } else {
        response = await bookAPI.create(bookData);
        if (response && response.success) {
          toast.success(`Book created successfully! ID: ${response.data?.bookId || 'generated'}`);
        } else {
          toast.error(response?.message || 'Failed to create book');
          setIsSubmitting(false);
          return;
        }
      }
      
      closeModal();
      setFormData({
        isbn: '',
        title: '',
        subtitle: '',
        authors: '',
        publisher: '',
        publishedYear: new Date().getFullYear(),
        edition: '',
        category: '',
        subCategory: '',
        department: '',
        course: '',
        language: 'English',
        pages: 0,
        format: 'Paperback',
        location: '',
        shelf: '',
        rack: '',
        totalCopies: 1,
        availableCopies: 1,
        reservedCopies: 0,
        lostCopies: 0,
        isReference: false,
        hasEbook: false,
        ebookUrl: '',
        hasAudioBook: false,
        description: '',
        tags: '',
        status: 'Available'
      });
      setSearchQuery('');
      
      await fetchBooks();
      await fetchStats();
      
    } catch (error: any) {
      console.error('❌ Failed to save book:', error);
      
      let errorMsg = isEditMode ? 'Failed to update book' : 'Failed to create book';
      
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message?.includes('NetworkError') || error.message?.includes('Failed to fetch')) {
        errorMsg = 'Network error. Please check if backend server is running.';
      }
      
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) return;
    
    try {
      const response = await bookAPI.delete(id);
      if (response && response.success) {
        toast.success(`Book deleted successfully`);
        await fetchBooks();
        await fetchStats();
      } else {
        toast.error(response?.message || 'Failed to delete book');
      }
    } catch (error) {
      console.error('Failed to delete book:', error);
      toast.error('Failed to delete book');
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      'Available': { className: 'bg-green-500/15 text-green-600 border-0', label: 'Available' },
      'Partially Available': { className: 'bg-yellow-500/15 text-yellow-600 border-0', label: 'Partially Available' },
      'Checked Out': { className: 'bg-blue-500/15 text-blue-600 border-0', label: 'Checked Out' },
      'Reserved': { className: 'bg-purple-500/15 text-purple-600 border-0', label: 'Reserved' },
      'Lost': { className: 'bg-red-500/15 text-red-600 border-0', label: 'Lost' },
      'Damaged': { className: 'bg-orange-500/15 text-orange-600 border-0', label: 'Damaged' },
      'Under Repair': { className: 'bg-gray-500/15 text-gray-600 border-0', label: 'Under Repair' }
    };
    
    const info = statusMap[status] || statusMap['Available'];
    return <Badge className={info.className}>{info.label}</Badge>;
  };

  // Define columns
  const cols: Column<BookType>[] = [
    {
      key: "title",
      header: "Book",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookIcon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="font-medium">{r.title}</div>
            <div className="text-xs text-muted-foreground">
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{r.bookId || 'N/A'}</span>
              <span className="ml-2">by {r.authors?.join(', ') || 'Unknown'}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "isbn",
      header: "ISBN",
      cell: (r) => <span className="font-mono text-sm">{r.isbn}</span>
    },
    {
      key: "category",
      header: "Category",
      cell: (r) => <Badge variant="secondary">{r.category}</Badge>
    },
    {
      key: "copies",
      header: "Copies",
      cell: (r) => (
        <div>
          <span className="text-sm">{r.availableCopies} / {r.totalCopies}</span>
          {r.reservedCopies > 0 && (
            <span className="text-xs text-muted-foreground block">Reserved: {r.reservedCopies}</span>
          )}
        </div>
      )
    },
    {
      key: "location",
      header: "Location",
      cell: (r) => (
        <div>
          <span className="text-sm">{r.location}</span>
          <span className="text-xs text-muted-foreground block">Shelf: {r.shelf}</span>
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => getStatusBadge(r.status)
    },
    {
      key: "actions",
      header: "Actions",
      cell: (r) => (
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => openEditModal(r)}
            className="hover:bg-blue-50"
          >
            <Pencil className="h-3 w-3 mr-1" /> Edit
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => r._id && handleDelete(r._id, r.title)}
          >
            <Trash2 className="h-3 w-3 mr-1" /> Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard 
          label="Total Books" 
          value={stats?.total || 0} 
          icon={Library} 
          tone="brand" 
        />
        <KpiCard 
          label="Available" 
          value={stats?.available || 0} 
          icon={BookOpen} 
          tone="success" 
        />
        <KpiCard 
          label="Checked Out" 
          value={stats?.checkedOut || 0} 
          icon={Users} 
          tone="info" 
        />
        <KpiCard 
          label="Reserved" 
          value={stats?.reserved || 0} 
          icon={Clock} 
          tone="warning" 
        />
      </div>

      {/* Unique Library Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Category Distribution - Pie Chart */}
        <Card className="glass">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Category Distribution</CardTitle>
                <CardDescription>Books by category</CardDescription>
              </div>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[160px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={getCategoryChartData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {getCategoryChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: "var(--popover)", 
                      border: "1px solid var(--border)", 
                      borderRadius: 8,
                      fontSize: 11
                    }} 
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={30}
                    wrapperStyle={{ fontSize: 9, paddingTop: 2 }}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Format Distribution - Bar Chart */}
        <Card className="glass">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Format Distribution</CardTitle>
                <CardDescription>Book formats</CardDescription>
              </div>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[160px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getFormatDistribution()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      background: "var(--popover)", 
                      border: "1px solid var(--border)", 
                      borderRadius: 8,
                      fontSize: 11
                    }} 
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Books - Horizontal Bar Chart */}
        <Card className="glass">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Top Books</CardTitle>
                <CardDescription>Most copies in library</CardDescription>
              </div>
              <BookMarked className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[160px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getTopBooksData()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" stroke="var(--muted-foreground)" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="var(--muted-foreground)" fontSize={8} tickLine={false} axisLine={false} width={70} />
                  <Tooltip 
                    contentStyle={{ 
                      background: "var(--popover)", 
                      border: "1px solid var(--border)", 
                      borderRadius: 8,
                      fontSize: 11
                    }} 
                  />
                  <Bar dataKey="copies" fill="#8b5cf6" radius={[0, 3, 3, 0]} />
                  <Bar dataKey="available" fill="#10b981" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, author, ISBN..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {searchQuery && (
          <div className="text-sm text-muted-foreground">
            Found {filteredBooks.length} of {books.length} books
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Failed to load data</p>
            <p className="text-sm">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={fetchBooks}
            >
              <RefreshCw className="h-3 w-3 mr-2" /> Retry
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading books...</p>
          </div>
        </div>
      )}

      {/* DataTable */}
      {!loading && !error && books.length > 0 && (
        <DataTable
          title="Book Collection"
          description={`${filteredBooks.length} books found${searchQuery ? ` (filtered from ${books.length})` : ''}`}
          data={filteredBooks}
          columns={cols}
          searchKeys={["title", "isbn", "category", "authors", "bookId"] as (keyof BookType)[]}
          pageSize={10}
          addLabel="Add Book"
          onAdd={openAddModal}
        />
      )}

      {/* Empty State */}
      {!loading && !error && books.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg p-8">
          <Database className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Books Found</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            There are no books in the library yet. Click the "Add Book" button to add your first book.
          </p>
          <Button onClick={openAddModal} className="gradient-brand text-white border-0">
            <Plus className="h-4 w-4 mr-2" /> Add First Book
          </Button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto relative">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {isEditMode ? (
                  <>
                    <Pencil className="h-5 w-5 text-primary" />
                    Edit Book
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 text-primary" />
                    Add New Book
                  </>
                )}
              </h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={closeModal}
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Information */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3">Basic Information</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="isbn">ISBN *</Label>
                  <Input
                    id="isbn"
                    name="isbn"
                    value={formData.isbn}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input
                    id="subtitle"
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="authors">Authors *</Label>
                  <Input
                    id="authors"
                    name="authors"
                    value={formData.authors}
                    onChange={handleInputChange}
                    placeholder="John Doe, Jane Smith"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publisher">Publisher</Label>
                  <Input
                    id="publisher"
                    name="publisher"
                    value={formData.publisher}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publishedYear">Published Year</Label>
                  <Input
                    id="publishedYear"
                    name="publishedYear"
                    type="number"
                    value={formData.publishedYear}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edition">Edition</Label>
                  <Input
                    id="edition"
                    name="edition"
                    value={formData.edition}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Classification */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Classification</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select Category</option>
                    {bookCategories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subCategory">Sub Category</Label>
                  <Input
                    id="subCategory"
                    name="subCategory"
                    value={formData.subCategory}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course">Course</Label>
                  <Input
                    id="course"
                    name="course"
                    value={formData.course}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Physical Details */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Physical Details</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Input
                    id="language"
                    name="language"
                    value={formData.language}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pages">Pages</Label>
                  <Input
                    id="pages"
                    name="pages"
                    type="number"
                    value={formData.pages}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="format">Format</Label>
                  <select
                    id="format"
                    name="format"
                    value={formData.format}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {bookFormats.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                {/* Location */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Library Location</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shelf">Shelf Number *</Label>
                  <Input
                    id="shelf"
                    name="shelf"
                    value={formData.shelf}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rack">Rack</Label>
                  <Input
                    id="rack"
                    name="rack"
                    value={formData.rack}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Inventory */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Inventory</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalCopies">Total Copies *</Label>
                  <Input
                    id="totalCopies"
                    name="totalCopies"
                    type="number"
                    min="0"
                    value={formData.totalCopies}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="availableCopies">Available Copies</Label>
                  <Input
                    id="availableCopies"
                    name="availableCopies"
                    type="number"
                    min="0"
                    value={formData.availableCopies}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reservedCopies">Reserved Copies</Label>
                  <Input
                    id="reservedCopies"
                    name="reservedCopies"
                    type="number"
                    min="0"
                    value={formData.reservedCopies}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lostCopies">Lost Copies</Label>
                  <Input
                    id="lostCopies"
                    name="lostCopies"
                    type="number"
                    min="0"
                    value={formData.lostCopies}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {bookStatuses.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Options */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Options</h3>
                </div>

                <div className="space-y-2 flex items-center gap-2">
                  <input
                    id="isReference"
                    name="isReference"
                    type="checkbox"
                    checked={formData.isReference}
                    onChange={handleInputChange}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isReference">Reference Book (Cannot be checked out)</Label>
                </div>

                <div className="space-y-2 flex items-center gap-2">
                  <input
                    id="hasEbook"
                    name="hasEbook"
                    type="checkbox"
                    checked={formData.hasEbook}
                    onChange={handleInputChange}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="hasEbook">Has E-book</Label>
                </div>

                {formData.hasEbook && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="ebookUrl">E-book URL</Label>
                    <Input
                      id="ebookUrl"
                      name="ebookUrl"
                      value={formData.ebookUrl}
                      onChange={handleInputChange}
                      placeholder="https://..."
                    />
                  </div>
                )}

                <div className="space-y-2 flex items-center gap-2">
                  <input
                    id="hasAudioBook"
                    name="hasAudioBook"
                    type="checkbox"
                    checked={formData.hasAudioBook}
                    onChange={handleInputChange}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="hasAudioBook">Has Audio Book</Label>
                </div>

                {/* Description & Tags */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Description & Tags</h3>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="AI, Machine Learning, Python"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={closeModal}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="gradient-brand text-white border-0"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isEditMode ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {isEditMode ? 'Update Book' : 'Create Book'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default LibraryPage;
