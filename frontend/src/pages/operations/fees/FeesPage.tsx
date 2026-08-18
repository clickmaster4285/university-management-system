// src/routes/app.fees.tsx
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { feeAPI, Fee } from "@/lib/api/fee";
import { feeStructureAPI } from "@/lib/api/feeStructure";
import { studentAPI, Student } from "@/lib/api/students";
import { courseAPI, Course } from "@/lib/api/courses";
import { useAuth } from "@/lib/auth";
import { 
  DollarSign, 
  AlertCircle, 
  TrendingUp, 
  Percent, 
  Receipt, 
  CreditCard, 
  Building2, 
  Smartphone,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Search,
  Database,
  X,
  Save,
  Loader2,
  User as UserIcon,
  GraduationCap,
  BookOpen,
  Filter,
  ChevronDown,
  ChevronRight,
  Users,
  Wallet,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  Settings,
  FileText,
  Calendar,
  Clock,
  Layers,
  University,
  BookMarked,
  Calculator,
  CheckCircle,
  XCircle,
  HelpCircle,
  Gift,
  AlertTriangle,
  Check,
  ChevronUp,
  Eye,
  Copy
} from "lucide-react";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart as RePieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";


// Constants
const departments = ['Computer Science', 'Software Engineering', 'Information Technology', 'Electrical Engineering', 'Business Administration'];
const programs = ['BSCS', 'BSSE', 'BSIT', 'BSEE', 'BBA'];
const semesters = [1, 2, 3, 4, 5, 6, 7, 8];
const feeTypes = ['Tuition', 'Lab', 'Library', 'Sports', 'Transport', 'Hostel', 'Other'];
const paymentStatuses = ['Paid', 'Pending', 'Partial', 'Overdue', 'Scholarship', 'Waived'];
const studentCategories = ['Regular', 'Self-Finance', 'Scholarship', 'International'];
const calculationMethods = ['Fixed Semester Fee', 'Per Credit Hour', 'Course Based', 'Mixed'];
const discountTypes = ['Percentage', 'Fixed'];
const lateFeeTypes = ['Fixed Amount', 'Percentage'];
const paymentTypes = ['Full Payment', 'Installments'];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// Types
interface CourseFee {
  courseCode: string;
  courseName: string;
  creditHours: number;
  feePerCredit: number;
  totalFee: number;
  isCore?: boolean;
}

interface AdditionalFee {
  name: string;
  type: 'Fixed' | 'Percentage';
  amount: number;
  percentage: number;
  description?: string;
}

interface Installment {
  installmentNumber: number;
  amount: number;
  dueDate: string;
  description?: string;
}

interface FeeStructure {
  _id?: string;
  structureId?: string;
  name: string;
  department: string;
  program: string;
  semester: number;
  applyToAllSemesters?: boolean; // New field
  studentCategory: string;
  academicYear: string;
  status: 'Active' | 'Inactive' | 'Draft' | 'Archived';
  effectiveFrom?: string;
  effectiveTo?: string;
  calculationMethod: string;
  courses: CourseFee[];
  additionalFees: AdditionalFee[];
  discountEnabled: boolean;
  discount: {
    type: string;
    value: number;
    applicableTo: string;
    description?: string;
  };
  lateFeeEnabled: boolean;
  lateFee: {
    gracePeriod: number;
    type: string;
    amount: number;
    percentage: number;
    maximumFee: number;
  };
  paymentType: string;
  installments: Installment[];
  notes?: string;
  totalCourseFee: number;
  totalAdditionalFee: number;
  grossTotal: number;
  discountAmount: number;
  finalPayable: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface StudentFeeRecord {
  _id?: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  department: string;
  program: string;
  semester: number;
  feeStructureId?: string;
  feeStructureName?: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: string;
  dueDate: string;
  payments: Payment[];
  createdAt?: string;
  updatedAt?: string;
}

interface Payment {
  amount: number;
  method: string;
  date: string;
  transactionId: string;
  status: string;
}

export function FeesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("structures");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fee structures state
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [filteredStructures, setFilteredStructures] = useState<FeeStructure[]>([]);
  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState<FeeStructure | null>(null);
  
  // View modal state
  const [viewStructure, setViewStructure] = useState<FeeStructure | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  // Student fee records state
  const [feeRecords, setFeeRecords] = useState<StudentFeeRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<StudentFeeRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<any>(null);
  
  // State for selected courses from database
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set());
  
  // Structure form state
  const [structureForm, setStructureForm] = useState<Partial<FeeStructure>>({
    name: '',
    department: '',
    program: '',
    semester: 1,
    applyToAllSemesters: false,
    studentCategory: 'Regular',
    academicYear: '',
    status: 'Draft',
    effectiveFrom: '',
    effectiveTo: '',
    calculationMethod: 'Course Based',
    courses: [],
    additionalFees: [],
    discountEnabled: false,
    discount: {
      type: 'Percentage',
      value: 0,
      applicableTo: 'Tuition Fee',
      description: ''
    },
    lateFeeEnabled: false,
    lateFee: {
      gracePeriod: 7,
      type: 'Fixed Amount',
      amount: 0,
      percentage: 0,
      maximumFee: 0
    },
    paymentType: 'Full Payment',
    installments: [],
    notes: '',
    totalCourseFee: 0,
    totalAdditionalFee: 0,
    grossTotal: 0,
    discountAmount: 0,
    finalPayable: 0,
    isActive: true
  });

  // Course form state
  const [courseForm, setCourseForm] = useState({
    courseCode: '',
    courseName: '',
    creditHours: 1,
    feePerCredit: 0
  });
  const [editingCourseIndex, setEditingCourseIndex] = useState<number | null>(null);

  // Additional fee form state
  const [additionalFeeForm, setAdditionalFeeForm] = useState({
    name: '',
    type: 'Fixed' as 'Fixed' | 'Percentage',
    amount: 0,
    percentage: 0,
    description: ''
  });
  const [editingAdditionalFeeIndex, setEditingAdditionalFeeIndex] = useState<number | null>(null);

  // Installment form state
  const [installmentForm, setInstallmentForm] = useState({
    amount: 0,
    dueDate: '',
    description: ''
  });
  const [editingInstallmentIndex, setEditingInstallmentIndex] = useState<number | null>(null);

  // Fee record form state
  const [recordForm, setRecordForm] = useState({
    studentId: '',
    studentName: '',
    studentEmail: '',
    department: '',
    program: '',
    semester: 1,
    feeStructureId: '',
    dueDate: '',
    paymentMethod: 'Cash'
  });

  const isAuthenticated = !!user;

  // Filter courses when program or semester changes
  useEffect(() => {
    const selectedProgram = structureForm.program;
    const selectedSemester = Number(structureForm.semester);

    if (selectedProgram && selectedSemester) {
      // Filter courses based on selected program and semester
      const filtered = courses.filter(c => 
        c.program === selectedProgram && 
        c.semester === selectedSemester &&
        c.isActive !== false
      );
      setFilteredCourses(filtered);
      // Clear selected courses when filter changes
      setSelectedCourseIds(new Set());
    } else if (selectedProgram) {
      // If only program is selected, show all courses for that program
      const filtered = courses.filter(c => 
        c.program === selectedProgram &&
        c.isActive !== false
      );
      setFilteredCourses(filtered);
      setSelectedCourseIds(new Set());
    } else {
      // If no program selected, show all active courses
      setFilteredCourses(courses.filter(c => c.isActive !== false));
      setSelectedCourseIds(new Set());
    }
  }, [structureForm.program, structureForm.semester, courses]);

  // Fetch all data
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        fetchFeeStructures(),
        fetchFeeRecords(),
        fetchStudents(),
        fetchCourses(),
        fetchStats()
      ]);
      
    } catch (error: any) {
      console.error('❌ Failed to fetch data:', error);
      setError(error.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch fee structures
  const fetchFeeStructures = async () => {
    try {
      const response = await feeStructureAPI.getAll({ limit: 100 });
      if (response && response.success) {
        setFeeStructures(response.data || []);
        setFilteredStructures(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch fee structures:', error);
      toast.error('Failed to load fee structures');
    }
  };

  // Fetch fee records
  const fetchFeeRecords = async () => {
    try {
      const response = await feeAPI.getAll({ limit: 100 });
      if (response && response.success) {
        setFeeRecords(response.data || []);
        setFilteredRecords(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch fee records:', error);
    }
  };

  // Fetch students
  const fetchStudents = async () => {
    try {
      const response: any = await studentAPI.getAll();
      if (response && (response.success || response.data?.success || response.status === 200)) {
        setStudents(response.data?.data || response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

  // Fetch courses
  const fetchCourses = async () => {
    try {
      const response = await courseAPI.getAll({ limit: 500 });
      if (response && response.success) {
        setCourses(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await feeAPI.getStats();
      if (response && response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredStructures(feeStructures);
      return;
    }
    
    const searchLower = query.toLowerCase().trim();
    const filtered = feeStructures.filter(s => 
      (s.name || '').toLowerCase().includes(searchLower) ||
      (s.department || '').toLowerCase().includes(searchLower) ||
      (s.program || '').toLowerCase().includes(searchLower)
    );
    setFilteredStructures(filtered);
  };

  // Calculate total fee from courses
  const calculateTotalFee = (courses: CourseFee[]) => {
    return courses.reduce((sum, course) => sum + (course.creditHours * course.feePerCredit), 0);
  };

  // Calculate structure totals
  const calculateStructureTotals = (form: Partial<FeeStructure>) => {
    const totalCourseFee = (form.courses || []).reduce((sum, c) => sum + c.totalFee, 0);
    const totalAdditionalFee = (form.additionalFees || []).reduce((sum, fee) => {
      if (fee.type === 'Fixed') {
        return sum + fee.amount;
      } else {
        return sum + (totalCourseFee * fee.percentage / 100);
      }
    }, 0);
    const grossTotal = totalCourseFee + totalAdditionalFee;
    
    let discountAmount = 0;
    if (form.discountEnabled && form.discount && form.discount.value > 0) {
      const applicableAmount = form.discount.applicableTo === 'Tuition Fee' 
        ? totalCourseFee 
        : grossTotal;
      discountAmount = form.discount.type === 'Percentage'
        ? (applicableAmount * form.discount.value / 100)
        : form.discount.value;
    }
    
    const finalPayable = grossTotal - discountAmount;
    
    return { totalCourseFee, totalAdditionalFee, grossTotal, discountAmount, finalPayable };
  };

  // Handle structure form input
  const handleStructureInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setStructureForm(prev => {
      const parsedValue = name === 'semester' ? Number(value) : (type === 'checkbox' ? checked : value);
      const newForm = {
        ...prev,
        [name]: parsedValue
      };
      
      // Recalculate totals
      const totals = calculateStructureTotals(newForm);
      return {
        ...newForm,
        ...totals
      };
    });
  };

  // Handle nested field changes
  const handleNestedInput = (parent: string, field: string, value: any) => {
    setStructureForm(prev => {
      const parentObj = (prev[parent as keyof FeeStructure] as any) || {};
      return {
        ...prev,
        [parent]: {
          ...parentObj,
          [field]: value
        }
      };
    });
  };

  // Handle course selection toggle
  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourseIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  // Handle select all courses
  const toggleSelectAllCourses = () => {
    if (selectedCourseIds.size === filteredCourses.length && filteredCourses.length > 0) {
      // Deselect all
      setSelectedCourseIds(new Set());
    } else {
      // Select all
      const allIds = new Set(filteredCourses.map(c => c._id || '').filter(id => id));
      setSelectedCourseIds(allIds);
    }
  };

  // Add selected courses from database
  const addSelectedCourses = () => {
    if (selectedCourseIds.size === 0) {
      toast.warning('Please select at least one course to add');
      return;
    }

    const coursesToAdd = filteredCourses.filter(c => c._id && selectedCourseIds.has(c._id));
    let addedCount = 0;
    let skippedCount = 0;

    coursesToAdd.forEach(course => {
      // Check if course already added
      if ((structureForm.courses || []).some(c => c.courseCode === course.code)) {
        skippedCount++;
        return;
      }
      
      const newCourse: CourseFee = {
        courseCode: course.code,
        courseName: course.name,
        creditHours: course.credits || 3,
        feePerCredit: course.feePerCredit || 5000,
        totalFee: (course.credits || 3) * (course.feePerCredit || 5000),
        isCore: true
      };
      
      setStructureForm(prev => {
        const newCourses = [...(prev.courses || []), newCourse];
        const newForm = { ...prev, courses: newCourses };
        const totals = calculateStructureTotals(newForm);
        return { ...newForm, ...totals };
      });
      addedCount++;
    });

    // Clear selections after adding
    setSelectedCourseIds(new Set());

    if (addedCount > 0) {
      toast.success(`Added ${addedCount} course${addedCount > 1 ? 's' : ''}${skippedCount > 0 ? `, ${skippedCount} skipped (already added)` : ''}`);
    } else if (skippedCount > 0) {
      toast.warning(`${skippedCount} course${skippedCount > 1 ? 's were' : ' was'} already added`);
    }
  };

  // Handle course form input
  const handleCourseInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCourseForm(prev => ({
      ...prev,
      [name]: name === 'creditHours' || name === 'feePerCredit' ? parseFloat(value) || 0 : value
    }));
  };

  // Add course to structure (manual)
  const addCourse = () => {
    if (!courseForm.courseCode || !courseForm.courseName || courseForm.creditHours <= 0 || courseForm.feePerCredit <= 0) {
      toast.error('Please fill all course fields with valid values');
      return;
    }

    const course: CourseFee = {
      courseCode: courseForm.courseCode.trim().toUpperCase(),
      courseName: courseForm.courseName.trim(),
      creditHours: courseForm.creditHours,
      feePerCredit: courseForm.feePerCredit,
      totalFee: courseForm.creditHours * courseForm.feePerCredit,
      isCore: true
    };

    setStructureForm(prev => {
      const newCourses = [...(prev.courses || [])];
      if (editingCourseIndex !== null) {
        newCourses[editingCourseIndex] = course;
      } else {
        newCourses.push(course);
      }
      const newForm = { ...prev, courses: newCourses };
      const totals = calculateStructureTotals(newForm);
      return { ...newForm, ...totals };
    });

    setCourseForm({
      courseCode: '',
      courseName: '',
      creditHours: 1,
      feePerCredit: 0
    });
    setEditingCourseIndex(null);
    toast.success(editingCourseIndex !== null ? 'Course updated!' : 'Course added!');
  };

  // Edit course
  const editCourse = (index: number) => {
    const course = (structureForm.courses || [])[index];
    if (course) {
      setCourseForm({
        courseCode: course.courseCode,
        courseName: course.courseName,
        creditHours: course.creditHours,
        feePerCredit: course.feePerCredit
      });
      setEditingCourseIndex(index);
    }
  };

  // Remove course
  const removeCourse = (index: number) => {
    setStructureForm(prev => {
      const newCourses = (prev.courses || []).filter((_, i) => i !== index);
      const newForm = { ...prev, courses: newCourses };
      const totals = calculateStructureTotals(newForm);
      return { ...newForm, ...totals };
    });
    toast.success('Course removed');
  };

  // Handle additional fee form input
  const handleAdditionalFeeInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAdditionalFeeForm(prev => ({
      ...prev,
      [name]: name === 'amount' || name === 'percentage' ? parseFloat(value) || 0 : value
    }));
  };

  // Add additional fee
  const addAdditionalFee = () => {
    if (!additionalFeeForm.name || (additionalFeeForm.type === 'Fixed' && additionalFeeForm.amount <= 0) || 
        (additionalFeeForm.type === 'Percentage' && additionalFeeForm.percentage <= 0)) {
      toast.error('Please fill all fee fields with valid values');
      return;
    }

    const fee: AdditionalFee = {
      name: additionalFeeForm.name.trim(),
      type: additionalFeeForm.type,
      amount: additionalFeeForm.amount,
      percentage: additionalFeeForm.percentage,
      description: additionalFeeForm.description
    };

    setStructureForm(prev => {
      const newFees = [...(prev.additionalFees || [])];
      if (editingAdditionalFeeIndex !== null) {
        newFees[editingAdditionalFeeIndex] = fee;
      } else {
        newFees.push(fee);
      }
      const newForm = { ...prev, additionalFees: newFees };
      const totals = calculateStructureTotals(newForm);
      return { ...newForm, ...totals };
    });

    setAdditionalFeeForm({
      name: '',
      type: 'Fixed',
      amount: 0,
      percentage: 0,
      description: ''
    });
    setEditingAdditionalFeeIndex(null);
    toast.success(editingAdditionalFeeIndex !== null ? 'Fee updated!' : 'Fee added!');
  };

  // Edit additional fee
  const editAdditionalFee = (index: number) => {
    const fee = (structureForm.additionalFees || [])[index];
    if (fee) {
      setAdditionalFeeForm({
        name: fee.name,
        type: fee.type,
        amount: fee.amount,
        percentage: fee.percentage,
        description: fee.description || ''
      });
      setEditingAdditionalFeeIndex(index);
    }
  };

  // Remove additional fee
  const removeAdditionalFee = (index: number) => {
    setStructureForm(prev => {
      const newFees = (prev.additionalFees || []).filter((_, i) => i !== index);
      const newForm = { ...prev, additionalFees: newFees };
      const totals = calculateStructureTotals(newForm);
      return { ...newForm, ...totals };
    });
    toast.success('Fee removed');
  };

  // Handle installment form input
  const handleInstallmentInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInstallmentForm(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  // Add installment
  const addInstallment = () => {
    if (installmentForm.amount <= 0 || !installmentForm.dueDate) {
      toast.error('Please fill all installment fields with valid values');
      return;
    }

    const installment: Installment = {
      installmentNumber: (structureForm.installments || []).length + 1,
      amount: installmentForm.amount,
      dueDate: installmentForm.dueDate,
      description: installmentForm.description
    };

    setStructureForm(prev => {
      const newInstallments = [...(prev.installments || [])];
      if (editingInstallmentIndex !== null) {
        newInstallments[editingInstallmentIndex] = installment;
      } else {
        newInstallments.push(installment);
      }
      return { ...prev, installments: newInstallments };
    });

    setInstallmentForm({
      amount: 0,
      dueDate: '',
      description: ''
    });
    setEditingInstallmentIndex(null);
    toast.success(editingInstallmentIndex !== null ? 'Installment updated!' : 'Installment added!');
  };

  // Edit installment
  const editInstallment = (index: number) => {
    const installment = (structureForm.installments || [])[index];
    if (installment) {
      setInstallmentForm({
        amount: installment.amount,
        dueDate: installment.dueDate,
        description: installment.description || ''
      });
      setEditingInstallmentIndex(index);
    }
  };

  // Remove installment
  const removeInstallment = (index: number) => {
    setStructureForm(prev => {
      const newInstallments = (prev.installments || []).filter((_, i) => i !== index);
      return { ...prev, installments: newInstallments };
    });
    toast.success('Installment removed');
  };

  // Open add structure modal
  const openAddStructure = () => {
    setEditingStructure(null);
    setStructureForm({
      name: '',
      department: '',
      program: '',
      semester: 1,
      applyToAllSemesters: false,
      studentCategory: 'Regular',
      academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
      status: 'Draft',
      effectiveFrom: '',
      effectiveTo: '',
      calculationMethod: 'Course Based',
      courses: [],
      additionalFees: [],
      discountEnabled: false,
      discount: {
        type: 'Percentage',
        value: 0,
        applicableTo: 'Tuition Fee',
        description: ''
      },
      lateFeeEnabled: false,
      lateFee: {
        gracePeriod: 7,
        type: 'Fixed Amount',
        amount: 0,
        percentage: 0,
        maximumFee: 0
      },
      paymentType: 'Full Payment',
      installments: [],
      notes: '',
      totalCourseFee: 0,
      totalAdditionalFee: 0,
      grossTotal: 0,
      discountAmount: 0,
      finalPayable: 0,
      isActive: true
    });
    setCourseForm({
      courseCode: '',
      courseName: '',
      creditHours: 1,
      feePerCredit: 0
    });
    setEditingCourseIndex(null);
    setAdditionalFeeForm({
      name: '',
      type: 'Fixed',
      amount: 0,
      percentage: 0,
      description: ''
    });
    setEditingAdditionalFeeIndex(null);
    setInstallmentForm({
      amount: 0,
      dueDate: '',
      description: ''
    });
    setEditingInstallmentIndex(null);
    setSelectedCourseIds(new Set());
    setIsStructureModalOpen(true);
  };

  // Open edit structure modal
  const openEditStructure = (structure: FeeStructure) => {
    setEditingStructure(structure);
    setStructureForm({
      ...structure,
      effectiveFrom: structure.effectiveFrom ? new Date(structure.effectiveFrom).toISOString().split('T')[0] : '',
      effectiveTo: structure.effectiveTo ? new Date(structure.effectiveTo).toISOString().split('T')[0] : ''
    });
    setCourseForm({
      courseCode: '',
      courseName: '',
      creditHours: 1,
      feePerCredit: 0
    });
    setEditingCourseIndex(null);
    setAdditionalFeeForm({
      name: '',
      type: 'Fixed',
      amount: 0,
      percentage: 0,
      description: ''
    });
    setEditingAdditionalFeeIndex(null);
    setInstallmentForm({
      amount: 0,
      dueDate: '',
      description: ''
    });
    setEditingInstallmentIndex(null);
    setSelectedCourseIds(new Set());
    setIsStructureModalOpen(true);
  };

  // Open view structure modal
  const openViewStructure = (structure: FeeStructure) => {
    setViewStructure(structure);
    setIsViewModalOpen(true);
  };

  // Save fee structure
  const saveFeeStructure = async () => {
    try {
      if (!structureForm.name || !structureForm.department || !structureForm.program || !structureForm.academicYear) {
        toast.error('Please fill all required fields');
        return;
      }

      if (!structureForm.courses || structureForm.courses.length === 0) {
        toast.error('Please add at least one course');
        return;
      }

      setIsSubmitting(true);
      
      // Calculate totals with proper null checks
      const totals = calculateStructureTotals(structureForm);
      const data = {
        ...structureForm,
        ...totals,
        // Ensure nested objects have proper default values
        discount: {
          type: structureForm.discount?.type || 'Percentage',
          value: structureForm.discount?.value || 0,
          applicableTo: structureForm.discount?.applicableTo || 'Tuition Fee',
          description: structureForm.discount?.description || ''
        },
        lateFee: {
          gracePeriod: structureForm.lateFee?.gracePeriod || 7,
          type: structureForm.lateFee?.type || 'Fixed Amount',
          amount: structureForm.lateFee?.amount || 0,
          percentage: structureForm.lateFee?.percentage || 0,
          maximumFee: structureForm.lateFee?.maximumFee || 0
        }
      };

      // If applyToAllSemesters is true, create structures for all semesters
      if (structureForm.applyToAllSemesters) {
        const structuresToCreate = [];
        const semesters = [1, 2, 3, 4, 5, 6, 7, 8];
        
        for (const sem of semesters) {
          const structureData = {
            ...data,
            semester: sem,
            name: `${data.program} - Semester ${sem} Fee Structure`,
            applyToAllSemesters: false // Don't propagate this flag to individual structures
          };
          structuresToCreate.push(structureData);
        }

        // Create all structures
        let createdCount = 0;
        let failedCount = 0;
        
        for (const structureData of structuresToCreate) {
          try {
            let response;
            if (editingStructure && editingStructure._id) {
              // If editing, update the main structure and create new ones for other semesters
              if (structureData.semester === data.semester) {
                response = await feeStructureAPI.update(editingStructure._id, structureData);
              } else {
                // Check if structure already exists for this semester
                const existing = feeStructures.find(s => 
                  s.program === data.program && 
                  s.semester === structureData.semester &&
                  s.department === data.department
                );
                if (existing) {
                  // Update existing structure
                  response = await feeStructureAPI.update(existing._id || '', structureData);
                } else {
                  // Create new structure
                  response = await feeStructureAPI.create(structureData);
                }
              }
            } else {
              response = await feeStructureAPI.create(structureData);
            }
            
            if (response && response.success) {
              createdCount++;
            } else {
              failedCount++;
            }
          } catch (error) {
            console.error(`Failed to create structure for semester ${structureData.semester}:`, error);
            failedCount++;
          }
        }

        if (createdCount > 0) {
          toast.success(`${createdCount} fee structures created${failedCount > 0 ? `, ${failedCount} failed` : ''}`);
        } else {
          toast.error('Failed to create fee structures');
        }
      } else {
        // Single structure creation
        let response;
        if (editingStructure && editingStructure._id) {
          response = await feeStructureAPI.update(editingStructure._id, data);
        } else {
          response = await feeStructureAPI.create(data);
        }

        if (response && response.success) {
          toast.success(editingStructure ? 'Fee structure updated!' : 'Fee structure created!');
        } else {
          toast.error(response?.message || 'Failed to save fee structure');
          setIsSubmitting(false);
          return;
        }
      }

      setIsStructureModalOpen(false);
      setEditingStructure(null);
      await fetchFeeStructures();
      
    } catch (error: any) {
      console.error('Failed to save fee structure:', error);
      toast.error(error.message || 'Failed to save fee structure');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete fee structure
  const deleteFeeStructure = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete fee structure "${name}"?`)) return;
    
    try {
      const response = await feeAPI.delete(id);
      if (response && response.success) {
        toast.success('Fee structure deleted!');
        await fetchFeeStructures();
      } else {
        toast.error(response?.message || 'Failed to delete fee structure');
      }
    } catch (error) {
      console.error('Failed to delete fee structure:', error);
      toast.error('Failed to delete fee structure');
    }
  };

  // Generate fee for a student
  const generateStudentFee = async () => {
    try {
      if (!recordForm.studentId || !recordForm.feeStructureId) {
        toast.error('Please select a student and fee structure');
        return;
      }

      setIsSubmitting(true);
      const response = await feeAPI.create({
        studentId: recordForm.studentId,
        feeStructureId: recordForm.feeStructureId,
        dueDate: recordForm.dueDate
      });

      if (response && response.success) {
        toast.success('Fee generated for student!');
        await fetchFeeRecords();
        setRecordForm({
          studentId: '',
          studentName: '',
          studentEmail: '',
          department: '',
          program: '',
          semester: 1,
          feeStructureId: '',
          dueDate: '',
          paymentMethod: 'Cash'
        });
      } else {
        toast.error(response?.message || 'Failed to generate fee');
      }
    } catch (error: any) {
      console.error('Failed to generate fee:', error);
      toast.error(error.message || 'Failed to generate fee');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Process payment
  const processPayment = async (recordId: string, amount: number) => {
    const paymentAmount = prompt(`Enter payment amount (PKR):`, String(amount || 0));
    if (!paymentAmount) return;
    
    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const response = await feeAPI.processPayment(recordId, {
        amount: amountNum,
        paymentMethod: 'Cash'
      });
      
      if (response && response.success) {
        toast.success('Payment processed successfully!');
        await fetchFeeRecords();
        await fetchStats();
      } else {
        toast.error(response?.message || 'Failed to process payment');
      }
    } catch (error) {
      console.error('Failed to process payment:', error);
      toast.error('Failed to process payment');
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      'Paid': { className: 'bg-green-500/15 text-green-600 border-0', label: 'Paid' },
      'Pending': { className: 'bg-yellow-500/15 text-yellow-600 border-0', label: 'Pending' },
      'Partial': { className: 'bg-blue-500/15 text-blue-600 border-0', label: 'Partial' },
      'Overdue': { className: 'bg-red-500/15 text-red-600 border-0', label: 'Overdue' },
      'Scholarship': { className: 'bg-purple-500/15 text-purple-600 border-0', label: 'Scholarship' },
      'Waived': { className: 'bg-gray-500/15 text-gray-600 border-0', label: 'Waived' },
      'Active': { className: 'bg-green-500/15 text-green-600 border-0', label: 'Active' },
      'Inactive': { className: 'bg-gray-500/15 text-gray-600 border-0', label: 'Inactive' },
      'Draft': { className: 'bg-yellow-500/15 text-yellow-600 border-0', label: 'Draft' },
      'Archived': { className: 'bg-red-500/15 text-red-600 border-0', label: 'Archived' }
    };
    
    const info = statusMap[status] || statusMap['Pending'];
    return <Badge className={info.className}>{info.label}</Badge>;
  };

  // Fee Structure Columns
  const structureColumns: Column<FeeStructure>[] = [
    {
      key: "name",
      header: "Structure Name",
      cell: (r) => (
        <div>
          <div className="font-medium">{r.name}</div>
          <div className="text-xs text-muted-foreground">
            {r.structureId || r._id?.slice(-8)}
            {r.applyToAllSemesters && (
              <Badge variant="outline" className="ml-2 text-[10px] bg-blue-50">All Semesters</Badge>
            )}
          </div>
        </div>
      )
    },
    {
      key: "program",
      header: "Program",
      cell: (r) => <span>{r.program} - Sem {r.semester}</span>
    },
    {
      key: "department",
      header: "Department",
      cell: (r) => <span className="text-sm">{r.department}</span>
    },
    {
      key: "courses",
      header: "Courses",
      cell: (r) => <span>{(r.courses || []).length} courses</span>
    },
    {
      key: "finalPayable",
      header: "Total Fee",
      cell: (r) => <span className="font-bold text-primary">PKR {(r.finalPayable || 0).toLocaleString()}</span>
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => getStatusBadge(r.status || 'Draft')
    },
    {
      key: "actions",
      header: "Actions",
      cell: (r) => (
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => openViewStructure(r)}
            className="hover:bg-blue-50"
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => openEditStructure(r)}>
            <Pencil className="h-3 w-3 mr-1" /> Edit
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => r._id && deleteFeeStructure(r._id, r.name)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )
    }
  ];

  // Fee Record Columns
  const recordColumns: Column<StudentFeeRecord>[] = [
    {
      key: "studentName",
      header: "Student",
      cell: (r) => (
        <div>
          <div className="font-medium">{r.studentName}</div>
          <div className="text-xs text-muted-foreground">
            <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{r.studentId}</span>
          </div>
        </div>
      )
    },
    {
      key: "program",
      header: "Program",
      cell: (r) => (
        <div>
          <div className="text-sm">{r.program}</div>
          <div className="text-xs text-muted-foreground">Semester {r.semester}</div>
        </div>
      )
    },
    {
      key: "totalAmount",
      header: "Total",
      cell: (r) => <span className="font-medium">PKR {(r.totalAmount || 0).toLocaleString()}</span>
    },
    {
      key: "remainingAmount",
      header: "Remaining",
      cell: (r) => (
        <span className={(r.remainingAmount || 0) > 0 ? 'text-red-500' : 'text-green-500'}>
          PKR {(r.remainingAmount || 0).toLocaleString()}
        </span>
      )
    },
    {
      key: "feeStructureName",
      header: "Fee Structure",
      cell: (r) => <span className="text-sm">{r.feeStructureName || '-'}</span>
    },
    {
      key: "dueDate",
      header: "Due Date",
      cell: (r) => {
        const date = new Date(r.dueDate);
        return <span>{date.toLocaleDateString()}</span>;
      }
    },
    {
      key: "paymentStatus",
      header: "Status",
      cell: (r) => getStatusBadge(r.paymentStatus)
    },
    {
      key: "actions",
      header: "Actions",
      cell: (r) => (
        <div className="flex gap-1">
          {r.paymentStatus !== 'Paid' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => r._id && processPayment(r._id, r.remainingAmount || 0)}
              className="hover:bg-green-50"
            >
              <Wallet className="h-3 w-3 mr-1" /> Pay
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => toast.info('Invoice generation coming soon')}
          >
            <Receipt className="h-3 w-3" />
          </Button>
        </div>
      )
    }
  ];

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <AppShell title="Fees Management" subtitle="Please login to manage fees">
        <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg p-8">
          <Database className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Login Required</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            Please login to view and manage fees.
          </p>
          <Button onClick={() => window.location.href = '/login'} className="gradient-brand text-white border-0">
            Go to Login
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Fees Management"
      subtitle="Manage fee structures, generate student fees, and track payments"
      actions={
        <>
          {activeTab === "structures" && (
            <Button onClick={openAddStructure} className="gradient-brand text-white border-0">
              <Plus className="h-4 w-4 mr-2" /> Create Fee Structure
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={fetchAllData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </>
      }
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <KpiCard 
          label="Total Collected" 
          value={`PKR ${(stats?.totalPaid || 0).toLocaleString()}`} 
          icon={DollarSign} 
          tone="success" 
        />
        <KpiCard 
          label="Pending Payments" 
          value={`PKR ${(stats?.pendingAmount || 0).toLocaleString()}`} 
          icon={AlertCircle} 
          tone="warning" 
        />
        <KpiCard 
          label="Fee Structures" 
          value={feeStructures.length.toString()} 
          icon={FileText} 
          tone="info" 
        />
        <KpiCard 
          label="Students with Fees" 
          value={feeRecords.length.toString()} 
          icon={Users} 
          tone="brand" 
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="structures" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Fee Structures
          </TabsTrigger>
          <TabsTrigger value="records" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Student Fees
          </TabsTrigger>
        </TabsList>

        {/* Fee Structures Tab */}
        <TabsContent value="structures">
          {/* Search */}
          <div className="mb-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, department or program..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : feeStructures.length > 0 ? (
            <DataTable
              title="Fee Structures"
              description={`${filteredStructures.length} fee structures configured`}
              data={filteredStructures}
              columns={structureColumns}
              pageSize={10}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg p-8">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Fee Structures</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                Create a fee structure by defining courses and their credit hour fees for each program and semester.
              </p>
              <Button onClick={openAddStructure} className="gradient-brand text-white border-0">
                <Plus className="h-4 w-4 mr-2" /> Create First Fee Structure
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Student Fee Records Tab */}
        <TabsContent value="records">
          {/* Generate Fee for Student */}
          <Card className="glass mb-4">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-primary" />
                Generate Fee for Student
              </CardTitle>
              <CardDescription>Select a student and fee structure to generate fee record</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Student</Label>
                  <select
                    value={recordForm.studentId}
                    onChange={(e) => {
                      const student = students.find(s => s._id === e.target.value);
                      if (student) {
                        setRecordForm(prev => ({
                          ...prev,
                          studentId: student._id || '',
                          studentName: student.name || '',
                          studentEmail: student.email || '',
                          department: student.department || '',
                          program: student.program || '',
                          semester: student.semester || 1
                        }));
                      }
                    }}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Student</option>
                    {students.map(s => (
                      <option key={s._id} value={s._id}>
                        {s.name} - {s.studentId}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Fee Structure</Label>
                  <select
                    value={recordForm.feeStructureId}
                    onChange={(e) => setRecordForm(prev => ({ ...prev, feeStructureId: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Structure</option>
                    {feeStructures.map(s => (
                      <option key={s._id} value={s._id}>
                        {s.name} - {s.program} Sem {s.semester} (PKR {(s.finalPayable || 0).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={recordForm.dueDate}
                    onChange={(e) => setRecordForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>

                <div className="flex items-end">
                  <Button 
                    className="w-full gradient-brand text-white border-0"
                    onClick={generateStudentFee}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Generate Fee
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fee Records Table */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : feeRecords.length > 0 ? (
            <DataTable
              title="Student Fee Records"
              description={`${feeRecords.length} student fee records`}
              data={feeRecords}
              columns={recordColumns}
              pageSize={10}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg p-8">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Fee Records</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                Generate fee records for students using the form above.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Fee Structure Modal */}
      {isStructureModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsStructureModalOpen(false);
              setEditingStructure(null);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {editingStructure ? 'Edit Fee Structure' : 'Create Fee Structure'}
              </h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setIsStructureModalOpen(false);
                  setEditingStructure(null);
                }}
                className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* 1. BASIC INFORMATION */}
              <div>
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">1</span>
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Structure Name *</Label>
                    <Input
                      name="name"
                      value={structureForm.name || ''}
                      onChange={handleStructureInput}
                      placeholder="BSSE - Semester 5 Fee Structure"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Academic Year *</Label>
                    <select
                      name="academicYear"
                      value={structureForm.academicYear || ''}
                      onChange={handleStructureInput}
                      className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select Year</option>
                      {['2024-2025', '2025-2026', '2026-2027', '2027-2028'].map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Department *</Label>
                    <select
                      name="department"
                      value={structureForm.department || ''}
                      onChange={handleStructureInput}
                      className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select Department</option>
                      {departments.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Program *</Label>
                    <select
                      name="program"
                      value={structureForm.program || ''}
                      onChange={handleStructureInput}
                      className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select Program</option>
                      {programs.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Semester *</Label>
                    <select
                      name="semester"
                      value={structureForm.semester || 1}
                      onChange={handleStructureInput}
                      className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {semesters.map(s => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Student Category</Label>
                    <select
                      name="studentCategory"
                      value={structureForm.studentCategory || 'Regular'}
                      onChange={handleStructureInput}
                      className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {studentCategories.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <select
                      name="status"
                      value={structureForm.status || 'Draft'}
                      onChange={handleStructureInput}
                      className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Effective From</Label>
                    <Input
                      type="date"
                      name="effectiveFrom"
                      value={structureForm.effectiveFrom || ''}
                      onChange={handleStructureInput}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Effective To</Label>
                    <Input
                      type="date"
                      name="effectiveTo"
                      value={structureForm.effectiveTo || ''}
                      onChange={handleStructureInput}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <Checkbox
                        id="applyToAllSemesters"
                        checked={structureForm.applyToAllSemesters || false}
                        onCheckedChange={(checked) => {
                          setStructureForm(prev => ({
                            ...prev,
                            applyToAllSemesters: checked === true
                          }));
                        }}
                      />
                      <Label htmlFor="applyToAllSemesters" className="text-sm font-medium text-blue-700 cursor-pointer">
                        Apply this fee structure to ALL semesters of {structureForm.program || 'selected program'}
                      </Label>
                      <div className="ml-auto">
                        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                          <Copy className="h-3 w-3 mr-1" />
                          Auto-generate for all semesters
                        </Badge>
                      </div>
                    </div>
                    {structureForm.applyToAllSemesters && (
                      <p className="text-xs text-blue-600 mt-1">
                        This will create separate fee structures for Semester 1 through 8 of {structureForm.program || 'the selected program'}.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. FEE CALCULATION METHOD */}
              <div>
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">2</span>
                  Fee Calculation Method
                </h3>
                <div className="flex flex-wrap gap-6">
                  {calculationMethods.map(method => (
                    <label key={method} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="calculationMethod"
                        value={method}
                        checked={structureForm.calculationMethod === method}
                        onChange={handleStructureInput}
                        className="w-4 h-4 text-primary"
                      />
                      <span className="text-sm">{method}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 3. COURSES */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">3</span>
                    Courses / Subjects
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{(structureForm.courses || []).length} courses added</Badge>
                    <Badge variant="outline">{filteredCourses.length} available</Badge>
                  </div>
                </div>

                {/* Add from database - with checkboxes */}
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium text-blue-700 flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Add Courses from Database
                    </Label>
                    <div className="flex items-center gap-2">
                      {structureForm.program && (
                        <Badge variant="secondary" className="bg-blue-100">
                          {structureForm.program} {structureForm.semester ? `- Sem ${structureForm.semester}` : '- All Semesters'}
                        </Badge>
                      )}
                      {!structureForm.program && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                          Select Program & Semester first
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Course Selection with Checkboxes */}
                  {structureForm.program && (
                    <div className="space-y-2">
                      {/* Select All / Actions Bar */}
                      <div className="flex items-center justify-between gap-3 p-2 bg-white rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="selectAllCourses"
                              checked={selectedCourseIds.size === filteredCourses.length && filteredCourses.length > 0}
                              onCheckedChange={toggleSelectAllCourses}
                              disabled={filteredCourses.length === 0}
                            />
                            <Label htmlFor="selectAllCourses" className="text-xs font-medium">
                              Select All ({filteredCourses.length})
                            </Label>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {selectedCourseIds.size} selected
                          </span>
                        </div>
                        <Button 
                          onClick={addSelectedCourses}
                          disabled={selectedCourseIds.size === 0 || isSubmitting}
                          size="sm"
                          className="gradient-brand text-white border-0"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Selected ({selectedCourseIds.size})
                        </Button>
                      </div>

                      {/* Course List with Checkboxes */}
                      {filteredCourses.length > 0 ? (
                        <div className="border rounded-lg bg-white max-h-[200px] overflow-y-auto">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-2">
                            {filteredCourses
                              .sort((a, b) => a.code.localeCompare(b.code))
                              .map(course => {
                                const isAdded = (structureForm.courses || []).some(c => c.courseCode === course.code);
                                return (
                                  <div key={course._id} className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-50">
                                    <Checkbox
                                      id={`course-${course._id}`}
                                      checked={selectedCourseIds.has(course._id || '')}
                                      onCheckedChange={() => toggleCourseSelection(course._id || '')}
                                      disabled={isAdded}
                                    />
                                    <Label htmlFor={`course-${course._id}`} className="text-xs flex-1 cursor-pointer">
                                      <span className="font-medium">{course.code}</span>
                                      <span className="text-muted-foreground ml-1">{course.name}</span>
                                      <span className="text-xs text-muted-foreground ml-1">
                                        ({course.credits || 3} cr, PKR {(course.feePerCredit || 0).toLocaleString()}/cr)
                                      </span>
                                      {isAdded && (
                                        <Badge variant="secondary" className="ml-1 text-[10px]">Added</Badge>
                                      )}
                                    </Label>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-yellow-50 rounded border border-yellow-200 text-sm text-yellow-700">
                          <AlertCircle className="h-4 w-4 inline mr-2" />
                          No courses found for {structureForm.program} {structureForm.semester ? `Semester ${structureForm.semester}` : ''}. 
                          Please ensure courses are added to this program/semester.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Add Course Form - with context */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 p-4 bg-gray-50 rounded-lg border">
                  <div className="md:col-span-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <span className="font-medium">Manual Course Entry</span>
                      <span className="text-xs">(for {structureForm.program || 'selected program'}, Semester {structureForm.semester || 'selected semester'})</span>
                    </div>
                  </div>
                  <Input
                    placeholder="Course Code"
                    name="courseCode"
                    value={courseForm.courseCode}
                    onChange={handleCourseInput}
                  />
                  <Input
                    placeholder="Course Name"
                    name="courseName"
                    value={courseForm.courseName}
                    onChange={handleCourseInput}
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Credit Hours"
                      type="number"
                      name="creditHours"
                      min="1"
                      value={courseForm.creditHours}
                      onChange={handleCourseInput}
                    />
                    <span className="text-xs text-muted-foreground">hrs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Fee/Credit"
                      type="number"
                      name="feePerCredit"
                      min="0"
                      value={courseForm.feePerCredit}
                      onChange={handleCourseInput}
                    />
                    <span className="text-xs text-muted-foreground">PKR</span>
                  </div>
                  <div className="md:col-span-4 flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const defaultFee = structureForm.program === 'BSEE' ? 5500 : 5000;
                        setCourseForm(prev => ({
                          ...prev,
                          feePerCredit: defaultFee,
                          creditHours: 3
                        }));
                        toast.info(`Default values filled (${defaultFee} PKR/credit)`);
                      }}
                    >
                      <Calculator className="h-4 w-4 mr-2" />
                      Default Values
                    </Button>
                    <Button onClick={addCourse} variant="outline" size="sm">
                      {editingCourseIndex !== null ? (
                        <>
                          <Pencil className="h-4 w-4 mr-2" />
                          Update Course
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Course
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Course List */}
                {(structureForm.courses || []).length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Code</th>
                          <th className="px-4 py-2 text-left">Course Name</th>
                          <th className="px-4 py-2 text-center">Credit Hrs</th>
                          <th className="px-4 py-2 text-right">Fee/Credit</th>
                          <th className="px-4 py-2 text-right">Total</th>
                          <th className="px-4 py-2 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(structureForm.courses || []).map((course, index) => (
                          <tr key={index} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium">
                              <Badge variant="outline">{course.courseCode}</Badge>
                            </td>
                            <td className="px-4 py-2">{course.courseName}</td>
                            <td className="px-4 py-2 text-center">{course.creditHours}</td>
                            <td className="px-4 py-2 text-right">PKR {course.feePerCredit.toLocaleString()}</td>
                            <td className="px-4 py-2 text-right font-medium">PKR {course.totalFee.toLocaleString()}</td>
                            <td className="px-4 py-2 text-center">
                              <div className="flex justify-center gap-1">
                                <Button variant="ghost" size="sm" onClick={() => editCourse(index)} className="h-7 w-7 p-0">
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => removeCourse(index)} className="h-7 w-7 p-0 text-red-500">
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-bold border-t-2">
                          <td colSpan={4} className="px-4 py-3 text-right">Total Course Fee:</td>
                          <td className="px-4 py-3 text-right text-primary text-lg">
                            PKR {(structureForm.totalCourseFee || 0).toLocaleString()}
                          </td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 4. ADDITIONAL FEES */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">4</span>
                    Additional Fee Components
                  </h3>
                  <Badge variant="secondary">{(structureForm.additionalFees || []).length} fees</Badge>
                </div>

                {/* Add Additional Fee Form */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 p-4 bg-gray-50 rounded-lg border">
                  <Input
                    placeholder="Fee Name"
                    name="name"
                    value={additionalFeeForm.name}
                    onChange={handleAdditionalFeeInput}
                  />
                  <select
                    name="type"
                    value={additionalFeeForm.type}
                    onChange={handleAdditionalFeeInput}
                    className="border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Fixed">Fixed Amount</option>
                    <option value="Percentage">Percentage</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder={additionalFeeForm.type === 'Fixed' ? 'Amount' : 'Percentage %'}
                      type="number"
                      name={additionalFeeForm.type === 'Fixed' ? 'amount' : 'percentage'}
                      value={additionalFeeForm.type === 'Fixed' ? additionalFeeForm.amount : additionalFeeForm.percentage}
                      onChange={handleAdditionalFeeInput}
                      min="0"
                    />
                    <span className="text-xs text-muted-foreground">
                      {additionalFeeForm.type === 'Fixed' ? 'PKR' : '%'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={addAdditionalFee} variant="outline" size="sm" className="w-full">
                      {editingAdditionalFeeIndex !== null ? (
                        <>
                          <Pencil className="h-4 w-4 mr-2" />
                          Update
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Fee
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Additional Fees List */}
                {(structureForm.additionalFees || []).length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Name</th>
                          <th className="px-4 py-2 text-center">Type</th>
                          <th className="px-4 py-2 text-right">Amount</th>
                          <th className="px-4 py-2 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(structureForm.additionalFees || []).map((fee, index) => (
                          <tr key={index} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium">{fee.name}</td>
                            <td className="px-4 py-2 text-center">
                              <Badge variant="outline">{fee.type}</Badge>
                            </td>
                            <td className="px-4 py-2 text-right">
                              {fee.type === 'Fixed' 
                                ? `PKR ${fee.amount.toLocaleString()}`
                                : `${fee.percentage}% of course fee`}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <div className="flex justify-center gap-1">
                                <Button variant="ghost" size="sm" onClick={() => editAdditionalFee(index)} className="h-7 w-7 p-0">
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => removeAdditionalFee(index)} className="h-7 w-7 p-0 text-red-500">
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-bold border-t-2">
                          <td colSpan={2} className="px-4 py-3 text-right">Total Additional Fee:</td>
                          <td className="px-4 py-3 text-right text-primary">
                            PKR {(structureForm.totalAdditionalFee || 0).toLocaleString()}
                          </td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 5. SCHOLARSHIP / DISCOUNT */}
              <div>
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">5</span>
                  Scholarship / Discount
                </h3>
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={structureForm.discountEnabled || false}
                        onCheckedChange={(checked) => {
                          setStructureForm(prev => ({
                            ...prev,
                            discountEnabled: checked
                          }));
                        }}
                      />
                      <Label className="text-sm">Enable Discount</Label>
                    </div>
                  </div>
                  {structureForm.discountEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Discount Type</Label>
                        <select
                          value={structureForm.discount?.type || 'Percentage'}
                          onChange={(e) => handleNestedInput('discount', 'type', e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {discountTypes.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Discount Value</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="10"
                            value={structureForm.discount?.value || 0}
                            onChange={(e) => handleNestedInput('discount', 'value', parseFloat(e.target.value) || 0)}
                            min="0"
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground">
                            {structureForm.discount?.type === 'Percentage' ? '%' : 'PKR'}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Applicable To</Label>
                        <select
                          value={structureForm.discount?.applicableTo || 'Tuition Fee'}
                          onChange={(e) => handleNestedInput('discount', 'applicableTo', e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="Tuition Fee">Tuition Fee</option>
                          <option value="Total Fee">Total Fee</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 6. LATE PAYMENT / FINE */}
              <div>
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">6</span>
                  Late Payment / Fine
                </h3>
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={structureForm.lateFeeEnabled || false}
                        onCheckedChange={(checked) => {
                          setStructureForm(prev => ({
                            ...prev,
                            lateFeeEnabled: checked
                          }));
                        }}
                      />
                      <Label className="text-sm">Enable Late Fee</Label>
                    </div>
                  </div>
                  {structureForm.lateFeeEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Grace Period (Days)</Label>
                        <Input
                          type="number"
                          placeholder="7"
                          value={structureForm.lateFee?.gracePeriod || 7}
                          onChange={(e) => handleNestedInput('lateFee', 'gracePeriod', parseInt(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fine Type</Label>
                        <select
                          value={structureForm.lateFee?.type || 'Fixed Amount'}
                          onChange={(e) => handleNestedInput('lateFee', 'type', e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          {lateFeeTypes.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Fine Amount</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="500"
                            value={structureForm.lateFee?.amount || 0}
                            onChange={(e) => handleNestedInput('lateFee', 'amount', parseFloat(e.target.value) || 0)}
                            min="0"
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground">
                            {structureForm.lateFee?.type === 'Fixed Amount' ? 'PKR' : '%'}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Maximum Fine</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="5000"
                            value={structureForm.lateFee?.maximumFee || 0}
                            onChange={(e) => handleNestedInput('lateFee', 'maximumFee', parseFloat(e.target.value) || 0)}
                            min="0"
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground">PKR</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              
              {/* 7. PAYMENT SCHEDULE */}
              <div>
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">7</span>
                  Payment Schedule
                </h3>
                <div className="border rounded-lg p-4 space-y-4">
                  <div>
                    <Label>Payment Type</Label>
                    <select
                      name="paymentType"
                      value={structureForm.paymentType || 'Full Payment'}
                      onChange={handleStructureInput}
                      className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {paymentTypes.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  {structureForm.paymentType === 'Installments' && (
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1 flex gap-3">
                          <Input
                            placeholder="Amount"
                            type="number"
                            name="amount"
                            value={installmentForm.amount || ''}
                            onChange={handleInstallmentInput}
                            min="0"
                            className="flex-1"
                          />
                          <Input
                            placeholder="Due Date"
                            type="date"
                            name="dueDate"
                            value={installmentForm.dueDate || ''}
                            onChange={handleInstallmentInput}
                            className="flex-1"
                          />
                          <Input
                            placeholder="Description (optional)"
                            name="description"
                            value={installmentForm.description || ''}
                            onChange={handleInstallmentInput}
                            className="flex-1"
                          />
                        </div>
                        <Button onClick={addInstallment} variant="outline" size="sm">
                          {editingInstallmentIndex !== null ? (
                            <Pencil className="h-4 w-4 mr-2" />
                          ) : (
                            <Plus className="h-4 w-4 mr-2" />
                          )}
                          {editingInstallmentIndex !== null ? 'Update' : 'Add'}
                        </Button>
                      </div>

                      {(structureForm.installments || []).length > 0 && (
                        <div className="border rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-center">#</th>
                                <th className="px-4 py-2 text-right">Amount</th>
                                <th className="px-4 py-2 text-left">Due Date</th>
                                <th className="px-4 py-2 text-left">Description</th>
                                <th className="px-4 py-2 text-center">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(structureForm.installments || []).map((inst, index) => (
                                <tr key={index} className="border-t hover:bg-gray-50">
                                  <td className="px-4 py-2 text-center">{inst.installmentNumber}</td>
                                  <td className="px-4 py-2 text-right font-medium">PKR {inst.amount.toLocaleString()}</td>
                                  <td className="px-4 py-2">{new Date(inst.dueDate).toLocaleDateString()}</td>
                                  <td className="px-4 py-2 text-muted-foreground">{inst.description || '-'}</td>
                                  <td className="px-4 py-2 text-center">
                                    <div className="flex justify-center gap-1">
                                      <Button variant="ghost" size="sm" onClick={() => editInstallment(index)} className="h-7 w-7 p-0">
                                        <Pencil className="h-3 w-3" />
                                      </Button>
                                      <Button variant="ghost" size="sm" onClick={() => removeInstallment(index)} className="h-7 w-7 p-0 text-red-500">
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 8. NOTES */}
              <div>
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                  <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">8</span>
                  Notes
                </h3>
                <Textarea
                  name="notes"
                  value={structureForm.notes || ''}
                  onChange={handleStructureInput}
                  placeholder="Additional information about this fee structure..."
                  className="min-h-[80px]"
                />
              </div>

              {/* FEE SUMMARY */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                <h3 className="font-semibold text-sm mb-3">Fee Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Course Fees</span>
                    <span className="font-medium">PKR {(structureForm.totalCourseFee || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Additional Fees</span>
                    <span className="font-medium">PKR {(structureForm.totalAdditionalFee || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Gross Total</span>
                    <span className="font-semibold">PKR {(structureForm.grossTotal || 0).toLocaleString()}</span>
                  </div>
                  {structureForm.discountEnabled && (structureForm.discount?.value || 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>- PKR {(structureForm.discountAmount || 0).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-2 text-lg font-bold text-primary">
                    <span>Final Payable</span>
                    <span>PKR {(structureForm.finalPayable || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsStructureModalOpen(false);
                    setEditingStructure(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  className="gradient-brand text-white border-0"
                  onClick={saveFeeStructure}
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
                      {editingStructure ? 'Update Structure' : 'Create Structure'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Structure Modal */}
      {isViewModalOpen && viewStructure && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsViewModalOpen(false);
              setViewStructure(null);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Fee Structure Details
              </h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setIsViewModalOpen(false);
                  setViewStructure(null);
                }}
                className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-sm font-semibold text-primary mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Structure Name</Label>
                    <p className="font-medium">{viewStructure.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Structure ID</Label>
                    <p className="font-mono text-sm">{viewStructure.structureId || viewStructure._id?.slice(-8)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Program</Label>
                    <p>{viewStructure.program} - Semester {viewStructure.semester}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Department</Label>
                    <p>{viewStructure.department}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Academic Year</Label>
                    <p>{viewStructure.academicYear}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Student Category</Label>
                    <p>{viewStructure.studentCategory}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div>{getStatusBadge(viewStructure.status)}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Calculation Method</Label>
                    <p>{viewStructure.calculationMethod}</p>
                  </div>
                </div>
              </div>

              {/* Courses */}
              <div>
                <h3 className="text-sm font-semibold text-primary mb-3">Courses</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Code</th>
                        <th className="px-4 py-2 text-left">Course Name</th>
                        <th className="px-4 py-2 text-center">Credit Hrs</th>
                        <th className="px-4 py-2 text-right">Fee/Credit</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(viewStructure.courses || []).map((course, index) => (
                        <tr key={index} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium">
                            <Badge variant="outline">{course.courseCode}</Badge>
                          </td>
                          <td className="px-4 py-2">{course.courseName}</td>
                          <td className="px-4 py-2 text-center">{course.creditHours}</td>
                          <td className="px-4 py-2 text-right">PKR {course.feePerCredit.toLocaleString()}</td>
                          <td className="px-4 py-2 text-right font-medium">PKR {course.totalFee.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-right">Total Course Fee:</td>
                        <td colSpan={2} className="px-4 py-3 text-right text-primary">
                          PKR {(viewStructure.totalCourseFee || 0).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Additional Fees */}
              {(viewStructure.additionalFees || []).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-3">Additional Fees</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Name</th>
                          <th className="px-4 py-2 text-center">Type</th>
                          <th className="px-4 py-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(viewStructure.additionalFees || []).map((fee, index) => (
                          <tr key={index} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-2">{fee.name}</td>
                            <td className="px-4 py-2 text-center">
                              <Badge variant="outline">{fee.type}</Badge>
                            </td>
                            <td className="px-4 py-2 text-right">
                              {fee.type === 'Fixed' 
                                ? `PKR ${fee.amount.toLocaleString()}`
                                : `${fee.percentage}% of course fee`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 font-bold">
                        <tr>
                          <td colSpan={2} className="px-4 py-3 text-right">Total Additional Fee:</td>
                          <td className="px-4 py-3 text-right text-primary">
                            PKR {(viewStructure.totalAdditionalFee || 0).toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Discount */}
              {viewStructure.discountEnabled && (viewStructure.discount?.value || 0) > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-3">Discount</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Type</Label>
                      <p>{viewStructure.discount?.type}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Value</Label>
                      <p>{viewStructure.discount?.value} {viewStructure.discount?.type === 'Percentage' ? '%' : 'PKR'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Applied To</Label>
                      <p>{viewStructure.discount?.applicableTo}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Late Fee */}
              {viewStructure.lateFeeEnabled && (
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-3">Late Fee</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Grace Period</Label>
                      <p>{viewStructure.lateFee?.gracePeriod} days</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Fine Type</Label>
                      <p>{viewStructure.lateFee?.type}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Fine Amount</Label>
                      <p>{viewStructure.lateFee?.type === 'Fixed Amount' ? `PKR ${viewStructure.lateFee?.amount}` : `${viewStructure.lateFee?.percentage}%`}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Summary */}
              <div>
                <h3 className="text-sm font-semibold text-primary mb-3">Payment Summary</h3>
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Type</span>
                      <span className="font-medium">{viewStructure.paymentType}</span>
                    </div>
                    {viewStructure.paymentType === 'Installments' && (viewStructure.installments || []).length > 0 && (
                      <div>
                        <Label className="text-muted-foreground">Installments</Label>
                        <div className="mt-1 space-y-1">
                          {(viewStructure.installments || []).map((inst, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>#{inst.installmentNumber} - {new Date(inst.dueDate).toLocaleDateString()}</span>
                              <span className="font-medium">PKR {inst.amount.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Gross Total</span>
                      <span className="font-semibold">PKR {(viewStructure.grossTotal || 0).toLocaleString()}</span>
                    </div>
                    {viewStructure.discountEnabled && (viewStructure.discount?.value || 0) > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>- PKR {(viewStructure.discountAmount || 0).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2 text-lg font-bold text-primary">
                      <span>Final Payable</span>
                      <span>PKR {(viewStructure.finalPayable || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {viewStructure.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-primary mb-3">Notes</h3>
                  <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-lg border">{viewStructure.notes}</p>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setViewStructure(null);
                  }}
                >
                  Close
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    const structure = viewStructure;
                    setViewStructure(null);
                    openEditStructure(structure);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Structure
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default FeesPage;
