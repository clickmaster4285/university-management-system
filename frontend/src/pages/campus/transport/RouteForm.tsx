import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2, Route as RouteIcon, Save } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { transportAPI, type Route as TransportRoute } from "@/features/transport";
import { selectClassName, transportListPath } from "./transportUtils";

export type RouteFormData = {
  routeNumber: string;
  name: string;
  description: string;
  startPoint: string;
  endPoint: string;
  distance: number;
  duration: number;
  baseFare: number;
  farePerKm: number;
  routeType: string;
  status: string;
};

const emptyForm = (): RouteFormData => ({
  routeNumber: "",
  name: "",
  description: "",
  startPoint: "",
  endPoint: "",
  distance: 0,
  duration: 0,
  baseFare: 50,
  farePerKm: 10,
  routeType: "Campus",
  status: "Active",
});

const toFormData = (route: TransportRoute): RouteFormData => ({
  routeNumber: route.routeNumber || "",
  name: route.name || "",
  description: route.description || "",
  startPoint: route.startPoint || "",
  endPoint: route.endPoint || "",
  distance: route.distance || 0,
  duration: route.duration || 0,
  baseFare: route.baseFare || 50,
  farePerKm: route.farePerKm || 10,
  routeType: route.routeType || "Campus",
  status: route.status || "Active",
});

const validateRouteForm = (data: RouteFormData) => {
  if (!data.routeNumber.trim()) return "Route number is required.";
  if (!data.name.trim()) return "Route name is required.";
  if (!data.startPoint.trim()) return "Start point is required.";
  if (!data.endPoint.trim()) return "End point is required.";
  if (!Number.isFinite(Number(data.distance)) || Number(data.distance) < 0) return "Distance must be a valid positive number.";
  if (!Number.isFinite(Number(data.duration)) || Number(data.duration) < 0) return "Duration must be a valid positive number.";
  if (!Number.isFinite(Number(data.baseFare)) || Number(data.baseFare) < 0) return "Base fare must be a valid positive number.";
  return null;
};

interface RouteFormProps {
  mode: "create" | "edit";
  route?: TransportRoute | null;
}

export function RouteForm({ mode, route }: RouteFormProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RouteFormData>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === "edit" && route) {
      setFormData(toFormData(route));
    }
  }, [mode, route]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "distance" || name === "duration" || name === "baseFare" || name === "farePerKm"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationMessage = validateRouteForm(formData);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    setSaving(true);
    try {
      const data = { ...formData };
      const id = route?._id;
      const response =
        mode === "edit" && id
          ? await transportAPI.updateRoute(id, data)
          : await transportAPI.createRoute(data);

      if (response?.success) {
        toast.success(`Route ${mode === "edit" ? "updated" : "created"} successfully!`);
        navigate(transportListPath("routes"), { state: { tab: "routes" } });
      } else {
        toast.error(response?.message || `Failed to ${mode === "edit" ? "update" : "create"} route`);
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

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-6 md:p-8">
        <div className="mb-6">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mb-3 -ml-2"
            onClick={() => navigate(transportListPath("routes"), { state: { tab: "routes" } })}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to transport
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <RouteIcon className="h-6 w-6 text-primary" />
            {mode === "create" ? "Add Route" : "Edit Route"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "create" ? "Define a new transport route" : "Update route details"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="routeNumber">Route Number *</Label>
              <Input id="routeNumber" name="routeNumber" value={formData.routeNumber} onChange={handleFormChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Route Name *</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleFormChange} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" value={formData.description} onChange={handleFormChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startPoint">Start Point *</Label>
              <Input id="startPoint" name="startPoint" value={formData.startPoint} onChange={handleFormChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endPoint">End Point *</Label>
              <Input id="endPoint" name="endPoint" value={formData.endPoint} onChange={handleFormChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="distance">Distance (km) *</Label>
              <Input id="distance" name="distance" type="number" step="0.1" value={formData.distance} onChange={handleFormChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (min) *</Label>
              <Input id="duration" name="duration" type="number" value={formData.duration} onChange={handleFormChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="baseFare">Base Fare (PKR) *</Label>
              <Input id="baseFare" name="baseFare" type="number" value={formData.baseFare} onChange={handleFormChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="farePerKm">Fare per KM (PKR)</Label>
              <Input id="farePerKm" name="farePerKm" type="number" value={formData.farePerKm} onChange={handleFormChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="routeType">Route Type</Label>
              <select id="routeType" name="routeType" value={formData.routeType} onChange={handleFormChange} className={selectClassName}>
                <option value="Local">Local</option>
                <option value="Intercity">Intercity</option>
                <option value="Airport">Airport</option>
                <option value="Campus">Campus</option>
                <option value="Student">Student</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select id="status" name="status" value={formData.status} onChange={handleFormChange} className={selectClassName}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => navigate(transportListPath("routes"), { state: { tab: "routes" } })}>
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
                  {mode === "edit" ? "Update Route" : "Create Route"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default RouteForm;
