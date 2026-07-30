// src/routes/app.teachers.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { teacherAPI, Teacher } from "@/lib/api/teachers";
import { 
  Users, 
  Award, 
  BookOpen, 
  Star, 
  RefreshCw, 
  UserPlus,
  X,
  Save,
  Loader2,
  Pencil,
  Trash2,
  AlertCircle,
  Search
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/teachers")({
  head: () => ({
    meta: [
      { title: "Teachers — ScholarOS" },
      { name: "description", content: "Faculty profiles, schedules, performance, and payroll." },
      { property: "og:title", content: "Teachers — ScholarOS" },
      { property: "og:description", content: "Complete faculty management." },
    ],
  }),
  component: TeachersPage,
});

function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'Computer Science',
    designation: 'Professor',
    specialization: '',
    experience: 0,
    rating: 0,
    salary: 0,
    status: 'Active',
    officeHours: ''
  });

  // Options for dropdowns
  const departments = [
    'Computer Science', 
    'Electrical Engineering', 
    'Mechanical Engineering', 
    'Civil Engineering', 
    'Business Administration', 
    'Economics', 
    'Mathematics', 
    'Physics', 
    'Chemistry', 
    'Biology', 
    'English Literature', 
    'Psychology', 
    'Law', 
    'Medicine', 
    'Pharmacy', 
    'Architecture', 
    'Design', 
    'Fine Arts', 
    'Media Studies', 
    'Data Science'
  ];
  
  const designations = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Instructor', 'Visiting Faculty'];
  const statusOptions = ['Active', 'On Leave', 'Retired', 'Resigned', 'On Probation'];

  // Fetch teachers from database
  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await teacherAPI.getAll();
      
      if (response && response.data) {
        setTeachers(response.data);
        setFilteredTeachers(response.data);
        console.log(`✅ Loaded ${response.data.length} teachers from database`);
      } else {
        setTeachers([]);
        setFilteredTeachers([]);
        setError('No data received from server');
      }
      
    } catch (error: any) {
      console.error('❌ Failed to fetch teachers:', error);
      
      let errorMsg = 'Failed to load teachers from database';
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
        errorMsg = 'Cannot connect to backend. Make sure backend is running on http://localhost:4000';
      } else if (error.message?.includes('404')) {
        errorMsg = 'API endpoint not found. Check if /api/teachers exists.';
      } else if (error.message?.includes('CORS')) {
        errorMsg = 'CORS error. Check backend CORS configuration.';
      }
      
      setError(errorMsg);
      toast.error(errorMsg);
      setTeachers([]);
      setFilteredTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchTeachers();
  }, []);

  // Handle search - searches through ALL fields including ID
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredTeachers(teachers);
      return;
    }
    
    const searchLower = query.toLowerCase().trim();
    const filtered = teachers.filter(teacher => {
      // Search by MongoDB _id (full)
      const mongoId = teacher._id || '';
      const mongoIdMatch = mongoId.toLowerCase().includes(searchLower);
      
      // Search by teacherId (if exists)
      const teacherId = teacher.teacherId || '';
      const teacherIdMatch = teacherId.toLowerCase().includes(searchLower);
      
      // Search by short ID (last 8 characters of _id)
      const shortId = mongoId.slice(-8) || '';
      const shortIdMatch = shortId.toLowerCase().includes(searchLower);
      
      // Search by name
      const nameMatch = teacher.name?.toLowerCase().includes(searchLower) || false;
      
      // Search by email
      const emailMatch = teacher.email?.toLowerCase().includes(searchLower) || false;
      
      // Search by department
      const departmentMatch = teacher.department?.toLowerCase().includes(searchLower) || false;
      
      // Search by designation
      const designationMatch = teacher.designation?.toLowerCase().includes(searchLower) || false;
      
      // Search by specialization
      const specializationMatch = teacher.specialization?.toLowerCase().includes(searchLower) || false;
      
      // Search by status
      const statusMatch = teacher.status?.toLowerCase().includes(searchLower) || false;
      
      // Search by phone
      const phoneMatch = teacher.phone?.toLowerCase().includes(searchLower) || false;
      
      return mongoIdMatch || teacherIdMatch || shortIdMatch || nameMatch || emailMatch || 
             departmentMatch || designationMatch || specializationMatch || statusMatch || phoneMatch;
    });
    
    setFilteredTeachers(filtered);
    console.log(`🔍 Search results: ${filtered.length} teachers found for "${query}"`);
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'experience' || name === 'rating' || name === 'salary' 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  // Open modal for adding new teacher
  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      department: 'Computer Science',
      designation: 'Professor',
      specialization: '',
      experience: 0,
      rating: 0,
      salary: 0,
      status: 'Active',
      officeHours: ''
    });
    setIsModalOpen(true);
  };

  // Open modal for editing teacher
  const openEditModal = (teacher: Teacher) => {
    setIsEditMode(true);
    setEditingId(teacher._id || null);
    setFormData({
      name: teacher.name || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      department: teacher.department || 'Computer Science',
      designation: teacher.designation || 'Professor',
      specialization: teacher.specialization || '',
      experience: teacher.experience || 0,
      rating: teacher.rating || 0,
      salary: teacher.salary || 0,
      status: teacher.status || 'Active',
      officeHours: teacher.officeHours || ''
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
      // Validate required fields
      if (!formData.name || !formData.department || !formData.designation) {
        toast.error('Name, Department and Designation are required');
        setIsSubmitting(false);
        return;
      }
      
      // Prepare data for API
      const teacherData = {
        ...formData,
        experience: Number(formData.experience),
        rating: Number(formData.rating),
        salary: Number(formData.salary)
      };

      if (isEditMode && editingId) {
        // UPDATE existing teacher
        await teacherAPI.update(editingId, teacherData);
        toast.success(`Teacher ${formData.name} updated successfully!`);
      } else {
        // CREATE new teacher
        await teacherAPI.create(teacherData);
        toast.success(`Teacher ${formData.name} created successfully!`);
      }
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        department: 'Computer Science',
        designation: 'Professor',
        specialization: '',
        experience: 0,
        rating: 0,
        salary: 0,
        status: 'Active',
        officeHours: ''
      });
      
      // Close modal
      closeModal();
      
      // Refresh teacher list
      await fetchTeachers();
      setSearchQuery('');
      
    } catch (error: any) {
      console.error('Failed to save teacher:', error);
      
      let errorMsg = isEditMode ? 'Failed to update teacher' : 'Failed to create teacher';
      if (error.message?.includes('duplicate')) {
        errorMsg = 'Duplicate entry. Email already exists.';
      } else if (error.message?.includes('validation')) {
        errorMsg = 'Validation error. Please check your inputs.';
      }
      
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    
    try {
      await teacherAPI.delete(id);
      toast.success(`Teacher ${name} deleted successfully`);
      await fetchTeachers();
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to delete teacher:', error);
      toast.error('Failed to delete teacher');
    }
  };

  // Calculate statistics from real data
  const totalTeachers = teachers.length;
  const professors = teachers.filter(t => t.designation === 'Professor').length;
  
  // Calculate average rating
  const totalRating = teachers.reduce((sum, t) => sum + (t.rating || 0), 0);
  const avgRating = totalTeachers > 0 ? (totalRating / totalTeachers) : 0;
  
  // Calculate total courses (safe check)
  const totalCourses = teachers.reduce((sum, t) => {
    if (t.coursesTeaching && Array.isArray(t.coursesTeaching)) {
      return sum + t.coursesTeaching.length;
    }
    return sum;
  }, 0);

  // Format teacher ID
  const getTeacherId = (teacher: Teacher) => {
    if (teacher.teacherId) return teacher.teacherId;
    if (teacher._id) return teacher._id.slice(-8).toUpperCase();
    return 'N/A';
  };

  // Define columns for DataTable
  const cols: Column<Teacher>[] = [
    {
      key: "name", 
      header: "Faculty", 
      cell: (r) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="text-xs gradient-brand text-white">
              {r.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{r.name}</div>
            <div className="text-xs text-muted-foreground">
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded">ID: {getTeacherId(r)}</span> · {r.email || 'No email'}
            </div>
          </div>
        </div>
      ) 
    },
    { 
      key: "designation", 
      header: "Designation", 
      cell: (r) => <Badge variant="secondary">{r.designation}</Badge> 
    },
    { 
      key: "department", 
      header: "Department",
      cell: (r) => <span className="text-sm">{r.department}</span>
    },
    { 
      key: "experience", 
      header: "Experience", 
      cell: (r) => <span className="tabular-nums">{r.experience || 0} yrs</span> 
    },
    { 
      key: "specialization", 
      header: "Specialization", 
      cell: (r) => <span className="text-xs text-muted-foreground">{r.specialization || 'N/A'}</span> 
    },
    { 
      key: "rating", 
      header: "Rating", 
      cell: (r) => {
        const rating = r.rating || 0;
        return (
          <span className="flex items-center gap-1 font-medium">
            <Star className={`h-3 w-3 ${rating >= 4.0 ? 'fill-warning text-warning' : 'text-muted-foreground'}`} /> 
            {rating.toFixed(1)}
          </span>
        );
      } 
    },
    { 
      key: "salary", 
      header: "Salary", 
      cell: (r) => {
        const salary = r.salary || 0;
        return <span className="tabular-nums">PKR {(salary/1000).toFixed(0)}K</span>;
      } 
    },
    { 
      key: "status", 
      header: "Status", 
      cell: (r) => {
        const status = r.status || 'Active';
        const variant = status === 'Active' ? 'default' : 'outline';
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
            onClick={() => r._id && handleDelete(r._id, r.name)}
          >
            <Trash2 className="h-3 w-3 mr-1" /> Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <AppShell 
        title="Teachers" 
        subtitle={totalTeachers > 0 ? `${totalTeachers} faculty · ${professors} professors · ⭐ ${avgRating.toFixed(1)} avg rating` : 'No teachers found'}
        actions={
          <>
            <Button 
              onClick={openAddModal}
              className="gradient-brand text-white border-0 hover:opacity-90"
            >
              <UserPlus className="h-4 w-4 mr-2" /> Add Teacher
            </Button>
            <Button 
              variant="outline" 
              onClick={fetchTeachers}
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
            label="Total Faculty" 
            value={totalTeachers} 
            icon={Users} 
            trend={totalTeachers > 0 ? 2.1 : 0} 
            tone="brand" 
          />
          <KpiCard 
            label="Professors" 
            value={professors} 
            icon={Award} 
            tone="info" 
          />
          <KpiCard 
            label="Active Courses" 
            value={totalCourses || 0} 
            icon={BookOpen} 
            tone="success" 
          />
          <KpiCard 
            label="Avg Rating" 
            value={avgRating.toFixed(1)} 
            icon={Star} 
            tone="warning" 
          />
        </div>

        {/* Search Bar */}
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, Name, Email, Department..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {searchQuery && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              Found {filteredTeachers.length} of {teachers.length} teachers
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
          {teachers.length > 0 && (
            <div className="text-xs text-muted-foreground ml-auto">
              💡 Try searching by ID (e.g., {getTeacherId(teachers[0])})
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
                onClick={fetchTeachers}
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
              <p className="mt-4 text-muted-foreground">Loading teachers from database...</p>
            </div>
          </div>
        )}

        {/* DataTable with filtered data - REMOVED searchKeys prop */}
        {!loading && !error && (
          <DataTable 
            title="Faculty directory" 
            description={`${filteredTeachers.length} teachers found${searchQuery ? ` (filtered from ${teachers.length})` : ''}`}
            data={filteredTeachers} 
            columns={cols} 
            searchKeys={["teacherId", "_id", "name", "email", "department", "designation", "specialization", "status"] as (keyof Teacher)[]}
            pageSize={10} 
            addLabel="Add faculty"
            onAdd={openAddModal}
          />
        )}

        {/* Empty State */}
        {!loading && !error && filteredTeachers.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
            {searchQuery ? (
              <>
                <p className="text-muted-foreground mb-2">No teachers match your search</p>
                <p className="text-sm text-muted-foreground mb-4">Try searching by ID, name, email, or department</p>
                <Button 
                  variant="outline"
                  onClick={() => handleSearch('')}
                >
                  Clear Search
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground mb-4">No teachers found in database</p>
                <Button 
                  onClick={openAddModal}
                >
                  <UserPlus className="h-4 w-4 mr-2" /> Add First Teacher
                </Button>
              </>
            )}
          </div>
        )}
      </AppShell>

      {/* Add/Edit Teacher Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {isEditMode ? (
                  <>
                    <Pencil className="h-5 w-5 text-primary" />
                    Edit Teacher
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 text-primary" />
                    Add New Teacher
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
                {/* Personal Information */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3">Personal Information</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Dr. Ahmed Hassan"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="teacher@uni.edu.pk"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+92 300 1234567"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <select
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Professional Information */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Professional Information</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="designation">Designation *</Label>
                  <select
                    id="designation"
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    {designations.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    placeholder="Artificial Intelligence"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Experience (Years)</Label>
                  <Input
                    id="experience"
                    name="experience"
                    type="number"
                    min="0"
                    value={formData.experience}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rating">Rating (0-5)</Label>
                  <Input
                    id="rating"
                    name="rating"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={formData.rating}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salary">Salary (PKR)</Label>
                  <Input
                    id="salary"
                    name="salary"
                    type="number"
                    min="0"
                    value={formData.salary}
                    onChange={handleInputChange}
                    placeholder="0"
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
                    {statusOptions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="officeHours">Office Hours</Label>
                  <Input
                    id="officeHours"
                    name="officeHours"
                    value={formData.officeHours}
                    onChange={handleInputChange}
                    placeholder="Monday-Wednesday 2-4 PM"
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
                      {isEditMode ? 'Update Teacher' : 'Create Teacher'}
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