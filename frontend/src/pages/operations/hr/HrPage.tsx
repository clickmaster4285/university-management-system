// src/routes/app.hr.tsx
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/data-table";
import { 
  Users, 
  Calendar, 
  UserPlus,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  AlertCircle,
  Search,
  UserCheck,
  Clock,
  Check,
  Ban,
  Database,
  RefreshCcw
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { hrAPI, Employee, Leave } from "@/features/hr";

export function HrPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditLeaveMode, setIsEditLeaveMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLeaveId, setEditingLeaveId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'employees' | 'leaves'>('employees');
  const [isUpdatingStatuses, setIsUpdatingStatuses] = useState(false);

  // Employee form state
  const [employeeForm, setEmployeeForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    employmentType: 'Full-time' as 'Full-time' | 'Part-time' | 'Contract' | 'Intern',
    status: 'Active' as 'Active' | 'On Leave' | 'Resigned' | 'Terminated' | 'On Probation',
    salary: 0,
    dateOfBirth: '',
    gender: '' as 'Male' | 'Female' | 'Other' | '',
    address: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    skills: [] as string[],
    performanceRating: 0
  });

  // Leave form state
  const [leaveForm, setLeaveForm] = useState({
    employee: '',
    employeeName: '',
    type: 'Annual' as 'Annual' | 'Sick' | 'Casual' | 'Maternity' | 'Paternity' | 'Unpaid' | 'Other',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const departments = ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Business Administration', 'Economics', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English Literature', 'Psychology', 'Law', 'Medicine', 'Pharmacy', 'Architecture', 'Design', 'Fine Arts', 'Media Studies', 'Data Science'];
  const designations = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Instructor', 'Visiting Faculty', 'Lab Engineer', 'Research Assistant', 'Administrative Officer', 'HR Manager', 'Finance Officer', 'IT Support'];
  const leaveTypes = ['Annual', 'Sick', 'Casual', 'Maternity', 'Paternity', 'Unpaid', 'Other'];

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      
      const [employeesResult, leavesResult, statsResult] = await Promise.allSettled([
        hrAPI.getEmployees(),
        hrAPI.getLeaves(),
        hrAPI.getEmployeeStats()
      ]);

      const employeesRes = employeesResult.status === 'fulfilled' ? employeesResult.value : null;
      const leavesRes = leavesResult.status === 'fulfilled' ? leavesResult.value : null;
      const statsRes = statsResult.status === 'fulfilled' ? statsResult.value : null;

      if (employeesResult.status === 'rejected') {
        console.warn('⚠️ Employees request failed:', employeesResult.reason);
      }

      if (leavesResult.status === 'rejected') {
        console.warn('⚠️ Leaves request failed:', leavesResult.reason);
      }

      if (statsResult.status === 'rejected') {
        console.warn('⚠️ Stats request failed:', statsResult.reason);
      }

      // Handle employees data
      if (employeesRes && employeesRes.success) {
        const employeeData = employeesRes.data || [];
        setEmployees(employeeData);
      } else {
        console.warn('⚠️ No employees data received, starting with empty list');
        setEmployees([]);
      }

      // Handle leaves data
      if (leavesRes && leavesRes.success) {
        const leaveData = leavesRes.data || [];
        setLeaves(leaveData);
      } else {
        console.warn('⚠️ No leaves data received, starting with empty list');
        setLeaves([]);
      }

      // Handle stats (optional)
      if (statsRes && statsRes.success) {
      }

      // If both are empty, show info message
      if ((!employeesRes?.data || employeesRes.data.length === 0) && 
          (!leavesRes?.data || leavesRes.data.length === 0)) {
        toast.info('No data found. Start by adding your first employee!');
      }

    } catch (error: any) {
      console.error('❌ Failed to fetch HR data:', error);
      
      // Don't show error for empty data, just show info
      if (error.response?.status === 404) {
        setEmployees([]);
        setLeaves([]);
        toast.info('No data found. Start by adding your first employee!');
      } else if (error.message?.includes('NetworkError') || error.code === 'ERR_NETWORK') {
        setError('Cannot connect to backend. Please make sure the server is running on http://localhost:4000');
        toast.error('Cannot connect to backend server');
      } else {
        setError(error.message || 'Failed to load HR data');
        toast.error(error.message || 'Failed to load HR data');
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to manually update employee statuses based on leave dates
  const updateEmployeeStatuses = async () => {
    try {
      setIsUpdatingStatuses(true);
      const response = await hrAPI.dailyStatusUpdate();
      if (response.success) {
        toast.success(`Updated ${response.updatedCount || 0} employee statuses`);
        await fetchData(); // Refresh data after update
      } else {
        toast.error(response.message || 'Failed to update statuses');
      }
    } catch (error: any) {
      console.error('Failed to update statuses:', error);
      toast.error(error.message || 'Failed to update employee statuses');
    } finally {
      setIsUpdatingStatuses(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Search handler - searches through ID and all fields
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Filter employees based on search query
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    
    const searchLower = searchQuery.toLowerCase().trim();
    return employees.filter(employee => {
      // Search by employee ID
      const employeeId = (employee.employeeId || '').toLowerCase();
      const mongoId = (employee._id || '').toLowerCase();
      const shortId = mongoId.slice(-8);
      
      // Search by other fields
      const firstName = (employee.firstName || '').toLowerCase();
      const lastName = (employee.lastName || '').toLowerCase();
      const email = (employee.email || '').toLowerCase();
      const department = (employee.department || '').toLowerCase();
      const designation = (employee.designation || '').toLowerCase();
      const status = (employee.status || '').toLowerCase();
      const phone = (employee.phone || '').toLowerCase();
      
      return employeeId.includes(searchLower) ||
             mongoId.includes(searchLower) ||
             shortId.includes(searchLower) ||
             firstName.includes(searchLower) ||
             lastName.includes(searchLower) ||
             email.includes(searchLower) ||
             department.includes(searchLower) ||
             designation.includes(searchLower) ||
             status.includes(searchLower) ||
             phone.includes(searchLower);
    });
  }, [employees, searchQuery]);

  // Filter leaves based on search query
  const filteredLeaves = useMemo(() => {
    if (!searchQuery.trim()) return leaves;
    
    const searchLower = searchQuery.toLowerCase().trim();
    return leaves.filter(leave => {
      const employeeName = (leave.employeeName || '').toLowerCase();
      const type = (leave.type || '').toLowerCase();
      const status = (leave.status || '').toLowerCase();
      const leaveId = (leave.leaveId || '').toLowerCase();
      
      return employeeName.includes(searchLower) ||
             type.includes(searchLower) ||
             status.includes(searchLower) ||
             leaveId.includes(searchLower);
    });
  }, [leaves, searchQuery]);

  // Employee form handlers
  const handleEmployeeInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEmployeeForm(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }));
    } else {
      setEmployeeForm(prev => ({
        ...prev,
        [name]: name === 'salary' || name === 'performanceRating' ? parseFloat(value) || 0 : value
      }));
    }
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const skills = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
    setEmployeeForm(prev => ({ ...prev, skills }));
  };

  // Leave form handlers
  const handleLeaveInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLeaveForm(prev => ({ ...prev, [name]: value }));
  };

  // Open add employee modal
  const openAddEmployee = () => {
    setIsEditMode(false);
    setEditingId(null);
    setEmployeeForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: '',
      designation: '',
      employmentType: 'Full-time',
      status: 'Active',
      salary: 0,
      dateOfBirth: '',
      gender: '',
      address: '',
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      },
      skills: [],
      performanceRating: 0
    });
    setIsEmployeeModalOpen(true);
  };

  // Open edit employee modal
  const openEditEmployee = (employee: Employee) => {
    setIsEditMode(true);
    setEditingId(employee._id || null);
    setEmployeeForm({
      firstName: employee.firstName || '',
      lastName: employee.lastName || '',
      email: employee.email || '',
      phone: employee.phone || '',
      department: employee.department || '',
      designation: employee.designation || '',
      employmentType: employee.employmentType || 'Full-time',
      status: employee.status || 'Active',
      salary: employee.salary || 0,
      dateOfBirth: employee.dateOfBirth || '',
      gender: employee.gender || '',
      address: employee.address || '',
      emergencyContact: employee.emergencyContact || {
        name: '',
        relationship: '',
        phone: ''
      },
      skills: employee.skills || [],
      performanceRating: employee.performanceRating || 0
    });
    setIsEmployeeModalOpen(true);
  };

  // Close employee modal
  const closeEmployeeModal = () => {
    setIsEmployeeModalOpen(false);
    setIsEditMode(false);
    setEditingId(null);
  };

  // Open leave request modal
  const openAddLeave = () => {
    setIsEditLeaveMode(false);
    setEditingLeaveId(null);
    setLeaveForm({
      employee: '',
      employeeName: '',
      type: 'Annual',
      startDate: '',
      endDate: '',
      reason: ''
    });
    setIsLeaveModalOpen(true);
  };

  // Open edit leave modal
  const openEditLeave = (leave: Leave) => {
    setIsEditLeaveMode(true);
    setEditingLeaveId(leave._id || null);
    setLeaveForm({
      employee: leave.employee || '',
      employeeName: leave.employeeName || '',
      type: leave.type || 'Annual',
      startDate: leave.startDate ? new Date(leave.startDate).toISOString().split('T')[0] : '',
      endDate: leave.endDate ? new Date(leave.endDate).toISOString().split('T')[0] : '',
      reason: leave.reason || ''
    });
    setIsLeaveModalOpen(true);
  };

  // Close leave modal
  const closeLeaveModal = () => {
    setIsLeaveModalOpen(false);
    setIsEditLeaveMode(false);
    setEditingLeaveId(null);
  };

  // Handle employee submit
  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const employeeData: Partial<Employee> = {
        firstName: employeeForm.firstName,
        lastName: employeeForm.lastName,
        email: employeeForm.email,
        phone: employeeForm.phone,
        department: employeeForm.department,
        designation: employeeForm.designation,
        employmentType: employeeForm.employmentType,
        status: employeeForm.status,
        salary: employeeForm.salary,
        dateOfBirth: employeeForm.dateOfBirth,
        address: employeeForm.address,
        emergencyContact: employeeForm.emergencyContact,
        skills: employeeForm.skills,
        performanceRating: employeeForm.performanceRating
      };

      if (employeeForm.gender) {
        employeeData.gender = employeeForm.gender as 'Male' | 'Female' | 'Other';
      }

      let response;
      if (isEditMode && editingId) {
        response = await hrAPI.updateEmployee(editingId, employeeData);
        if (response.success) {
          toast.success('Employee updated successfully!');
        }
      } else {
        response = await hrAPI.createEmployee(employeeData);
        if (response.success) {
          toast.success('Employee added successfully!');
        }
      }

      closeEmployeeModal();
      await fetchData();
    } catch (error: any) {
      console.error('Failed to save employee:', error);
      toast.error(error.message || 'Failed to save employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle leave submit (Create or Update)
  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!leaveForm.employee || !leaveForm.employeeName || !leaveForm.startDate || !leaveForm.endDate) {
        toast.error('Please fill all required fields');
        setIsSubmitting(false);
        return;
      }

      // Validate dates
      const start = new Date(leaveForm.startDate);
      const end = new Date(leaveForm.endDate);
      if (end < start) {
        toast.error('End date must be after start date');
        setIsSubmitting(false);
        return;
      }

      const leaveData = {
        employee: leaveForm.employee,
        employeeName: leaveForm.employeeName,
        type: leaveForm.type,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        reason: leaveForm.reason
      };

      let response;
      if (isEditLeaveMode && editingLeaveId) {
        // Update existing leave
        response = await hrAPI.updateLeave(editingLeaveId, leaveData);
        if (response.success) {
          toast.success('Leave request updated successfully!');
        }
      } else {
        // Create new leave
        response = await hrAPI.createLeave({ ...leaveData, status: 'Pending' as const });
        if (response.success) {
          toast.success('Leave request submitted successfully!');
        }
      }

      closeLeaveModal();
      await fetchData();
    } catch (error: any) {
      console.error('❌ Failed to submit leave request:', error);
      toast.error(error.message || 'Failed to submit leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle leave status update
  const handleLeaveStatusUpdate = async (leaveId: string, status: string, employeeName: string) => {
    try {
      const response = await hrAPI.updateLeaveStatus(leaveId, status);
      if (response.success) {
        toast.success(`Leave ${status.toLowerCase()} for ${employeeName}`);
        await fetchData();
      }
    } catch (error: any) {
      console.error('Failed to update leave status:', error);
      toast.error(error.message || 'Failed to update leave status');
    }
  };

  // Handle delete leave
  const handleDeleteLeave = async (id: string, employeeName: string) => {
    if (!confirm(`Are you sure you want to delete leave request for ${employeeName}?`)) return;
    
    try {
      const response = await hrAPI.deleteLeave(id);
      if (response.success) {
        toast.success('Leave request deleted successfully');
        await fetchData();
      }
    } catch (error: any) {
      console.error('Failed to delete leave:', error);
      toast.error(error.message || 'Failed to delete leave');
    }
  };

  // Handle delete employee
  const handleDeleteEmployee = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    
    try {
      const response = await hrAPI.deleteEmployee(id);
      if (response.success) {
        toast.success('Employee deleted successfully');
        await fetchData();
      }
    } catch (error: any) {
      console.error('Failed to delete employee:', error);
      toast.error(error.message || 'Failed to delete employee');
    }
  };

  // Calculate statistics
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'Active').length;
  const onLeave = employees.filter(e => e.status === 'On Leave').length;
  const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;
  const approvedLeaves = leaves.filter(l => l.status === 'Approved').length;

  // Get the data to display based on active tab and search
  const displayEmployees = activeTab === 'employees' ? filteredEmployees : [];
  const displayLeaves = activeTab === 'leaves' ? filteredLeaves : [];
  
  const displayCount = activeTab === 'employees' ? displayEmployees.length : displayLeaves.length;
  const totalCount = activeTab === 'employees' ? employees.length : leaves.length;

  // Employee columns
  const employeeColumns: Column<Employee>[] = [
    {
      key: "name",
      header: "Employee",
      cell: (r) => (
        <div>
          <div className="font-medium">{r.firstName} {r.lastName}</div>
          <div className="text-xs text-muted-foreground">{r.employeeId || 'N/A'} · {r.email}</div>
        </div>
      )
    },
    {
      key: "department",
      header: "Department",
      cell: (r) => <span className="text-sm">{r.department}</span>
    },
    {
      key: "designation",
      header: "Designation",
      cell: (r) => <Badge variant="secondary">{r.designation}</Badge>
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => {
        const statusColors = {
          'Active': 'bg-emerald-500',
          'On Leave': 'bg-amber-500',
          'Resigned': 'bg-rose-500',
          'Terminated': 'bg-red-500',
          'On Probation': 'bg-blue-500'
        };
        
        const statusIcons = {
          'Active': '✅',
          'On Leave': '🌴',
          'Resigned': '📤',
          'Terminated': '⛔',
          'On Probation': '📋'
        };
        
        const isOnLeave = r.status === 'On Leave';
        
        return (
          <Badge className={`${statusColors[r.status as keyof typeof statusColors] || 'bg-gray-500'} text-white ${isOnLeave ? 'animate-pulse' : ''}`}>
            <span className="mr-1">{statusIcons[r.status as keyof typeof statusIcons] || ''}</span>
            {r.status}
          </Badge>
        );
      }
    },
    {
      key: "salary",
      header: "Salary",
      cell: (r) => <span className="font-medium">PKR {r.salary.toLocaleString()}</span>
    },
    {
      key: "actions",
      header: "Actions",
      cell: (r) => (
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => openEditEmployee(r)}
            className="hover:bg-blue-50"
          >
            <Pencil className="h-3 w-3 mr-1" /> Edit
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => r._id && handleDeleteEmployee(r._id, `${r.firstName} ${r.lastName}`)}
          >
            <Trash2 className="h-3 w-3 mr-1" /> Delete
          </Button>
        </div>
      )
    }
  ];

  // Leave columns with actions
  const leaveColumns: Column<Leave>[] = [
    {
      key: "employeeName",
      header: "Employee",
      cell: (r) => (
        <div>
          <div className="font-medium">{r.employeeName}</div>
          <div className="text-xs text-muted-foreground">{r.leaveId || 'N/A'}</div>
        </div>
      )
    },
    {
      key: "type",
      header: "Type",
      cell: (r) => <Badge variant="secondary">{r.type}</Badge>
    },
    {
      key: "dates",
      header: "Dates",
      cell: (r) => (
        <div className="text-sm">
          <div>{new Date(r.startDate).toLocaleDateString()}</div>
          <div className="text-xs text-muted-foreground">to {new Date(r.endDate).toLocaleDateString()}</div>
        </div>
      )
    },
    {
      key: "days",
      header: "Days",
      cell: (r) => <span className="font-medium">{r.days}</span>
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => {
        const statusColors = {
          'Pending': 'bg-amber-500',
          'Approved': 'bg-emerald-500',
          'Rejected': 'bg-rose-500',
          'Cancelled': 'bg-gray-500'
        };
        return (
          <Badge className={`${statusColors[r.status as keyof typeof statusColors] || 'bg-gray-500'} text-white`}>
            {r.status}
          </Badge>
        );
      }
    },
    {
      key: "actions",
      header: "Actions",
      cell: (r) => {
        return (
          <div className="flex gap-1 flex-wrap">
            {r.status === 'Pending' && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                  onClick={() => handleLeaveStatusUpdate(r._id!, 'Approved', r.employeeName)}
                >
                  <Check className="h-3 w-3 mr-1" /> Approve
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  onClick={() => handleLeaveStatusUpdate(r._id!, 'Rejected', r.employeeName)}
                >
                  <Ban className="h-3 w-3 mr-1" /> Reject
                </Button>
              </>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => openEditLeave(r)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              onClick={() => r._id && handleDeleteLeave(r._id, r.employeeName)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        );
      }
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading HR data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg p-8">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h3 className="text-xl font-semibold mb-2">Failed to load data</h3>
        <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">{error}</p>
        <Button onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard 
          label="Total Employees" 
          value={totalEmployees} 
          icon={Users} 
          tone="brand" 
        />
        <KpiCard 
          label="Active" 
          value={activeEmployees} 
          icon={UserCheck} 
          tone="success" 
        />
        <KpiCard 
          label="On Leave" 
          value={onLeave} 
          icon={Calendar} 
          tone="warning" 
        />
        <KpiCard 
          label="Pending Leaves" 
          value={pendingLeaves} 
          icon={Clock} 
          tone="destructive" 
        />
      </div>

      {/* Status Update Info Banner */}
      {employees.length > 0 && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
            <Clock className="h-4 w-4" />
            <span>Employee statuses are automatically updated based on approved leave dates. Click "Update Statuses" to manually sync.</span>
          </div>
          <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700">
            Auto-sync at midnight
          </Badge>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4 border-b">
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === 'employees'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="h-4 w-4 inline mr-2" />
          Employees ({totalEmployees})
        </button>
        <button
          onClick={() => setActiveTab('leaves')}
          className={`px-4 py-2 text-sm font-medium transition-colors relative ${
            activeTab === 'leaves'
              ? 'text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Calendar className="h-4 w-4 inline mr-2" />
          Leave Requests ({leaves.length})
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search by ID, Name, Email, Department... (${activeTab === 'employees' ? employees.length : leaves.length} records)`}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {searchQuery && (
          <div className="text-sm text-muted-foreground">
            Found {displayCount} of {totalCount} {activeTab === 'employees' ? 'employees' : 'leaves'}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleSearch('')}
              className="h-7 px-2 ml-2"
            >
              ✕ Clear
            </Button>
          </div>
        )}
        {employees.length > 0 && activeTab === 'employees' && (
          <div className="text-xs text-muted-foreground ml-auto flex items-center gap-2">
            <span className="font-mono bg-muted px-2 py-0.5 rounded">💡 Try searching by ID (e.g., {employees[0]?.employeeId || employees[0]?._id?.slice(-8).toUpperCase() || 'EMP-XXXX'})</span>
          </div>
        )}
      </div>

      {/* Data Tables */}
      {activeTab === 'employees' && (
        <>
          {displayEmployees.length > 0 ? (
            <DataTable
              title="Employees"
              description={`${displayEmployees.length} employees found${searchQuery ? ` (filtered from ${employees.length})` : ''} · ${onLeave} on leave`}
              data={displayEmployees}
              columns={employeeColumns}
              searchKeys={["firstName", "lastName", "email", "department", "designation"] as (keyof Employee)[]}
              pageSize={10}
              addLabel="Add Employee"
              onAdd={openAddEmployee}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg p-8">
              {searchQuery ? (
                <>
                  <Search className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Employees Found</h3>
                  <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                    No employees match your search: "{searchQuery}"
                  </p>
                  <Button variant="outline" onClick={() => handleSearch('')}>
                    Clear Search
                  </Button>
                </>
              ) : (
                <>
                  <Database className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Employees Found</h3>
                  <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                    Start building your HR database by adding your first employee.
                  </p>
                  <Button onClick={openAddEmployee} className="gradient-brand text-white border-0">
                    <UserPlus className="h-4 w-4 mr-2" /> Add First Employee
                  </Button>
                </>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'leaves' && (
        <>
          {displayLeaves.length > 0 ? (
            <DataTable
              title="Leave Requests"
              description={`${displayLeaves.length} leave requests found${searchQuery ? ` (filtered from ${leaves.length})` : ''} · ${pendingLeaves} pending · ${approvedLeaves} approved`}
              data={displayLeaves}
              columns={leaveColumns}
              searchKeys={["employeeName", "type", "status"] as (keyof Leave)[]}
              pageSize={10}
              addLabel="Request Leave"
              onAdd={openAddLeave}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg p-8">
              {searchQuery ? (
                <>
                  <Search className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Leave Requests Found</h3>
                  <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                    No leave requests match your search: "{searchQuery}"
                  </p>
                  <Button variant="outline" onClick={() => handleSearch('')}>
                    Clear Search
                  </Button>
                </>
              ) : (
                <>
                  <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Leave Requests</h3>
                  <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                    {employees.length > 0 
                      ? 'No leave requests have been submitted yet. Click "Request Leave" to create one.'
                      : 'Add employees first before creating leave requests.'}
                  </p>
                  {employees.length > 0 && (
                    <Button onClick={openAddLeave} variant="outline">
                      <Calendar className="h-4 w-4 mr-2" /> Request Leave
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Employee Modal */}
      {isEmployeeModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEmployeeModal();
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {isEditMode ? 'Edit Employee' : 'Add New Employee'}
              </h2>
              <Button variant="ghost" size="sm" onClick={closeEmployeeModal} className="h-8 w-8 p-0 rounded-full hover:bg-gray-100">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleEmployeeSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={employeeForm.firstName}
                    onChange={handleEmployeeInput}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={employeeForm.lastName}
                    onChange={handleEmployeeInput}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={employeeForm.email}
                    onChange={handleEmployeeInput}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={employeeForm.phone}
                    onChange={handleEmployeeInput}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <select
                    id="department"
                    name="department"
                    value={employeeForm.department}
                    onChange={handleEmployeeInput}
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
                  <Label htmlFor="designation">Designation *</Label>
                  <select
                    id="designation"
                    name="designation"
                    value={employeeForm.designation}
                    onChange={handleEmployeeInput}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select Designation</option>
                    {designations.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employmentType">Employment Type</Label>
                  <select
                    id="employmentType"
                    name="employmentType"
                    value={employeeForm.employmentType}
                    onChange={handleEmployeeInput}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Intern">Intern</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    value={employeeForm.status}
                    onChange={handleEmployeeInput}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="On Probation">On Probation</option>
                    <option value="Resigned">Resigned</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">Salary (PKR)</Label>
                  <Input
                    id="salary"
                    name="salary"
                    type="number"
                    value={employeeForm.salary}
                    onChange={handleEmployeeInput}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={employeeForm.dateOfBirth}
                    onChange={handleEmployeeInput}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    name="gender"
                    value={employeeForm.gender}
                    onChange={handleEmployeeInput}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={employeeForm.address}
                    onChange={handleEmployeeInput}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact.name">Emergency Contact Name</Label>
                  <Input
                    id="emergencyContact.name"
                    name="emergencyContact.name"
                    value={employeeForm.emergencyContact.name}
                    onChange={handleEmployeeInput}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact.relationship">Relationship</Label>
                  <Input
                    id="emergencyContact.relationship"
                    name="emergencyContact.relationship"
                    value={employeeForm.emergencyContact.relationship}
                    onChange={handleEmployeeInput}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact.phone">Emergency Contact Phone</Label>
                  <Input
                    id="emergencyContact.phone"
                    name="emergencyContact.phone"
                    value={employeeForm.emergencyContact.phone}
                    onChange={handleEmployeeInput}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skills">Skills (comma separated)</Label>
                  <Input
                    id="skills"
                    name="skills"
                    value={employeeForm.skills.join(', ')}
                    onChange={handleSkillsChange}
                    placeholder="React, Node.js, Python..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <Button type="button" variant="outline" onClick={closeEmployeeModal}>
                  Cancel
                </Button>
                <Button type="submit" className="gradient-brand text-white border-0" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {isEditMode ? 'Update' : 'Add'} Employee
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Leave Modal */}
      {isLeaveModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeLeaveModal();
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                {isEditLeaveMode ? 'Edit Leave Request' : 'Request Leave'}
              </h2>
              <Button variant="ghost" size="sm" onClick={closeLeaveModal} className="h-8 w-8 p-0 rounded-full hover:bg-gray-100">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleLeaveSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="leaveEmployee">Select Employee *</Label>
                <select
                  id="leaveEmployee"
                  name="employee"
                  value={leaveForm.employee}
                  onChange={handleLeaveInput}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstName} {emp.lastName} - {emp.department}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeName">Employee Name *</Label>
                <Input
                  id="employeeName"
                  name="employeeName"
                  value={leaveForm.employeeName}
                  onChange={handleLeaveInput}
                  placeholder="Enter employee name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="leaveType">Leave Type *</Label>
                <select
                  id="leaveType"
                  name="type"
                  value={leaveForm.type}
                  onChange={handleLeaveInput}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  {leaveTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={leaveForm.startDate}
                    onChange={handleLeaveInput}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={leaveForm.endDate}
                    onChange={handleLeaveInput}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Input
                  id="reason"
                  name="reason"
                  value={leaveForm.reason}
                  onChange={handleLeaveInput}
                  placeholder="Enter reason for leave..."
                />
              </div>

              {/* Leave Days Preview */}
              {leaveForm.startDate && leaveForm.endDate && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Total days: <span className="font-bold text-foreground">
                      {Math.ceil((new Date(leaveForm.endDate).getTime() - new Date(leaveForm.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}
                    </span>
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={closeLeaveModal}>
                  Cancel
                </Button>
                <Button type="submit" className="gradient-brand text-white border-0" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isEditLeaveMode ? 'Updating...' : 'Submitting...'}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {isEditLeaveMode ? 'Update Request' : 'Submit Request'}
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

export default HrPage;
