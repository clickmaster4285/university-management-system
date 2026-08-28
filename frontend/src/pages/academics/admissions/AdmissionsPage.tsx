// src/routes/app.admissions.tsx
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/data-table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { admissionAPI, Admission } from "@/features/admissions";
import { 
  UserPlus, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Upload,
  RefreshCw,
  AlertCircle,
  X,
  Save,
  Loader2,
  Pencil,
  Trash2,
  Search,
  Eye,
  Database,
  Download,
  GitBranch,
  PieChart
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/lib/auth";

/* ============================================================
   Inlined chart components (admissions-specific, animated)
   ============================================================ */

type FunnelStage = { label: string; count: number; color: string };

function useCountUp(target: number, durationMs = 1000, trigger: unknown = target) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(from + eased * (target - from)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);
  return value;
}

function FunnelRow({ stage, maxCount, index }: { stage: FunnelStage; maxCount: number; index: number }) {
  const [width, setWidth] = useState(0);
  const count = useCountUp(stage.count, 900, stage.count);

  useEffect(() => {
    const pct = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
    const timer = setTimeout(() => setWidth(pct), 60 + index * 120);
    return () => clearTimeout(timer);
  }, [stage.count, maxCount, index]);

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground">{stage.label}</span>
        <span className="text-xs font-semibold tabular-nums">{count}</span>
      </div>
      <div className="h-7 w-full rounded-lg bg-muted/50 overflow-hidden relative">
        <div
          className="h-full rounded-lg relative overflow-hidden transition-[width] ease-out"
          style={{
            width: `${width}%`,
            backgroundColor: stage.color,
            transitionDuration: "900ms",
          }}
        >
          <div className="admissions-shimmer absolute inset-0" />
        </div>
      </div>
      {index < 100 && (
        <div className="flex justify-center h-3 relative">
          <span
            className="admissions-flow-dot absolute h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: stage.color, animationDelay: `${index * 0.25}s` }}
          />
        </div>
      )}
    </div>
  );
}

function AnimatedAdmissionFunnel({ stages }: { stages: FunnelStage[] }) {
  const maxCount = Math.max(1, ...stages.map((s) => s.count));

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <style>{`
        @keyframes admissions-shimmer-sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .admissions-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent);
          animation: admissions-shimmer-sweep 1.8s ease-in-out infinite;
        }
        @keyframes admissions-flow {
          0% { transform: translateY(0); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(10px); opacity: 0; }
        }
        .admissions-flow-dot {
          top: -2px;
          animation: admissions-flow 1.6s ease-in-out infinite;
        }
      `}</style>
      <div className="flex items-center gap-2 mb-4">
        <GitBranch className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Admission Pipeline</h3>
      </div>
      <div className="space-y-3">
        {stages.map((stage, i) => (
          <FunnelRow key={stage.label} stage={stage} maxCount={maxCount} index={i} />
        ))}
      </div>
    </div>
  );
}

type DonutSlice = { label: string; value: number; color: string };

function AnimatedStatusDonut({ data, title = "Applications by Status" }: { data: DonutSlice[]; title?: string }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const displayTotal = useCountUp(total, 1000, total);
  const svgRef = useRef<SVGSVGElement>(null);
  // FIXED: Use a ref for the container and manage individual refs with a Map
  const circleRefs = useRef<Map<number, SVGCircleElement>>(new Map());

  const SIZE = 180;
  const STROKE = 22;
  const R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;

  const segments = useMemo(() => {
    let cumulative = 0;
    return data.map((d) => {
      const fraction = total > 0 ? d.value / total : 0;
      const seg = { ...d, fraction, offset: cumulative };
      cumulative += fraction;
      return seg;
    });
  }, [data, total]);

  useEffect(() => {
    segments.forEach((seg, i) => {
      const el = circleRefs.current.get(i);
      if (!el) return;
      const len = seg.fraction * CIRC;
      el.style.transition = "none";
      el.style.strokeDasharray = `${CIRC}`;
      el.style.strokeDashoffset = `${CIRC}`;
      el.getBoundingClientRect();
      const delay = 120 + i * 150;
      window.setTimeout(() => {
        el.style.transition = "stroke-dashoffset 0.9s cubic-bezier(.4,0,.2,1)";
        el.style.strokeDashoffset = `${CIRC - len}`;
      }, delay);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segments]);

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

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <PieChart className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <button
          onClick={downloadSvg}
          className="h-8 w-8 flex items-center justify-center rounded-lg border hover:bg-muted transition-colors"
          title="Download"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-6 flex-wrap">
        <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
          <svg ref={svgRef} width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="#f1f2f4" strokeWidth={STROKE} />
            {segments.map((seg, i) => (
              <circle
                key={seg.label}
                ref={(el) => {
                  if (el) {
                    circleRefs.current.set(i, el);
                  } else {
                    circleRefs.current.delete(i);
                  }
                }}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                stroke={seg.color}
                strokeWidth={STROKE}
                strokeLinecap="butt"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC}
                transform={`rotate(${-90 + seg.offset * 360} ${SIZE / 2} ${SIZE / 2})`}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold tabular-nums">{displayTotal}</span>
            <span className="text-[10px] text-muted-foreground">Total</span>
          </div>
        </div>

        <div className="flex-1 min-w-[140px] space-y-2">
          {segments.map((seg) => (
            <div key={seg.label} className="flex items-center justify-between gap-3 text-xs">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                {seg.label}
              </span>
              <span className="font-medium tabular-nums">
                {seg.value} <span className="text-muted-foreground">({Math.round(seg.fraction * 100)}%)</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   End inlined chart components
   ============================================================ */


// Programs, departments, campuses, statuses
const programs = ['BSCS', 'BSSE', 'BBA', 'MBA', 'BEE', 'BME', 'BSAI', 'BSDS', 'BSEE', 'MSDS', 'BS Physics', 'BS Math', 'LLB'];
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
const campuses = [
  'Main Campus - Islamabad',
  'North Campus - Lahore',
  'South Campus - Karachi',
  'East Campus - Peshawar'
];
const statuses = ['Pending', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Accepted', 'Rejected', 'Waitlisted', 'Enrolled'];
const genders = ['Male', 'Female', 'Other'];
const feeStatuses = ['Pending', 'Paid', 'Waived', 'Partial'];

// Colors reused from the status badge palette so the charts stay visually consistent with the table
const STATUS_COLORS: Record<string, string> = {
  'Pending': '#eab308',
  'Under Review': '#3b82f6',
  'Shortlisted': '#a855f7',
  'Interview Scheduled': '#6366f1',
  'Accepted': '#22c55e',
  'Rejected': '#ef4444',
  'Waitlisted': '#f97316',
  'Enrolled': '#10b981',
};

export function AdmissionsPage() {
  const { user } = useAuth();
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [filteredAdmissions, setFilteredAdmissions] = useState<Admission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  
  // Form state - ALL FIELDS EMPTY
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    motherName: '',
    cnic: '',
    dateOfBirth: '',
    gender: '',
    nationality: 'Pakistani',
    religion: 'Islam',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Pakistan',
    program: '',
    department: '',
    semester: 1,
    academicYear: new Date().getFullYear().toString(),
    previousEducation: {
      institution: '',
      degree: '',
      grade: '',
      yearOfCompletion: 0,
      percentage: 0
    },
    status: 'Pending',
    campus: '',
    applicationFee: 0,
    feeStatus: 'Pending'
  });

  // Validation errors
  const [fieldErrors, setFieldErrors] = useState<{
    cnic?: string;
    email?: string;
    phone?: string;
  }>({});

  // Check if user is authenticated
  const isAuthenticated = !!user;

  // Fetch admissions
  const fetchAdmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = { limit: 100 };
      if (selectedStatus !== "all") params.status = selectedStatus;
      
      const response = await admissionAPI.getAll(params);
      
      if (response && response.success) {
        setAdmissions(response.data || []);
        setFilteredAdmissions(response.data || []);
      } else {
        setAdmissions([]);
        setFilteredAdmissions([]);
        if (response?.message) {
        }
      }
      
    } catch (error: any) {
      console.error('Failed to fetch admissions:', error);
      
      // Don't show error for auth issues, just show empty state
      if (error.response?.status === 401) {
        setAdmissions([]);
        setFilteredAdmissions([]);
        setError(null);
        return;
      }
      
      if (error.message?.includes('NetworkError') || error.message?.includes('Failed to fetch')) {
        setError('Cannot connect to backend. Please make sure the server is running on http://localhost:4000');
      } else {
        setError('Failed to load admissions. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await admissionAPI.getStats();
      if (response && response.success) {
        setStats(response.data);
      } else {
        setStats({
          total: 0,
          pending: 0,
          accepted: 0,
          rejected: 0,
          byStatus: []
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStats({
        total: 0,
        pending: 0,
        accepted: 0,
        rejected: 0,
        byStatus: []
      });
    }
  };

  // Load data on mount
  useEffect(() => {
    // Only fetch if user is authenticated
    if (isAuthenticated) {
      fetchAdmissions();
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Handle status filter change
  useEffect(() => {
    if (isAuthenticated) {
      fetchAdmissions();
    }
  }, [selectedStatus]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredAdmissions(admissions);
      return;
    }
    
    const searchLower = query.toLowerCase().trim();
    const filtered = admissions.filter(admission => {
      const nameMatch = admission.name?.toLowerCase().includes(searchLower) || false;
      const emailMatch = admission.email?.toLowerCase().includes(searchLower) || false;
      const cnicMatch = admission.cnic?.toLowerCase().includes(searchLower) || false;
      const phoneMatch = admission.phone?.toLowerCase().includes(searchLower) || false;
      const programMatch = admission.program?.toLowerCase().includes(searchLower) || false;
      const admissionIdMatch = admission.admissionId?.toLowerCase().includes(searchLower) || false;
      const statusMatch = admission.status?.toLowerCase().includes(searchLower) || false;
      
      return nameMatch || emailMatch || cnicMatch || phoneMatch || 
             programMatch || admissionIdMatch || statusMatch;
    });
    
    setFilteredAdmissions(filtered);
  };

  // Validate uniqueness
  const validateUniqueness = (): boolean => {
    const errors: { cnic?: string; email?: string; phone?: string } = {};
    let isValid = true;

    if (!admissions || admissions.length === 0) return true;

    if (formData.cnic && formData.cnic.trim() !== '') {
      const cnicExists = admissions.some(a => {
        if (!a.cnic) return false;
        if (isEditMode && a._id === editingId) return false;
        return a.cnic.toLowerCase() === formData.cnic.toLowerCase();
      });
      if (cnicExists) {
        errors.cnic = 'This CNIC is already registered';
        isValid = false;
      }
    }

    if (formData.email && formData.email.trim() !== '') {
      const emailExists = admissions.some(a => {
        if (!a.email) return false;
        if (isEditMode && a._id === editingId) return false;
        return a.email.toLowerCase() === formData.email.toLowerCase();
      });
      if (emailExists) {
        errors.email = 'This email is already registered';
        isValid = false;
      }
    }

    if (formData.phone && formData.phone.trim() !== '') {
      const phoneExists = admissions.some(a => {
        if (!a.phone) return false;
        if (isEditMode && a._id === editingId) return false;
        return a.phone === formData.phone;
      });
      if (phoneExists) {
        errors.phone = 'This phone number is already registered';
        isValid = false;
      }
    }

    setFieldErrors(errors);
    return isValid;
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'semester' || name === 'applicationFee' || name === 'previousEducation.yearOfCompletion' || name === 'previousEducation.percentage'
          ? parseFloat(value) || 0
          : value
      }));
    }

    if (name === 'cnic' || name === 'email' || name === 'phone') {
      setFieldErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Open add modal
  const openAddModal = () => {
    if (!isAuthenticated) {
      toast.error('Please login to create an application');
      return;
    }
    setIsEditMode(false);
    setEditingId(null);
    setFieldErrors({});
    setFormData({
      name: '',
      fatherName: '',
      motherName: '',
      cnic: '',
      dateOfBirth: '',
      gender: '',
      nationality: 'Pakistani',
      religion: 'Islam',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Pakistan',
      program: '',
      department: '',
      semester: 1,
      academicYear: new Date().getFullYear().toString(),
      previousEducation: {
        institution: '',
        degree: '',
        grade: '',
        yearOfCompletion: 0,
        percentage: 0
      },
      status: 'Pending',
      campus: '',
      applicationFee: 0,
      feeStatus: 'Pending'
    });
    setIsModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (admission: Admission) => {
    if (!isAuthenticated) {
      toast.error('Please login to edit an application');
      return;
    }
    setIsEditMode(true);
    setEditingId(admission._id || null);
    setFieldErrors({});
    setFormData({
      name: admission.name || '',
      fatherName: admission.fatherName || '',
      motherName: admission.motherName || '',
      cnic: admission.cnic || '',
      dateOfBirth: admission.dateOfBirth ? new Date(admission.dateOfBirth).toISOString().split('T')[0] : '',
      gender: admission.gender || '',
      nationality: admission.nationality || 'Pakistani',
      religion: admission.religion || 'Islam',
      email: admission.email || '',
      phone: admission.phone || '',
      address: admission.address || '',
      city: admission.city || '',
      state: admission.state || '',
      postalCode: admission.postalCode || '',
      country: admission.country || 'Pakistan',
      program: admission.program || '',
      department: admission.department || '',
      semester: admission.semester || 1,
      academicYear: admission.academicYear || new Date().getFullYear().toString(),
      previousEducation: admission.previousEducation || {
        institution: '',
        degree: '',
        grade: '',
        yearOfCompletion: 0,
        percentage: 0
      },
      status: admission.status || 'Pending',
      campus: admission.campus || '',
      applicationFee: admission.applicationFee || 0,
      feeStatus: admission.feeStatus || 'Pending'
    });
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingId(null);
    setFieldErrors({});
  };

  // Handle submit with better error handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please login to submit an application');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Validate required fields
      const requiredFields = ['name', 'fatherName', 'email', 'phone', 'cnic', 'program', 'department', 'campus'];
      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData] || formData[field as keyof typeof formData] === '');
      
      if (missingFields.length > 0) {
        toast.error(`Please fill all required fields: ${missingFields.join(', ')}`);
        setIsSubmitting(false);
        return;
      }

      // Validate email format
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (formData.email && !emailRegex.test(formData.email)) {
        toast.error('Please enter a valid email address');
        setIsSubmitting(false);
        return;
      }

      // Validate phone number (basic validation)
      if (formData.phone && formData.phone.length < 7) {
        toast.error('Please enter a valid phone number');
        setIsSubmitting(false);
        return;
      }

      // Validate CNIC (basic validation)
      if (formData.cnic && formData.cnic.length < 7) {
        toast.error('Please enter a valid CNIC');
        setIsSubmitting(false);
        return;
      }

      const isValid = validateUniqueness();
      if (!isValid) {
        const errorMessages = Object.values(fieldErrors).filter(Boolean);
        if (errorMessages.length > 0) {
          toast.error(errorMessages[0]);
        }
        setIsSubmitting(false);
        return;
      }
      
      // Prepare clean data for API
      const admissionData = {
        name: formData.name.trim(),
        fatherName: formData.fatherName.trim(),
        motherName: formData.motherName?.trim() || '',
        cnic: formData.cnic.trim(),
        dateOfBirth: formData.dateOfBirth || '',
        gender: formData.gender || '',
        nationality: formData.nationality || 'Pakistani',
        religion: formData.religion || 'Islam',
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        address: formData.address?.trim() || '',
        city: formData.city?.trim() || '',
        state: formData.state?.trim() || '',
        postalCode: formData.postalCode?.trim() || '',
        country: formData.country || 'Pakistan',
        program: formData.program,
        department: formData.department,
        semester: Number(formData.semester) || 1,
        academicYear: formData.academicYear || new Date().getFullYear().toString(),
        previousEducation: {
          institution: formData.previousEducation?.institution?.trim() || '',
          degree: formData.previousEducation?.degree?.trim() || '',
          grade: formData.previousEducation?.grade?.trim() || '',
          yearOfCompletion: Number(formData.previousEducation?.yearOfCompletion) || 0,
          percentage: Number(formData.previousEducation?.percentage) || 0
        },
        status: formData.status || 'Pending',
        campus: formData.campus,
        applicationFee: Number(formData.applicationFee) || 0,
        feeStatus: formData.feeStatus || 'Pending'
      };


      let response;
      if (isEditMode && editingId) {
        response = await admissionAPI.update(editingId, admissionData);
        if (response && response.success) {
          toast.success(`Application updated successfully!`);
        } else {
          toast.error(response?.message || 'Failed to update application');
          setIsSubmitting(false);
          return;
        }
      } else {
        response = await admissionAPI.create(admissionData);
        if (response && response.success) {
          toast.success(`Application submitted successfully! Application ID: ${response.data?.admissionId || 'generated'}`);
        } else {
          toast.error(response?.message || 'Failed to submit application');
          setIsSubmitting(false);
          return;
        }
      }
      
      // Reset form and close modal
      setFormData({
        name: '',
        fatherName: '',
        motherName: '',
        cnic: '',
        dateOfBirth: '',
        gender: '',
        nationality: 'Pakistani',
        religion: 'Islam',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Pakistan',
        program: '',
        department: '',
        semester: 1,
        academicYear: new Date().getFullYear().toString(),
        previousEducation: {
          institution: '',
          degree: '',
          grade: '',
          yearOfCompletion: 0,
          percentage: 0
        },
        status: 'Pending',
        campus: '',
        applicationFee: 0,
        feeStatus: 'Pending'
      });
      setFieldErrors({});
      setIsModalOpen(false);
      
      // Refresh data
      await fetchAdmissions();
      await fetchStats();
      setSearchQuery('');
      
    } catch (error: any) {
      console.error('❌ Failed to save admission:', error);
      
      let errorMsg = isEditMode ? 'Failed to update admission' : 'Failed to submit admission';
      
      // Check for specific error types
      if (error.response) {
        console.error('Response error:', error.response.data);
        
        if (error.response.status === 401) {
          errorMsg = 'Please login to continue';
        } else if (error.response.status === 400) {
          errorMsg = error.response.data?.message || 'Invalid data provided';
          if (error.response.data?.errors) {
            errorMsg = error.response.data.errors.join(', ');
          }
        } else if (error.response.status === 409) {
          errorMsg = 'Duplicate entry. CNIC, Email, or Phone already exists.';
        } else if (error.response.status === 500) {
          errorMsg = 'Server error. Please try again later.';
        } else {
          errorMsg = error.response.data?.message || errorMsg;
        }
      } else if (error.request) {
        errorMsg = 'Network error. Please check if backend server is running.';
      } else {
        errorMsg = error.message || errorMsg;
      }
      
      if (errorMsg.toLowerCase().includes('duplicate') || 
          errorMsg.toLowerCase().includes('already exists') ||
          errorMsg.toLowerCase().includes('unique')) {
        errorMsg = 'Duplicate entry. CNIC, Email, or Phone already exists.';
      }
      
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string, name: string) => {
    if (!isAuthenticated) {
      toast.error('Please login to delete an application');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    
    try {
      const response = await admissionAPI.delete(id);
      if (response && response.success) {
        toast.success(`Application deleted successfully`);
        await fetchAdmissions();
        await fetchStats();
      } else {
        toast.error(response?.message || 'Failed to delete application');
      }
    } catch (error) {
      console.error('Failed to delete admission:', error);
      toast.error('Failed to delete admission');
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      'Pending': { className: 'bg-yellow-500/15 text-yellow-600 border-0', label: 'Pending' },
      'Under Review': { className: 'bg-blue-500/15 text-blue-600 border-0', label: 'Under Review' },
      'Shortlisted': { className: 'bg-purple-500/15 text-purple-600 border-0', label: 'Shortlisted' },
      'Interview Scheduled': { className: 'bg-indigo-500/15 text-indigo-600 border-0', label: 'Interview Scheduled' },
      'Accepted': { className: 'bg-green-500/15 text-green-600 border-0', label: 'Accepted' },
      'Rejected': { className: 'bg-red-500/15 text-red-600 border-0', label: 'Rejected' },
      'Waitlisted': { className: 'bg-orange-500/15 text-orange-600 border-0', label: 'Waitlisted' },
      'Enrolled': { className: 'bg-emerald-500/15 text-emerald-600 border-0', label: 'Enrolled' }
    };
    
    const info = statusMap[status] || statusMap['Pending'];
    return <Badge className={info.className}>{info.label}</Badge>;
  };

  // Define columns for DataTable
  const cols: Column<Admission>[] = [
    {
      key: "name", 
      header: "Applicant",
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
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{r.admissionId || 'N/A'}</span> · {r.email}
            </div>
          </div>
        </div>
      ),
    },
    { 
      key: "program", 
      header: "Program", 
      cell: (r) => <Badge variant="secondary">{r.program}</Badge> 
    },
    { 
      key: "department", 
      header: "Department", 
      cell: (r) => <span className="text-sm">{r.department}</span> 
    },
    { 
      key: "status", 
      header: "Status", 
      cell: (r) => getStatusBadge(r.status)
    },
    { 
      key: "applicationDate", 
      header: "Applied",
      cell: (r) => {
        const date = r.applicationDate ? new Date(r.applicationDate) : new Date();
        return <span className="text-sm">{date.toLocaleDateString()}</span>;
      }
    },
    { 
      key: "campus", 
      header: "Campus",
      cell: (r) => {
        const campus = r.campus?.split(" - ")[1] || r.campus || 'N/A';
        return <span className="text-xs text-muted-foreground">{campus}</span>;
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

  // Derived data for the animated charts (grouped from real admissions, not mocked)
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    statuses.forEach(s => { counts[s] = 0; });
    admissions.forEach(a => {
      const s = a.status || 'Pending';
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [admissions]);

  const funnelStages = useMemo(() => {
    const pipeline = ['Pending', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Accepted', 'Enrolled'];
    return pipeline.map(label => ({
      label,
      count: statusCounts[label] || 0,
      color: STATUS_COLORS[label],
    }));
  }, [statusCounts]);

  const donutData = useMemo(() => {
    return statuses
      .map(label => ({ label, value: statusCounts[label] || 0, color: STATUS_COLORS[label] }))
      .filter(d => d.value > 0);
  }, [statusCounts]);

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
        <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg p-8">
          <Database className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Login Required</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            Please login to view and manage admission applications.
          </p>
          <Button 
            onClick={() => window.location.href = '/login'}
            className="gradient-brand text-white border-0"
          >
            Go to Login
          </Button>
        </div>
    );
  }

  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard 
          label="Total Applications" 
          value={stats?.total || 0} 
          icon={UserPlus} 
          tone="brand" 
        />
        <KpiCard 
          label="Approved" 
          value={stats?.accepted || 0} 
          icon={CheckCircle2} 
          tone="success" 
        />
        <KpiCard 
          label="Pending" 
          value={stats?.pending || 0} 
          icon={Clock} 
          tone="warning" 
        />
        <KpiCard 
          label="Rejected" 
          value={stats?.rejected || 0} 
          icon={XCircle} 
          tone="destructive" 
        />
      </div>

      {/* Animated admissions graphics: pipeline funnel + status donut */}
      {!loading && admissions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatedAdmissionFunnel stages={funnelStages} />
          <AnimatedStatusDonut data={donutData} title="Applications by Status" />
        </div>
      )}

      {/* Status Filter */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Filter by Status:</Label>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statuses.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, CNIC, program..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {searchQuery && (
          <div className="text-sm text-muted-foreground">
            Found {filteredAdmissions.length} of {admissions.length} applications
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
              onClick={fetchAdmissions}
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
            <p className="mt-4 text-muted-foreground">Loading applications...</p>
          </div>
        </div>
      )}

      {/* DataTable */}
      {!loading && !error && admissions.length > 0 && (
        <DataTable
          title="All Applications"
          description={`${filteredAdmissions.length} applications found${searchQuery ? ` (filtered from ${admissions.length})` : ''}`}
          data={filteredAdmissions}
          columns={cols}
          searchKeys={["name", "email", "cnic", "phone", "program", "admissionId", "status"] as (keyof Admission)[]}
          pageSize={10}
          addLabel="Add Application"
          onAdd={openAddModal}
        />
      )}

      {/* Empty State - No Data */}
      {!loading && !error && admissions.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg p-8">
          <Database className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Applications Found</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            There are no admission applications in the system yet. Click the "New Application" button to create your first application.
          </p>
          <Button 
            onClick={openAddModal}
            className="gradient-brand text-white border-0"
          >
            <UserPlus className="h-4 w-4 mr-2" /> Create First Application
          </Button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {isEditMode ? (
                  <>
                    <Pencil className="h-5 w-5 text-primary" />
                    Edit Application
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 text-primary" />
                    New Application
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
                    placeholder=""
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fatherName">Father's Name *</Label>
                  <Input
                    id="fatherName"
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleInputChange}
                    placeholder=""
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motherName">Mother's Name</Label>
                  <Input
                    id="motherName"
                    name="motherName"
                    value={formData.motherName}
                    onChange={handleInputChange}
                    placeholder=""
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnic">CNIC *</Label>
                  <Input
                    id="cnic"
                    name="cnic"
                    value={formData.cnic}
                    onChange={handleInputChange}
                    placeholder=""
                    className={fieldErrors.cnic ? "border-red-500 focus:ring-red-500" : ""}
                    required
                  />
                  {fieldErrors.cnic && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.cnic}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Gender</option>
                    {genders.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                {/* Contact Information */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Contact Information</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder=""
                    className={fieldErrors.email ? "border-red-500 focus:ring-red-500" : ""}
                    required
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder=""
                    className={fieldErrors.phone ? "border-red-500 focus:ring-red-500" : ""}
                    required
                  />
                  {fieldErrors.phone && (
                    <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder=""
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder=""
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    placeholder=""
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    placeholder=""
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder=""
                  />
                </div>

                {/* Academic Information */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Academic Information</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="program">Program *</Label>
                  <select
                    id="program"
                    name="program"
                    value={formData.program}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select Program</option>
                    {programs.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
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
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="semester">Semester</Label>
                  <Input
                    id="semester"
                    name="semester"
                    type="number"
                    min="1"
                    max="8"
                    value={formData.semester}
                    onChange={handleInputChange}
                    placeholder=""
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="academicYear">Academic Year</Label>
                  <Input
                    id="academicYear"
                    name="academicYear"
                    value={formData.academicYear}
                    onChange={handleInputChange}
                    placeholder=""
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campus">Campus *</Label>
                  <select
                    id="campus"
                    name="campus"
                    value={formData.campus}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select Campus</option>
                    {campuses.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
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
                    {statuses.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Previous Education */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Previous Education</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previousEducation.institution">Institution</Label>
                  <Input
                    id="previousEducation.institution"
                    name="previousEducation.institution"
                    value={formData.previousEducation.institution}
                    onChange={handleInputChange}
                    placeholder=""
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previousEducation.degree">Degree</Label>
                  <Input
                    id="previousEducation.degree"
                    name="previousEducation.degree"
                    value={formData.previousEducation.degree}
                    onChange={handleInputChange}
                    placeholder=""
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previousEducation.grade">Grade</Label>
                  <Input
                    id="previousEducation.grade"
                    name="previousEducation.grade"
                    value={formData.previousEducation.grade}
                    onChange={handleInputChange}
                    placeholder=""
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previousEducation.yearOfCompletion">Year of Completion</Label>
                  <Input
                    id="previousEducation.yearOfCompletion"
                    name="previousEducation.yearOfCompletion"
                    type="number"
                    value={formData.previousEducation.yearOfCompletion}
                    onChange={handleInputChange}
                    placeholder=""
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previousEducation.percentage">Percentage</Label>
                  <Input
                    id="previousEducation.percentage"
                    name="previousEducation.percentage"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.previousEducation.percentage}
                    onChange={handleInputChange}
                    placeholder=""
                  />
                </div>

                {/* Fee Information */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Fee Information</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="applicationFee">Application Fee (PKR)</Label>
                  <Input
                    id="applicationFee"
                    name="applicationFee"
                    type="number"
                    value={formData.applicationFee}
                    onChange={handleInputChange}
                    placeholder=""
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feeStatus">Fee Status</Label>
                  <select
                    id="feeStatus"
                    name="feeStatus"
                    value={formData.feeStatus}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {feeStatuses.map(f => (
                      <option key={f} value={f}>{f}</option>
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
                      {isEditMode ? 'Updating...' : 'Submitting...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {isEditMode ? 'Update Application' : 'Submit Application'}
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

export default AdmissionsPage;
