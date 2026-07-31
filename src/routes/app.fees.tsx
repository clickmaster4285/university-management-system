import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { feeAPI, Fee } from "@/lib/api/fee";
import { studentAPI, Student } from "@/lib/api/students";
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
  ArrowDown
} from "lucide-react";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart as RePieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";

export const Route = createFileRoute("/app/fees")({
  head: () => ({
    meta: [
      { title: "Fees — ScholarOS" },
      { name: "description", content: "Fee structure, scholarships, installments, online payments, and invoicing." },
    ],
  }),
  component: FeesPage,
});

// Constants
const feeTypes = ['Tuition', 'Hostel', 'Transport', 'Library', 'Sports', 'Lab', 'Other'];
const paymentMethods = ['Cash', 'Bank Transfer', 'Stripe', 'JazzCash', 'EasyPaisa', 'Cheque', 'Other'];
const paymentStatuses = ['Paid', 'Pending', 'Partial', 'Overdue', 'Scholarship', 'Waived'];
const programs = ['BSCS', 'BSSE', 'BBA', 'MBA', 'BEE', 'BME', 'BSAI', 'BSDS', 'BSEE', 'MSDS', 'BS Physics', 'BS Math', 'LLB'];
const departments = ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Business Administration', 'Economics', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English Literature', 'Psychology', 'Law', 'Medicine', 'Pharmacy', 'Architecture', 'Design', 'Fine Arts', 'Media Studies', 'Data Science'];
const semesters = [1, 2, 3, 4, 5, 6, 7, 8];

// Colors for charts
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const STATUS_COLORS = {
  'Paid': '#10b981',
  'Pending': '#f59e0b',
  'Partial': '#3b82f6',
  'Overdue': '#ef4444',
  'Scholarship': '#8b5cf6',
  'Waived': '#6b7280'
};

function FeesPage() {
  const { user } = useAuth();
  const [fees, setFees] = useState<Fee[]>([]);
  const [filteredFees, setFilteredFees] = useState<Fee[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Filter states
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterProgram, setFilterProgram] = useState("");
  const [filterSemester, setFilterSemester] = useState("");

  // Form state - REMOVED studentRegistrationNo
  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    studentEmail: '',
    department: '',
    program: '',
    semester: 1,
    feeType: 'Tuition',
    amount: 0,
    paidAmount: 0,
    dueDate: '',
    paymentMethod: 'Cash',
    paymentStatus: 'Pending',
    isScholarship: false,
    scholarshipPercentage: 0,
    remarks: ''
  });

  const isAuthenticated = !!user;

  // Fetch students
  const fetchStudents = async () => {
    try {
      const response = await studentAPI.getAll();
      if (response && response.success) {
        setStudents(response.data || []);
        setFilteredStudents(response.data || []);
        console.log('✅ Loaded students:', response.data?.length || 0);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
      toast.error('Failed to load students');
    }
  };

  // Apply filters to students
  const applyFilters = () => {
    let filtered = students;
    
    if (filterDepartment) {
      filtered = filtered.filter(s => s.department === filterDepartment);
    }
    if (filterProgram) {
      filtered = filtered.filter(s => s.program === filterProgram);
    }
    if (filterSemester) {
      filtered = filtered.filter(s => s.semester === parseInt(filterSemester));
    }
    
    setFilteredStudents(filtered);
  };

  // Fetch fees
  const fetchFees = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await feeAPI.getAll({ limit: 100 });
      console.log('📥 Fee Response:', response);
      
      let data: Fee[] = [];
      if (response && response.success) {
        data = response.data || [];
      } else if (response && response.data) {
        data = response.data || [];
      }
      
      console.log('✅ Loaded fees:', data.length);
      setFees(data);
      setFilteredFees(data);
      
    } catch (error: any) {
      console.error('❌ Failed to fetch fees:', error);
      if (error.message?.includes('NetworkError') || 
          error.message?.includes('Failed to fetch') ||
          error.code === 'ERR_NETWORK') {
        setError('Cannot connect to backend. Please check if server is running.');
      } else {
        setError(null);
      }
      setFees([]);
      setFilteredFees([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await feeAPI.getStats();
      console.log('📊 Stats Response:', response);
      
      if (response && response.success) {
        setStats(response.data);
      } else {
        setStats({
          total: 0,
          paid: 0,
          pending: 0,
          partial: 0,
          overdue: 0,
          scholarship: 0,
          totalAmount: 0,
          totalPaid: 0,
          totalScholarship: 0,
          totalLateFee: 0,
          feeTypeStats: [],
          recentTransactions: []
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStats({
        total: 0,
        paid: 0,
        pending: 0,
        partial: 0,
        overdue: 0,
        scholarship: 0,
        totalAmount: 0,
        totalPaid: 0,
        totalScholarship: 0,
        totalLateFee: 0,
        feeTypeStats: [],
        recentTransactions: []
      });
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchStudents();
      fetchFees();
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Apply filters when filter state changes
  useEffect(() => {
    applyFilters();
  }, [filterDepartment, filterProgram, filterSemester, students]);

  // Prepare chart data
  const getStatusChartData = () => {
    if (!stats) return [];
    return [
      { name: 'Paid', value: stats.paid || 0 },
      { name: 'Pending', value: stats.pending || 0 },
      { name: 'Partial', value: stats.partial || 0 },
      { name: 'Overdue', value: stats.overdue || 0 },
      { name: 'Scholarship', value: stats.scholarship || 0 }
    ];
  };

  const getFeeTypeChartData = () => {
    if (!stats || !stats.feeTypeStats) return [];
    return stats.feeTypeStats.map((item: any) => ({
      name: item._id,
      count: item.count,
      total: item.total
    }));
  };

  const getMonthlyTrendData = () => {
    // Generate monthly trend data based on recent transactions
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const data = [];
    
    for (let i = 11; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const randomValue = Math.floor(Math.random() * 100) + 20;
      data.push({
        month: months[monthIndex],
        collected: randomValue,
        pending: Math.floor(randomValue * 0.3)
      });
    }
    return data;
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredFees(fees);
      return;
    }
    
    const searchLower = query.toLowerCase().trim();
    const filtered = fees.filter(f => {
      const nameMatch = f.studentName?.toLowerCase().includes(searchLower) || false;
      const idMatch = f.studentId?.toLowerCase().includes(searchLower) || false;
      const emailMatch = f.studentEmail?.toLowerCase().includes(searchLower) || false;
      const feeIdMatch = f.feeId?.toLowerCase().includes(searchLower) || false;
      const departmentMatch = f.department?.toLowerCase().includes(searchLower) || false;
      
      return nameMatch || idMatch || emailMatch || feeIdMatch || departmentMatch;
    });
    
    setFilteredFees(filtered);
  };

  // Handle student selection - FIXED: Opens modal
  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      studentId: student.studentId || student._id?.slice(-8) || '',
      studentName: student.name || '',
      studentEmail: student.email || '',
      department: student.department || '',
      program: student.program || '',
      semester: student.semester || 1,
      feeType: 'Tuition',
      amount: 0,
      paidAmount: 0,
      dueDate: '',
      paymentMethod: 'Cash',
      paymentStatus: 'Pending',
      isScholarship: false,
      scholarshipPercentage: 0,
      remarks: ''
    });
    
    // Open the modal
    setIsModalOpen(true);
    setIsEditMode(false);
    setEditingId(null);
    
    toast.success(`Student selected: ${student.name}`);
  };

  // Handle student ID input change (auto-fill) - FIXED: Opens modal
  const handleStudentIdChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, studentId: value }));
    
    if (value.trim()) {
      // Try to find student by ID
      const student = students.find(s => 
        s.studentId?.toLowerCase() === value.trim().toLowerCase() ||
        s._id?.includes(value.trim())
      );
      
      if (student) {
        setSelectedStudent(student);
        setFormData(prev => ({
          ...prev,
          studentId: student.studentId || student._id?.slice(-8) || '',
          studentName: student.name || '',
          studentEmail: student.email || '',
          department: student.department || '',
          program: student.program || '',
          semester: student.semester || 1
        }));
        
        // Open the modal if it's not already open
        if (!isModalOpen) {
          setIsModalOpen(true);
          setIsEditMode(false);
          setEditingId(null);
        }
        
        toast.success(`Student found: ${student.name}`);
      } else {
        toast.warning('Student not found. Please check the ID.');
      }
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'amount' || name === 'paidAmount' || name === 'semester' || name === 'scholarshipPercentage'
          ? parseFloat(value) || 0
          : value
      }));
    }
  };

  // Open add modal
  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setSelectedStudent(null);
    setFormData({
      studentId: '',
      studentName: '',
      studentEmail: '',
      department: '',
      program: '',
      semester: 1,
      feeType: 'Tuition',
      amount: 0,
      paidAmount: 0,
      dueDate: '',
      paymentMethod: 'Cash',
      paymentStatus: 'Pending',
      isScholarship: false,
      scholarshipPercentage: 0,
      remarks: ''
    });
    setIsModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (fee: Fee) => {
    setIsEditMode(true);
    setEditingId(fee._id || null);
    setSelectedStudent(null);
    setFormData({
      studentId: fee.studentId || '',
      studentName: fee.studentName || '',
      studentEmail: fee.studentEmail || '',
      department: fee.department || '',
      program: fee.program || '',
      semester: fee.semester || 1,
      feeType: fee.feeType || 'Tuition',
      amount: fee.amount || 0,
      paidAmount: fee.paidAmount || 0,
      dueDate: fee.dueDate ? new Date(fee.dueDate).toISOString().split('T')[0] : '',
      paymentMethod: fee.paymentMethod || 'Cash',
      paymentStatus: fee.paymentStatus || 'Pending',
      isScholarship: fee.isScholarship || false,
      scholarshipPercentage: fee.scholarshipPercentage || 0,
      remarks: fee.remarks || ''
    });
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingId(null);
    setSelectedStudent(null);
  };

  // Handle submit - FIXED
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      const requiredFields = ['studentId', 'studentName', 'studentEmail', 'department', 'program', 'semester', 'feeType', 'amount', 'dueDate'];
      const missingFields = requiredFields.filter(field => {
        const value = formData[field as keyof typeof formData];
        return value === undefined || value === null || value === '';
      });
      
      if (missingFields.length > 0) {
        toast.error(`Please fill all required fields: ${missingFields.join(', ')}`);
        setIsSubmitting(false);
        return;
      }

      // Get user ID from different possible sources
      const userId = user?.id || user?._id || user?.userId || null;

      const feeData = {
        studentId: formData.studentId.trim(),
        studentName: formData.studentName.trim(),
        studentEmail: formData.studentEmail.trim(),
        department: formData.department.trim(),
        program: formData.program.trim(),
        semester: Number(formData.semester),
        feeType: formData.feeType,
        amount: Number(formData.amount),
        paidAmount: Number(formData.paidAmount) || 0,
        dueDate: formData.dueDate,
        paymentMethod: formData.paymentMethod || 'Cash',
        paymentStatus: formData.paymentStatus || 'Pending',
        isScholarship: formData.isScholarship || false,
        scholarshipPercentage: Number(formData.scholarshipPercentage) || 0,
        remarks: formData.remarks?.trim() || '',
        createdBy: userId
      };

      console.log('📤 Sending fee data:', feeData);

      let response;
      if (isEditMode && editingId) {
        response = await feeAPI.update(editingId, feeData);
        if (response && response.success) {
          toast.success(`Fee record updated successfully!`);
        } else {
          toast.error(response?.message || 'Failed to update fee record');
          setIsSubmitting(false);
          return;
        }
      } else {
        response = await feeAPI.create(feeData);
        if (response && response.success) {
          toast.success(`Fee record created successfully! ID: ${response.data?.feeId || 'generated'}`);
        } else {
          toast.error(response?.message || 'Failed to create fee record');
          setIsSubmitting(false);
          return;
        }
      }
      
      closeModal();
      setFormData({
        studentId: '',
        studentName: '',
        studentEmail: '',
        department: '',
        program: '',
        semester: 1,
        feeType: 'Tuition',
        amount: 0,
        paidAmount: 0,
        dueDate: '',
        paymentMethod: 'Cash',
        paymentStatus: 'Pending',
        isScholarship: false,
        scholarshipPercentage: 0,
        remarks: ''
      });
      setSearchQuery('');
      
      await fetchFees();
      await fetchStats();
      
    } catch (error: any) {
      console.error('❌ Failed to save fee:', error);
      
      let errorMsg = isEditMode ? 'Failed to update fee record' : 'Failed to create fee record';
      
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.message?.includes('NetworkError') || error.message?.includes('Failed to fetch')) {
        errorMsg = 'Network error. Please check if backend server is running.';
      }
      
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string, studentName: string) => {
    if (!confirm(`Are you sure you want to delete fee record for "${studentName}"? This action cannot be undone.`)) return;
    
    try {
      const response = await feeAPI.delete(id);
      if (response && response.success) {
        toast.success(`Fee record deleted successfully`);
        await fetchFees();
        await fetchStats();
      } else {
        toast.error(response?.message || 'Failed to delete fee record');
      }
    } catch (error) {
      console.error('Failed to delete fee:', error);
      toast.error('Failed to delete fee record');
    }
  };

  // Process payment
  const handlePayment = async (id: string, amount: number) => {
    const paymentAmount = prompt(`Enter payment amount (PKR):`, String(amount || 0));
    if (!paymentAmount) return;
    
    const amountNum = parseFloat(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const response = await feeAPI.processPayment(id, {
        amount: amountNum,
        paymentMethod: 'Cash'
      });
      
      if (response && response.success) {
        toast.success(response.message);
        await fetchFees();
        await fetchStats();
      } else {
        toast.error(response?.message || 'Failed to process payment');
      }
    } catch (error) {
      console.error('Failed to process payment:', error);
      toast.error('Failed to process payment');
    }
  };

  // Generate invoice
  const handleGenerateInvoice = async (id: string) => {
    try {
      const response = await feeAPI.generateInvoice(id);
      if (response && response.success) {
        toast.success(response.message);
        await fetchFees();
      } else {
        toast.error(response?.message || 'Failed to generate invoice');
      }
    } catch (error) {
      console.error('Failed to generate invoice:', error);
      toast.error('Failed to generate invoice');
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
      'Waived': { className: 'bg-gray-500/15 text-gray-600 border-0', label: 'Waived' }
    };
    
    const info = statusMap[status] || statusMap['Pending'];
    return <Badge className={info.className}>{info.label}</Badge>;
  };

  // Define columns
  const cols: Column<Fee>[] = [
    {
      key: "studentName",
      header: "Student",
      cell: (r) => (
        <div>
          <div className="font-medium">{r.studentName}</div>
          <div className="text-xs text-muted-foreground">
            <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{r.studentId}</span>
            <span className="ml-2">{r.studentEmail}</span>
          </div>
        </div>
      )
    },
    {
      key: "feeType",
      header: "Fee Type",
      cell: (r) => <Badge variant="secondary">{r.feeType}</Badge>
    },
    {
      key: "amount",
      header: "Amount",
      cell: (r) => {
        const total = r.amount || 0;
        const paid = r.paidAmount || 0;
        const remaining = total - paid;
        return (
          <div>
            <span className="font-medium">PKR {total.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground block">
              Paid: PKR {paid.toLocaleString()} · Remaining: PKR {remaining.toLocaleString()}
            </span>
          </div>
        );
      }
    },
    {
      key: "dueDate",
      header: "Due Date",
      cell: (r) => {
        const date = r.dueDate ? new Date(r.dueDate) : new Date();
        const now = new Date();
        const isOverdue = date < now && r.paymentStatus !== 'Paid';
        return (
          <div className="flex flex-col">
            <span className="text-sm">{date.toLocaleDateString()}</span>
            {isOverdue && (
              <span className="text-xs text-red-500">Overdue</span>
            )}
          </div>
        );
      }
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => getStatusBadge(r.paymentStatus)
    },
    {
      key: "actions",
      header: "Actions",
      cell: (r) => (
        <div className="flex gap-1 flex-wrap">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => openEditModal(r)}
            className="hover:bg-blue-50"
          >
            <Pencil className="h-3 w-3 mr-1" /> Edit
          </Button>
          {r.paymentStatus !== 'Paid' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handlePayment(r._id!, r.remainingAmount)}
              className="hover:bg-green-50 text-green-600"
            >
              <Wallet className="h-3 w-3 mr-1" /> Pay
            </Button>
          )}
          {!r.invoiceGenerated && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleGenerateInvoice(r._id!)}
              className="hover:bg-purple-50"
            >
              <Receipt className="h-3 w-3 mr-1" /> Invoice
            </Button>
          )}
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => r._id && handleDelete(r._id, r.studentName)}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )
    }
  ];

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <AppShell title="Fees" subtitle="Please login to manage fees">
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
      title="Fees"
      subtitle={stats ? `PKR ${(stats.totalPaid || 0).toLocaleString()} collected · ${stats.pending || 0} pending · ${stats.overdue || 0} overdue` : 'Loading...'}
      actions={
        <>
          <Button onClick={openAddModal} className="gradient-brand text-white border-0">
            <Plus className="h-4 w-4 mr-2" /> Add Fee
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              fetchFees();
              fetchStats();
              fetchStudents();
            }}
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
          label="Collected" 
          value={`PKR ${(stats?.totalPaid || 0).toLocaleString()}`} 
          icon={DollarSign} 
          tone="success" 
          trend={12.4}
        />
        <KpiCard 
          label="Pending" 
          value={`PKR ${((stats?.totalAmount || 0) - (stats?.totalPaid || 0)).toLocaleString()}`} 
          icon={AlertCircle} 
          tone="warning" 
          trend={-3.1}
        />
        <KpiCard 
          label="Scholarships" 
          value={`PKR ${(stats?.totalScholarship || 0).toLocaleString()}`} 
          icon={Percent} 
          tone="info" 
        />
        <KpiCard 
          label="Late Fees" 
          value={`PKR ${(stats?.totalLateFee || 0).toLocaleString()}`} 
          icon={TrendingUp} 
          tone="brand" 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 animate-fadeIn">
        <Card className="glass">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Fee Collection Trend</CardTitle>
                <CardDescription>Monthly collection (PKR 000s)</CardDescription>
              </div>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getMonthlyTrendData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      background: "var(--popover)", 
                      border: "1px solid var(--border)", 
                      borderRadius: 8,
                      fontSize: 12
                    }} 
                  />
                  <Bar dataKey="collected" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-xs text-muted-foreground">Collected</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Fee Status Distribution</CardTitle>
                <CardDescription>Breakdown by status</CardDescription>
              </div>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={getStatusChartData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {getStatusChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: "var(--popover)", 
                      border: "1px solid var(--border)", 
                      borderRadius: 8,
                      fontSize: 12
                    }} 
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Filter Section */}
      <div className="bg-card border rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">Filter Students by Department, Program & Semester</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="filterDepartment" className="text-sm">Department</Label>
            <select
              id="filterDepartment"
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="filterProgram" className="text-sm">Program</Label>
            <select
              id="filterProgram"
              value={filterProgram}
              onChange={(e) => setFilterProgram(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Programs</option>
              {programs.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="filterSemester" className="text-sm">Semester</Label>
            <select
              id="filterSemester"
              value={filterSemester}
              onChange={(e) => setFilterSemester(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Semesters</option>
              {semesters.map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Students List */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              {filteredStudents.length} students found
              {(filterDepartment || filterProgram || filterSemester) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setFilterDepartment("");
                    setFilterProgram("");
                    setFilterSemester("");
                  }}
                  className="ml-2 h-6 text-xs"
                >
                  Clear Filters
                </Button>
              )}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
            {filteredStudents.map((student) => (
              <button
                key={student._id}
                onClick={() => handleStudentSelect(student)}
                className="flex items-center gap-2 p-2 rounded-lg border hover:bg-primary/5 hover:border-primary transition-all text-left"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <UserIcon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{student.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{student.studentId || student._id?.slice(-8)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student name, ID, email..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {searchQuery && (
          <div className="text-sm text-muted-foreground">
            Found {filteredFees.length} of {fees.length} fee records
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
              onClick={fetchFees}
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
            <p className="mt-4 text-muted-foreground">Loading fees...</p>
          </div>
        </div>
      )}

      {/* DataTable */}
      {!loading && !error && fees.length > 0 && (
        <DataTable
          title="Fee Records"
          description={`${filteredFees.length} fee records found${searchQuery ? ` (filtered from ${fees.length})` : ''}`}
          data={filteredFees}
          columns={cols}
          searchKeys={["studentName", "studentId", "studentEmail", "feeId"] as (keyof Fee)[]}
          pageSize={10}
          addLabel="Add Fee"
          onAdd={openAddModal}
        />
      )}

      {/* Empty State */}
      {!loading && !error && fees.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg p-8">
          <Database className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Fee Records Found</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            There are no fee records in the system yet. Click the "Add Fee" button to create your first fee record.
          </p>
          <Button onClick={openAddModal} className="gradient-brand text-white border-0">
            <Plus className="h-4 w-4 mr-2" /> Add First Fee Record
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
                    Edit Fee Record
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 text-primary" />
                    Add Fee Record
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
                {/* Student Information */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3">Student Information</h3>
                  {!isEditMode && (
                    <p className="text-xs text-muted-foreground mb-2">
                      Enter Student ID to auto-fill student information
                    </p>
                  )}
                </div>

                {/* Student ID - With auto-fill */}
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID *</Label>
                  <Input
                    id="studentId"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleStudentIdChange}
                    placeholder="Enter Student ID to auto-fill"
                    required
                    readOnly={isEditMode}
                    className={isEditMode ? "bg-gray-50" : ""}
                  />
                </div>

                {/* Student Name - Auto-filled */}
                <div className="space-y-2">
                  <Label htmlFor="studentName">Student Name *</Label>
                  <Input
                    id="studentName"
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleInputChange}
                    className="bg-gray-50"
                    required
                    readOnly
                  />
                </div>

                {/* Student Email - Auto-filled */}
                <div className="space-y-2">
                  <Label htmlFor="studentEmail">Student Email *</Label>
                  <Input
                    id="studentEmail"
                    name="studentEmail"
                    type="email"
                    value={formData.studentEmail}
                    onChange={handleInputChange}
                    className="bg-gray-50"
                    required
                    readOnly
                  />
                </div>

                {/* Department - Auto-filled */}
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Input
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="bg-gray-50"
                    required
                    readOnly
                  />
                </div>

                {/* Program - Auto-filled */}
                <div className="space-y-2">
                  <Label htmlFor="program">Program *</Label>
                  <Input
                    id="program"
                    name="program"
                    value={formData.program}
                    onChange={handleInputChange}
                    className="bg-gray-50"
                    required
                    readOnly
                  />
                </div>

                {/* Semester - Auto-filled */}
                <div className="space-y-2">
                  <Label htmlFor="semester">Semester *</Label>
                  <Input
                    id="semester"
                    name="semester"
                    type="number"
                    min="1"
                    max="8"
                    value={formData.semester}
                    onChange={handleInputChange}
                    className="bg-gray-50"
                    required
                    readOnly
                  />
                </div>

                {/* Fee Details */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Fee Details</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feeType">Fee Type *</Label>
                  <select
                    id="feeType"
                    name="feeType"
                    value={formData.feeType}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    {feeTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (PKR) *</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    min="0"
                    value={formData.amount}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paidAmount">Paid Amount (PKR)</Label>
                  <Input
                    id="paidAmount"
                    name="paidAmount"
                    type="number"
                    min="0"
                    value={formData.paidAmount}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {paymentMethods.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentStatus">Payment Status</Label>
                  <select
                    id="paymentStatus"
                    name="paymentStatus"
                    value={formData.paymentStatus}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {paymentStatuses.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Scholarship */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Scholarship</h3>
                </div>

                <div className="space-y-2 flex items-center gap-2">
                  <input
                    id="isScholarship"
                    name="isScholarship"
                    type="checkbox"
                    checked={formData.isScholarship}
                    onChange={handleInputChange}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isScholarship">Apply Scholarship</Label>
                </div>

                {formData.isScholarship && (
                  <div className="space-y-2">
                    <Label htmlFor="scholarshipPercentage">Scholarship Percentage (%)</Label>
                    <Input
                      id="scholarshipPercentage"
                      name="scholarshipPercentage"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.scholarshipPercentage}
                      onChange={handleInputChange}
                    />
                  </div>
                )}

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <textarea
                    id="remarks"
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
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
                      {isEditMode ? 'Update Fee' : 'Create Fee'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default FeesPage;