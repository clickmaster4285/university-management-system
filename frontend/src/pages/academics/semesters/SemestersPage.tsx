// src/routes/app.semesters.tsx
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { semesterAPI, Semester } from "@/lib/api/semester";
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
  Layers,
  CalendarDays,
  Check,
  ChevronLeft,
  BookOpen
} from "lucide-react";
import { toast } from "sonner";


type SemesterFormData = {
  academicSessionId: string;
  name: string;
  number: number;
  type: 'Fall' | 'Spring' | 'Summer' | 'Winter';
  startDate: string;
  endDate: string;
  registrationStart: string;
  registrationEnd: string;
  status: 'Upcoming' | 'Active' | 'Completed' | 'Inactive';
  description: string;
};

const semesterTypes = ['Fall', 'Spring', 'Summer', 'Winter'];
const statusOptions = ['Upcoming', 'Active', 'Completed', 'Inactive'];

export function SemestersPage() {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [filteredSemesters, setFilteredSemesters] = useState<Semester[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingSemester, setViewingSemester] = useState<Semester | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [selectedSessionFilter, setSelectedSessionFilter] = useState<string>("");
  
  const [formData, setFormData] = useState<SemesterFormData>({
    academicSessionId: '',
    name: '',
    number: 1,
    type: 'Fall',
    startDate: '',
    endDate: '',
    registrationStart: '',
    registrationEnd: '',
    status: 'Upcoming',
    description: ''
  });

  // Fetch semesters from database
  const fetchSemesters = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await semesterAPI.getAll();
      if (response && response.data) {
        setSemesters(response.data);
        setFilteredSemesters(response.data);
        console.log(`✅ Loaded ${response.data.length} semesters`);
      } else {
        setSemesters([]);
        setFilteredSemesters([]);
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch semesters:', error);
      let errorMsg = 'Failed to load semesters';
      if (error.message?.includes('Failed to fetch')) {
        errorMsg = 'Cannot connect to backend. Make sure backend is running.';
      }
      setError(errorMsg);
      toast.error(errorMsg);
      setSemesters([]);
      setFilteredSemesters([]);
    } finally {
      setLoading(false);
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
      const response = await semesterAPI.getStats();
      if (response && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchSemesters();
    fetchSessions();
    fetchStats();
  }, []);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      applyFilters(selectedSessionFilter);
      return;
    }
    const searchLower = query.toLowerCase().trim();
    const filtered = semesters.filter(semester => {
      const nameMatch = semester.name?.toLowerCase().includes(searchLower) || false;
      const typeMatch = semester.type?.toLowerCase().includes(searchLower) || false;
      const statusMatch = semester.status?.toLowerCase().includes(searchLower) || false;
      const sessionMatch = semester.academicSessionName?.toLowerCase().includes(searchLower) || false;
      return nameMatch || typeMatch || statusMatch || sessionMatch;
    });
    setFilteredSemesters(filtered);
  };

  // Apply filters
  const applyFilters = (sessionId: string) => {
    setSelectedSessionFilter(sessionId);
    let filtered = [...semesters];
    
    if (sessionId) {
      filtered = filtered.filter(s => s.academicSessionId === sessionId);
    }
    
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(s => 
        s.name?.toLowerCase().includes(searchLower) ||
        s.type?.toLowerCase().includes(searchLower) ||
        s.status?.toLowerCase().includes(searchLower) ||
        s.academicSessionName?.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredSemesters(filtered);
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  // Open modal for adding new semester
  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      academicSessionId: '',
      name: '',
      number: 1,
      type: 'Fall',
      startDate: '',
      endDate: '',
      registrationStart: '',
      registrationEnd: '',
      status: 'Upcoming',
      description: ''
    });
    setIsModalOpen(true);
  };

  // Open modal for editing semester
  const openEditModal = (semester: Semester) => {
    setIsEditMode(true);
    setEditingId(semester._id || semester.semesterId || null);
    setFormData({
      academicSessionId: semester.academicSessionId || '',
      name: semester.name || '',
      number: semester.number || 1,
      type: semester.type || 'Fall',
      startDate: semester.startDate ? new Date(semester.startDate).toISOString().split('T')[0] : '',
      endDate: semester.endDate ? new Date(semester.endDate).toISOString().split('T')[0] : '',
      registrationStart: semester.registrationStart ? new Date(semester.registrationStart).toISOString().split('T')[0] : '',
      registrationEnd: semester.registrationEnd ? new Date(semester.registrationEnd).toISOString().split('T')[0] : '',
      status: semester.status || 'Upcoming',
      description: semester.description || ''
    });
    setIsModalOpen(true);
  };

  // Open view modal
  const openViewModal = (semester: Semester) => {
    setViewingSemester(semester);
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
    setViewingSemester(null);
  };

  // Handle form submit (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!formData.academicSessionId || !formData.name || !formData.startDate || !formData.endDate) {
        toast.error('Academic Session, Name, Start Date, and End Date are required');
        setIsSubmitting(false);
        return;
      }

      // Validate dates
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        toast.error('End date must be after start date');
        setIsSubmitting(false);
        return;
      }

      if (formData.registrationStart && formData.registrationEnd) {
        if (new Date(formData.registrationStart) >= new Date(formData.registrationEnd)) {
          toast.error('Registration end date must be after registration start date');
          setIsSubmitting(false);
          return;
        }
      }

      const submitData = {
        academicSessionId: formData.academicSessionId,
        name: formData.name.trim(),
        number: formData.number,
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        registrationStart: formData.registrationStart || '',
        registrationEnd: formData.registrationEnd || '',
        status: formData.status,
        description: formData.description || ''
      };

      console.log('📤 Submitting semester data:', submitData);

      if (isEditMode && editingId) {
        const response = await semesterAPI.update(editingId, submitData);
        if (response && response.success !== false) {
          toast.success(`Semester "${formData.name}" updated successfully!`);
        } else {
          toast.error(response?.message || 'Failed to update semester');
          setIsSubmitting(false);
          return;
        }
      } else {
        const response = await semesterAPI.create(submitData);
        if (response && response.success !== false) {
          toast.success(`Semester "${formData.name}" created successfully!`);
        } else {
          toast.error(response?.message || 'Failed to create semester');
          setIsSubmitting(false);
          return;
        }
      }
      
      closeModal();
      await fetchSemesters();
      await fetchStats();
      setSearchQuery('');
      
    } catch (error: any) {
      console.error('❌ Failed to save semester:', error);
      let errorMsg = isEditMode ? 'Failed to update semester' : 'Failed to create semester';
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
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
      await semesterAPI.delete(id);
      toast.success(`Semester "${name}" deleted successfully`);
      await fetchSemesters();
      await fetchStats();
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to delete semester:', error);
      toast.error('Failed to delete semester');
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

  // Get semester ID
  const getSemesterId = (semester: Semester) => {
    return semester.semesterId || semester._id?.slice(-8).toUpperCase() || 'N/A';
  };

  // Get session name by ID
  const getSessionName = (sessionId: string) => {
    const session = sessions.find(s => s._id === sessionId || s.sessionId === sessionId);
    return session?.name || 'Unknown Session';
  };

  // Calculate statistics
  const totalSemesters = semesters.length;
  const activeSemesters = semesters.filter(s => s.status === 'Active').length;
  const upcomingSemesters = semesters.filter(s => s.status === 'Upcoming').length;
  const completedSemesters = semesters.filter(s => s.status === 'Completed').length;

  // Define columns for DataTable
  const cols: Column<Semester>[] = [
    {
      key: "name",
      header: "Semester",
      cell: (r) => (
        <div>
          <div className="font-medium flex items-center gap-2">
            {r.name}
            <Badge variant="outline" className="text-[10px]">{r.type}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="font-mono bg-muted px-1.5 py-0.5 rounded">ID: {getSemesterId(r)}</span> · Semester {r.number}
          </div>
        </div>
      )
    },
    { 
      key: "academicSessionName", 
      header: "Academic Session", 
      cell: (r) => <span className="text-sm">{r.academicSessionName || getSessionName(r.academicSessionId)}</span>
    },
    { 
      key: "number", 
      header: "Semester #", 
      cell: (r) => <Badge variant="secondary">Semester {r.number}</Badge>
    },
    { 
      key: "startDate", 
      header: "Start Date", 
      cell: (r) => {
        const date = new Date(r.startDate);
        return <span>{date.toLocaleDateString()}</span>;
      } 
    },
    { 
      key: "endDate", 
      header: "End Date", 
      cell: (r) => {
        const date = new Date(r.endDate);
        return <span>{date.toLocaleDateString()}</span>;
      } 
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
            onClick={() => handleDelete(r._id || r.semesterId || '', r.name)}
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
        title="Semesters"
        subtitle={`${totalSemesters} semesters · ${activeSemesters} active · ${upcomingSemesters} upcoming · ${completedSemesters} completed`}
        actions={
          <>
            <Button 
              onClick={openAddModal}
              className="gradient-brand text-white border-0 hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-2" /> Create Semester
            </Button>
            <Button 
              variant="outline" 
              onClick={() => { fetchSemesters(); fetchStats(); }}
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
            label="Total Semesters" 
            value={totalSemesters} 
            icon={Layers} 
            tone="brand" 
          />
          <KpiCard 
            label="Active" 
            value={activeSemesters} 
            icon={CheckCircle} 
            tone="success" 
          />
          <KpiCard 
            label="Upcoming" 
            value={upcomingSemesters} 
            icon={Clock} 
            tone="info" 
          />
          <KpiCard 
            label="Completed" 
            value={completedSemesters} 
            icon={Check} 
            tone="warning" 
          />
        </div>

        {/* Search and Filter */}
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, type, or status..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground whitespace-nowrap">Filter by Session:</Label>
            <select
              value={selectedSessionFilter}
              onChange={(e) => applyFilters(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Sessions</option>
              {sessions.map(session => (
                <option key={session._id} value={session._id}>
                  {session.name}
                </option>
              ))}
            </select>
          </div>
          
          {searchQuery && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              Found {filteredSemesters.length} of {semesters.length} semesters
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSearchQuery('');
                  applyFilters(selectedSessionFilter);
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
                onClick={() => { fetchSemesters(); fetchStats(); }}
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
              <p className="mt-4 text-muted-foreground">Loading semesters...</p>
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
              title="Semesters"
              description={`${filteredSemesters.length} semesters found${searchQuery ? ` (filtered from ${semesters.length})` : ''}`}
              data={filteredSemesters}
              columns={cols}
              pageSize={10}
              addLabel="Add semester"
              onAdd={openAddModal}
            />
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredSemesters.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
            {searchQuery ? (
              <>
                <p className="text-muted-foreground mb-2">No semesters match your search</p>
                <Button variant="outline" onClick={() => {
                  setSearchQuery('');
                  applyFilters(selectedSessionFilter);
                }}>
                  Clear Search
                </Button>
              </>
            ) : (
              <>
                <Layers className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No semesters found</p>
                <Button onClick={openAddModal}>
                  <Plus className="h-4 w-4 mr-2" /> Create First Semester
                </Button>
              </>
            )}
          </div>
        )}
      </AppShell>

      {/* Add/Edit Semester Modal */}
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
                  {isEditMode ? 'Edit Semester' : 'Create Semester'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isEditMode ? 'Update semester information' : 'Add a semester to an academic session'}
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
              {/* SEMESTER INFORMATION */}
              <div>
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                  <Calendar className="h-4 w-4" />
                  Semester Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="academicSessionId">Academic Session *</Label>
                    <select
                      id="academicSessionId"
                      name="academicSessionId"
                      value={formData.academicSessionId}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">Select Academic Session</option>
                      {sessions.map(session => (
                        <option key={session._id} value={session._id}>
                          {session.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Semester Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Fall 2026"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="number">Semester Number *</Label>
                    <Input
                      id="number"
                      name="number"
                      type="number"
                      min="1"
                      max="8"
                      value={formData.number}
                      onChange={handleInputChange}
                      placeholder="1"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Semester Type *</Label>
                    <select
                      id="type"
                      name="type"
                      value={formData.type}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      {semesterTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* DATES */}
              <div>
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                  <CalendarDays className="h-4 w-4" />
                  Dates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registrationStart">Registration Start</Label>
                    <Input
                      id="registrationStart"
                      name="registrationStart"
                      type="date"
                      value={formData.registrationStart}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registrationEnd">Registration End</Label>
                    <Input
                      id="registrationEnd"
                      name="registrationEnd"
                      type="date"
                      value={formData.registrationEnd}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              {/* STATUS */}
              <div>
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                  <Clock className="h-4 w-4" />
                  Status
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
                      placeholder="Semester description..."
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
                      {isEditMode ? 'Update Semester' : 'Create Semester'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Semester Modal */}
      {isViewModalOpen && viewingSemester && (
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
                  <Layers className="h-5 w-5 text-primary" />
                  Semester Details
                </h2>
                <p className="text-sm text-muted-foreground">
                  Viewing semester information
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
              {/* Semester Information */}
              <div>
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                  <Calendar className="h-4 w-4" />
                  Semester Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Semester Name</Label>
                    <p className="font-medium flex items-center gap-2">
                      {viewingSemester.name}
                      <Badge variant="outline" className="text-[10px]">{viewingSemester.type}</Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Semester Number</Label>
                    <Badge variant="secondary" className="mt-1">Semester {viewingSemester.number}</Badge>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-muted-foreground">Academic Session</Label>
                    <p className="font-medium">{viewingSemester.academicSessionName || getSessionName(viewingSemester.academicSessionId)}</p>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div>
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                  <CalendarDays className="h-4 w-4" />
                  Dates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Start Date</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p>{new Date(viewingSemester.startDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">End Date</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p>{new Date(viewingSemester.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {viewingSemester.registrationStart && (
                    <div>
                      <Label className="text-muted-foreground">Registration Start</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p>{new Date(viewingSemester.registrationStart).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                  {viewingSemester.registrationEnd && (
                    <div>
                      <Label className="text-muted-foreground">Registration End</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p>{new Date(viewingSemester.registrationEnd).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
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
                    <div className="mt-1">{getStatusBadge(viewingSemester.status || 'Upcoming')}</div>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="mt-1 text-sm bg-gray-50 p-3 rounded-lg border">
                      {viewingSemester.description || 'No description provided.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Semester ID */}
              <div className="bg-gray-50 rounded-lg p-3 border">
                <Label className="text-muted-foreground">Semester ID</Label>
                <p className="font-mono text-sm">{getSemesterId(viewingSemester)}</p>
              </div>

              {/* Duration */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <Label className="text-muted-foreground">Duration</Label>
                <p className="font-medium text-blue-700">
                  {Math.ceil((new Date(viewingSemester.endDate).getTime() - new Date(viewingSemester.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
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
                    const semester = viewingSemester;
                    closeViewModal();
                    openEditModal(semester);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Semester
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SemestersPage;
