import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { transportAPI, Bus, Driver, Route as TransportRoute } from "@/features/transport";
import {
  Bus as BusIcon,
  Users,
  MapPin,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Search,
  Database,
  AlertCircle,
  Truck,
  User,
  Route as RouteIcon,
  Gauge,
  CircleDot,
} from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";
import {
  getTransportStatusBadge,
  TRANSPORT_CHART_COLORS,
  type TransportTab,
} from "./transportUtils";

const isTransportTab = (value: string | null): value is TransportTab =>
  value === "buses" || value === "drivers" || value === "routes";

const createPaths: Record<TransportTab, string> = {
  buses: "/transport/buses/create",
  drivers: "/transport/drivers/create",
  routes: "/transport/routes/create",
};

const editPaths: Record<TransportTab, (id: string) => string> = {
  buses: (id) => `/transport/buses/edit/${id}`,
  drivers: (id) => `/transport/drivers/edit/${id}`,
  routes: (id) => `/transport/routes/edit/${id}`,
};

const entityLabels: Record<TransportTab, { singular: string; deleteSuccess: string }> = {
  buses: { singular: "bus", deleteSuccess: "Bus deleted successfully" },
  drivers: { singular: "driver", deleteSuccess: "Driver deleted successfully" },
  routes: { singular: "route", deleteSuccess: "Route deleted successfully" },
};

export default function TransportPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [buses, setBuses] = useState<Bus[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<any>(null);

  const tabFromUrl = searchParams.get("tab");
  const tabFromState = (location.state as { tab?: TransportTab } | null)?.tab;
  const activeTab: TransportTab = isTransportTab(tabFromUrl)
    ? tabFromUrl
    : tabFromState || "buses";

  useEffect(() => {
    if (tabFromState && tabFromState !== tabFromUrl) {
      setSearchParams({ tab: tabFromState }, { replace: true });
    }
  }, [tabFromState, tabFromUrl, setSearchParams]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [busesRes, driversRes, routesRes, statsRes] = await Promise.all([
        transportAPI.getBuses({ limit: 100 }),
        transportAPI.getDrivers({ limit: 100 }),
        transportAPI.getRoutes({ limit: 100 }),
        transportAPI.getStats(),
      ]);

      setBuses(busesRes?.success ? busesRes.data || [] : []);
      setDrivers(driversRes?.success ? driversRes.data || [] : []);
      setRoutes(routesRes?.success ? routesRes.data || [] : []);

      if (statsRes?.success) {
        setStats(statsRes.data);
      }
    } catch (error: unknown) {
      console.error("Failed to fetch transport data:", error);
      const message = (error as Error).message || "";
      if (message.includes("NetworkError") || message.includes("Failed to fetch")) {
        setError("Cannot connect to backend. Please check if server is running.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getFilteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      if (activeTab === "buses") return buses;
      if (activeTab === "drivers") return drivers;
      return routes;
    }

    const searchLower = searchQuery.toLowerCase().trim();

    if (activeTab === "buses") {
      return buses.filter((b) => {
        const busId = (b.busId || "").toLowerCase();
        const busNumber = (b.busNumber || "").toLowerCase();
        const registrationNumber = (b.registrationNumber || "").toLowerCase();
        const model = (b.model || "").toLowerCase();
        const make = (b.make || "").toLowerCase();
        const driverName = (b.driverName || "").toLowerCase();
        const routeName = (b.routeName || "").toLowerCase();
        const status = (b.status || "").toLowerCase();

        return (
          busId.includes(searchLower) ||
          busNumber.includes(searchLower) ||
          registrationNumber.includes(searchLower) ||
          model.includes(searchLower) ||
          make.includes(searchLower) ||
          driverName.includes(searchLower) ||
          routeName.includes(searchLower) ||
          status.includes(searchLower)
        );
      });
    }

    if (activeTab === "drivers") {
      return drivers.filter((d) => {
        const driverId = (d.driverId || "").toLowerCase();
        const name = (d.name || "").toLowerCase();
        const email = (d.email || "").toLowerCase();
        const phone = (d.phone || "").toLowerCase();
        const licenseNumber = (d.licenseNumber || "").toLowerCase();
        const assignedBusNumber = (d.assignedBusNumber || "").toLowerCase();
        const status = (d.status || "").toLowerCase();

        return (
          driverId.includes(searchLower) ||
          name.includes(searchLower) ||
          email.includes(searchLower) ||
          phone.includes(searchLower) ||
          licenseNumber.includes(searchLower) ||
          assignedBusNumber.includes(searchLower) ||
          status.includes(searchLower)
        );
      });
    }

    return routes.filter((r) => {
      const routeId = (r.routeId || "").toLowerCase();
      const routeNumber = (r.routeNumber || "").toLowerCase();
      const name = (r.name || "").toLowerCase();
      const startPoint = (r.startPoint || "").toLowerCase();
      const endPoint = (r.endPoint || "").toLowerCase();
      const status = (r.status || "").toLowerCase();

      return (
        routeId.includes(searchLower) ||
        routeNumber.includes(searchLower) ||
        name.includes(searchLower) ||
        startPoint.includes(searchLower) ||
        endPoint.includes(searchLower) ||
        status.includes(searchLower)
      );
    });
  }, [searchQuery, activeTab, buses, drivers, routes]);

  const getStatusChartData = () => {
    if (!stats) return [];
    const busData = stats.buses || {};
    return [
      { name: "Active", value: busData.active || 0 },
      { name: "On Route", value: busData.onRoute || 0 },
      { name: "Maintenance", value: busData.maintenance || 0 },
    ];
  };

  const getDriverStatusData = () => {
    if (!stats) return [];
    const driverData = stats.drivers || {};
    return [
      { name: "Available", value: driverData.available || 0 },
      { name: "On Route", value: driverData.onRoute || 0 },
      {
        name: "Off Duty",
        value: (driverData.total || 0) - (driverData.available || 0) - (driverData.onRoute || 0),
      },
    ];
  };

  const getRoutePerformanceData = () => {
    return routes.slice(0, 6).map((r) => ({
      name: r.routeNumber || "R-000",
      distance: Math.floor(Math.random() * 30) + 5,
      duration: Math.floor(Math.random() * 60) + 20,
      riders: Math.floor(Math.random() * 80) + 20,
    }));
  };

  const handleTabChange = (tab: TransportTab) => {
    setSearchParams(tab === "buses" ? {} : { tab }, { replace: true });
    setSearchQuery("");
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;

    try {
      let response;
      if (activeTab === "buses") {
        response = await transportAPI.deleteBus(id);
      } else if (activeTab === "drivers") {
        response = await transportAPI.deleteDriver(id);
      } else {
        response = await transportAPI.deleteRoute(id);
      }

      if (response?.success) {
        toast.success(entityLabels[activeTab].deleteSuccess);
        await fetchData();
        setSearchQuery("");
      } else {
        toast.error(response?.message || "Failed to delete");
      }
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("Failed to delete");
    }
  };

  const getColumns = (): Column<any>[] => {
    if (activeTab === "buses") {
      return [
        {
          key: "busNumber",
          header: "Bus",
          cell: (r) => (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Truck className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="font-medium">{r.busNumber}</div>
                <div className="text-xs text-muted-foreground">
                  <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{r.busId || "N/A"}</span>
                  <span className="ml-2">{r.registrationNumber}</span>
                </div>
              </div>
            </div>
          ),
        },
        {
          key: "model",
          header: "Model",
          cell: (r) => (
            <span>
              {r.make} {r.model} ({r.year})
            </span>
          ),
        },
        {
          key: "capacity",
          header: "Capacity",
          cell: (r) => <span>{r.capacity} seats</span>,
        },
        {
          key: "driverName",
          header: "Driver",
          cell: (r) => <span>{r.driverName || "—"}</span>,
        },
        {
          key: "routeName",
          header: "Route",
          cell: (r) => <span>{r.routeName || "—"}</span>,
        },
        {
          key: "fuelLevel",
          header: "Fuel",
          cell: (r) => {
            const level = r.fuelLevel || 0;
            const color = level > 70 ? "text-green-600" : level > 30 ? "text-yellow-600" : "text-red-600";
            return <span className={`font-medium ${color}`}>{level}%</span>;
          },
        },
        {
          key: "status",
          header: "Status",
          cell: (r) => getTransportStatusBadge(r.status),
        },
        {
          key: "actions",
          header: "Actions",
          cell: (r) => (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => r._id && navigate(editPaths.buses(r._id))}
                className="hover:bg-blue-50"
              >
                <Pencil className="h-3 w-3 mr-1" /> Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={() => r._id && handleDelete(r._id, r.busNumber)}>
                <Trash2 className="h-3 w-3 mr-1" /> Delete
              </Button>
            </div>
          ),
        },
      ];
    }

    if (activeTab === "drivers") {
      return [
        {
          key: "name",
          header: "Driver",
          cell: (r) => (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-muted-foreground">
                  <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{r.driverId || "N/A"}</span>
                  <span className="ml-2">{r.email}</span>
                </div>
              </div>
            </div>
          ),
        },
        {
          key: "phone",
          header: "Phone",
          cell: (r) => <span>{r.phone}</span>,
        },
        {
          key: "licenseNumber",
          header: "License",
          cell: (r) => (
            <div>
              <span>{r.licenseNumber}</span>
              <span className="text-xs text-muted-foreground block">Class {r.licenseClass}</span>
            </div>
          ),
        },
        {
          key: "assignedBusNumber",
          header: "Assigned Bus",
          cell: (r) => <span>{r.assignedBusNumber || "—"}</span>,
        },
        {
          key: "experienceYears",
          header: "Experience",
          cell: (r) => <span>{r.experienceYears || 0} years</span>,
        },
        {
          key: "status",
          header: "Status",
          cell: (r) => getTransportStatusBadge(r.status),
        },
        {
          key: "actions",
          header: "Actions",
          cell: (r) => (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => r._id && navigate(editPaths.drivers(r._id))}
                className="hover:bg-blue-50"
              >
                <Pencil className="h-3 w-3 mr-1" /> Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={() => r._id && handleDelete(r._id, r.name)}>
                <Trash2 className="h-3 w-3 mr-1" /> Delete
              </Button>
            </div>
          ),
        },
      ];
    }

    return [
      {
        key: "routeNumber",
        header: "Route",
        cell: (r) => (
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <RouteIcon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-medium">{r.routeNumber}</div>
              <div className="text-xs text-muted-foreground">
                <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{r.routeId || "N/A"}</span>
                <span className="ml-2">{r.name}</span>
              </div>
            </div>
          </div>
        ),
      },
      {
        key: "startEnd",
        header: "From → To",
        cell: (r) => (
          <span>
            {r.startPoint} → {r.endPoint}
          </span>
        ),
      },
      {
        key: "distance",
        header: "Distance",
        cell: (r) => <span>{r.distance} km</span>,
      },
      {
        key: "duration",
        header: "Duration",
        cell: (r) => <span>{r.duration} min</span>,
      },
      {
        key: "fare",
        header: "Fare",
        cell: (r) => <span>PKR {r.baseFare}</span>,
      },
      {
        key: "status",
        header: "Status",
        cell: (r) => getTransportStatusBadge(r.status),
      },
      {
        key: "actions",
        header: "Actions",
        cell: (r) => (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => r._id && navigate(editPaths.routes(r._id))}
              className="hover:bg-blue-50"
            >
              <Pencil className="h-3 w-3 mr-1" /> Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={() => r._id && handleDelete(r._id, r.routeNumber)}>
              <Trash2 className="h-3 w-3 mr-1" /> Delete
            </Button>
          </div>
        ),
      },
    ];
  };

  const currentData = getFilteredData;
  const totalItems = activeTab === "buses" ? buses.length : activeTab === "drivers" ? drivers.length : routes.length;
  const displayCount = currentData.length;
  const singularLabel = entityLabels[activeTab].singular;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Buses" value={stats?.buses?.total || 0} icon={BusIcon} tone="brand" />
        <KpiCard label="Active Routes" value={stats?.routes?.active || 0} icon={MapPin} tone="info" />
        <KpiCard label="Total Drivers" value={stats?.drivers?.total || 0} icon={Users} tone="success" />
        <KpiCard label="Daily Riders" value={stats?.riders || 0} icon={Users} tone="warning" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card className="glass">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Bus Status</CardTitle>
                <CardDescription>Current fleet distribution</CardDescription>
              </div>
              <CircleDot className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={getStatusChartData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {getStatusChartData().map((_, index) => (
                      <Cell key={`cell-${index}`} fill={TRANSPORT_CHART_COLORS[index % TRANSPORT_CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Driver Status</CardTitle>
                <CardDescription>Driver availability</CardDescription>
              </div>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={getDriverStatusData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={55}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {getDriverStatusData().map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={TRANSPORT_CHART_COLORS[(index + 2) % TRANSPORT_CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 11,
                    }}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium">Route Performance</CardTitle>
                <CardDescription>Distance & duration metrics</CardDescription>
              </div>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[140px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={getRoutePerformanceData()}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="name" fontSize={8} tick={{ fill: "var(--muted-foreground)" }} />
                  <PolarRadiusAxis fontSize={8} tick={{ fill: "var(--muted-foreground)" }} />
                  <Radar name="Distance (km)" dataKey="distance" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  <Radar name="Duration (min)" dataKey="duration" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  <Legend wrapperStyle={{ fontSize: 9, paddingTop: 4 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex border-b mb-4">
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "buses"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => handleTabChange("buses")}
        >
          <BusIcon className="h-4 w-4 inline mr-2" /> Buses ({buses.length})
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "drivers"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => handleTabChange("drivers")}
        >
          <User className="h-4 w-4 inline mr-2" /> Drivers ({drivers.length})
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "routes"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => handleTabChange("routes")}
        >
          <RouteIcon className="h-4 w-4 inline mr-2" /> Routes ({routes.length})
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search by ID, Name, Number... (${totalItems} records)`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {searchQuery && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            Found {displayCount} of {totalItems} {activeTab}
            <Button variant="ghost" size="sm" onClick={() => setSearchQuery("")} className="h-7 px-2">
              ✕ Clear
            </Button>
          </div>
        )}
        {totalItems > 0 && (
          <div className="text-xs text-muted-foreground ml-auto flex items-center gap-2">
            <span className="font-mono bg-muted px-2 py-0.5 rounded">
              💡 Try searching by ID (e.g.,{" "}
              {activeTab === "buses"
                ? buses[0]?.busId || buses[0]?._id?.slice(-8).toUpperCase() || "BUS-XXXX"
                : activeTab === "drivers"
                  ? drivers[0]?.driverId || drivers[0]?._id?.slice(-8).toUpperCase() || "DRV-XXXX"
                  : routes[0]?.routeId || routes[0]?._id?.slice(-8).toUpperCase() || "RTE-XXXX"}
              )
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Failed to load data</p>
            <p className="text-sm">{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={fetchData}>
              <RefreshCw className="h-3 w-3 mr-2" /> Retry
            </Button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">Loading {activeTab}...</p>
          </div>
        </div>
      )}

      {!loading && !error && currentData.length > 0 && (
        <DataTable
          title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          description={`${currentData.length} ${activeTab} found${searchQuery ? ` (filtered from ${totalItems})` : ""}`}
          data={currentData}
          columns={getColumns()}
          pageSize={10}
          addLabel={`Add ${singularLabel}`}
          onAdd={() => navigate(createPaths[activeTab])}
        />
      )}

      {!loading && !error && currentData.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg p-8">
          {searchQuery ? (
            <>
              <Search className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                No {activeTab} match your search: &quot;{searchQuery}&quot;
              </p>
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            </>
          ) : (
            <>
              <Database className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No {activeTab} Found</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                There are no {activeTab} in the system yet. Click the &quot;Add {singularLabel}&quot; button to add your
                first.
              </p>
              <Button onClick={() => navigate(createPaths[activeTab])} className="gradient-brand text-white border-0">
                <Plus className="h-4 w-4 mr-2" /> Add {singularLabel}
              </Button>
            </>
          )}
        </div>
      )}
    </>
  );
}
