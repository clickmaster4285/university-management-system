import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bookAPI, type Book } from "@/features/book";

export const bookCategories = [
  "Computer Science", "Programming", "Artificial Intelligence", "Data Science",
  "Mathematics", "Physics", "Chemistry", "Biology", "Engineering", "Business",
  "Economics", "Law", "Medicine", "Literature", "History", "Philosophy",
  "Psychology", "Education",
];

export const bookFormats = ["Hardcover", "Paperback", "E-book", "Audio Book", "Digital"];

export const bookStatuses = [
  "Available", "Partially Available", "Checked Out", "Reserved",
  "Lost", "Damaged", "Under Repair",
];

export const departmentOptions = [
  "Computer Science", "Electrical Engineering", "Mechanical Engineering",
  "Civil Engineering", "Business Administration", "Economics", "Mathematics",
  "Physics", "Chemistry", "Biology", "English Literature", "Psychology", "Law",
  "Medicine", "Pharmacy", "Architecture", "Design", "Fine Arts", "Media Studies",
  "Data Science",
];

export type BookFormData = {
  isbn: string;
  title: string;
  subtitle: string;
  authors: string;
  publisher: string;
  publishedYear: number;
  edition: string;
  category: string;
  subCategory: string;
  department: string;
  course: string;
  language: string;
  pages: number;
  format: string;
  location: string;
  shelf: string;
  rack: string;
  totalCopies: number;
  availableCopies: number;
  reservedCopies: number;
  lostCopies: number;
  isReference: boolean;
  hasEbook: boolean;
  ebookUrl: string;
  hasAudioBook: boolean;
  description: string;
  tags: string;
  status: string;
};

export const EMPTY_FORM: BookFormData = {
  isbn: "",
  title: "",
  subtitle: "",
  authors: "",
  publisher: "",
  publishedYear: new Date().getFullYear(),
  edition: "",
  category: "",
  subCategory: "",
  department: "",
  course: "",
  language: "English",
  pages: 0,
  format: "Paperback",
  location: "",
  shelf: "",
  rack: "",
  totalCopies: 1,
  availableCopies: 1,
  reservedCopies: 0,
  lostCopies: 0,
  isReference: false,
  hasEbook: false,
  ebookUrl: "",
  hasAudioBook: false,
  description: "",
  tags: "",
  status: "Available",
};

export const getBookRecordId = (book: Book) => book._id || "";

export const toFormData = (book: Book): BookFormData => ({
  isbn: book.isbn || "",
  title: book.title || "",
  subtitle: book.subtitle || "",
  authors: book.authors?.join(", ") || "",
  publisher: book.publisher || "",
  publishedYear: book.publishedYear || new Date().getFullYear(),
  edition: book.edition || "",
  category: book.category || "",
  subCategory: book.subCategory || "",
  department: book.department || "",
  course: book.course || "",
  language: book.language || "English",
  pages: book.pages || 0,
  format: book.format || "Paperback",
  location: book.location || "",
  shelf: book.shelf || "",
  rack: book.rack || "",
  totalCopies: book.totalCopies || 1,
  availableCopies: book.availableCopies || 1,
  reservedCopies: book.reservedCopies || 0,
  lostCopies: book.lostCopies || 0,
  isReference: book.isReference || false,
  hasEbook: book.hasEbook || false,
  ebookUrl: book.ebookUrl || "",
  hasAudioBook: book.hasAudioBook || false,
  description: book.description || "",
  tags: book.tags?.join(", ") || "",
  status: book.status || "Available",
});

const buildPayload = (formData: BookFormData) => ({
  isbn: formData.isbn.trim(),
  title: formData.title.trim(),
  subtitle: formData.subtitle.trim(),
  authors: formData.authors.split(",").map((a) => a.trim()).filter(Boolean),
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
  tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
  status: formData.status,
});

interface BookFormProps {
  mode: "create" | "edit";
  book?: Book | null;
}

export function BookForm({ mode, book }: BookFormProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<BookFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === "edit" && book) {
      setFormData(toFormData(book));
    }
  }, [mode, book]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          name === "totalCopies" ||
          name === "availableCopies" ||
          name === "reservedCopies" ||
          name === "lostCopies" ||
          name === "publishedYear" ||
          name === "pages"
            ? parseInt(value) || 0
            : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const requiredFields = ["isbn", "title", "category", "location", "shelf", "totalCopies"] as const;
      const missingFields = requiredFields.filter((field) => !formData[field]);

      if (missingFields.length > 0) {
        toast.error(`Please fill all required fields: ${missingFields.join(", ")}`);
        return;
      }

      const bookData = buildPayload(formData);

      if (mode === "edit") {
        const id = book ? getBookRecordId(book) : "";
        if (!id) {
          toast.error("Cannot update book: missing ID");
          return;
        }
        const response = await bookAPI.update(id, bookData);
        if (response?.success) {
          toast.success("Book updated successfully!");
        } else {
          toast.error(response?.message || "Failed to update book");
          return;
        }
      } else {
        const response = await bookAPI.create(bookData);
        if (response?.success) {
          toast.success(`Book created successfully! ID: ${response.data?.bookId || "generated"}`);
        } else {
          toast.error(response?.message || "Failed to create book");
          return;
        }
      }

      navigate("/library");
    } catch (error: any) {
      let errorMsg = mode === "edit" ? "Failed to update book" : "Failed to create book";

      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (
        error.message?.includes("NetworkError") ||
        error.message?.includes("Failed to fetch")
      ) {
        errorMsg = "Network error. Please check if backend server is running.";
      }

      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-6 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {mode === "create" ? (
              <>
                <Plus className="h-6 w-6 text-primary" />
                Add New Book
              </>
            ) : (
              <>
                <Pencil className="h-6 w-6 text-primary" />
                Edit Book
              </>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "create"
              ? "Add a new book to the library collection"
              : "Update book information and inventory"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <h3 className="font-semibold text-sm text-muted-foreground mb-3">Basic Information</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="isbn">ISBN *</Label>
              <Input id="isbn" name="isbn" value={formData.isbn} onChange={handleInputChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" value={formData.title} onChange={handleInputChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input id="subtitle" name="subtitle" value={formData.subtitle} onChange={handleInputChange} />
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
              <Input id="publisher" name="publisher" value={formData.publisher} onChange={handleInputChange} />
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
              <Input id="edition" name="edition" value={formData.edition} onChange={handleInputChange} />
            </div>

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
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Select Category</option>
                {bookCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subCategory">Sub Category</Label>
              <Input id="subCategory" name="subCategory" value={formData.subCategory} onChange={handleInputChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select Department</option>
                {departmentOptions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="course">Course</Label>
              <Input id="course" name="course" value={formData.course} onChange={handleInputChange} />
            </div>

            <div className="md:col-span-2">
              <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Physical Details</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Input id="language" name="language" value={formData.language} onChange={handleInputChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pages">Pages</Label>
              <Input id="pages" name="pages" type="number" value={formData.pages} onChange={handleInputChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <select
                id="format"
                name="format"
                value={formData.format}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {bookFormats.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Library Location</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input id="location" name="location" value={formData.location} onChange={handleInputChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shelf">Shelf Number *</Label>
              <Input id="shelf" name="shelf" value={formData.shelf} onChange={handleInputChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rack">Rack</Label>
              <Input id="rack" name="rack" value={formData.rack} onChange={handleInputChange} />
            </div>

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
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {bookStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

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
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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

          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => navigate("/library")} className="h-12 px-6">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1 h-12 gradient-brand text-white border-0">
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  {mode === "edit" ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  {mode === "edit" ? "Update Book" : "Create Book"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default BookForm;
