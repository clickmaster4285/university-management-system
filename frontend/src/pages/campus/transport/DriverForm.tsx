import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Loader2, Save, User } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { transportAPI, type Bus, type Driver } from "@/features/transport";
import { selectClassName, transportListPath } from "./transportUtils";

export type DriverFormData = {
  name: string;
  email: string;
  phone: string;
  address: string;
  licenseNumber: string;
  licenseExpiry: string;
  licenseClass: string;
  hireDate: string;
  employmentStatus: string;
  salary: number;
  experienceYears: number;
  assignedBusNumber: string;
  status: string;
};

const emptyForm = (): DriverFormData => ({
  name: "",
  email: "",
  phone: "",
  address: "",
  licenseNumber: "",
  licenseExpiry: "",
  licenseClass: "C",
  hireDate: new Date().toISOString().split("T")[0],
  employmentStatus: "Active",
  salary: 0,
  experienceYears: 0,
  assignedBusNumber: "",
  status: "Available",
});

const toFormData = (driver: Driver): DriverFormData => ({
  name: driver.name || "",
  email: driver.email || "",
  phone: driver.phone || "",
  address: driver.address || "",
  licenseNumber: driver.licenseNumber || "",
  licenseExpiry: driver.licenseExpiry ? new Date(driver.licenseExpiry).toISOString().split("T")[0] : "",
  licenseClass: driver.licenseClass || "C",
  hireDate: driver.hireDate ? new Date(driver.hireDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
  employmentStatus: driver.employmentStatus || "Active",
  salary: driver.salary || 0,
  experienceYears: driver.experienceYears || 0,
  assignedBusNumber: driver.assignedBusNumber || "",
  status: driver.status || "Available",
});

const validateDriverForm = (data: DriverFormData) => {
  if (!data.name.trim()) return "Driver name is required.";
  if (!data.email.trim()) return "Email is required.";
  if (!data.phone.trim()) return "Phone number is required.";
  if (!data.licenseNumber.trim()) return "License number is required.";
  if (!data.licenseExpiry.trim()) return "License expiry date is required.";
  if (Number.isNaN(new Date(data.licenseExpiry).getTime())) return "Please enter a valid license expiry date.";
  return null;
};

interface DriverFormProps {
  mode: "create" | "edit";
  driver?: Driver | null;
}

export function DriverForm({ mode, driver }: DriverFormProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<DriverFormData>(emptyForm());
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingOptions(true);
        const busesRes = await transportAPI.getBuses({ limit: 100 });
        setBuses(busesRes?.success ? busesRes.data || [] : []);
      } catch {
        toast.error("Failed to load form options");
      } finally {
        setLoadingOptions(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (mode === "edit" && driver) {
      setFormData(toFormData(driver));
    }
  }, [mode, driver]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "salary" || name === "experienceYears" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationMessage = validateDriverForm(formData);
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    setSaving(true);
    try {
      const data = { ...formData };
      const id = driver?._id;
      const response =
        mode === "edit" && id
          ? await transportAPI.updateDriver(id, data)
          : await transportAPI.createDriver(data);

      if (response?.success) {
        toast.success(`Driver ${mode === "edit" ? "updated" : "created"} successfully!`);
        navigate(transportListPath("drivers"), { state: { tab: "drivers" } });
      } else {
        toast.error(response?.message || `Failed to ${mode === "edit" ? "update" : "create"} driver`);
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
            onClick={() => navigate(transportListPath("drivers"), { state: { tab: "drivers" } })}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to transport
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            {mode === "create" ? "Add Driver" : "Edit Driver"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "create" ? "Register a new transport driver" : "Update driver details"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleFormChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleFormChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleFormChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" name="address" value={formData.address} onChange={handleFormChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">License Number *</Label>
              <Input id="licenseNumber" name="licenseNumber" value={formData.licenseNumber} onChange={handleFormChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseExpiry">License Expiry *</Label>
              <Input id="licenseExpiry" name="licenseExpiry" type="date" value={formData.licenseExpiry} onChange={handleFormChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseClass">License Class</Label>
              <select id="licenseClass" name="licenseClass" value={formData.licenseClass} onChange={handleFormChange} className={selectClassName}>
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
              <Input id="hireDate" name="hireDate" type="date" value={formData.hireDate} onChange={handleFormChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employmentStatus">Employment Status</Label>
              <select id="employmentStatus" name="employmentStatus" value={formData.employmentStatus} onChange={handleFormChange} className={selectClassName}>
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Suspended">Suspended</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">Salary</Label>
              <Input id="salary" name="salary" type="number" value={formData.salary} onChange={handleFormChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experienceYears">Experience (Years)</Label>
              <Input id="experienceYears" name="experienceYears" type="number" value={formData.experienceYears} onChange={handleFormChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedBusNumber">Assigned Bus Number</Label>
              <select id="assignedBusNumber" name="assignedBusNumber" value={formData.assignedBusNumber} onChange={handleFormChange} className={selectClassName}>
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
              <select id="status" name="status" value={formData.status} onChange={handleFormChange} className={selectClassName}>
                <option value="Available">Available</option>
                <option value="On Route">On Route</option>
                <option value="Off Duty">Off Duty</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => navigate(transportListPath("drivers"), { state: { tab: "drivers" } })}>
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
                  {mode === "edit" ? "Update Driver" : "Create Driver"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default DriverForm;
