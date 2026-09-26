import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2, Save, Truck } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { transportAPI, type Bus, type Driver, type Route as TransportRoute } from "@/features/transport";
import { selectClassName, transportListPath } from "./transportUtils";

export type BusFormData = {
  busNumber: string;
  registrationNumber: string;
  model: string;
  make: string;
  year: number;
  capacity: number;
  fuelType: string;
  routeName: string;
  driverName: string;
  status: string;
  fuelLevel: number;
  fuelConsumption: number;
};

const emptyForm = (): BusFormData => ({
  busNumber: "",
  registrationNumber: "",
  model: "",
  make: "",
  year: new Date().getFullYear(),
  capacity: 40,
  fuelType: "Diesel",
  routeName: "",
  driverName: "",
  status: "Active",
  fuelLevel: 100,
  fuelConsumption: 0,
});

const toFormData = (bus: Bus): BusFormData => ({
  busNumber: bus.busNumber || "",
  registrationNumber: bus.registrationNumber || "",
  model: bus.model || "",
  make: bus.make || "",
  year: bus.year || new Date().getFullYear(),
  capacity: bus.capacity || 40,
  fuelType: bus.fuelType || "Diesel",
  routeName: bus.routeName || "",
  driverName: bus.driverName || "",
  status: bus.status || "Active",
  fuelLevel: bus.fuelLevel ?? 100,
  fuelConsumption: bus.fuelConsumption ?? 0,
});

const validateBusForm = (data: BusFormData) => {
  if (!data.busNumber.trim()) return "Bus number is required.";
  if (!data.registrationNumber.trim()) return "Registration number is required.";
  if (!data.model.trim()) return "Bus model is required.";
  if (!data.make.trim()) return "Bus make is required.";
  if (!Number.isFinite(Number(data.year)) || Number(data.year) < 1980 || Number(data.year) > new Date().getFullYear() + 1) {
    return "Please enter a valid manufacturing year.";
  }
  if (!Number.isFinite(Number(data.capacity)) || Number(data.capacity) < 10 || Number(data.capacity) > 80) {
    return "Capacity must be between 10 and 80 seats.";
  }
  return null;
};

interface BusFormProps {
  mode: "create" | "edit";
  bus?: Bus | null;
}

export function BusForm({ mode, bus }: BusFormProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<BusFormData>(emptyForm());
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingOptions(true);
        const [driversRes, routesRes] = await Promise.all([
          transportAPI.getDrivers({ limit: 100 }),
          transportAPI.getRoutes({ limit: 100 }),
        ]);
        setDrivers(driversRes?.success ? driversRes.data || [] : []);
        setRoutes(routesRes?.success ? routesRes.data || [] : []);
      } catch {
        toast.error("Failed to load form options");
      } finally {
        setLoadingOptions(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (mode === "edit" && bus) {
      setFormData(toFormData(bus));
    }
  }, [mode, bus]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "year" || name === "capacity" || name === "fuelLevel" || name === "fuelConsumption"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationMessage = validateBusForm(formData);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    setSaving(true);
    try {
      const data = { ...formData };
      const id = bus?._id;
      const response =
        mode === "edit" && id
          ? await transportAPI.updateBus(id, data)
          : await transportAPI.createBus(data);

      if (response?.success) {
        toast.success(`Bus ${mode === "edit" ? "updated" : "created"} successfully!`);
        navigate(transportListPath("buses"), { state: { tab: "buses" } });
      } else {
        toast.error(response?.message || `Failed to ${mode === "edit" ? "update" : "create"} bus`);
      }
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "An error occurred";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const availableDrivers = drivers.filter(
    (d) => d.status === "Available" || d.status === "Active" || d.status === "On Route"
  );
  const activeRoutes = routes.filter((r) => r.status === "Active");

  if (loadingOptions) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-6 md:p-8">
        <div className="mb-6">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mb-3 -ml-2"
            onClick={() => navigate(transportListPath("buses"), { state: { tab: "buses" } })}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to transport
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" />
            {mode === "create" ? "Add Bus" : "Edit Bus"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "create" ? "Register a new bus in the fleet" : "Update bus details"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="busNumber">Bus Number *</Label>
              <Input id="busNumber" name="busNumber" value={formData.busNumber} onChange={handleFormChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registrationNumber">Registration Number *</Label>
              <Input
                id="registrationNumber"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="make">Make *</Label>
              <Input id="make" name="make" value={formData.make} onChange={handleFormChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Input id="model" name="model" value={formData.model} onChange={handleFormChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Input id="year" name="year" type="number" value={formData.year} onChange={handleFormChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity *</Label>
              <Input id="capacity" name="capacity" type="number" value={formData.capacity} onChange={handleFormChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fuelType">Fuel Type</Label>
              <select id="fuelType" name="fuelType" value={formData.fuelType} onChange={handleFormChange} className={selectClassName}>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="CNG">CNG</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select id="status" name="status" value={formData.status} onChange={handleFormChange} className={selectClassName}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Maintenance">Maintenance</option>
                <option value="On Route">On Route</option>
                <option value="Retired">Retired</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="driverName">Driver Name</Label>
              <select id="driverName" name="driverName" value={formData.driverName} onChange={handleFormChange} className={selectClassName}>
                <option value="">Select a driver</option>
                {availableDrivers.map((driver) => (
                  <option key={driver._id || driver.driverId} value={driver.name}>
                    {driver.name} {driver.assignedBusNumber ? `(Bus: ${driver.assignedBusNumber})` : "(Available)"}
                  </option>
                ))}
              </select>
              {availableDrivers.length === 0 && (
                <p className="text-xs text-yellow-600">No available drivers found. Please add drivers first.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="routeName">Route Name</Label>
              <select id="routeName" name="routeName" value={formData.routeName} onChange={handleFormChange} className={selectClassName}>
                <option value="">Select a route</option>
                {activeRoutes.map((route) => (
                  <option key={route._id || route.routeId} value={route.name}>
                    {route.routeNumber} - {route.name} ({route.startPoint} → {route.endPoint})
                  </option>
                ))}
              </select>
              {activeRoutes.length === 0 && (
                <p className="text-xs text-yellow-600">No active routes found. Please add routes first.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fuelLevel">Fuel Level (%)</Label>
              <Input id="fuelLevel" name="fuelLevel" type="number" min="0" max="100" value={formData.fuelLevel} onChange={handleFormChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fuelConsumption">Fuel Consumption (L/100km)</Label>
              <Input id="fuelConsumption" name="fuelConsumption" type="number" step="0.1" value={formData.fuelConsumption} onChange={handleFormChange} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => navigate(transportListPath("buses"), { state: { tab: "buses" } })}>
              Cancel
            </Button>
            <Button type="submit" className="gradient-brand text-white border-0" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {mode === "edit" ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {mode === "edit" ? "Update Bus" : "Create Bus"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default BusForm;
