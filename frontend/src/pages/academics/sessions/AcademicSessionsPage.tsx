// src/routes/app.academic-sessions.tsx
import { useState, useEffect } from "react";
import { AppShell } from "@/layouts";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { academicSessionAPI, AcademicSession } from "@/features/academicSession";
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
  CalendarDays,
  Check,
} from "lucide-react";
import { toast } from "sonner";


type SessionFormData = {
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Inactive' | 'Upcoming' | 'Completed';
  isCurrent: boolean;
  description: string;
};

const statusOptions = ['Active', 'Upcoming', 'Completed', 'Inactive'];

export function AcademicSessionsPage() {
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingSession, setViewingSession] = useState<AcademicSession | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<any>(null);
  
  const [formData, setFormData] = useState<SessionFormData>({
    name: '',
    code: '',
    startDate: '',
    endDate: '',
    status: 'Upcoming',
    isCurrent: false,
    description: ''
  });

  // Fetch sessions from database
  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await academicSessionAPI.getAll();
      if (response && response.data) {
        setSessions(response.data);
        setFilteredSessions(response.data);
      } else {
        setSessions([]);
        setFilteredSessions([]);
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch academic sessions:', error);
      let errorMsg = 'Failed to load academic sessions';
      if (error.message?.includes('Failed to fetch')) {
        errorMsg = 'Cannot connect to backend. Make sure backend is running.';
      }
      setError(errorMsg);
      toast.error(errorMsg);
      setSessions([]);
      setFilteredSessions([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await academicSessionAPI.getStats();
      if (response && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchStats();
  }, []);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredSessions(sessions);
      return;
    }
    const searchLower = query.toLowerCase().trim();
    const filtered = sessions.filter(session => {
      const nameMatch = session.name?.toLowerCase().includes(searchLower) || false;
      const codeMatch = session.code?.toLowerCase().includes(searchLower) || false;
      const statusMatch = session.status?.toLowerCase().includes(searchLower) || false;
      return nameMatch || codeMatch || statusMatch;
    });
    setFilteredSessions(filtered);
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Handle switch change
  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      isCurrent: checked
    }));
  };

  // Open modal for adding new session
  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      name: '',
      code: '',
      startDate: '',
      endDate: '',
      status: 'Upcoming',
      isCurrent: false,
      description: ''
    });
    setIsModalOpen(true);
  };

  // Open modal for editing session
  const openEditModal = (session: AcademicSession) => {
    setIsEditMode(true);
    setEditingId(session._id || session.sessionId || null);
    setFormData({
      name: session.name || '',
      code: session.code || '',
      startDate: session.startDate ? new Date(session.startDate).toISOString().split('T')[0] : '',
      endDate: session.endDate ? new Date(session.endDate).toISOString().split('T')[0] : '',
      status: session.status || 'Upcoming',
      isCurrent: session.isCurrent || false,
      description: session.description || ''
    });
    setIsModalOpen(true);
  };

  // Open view modal
  const openViewModal = (session: AcademicSession) => {
    setViewingSession(session);
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
    setViewingSession(null);
  };

  // Handle form submit (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!formData.name || !formData.code || !formData.startDate || !formData.endDate) {
        toast.error('Name, Code, Start Date, and End Date are required');
        setIsSubmitting(false);
        return;
      }

      // Validate dates
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        toast.error('End date must be after start date');
        setIsSubmitting(false);
        return;
      }

      const submitData = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
        isCurrent: formData.isCurrent,
        description: formData.description || ''
      };


      if (isEditMode && editingId) {
        const response = await academicSessionAPI.update(editingId, submitData);
        if (response && response.success !== false) {
          toast.success(`Session "${formData.name}" updated successfully!`);
        } else {
          toast.error(response?.message || 'Failed to update session');
          setIsSubmitting(false);
          return;
        }
      } else {
        const response = await academicSessionAPI.create(submitData);
        if (response && response.success !== false) {
          toast.success(`Session "${formData.name}" created successfully!`);
        } else {
          toast.error(response?.message || 'Failed to create session');
          setIsSubmitting(false);
          return;
        }
      }
      
      closeModal();
      await fetchSessions();
      await fetchStats();
      setSearchQuery('');
      
    } catch (error: any) {
      console.error('❌ Failed to save session:', error);
      let errorMsg = isEditMode ? 'Failed to update session' : 'Failed to create session';
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
      await academicSessionAPI.delete(id);
      toast.success(`Session "${name}" deleted successfully`);
      await fetchSessions();
      await fetchStats();
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast.error('Failed to delete session');
    }
  };

  // Handle set current session
  const handleSetCurrent = async (id: string, name: string) => {
    try {
      const response = await academicSessionAPI.setCurrent(id);
      if (response && response.success) {
        toast.success(`"${name}" is now the current session`);
        await fetchSessions();
        await fetchStats();
      } else {
        toast.error(response?.message || 'Failed to set current session');
      }
    } catch (error) {
      console.error('Failed to set current session:', error);
      toast.error('Failed to set current session');
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

  // Get session ID
  const getSessionId = (session: AcademicSession) => {
    return session.sessionId || session._id?.slice(-8).toUpperCase() || 'N/A';
  };

  // Calculate statistics
  const totalSessions = sessions.length;
  const activeSessions = sessions.filter(s => s.status === 'Active').length;
  const upcomingSessions = sessions.filter(s => s.status === 'Upcoming').length;
  const completedSessions = sessions.filter(s => s.status === 'Completed').length;
  const currentSession = sessions.find(s => s.isCurrent === true);

  // Define columns for DataTable
  const cols: Column<AcademicSession>[] = [
    {
      key: "name",
      header: "Session",
      cell: (r) => (
        <div>
          <div className="font-medium flex items-center gap-2">
            {r.name}
            {r.isCurrent && (
              <Badge className="bg-blue-500/15 text-blue-600 border-0 text-[10px]">
                Current
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="font-mono bg-muted px-1.5 py-0.5 rounded">ID: {getSessionId(r)}</span> · Code: {r.code}
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
          {!r.isCurrent && r.status === 'Active' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleSetCurrent(r._id || '', r.name)}
              className="hover:bg-green-50 text-green-600 border-green-200"
            >
              <Check className="h-3 w-3 mr-1" /> Set Current
            </Button>
          )}
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => handleDelete(r._id || r.sessionId || '', r.name)}
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
        title="Academic Sessions"
        subtitle={`${totalSessions} sessions · ${activeSessions} active · ${currentSession ? `Current: ${currentSession.name}` : 'No current session'}`}
        actions={
          <>
            <Button 
              onClick={openAddModal}
              className="gradient-brand text-white border-0 hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-2" /> Create Session
            </Button>
            <Button 
              variant="outline" 
              onClick={() => { fetchSessions(); fetchStats(); }}
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
            label="Total Sessions" 
            value={totalSessions} 
            icon={Calendar} 
            tone="brand" 
          />
          <KpiCard 
            label="Active" 
            value={activeSessions} 
            icon={CheckCircle} 
            tone="success" 
          />
          <KpiCard 
            label="Upcoming" 
            value={upcomingSessions} 
            icon={Clock} 
            tone="info" 
          />
          <KpiCard 
            label="Completed" 
            value={completedSessions} 
            icon={Check} 
            tone="warning" 
          />
        </div>

        {/* Current Session Banner */}
        {currentSession && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800">Current Session</p>
                <p className="text-sm text-blue-600">
                  {currentSession.name} ({currentSession.code}) — {new Date(currentSession.startDate).toLocaleDateString()} to {new Date(currentSession.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Badge className="bg-blue-600 text-white border-0">Active</Badge>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, code, or status..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {searchQuery && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              Found {filteredSessions.length} of {sessions.length} sessions
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
                onClick={() => { fetchSessions(); fetchStats(); }}
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
              <p className="mt-4 text-muted-foreground">Loading academic sessions...</p>
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
              title="Academic Sessions"
              description={`${filteredSessions.length} sessions found${searchQuery ? ` (filtered from ${sessions.length})` : ''}`}
              data={filteredSessions}
              columns={cols}
              pageSize={10}
              addLabel="Add session"
              onAdd={openAddModal}
            />
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredSessions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
            {searchQuery ? (
              <>
                <p className="text-muted-foreground mb-2">No sessions match your search</p>
                <Button variant="outline" onClick={() => handleSearch('')}>
                  Clear Search
                </Button>
              </>
            ) : (
              <>
                <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No academic sessions found</p>
                <Button onClick={openAddModal}>
                  <Plus className="h-4 w-4 mr-2" /> Create First Session
                </Button>
              </>
            )}
          </div>
        )}
      </AppShell>

      {/* Add/Edit Session Modal */}
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
                  {isEditMode ? 'Edit Academic Session' : 'Create Academic Session'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isEditMode ? 'Update session information' : 'Set up a new academic year'}
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
              {/* SESSION INFORMATION */}
              <div>
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                  <Calendar className="h-4 w-4" />
                  Session Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Session Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="2026–2027"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Session Code *</Label>
                    <Input
                      id="code"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="2026-27"
                      required
                    />
                  </div>
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
                </div>
              </div>

              {/* SESSION SETTINGS */}
              <div>
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                  <Clock className="h-4 w-4" />
                  Session Settings
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
                  <div className="space-y-2 flex items-center justify-end">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200 w-full">
                      <Switch
                        id="isCurrent"
                        checked={formData.isCurrent}
                        onCheckedChange={handleSwitchChange}
                        className="data-[state=checked]:bg-blue-600"
                      />
                      <Label htmlFor="isCurrent" className="text-sm font-medium text-blue-700 cursor-pointer">
                        Set as Current Session
                      </Label>
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Academic session description..."
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
                      {isEditMode ? 'Update Session' : 'Create Session'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Session Modal */}
      {isViewModalOpen && viewingSession && (
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
                  <Calendar className="h-5 w-5 text-primary" />
                  Session Details
                </h2>
                <p className="text-sm text-muted-foreground">
                  Viewing session information
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
              {/* Session Information */}
              <div>
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                  <Calendar className="h-4 w-4" />
                  Session Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Session Name</Label>
                    <p className="font-medium flex items-center gap-2">
                      {viewingSession.name}
                      {viewingSession.isCurrent && (
                        <Badge className="bg-blue-500/15 text-blue-600 border-0">Current</Badge>
                      )}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Session Code</Label>
                    <Badge variant="secondary" className="mt-1">{viewingSession.code}</Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Start Date</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p>{new Date(viewingSession.startDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">End Date</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p>{new Date(viewingSession.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Session Settings */}
              <div>
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                  <Clock className="h-4 w-4" />
                  Session Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(viewingSession.status || 'Upcoming')}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Current Session</Label>
                    <p className="mt-1">
                      {viewingSession.isCurrent ? (
                        <Badge className="bg-green-500/15 text-green-600 border-0 flex items-center gap-1 w-fit">
                          <CheckCircle className="h-3 w-3" />
                          Yes
                        </Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="mt-1 text-sm bg-gray-50 p-3 rounded-lg border">
                      {viewingSession.description || 'No description provided.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Session ID */}
              <div className="bg-gray-50 rounded-lg p-3 border">
                <Label className="text-muted-foreground">Session ID</Label>
                <p className="font-mono text-sm">{getSessionId(viewingSession)}</p>
              </div>

              {/* Duration */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <Label className="text-muted-foreground">Duration</Label>
                <p className="font-medium text-blue-700">
                  {Math.ceil((new Date(viewingSession.endDate).getTime() - new Date(viewingSession.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
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
                {!viewingSession.isCurrent && viewingSession.status === 'Active' && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      const session = viewingSession;
                      closeViewModal();
                      handleSetCurrent(session._id || '', session.name);
                    }}
                    className="hover:bg-green-50 text-green-600 border-green-200"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Set as Current
                  </Button>
                )}
                <Button 
                  variant="outline"
                  onClick={() => {
                    const session = viewingSession;
                    closeViewModal();
                    openEditModal(session);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Session
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AcademicSessionsPage;
