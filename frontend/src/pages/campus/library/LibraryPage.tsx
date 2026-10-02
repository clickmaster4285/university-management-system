import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { bookAPI, Book as BookType } from "@/features/book";
import { getBookRecordId } from "./BookForm";
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
  Database,
  AlertCircle,
  Book as BookIcon,
  BookMarked,
  Layers,
  PieChart,
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#8b5cf6"];

interface CategoryStats {
  category?: string;
  _id?: string;
  count?: number;
}

export default function LibraryPage() {
  const navigate = useNavigate();
  const [books, setBooks] = useState<BookType[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<BookType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<any>(null);

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
      console.error("Failed to fetch books:", error);
      if (
        error.message?.includes("NetworkError") ||
        error.message?.includes("Failed to fetch") ||
        error.code === "ERR_NETWORK"
      ) {
        setError("Cannot connect to backend. Please check if server is running.");
      } else {
        setError(null);
      }
      setBooks([]);
      setFilteredBooks([]);
    } finally {
      setLoading(false);
    }
  };

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
          categories: [],
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      setStats({
        total: 0,
        available: 0,
        checkedOut: 0,
        reserved: 0,
        lost: 0,
        categories: [],
      });
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchStats();
  }, []);

  const getCategoryChartData = (): { name: string; value: number }[] => {
    if (!stats || !stats.categories) return [];
    return stats.categories.map((item: CategoryStats) => ({
      name: item.category || item._id || "Other",
      value: item.count || 0,
    }));
  };

  const getTopBooksData = (): { name: string; copies: number; available: number }[] => {
    return books.slice(0, 6).map((book) => ({
      name: book.title?.substring(0, 20) + (book.title?.length > 20 ? "..." : ""),
      copies: book.totalCopies || 0,
      available: book.availableCopies || 0,
    }));
  };

  const getFormatDistribution = (): { name: string; value: number }[] => {
    const formats = ["Hardcover", "Paperback", "E-book", "Audio Book", "Digital"];
    return formats.map((format) => ({
      name: format,
      value: books.filter((b) => b.format === format).length,
    }));
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setFilteredBooks(books);
      return;
    }

    const searchLower = query.toLowerCase().trim();
    const filtered = books.filter((b) => {
      const titleMatch = b.title?.toLowerCase().includes(searchLower) || false;
      const authorMatch = b.authors?.some((a) => a.toLowerCase().includes(searchLower)) || false;
      const isbnMatch = b.isbn?.toLowerCase().includes(searchLower) || false;
      const categoryMatch = b.category?.toLowerCase().includes(searchLower) || false;
      const idMatch = b.bookId?.toLowerCase().includes(searchLower) || false;

      return titleMatch || authorMatch || isbnMatch || categoryMatch || idMatch;
    });

    setFilteredBooks(filtered);
  };

  const goToCreate = () => navigate("/library/create");

  const goToEdit = (book: BookType) => {
    const id = getBookRecordId(book);
    if (!id) {
      toast.error("Cannot edit book: missing ID");
      return;
    }
    navigate(`/library/edit/${id}`);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) return;

    try {
      const response = await bookAPI.delete(id);
      if (response && response.success) {
        toast.success("Book deleted successfully");
        await fetchBooks();
        await fetchStats();
      } else {
        toast.error(response?.message || "Failed to delete book");
      }
    } catch (error) {
      console.error("Failed to delete book:", error);
      toast.error("Failed to delete book");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      Available: { className: "bg-green-500/15 text-green-600 border-0", label: "Available" },
      "Partially Available": { className: "bg-yellow-500/15 text-yellow-600 border-0", label: "Partially Available" },
      "Checked Out": { className: "bg-blue-500/15 text-blue-600 border-0", label: "Checked Out" },
      Reserved: { className: "bg-purple-500/15 text-purple-600 border-0", label: "Reserved" },
      Lost: { className: "bg-red-500/15 text-red-600 border-0", label: "Lost" },
      Damaged: { className: "bg-orange-500/15 text-orange-600 border-0", label: "Damaged" },
      "Under Repair": { className: "bg-gray-500/15 text-gray-600 border-0", label: "Under Repair" },
    };

    const info = statusMap[status] || statusMap["Available"];
    return <Badge className={info.className}>{info.label}</Badge>;
  };

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
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{r.bookId || "N/A"}</span>
              <span className="ml-2">by {r.authors?.join(", ") || "Unknown"}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "isbn",
      header: "ISBN",
      cell: (r) => <span className="font-mono text-sm">{r.isbn}</span>,
    },
    {
      key: "category",
      header: "Category",
      cell: (r) => <Badge variant="secondary">{r.category}</Badge>,
    },
    {
      key: "copies",
      header: "Copies",
      cell: (r) => (
        <div>
          <span className="text-sm">
            {r.availableCopies} / {r.totalCopies}
          </span>
          {r.reservedCopies > 0 && (
            <span className="text-xs text-muted-foreground block">Reserved: {r.reservedCopies}</span>
          )}
        </div>
      ),
    },
    {
      key: "location",
      header: "Location",
      cell: (r) => (
        <div>
          <span className="text-sm">{r.location}</span>
          <span className="text-xs text-muted-foreground block">Shelf: {r.shelf}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => getStatusBadge(r.status),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (r) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToEdit(r)}
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Books" value={stats?.total || 0} icon={Library} tone="brand" />
        <KpiCard label="Available" value={stats?.available || 0} icon={BookOpen} tone="success" />
        <KpiCard label="Checked Out" value={stats?.checkedOut || 0} icon={Users} tone="info" />
        <KpiCard label="Reserved" value={stats?.reserved || 0} icon={Clock} tone="warning" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                      fontSize: 11,
                    }}
                  />
                  <Legend verticalAlign="bottom" height={30} wrapperStyle={{ fontSize: 9, paddingTop: 2 }} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

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
                      fontSize: 11,
                    }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

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
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="var(--muted-foreground)"
                    fontSize={8}
                    tickLine={false}
                    axisLine={false}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 11,
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

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Failed to load data</p>
            <p className="text-sm">{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={fetchBooks}>
              <RefreshCw className="h-3 w-3 mr-2" /> Retry
            </Button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading books...</p>
          </div>
        </div>
      )}

      {!loading && !error && books.length > 0 && (
        <DataTable
          title="Book Collection"
          description={`${filteredBooks.length} books found${searchQuery ? ` (filtered from ${books.length})` : ""}`}
          data={filteredBooks}
          columns={cols}
          searchKeys={["title", "isbn", "category", "authors", "bookId"] as (keyof BookType)[]}
          pageSize={10}
          addLabel="Add Book"
          onAdd={goToCreate}
        />
      )}

      {!loading && !error && books.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg p-8">
          <Database className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Books Found</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            There are no books in the library yet. Click the "Add Book" button to add your first book.
          </p>
          <Button onClick={goToCreate} className="gradient-brand text-white border-0">
            <Plus className="h-4 w-4 mr-2" /> Add First Book
          </Button>
        </div>
      )}
    </>
  );
}
