import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/layouts";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  School,
  Mail,
  Phone,
  Globe,
  MapPin,
  Building2,
  Loader2,
  ArrowLeft,
  Save,
  Star,
} from "lucide-react";
import { campusAPI, type CampusData, type Campus } from "@/features/campus";

const CAMPUS_TYPES = ["Main Campus", "Branch", "City Campus", "Regional Campus"];
const PROVINCES = ["Punjab", "Sindh", "KPK", "Balochistan", "Islamabad"];

interface CampusFormProps {
  mode: "create" | "edit";
  campus?: Campus | null;
  hasMainCampus?: boolean;
}

export function CampusForm({ mode, campus, hasMainCampus = false }: CampusFormProps) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CampusData>({
    name: "",
    campusCode: "",
    type: "Branch",
    isMainCampus: false,
    street: "",
    city: "",
    province: "",
    country: "Pakistan",
    postalCode: "",
    phone: "",
    email: "",
    establishedYear: undefined,
    description: "",
    status: "Active",
  });

  useEffect(() => {
    if (mode === "edit" && campus) {
      setFormData({
        name: campus.name || "",
        campusCode: campus.campusCode || "",
        type: campus.type || "Branch",
        isMainCampus: campus.isMainCampus || false,
        street: campus.address?.street || "",
        city: campus.address?.city || "",
        province: campus.address?.province || "",
        country: campus.address?.country || "Pakistan",
        postalCode: campus.address?.postalCode || "",
        phone: campus.phone || "",
        email: campus.email || "",
        establishedYear: campus.establishedYear || undefined,
        description: campus.description || "",
        status: campus.status || "Active",
      });
    }
  }, [mode, campus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.campusCode.trim()) {
      toast.error("Campus name and code are required");
      return;
    }

    setSaving(true);
    try {
      if (mode === "create") {
        await campusAPI.create(formData);
        toast.success("Campus created successfully!");
      } else if (campus?._id) {
        await campusAPI.update(campus._id, formData);
        toast.success("Campus updated successfully!");
      }
      navigate("/campuses");
    } catch (error: any) {
      toast.error(error?.message || "Failed to save campus");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof CampusData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <AppShell
      title={mode === "create" ? "Create Campus" : `Edit ${campus?.name}`}
      subtitle={
        mode === "create"
          ? "Add a new campus to your university"
          : `${campus?.campusId ?? ""} · ${campus?.campusCode ?? ""}`
      }
      actions={
        <Button variant="outline" onClick={() => navigate("/campuses")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Campuses
        </Button>
      }
    >
      <Card className="border shadow-sm">
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <School className="h-5 w-5 text-primary" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Campus Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="e.g., Main Campus Lahore"
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label>Campus Code *</Label>
                  <Input
                    value={formData.campusCode}
                    onChange={(e) => handleChange("campusCode", e.target.value.toUpperCase())}
                    placeholder="e.g., MCL"
                    className="mt-1.5 uppercase"
                    required
                  />
                </div>
                <div>
                  <Label>Campus Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleChange("type", value)}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CAMPUS_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleChange("status", value)}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Under Construction">Under Construction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3 md:col-span-2 mt-1">
                  <Switch
                    checked={formData.isMainCampus}
                    onCheckedChange={(checked) => handleChange("isMainCampus", checked)}
                    disabled={hasMainCampus && !formData.isMainCampus}
                  />
                  <div>
                    <Label className="flex items-center gap-1.5 cursor-pointer">
                      <Star className="h-3.5 w-3.5 text-yellow-500" /> Main Campus
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {hasMainCampus && !formData.isMainCampus
                        ? "Another campus is already set as main. Uncheck it first."
                        : "The main campus cannot be deleted while other campuses exist"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Phone className="h-5 w-5 text-primary" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+92-42-35608000"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="campus@university.edu.pk"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Location
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Street Address</Label>
                  <Input
                    value={formData.street}
                    onChange={(e) => handleChange("street", e.target.value)}
                    placeholder="Opposite Sector U, DHA Phase 5"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>City *</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    placeholder="e.g., Lahore"
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label>Province *</Label>
                  <Select
                    value={formData.province}
                    onValueChange={(value) => handleChange("province", value)}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVINCES.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Country *</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => handleChange("country", value)}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pakistan">Pakistan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Postal Code</Label>
                  <Input
                    value={formData.postalCode}
                    onChange={(e) => handleChange("postalCode", e.target.value)}
                    placeholder="e.g., 54792"
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>

            {/* Additional */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Additional Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Established Year</Label>
                  <Input
                    type="number"
                    value={formData.establishedYear ?? ""}
                    onChange={(e) =>
                      handleChange("establishedYear", e.target.value ? parseInt(e.target.value) : undefined)
                    }
                    placeholder="e.g., 1985"
                    min="1900"
                    max={new Date().getFullYear()}
                    className="mt-1.5"
                  />
                </div>
                <div className="md:col-span-3">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Brief description of the campus..."
                    className="mt-1.5 min-h-[80px]"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/campuses")}
                className="h-12 px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 h-12 gradient-brand text-white border-0 text-base font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    {mode === "create" ? <Building2 className="h-5 w-5 mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                    {mode === "create" ? "Create Campus" : "Update Campus"}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}

export default CampusForm;
