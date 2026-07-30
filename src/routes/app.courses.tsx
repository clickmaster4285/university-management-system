// src/routes/app.courses.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { courseAPI, Course } from "@/lib/api/courses";
import { departmentAPI } from "@/lib/api/departments";
import { 
  BookOpen, 
  Users, 
  Clock, 
  GraduationCap,
  RefreshCw, 
  UserPlus,
  X,
  Save,
  Loader2,
  Pencil,
  Trash2,
  AlertCircle,
  Search,
  Calendar,
  User,
  Building2
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/courses")({
  head: () => ({
    meta: [
      { title: "Courses — ScholarOS" },
      { name: "description", content: "Course catalog with instructors, credit hours, prerequisites, and materials." },
      { property: "og:title", content: "Courses — ScholarOS" },
      { property: "og:description", content: "Course catalog management." },
    ],
  }),
  component: CoursesPage,
});

function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    department: '',
    credits: 3,
    instructor: '',
    semester: 'Fall',
    year: new Date().getFullYear(),
    capacity: 30,
    enrolledStudents: 0,
    status: 'Active',
    description: '',
    prerequisites: [] as string[]
  });

  const semesters = ['Fall', 'Spring', 'Summer'];
  const statusOptions = ['Active', 'Inactive', 'Completed', 'Cancelled'];

  // Fetch courses and departments
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [coursesRes, deptsRes] = await Promise.all([
        courseAPI.getAll(),
        departmentAPI.getAll()
      ]);
      
      if (coursesRes && coursesRes.data) {
        setCourses(coursesRes.data);
        setFilteredCourses(coursesRes.data);
        console.log(`✅ Loaded ${coursesRes.data.length} courses from database`);
      }
      
      if (deptsRes && deptsRes.data) {
        setDepartments(deptsRes.data.map((d: any) => d.name));
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch data:', error);
      let errorMsg = 'Failed to load courses';
      if (error.message?.includes('Failed to fetch')) {
        errorMsg = 'Cannot connect to backend. Make sure backend is running on http://localhost:4000';
      }
      setError(errorMsg);
      toast.error(errorMsg);
      setCourses([]);
      setFilteredCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredCourses(courses);
      return;
    }
    const searchLower = query.toLowerCase().trim();
    const filtered = courses.filter(course => {
      const idMatch = course.courseId?.toLowerCase().includes(searchLower) || false;
      const codeMatch = course.code?.toLowerCase().includes(searchLower) || false;
      const nameMatch = course.name?.toLowerCase().includes(searchLower) || false;
      const deptMatch = course.department?.toLowerCase().includes(searchLower) || false;
      const instructorMatch = course.instructor?.toLowerCase().includes(searchLower) || false;
      const semesterMatch = course.semester?.toLowerCase().includes(searchLower) || false;
      return idMatch || codeMatch || nameMatch || deptMatch || instructorMatch || semesterMatch;
    });
    setFilteredCourses(filtered);
    console.log(`🔍 Search results: ${filtered.length} courses found`);
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'credits' || name === 'capacity' || name === 'enrolledStudents' || name === 'year'
        ? parseInt(value) || 0
        : value
    }));
  };

  // Open modal for adding new course
  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      code: '',
      name: '',
      department: departments[0] || '',
      credits: 3,
      instructor: '',
      semester: 'Fall',
      year: new Date().getFullYear(),
      capacity: 30,
      enrolledStudents: 0,
      status: 'Active',
      description: '',
      prerequisites: []
    });
    setIsModalOpen(true);
  };

  // Open modal for editing course
  const openEditModal = (course: Course) => {
    setIsEditMode(true);
    setEditingId(course.courseId || null);
    setFormData({
      code: course.code || '',
      name: course.name || '',
      department: course.department || '',
      credits: course.credits || 3,
      instructor: course.instructor || '',
      semester: course.semester || 'Fall',
      year: course.year || new Date().getFullYear(),
      capacity: course.capacity || 30,
      enrolledStudents: course.enrolledStudents || 0,
      status: course.status || 'Active',
      description: course.description || '',
      prerequisites: course.prerequisites || []
    });
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingId(null);
  };

  // Handle form submit (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!formData.code || !formData.name || !formData.department) {
        toast.error('Code, Name and Department are required');
        setIsSubmitting(false);
        return;
      }

      if (isEditMode && editingId) {
        await courseAPI.update(editingId, formData);
        toast.success(`Course ${formData.name} updated successfully!`);
      } else {
        await courseAPI.create(formData);
        toast.success(`Course ${formData.name} created successfully!`);
      }
      
      closeModal();
      await fetchData();
      setSearchQuery('');
    } catch (error: any) {
      console.error('Failed to save course:', error);
      let errorMsg = isEditMode ? 'Failed to update course' : 'Failed to create course';
      if (error.message?.includes('duplicate')) {
        errorMsg = 'Duplicate entry. Course code already exists.';
      }
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await courseAPI.delete(id);
      toast.success(`Course ${name} deleted successfully`);
      await fetchData();
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to delete course:', error);
      toast.error('Failed to delete course');
    }
  };

  // Format course ID
  const getCourseId = (course: Course) => {
    return course.courseId || course._id?.slice(-8).toUpperCase() || 'N/A';
  };

  // Calculate statistics
  const totalCourses = courses.length;
  const activeCourses = courses.filter(c => c.status === 'Active').length;
  const totalCapacity = courses.reduce((sum, c) => sum + (c.capacity || 0), 0);
  const totalEnrolled = courses.reduce((sum, c) => sum + (c.enrolledStudents || 0), 0);
  const avgCredits = totalCourses > 0 
    ? courses.reduce((sum, c) => sum + (c.credits || 0), 0) / totalCourses 
    : 0;
  const uniqueDepartments = new Set(courses.map(c => c.department)).size;

  // Define columns for DataTable
  const cols: Column<Course>[] = [
    {
      key: "name",
      header: "Course",
      cell: (r) => (
        <div>
          <div className="font-medium">{r.name}</div>
          <div className="text-xs text-muted-foreground flex flex-wrap gap-1">
            <span className="font-mono bg-muted px-1.5 py-0.5 rounded">ID: {getCourseId(r)}</span>
            <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{r.code}</span>
          </div>
        </div>
      )
    },
    { 
      key: "department", 
      header: "Department", 
      cell: (r) => (
        <div className="flex items-center gap-1">
          <Building2 className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{r.department}</span>
        </div>
      ) 
    },
    { 
      key: "credits", 
      header: "Credits", 
      cell: (r) => <Badge variant="secondary">{r.credits} CR</Badge> 
    },
    { 
      key: "instructor", 
      header: "Instructor", 
      cell: (r) => (
        <div className="flex items-center gap-1">
          <User className="h-3 w-3 text-muted-foreground" />
          <span>{r.instructor || '—'}</span>
        </div>
      ) 
    },
    { 
      key: "semester", 
      header: "Semester", 
      cell: (r) => (
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{r.semester || '—'} {r.year || ''}</span>
        </div>
      ) 
    },
    { 
      key: "enrollment", 
      header: "Enrollment", 
      cell: (r) => {
        const enrolled = r.enrolledStudents || 0;
        const capacity = r.capacity || 30;
        const percentage = Math.round((enrolled / capacity) * 100);
        return (
          <div className="flex flex-col">
            <span className={`tabular-nums font-medium ${
              percentage >= 90 ? 'text-destructive' : 
              percentage >= 70 ? 'text-warning' : 
              'text-success'
            }`}>
              {enrolled} / {capacity}
            </span>
            <span className="text-xs text-muted-foreground">{percentage}% full</span>
          </div>
        );
      }
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => {
        const status = r.status || 'Active';
        const variant = status === 'Active' ? 'default' : 
                       status === 'Completed' ? 'secondary' : 'outline';
        return <Badge variant={variant}>{status}</Badge>;
      }
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
            onClick={() => r.courseId && handleDelete(r.courseId, r.name)}
          >
            <Trash2 className="h-3 w-3 mr-1" /> Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <>
      <AppShell
        title="Courses"
        subtitle={`${totalCourses} courses · ${activeCourses} active · ${uniqueDepartments} departments · Avg ${avgCredits.toFixed(1)} credits`}
        actions={
          <>
            <Button 
              onClick={openAddModal}
              className="gradient-brand text-white border-0 hover:opacity-90"
            >
              <UserPlus className="h-4 w-4 mr-2" /> Add Course
            </Button>
            <Button 
              variant="outline" 
              onClick={fetchData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </>
        }
      >
        {/* KPI Cards with real data */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard 
            label="Active Courses" 
            value={activeCourses} 
            icon={BookOpen} 
            tone="brand" 
          />
          <KpiCard 
            label="Enrollments" 
            value={totalEnrolled} 
            icon={Users} 
            tone="info" 
          />
          <KpiCard 
            label="Avg Credit Hrs" 
            value={avgCredits.toFixed(1)} 
            icon={Clock} 
            tone="success" 
          />
          <KpiCard 
            label="Departments" 
            value={uniqueDepartments} 
            icon={GraduationCap} 
            tone="warning" 
          />
        </div>

        {/* Search Bar */}
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, Code, Name, Department, Instructor..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {searchQuery && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              Found {filteredCourses.length} of {courses.length} courses
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleSearch('')}
                className="h-7 px-2"
              >
                ✕ Clear
              </Button>
            </div>
          )}
          {courses.length > 0 && (
            <div className="text-xs text-muted-foreground ml-auto">
              💡 Try searching by ID (e.g., {getCourseId(courses[0])})
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
                onClick={fetchData}
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
              <p className="mt-4 text-muted-foreground">Loading courses from database...</p>
            </div>
          </div>
        )}

        {/* DataTable */}
        {!loading && !error && (
          <DataTable
            title="Course Catalog"
            description={`${filteredCourses.length} courses found${searchQuery ? ` (filtered from ${courses.length})` : ''}`}
            data={filteredCourses}
            columns={cols}
            pageSize={10}
            addLabel="Add course"
            onAdd={openAddModal}
          />
        )}

        {/* Empty State */}
        {!loading && !error && filteredCourses.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
            {searchQuery ? (
              <>
                <p className="text-muted-foreground mb-2">No courses match your search</p>
                <p className="text-sm text-muted-foreground mb-4">Try searching by ID, code, name, or department</p>
                <Button variant="outline" onClick={() => handleSearch('')}>
                  Clear Search
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground mb-4">No courses found in database</p>
                <Button onClick={openAddModal}>
                  <UserPlus className="h-4 w-4 mr-2" /> Add First Course
                </Button>
              </>
            )}
          </div>
        )}
      </AppShell>

      {/* Add/Edit Course Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {isEditMode ? 'Edit Course' : 'Add New Course'}
              </h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={closeModal}
                className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Course Code *</Label>
                  <Input
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="CS-101"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Course Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Introduction to Programming"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credits">Credits</Label>
                  <Input
                    id="credits"
                    name="credits"
                    type="number"
                    min="1"
                    max="6"
                    value={formData.credits}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instructor">Instructor</Label>
                  <Input
                    id="instructor"
                    name="instructor"
                    value={formData.instructor}
                    onChange={handleInputChange}
                    placeholder="Dr. John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semester">Semester</Label>
                  <select
                    id="semester"
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {semesters.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    name="year"
                    type="number"
                    value={formData.year}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Course description..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {statusOptions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="enrolledStudents">Current Enrolled</Label>
                  <Input
                    id="enrolledStudents"
                    name="enrolledStudents"
                    type="number"
                    min="0"
                    value={formData.enrolledStudents}
                    onChange={handleInputChange}
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
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {isEditMode ? 'Update Course' : 'Create Course'}
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