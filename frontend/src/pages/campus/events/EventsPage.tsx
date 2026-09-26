import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { eventAPI, Event } from "@/features/event";
import {
  Calendar,
  Users,
  Award,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Search,
  Database,
  AlertCircle,
  Clock,
  Sparkles,
  Activity,
  PieChart,
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

interface CategoryStats {
  _id: string;
  count: number;
}

export default function EventsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<any>(null);

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
      console.error("Failed to fetch events:", error);
      if (
        error.message?.includes("NetworkError") ||
        error.message?.includes("Failed to fetch") ||
        error.code === "ERR_NETWORK"
      ) {
        setError("Cannot connect to backend. Please check if server is running.");
      } else {
        setError(null);
      }
      setEvents([]);
      setFilteredEvents([]);
    } finally {
      setLoading(false);
    }
  };

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
          upcomingEvents: [],
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      setStats({
        total: 0,
        upcoming: 0,
        ongoing: 0,
        completed: 0,
        cancelled: 0,
        categories: [],
        upcomingEvents: [],
      });
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchStats();
  }, []);

  const getCategoryChartData = (): { name: string; value: number }[] => {
    if (!stats || !stats.categories) return [];
    return stats.categories.map((item: CategoryStats) => ({
      name: item._id,
      value: item.count,
    }));
  };

  const getEventTrendData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();
    const data = [];

    for (let i = 11; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const eventCount = Math.floor(Math.random() * 15) + 3;
      const registrations = eventCount * Math.floor(Math.random() * 20) + 10;
      data.push({
        month: months[monthIndex],
        events: eventCount,
        registrations: registrations,
      });
    }
    return data;
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setFilteredEvents(events);
      return;
    }

    const searchLower = query.toLowerCase().trim();
    const filtered = events.filter((e) => {
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

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) return;

    try {
      const response = await eventAPI.delete(id);
      if (response && response.success) {
        toast.success("Event deleted successfully");
        await fetchEvents();
        await fetchStats();
      } else {
        toast.error(response?.message || "Failed to delete event");
      }
    } catch (error) {
      console.error("Failed to delete event:", error);
      toast.error("Failed to delete event");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      Upcoming: { className: "bg-blue-500/15 text-blue-600 border-0", label: "Upcoming" },
      Ongoing: { className: "bg-green-500/15 text-green-600 border-0", label: "Ongoing" },
      Completed: { className: "bg-gray-500/15 text-gray-600 border-0", label: "Completed" },
      Cancelled: { className: "bg-red-500/15 text-red-600 border-0", label: "Cancelled" },
      Postponed: { className: "bg-orange-500/15 text-orange-600 border-0", label: "Postponed" },
    };

    const info = statusMap[status] || statusMap["Upcoming"];
    return <Badge className={info.className}>{info.label}</Badge>;
  };

  const cols: Column<Event>[] = [
    {
      key: "title",
      header: "Event",
      cell: (r) => (
        <div className="flex items-center gap-3">
          <div
            className={`h-9 w-9 rounded-lg flex items-center justify-center ${
              r.isFeatured ? "bg-yellow-500/20" : "bg-primary/10"
            }`}
          >
            {r.isFeatured ? (
              <Sparkles className="h-4 w-4 text-yellow-600" />
            ) : (
              <Calendar className="h-4 w-4 text-primary" />
            )}
          </div>
          <div>
            <div className="font-medium">{r.title}</div>
            <div className="text-xs text-muted-foreground">
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{r.eventId || "N/A"}</span>
              <span className="ml-2">{r.type}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (r) => <Badge variant="secondary">{r.category}</Badge>,
    },
    {
      key: "venue",
      header: "Venue",
      cell: (r) => (
        <div>
          <div className="text-sm">{r.venue}</div>
          <div className="text-xs text-muted-foreground">{r.campus}</div>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date & Time",
      cell: (r) => {
        const start = r.startDate ? new Date(r.startDate) : new Date();
        return (
          <div className="flex flex-col">
            <span className="text-sm">{start.toLocaleDateString()}</span>
            <span className="text-xs text-muted-foreground">
              {r.startTime} - {r.endTime}
            </span>
          </div>
        );
      },
    },
    {
      key: "registrations",
      header: "Registrations",
      cell: (r) => (
        <div>
          <span className="text-sm">
            {r.registeredCount || 0} / {r.capacity || 0}
          </span>
          {r.waitlistCount > 0 && (
            <span className="text-xs text-muted-foreground block">Waitlist: {r.waitlistCount}</span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => getStatusBadge(r.status),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (r) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => r._id && navigate(`/events/edit/${r._id}`)}
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Events" value={stats?.total || 0} icon={Calendar} tone="brand" />
        <KpiCard label="Upcoming" value={stats?.upcoming || 0} icon={Clock} tone="info" />
        <KpiCard label="Ongoing" value={stats?.ongoing || 0} icon={Users} tone="success" />
        <KpiCard label="Completed" value={stats?.completed || 0} icon={Award} tone="warning" />
      </div>

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
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="colorRegistrations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="var(--muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="events"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorEvents)"
                  />
                  <Area
                    type="monotone"
                    dataKey="registrations"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorRegistrations)"
                  />
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
                      fontSize: 12,
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

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Failed to load data</p>
            <p className="text-sm">{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={fetchEvents}>
              <RefreshCw className="h-3 w-3 mr-2" /> Retry
            </Button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading events...</p>
          </div>
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <DataTable
          title="All Events"
          description={`${filteredEvents.length} events found${searchQuery ? ` (filtered from ${events.length})` : ""}`}
          data={filteredEvents}
          columns={cols}
          searchKeys={["title", "description", "venue", "organizer", "eventId"] as (keyof Event)[]}
          pageSize={10}
          addLabel="Add Event"
          onAdd={() => navigate("/events/create")}
        />
      )}

      {!loading && !error && events.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg p-8">
          <Database className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Events Found</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            There are no events in the system yet. Click the "New Event" button to create your first
            event.
          </p>
          <Button
            onClick={() => navigate("/events/create")}
            className="gradient-brand text-white border-0"
          >
            <Plus className="h-4 w-4 mr-2" /> Create First Event
          </Button>
        </div>
      )}
    </>
  );
}
