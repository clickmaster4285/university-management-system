import { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/layouts";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { departmentAPI, type Department } from "@/features/departments";
import { campusAPI, type Campus } from "@/features/campus";
import { teacherAPI, type Teacher } from "@/features/teachers";
import { facultyAPI, type Faculty } from "@/features/faculties";
import { AnimatedTrendChart, AnimatedGauge } from "./Charts";
import { DepartmentFormModal, type DepartmentFormData, EMPTY_FORM } from "./DepartmentFormModal";
import { DepartmentViewModal } from "./DepartmentViewModal";
import {
  Building2, Users, RefreshCw, UserPlus, Search,
  Eye, Pencil, Trash2, MapPin, User, Mail, ThumbsUp, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);

  // Form modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<DepartmentFormData>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View modal state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingDepartment, setViewingDepartment] = useState<Department | null>(null);

  // ── Data fetching ──────────────────────────────────────────
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await departmentAPI.getAll();
      if (response?.data) {
        setDepartments(response.data);
        setFilteredDepartments(response.data);
      } else {
        setDepartments([]);
        setFilteredDepartments([]);
        setError("No data received");
      }
    } catch (err: any) {
      const msg = err.message?.includes("Failed to fetch")
        ? "Cannot connect to backend. Make sure backend is running on http://localhost:4000"
        : "Failed to load departments";
      setError(msg);
      toast.error(msg);
      setDepartments([]);
      setFilteredDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelated = async () => {
    try {
      const [campusRes, teacherRes, facRes] = await Promise.all([
        campusAPI.getAll(),
        teacherAPI.getAll(),
        facultyAPI.getAll(),
      ]);
      setCampuses(Array.isArray(campusRes?.data) ? campusRes.data : []);
      setTeachers(teacherRes || []);
      setFaculties(Array.isArray(facRes?.data) ? facRes.data : []);
    } catch (err) {
      console.error("Failed to fetch related data:", err);
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchRelated();
  }, []);

  // ── Search ─────────────────────────────────────────────────
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredDepartments(departments);
      return;
    }
    const q = query.toLowerCase().trim();
    setFilteredDepartments(
      departments.filter((d) => {
        const headName = typeof d.headId === "object" ? d.headId.name : "";
        return (
          d.departmentId?.toLowerCase().includes(q) ||
          d.name?.toLowerCase().includes(q) ||
          d.code?.toLowerCase().includes(q) ||
          headName?.toLowerCase().includes(q) ||
          d.location?.toLowerCase().includes(q)
        );
      })
    );
  };

  // ── Stats ──────────────────────────────────────────────────
  const totalDepartments = departments.length;
  const activeDepartments = departments.filter((d) => d.status === "Active").length;
  const activeRate = totalDepartments > 0 ? Math.round((activeDepartments / totalDepartments) * 100) : 0;

  // ── Form handlers ──────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setIsEditMode(true);
    setEditingId(dept.departmentId || dept._id || null);
    setFormData({
      name: dept.name || "",
      code: dept.code || "",
      description: dept.description || "",
      campusId: typeof dept.campusId === "object" ? dept.campusId._id : dept.campusId || "",
      headId: typeof dept.headId === "object" ? dept.headId._id : dept.headId || "",
      facultyId: typeof dept.facultyId === "object" ? dept.facultyId._id : dept.facultyId || "",
      status: dept.status || "Active",
      location: dept.location || "",
      email: dept.email || "",
      phone: dept.phone || "",
      establishedDate: dept.establishedDate || "",
    });
    setIsModalOpen(true);
  };

  const openViewModal = (dept: Department) => {
    setViewingDepartment(dept);
    setIsViewModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!formData.name || !formData.code) {
        toast.error("Name and Code are required");
        return;
      }
      if (isEditMode && editingId) {
        await departmentAPI.update(editingId, formData);
        toast.success(`Department ${formData.name} updated successfully!`);
      } else {
        await departmentAPI.create(formData);
        toast.success(`Department ${formData.name} created successfully!`);
      }
      setIsModalOpen(false);
      await fetchDepartments();
      setSearchQuery("");
    } catch (err: any) {
      const msg = err.message?.includes("duplicate")
        ? "Duplicate entry. Name or Code already exists."
        : isEditMode ? "Failed to update department" : "Failed to create department";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await departmentAPI.delete(id);
      toast.success(`Department ${name} deleted successfully`);
      await fetchDepartments();
      setSearchQuery("");
    } catch {
      toast.error("Failed to delete department");
    }
  };

  // ── Table columns ──────────────────────────────────────────
  const getDepartmentId = (dept: Department) => dept.departmentId || dept._id?.slice(-8).toUpperCase() || "N/A";

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
      ),
    },
    { key: "code", header: "Code", cell: (r) => <Badge variant="secondary">{r.code}</Badge> },
    {
      key: "head",
      header: "Head of Department",
      cell: (r) => (
        <div className="flex items-center gap-2">
          <User className="h-3 w-3 text-muted-foreground" />
          <span>{typeof r.headId === "object" ? r.headId?.name || "—" : "—"}</span>
        </div>
      ),
    },
    {
      key: "location",
      header: "Location",
      cell: (r) => (
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{r.location || "—"}</span>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      cell: (r) => (
        <div className="flex items-center gap-1">
          <Mail className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{r.email || "—"}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => {
        const s = r.status || "Active";
        return <Badge variant={s === "Active" ? "default" : "outline"}>{s}</Badge>;
      },
    },
    {
      key: "actions",
      header: "Actions",
      cell: (r) => (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => openViewModal(r)} className="hover:bg-blue-50">
            <Eye className="h-3 w-3 mr-1" /> View
          </Button>
          <Button variant="outline" size="sm" onClick={() => openEditModal(r)} className="hover:bg-blue-50">
            <Pencil className="h-3 w-3 mr-1" /> Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleDelete(r.departmentId || r._id || "", r.name)}>
            <Trash2 className="h-3 w-3 mr-1" /> Delete
          </Button>
        </div>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────
  return (
    <>
      <AppShell
        title="Departments"
        subtitle={`${totalDepartments} departments · ${activeDepartments} active`}
        actions={
          <>
            <Button onClick={openAddModal} className="gradient-brand text-white border-0 hover:opacity-90">
              <UserPlus className="h-4 w-4 mr-2" /> Add Department
            </Button>
            <Button variant="outline" onClick={fetchDepartments} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </>
        }
      >
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <KpiCard label="Total Departments" value={totalDepartments} icon={Building2} tone="brand" />
          <KpiCard label="Active Departments" value={activeDepartments} icon={Building2} tone="success" />
          <KpiCard label="Active Rate" value={`${activeRate}%`} icon={ThumbsUp} tone="warning" />
        </div>

        {/* Charts */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <AnimatedTrendChart title="Department Growth" seriesALabel="Faculty" seriesBLabel="Students" />
            </div>
            <AnimatedGauge title="Active Department Rate" value={activeRate} />
          </div>
        )}

        {/* Search */}
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by ID, Name, Code, Head..." value={searchQuery} onChange={(e) => handleSearch(e.target.value)} className="pl-9" />
          </div>
          {searchQuery && (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              Found {filteredDepartments.length} of {departments.length} departments
              <Button variant="ghost" size="sm" onClick={() => handleSearch("")} className="h-7 px-2">✕ Clear</Button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Failed to load data</p>
              <p className="text-sm">{error}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={fetchDepartments}>
                <RefreshCw className="h-3 w-3 mr-2" /> Retry
              </Button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              <p className="mt-4 text-muted-foreground">Loading departments from database...</p>
            </div>
          </div>
        )}

        {/* DataTable */}
        {!loading && !error && (
          <div className="relative">
            <style>{`.data-table .data-table-search-wrapper,.data-table .search-wrapper,.data-table [data-slot="search"],.data-table .relative input[placeholder*="Search"]{display:none!important;}`}</style>
            <DataTable
              title="All Departments"
              description={`${filteredDepartments.length} departments found${searchQuery ? ` (filtered from ${departments.length})` : ""}`}
              data={filteredDepartments}
              columns={cols}
              pageSize={10}
              addLabel="Add department"
              onAdd={openAddModal}
            />
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredDepartments.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg">
            {searchQuery ? (
              <>
                <p className="text-muted-foreground mb-2">No departments match your search</p>
                <Button variant="outline" onClick={() => handleSearch("")}>Clear Search</Button>
              </>
            ) : (
              <>
                <p className="text-muted-foreground mb-4">No departments found in database</p>
                <Button onClick={openAddModal}><UserPlus className="h-4 w-4 mr-2" /> Add First Department</Button>
              </>
            )}
          </div>
        )}
      </AppShell>

      {/* Modals */}
      <DepartmentFormModal
        isOpen={isModalOpen}
        isEditMode={isEditMode}
        formData={formData}
        isSubmitting={isSubmitting}
        campuses={campuses}
        teachers={teachers}
        faculties={faculties}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        onClose={() => setIsModalOpen(false)}
      />
      <DepartmentViewModal
        isOpen={isViewModalOpen}
        department={viewingDepartment}
        onClose={() => setIsViewModalOpen(false)}
        onEdit={openEditModal}
      />
    </>
  );
}
