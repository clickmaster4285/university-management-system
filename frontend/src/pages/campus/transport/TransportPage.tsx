// src/routes/app.transport.tsx
import { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/layouts";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { DataTable, type Column } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { transportAPI, Bus, Driver, Route as TransportRoute } from "@/features/transport";
import { useAuth } from "@/lib/auth";
import { 
  Bus as BusIcon,
  Users, 
  MapPin, 
  Fuel,
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
  Truck,
  User,
  Route as RouteIcon,
  Clock,
  Gauge,
  Navigation,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  CircleDot,
  Timer,
  Route as RouteSvg
} from "lucide-react";
import { toast } from "sonner";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart as RePieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";


// Colors for charts
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export function TransportPage() {
  const { user } = useAuth();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'buses' | 'drivers' | 'routes'>('buses');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for Bus
  const [busFormData, setBusFormData] = useState({
    busNumber: '',
    registrationNumber: '',
    model: '',
    make: '',
    year: new Date().getFullYear(),
    capacity: 40,
    fuelType: 'Diesel',
    routeName: '',
    driverName: '',
    status: 'Active',
    fuelLevel: 100,
    fuelConsumption: 0
  });

  // Form state for Driver
  const [driverFormData, setDriverFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    licenseNumber: '',
    licenseExpiry: '',
    licenseClass: 'C',
    hireDate: new Date().toISOString().split('T')[0],
    employmentStatus: 'Active',
    salary: 0,
    experienceYears: 0,
    assignedBusNumber: '',
    status: 'Available'
  });

  // Form state for Route
  const [routeFormData, setRouteFormData] = useState({
    routeNumber: '',
    name: '',
    description: '',
    startPoint: '',
    endPoint: '',
    distance: 0,
    duration: 0,
    baseFare: 50,
    farePerKm: 10,
    routeType: 'Campus',
    status: 'Active'
  });

  const isAuthenticated = !!user;

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [busesRes, driversRes, routesRes, statsRes] = await Promise.all([
        transportAPI.getBuses({ limit: 100 }),
        transportAPI.getDrivers({ limit: 100 }),
        transportAPI.getRoutes({ limit: 100 }),
        transportAPI.getStats()
      ]);
      
      let busesData: Bus[] = [];
      let driversData: Driver[] = [];
      let routesData: TransportRoute[] = [];
      
      if (busesRes && busesRes.success) busesData = busesRes.data || [];
      if (driversRes && driversRes.success) driversData = driversRes.data || [];
      if (routesRes && routesRes.success) routesData = routesRes.data || [];
      
      setBuses(busesData);
      setDrivers(driversData);
      setRoutes(routesData);
      
      if (statsRes && statsRes.success) {
        setStats(statsRes.data);
      }
      
    } catch (error: any) {
      console.error('Failed to fetch transport data:', error);
      if (error.message?.includes('NetworkError') || error.message?.includes('Failed to fetch')) {
        setError('Cannot connect to backend. Please check if server is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // ✅ FIXED: Filter data based on search query - searches through IDs
  const getFilteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      if (activeTab === 'buses') return buses;
      else if (activeTab === 'drivers') return drivers;
      else return routes;
    }
    
    const searchLower = searchQuery.toLowerCase().trim();
    
    if (activeTab === 'buses') {
      return buses.filter(b => {
        const busId = (b.busId || '').toLowerCase();
        const busNumber = (b.busNumber || '').toLowerCase();
        const registrationNumber = (b.registrationNumber || '').toLowerCase();
        const model = (b.model || '').toLowerCase();
        const make = (b.make || '').toLowerCase();
        const driverName = (b.driverName || '').toLowerCase();
        const routeName = (b.routeName || '').toLowerCase();
        const status = (b.status || '').toLowerCase();
        
        return busId.includes(searchLower) ||
               busNumber.includes(searchLower) ||
               registrationNumber.includes(searchLower) ||
               model.includes(searchLower) ||
               make.includes(searchLower) ||
               driverName.includes(searchLower) ||
               routeName.includes(searchLower) ||
               status.includes(searchLower);
      });
    } else if (activeTab === 'drivers') {
      return drivers.filter(d => {
        const driverId = (d.driverId || '').toLowerCase();
        const name = (d.name || '').toLowerCase();
        const email = (d.email || '').toLowerCase();
        const phone = (d.phone || '').toLowerCase();
        const licenseNumber = (d.licenseNumber || '').toLowerCase();
        const assignedBusNumber = (d.assignedBusNumber || '').toLowerCase();
        const status = (d.status || '').toLowerCase();
        
        return driverId.includes(searchLower) ||
               name.includes(searchLower) ||
               email.includes(searchLower) ||
               phone.includes(searchLower) ||
               licenseNumber.includes(searchLower) ||
               assignedBusNumber.includes(searchLower) ||
               status.includes(searchLower);
      });
    } else {
      return routes.filter(r => {
        const routeId = (r.routeId || '').toLowerCase();
        const routeNumber = (r.routeNumber || '').toLowerCase();
        const name = (r.name || '').toLowerCase();
        const startPoint = (r.startPoint || '').toLowerCase();
        const endPoint = (r.endPoint || '').toLowerCase();
        const status = (r.status || '').toLowerCase();
        
        return routeId.includes(searchLower) ||
               routeNumber.includes(searchLower) ||
               name.includes(searchLower) ||
               startPoint.includes(searchLower) ||
               endPoint.includes(searchLower) ||
               status.includes(searchLower);
      });
    }
  }, [searchQuery, activeTab, buses, drivers, routes]);

  // Prepare chart data
  const getStatusChartData = () => {
    if (!stats) return [];
    const busData = stats.buses || {};
    return [
      { name: 'Active', value: busData.active || 0 },
      { name: 'On Route', value: busData.onRoute || 0 },
      { name: 'Maintenance', value: busData.maintenance || 0 }
    ];
  };

  const getDriverStatusData = () => {
    if (!stats) return [];
    const driverData = stats.drivers || {};
    return [
      { name: 'Available', value: driverData.available || 0 },
      { name: 'On Route', value: driverData.onRoute || 0 },
      { name: 'Off Duty', value: (driverData.total || 0) - (driverData.available || 0) - (driverData.onRoute || 0) }
    ];
  };

  const getRoutePerformanceData = () => {
    const routeNames = routes.slice(0, 6).map(r => r.routeNumber || 'R-000');
    const data = routeNames.map((name, index) => ({
      name: name,
      distance: Math.floor(Math.random() * 30) + 5,
      duration: Math.floor(Math.random() * 60) + 20,
      riders: Math.floor(Math.random() * 80) + 20
    }));
    return data;
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Handle tab change
  const handleTabChange = (tab: 'buses' | 'drivers' | 'routes') => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  // Open add modal
  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setIsModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (item: any) => {
    setIsEditMode(true);
    setEditingId(item._id);
    
    if (activeTab === 'buses') {
      setBusFormData({
        busNumber: item.busNumber || '',
        registrationNumber: item.registrationNumber || '',
        model: item.model || '',
        make: item.make || '',
        year: item.year || new Date().getFullYear(),
        capacity: item.capacity || 40,
        fuelType: item.fuelType || 'Diesel',
        routeName: item.routeName || '',
        driverName: item.driverName || '',
        status: item.status || 'Active',
        fuelLevel: item.fuelLevel || 100,
        fuelConsumption: item.fuelConsumption || 0
      });
    } else if (activeTab === 'drivers') {
      setDriverFormData({
        name: item.name || '',
        email: item.email || '',
        phone: item.phone || '',
        address: item.address || '',
        licenseNumber: item.licenseNumber || '',
        licenseExpiry: item.licenseExpiry ? new Date(item.licenseExpiry).toISOString().split('T')[0] : '',
        licenseClass: item.licenseClass || 'C',
        hireDate: item.hireDate ? new Date(item.hireDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        employmentStatus: item.employmentStatus || 'Active',
        salary: item.salary || 0,
        experienceYears: item.experienceYears || 0,
        assignedBusNumber: item.assignedBusNumber || '',
        status: item.status || 'Available'
      });
    } else {
      setRouteFormData({
        routeNumber: item.routeNumber || '',
        name: item.name || '',
        description: item.description || '',
        startPoint: item.startPoint || '',
        endPoint: item.endPoint || '',
        distance: item.distance || 0,
        duration: item.duration || 0,
        baseFare: item.baseFare || 50,
        farePerKm: item.farePerKm || 10,
        routeType: item.routeType || 'Campus',
        status: item.status || 'Active'
      });
    }
    
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingId(null);
  };

  // Handle form input change
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (activeTab === 'buses') {
      setBusFormData(prev => ({
        ...prev,
        [name]: name === 'year' || name === 'capacity' || name === 'fuelLevel' || name === 'fuelConsumption'
          ? parseFloat(value) || 0
          : value
      }));
    } else if (activeTab === 'drivers') {
      setDriverFormData(prev => ({
        ...prev,
        [name]: name === 'salary' || name === 'experienceYears'
          ? parseFloat(value) || 0
          : value
      }));
    } else {
      setRouteFormData(prev => ({
        ...prev,
        [name]: name === 'distance' || name === 'duration' || name === 'baseFare' || name === 'farePerKm'
          ? parseFloat(value) || 0
          : value
      }));
    }
  };

  const validateForm = () => {
    if (activeTab === 'buses') {
      const { busNumber, registrationNumber, model, make, year, capacity } = busFormData;
      if (!busNumber.trim()) return 'Bus number is required.';
      if (!registrationNumber.trim()) return 'Registration number is required.';
      if (!model.trim()) return 'Bus model is required.';
      if (!make.trim()) return 'Bus make is required.';
      if (!Number.isFinite(Number(year)) || Number(year) < 1980 || Number(year) > new Date().getFullYear() + 1) {
        return 'Please enter a valid manufacturing year.';
      }
      if (!Number.isFinite(Number(capacity)) || Number(capacity) < 10 || Number(capacity) > 80) {
        return 'Capacity must be between 10 and 80 seats.';
      }
      return null;
    }

    if (activeTab === 'drivers') {
      const { name, email, phone, licenseNumber, licenseExpiry } = driverFormData;
      if (!name.trim()) return 'Driver name is required.';
      if (!email.trim()) return 'Email is required.';
      if (!phone.trim()) return 'Phone number is required.';
      if (!licenseNumber.trim()) return 'License number is required.';
      if (!licenseExpiry.trim()) return 'License expiry date is required.';
      if (Number.isNaN(new Date(licenseExpiry).getTime())) return 'Please enter a valid license expiry date.';
      return null;
    }

    const { routeNumber, name, startPoint, endPoint, distance, duration, baseFare } = routeFormData;
    if (!routeNumber.trim()) return 'Route number is required.';
    if (!name.trim()) return 'Route name is required.';
    if (!startPoint.trim()) return 'Start point is required.';
    if (!endPoint.trim()) return 'End point is required.';
    if (!Number.isFinite(Number(distance)) || Number(distance) < 0) return 'Distance must be a valid positive number.';
    if (!Number.isFinite(Number(duration)) || Number(duration) < 0) return 'Duration must be a valid positive number.';
    if (!Number.isFinite(Number(baseFare)) || Number(baseFare) < 0) return 'Base fare must be a valid positive number.';
    return null;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validationMessage = validateForm();
    if (validationMessage) {
      toast.error(validationMessage);
      setIsSubmitting(false);
      return;
    }

    try {
      let response;
      if (activeTab === 'buses') {
        const data = { ...busFormData };
        if (isEditMode && editingId) {
          response = await transportAPI.updateBus(editingId, data);
        } else {
          response = await transportAPI.createBus(data);
        }
      } else if (activeTab === 'drivers') {
        const data = { ...driverFormData };
        if (isEditMode && editingId) {
          response = await transportAPI.updateDriver(editingId, data);
        } else {
          response = await transportAPI.createDriver(data);
        }
      } else {
        const data = { ...routeFormData };
        if (isEditMode && editingId) {
          response = await transportAPI.updateRoute(editingId, data);
        } else {
          response = await transportAPI.createRoute(data);
        }
      }

      if (response && response.success) {
        toast.success(`${activeTab.slice(0, -1)} ${isEditMode ? 'updated' : 'created'} successfully!`);
        closeModal();
        await fetchData();
        setSearchQuery('');
      } else {
        toast.error(response?.message || `Failed to ${isEditMode ? 'update' : 'create'} ${activeTab.slice(0, -1)}`);
      }
    } catch (error: any) {
      console.error('Failed to save:', error);
      toast.error(error.response?.data?.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) return;
    
    try {
      let response;
      if (activeTab === 'buses') {
        response = await transportAPI.deleteBus(id);
      } else if (activeTab === 'drivers') {
        response = await transportAPI.deleteDriver(id);
      } else {
        response = await transportAPI.deleteRoute(id);
      }

      if (response && response.success) {
        toast.success(`${activeTab.slice(0, -1)} deleted successfully`);
        await fetchData();
        setSearchQuery('');
      } else {
        toast.error(response?.message || 'Failed to delete');
      }
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete');
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { className: string; label: string }> = {
      'Active': { className: 'bg-green-500/15 text-green-600 border-0', label: 'Active' },
      'Inactive': { className: 'bg-gray-500/15 text-gray-600 border-0', label: 'Inactive' },
      'Maintenance': { className: 'bg-yellow-500/15 text-yellow-600 border-0', label: 'Maintenance' },
      'Retired': { className: 'bg-red-500/15 text-red-600 border-0', label: 'Retired' },
      'On Route': { className: 'bg-blue-500/15 text-blue-600 border-0', label: 'On Route' },
      'Available': { className: 'bg-green-500/15 text-green-600 border-0', label: 'Available' },
      'On Leave': { className: 'bg-orange-500/15 text-orange-600 border-0', label: 'On Leave' },
      'Off Duty': { className: 'bg-gray-500/15 text-gray-600 border-0', label: 'Off Duty' },
      'Suspended': { className: 'bg-red-500/15 text-red-600 border-0', label: 'Suspended' },
      'Terminated': { className: 'bg-red-600/15 text-red-600 border-0', label: 'Terminated' }
    };
    
    const info = statusMap[status] || statusMap['Active'];
    return <Badge className={info.className}>{info.label}</Badge>;
  };

  // Define columns
  const getColumns = (): Column<any>[] => {
    if (activeTab === 'buses') {
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
                  <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{r.busId || 'N/A'}</span>
                  <span className="ml-2">{r.registrationNumber}</span>
                </div>
              </div>
            </div>
          )
        },
        {
          key: "model",
          header: "Model",
          cell: (r) => <span>{r.make} {r.model} ({r.year})</span>
        },
        {
          key: "capacity",
          header: "Capacity",
          cell: (r) => <span>{r.capacity} seats</span>
        },
        {
          key: "driverName",
          header: "Driver",
          cell: (r) => <span>{r.driverName || '—'}</span>
        },
        {
          key: "routeName",
          header: "Route",
          cell: (r) => <span>{r.routeName || '—'}</span>
        },
        {
          key: "fuelLevel",
          header: "Fuel",
          cell: (r) => {
            const level = r.fuelLevel || 0;
            const color = level > 70 ? 'text-green-600' : level > 30 ? 'text-yellow-600' : 'text-red-600';
            return <span className={`font-medium ${color}`}>{level}%</span>;
          }
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
              <Button variant="outline" size="sm" onClick={() => openEditModal(r)} className="hover:bg-blue-50">
                <Pencil className="h-3 w-3 mr-1" /> Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={() => r._id && handleDelete(r._id, r.busNumber)}>
                <Trash2 className="h-3 w-3 mr-1" /> Delete
              </Button>
            </div>
          )
        }
      ];
    } else if (activeTab === 'drivers') {
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
                  <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{r.driverId || 'N/A'}</span>
                  <span className="ml-2">{r.email}</span>
                </div>
              </div>
            </div>
          )
        },
        {
          key: "phone",
          header: "Phone",
          cell: (r) => <span>{r.phone}</span>
        },
        {
          key: "licenseNumber",
          header: "License",
          cell: (r) => (
            <div>
              <span>{r.licenseNumber}</span>
              <span className="text-xs text-muted-foreground block">Class {r.licenseClass}</span>
            </div>
          )
        },
        {
          key: "assignedBusNumber",
          header: "Assigned Bus",
          cell: (r) => <span>{r.assignedBusNumber || '—'}</span>
        },
        {
          key: "experienceYears",
          header: "Experience",
          cell: (r) => <span>{r.experienceYears || 0} years</span>
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
              <Button variant="outline" size="sm" onClick={() => openEditModal(r)} className="hover:bg-blue-50">
                <Pencil className="h-3 w-3 mr-1" /> Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={() => r._id && handleDelete(r._id, r.name)}>
                <Trash2 className="h-3 w-3 mr-1" /> Delete
              </Button>
            </div>
          )
        }
      ];
    } else {
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
                  <span className="font-mono bg-muted px-1.5 py-0.5 rounded">{r.routeId || 'N/A'}</span>
                  <span className="ml-2">{r.name}</span>
                </div>
              </div>
            </div>
          )
        },
        {
          key: "startEnd",
          header: "From → To",
          cell: (r) => <span>{r.startPoint} → {r.endPoint}</span>
        },
        {
          key: "distance",
          header: "Distance",
          cell: (r) => <span>{r.distance} km</span>
        },
        {
          key: "duration",
          header: "Duration",
          cell: (r) => <span>{r.duration} min</span>
        },
        {
          key: "fare",
          header: "Fare",
          cell: (r) => <span>PKR {r.baseFare}</span>
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
              <Button variant="outline" size="sm" onClick={() => openEditModal(r)} className="hover:bg-blue-50">
                <Pencil className="h-3 w-3 mr-1" /> Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={() => r._id && handleDelete(r._id, r.routeNumber)}>
                <Trash2 className="h-3 w-3 mr-1" /> Delete
              </Button>
            </div>
          )
        }
      ];
    }
  };

  // Get current data based on active tab and search
  const currentData = getFilteredData;
  const totalItems = activeTab === 'buses' ? buses.length : activeTab === 'drivers' ? drivers.length : routes.length;
  const displayCount = currentData.length;

  // Get modal title
  const getModalTitle = () => {
    const itemName = activeTab.slice(0, -1);
    return `${isEditMode ? 'Edit' : 'Add New'} ${itemName.charAt(0).toUpperCase() + itemName.slice(1)}`;
  };

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <AppShell title="Transport" subtitle="Please login to manage transport">
        <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg p-8">
          <Database className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Login Required</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            Please login to view and manage transport operations.
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
      title="Transport"
      subtitle={stats ? `${stats.buses?.total || 0} buses · ${stats.routes?.active || 0} routes · ${stats.drivers?.total || 0} drivers` : 'Loading...'}
      actions={
        <>
          <Button onClick={openAddModal} className="gradient-brand text-white border-0">
            <Plus className="h-4 w-4 mr-2" /> Add {activeTab.slice(0, -1)}
          </Button>
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard 
          label="Total Buses" 
          value={stats?.buses?.total || 0} 
          icon={BusIcon} 
          tone="brand" 
        />
        <KpiCard 
          label="Active Routes" 
          value={stats?.routes?.active || 0} 
          icon={MapPin} 
          tone="info" 
        />
        <KpiCard 
          label="Total Drivers" 
          value={stats?.drivers?.total || 0} 
          icon={Users} 
          tone="success" 
        />
        <KpiCard 
          label="Daily Riders" 
          value={stats?.riders || 0} 
          icon={Users} 
          tone="warning" 
        />
      </div>

      {/* Charts Section - Unique Transport Graphics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Bus Status Pie Chart */}
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
                    {getStatusChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: "var(--popover)", 
                      border: "1px solid var(--border)", 
                      borderRadius: 8,
                      fontSize: 11
                    }} 
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-3 mt-1">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-[10px] text-muted-foreground">Active</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-[10px] text-muted-foreground">On Route</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <span className="text-[10px] text-muted-foreground">Maintenance</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Driver Status Pie Chart */}
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
                    {getDriverStatusData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: "var(--popover)", 
                      border: "1px solid var(--border)", 
                      borderRadius: 8,
                      fontSize: 11
                    }} 
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-3 mt-1">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-[10px] text-muted-foreground">Available</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-[10px] text-muted-foreground">On Route</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <span className="text-[10px] text-muted-foreground">Off Duty</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Route Performance Radar Chart */}
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
                  <PolarAngleAxis dataKey="name" fontSize={8} tick={{ fill: 'var(--muted-foreground)' }} />
                  <PolarRadiusAxis fontSize={8} tick={{ fill: 'var(--muted-foreground)' }} />
                  <Radar name="Distance (km)" dataKey="distance" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  <Radar name="Duration (min)" dataKey="duration" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  <Legend wrapperStyle={{ fontSize: 9, paddingTop: 4 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'buses' 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => handleTabChange('buses')}
        >
          <BusIcon className="h-4 w-4 inline mr-2" /> Buses ({buses.length})
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'drivers' 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => handleTabChange('drivers')}
        >
          <User className="h-4 w-4 inline mr-2" /> Drivers ({drivers.length})
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'routes' 
              ? 'border-b-2 border-primary text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => handleTabChange('routes')}
        >
          <RouteIcon className="h-4 w-4 inline mr-2" /> Routes ({routes.length})
        </button>
      </div>

      {/* ✅ SEARCH BAR - Now searches through IDs */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search by ID, Name, Number... (${totalItems} records)`}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {searchQuery && (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            Found {displayCount} of {totalItems} {activeTab}
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
        {totalItems > 0 && (
          <div className="text-xs text-muted-foreground ml-auto flex items-center gap-2">
            <span className="font-mono bg-muted px-2 py-0.5 rounded">
              💡 Try searching by ID (e.g., {
                activeTab === 'buses' ? buses[0]?.busId || buses[0]?._id?.slice(-8).toUpperCase() || 'BUS-XXXX' :
                activeTab === 'drivers' ? drivers[0]?.driverId || drivers[0]?._id?.slice(-8).toUpperCase() || 'DRV-XXXX' :
                routes[0]?.routeId || routes[0]?._id?.slice(-8).toUpperCase() || 'RTE-XXXX'
              })
            </span>
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
            <Button variant="outline" size="sm" className="mt-2" onClick={fetchData}>
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
            <p className="mt-4 text-muted-foreground">Loading {activeTab}...</p>
          </div>
        </div>
      )}

      {/* DataTable with filtered data */}
      {!loading && !error && currentData.length > 0 && (
        <DataTable
          title={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
          description={`${currentData.length} ${activeTab} found${searchQuery ? ` (filtered from ${totalItems})` : ''}`}
          data={currentData}
          columns={getColumns()}
          pageSize={10}
          addLabel={`Add ${activeTab.slice(0, -1)}`}
          onAdd={openAddModal}
        />
      )}

      {/* Empty State */}
      {!loading && !error && currentData.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg p-8">
          {searchQuery ? (
            <>
              <Search className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                No {activeTab} match your search: "{searchQuery}"
              </p>
              <Button variant="outline" onClick={() => handleSearch('')}>
                Clear Search
              </Button>
            </>
          ) : (
            <>
              <Database className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No {activeTab} Found</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                There are no {activeTab} in the system yet. Click the "Add {activeTab.slice(0, -1)}" button to add your first.
              </p>
              <Button onClick={openAddModal} className="gradient-brand text-white border-0">
                <Plus className="h-4 w-4 mr-2" /> Add {activeTab.slice(0, -1)}
              </Button>
            </>
          )}
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold">{getModalTitle()}</h2>
              <Button variant="ghost" size="sm" onClick={closeModal} className="h-8 w-8 p-0 rounded-full hover:bg-gray-100">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeTab === 'buses' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="busNumber">Bus Number *</Label>
                      <Input 
                        id="busNumber" 
                        name="busNumber" 
                        value={busFormData.busNumber} 
                        onChange={handleFormChange} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registrationNumber">Registration Number *</Label>
                      <Input 
                        id="registrationNumber" 
                        name="registrationNumber" 
                        value={busFormData.registrationNumber} 
                        onChange={handleFormChange} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="make">Make *</Label>
                      <Input 
                        id="make" 
                        name="make" 
                        value={busFormData.make} 
                        onChange={handleFormChange} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model">Model *</Label>
                      <Input 
                        id="model" 
                        name="model" 
                        value={busFormData.model} 
                        onChange={handleFormChange} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year">Year *</Label>
                      <Input 
                        id="year" 
                        name="year" 
                        type="number" 
                        value={busFormData.year} 
                        onChange={handleFormChange} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="capacity">Capacity *</Label>
                      <Input 
                        id="capacity" 
                        name="capacity" 
                        type="number" 
                        value={busFormData.capacity} 
                        onChange={handleFormChange} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fuelType">Fuel Type</Label>
                      <select 
                        id="fuelType" 
                        name="fuelType" 
                        value={busFormData.fuelType} 
                        onChange={handleFormChange} 
                        className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="Petrol">Petrol</option>
                        <option value="Diesel">Diesel</option>
                        <option value="CNG">CNG</option>
                        <option value="Electric">Electric</option>
                        <option value="Hybrid">Hybrid</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <select 
                        id="status" 
                        name="status" 
                        value={busFormData.status} 
                        onChange={handleFormChange} 
                        className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="On Route">On Route</option>
                        <option value="Retired">Retired</option>
                      </select>
                    </div>
                    
                    {/* Driver Name - DROPDOWN */}
                    <div className="space-y-2">
                      <Label htmlFor="driverName">Driver Name</Label>
                      <select 
                        id="driverName" 
                        name="driverName" 
                        value={busFormData.driverName} 
                        onChange={handleFormChange} 
                        className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select a driver</option>
                        {drivers
                          .filter(d => d.status === 'Available' || d.status === 'Active' || d.status === 'On Route')
                          .map((driver) => (
                            <option key={driver._id || driver.driverId} value={driver.name}>
                              {driver.name} {driver.assignedBusNumber ? `(Bus: ${driver.assignedBusNumber})` : '(Available)'}
                            </option>
                          ))}
                      </select>
                      {drivers.filter(d => d.status === 'Available' || d.status === 'Active' || d.status === 'On Route').length === 0 && (
                        <p className="text-xs text-yellow-600">No available drivers found. Please add drivers first.</p>
                      )}
                    </div>

                    {/* Route Name - DROPDOWN */}
                    <div className="space-y-2">
                      <Label htmlFor="routeName">Route Name</Label>
                      <select 
                        id="routeName" 
                        name="routeName" 
                        value={busFormData.routeName} 
                        onChange={handleFormChange} 
                        className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select a route</option>
                        {routes
                          .filter(r => r.status === 'Active')
                          .map((route) => (
                            <option key={route._id || route.routeId} value={route.name}>
                              {route.routeNumber} - {route.name} ({route.startPoint} → {route.endPoint})
                            </option>
                          ))}
                      </select>
                      {routes.filter(r => r.status === 'Active').length === 0 && (
                        <p className="text-xs text-yellow-600">No active routes found. Please add routes first.</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fuelLevel">Fuel Level (%)</Label>
                      <Input 
                        id="fuelLevel" 
                        name="fuelLevel" 
                        type="number" 
                        min="0" 
                        max="100" 
                        value={busFormData.fuelLevel} 
                        onChange={handleFormChange} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fuelConsumption">Fuel Consumption (L/100km)</Label>
                      <Input 
                        id="fuelConsumption" 
                        name="fuelConsumption" 
                        type="number" 
                        step="0.1" 
                        value={busFormData.fuelConsumption} 
                        onChange={handleFormChange} 
                      />
                    </div>
                  </>
                )}

                {activeTab === 'drivers' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input 
                        id="name" 
                        name="name" 
                        value={driverFormData.name} 
                        onChange={handleFormChange} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input 
                        id="email" 
                        name="email" 
                        type="email" 
                        value={driverFormData.email} 
                        onChange={handleFormChange} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone *</Label>
                      <Input 
                        id="phone" 
                        name="phone" 
                        value={driverFormData.phone} 
                        onChange={handleFormChange} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input 
                        id="address" 
                        name="address" 
                        value={driverFormData.address} 
                        onChange={handleFormChange} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="licenseNumber">License Number *</Label>
                      <Input 
                        id="licenseNumber" 
                        name="licenseNumber" 
                        value={driverFormData.licenseNumber} 
                        onChange={handleFormChange} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="licenseExpiry">License Expiry *</Label>
                      <Input 
                        id="licenseExpiry" 
                        name="licenseExpiry" 
                        type="date" 
                        value={driverFormData.licenseExpiry} 
                        onChange={handleFormChange} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="licenseClass">License Class</Label>
                      <select 
                        id="licenseClass" 
                        name="licenseClass" 
                        value={driverFormData.licenseClass} 
                        onChange={handleFormChange} 
                        className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                        <option value="E">E</option>
                        <option value="H">H</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hireDate">Hire Date</Label>
                      <Input 
                        id="hireDate" 
                        name="hireDate" 
                        type="date" 
                        value={driverFormData.hireDate} 
                        onChange={handleFormChange} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employmentStatus">Employment Status</Label>
                      <select 
                        id="employmentStatus" 
                        name="employmentStatus" 
                        value={driverFormData.employmentStatus} 
                        onChange={handleFormChange} 
                        className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="Active">Active</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Suspended">Suspended</option>
                        <option value="Terminated">Terminated</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salary">Salary</Label>
                      <Input 
                        id="salary" 
                        name="salary" 
                        type="number" 
                        value={driverFormData.salary} 
                        onChange={handleFormChange} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="experienceYears">Experience (Years)</Label>
                      <Input 
                        id="experienceYears" 
                        name="experienceYears" 
                        type="number" 
                        value={driverFormData.experienceYears} 
                        onChange={handleFormChange} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="assignedBusNumber">Assigned Bus Number</Label>
                      <select 
                        id="assignedBusNumber" 
                        name="assignedBusNumber" 
                        value={driverFormData.assignedBusNumber} 
                        onChange={handleFormChange} 
                        className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Select a bus number</option>
                        {buses.map((bus) => (
                          <option key={bus._id || bus.busNumber} value={bus.busNumber}>
                            {bus.busNumber} - {bus.make} {bus.model}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <select 
                        id="status" 
                        name="status" 
                        value={driverFormData.status} 
                        onChange={handleFormChange} 
                        className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="Available">Available</option>
                        <option value="On Route">On Route</option>
                        <option value="Off Duty">Off Duty</option>
                        <option value="On Leave">On Leave</option>
                      </select>
                    </div>
                  </>
                )}

                {activeTab === 'routes' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="routeNumber">Route Number *</Label>
                      <Input 
                        id="routeNumber" 
                        name="routeNumber" 
                        value={routeFormData.routeNumber} 
                        onChange={handleFormChange} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Route Name *</Label>
                      <Input 
                        id="name" 
                        name="name" 
                        value={routeFormData.name} 
                        onChange={handleFormChange} 
                        required 
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Input 
                        id="description" 
                        name="description" 
                        value={routeFormData.description} 
                        onChange={handleFormChange} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="startPoint">Start Point *</Label>
                      <Input 
                        id="startPoint" 
                        name="startPoint" 
                        value={routeFormData.startPoint} 
                        onChange={handleFormChange} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endPoint">End Point *</Label>
                      <Input 
                        id="endPoint" 
                        name="endPoint" 
                        value={routeFormData.endPoint} 
                        onChange={handleFormChange} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="distance">Distance (km) *</Label>
                      <Input 
                        id="distance" 
                        name="distance" 
                        type="number" 
                        step="0.1" 
                        value={routeFormData.distance} 
                        onChange={handleFormChange} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (min) *</Label>
                      <Input 
                        id="duration" 
                        name="duration" 
                        type="number" 
                        value={routeFormData.duration} 
                        onChange={handleFormChange} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="baseFare">Base Fare (PKR) *</Label>
                      <Input 
                        id="baseFare" 
                        name="baseFare" 
                        type="number" 
                        value={routeFormData.baseFare} 
                        onChange={handleFormChange} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="farePerKm">Fare per KM (PKR)</Label>
                      <Input 
                        id="farePerKm" 
                        name="farePerKm" 
                        type="number" 
                        value={routeFormData.farePerKm} 
                        onChange={handleFormChange} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="routeType">Route Type</Label>
                      <select 
                        id="routeType" 
                        name="routeType" 
                        value={routeFormData.routeType} 
                        onChange={handleFormChange} 
                        className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="Local">Local</option>
                        <option value="Intercity">Intercity</option>
                        <option value="Airport">Airport</option>
                        <option value="Campus">Campus</option>
                        <option value="Student">Student</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <select 
                        id="status" 
                        name="status" 
                        value={routeFormData.status} 
                        onChange={handleFormChange} 
                        className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <Button type="button" variant="outline" onClick={closeModal}>
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
                      {isEditMode ? 'Update' : 'Create'}
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

export default TransportPage;
