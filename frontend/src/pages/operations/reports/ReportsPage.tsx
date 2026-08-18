// src/routes/app.reports.tsx
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  BarChart3,
  Users,
  Calendar,
  Wallet,
  BookOpen,
  Building2,
  Bus,
  Award,
  RefreshCw,
  Plus,
  X,
  Loader2,
  AlertCircle,
  Search,
  Eye,
  Trash2,
  TrendingUp,
  TrendingDown,
  PieChart,
  LineChart,
  Activity,
  User,
  Mail,
  GraduationCap,
  UserCheck,
  Clock
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { reportAPI, Report, ReportCategory } from "@/lib/api/reports";


const categoryIcons: Record<string, any> = {
  'Student': Users,
  'Teacher': Users,
  'Admission': FileText,
  'Attendance': Calendar,
  'Finance': Wallet,
  'HR': Users,
  'Library': BookOpen,
  'Hostel': Building2,
  'Transport': Bus,
  'Exam': Award
};

// Color palette for charts
const COLORS = ['#8B5CF6', '#EC4899', '#06B6D4', '#F59E0B', '#10B981', '#EF4444', '#6366F1', '#F97316'];

export function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [categories, setCategories] = useState<ReportCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [reportName, setReportName] = useState<string>("");
  const [reportType, setReportType] = useState<'PDF' | 'CSV' | 'Excel' | 'JSON'>('PDF');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [activeTab, setActiveTab] = useState<'overview' | 'list'>('overview');

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const [reportsRes, categoriesRes] = await Promise.all([
        reportAPI.getAll(),
        reportAPI.getCategories()
      ]);

      if (reportsRes.success) {
        setReports(reportsRes.data || []);
      }
      if (categoriesRes.success) {
        setCategories(categoriesRes.data || []);
      }
      
    } catch (error: any) {
      console.error('❌ Failed to fetch reports:', error);
      setError(error.message || 'Failed to load reports');
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = (query: string): void => {
    setSearchQuery(query);
  };

  const filteredReports = reports.filter((report: Report) => {
    const searchLower = searchQuery.toLowerCase();
    return report.name.toLowerCase().includes(searchLower) ||
           report.category.toLowerCase().includes(searchLower) ||
           (report.tags || []).some((tag: string) => tag.toLowerCase().includes(searchLower));
  });

  const handleGenerateReport = async (): Promise<void> => {
    if (!reportName || !selectedCategory) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await reportAPI.generate({
        name: reportName,
        category: selectedCategory,
        type: reportType,
        parameters: dateRange
      });

      if (response.success) {
        toast.success('Report generated successfully!');
        setIsModalOpen(false);
        setReportName('');
        setSelectedCategory('');
        setDateRange({ start: '', end: '' });
        await fetchData();
      }
    } catch (error: any) {
      console.error('Failed to generate report:', error);
      toast.error(error.message || 'Failed to generate report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = async (reportId: string, name: string): Promise<void> => {
    try {
      const blob = await reportAPI.exportCSV(reportId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name.replace(/\s+/g, '_')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Report exported as CSV`);
    } catch (error: any) {
      console.error('Export failed:', error);
      toast.error(error.message || 'Failed to export report');
    }
  };

  const handleView = (report: Report): void => {
    setSelectedReport(report);
    setIsViewModalOpen(true);
  };

  const handleDelete = async (id: string, name: string): Promise<void> => {
    if (!confirm(`Are you sure you want to archive "${name}"?`)) return;
    
    try {
      const response = await reportAPI.delete(id);
      if (response.success) {
        toast.success('Report archived successfully');
        await fetchData();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete report');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      'Completed': { className: 'bg-emerald-500/15 text-emerald-600', label: 'Completed' },
      'Processing': { className: 'bg-blue-500/15 text-blue-600', label: 'Processing' },
      'Pending': { className: 'bg-amber-500/15 text-amber-600', label: 'Pending' },
      'Failed': { className: 'bg-rose-500/15 text-rose-600', label: 'Failed' }
    };
    const info = statusMap[status] || statusMap['Pending'];
    return <Badge className={info.className}>{info.label}</Badge>;
  };

  // ✅ FIXED: Helper to get the best available display name with proper typing
  const getDisplayName = (item: any): string => {
    if (!item) return 'N/A';

    const candidateNames = [
      item.name,
      item.fullName,
      item.studentName,
      item.student?.name,
      item.student?.fullName,
      item.firstName && item.lastName ? `${item.firstName} ${item.lastName}` : item.firstName || item.lastName,
      item.displayName,
      item.label,
    ];

    for (const value of candidateNames) {
      if (typeof value === 'string' && value.trim()) {
        const normalized = value.trim();
        if (normalized !== 'N/A' && normalized !== 'undefined undefined' && normalized !== 'undefined') {
          return normalized;
        }
      }
    }

    // Fallback: derive a readable name from the email local-part if available
    if (item.email && typeof item.email === 'string') {
      const local = item.email.split('@')[0] || '';
      if (local) {
        // ✅ FIXED: Added proper type annotation for the parameter 'w'
        const pretty = local
          .replace(/[._\-]+/g, ' ')
          .split(' ')
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        if (pretty && pretty !== '') return pretty;
      }
    }

    return 'N/A';
  };

  // Get category distribution for chart
  const getCategoryDistribution = () => {
    const distribution: Record<string, number> = {};
    reports.forEach(r => {
      distribution[r.category] = (distribution[r.category] || 0) + 1;
    });
    return distribution;
  };

  // Get status distribution for chart
  const getStatusDistribution = () => {
    const distribution: Record<string, number> = {};
    reports.forEach(r => {
      distribution[r.status || 'Pending'] = (distribution[r.status || 'Pending'] || 0) + 1;
    });
    return distribution;
  };

  const categoryData = getCategoryDistribution();
  const statusData = getStatusDistribution();
  const totalReports = reports.length;

  // Helper to render report data in view modal
  const renderReportData = () => {
    if (!selectedReport || !selectedReport.data) {
      return <p className="text-muted-foreground">No data available for this report.</p>;
    }

    const data = selectedReport.data;
    const summary = data.summary || {};

    return (
      <div className="space-y-4">
        {/* Summary Section */}
        {Object.keys(summary).length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(summary).map(([key, value]) => (
              <div key={key} className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                <p className="text-lg font-bold">{String(value)}</p>
              </div>
            ))}
          </div>
        )}

        {/* Student Table - Uses getDisplayName */}
        {data.students && data.students.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Student List</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Department</th>
                    <th className="text-left p-2">Program</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.students.slice(0, 10).map((student: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 font-medium">{getDisplayName(student)}</td>
                      <td className="p-2">{student.email || 'N/A'}</td>
                      <td className="p-2">{student.department || 'N/A'}</td>
                      <td className="p-2">{student.program || 'N/A'}</td>
                      <td className="p-2">
                        <Badge variant={student.status === 'Active' ? 'default' : 'outline'}>
                          {student.status || 'N/A'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.students.length > 10 && (
                <p className="text-xs text-muted-foreground mt-2">Showing 10 of {data.students.length} students</p>
              )}
            </div>
          </div>
        )}

        {/* Teacher Table */}
        {data.teachers && data.teachers.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Teacher List</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Department</th>
                    <th className="text-left p-2">Designation</th>
                    <th className="text-left p-2">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {data.teachers.slice(0, 10).map((teacher: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 font-medium">{getDisplayName(teacher)}</td>
                      <td className="p-2">{teacher.email || 'N/A'}</td>
                      <td className="p-2">{teacher.department || 'N/A'}</td>
                      <td className="p-2">{teacher.designation || 'N/A'}</td>
                      <td className="p-2">
                        <Badge variant={teacher.rating >= 4 ? 'default' : 'outline'}>
                          {teacher.rating || 'N/A'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.teachers.length > 10 && (
                <p className="text-xs text-muted-foreground mt-2">Showing 10 of {data.teachers.length} teachers</p>
              )}
            </div>
          </div>
        )}

        {/* Admissions Table */}
        {data.admissions && data.admissions.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Admissions List</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Program</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Application Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.admissions.slice(0, 10).map((admission: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 font-medium">{admission.name || 'N/A'}</td>
                      <td className="p-2">{admission.email || 'N/A'}</td>
                      <td className="p-2">{admission.program || 'N/A'}</td>
                      <td className="p-2">
                        <Badge variant={admission.status === 'Accepted' || admission.status === 'Enrolled' ? 'default' : 'outline'}>
                          {admission.status || 'N/A'}
                        </Badge>
                      </td>
                      <td className="p-2">{admission.applicationDate ? new Date(admission.applicationDate).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.admissions.length > 10 && (
                <p className="text-xs text-muted-foreground mt-2">Showing 10 of {data.admissions.length} admissions</p>
              )}
            </div>
          </div>
        )}

        {/* Fee Records Table */}
        {data.fees && data.fees.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Fee Records</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Student</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Amount</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.fees.slice(0, 10).map((fee: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 font-medium">{fee.student || 'N/A'}</td>
                      <td className="p-2">{fee.type || 'N/A'}</td>
                      <td className="p-2">PKR {(fee.amount || 0).toLocaleString()}</td>
                      <td className="p-2">
                        <Badge variant={fee.status === 'Paid' ? 'default' : 'outline'}>
                          {fee.status || 'N/A'}
                        </Badge>
                      </td>
                      <td className="p-2">{fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.fees.length > 10 && (
                <p className="text-xs text-muted-foreground mt-2">Showing 10 of {data.fees.length} fee records</p>
              )}
            </div>
          </div>
        )}

        {/* HR/Employees Table */}
        {data.employees && data.employees.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Employee List</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Department</th>
                    <th className="text-left p-2">Designation</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {data.employees.slice(0, 10).map((employee: any, index: number) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 font-medium">{getDisplayName(employee)}</td>
                      <td className="p-2">{employee.department || 'N/A'}</td>
                      <td className="p-2">{employee.designation || 'N/A'}</td>
                      <td className="p-2">
                        <Badge variant={employee.status === 'Active' ? 'default' : 'outline'}>
                          {employee.status || 'N/A'}
                        </Badge>
                      </td>
                      <td className="p-2">PKR {(employee.salary || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.employees.length > 10 && (
                <p className="text-xs text-muted-foreground mt-2">Showing 10 of {data.employees.length} employees</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <AppShell title="Reports" subtitle="Loading reports...">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading reports...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Reports" subtitle="Error loading data">
        <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg p-8">
          <AlertCircle className="h-16 w-16 text-destructive mb-4" />
          <h3 className="text-xl font-semibold mb-2">Failed to load data</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">{error}</p>
          <Button onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" /> Retry
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell 
      title="Reports" 
      subtitle={`${reports.length} reports available · Generate, print, and export any operational report`}
      actions={
        <>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="gradient-brand text-white border-0"
          >
            <Plus className="h-4 w-4 mr-2" /> Generate Report
          </Button>
          <Button 
            variant="outline" 
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </>
      }
    >
      {/* ====== VISUAL GRAPHICS SECTION ====== */}
      {reports.length > 0 && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Reports Card */}
          <Card className="glass bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-200/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Reports</p>
                  <p className="text-3xl font-bold">{totalReports}</p>
                  <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3" />
                    {totalReports > 0 ? `${Math.round((totalReports / 10) * 100)}% growth` : 'No reports yet'}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Distribution - Animated Donut */}
          <Card className="glass col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">By Category</p>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                  <svg viewBox="0 0 100 100" className="w-20 h-20 -rotate-90">
                    {Object.entries(categoryData).map(([category, count], index) => {
                      const percentage = (count / totalReports) * 100;
                      const startAngle = Object.values(categoryData)
                        .slice(0, index)
                        .reduce((acc, val) => acc + (val / totalReports) * 100, 0);
                      const endAngle = startAngle + percentage;
                      
                      const startRad = (startAngle / 100) * 2 * Math.PI;
                      const endRad = (endAngle / 100) * 2 * Math.PI;
                      
                      const x1 = 50 + 40 * Math.cos(startRad);
                      const y1 = 50 + 40 * Math.sin(startRad);
                      const x2 = 50 + 40 * Math.cos(endRad);
                      const y2 = 50 + 40 * Math.sin(endRad);
                      
                      const largeArc = percentage > 50 ? 1 : 0;
                      
                      return (
                        <path
                          key={category}
                          d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                          fill={COLORS[index % COLORS.length]}
                          className="transition-all duration-500 hover:opacity-80"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        />
                      );
                    })}
                    <circle cx="50" cy="50" r="25" fill="white" />
                  </svg>
                </div>
                <div className="flex-1 space-y-1">
                  {Object.entries(categoryData).slice(0, 3).map(([category, count], index) => (
                    <div key={category} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        {category}
                      </span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                  {Object.keys(categoryData).length > 3 && (
                    <p className="text-[10px] text-muted-foreground">+{Object.keys(categoryData).length - 3} more</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Distribution - Horizontal Bars */}
          <Card className="glass col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">By Status</p>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                {Object.entries(statusData).map(([status, count], index) => {
                  const percentage = (count / totalReports) * 100;
                  const colors: Record<string, string> = {
                    'Completed': 'bg-emerald-500',
                    'Processing': 'bg-blue-500',
                    'Pending': 'bg-amber-500',
                    'Failed': 'bg-rose-500'
                  };
                  return (
                    <div key={status} className="space-y-0.5">
                      <div className="flex justify-between text-xs">
                        <span>{status}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${colors[status] || 'bg-gray-500'} rounded-full transition-all duration-1000`}
                          style={{ 
                            width: `${Math.max(percentage, 3)}%`,
                            animation: `barGrow 0.8s ease-out ${index * 0.1}s both`
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports by name, category, or tag..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {searchQuery && (
          <div className="text-sm text-muted-foreground">
            Found {filteredReports.length} reports
          </div>
        )}
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReports.length > 0 ? (
          filteredReports.map((report: Report) => {
            const Icon = categoryIcons[report.category] || FileText;
            const generatedDate = report.generatedAt ? new Date(report.generatedAt) : new Date();
            
            return (
              <Card key={report._id} className="glass card-hover">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {report.type || 'PDF'}
                      </Badge>
                      {getStatusBadge(report.status || 'Pending')}
                    </div>
                  </div>
                  <CardTitle className="mt-3 text-base">{report.name}</CardTitle>
                  <CardDescription>
                    {report.category} · {generatedDate.toLocaleDateString()} · {report.data?.summary?.total || 0} records
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {(report.tags || []).slice(0, 3).map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        if (report._id) {
                          handleExport(report._id, report.name);
                        }
                      }}
                    >
                      <Download className="h-3.5 w-3.5 mr-1" /> CSV
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleView(report)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" /> View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => report._id && handleDelete(report._id, report.name)}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg p-8">
            <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Reports Found</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
              {searchQuery ? 'No reports match your search criteria.' : 'Generate your first report to get started.'}
            </p>
            <Button onClick={() => setIsModalOpen(true)} className="gradient-brand text-white border-0">
              <Plus className="h-4 w-4 mr-2" /> Generate Report
            </Button>
          </div>
        )}
      </div>

      {/* Generate Report Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Generate Report
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)} className="h-8 w-8 p-0 rounded-full hover:bg-gray-100">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reportName">Report Name *</Label>
                <Input
                  id="reportName"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  placeholder="Enter report name..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reportCategory">Category *</Label>
                <select
                  id="reportCategory"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat: ReportCategory) => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reportType">Report Type</Label>
                <select
                  id="reportType"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="PDF">PDF</option>
                  <option value="CSV">CSV</option>
                  <option value="Excel">Excel</option>
                  <option value="JSON">JSON</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="gradient-brand text-white border-0" 
                  onClick={handleGenerateReport}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Report Modal */}
      {isViewModalOpen && selectedReport && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsViewModalOpen(false);
              setSelectedReport(null);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedReport.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedReport.category} · Generated on {new Date(selectedReport.generatedAt || '').toLocaleString()}
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedReport(null);
                }} 
                className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6">
              {selectedReport.status === 'Completed' ? (
                renderReportData()
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                  <p className="text-muted-foreground">Report is being generated...</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedReport(null);
                }}
              >
                Close
              </Button>
              {selectedReport._id && (
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (selectedReport._id) {
                      handleExport(selectedReport._id, selectedReport.name);
                    }
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes barGrow {
          from { width: 0%; opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .card-hover {
          transition: all 0.3s ease;
        }
        
        .card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
        }
      `}</style>
    </AppShell>
  );
}

export default ReportsPage;
