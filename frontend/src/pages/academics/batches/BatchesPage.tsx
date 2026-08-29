// src/routes/app.batches.tsx
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { batchAPI, Batch } from "@/features/batches";
import { departmentAPI, Department } from "@/features/departments";
import { programAPI, Program } from "@/features/programs";
import { academicSessionAPI, AcademicSession } from "@/features/academicSession";
import { Link } from "react-router-dom";
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
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingBatch, setViewingBatch] = useState<Batch | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [wizardStep, setWizardStep] = useState(1);
  
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
      } else {
        setBatches([]);
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

  const fetchPrograms = async () => {
    try {
      const response = await programAPI.getAll({ limit: 200 });
      if (response?.data) {
        setPrograms(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch programs:", error);
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
    fetchPrograms();
    fetchSessions();
    fetchStats();
  }, []);

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      if (statusFilter !== "all" && (b.status || "Upcoming") !== statusFilter) return false;
      if (departmentFilter !== "all" && b.departmentId !== departmentFilter) return false;
      return true;
    });
  }, [batches, departmentFilter, statusFilter]);

  const clearFilters = () => {
    setDepartmentFilter("all");
    setStatusFilter("all");
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }));
  };

  const resolveDeptId = (dept: Department) => dept._id || dept.departmentId || "";

  const filteredPrograms = programs.filter((p) => {
    if (!formData.departmentId) return true;
    const deptRef = p.departmentId;
    const deptId = typeof deptRef === "object" ? deptRef._id : deptRef;
    return deptId === formData.departmentId;
  });

  const currentSession = sessions.find((s) => s.isCurrent);

  // Handle department change
  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deptId = e.target.value;
    const dept = departments.find((d) => resolveDeptId(d) === deptId);
    setFormData((prev) => ({
      ...prev,
      departmentId: deptId,
      department: dept?.name || "",
      program: "",
      programId: "",
      code: "",
    }));
  };

  const handleProgramChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const programId = e.target.value;
    const program = programs.find((p) => p._id === programId);
    if (!program) {
      setFormData((prev) => ({ ...prev, programId: "", program: "", code: "" }));
      return;
    }
    const duration = program.duration || 4;
    setFormData((prev) => ({
      ...prev,
      programId: program._id || "",
      program: program.name,
      code: program.code || program.programId || "",
      expectedGraduation: prev.year + duration,
    }));
  };

  // Handle year change - auto-generate code from program
  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const year = parseInt(e.target.value, 10) || 0;
    const program = programs.find((p) => p._id === formData.programId);
    const duration = program?.duration || 4;
    setFormData((prev) => ({
      ...prev,
      year,
      code: program ? program.code || program.programId || "" : prev.code,
      expectedGraduation: year + duration,
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

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setWizardStep(1);
    const current = sessions.find((s) => s.isCurrent);
    setFormData({
      year: new Date().getFullYear(),
      code: "",
      department: "",
      departmentId: "",
      program: "",
      programId: "",
      admissionSession: current?.name || "",
      admissionSessionId: current?._id || "",
      admissionSemester: "Fall",
      expectedGraduation: new Date().getFullYear() + 4,
      status: "Upcoming",
      description: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (batch: Batch) => {
    setIsEditMode(true);
    setWizardStep(1);
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

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingId(null);
    setWizardStep(1);
  };

  const validateWizardStep = (step: number) => {
    if (step === 1) {
      if (!formData.departmentId || !formData.programId || !formData.year || !formData.code) {
        toast.error("Select department, program, and intake year");
        return false;
      }
    }
    if (step === 2) {
      if (!formData.admissionSessionId) {
        toast.error("Select the admission session (when this cohort joined)");
        return false;
      }
    }
    return true;
  };

  const goNextWizardStep = () => {
    if (!validateWizardStep(wizardStep)) return;
    setWizardStep((s) => Math.min(3, s + 1));
  };

  const goPrevWizardStep = () => setWizardStep((s) => Math.max(1, s - 1));

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
      if (!formData.year || !formData.code || !formData.departmentId || !formData.programId || !formData.admissionSessionId) {
        toast.error('Year, code, department, program, and admission session are required');
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
        <div className="flex gap-1">
          <Button type="button" size="sm" variant="ghost" onClick={() => openViewModal(r)} title="View batch">
            <Eye className="h-4 w-4" />
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => openEditModal(r)} title="Edit batch">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(r._id || r.batchId || "", r.code)}
            title="Delete batch"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label="Total Batches" value={stats?.total ?? totalBatches} icon={Users} />
        <KpiCard label="Active" value={stats?.active ?? activeBatches} icon={CheckCircle} tone="success" />
        <KpiCard label="Upcoming" value={stats?.upcoming ?? upcomingBatches} icon={Clock} tone="info" />
        <KpiCard label="Completed" value={stats?.completed ?? completedBatches} icon={Check} tone="warning" />
      </div>

      {sessions.length === 0 && !loading && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium text-amber-900">Create a session first</p>
            <p className="text-sm text-amber-800">
              Batches need an admission session (when students joined). Set up academic sessions before batches.
            </p>
          </div>
          <Button size="sm" variant="outline" className="border-amber-300 bg-white" asChild>
            <Link to="/academic-sessions">Go to Sessions</Link>
          </Button>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 text-destructive shrink-0" />
          <div>
            <p className="font-medium">Failed to load data</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => { fetchBatches(); fetchStats(); }}>
              <RefreshCw className="h-3 w-3 mr-2" /> Retry
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          title="All Batches"
          description={`${filteredBatches.length} of ${batches.length} batch${batches.length === 1 ? "" : "es"} shown`}
          data={filteredBatches}
          columns={cols}
          searchKeys={["code", "department", "program", "admissionSession"]}
          pageSize={10}
          addLabel="Add batch"
          onAdd={openAddModal}
          filterPanel={(
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batch-dept-filter">Department</Label>
                <select
                  id="batch-dept-filter"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                >
                  <option value="all">All departments</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="batch-status-filter">Status</Label>
                <select
                  id="batch-status-filter"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All statuses</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={clearFilters}
                  disabled={departmentFilter === "all" && statusFilter === "all"}
                >
                  Clear filters
                </Button>
              </div>
            </div>
          )}
        />
      )}

      {isModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-background rounded-lg shadow-lg border w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  {isEditMode ? "Edit Batch" : "Create Batch"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isEditMode
                    ? "Update batch information"
                    : `Step ${wizardStep} of 3 — Program & cohort, then admission session`}
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={closeModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {!isEditMode && (
                <div className="flex gap-2 text-xs">
                  {[1, 2, 3].map((step) => (
                    <span
                      key={step}
                      className={`rounded-full px-3 py-1 ${
                        wizardStep === step
                          ? "bg-primary text-primary-foreground"
                          : wizardStep > step
                            ? "bg-green-100 text-green-800"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step === 1 ? "Program" : step === 2 ? "Admission" : "Settings"}
                    </span>
                  ))}
                </div>
              )}

              {(isEditMode || wizardStep === 1) && (
              <div>
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                  <Users className="h-4 w-4" />
                  {isEditMode ? "Batch Information" : "Step 1 — Program & cohort"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="departmentId">Department *</Label>
                    <select
                      id="departmentId"
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleDepartmentChange}
                      className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">Select department</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={resolveDeptId(dept)}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="programId">Program *</Label>
                    <select
                      id="programId"
                      name="programId"
                      value={formData.programId}
                      onChange={handleProgramChange}
                      className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                      disabled={!formData.departmentId}
                    >
                      <option value="">
                        {formData.departmentId ? "Select program" : "Select department first"}
                      </option>
                      {filteredPrograms.map((program) => (
                        <option key={program._id} value={program._id}>
                          {program.code} — {program.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Intake year *</Label>
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
                    <p className="text-xs text-muted-foreground">Year students joined (e.g. 2024)</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Batch code</Label>
                    <Input
                      id="code"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="BSCS-2024"
                    />
                    {formData.programId && (
                      <p className="text-xs text-muted-foreground">
                        Suggested from program + year (editable)
                      </p>
                    )}
                  </div>
                </div>
              </div>
              )}

              {(isEditMode || wizardStep === 2) && (
              <div>
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                  <UserPlus className="h-4 w-4" />
                  {isEditMode ? "Admission Information" : "Step 2 — When did they join?"}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Admission session is when this cohort <strong>entered</strong> the university — not necessarily the session you teach in today.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="admissionSessionId">Admission session *</Label>
                    <select
                      id="admissionSessionId"
                      name="admissionSessionId"
                      value={formData.admissionSessionId}
                      onChange={handleSessionChange}
                      className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">Select admission session</option>
                      {sessions.map((session) => (
                        <option key={session._id} value={session._id}>
                          {session.name}
                          {session.isCurrent ? " (current)" : ""}
                        </option>
                      ))}
                    </select>
                    {sessions.length === 0 && (
                      <p className="text-xs text-amber-600">
                        No sessions yet.{" "}
                        <Link to="/academic-sessions" className="underline">
                          Create a session
                        </Link>
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admissionSemester">Admission term *</Label>
                    <select
                      id="admissionSemester"
                      name="admissionSemester"
                      value={formData.admissionSemester}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      {semesterTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expectedGraduation">Expected graduation *</Label>
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
              )}

              {(isEditMode || wizardStep === 3) && (
              <div>
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                  <Settings className="h-4 w-4" />
                  {isEditMode ? "Batch Settings" : "Step 3 — Status & notes"}
                </h3>
                {!isEditMode && formData.code && (
                  <div className="mb-4 rounded-lg border bg-muted/40 p-3 text-sm">
                    <p className="font-medium">{formData.code}</p>
                    <p className="text-muted-foreground">
                      {formData.program} · joined {formData.admissionSession || "—"} ({formData.admissionSemester})
                    </p>
                  </div>
                )}
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
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
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
                      placeholder="Optional notes about this cohort..."
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              </div>
              )}

              <div className="flex justify-between gap-3 pt-4 border-t">
                <div>
                  {!isEditMode && wizardStep > 1 && (
                    <Button type="button" variant="outline" onClick={goPrevWizardStep}>
                      Back
                    </Button>
                  )}
                </div>
                <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={closeModal}
                >
                  Cancel
                </Button>
                {!isEditMode && wizardStep < 3 ? (
                  <Button type="button" onClick={goNextWizardStep}>
                    Next
                  </Button>
                ) : (
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
                )}
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
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
