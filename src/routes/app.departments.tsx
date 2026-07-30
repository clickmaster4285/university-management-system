// src/routes/app.departments.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { departmentAPI, Department } from "@/lib/api/departments";
import { 
  Building2, 
  Users, 
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
  MapPin,
  User
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/departments")({
  head: () => ({
    meta: [
      { title: "Departments — ScholarOS" },
      { name: "description", content: "Manage academic departments, HODs, budgets, and programs." },
      { property: "og:title", content: "Departments — ScholarOS" },
      { property: "og:description", content: "Departmental operations." },
    ],
  }),
  component: DepartmentsPage,
});

function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    head: '',
    facultyCount: 0,
    studentCount: 0,
    status: 'Active',
    location: ''
  });

  const statusOptions = ['Active', 'Inactive'];

  // Fetch departments from database
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await departmentAPI.getAll();
      if (response && response.data) {
        setDepartments(response.data);
        setFilteredDepartments(response.data);
        console.log(`✅ Loaded ${response.data.length} departments from database`);
      } else {
        setDepartments([]);
        setFilteredDepartments([]);
        setError('No data received');
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch departments:', error);
      let errorMsg = 'Failed to load departments';
      if (error.message?.includes('Failed to fetch')) {
        errorMsg = 'Cannot connect to backend. Make sure backend is running on http://localhost:4000';
      }
      setError(errorMsg);
      toast.error(errorMsg);
      setDepartments([]);
      setFilteredDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredDepartments(departments);
      return;
    }
    const searchLower = query.toLowerCase().trim();
    const filtered = departments.filter(dept => {
      const idMatch = dept.departmentId?.toLowerCase().includes(searchLower) || false;
      const nameMatch = dept.name?.toLowerCase().includes(searchLower) || false;
      const codeMatch = dept.code?.toLowerCase().includes(searchLower) || false;
      const headMatch = dept.head?.toLowerCase().includes(searchLower) || false;
      const locationMatch = dept.location?.toLowerCase().includes(searchLower) || false;
      return idMatch || nameMatch || codeMatch || headMatch || locationMatch;
    });
    setFilteredDepartments(filtered);
    console.log(`🔍 Search results: ${filtered.length} departments found`);
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'facultyCount' || name === 'studentCount' 
        ? parseInt(value) || 0 
        : value
    }));
  };

  // Open modal for adding new department
  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      head: '',
      facultyCount: 0,
      studentCount: 0,
      status: 'Active',
      location: ''
    });
    setIsModalOpen(true);
  };

  // Open modal for editing department
  const openEditModal = (dept: Department) => {
    setIsEditMode(true);
    setEditingId(dept.departmentId || null);
    setFormData({
      name: dept.name || '',
      code: dept.code || '',
      description: dept.description || '',
      head: dept.head || '',
      facultyCount: dept.facultyCount || 0,
      studentCount: dept.studentCount || 0,
      status: dept.status || 'Active',
      location: dept.location || ''
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
      if (!formData.name || !formData.code) {
        toast.error('Name and Code are required');
        setIsSubmitting(false);
        return;
      }

      if (isEditMode && editingId) {
        await departmentAPI.update(editingId, formData);
        toast.success(`Department ${formData.name} updated successfully!`);
      } else {
        await departmentAPI.create(formData);
        toast.success(`Department ${formData.name} created successfully!`);
      }
      
      closeModal();
      await fetchDepartments();
      setSearchQuery('');
    } catch (error: any) {
      console.error('Failed to save department:', error);
      let errorMsg = isEditMode ? 'Failed to update department' : 'Failed to create department';
      if (error.message?.includes('duplicate')) {
        errorMsg = 'Duplicate entry. Name or Code already exists.';
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
      await departmentAPI.delete(id);
      toast.success(`Department ${name} deleted successfully`);
      await fetchDepartments();
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to delete department:', error);
      toast.error('Failed to delete department');
    }
  };

  // Format department ID
  const getDepartmentId = (dept: Department) => {
    return dept.departmentId || dept._id?.slice(-8).toUpperCase() || 'N/A';
  };

  // Calculate statistics
  const totalDepartments = departments.length;
  const activeDepartments = departments.filter(d => d.status === 'Active').length;
  const totalFaculty = departments.reduce((sum, d) => sum + (d.facultyCount || 0), 0);
  const totalStudents = departments.reduce((sum, d) => sum + (d.studentCount || 0), 0);

  // Define columns for DataTable
  const cols: Column<Department>[] = [
    {
      key: "name",
      header: "Department",
      cell: (r) => (
        <div>
          <div className="font-medium">{r.name}</div>
          <div className="text-xs text-muted-foreground">
            <span className="font-mono bg-muted px-1.5 py-0.5 rounded">ID: {getDepartmentId(r)}</span> · Code: {r.code}
          </div>
        </div>
      )
    },
    { 
      key: "code", 
      header: "Code", 
      cell: (r) => <Badge variant="secondary">{r.code}</Badge> 
    },
    { 
      key: "head", 
      header: "Head of Department", 
      cell: (r) => (
        <div className="flex items-center gap-2">
          <User className="h-3 w-3 text-muted-foreground" />
          <span>{r.head || '—'}</span>
        </div>
      ) 
    },
    { 
      key: "facultyCount", 
      header: "Faculty", 
      cell: (r) => <span className="tabular-nums font-medium">{r.facultyCount || 0}</span> 
    },
    { 
      key: "studentCount", 
      header: "Students", 
      cell: (r) => <span className="tabular-nums font-medium">{r.studentCount || 0}</span> 
    },
    { 
      key: "location", 
      header: "Location", 
      cell: (r) => (
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{r.location || '—'}</span>
        </div>
      ) 
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
            onClick={() => r.departmentId && handleDelete(r.departmentId, r.name)}
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
        title="Departments"
        subtitle={`${totalDepartments} departments · ${activeDepartments} active · ${totalFaculty} faculty · ${totalStudents} students`}
        actions={
          <>
            <Button 
              onClick={openAddModal}
              className="gradient-brand text-white border-0 hover:opacity-90"
            >
              <UserPlus className="h-4 w-4 mr-2" /> Add Department
            </Button>
            <Button 
              variant="outline" 
              onClick={fetchDepartments}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </>
        }
      >
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard 
            label="Total Departments" 
            value={totalDepartments} 
            icon={Building2} 
            tone="brand" 
          />
          <KpiCard 
            label="Faculty" 
            value={totalFaculty} 
            icon={Users} 
            tone="info" 
          />
          <KpiCard 
            label="Students" 
            value={totalStudents} 
            icon={GraduationCap} 
            tone="success" 
          />
          <KpiCard 
            label="Active" 
            value={activeDepartments} 
            icon={Building2} 
            tone="warning" 
          />
        </div>

        {/* Search Bar */}
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by ID, Name, Code, Head..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {searchQuery && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              Found {filteredDepartments.length} of {departments.length} departments
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
          {departments.length > 0 && (
            <div className="text-xs text-muted-foreground ml-auto">
              💡 Try searching by ID (e.g., {getDepartmentId(departments[0])})
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
                onClick={fetchDepartments}
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
              <p className="mt-4 text-muted-foreground">Loading departments from database...</p>
            </div>
          </div>
        )}

        {/* DataTable - with hideSearch prop if supported */}
        {!loading && !error && (
          <div className="relative">
            {/* Hide DataTable's internal search via CSS */}
            <style>
              {`
                .data-table .data-table-search-wrapper,
                .data-table .search-wrapper,
                .data-table [data-slot="search"],
                .data-table .relative input[placeholder*="Search"] {
                  display: none !important;
                }
              `}
            </style>
            <DataTable
              title="All Departments"
              description={`${filteredDepartments.length} departments found${searchQuery ? ` (filtered from ${departments.length})` : ''}`}
              data={filteredDepartments}
              columns={cols}
              pageSize={10}
              addLabel="Add department"
              onAdd={openAddModal}
            />
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredDepartments.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
            {searchQuery ? (
              <>
                <p className="text-muted-foreground mb-2">No departments match your search</p>
                <p className="text-sm text-muted-foreground mb-4">Try searching by ID, name, code, or head</p>
                <Button variant="outline" onClick={() => handleSearch('')}>
                  Clear Search
                </Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground mb-4">No departments found in database</p>
                <Button onClick={openAddModal}>
                  <UserPlus className="h-4 w-4 mr-2" /> Add First Department
                </Button>
              </>
            )}
          </div>
        )}
      </AppShell>

      {/* Add/Edit Department Modal */}
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
                {isEditMode ? 'Edit Department' : 'Add New Department'}
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
                  <Label htmlFor="name">Department Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Computer Science"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Department Code *</Label>
                  <Input
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="CS"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Department description..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="head">Head of Department</Label>
                  <Input
                    id="head"
                    name="head"
                    value={formData.head}
                    onChange={handleInputChange}
                    placeholder="Dr. John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Building A, Floor 3"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="facultyCount">Faculty Count</Label>
                  <Input
                    id="facultyCount"
                    name="facultyCount"
                    type="number"
                    min="0"
                    value={formData.facultyCount}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentCount">Student Count</Label>
                  <Input
                    id="studentCount"
                    name="studentCount"
                    type="number"
                    min="0"
                    value={formData.studentCount}
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
                    className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {statusOptions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
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
                      {isEditMode ? 'Update Department' : 'Create Department'}
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