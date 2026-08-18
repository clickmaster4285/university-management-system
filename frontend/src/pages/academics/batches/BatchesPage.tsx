// src/routes/app.batches.tsx
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { batchAPI, Batch } from "@/lib/api/batches";
import { departmentAPI, Department } from "@/lib/api/departments";
import { academicSessionAPI, AcademicSession } from "@/lib/api/academicSession";
import { 
  Calendar,
  Clock,
  RefreshCw,
  Plus,
  X,
  Save,
  Loader2,
  Pencil,
  Trash2,
  AlertCircle,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Users,
  GraduationCap,
  Building2,
  BookOpen,
  CalendarDays,
  Check,
  ChevronLeft,
  Layers,
  UserPlus,
  Settings
} from "lucide-react";
import { toast } from "sonner";


type BatchFormData = {
  year: number;
  code: string;
  department: string;
  departmentId: string;
  program: string;
  programId: string;
  admissionSession: string;
  admissionSessionId: string;
  admissionSemester: string;
  expectedGraduation: number;
  status: 'Active' | 'Inactive' | 'Upcoming' | 'Completed';
  description: string;
};

const statusOptions = ['Active', 'Upcoming', 'Completed', 'Inactive'];
const semesterTypes = ['Fall', 'Spring', 'Summer', 'Winter'];

export function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<Batch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingBatch, setViewingBatch] = useState<Batch | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("");
  
  const [formData, setFormData] = useState<BatchFormData>({
    year: new Date().getFullYear(),
    code: '',
    department: '',
    departmentId: '',
    program: '',
    programId: '',
    admissionSession: '',
    admissionSessionId: '',
    admissionSemester: 'Fall',
    expectedGraduation: new Date().getFullYear() + 4,
    status: 'Upcoming',
    description: ''
  });

  // Fetch batches from database
  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await batchAPI.getAll();
      if (response && response.data) {
        setBatches(response.data);
        setFilteredBatches(response.data);
      } else {
        setBatches([]);
        setFilteredBatches([]);
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch batches:', error);
      let errorMsg = 'Failed to load batches';
      if (error.message?.includes('Failed to fetch')) {
        errorMsg = 'Cannot connect to backend. Make sure backend is running.';
      }
      setError(errorMsg);
      toast.error(errorMsg);
      setBatches([]);
      setFilteredBatches([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      const response = await departmentAPI.getAll();
      if (response && response.data) {
        setDepartments(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  // Fetch academic sessions
  const fetchSessions = async () => {
    try {
      const response = await academicSessionAPI.getAll();
      if (response && response.data) {
        setSessions(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await batchAPI.getStats();
      if (response && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchBatches();
    fetchDepartments();
    fetchSessions();
    fetchStats();
  }, []);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      applyFilters(selectedDepartmentFilter, selectedStatusFilter);
      return;
    }
    const searchLower = query.toLowerCase().trim();
    const filtered = batches.filter(batch => {
      const codeMatch = batch.code?.toLowerCase().includes(searchLower) || false;
      const deptMatch = batch.department?.toLowerCase().includes(searchLower) || false;
      const programMatch = batch.program?.toLowerCase().includes(searchLower) || false;
      const statusMatch = batch.status?.toLowerCase().includes(searchLower) || false;
      const sessionMatch = batch.admissionSession?.toLowerCase().includes(searchLower) || false;
      return codeMatch || deptMatch || programMatch || statusMatch || sessionMatch;
    });
    setFilteredBatches(filtered);
  };

  // Apply filters
  const applyFilters = (departmentId: string, status: string) => {
    setSelectedDepartmentFilter(departmentId);
    setSelectedStatusFilter(status);
    let filtered = [...batches];
    
    if (departmentId) {
      filtered = filtered.filter(b => b.departmentId === departmentId);
    }
    
    if (status) {
      filtered = filtered.filter(b => b.status === status);
    }
    
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(b => 
        b.code?.toLowerCase().includes(searchLower) ||
        b.department?.toLowerCase().includes(searchLower) ||
        b.program?.toLowerCase().includes(searchLower) ||
        b.status?.toLowerCase().includes(searchLower) ||
        b.admissionSession?.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredBatches(filtered);
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  // Handle department change
  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deptId = e.target.value;
    const dept = departments.find(d => d._id === deptId || d.departmentId === deptId);
    setFormData(prev => ({
      ...prev,
      departmentId: deptId,
      department: dept?.name || '',
      // Auto-generate code when department and year are selected
      code: dept ? `${dept.code}-${prev.year}` : prev.code
    }));
  };

  // Handle year change - auto-generate code
  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const year = parseInt(e.target.value) || 0;
    const dept = departments.find(d => d._id === formData.departmentId || d.departmentId === formData.departmentId);
    setFormData(prev => ({
      ...prev,
      year: year,
      code: dept ? `${dept.code}-${year}` : prev.code,
      expectedGraduation: year + 4
    }));
  };

  // Handle session change
  const handleSessionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sessionId = e.target.value;
    const session = sessions.find(s => s._id === sessionId || s.sessionId === sessionId);
    setFormData(prev => ({
      ...prev,
      admissionSessionId: sessionId,
      admissionSession: session?.name || ''
    }));
  };

  // Open modal for adding new batch
  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      year: new Date().getFullYear(),
      code: '',
      department: '',
      departmentId: '',
      program: '',
      programId: '',
      admissionSession: '',
      admissionSessionId: '',
      admissionSemester: 'Fall',
      expectedGraduation: new Date().getFullYear() + 4,
      status: 'Upcoming',
      description: ''
    });
    setIsModalOpen(true);
  };

  // Open modal for editing batch
  const openEditModal = (batch: Batch) => {
    setIsEditMode(true);
    setEditingId(batch._id || batch.batchId || null);
    setFormData({
      year: batch.year || new Date().getFullYear(),
      code: batch.code || '',
      department: batch.department || '',
      departmentId: batch.departmentId || '',
      program: batch.program || '',
      programId: batch.programId || '',
      admissionSession: batch.admissionSession || '',
      admissionSessionId: batch.admissionSessionId || '',
      admissionSemester: batch.admissionSemester || 'Fall',
      expectedGraduation: batch.expectedGraduation || new Date().getFullYear() + 4,
      status: batch.status || 'Upcoming',
      description: batch.description || ''
    });
    setIsModalOpen(true);
  };

  // Open view modal
  const openViewModal = (batch: Batch) => {
    setViewingBatch(batch);
    setIsViewModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingId(null);
  };

  // Close view modal
  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setViewingBatch(null);
  };

  // Handle form submit (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!formData.year || !formData.code || !formData.departmentId || !formData.program || !formData.admissionSessionId) {
        toast.error('Year, Code, Department, Program, and Admission Session are required');
        setIsSubmitting(false);
        return;
      }

      const submitData = {
        year: formData.year,
        code: formData.code.trim().toUpperCase(),
        department: formData.department,
        departmentId: formData.departmentId,
        program: formData.program,
        programId: formData.programId || formData.program,
        admissionSession: formData.admissionSession,
        admissionSessionId: formData.admissionSessionId,
        admissionSemester: formData.admissionSemester,
        expectedGraduation: formData.expectedGraduation,
        status: formData.status,
        description: formData.description || ''
      };


      if (isEditMode && editingId) {
        const response = await batchAPI.update(editingId, submitData);
        if (response && response.success !== false) {
          toast.success(`Batch "${formData.code}" updated successfully!`);
        } else {
          toast.error(response?.message || 'Failed to update batch');
          setIsSubmitting(false);
          return;
        }
      } else {
        const response = await batchAPI.create(submitData);
        if (response && response.success !== false) {
          toast.success(`Batch "${formData.code}" created successfully!`);
        } else {
          toast.error(response?.message || 'Failed to create batch');
          setIsSubmitting(false);
          return;
        }
      }
      
      closeModal();
      await fetchBatches();
      await fetchStats();
      setSearchQuery('');
      
    } catch (error: any) {
      console.error('❌ Failed to save batch:', error);
      let errorMsg = isEditMode ? 'Failed to update batch' : 'Failed to create batch';
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete batch "${code}"?`)) return;
    try {
      await batchAPI.delete(id);
      toast.success(`Batch "${code}" deleted successfully`);
      await fetchBatches();
      await fetchStats();
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to delete batch:', error);
      toast.error('Failed to delete batch');
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string; icon: React.ReactNode }> = {
      'Active': { 
        className: 'bg-green-500/15 text-green-600 border-0', 
        label: 'Active',
        icon: <CheckCircle className="h-3 w-3" />
      },
      'Upcoming': { 
        className: 'bg-blue-500/15 text-blue-600 border-0', 
        label: 'Upcoming',
        icon: <Clock className="h-3 w-3" />
      },
      'Completed': { 
        className: 'bg-gray-500/15 text-gray-600 border-0', 
        label: 'Completed',
        icon: <Check className="h-3 w-3" />
      },
      'Inactive': { 
        className: 'bg-red-500/15 text-red-600 border-0', 
        label: 'Inactive',
        icon: <XCircle className="h-3 w-3" />
      }
    };
    
    const info = statusMap[status] || statusMap['Upcoming'];
    return (
      <Badge className={`${info.className} flex items-center gap-1`}>
        {info.icon}
        {info.label}
      </Badge>
    );
  };

  // Get batch ID
  const getBatchId = (batch: Batch) => {
    return batch.batchId || batch._id?.slice(-8).toUpperCase() || 'N/A';
  };

  // Calculate statistics
  const totalBatches = batches.length;
  const activeBatches = batches.filter(b => b.status === 'Active').length;
  const upcomingBatches = batches.filter(b => b.status === 'Upcoming').length;
  const completedBatches = batches.filter(b => b.status === 'Completed').length;

  // Define columns for DataTable
  const cols: Column<Batch>[] = [
    {
      key: "code",
      header: "Batch",
      cell: (r) => (
        <div>
          <div className="font-medium flex items-center gap-2">
            {r.code}
            <Badge variant="outline" className="text-[10px]">{r.year}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="font-mono bg-muted px-1.5 py-0.5 rounded">ID: {getBatchId(r)}</span>
          </div>
        </div>
      )
    },
    { 
      key: "department", 
      header: "Department", 
      cell: (r) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{r.department}</span>
        </div>
      )
    },
    { 
      key: "program", 
      header: "Program", 
      cell: (r) => (
        <div className="flex items-center gap-2">
          <GraduationCap className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{r.program}</span>
        </div>
      )
    },
    { 
      key: "admissionSession", 
      header: "Admission", 
      cell: (r) => (
        <div>
          <div className="text-sm">{r.admissionSession}</div>
          <div className="text-xs text-muted-foreground">{r.admissionSemester}</div>
        </div>
      )
    },
    { 
      key: "expectedGraduation", 
      header: "Expected Graduation", 
      cell: (r) => <span>{r.expectedGraduation}</span>
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => getStatusBadge(r.status || 'Upcoming')
    },
    {
      key: "actions",
      header: "Actions",
      cell: (r) => (
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => openViewModal(r)}
            className="hover:bg-blue-50"
          >
            <Eye className="h-3 w-3 mr-1" /> View
          </Button>
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
            onClick={() => handleDelete(r._id || r.batchId || '', r.code)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <>
      <AppShell
        title="Batches"
        subtitle={`${totalBatches} batches · ${activeBatches} active · ${upcomingBatches} upcoming · ${completedBatches} completed`}
        actions={
          <>
            <Button 
              onClick={openAddModal}
              className="gradient-brand text-white border-0 hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-2" /> Create Batch
            </Button>
            <Button 
              variant="outline" 
              onClick={() => { fetchBatches(); fetchStats(); }}
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
            label="Total Batches" 
            value={totalBatches} 
            icon={Users} 
            tone="brand" 
          />
          <KpiCard 
            label="Active" 
            value={activeBatches} 
            icon={CheckCircle} 
            tone="success" 
          />
          <KpiCard 
            label="Upcoming" 
            value={upcomingBatches} 
            icon={Clock} 
            tone="info" 
          />
          <KpiCard 
            label="Completed" 
            value={completedBatches} 
            icon={Check} 
            tone="warning" 
          />
        </div>

        {/* Search and Filter */}
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by code, department, or program..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground whitespace-nowrap">Department:</Label>
            <select
              value={selectedDepartmentFilter}
              onChange={(e) => applyFilters(e.target.value, selectedStatusFilter)}
              className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground whitespace-nowrap">Status:</Label>
            <select
              value={selectedStatusFilter}
              onChange={(e) => applyFilters(selectedDepartmentFilter, e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Status</option>
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          
          {searchQuery && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              Found {filteredBatches.length} of {batches.length} batches
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSearchQuery('');
                  applyFilters(selectedDepartmentFilter, selectedStatusFilter);
                }}
                className="h-7 px-2"
              >
                ✕ Clear
              </Button>
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
                onClick={() => { fetchBatches(); fetchStats(); }}
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
              <p className="mt-4 text-muted-foreground">Loading batches...</p>
            </div>
          </div>
        )}

        {/* DataTable */}
        {!loading && !error && (
          <div className="relative">
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
              title="Batches"
              description={`${filteredBatches.length} batches found${searchQuery ? ` (filtered from ${batches.length})` : ''}`}
              data={filteredBatches}
              columns={cols}
              pageSize={10}
              addLabel="Add batch"
              onAdd={openAddModal}
            />
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredBatches.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
            {searchQuery ? (
              <>
                <p className="text-muted-foreground mb-2">No batches match your search</p>
                <Button variant="outline" onClick={() => {
                  setSearchQuery('');
                  applyFilters('', '');
                }}>
                  Clear Search
                </Button>
              </>
            ) : (
              <>
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No batches found</p>
                <Button onClick={openAddModal}>
                  <Plus className="h-4 w-4 mr-2" /> Create First Batch
                </Button>
              </>
            )}
          </div>
        )}
      </AppShell>

      {/* Add/Edit Batch Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {isEditMode ? 'Edit Batch' : 'Create New Batch'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isEditMode ? 'Update batch information' : 'Create a student cohort for an academic program'}
                </p>
              </div>
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
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* BATCH INFORMATION */}
              <div>
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                  <Users className="h-4 w-4" />
                  Batch Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Batch Year *</Label>
                    <Input
                      id="year"
                      name="year"
                      type="number"
                      min={2000}
                      max={2100}
                      value={formData.year}
                      onChange={handleYearChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Batch Code</Label>
                    <Input
                      id="code"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="BSCS-2026"
                      readOnly={!isEditMode && !!formData.departmentId}
                      className={formData.departmentId ? 'bg-gray-50' : ''}
                    />
                    {formData.departmentId && (
                      <p className="text-xs text-muted-foreground">Auto-generated from department code and year</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="departmentId">Department *</Label>
                    <select
                      id="departmentId"
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleDepartmentChange}
                      className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="program">Program *</Label>
                    <Input
                      id="program"
                      name="program"
                      value={formData.program}
                      onChange={handleInputChange}
                      placeholder="BS Computer Science"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* ADMISSION INFORMATION */}
              <div>
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                  <UserPlus className="h-4 w-4" />
                  Admission Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="admissionSessionId">Admission Session *</Label>
                    <select
                      id="admissionSessionId"
                      name="admissionSessionId"
                      value={formData.admissionSessionId}
                      onChange={handleSessionChange}
                      className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">Select Admission Session</option>
                      {sessions.map(session => (
                        <option key={session._id} value={session._id}>
                          {session.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admissionSemester">Admission Semester *</Label>
                    <select
                      id="admissionSemester"
                      name="admissionSemester"
                      value={formData.admissionSemester}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      {semesterTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expectedGraduation">Expected Graduation *</Label>
                    <Input
                      id="expectedGraduation"
                      name="expectedGraduation"
                      type="number"
                      min={2000}
                      max={2100}
                      value={formData.expectedGraduation}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* BATCH SETTINGS */}
              <div>
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                  <Settings className="h-4 w-4" />
                  Batch Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      {statusOptions.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Batch description..."
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t">
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
                      {isEditMode ? 'Update Batch' : 'Create Batch'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Batch Modal */}
      {isViewModalOpen && viewingBatch && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeViewModal();
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Batch Details
                </h2>
                <p className="text-sm text-muted-foreground">
                  Viewing batch information
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={closeViewModal}
                className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Batch Information */}
              <div>
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                  <Users className="h-4 w-4" />
                  Batch Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Batch Code</Label>
                    <p className="font-medium">{viewingBatch.code}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Batch Year</Label>
                    <p className="font-medium">{viewingBatch.year}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Department</Label>
                    <p className="font-medium">{viewingBatch.department}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Program</Label>
                    <p className="font-medium">{viewingBatch.program}</p>
                  </div>
                </div>
              </div>

              {/* Admission Information */}
              <div>
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                  <UserPlus className="h-4 w-4" />
                  Admission Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Admission Session</Label>
                    <p className="font-medium">{viewingBatch.admissionSession}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Admission Semester</Label>
                    <p className="font-medium">{viewingBatch.admissionSemester}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Expected Graduation</Label>
                    <p className="font-medium">{viewingBatch.expectedGraduation}</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                  <Clock className="h-4 w-4" />
                  Status
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(viewingBatch.status || 'Upcoming')}</div>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="mt-1 text-sm bg-gray-50 p-3 rounded-lg border">
                      {viewingBatch.description || 'No description provided.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Batch ID */}
              <div className="bg-gray-50 rounded-lg p-3 border">
                <Label className="text-muted-foreground">Batch ID</Label>
                <p className="font-mono text-sm">{getBatchId(viewingBatch)}</p>
              </div>

              {/* Duration */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <Label className="text-muted-foreground">Program Duration</Label>
                <p className="font-medium text-blue-700">
                  {viewingBatch.expectedGraduation - viewingBatch.year} years
                </p>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  variant="outline"
                  onClick={closeViewModal}
                >
                  Close
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    const batch = viewingBatch;
                    closeViewModal();
                    openEditModal(batch);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Batch
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BatchesPage;
