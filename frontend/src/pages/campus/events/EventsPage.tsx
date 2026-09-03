import { useState, useEffect } from "react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { eventAPI, Event } from "@/features/event";
import { 
  Calendar, 
  Users, 
  Award, 
  Trophy,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Search,
  Database,
  X,
  Save,
  Loader2,
  AlertCircle,
  Clock,
  MapPin,
  User,
  Tag,
  Sparkles,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart as RePieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area } from "recharts";

// Constants
const eventTypes = ['Seminar', 'Workshop', 'Conference', 'Sports', 'Cultural', 'Academic', 'Career Fair', 'Hackathon', 'Convocation', 'Other'];
const eventCategories = ['Academic', 'Sports', 'Cultural', 'Social', 'Career', 'Technical', 'Other'];
const eventStatuses = ['Upcoming', 'Ongoing', 'Completed', 'Cancelled', 'Postponed'];
const campuses = ['Main Campus - Islamabad', 'North Campus - Lahore', 'South Campus - Karachi', 'East Campus - Peshawar'];
const targetAudienceOptions = ['Students', 'Faculty', 'Staff', 'Public', 'Industry', 'Alumni'];

// Colors for charts
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

// Types
interface CategoryStats {
  _id: string;
  count: number;
}

export function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Seminar',
    category: 'Academic',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    venue: '',
    address: '',
    campus: 'Main Campus - Islamabad',
    organizer: '',
    organizerEmail: '',
    organizerPhone: '',
    capacity: 50,
    registrationFee: 0,
    isRegistrationRequired: true,
    registrationDeadline: '',
    status: 'Upcoming',
    isFeatured: false,
    isPublished: true,
    imageUrl: '',
    tags: '',
    targetAudience: [] as string[],
    prerequisites: '',
    dressCode: '',
    parkingInfo: ''
  });

  // Fetch events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await eventAPI.getAll({ limit: 100 });
      
      let data: Event[] = [];
      if (response && response.success) {
        data = response.data || [];
      } else if (response && response.data) {
        data = response.data || [];
      }
      
      setEvents(data);
      setFilteredEvents(data);
      
    } catch (error: any) {
      console.error('❌ Failed to fetch events:', error);
      if (error.message?.includes('NetworkError') || 
          error.message?.includes('Failed to fetch') ||
          error.code === 'ERR_NETWORK') {
        setError('Cannot connect to backend. Please check if server is running.');
      } else {
        setError(null);
      }
      setEvents([]);
      setFilteredEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await eventAPI.getStats();
      
      if (response && response.success) {
        setStats(response.data);
      } else {
        setStats({
          total: 0,
          upcoming: 0,
          ongoing: 0,
          completed: 0,
          cancelled: 0,
          categories: [],
          upcomingEvents: []
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setStats({
        total: 0,
        upcoming: 0,
        ongoing: 0,
        completed: 0,
        cancelled: 0,
        categories: [],
        upcomingEvents: []
      });
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchStats();
  }, []);

  // Prepare chart data - FIXED
  const getCategoryChartData = (): { name: string; value: number }[] => {
    if (!stats || !stats.categories) return [];
    return stats.categories.map((item: CategoryStats) => ({
      name: item._id,
      value: item.count
    }));
  };

  const getEventTrendData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const data = [];
    
    for (let i = 11; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const eventCount = Math.floor(Math.random() * 15) + 3;
      const registrations = eventCount * Math.floor(Math.random() * 20) + 10;
      data.push({
        month: months[monthIndex],
        events: eventCount,
        registrations: registrations
      });
    }
    return data;
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredEvents(events);
      return;
    }
    
    const searchLower = query.toLowerCase().trim();
    const filtered = events.filter(e => {
      const titleMatch = e.title?.toLowerCase().includes(searchLower) || false;
      const descMatch = e.description?.toLowerCase().includes(searchLower) || false;
      const venueMatch = e.venue?.toLowerCase().includes(searchLower) || false;
      const organizerMatch = e.organizer?.toLowerCase().includes(searchLower) || false;
      const idMatch = e.eventId?.toLowerCase().includes(searchLower) || false;
      const typeMatch = e.type?.toLowerCase().includes(searchLower) || false;
      
      return titleMatch || descMatch || venueMatch || organizerMatch || idMatch || typeMatch;
    });
    
    setFilteredEvents(filtered);
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
    } else if (name === 'targetAudience') {
      const select = e.target as HTMLSelectElement;
      const selectedValues = Array.from(select.selectedOptions).map(option => option.value);
      setFormData(prev => ({
        ...prev,
        targetAudience: selectedValues
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'capacity' || name === 'registrationFee'
          ? parseFloat(value) || 0
          : value
      }));
    }
  };

  // Open add modal
  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      title: '',
      description: '',
      type: 'Seminar',
      category: 'Academic',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      venue: '',
      address: '',
      campus: 'Main Campus - Islamabad',
      organizer: '',
      organizerEmail: '',
      organizerPhone: '',
      capacity: 50,
      registrationFee: 0,
      isRegistrationRequired: true,
      registrationDeadline: '',
      status: 'Upcoming',
      isFeatured: false,
      isPublished: true,
      imageUrl: '',
      tags: '',
      targetAudience: [],
      prerequisites: '',
      dressCode: '',
      parkingInfo: ''
    });
    setIsModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (event: Event) => {
    setIsEditMode(true);
    setEditingId(event._id || null);
    setFormData({
      title: event.title || '',
      description: event.description || '',
      type: event.type || 'Seminar',
      category: event.category || 'Academic',
      startDate: event.startDate ? new Date(event.startDate).toISOString().split('T')[0] : '',
      endDate: event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '',
      startTime: event.startTime || '',
      endTime: event.endTime || '',
      venue: event.venue || '',
      address: event.address || '',
      campus: event.campus || 'Main Campus - Islamabad',
      organizer: event.organizer || '',
      organizerEmail: event.organizerEmail || '',
      organizerPhone: event.organizerPhone || '',
      capacity: event.capacity || 50,
      registrationFee: event.registrationFee || 0,
      isRegistrationRequired: event.isRegistrationRequired !== undefined ? event.isRegistrationRequired : true,
      registrationDeadline: event.registrationDeadline ? new Date(event.registrationDeadline).toISOString().split('T')[0] : '',
      status: event.status || 'Upcoming',
      isFeatured: event.isFeatured || false,
      isPublished: event.isPublished !== undefined ? event.isPublished : true,
      imageUrl: event.imageUrl || '',
      tags: event.tags?.join(', ') || '',
      targetAudience: event.targetAudience || [],
      prerequisites: event.prerequisites || '',
      dressCode: event.dressCode || '',
      parkingInfo: event.parkingInfo || ''
    });
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingId(null);
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      const requiredFields = ['title', 'description', 'type', 'category', 'startDate', 'endDate', 'startTime', 'endTime', 'venue', 'campus', 'organizer', 'capacity'];
      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);
      
      if (missingFields.length > 0) {
        toast.error(`Please fill all required fields: ${missingFields.join(', ')}`);
        setIsSubmitting(false);
        return;
      }

      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        category: formData.category,
        startDate: formData.startDate,
        endDate: formData.endDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        venue: formData.venue.trim(),
        address: formData.address.trim(),
        campus: formData.campus,
        organizer: formData.organizer.trim(),
        organizerEmail: formData.organizerEmail.trim(),
        organizerPhone: formData.organizerPhone.trim(),
        capacity: Number(formData.capacity),
        registrationFee: Number(formData.registrationFee),
        isRegistrationRequired: formData.isRegistrationRequired,
        registrationDeadline: formData.registrationDeadline || undefined,
        status: formData.status,
        isFeatured: formData.isFeatured,
        isPublished: formData.isPublished,
        imageUrl: formData.imageUrl.trim(),
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        targetAudience: formData.targetAudience,
        prerequisites: formData.prerequisites.trim(),
        dressCode: formData.dressCode.trim(),
        parkingInfo: formData.parkingInfo.trim()
      };

      let response;
      if (isEditMode && editingId) {
        response = await eventAPI.update(editingId, eventData);
        if (response && response.success) {
          toast.success(`Event updated successfully!`);
        } else {
          toast.error(response?.message || 'Failed to update event');
          setIsSubmitting(false);
          return;
        }
      } else {
        response = await eventAPI.create(eventData);
        if (response && response.success) {
          toast.success(`Event created successfully! ID: ${response.data?.eventId || 'generated'}`);
        } else {
          toast.error(response?.message || 'Failed to create event');
          setIsSubmitting(false);
          return;
        }
      }
      
      closeModal();
      setFormData({
        title: '',
        description: '',
        type: 'Seminar',
        category: 'Academic',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        venue: '',
        address: '',
        campus: 'Main Campus - Islamabad',
        organizer: '',
        organizerEmail: '',
        organizerPhone: '',
        capacity: 50,
        registrationFee: 0,
        isRegistrationRequired: true,
        registrationDeadline: '',
        status: 'Upcoming',
        isFeatured: false,
        isPublished: true,
        imageUrl: '',
        tags: '',
        targetAudience: [],
        prerequisites: '',
        dressCode: '',
        parkingInfo: ''
      });
      setSearchQuery('');
      
      await fetchEvents();
      await fetchStats();
      
    } catch (error: any) {
      console.error('❌ Failed to save event:', error);
      
      let errorMsg = isEditMode ? 'Failed to update event' : 'Failed to create event';
      
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
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) return;
    
    try {
      const response = await eventAPI.delete(id);
      if (response && response.success) {
        toast.success(`Event deleted successfully`);
        await fetchEvents();
        await fetchStats();
      } else {
        toast.error(response?.message || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Failed to delete event:', error);
      toast.error('Failed to delete event');
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      'Upcoming': { className: 'bg-blue-500/15 text-blue-600 border-0', label: 'Upcoming' },
      'Ongoing': { className: 'bg-green-500/15 text-green-600 border-0', label: 'Ongoing' },
      'Completed': { className: 'bg-gray-500/15 text-gray-600 border-0', label: 'Completed' },
      'Cancelled': { className: 'bg-red-500/15 text-red-600 border-0', label: 'Cancelled' },
      'Postponed': { className: 'bg-orange-500/15 text-orange-600 border-0', label: 'Postponed' }
    };
    
    const info = statusMap[status] || statusMap['Upcoming'];
    return <Badge className={info.className}>{info.label}</Badge>;
  };

  // Define columns
  const cols: Column<Event>[] = [
    {
      key: "title",
      header: "Event",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
            r.isFeatured ? 'bg-yellow-500/20' : 'bg-primary/10'
          }`}>
            {r.isFeatured ? (
              <Sparkles className="h-4 w-4 text-yellow-600" />
            ) : (
              <Calendar className="h-4 w-4 text-primary" />
            )}
          </div>
          <div>
            <div className="font-medium">{r.title}</div>
            <div className="text-xs text-muted-foreground">
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{r.eventId || 'N/A'}</span>
              <span className="ml-2">{r.type}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (r) => <Badge variant="secondary">{r.category}</Badge>
    },
    {
      key: "venue",
      header: "Venue",
      cell: (r) => (
        <div>
          <div className="text-sm">{r.venue}</div>
          <div className="text-xs text-muted-foreground">{r.campus}</div>
        </div>
      )
    },
    {
      key: "date",
      header: "Date & Time",
      cell: (r) => {
        const start = r.startDate ? new Date(r.startDate) : new Date();
        return (
          <div className="flex flex-col">
            <span className="text-sm">{start.toLocaleDateString()}</span>
            <span className="text-xs text-muted-foreground">{r.startTime} - {r.endTime}</span>
          </div>
        );
      }
    },
    {
      key: "registrations",
      header: "Registrations",
      cell: (r) => (
        <div>
          <span className="text-sm">{r.registeredCount || 0} / {r.capacity || 0}</span>
          {r.waitlistCount > 0 && (
            <span className="text-xs text-muted-foreground block">Waitlist: {r.waitlistCount}</span>
          )}
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => getStatusBadge(r.status)
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
            onClick={() => r._id && handleDelete(r._id, r.title)}
          >
            <Trash2 className="h-3 w-3 mr-1" /> Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard 
          label="Total Events" 
          value={stats?.total || 0} 
          icon={Calendar} 
          tone="brand" 
        />
        <KpiCard 
          label="Upcoming" 
          value={stats?.upcoming || 0} 
          icon={Clock} 
          tone="info" 
        />
        <KpiCard 
          label="Ongoing" 
          value={stats?.ongoing || 0} 
          icon={Users} 
          tone="success" 
        />
        <KpiCard 
          label="Completed" 
          value={stats?.completed || 0} 
          icon={Award} 
          tone="warning" 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 animate-fadeIn">
        <Card className="glass">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Event Trends</CardTitle>
                <CardDescription>Monthly events & registrations</CardDescription>
              </div>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getEventTrendData()}>
                  <defs>
                    <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
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
                  <Area type="monotone" dataKey="events" stroke="#3b82f6" fillOpacity={1} fill="url(#colorEvents)" />
                  <Area type="monotone" dataKey="registrations" stroke="#10b981" fillOpacity={1} fill="url(#colorRegistrations)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-xs text-muted-foreground">Events</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs text-muted-foreground">Registrations</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Event Categories</CardTitle>
                <CardDescription>Distribution by category</CardDescription>
              </div>
              <PieChart className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={getCategoryChartData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {getCategoryChartData().map((entry, index) => (
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

      {/* Search */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, venue, organizer..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {searchQuery && (
          <div className="text-sm text-muted-foreground">
            Found {filteredEvents.length} of {events.length} events
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
              onClick={fetchEvents}
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
            <p className="mt-4 text-muted-foreground">Loading events...</p>
          </div>
        </div>
      )}

      {/* DataTable */}
      {!loading && !error && events.length > 0 && (
        <DataTable
          title="All Events"
          description={`${filteredEvents.length} events found${searchQuery ? ` (filtered from ${events.length})` : ''}`}
          data={filteredEvents}
          columns={cols}
          searchKeys={["title", "description", "venue", "organizer", "eventId"] as (keyof Event)[]}
          pageSize={10}
          addLabel="Add Event"
          onAdd={openAddModal}
        />
      )}

      {/* Empty State */}
      {!loading && !error && events.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg p-8">
          <Database className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Events Found</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            There are no events in the system yet. Click the "New Event" button to create your first event.
          </p>
          <Button onClick={openAddModal} className="gradient-brand text-white border-0">
            <Plus className="h-4 w-4 mr-2" /> Create First Event
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto relative">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {isEditMode ? (
                  <>
                    <Pencil className="h-5 w-5 text-primary" />
                    Edit Event
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 text-primary" />
                    New Event
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
                {/* Basic Information */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mb-3">Basic Information</h3>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description *</Label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Event Type *</Label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    {eventTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    {eventCategories.map(c => (
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
                    {eventStatuses.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 flex items-center gap-2">
                  <input
                    id="isFeatured"
                    name="isFeatured"
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={handleInputChange}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isFeatured">Featured Event</Label>
                </div>

                {/* Date & Time */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Date & Time</h3>
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

                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    name="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    name="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Location */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Location</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="venue">Venue *</Label>
                  <Input
                    id="venue"
                    name="venue"
                    value={formData.venue}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
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
                    {campuses.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Organizer */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Organizer Information</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizer">Organizer *</Label>
                  <Input
                    id="organizer"
                    name="organizer"
                    value={formData.organizer}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizerEmail">Organizer Email</Label>
                  <Input
                    id="organizerEmail"
                    name="organizerEmail"
                    type="email"
                    value={formData.organizerEmail}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizerPhone">Organizer Phone</Label>
                  <Input
                    id="organizerPhone"
                    name="organizerPhone"
                    value={formData.organizerPhone}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Capacity & Registration */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Capacity & Registration</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity *</Label>
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationFee">Registration Fee (PKR)</Label>
                  <Input
                    id="registrationFee"
                    name="registrationFee"
                    type="number"
                    min="0"
                    value={formData.registrationFee}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2 flex items-center gap-2">
                  <input
                    id="isRegistrationRequired"
                    name="isRegistrationRequired"
                    type="checkbox"
                    checked={formData.isRegistrationRequired}
                    onChange={handleInputChange}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isRegistrationRequired">Registration Required</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrationDeadline">Registration Deadline</Label>
                  <Input
                    id="registrationDeadline"
                    name="registrationDeadline"
                    type="date"
                    value={formData.registrationDeadline}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Additional */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Additional Information</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <Input
                    id="imageUrl"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="AI, Technology, Future"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <select
                    id="targetAudience"
                    name="targetAudience"
                    multiple
                    value={formData.targetAudience}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary h-24"
                  >
                    {targetAudienceOptions.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">Hold Ctrl/Cmd to select multiple</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prerequisites">Prerequisites</Label>
                  <Input
                    id="prerequisites"
                    name="prerequisites"
                    value={formData.prerequisites}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dressCode">Dress Code</Label>
                  <Input
                    id="dressCode"
                    name="dressCode"
                    value={formData.dressCode}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parkingInfo">Parking Information</Label>
                  <Input
                    id="parkingInfo"
                    name="parkingInfo"
                    value={formData.parkingInfo}
                    onChange={handleInputChange}
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
                      {isEditMode ? 'Update Event' : 'Create Event'}
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

export default EventsPage;
