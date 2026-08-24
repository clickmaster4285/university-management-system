// src/routes/app.departments.tsx
import { useState, useEffect, useMemo, useRef } from "react";
import { AppShell } from "@/layouts";
import { DataTable, type Column } from "@/components/data-table";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { departmentAPI, Department } from "@/features/departments";
import { campusAPI, Campus } from "@/features/campus";
import { teacherAPI, Teacher } from "@/features/teachers";
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
  User,
  Download,
  ChevronDown,
  ThumbsUp,
  Eye,
  Mail,
  Phone,
  Calendar,
  FileText,
  ChevronLeft
} from "lucide-react";
import { toast } from "sonner";

/* ============================================================
   Inlined chart components (originally components/charts/*)
   ============================================================ */

export type TrendPoint = {
  label: string;
  faculty: number;
  students: number;
};

type SortKey = "Years" | "Quarters";

type DepartmentStatus = "Active" | "Inactive";

type DepartmentFormData = {
  name: string;
  code: string;
  description: string;
  campusId: string;
  headId: string;
  status: DepartmentStatus;
  location: string;
  email: string;
  phone: string;
  establishedDate: string;
  faculty: string;
};

const DEFAULT_DATASETS: Record<SortKey, TrendPoint[]> = {
  Years: [
    { label: "2020", faculty: 42, students: 58 },
    { label: "2021", faculty: 55, students: 50 },
    { label: "2022", faculty: 48, students: 66 },
    { label: "2023", faculty: 63, students: 54 },
    { label: "2024", faculty: 58, students: 72 },
    { label: "2025", faculty: 70, students: 61 },
    { label: "2026", faculty: 65, students: 78 },
  ],
  Quarters: [
    { label: "Q1", faculty: 50, students: 60 },
    { label: "Q2", faculty: 58, students: 66 },
    { label: "Q3", faculty: 55, students: 71 },
    { label: "Q4", faculty: 65, students: 68 },
  ],
};

const WIDTH = 700;
const HEIGHT = 220;
const PAD_X = 20;
const PAD_Y = 24;

// Catmull-Rom -> cubic Bezier smoothing
function smoothPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return "";
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

function useDrawIn(pathRef: React.RefObject<SVGPathElement | null>, dep: unknown) {
  useEffect(() => {
    const el = pathRef.current;
    if (!el) return;
    const len = el.getTotalLength();
    el.style.transition = "none";
    el.style.strokeDasharray = `${len}`;
    el.style.strokeDashoffset = `${len}`;
    el.getBoundingClientRect();
    el.style.transition = "stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)";
    el.style.strokeDashoffset = "0";
  }, [dep]);
}

export function AnimatedTrendChart({
  title = "Department Growth",
  seriesALabel = "Faculty",
  seriesBLabel = "Students",
  datasets = DEFAULT_DATASETS,
}: {
  title?: string;
  seriesALabel?: string;
  seriesBLabel?: string;
  datasets?: Record<SortKey, TrendPoint[]>;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("Years");
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathARef = useRef<SVGPathElement | null>(null);
  const pathBRef = useRef<SVGPathElement | null>(null);

  const data = datasets[sortKey];

  const { pointsA, pointsB, maxVal } = useMemo(() => {
    const max = Math.max(...data.flatMap((d) => [d.faculty, d.students])) * 1.15;
    const step = (WIDTH - PAD_X * 2) / (data.length - 1);
    const scaleY = (v: number) =>
      HEIGHT - PAD_Y - (v / max) * (HEIGHT - PAD_Y * 2);
    const pointsA = data.map((d, i) => ({ x: PAD_X + i * step, y: scaleY(d.faculty) }));
    const pointsB = data.map((d, i) => ({ x: PAD_X + i * step, y: scaleY(d.students) }));
    return { pointsA, pointsB, maxVal: max };
  }, [data]);

  useDrawIn(pathARef, sortKey);
  useDrawIn(pathBRef, sortKey);

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const step = (WIDTH - PAD_X * 2) / (data.length - 1);
    let idx = Math.round((relX - PAD_X) / step);
    idx = Math.max(0, Math.min(data.length - 1, idx));
    setHoverIdx(idx);
  };

  const downloadSvg = () => {
    const el = svgRef.current;
    if (!el) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(el);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "-").toLowerCase()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hovered = hoverIdx !== null ? data[hoverIdx] : null;
  const hoverPoint = hoverIdx !== null ? pointsA[hoverIdx] : null;

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-1 text-sm font-semibold text-foreground"
          >
            {title}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-slate-400" /> {seriesALabel}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-orange-500" /> {seriesBLabel}
            </span>
          </div>

          <label className="text-xs text-muted-foreground">Sort by</label>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="text-sm border rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="Years">Years</option>
            <option value="Quarters">Quarters</option>
          </select>

          <button
            onClick={downloadSvg}
            className="h-8 w-8 flex items-center justify-center rounded-lg border hover:bg-muted transition-colors"
            title="Download chart"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-auto"
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIdx(null)}
        >
          {/* gridlines */}
          {[0, 1, 2, 3].map((i) => (
            <line
              key={i}
              x1={PAD_X}
              x2={WIDTH - PAD_X}
              y1={PAD_Y + (i * (HEIGHT - PAD_Y * 2)) / 3}
              y2={PAD_Y + (i * (HEIGHT - PAD_Y * 2)) / 3}
              stroke="#eef0f3"
              strokeWidth={1}
            />
          ))}

          <path
            ref={pathARef}
            d={smoothPath(pointsA)}
            fill="none"
            stroke="#94a3b8"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <path
            ref={pathBRef}
            d={smoothPath(pointsB)}
            fill="none"
            stroke="#f97316"
            strokeWidth={2.5}
            strokeLinecap="round"
          />

          {hoverIdx !== null && (
            <>
              <line
                x1={pointsA[hoverIdx].x}
                x2={pointsA[hoverIdx].x}
                y1={PAD_Y}
                y2={HEIGHT - PAD_Y}
                stroke="#f97316"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
              <circle cx={pointsB[hoverIdx].x} cy={pointsB[hoverIdx].y} r={5} fill="#f97316" className="animate-pulse" />
              <circle cx={pointsA[hoverIdx].x} cy={pointsA[hoverIdx].y} r={4} fill="#94a3b8" />
            </>
          )}

          {/* x labels */}
          {data.map((d, i) => (
            <text
              key={d.label}
              x={pointsA[i].x}
              y={HEIGHT - 4}
              fontSize={10}
              textAnchor="middle"
              fill="#94a3b8"
            >
              {d.label}
            </text>
          ))}
        </svg>

        {hovered && hoverPoint && (
          <div
            className="absolute pointer-events-none bg-white border rounded-xl shadow-lg px-3 py-2 text-xs transition-all duration-150"
            style={{
              left: `${(hoverPoint.x / WIDTH) * 100}%`,
              top: 0,
              transform: "translate(-50%, -110%)",
            }}
          >
            <div className="font-semibold mb-1">{hovered.label}</div>
            <div className="text-slate-500">
              {seriesALabel}: <span className="font-medium text-foreground">{hovered.faculty}</span>
            </div>
            <div className="text-orange-500">
              {seriesBLabel}: <span className="font-medium">{hovered.students}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const SIZE = 220;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = Math.PI * RADIUS;

export function AnimatedGauge({
  title = "Department Health",
  value,
  icon: Icon = ThumbsUp,
}: {
  title?: string;
  value: number;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const [display, setDisplay] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const arcRef = useRef<SVGPathElement | null>(null);

  useEffect(() => {
    const el = arcRef.current;
    if (el) {
      el.style.transition = "none";
      el.style.strokeDashoffset = `${CIRC}`;
      el.getBoundingClientRect();
      el.style.transition = "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)";
      el.style.strokeDashoffset = `${CIRC - (clamped / 100) * CIRC}`;
    }

    let raf: number;
    const start = performance.now();
    const duration = 1200;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * clamped));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [clamped]);

  const downloadSvg = () => {
    const el = svgRef.current;
    if (!el) return;
    const source = new XMLSerializer().serializeToString(el);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "-").toLowerCase()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cx = SIZE / 2;
  const cy = SIZE / 2;

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <button
          onClick={downloadSvg}
          className="h-8 w-8 flex items-center justify-center rounded-lg border hover:bg-muted transition-colors"
          title="Download"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>

      <div className="relative mx-auto" style={{ width: SIZE, height: SIZE / 2 + 30 }}>
        <svg ref={svgRef} width={SIZE} height={SIZE / 2 + 30} viewBox={`0 0 ${SIZE} ${SIZE / 2 + 30}`}>
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#fdba74" />
            </linearGradient>
          </defs>

          {/* track */}
          <path
            d={`M ${cx - RADIUS} ${cy} A ${RADIUS} ${RADIUS} 0 0 1 ${cx + RADIUS} ${cy}`}
            fill="none"
            stroke="#f1f2f4"
            strokeWidth={STROKE}
            strokeLinecap="round"
          />
          {/* animated arc */}
          <path
            ref={arcRef}
            d={`M ${cx - RADIUS} ${cy} A ${RADIUS} ${RADIUS} 0 0 1 ${cx + RADIUS} ${cy}`}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
          />

          <text x={cx - RADIUS} y={cy + 22} fontSize={11} fill="#94a3b8">0%</text>
          <text x={cx + RADIUS} y={cy + 22} textAnchor="end" fontSize={11} fill="#94a3b8">100%</text>
        </svg>

        {/* center icon + number */}
        <div
          className="absolute left-1/2 flex flex-col items-center"
          style={{ top: cy - 34, transform: "translateX(-50%)" }}
        >
          <div className="h-9 w-9 rounded-full bg-orange-50 flex items-center justify-center mb-1 animate-[pulse_2.5s_ease-in-out_infinite]">
            <Icon className="h-4 w-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-orange-500 tabular-nums">{display}%</div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   End inlined chart components
   ============================================================ */


// Faculty options
const faculties = [
  'Faculty of Computing',
  'Faculty of Engineering',
  'Faculty of Business Administration',
  'Faculty of Sciences',
  'Faculty of Arts & Humanities',
  'Faculty of Social Sciences',
  'Faculty of Law',
  'Faculty of Medicine'
];

// HOD options
export function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingDepartment, setViewingDepartment] = useState<Department | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  
  const [formData, setFormData] = useState<DepartmentFormData>({
    name: '',
    code: '',
    description: '',
    campusId: '',
    headId: '',
    status: 'Active',
    location: '',
    email: '',
    phone: '',
    establishedDate: '',
    faculty: ''
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
    fetchCampusesAndTeachers();
  }, []);

  const fetchCampusesAndTeachers = async () => {
    try {
      const [campusRes, teacherRes] = await Promise.all([
        campusAPI.getAll(),
        teacherAPI.getAll()
      ]);
      setCampuses(campusRes?.data || []);
      setTeachers(teacherRes || []);
    } catch (err) {
      console.error('Failed to fetch campuses/teachers:', err);
    }
  };

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
      const headIdName = typeof dept.headId === 'object' ? dept.headId.name : '';
      const headMatch = headIdName?.toLowerCase().includes(searchLower) || false;
      const locationMatch = dept.location?.toLowerCase().includes(searchLower) || false;
      return idMatch || nameMatch || codeMatch || headMatch || locationMatch;
    });
    setFilteredDepartments(filtered);
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      campusId: '',
      headId: '',
      status: 'Active',
      location: '',
      email: '',
      phone: '',
      establishedDate: '',
      faculty: ''
    });
    setIsModalOpen(true);
  };

  // Open modal for editing department
  const openEditModal = (dept: Department) => {
    setIsEditMode(true);
    setEditingId(dept.departmentId || dept._id || null);
    setFormData({
      name: dept.name || '',
      code: dept.code || '',
      description: dept.description || '',
      campusId: typeof dept.campusId === 'object' ? dept.campusId._id : (dept.campusId || ''),
      headId: typeof dept.headId === 'object' ? dept.headId._id : (dept.headId || ''),
      status: dept.status || 'Active',
      location: dept.location || '',
      email: dept.email || '',
      phone: dept.phone || '',
      establishedDate: dept.establishedDate || '',
      faculty: dept.faculty || ''
    });
    setIsModalOpen(true);
  };

  // Open view modal
  const openViewModal = (dept: Department) => {
    setViewingDepartment(dept);
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
    setViewingDepartment(null);
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
  const activeRate = totalDepartments > 0 ? Math.round((activeDepartments / totalDepartments) * 100) : 0;

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
      key: "email", 
      header: "Email", 
      cell: (r) => (
        <div className="flex items-center gap-1">
          <Mail className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">{r.email || '—'}</span>
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
            onClick={() => handleDelete(r.departmentId || r._id || '', r.name)}
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
        subtitle={`${totalDepartments} departments · ${activeDepartments} active`}
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
        {/* KPI Cards - Removed faculty and student stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <KpiCard 
            label="Total Departments" 
            value={totalDepartments} 
            icon={Building2} 
            tone="brand" 
          />
          <KpiCard 
            label="Active Departments" 
            value={activeDepartments} 
            icon={Building2} 
            tone="success" 
          />
          <KpiCard 
            label="Active Rate" 
            value={`${activeRate}%`} 
            icon={ThumbsUp} 
            tone="warning" 
          />
        </div>

        {/* Animated Graphics Row (trend chart + gauge) */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <AnimatedTrendChart
                title="Department Growth"
                seriesALabel="Faculty"
                seriesBLabel="Students"
              />
            </div>
            <AnimatedGauge title="Active Department Rate" value={activeRate} />
          </div>
        )}

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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {isEditMode ? 'Edit Department' : 'Create Department'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {isEditMode ? 'Update department information' : 'Add a new academic department'}
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
              {/* BASIC INFORMATION */}
              <div>
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                  <Building2 className="h-4 w-4" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Department Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Department of Computer Science"
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
                  <div className="space-y-2">
                    <Label htmlFor="campusId">Campus *</Label>
                    <select
                      id="campusId"
                      name="campusId"
                      value={formData.campusId}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">Select Campus</option>
                      {campuses.map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="faculty">Faculty / School *</Label>
                    <select
                      id="faculty"
                      name="faculty"
                      value={formData.faculty}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    >
                      <option value="">Select Faculty</option>
                      {faculties.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="headId">Head of Department</Label>
                    <select
                      id="headId"
                      name="headId"
                      value={formData.headId}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select HOD</option>
                      {teachers.map(t => (
                        <option key={t._id} value={t._id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* CONTACT INFORMATION */}
              <div>
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                  <Mail className="h-4 w-4" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Department Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="cs@university.edu.pk"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="051-1234567"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="location">Office Location</Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Block A - Room 201"
                    />
                  </div>
                </div>
              </div>

              {/* ADDITIONAL INFORMATION */}
              <div>
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                  <FileText className="h-4 w-4" />
                  Additional Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="establishedDate">Established Date</Label>
                    <Input
                      id="establishedDate"
                      name="establishedDate"
                      type="date"
                      value={formData.establishedDate}
                      onChange={handleInputChange}
                    />
                  </div>
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
                      placeholder="Department description..."
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
                      {isEditMode ? 'Update Department' : 'Create Department'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Department Modal */}
      {isViewModalOpen && viewingDepartment && (
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
                  <Building2 className="h-5 w-5 text-primary" />
                  Department Details
                </h2>
                <p className="text-sm text-muted-foreground">
                  Viewing department information
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
              {/* Basic Information */}
              <div>
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                  <Building2 className="h-4 w-4" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Department Name</Label>
                    <p className="font-medium">{viewingDepartment.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Department Code</Label>
                    <Badge variant="secondary" className="mt-1">{viewingDepartment.code}</Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Faculty / School</Label>
                    <p>{viewingDepartment.faculty || '—'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Head of Department</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{viewingDepartment.head || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                  <Mail className="h-4 w-4" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p>{viewingDepartment.email || '—'}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Phone</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <p>{viewingDepartment.phone || '—'}</p>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-muted-foreground">Office Location</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <p>{viewingDepartment.location || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div>
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                  <FileText className="h-4 w-4" />
                  Additional Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Established Date</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <p>{viewingDepartment.establishedDate ? new Date(viewingDepartment.establishedDate).toLocaleDateString() : '—'}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <Badge variant={viewingDepartment.status === 'Active' ? 'default' : 'outline'}>
                        {viewingDepartment.status || 'Active'}
                      </Badge>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="mt-1 text-sm bg-gray-50 p-3 rounded-lg border">
                      {viewingDepartment.description || 'No description provided.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Department ID */}
              <div className="bg-gray-50 rounded-lg p-3 border">
                <Label className="text-muted-foreground">Department ID</Label>
                <p className="font-mono text-sm">{getDepartmentId(viewingDepartment)}</p>
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
                    closeViewModal();
                    openEditModal(viewingDepartment);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Department
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DepartmentsPage;
