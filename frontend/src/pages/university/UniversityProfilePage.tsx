import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Lock,
  Sparkles,
  GraduationCap,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  Save,
  Pencil
} from "lucide-react";
import {
  getUniversity,
  createUniversity,
  updateUniversity,
  type University,
} from "@/features/university";

export function UniversityProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [university, setUniversity] = useState<University | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    universityName: "",
    universityCode: "",
    shortName: "",
    universityType: "",
    registrationNumber: "",
    officialEmail: "",
    phoneNumber: "",
    website: "",
    country: "Pakistan",
    province: "",
    city: "",
    address: "",
    academicSystem: "Semester",
    gradingSystem: "GPA",
    maxGPA: 4.0,
    passingGPA: 2.0,
  });

  useEffect(() => {
    fetchUniversity();
  }, []);

  const fetchUniversity = async () => {
    try {
      setLoading(true);
      const res = await getUniversity();
      if (res?.data) {
        setUniversity(res.data);
        populateForm(res.data);
        localStorage.setItem("universityId", res.data._id);
      }
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setUniversity(null);
        setIsEditMode(false);
      } else {
        toast.error("Failed to load university");
      }
    } finally {
      setLoading(false);
    }
  };

  const populateForm = (uni: University) => {
    setFormData({
      universityName: uni.universityName || "",
      universityCode: uni.universityCode || "",
      shortName: uni.shortName || "",
      universityType: uni.universityType || "",
      registrationNumber: uni.registrationNumber || "",
      officialEmail: uni.officialEmail || "",
      phoneNumber: uni.phoneNumber || "",
      website: uni.website || "",
      country: uni.address?.country || "Pakistan",
      province: uni.address?.province || "",
      city: uni.address?.city || "",
      address: uni.address?.street || "",
      academicSystem: uni.academicSettings?.academicSystem || "Semester",
      gradingSystem: uni.academicSettings?.gradingSystem || "GPA",
      maxGPA: uni.academicSettings?.maxGPA || 4.0,
      passingGPA: uni.academicSettings?.passingGPA || 2.0,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (university) {
        await updateUniversity(formData);
        toast.success("University updated successfully!");
      } else {
        const res = await createUniversity(formData);
        toast.success("University created successfully!");
        if (res.data?._id) {
          localStorage.setItem("universityId", res.data._id);
        }
      }
      setIsEditMode(false);
      await fetchUniversity();
    } catch (error: any) {
      toast.error(error?.message || "Failed to save university");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isCreate = !university;
  const title = isCreate ? "Create University" : "University Profile";
  const subtitle = isCreate
    ? "Register a new university in the ScholarOS ecosystem"
    : `${university?.universityName} · ${university?.universityId}`;

  return (
      <Card className="border shadow-sm">
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* University ID - Auto-generated */}
            <div className="glass p-6 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">University ID</Label>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="text-2xl font-bold gradient-brand-text">
                      {university?.universityId || "UNI-000001"}
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Lock className="h-3 w-3" /> System Generated
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {university
                      ? `Created ${new Date(university.createdAt).toLocaleDateString()}`
                      : "This ID will be automatically generated when you create the university"}
                  </p>
                </div>
                <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  Secure · Auto-generated
                </div>
              </div>
            </div>

            {/* University Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                University Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>University Name *</Label>
                  <Input
                    value={formData.universityName}
                    onChange={(e) => handleChange("universityName", e.target.value)}
                    placeholder="e.g., Lahore University of Management Sciences"
                    className="mt-1.5"
                    required
                    disabled={!isEditMode && !!university}
                  />
                </div>
                <div>
                  <Label>University Code *</Label>
                  <Input
                    value={formData.universityCode}
                    onChange={(e) => handleChange("universityCode", e.target.value)}
                    placeholder="e.g., LUMS"
                    className="mt-1.5 uppercase"
                    required
                    disabled={!isEditMode && !!university}
                  />
                </div>
                <div>
                  <Label>Short Name *</Label>
                  <Input
                    value={formData.shortName}
                    onChange={(e) => handleChange("shortName", e.target.value)}
                    placeholder="e.g., LUMS"
                    className="mt-1.5 uppercase"
                    required
                    disabled={!isEditMode && !!university}
                  />
                </div>
                <div>
                  <Label>University Type *</Label>
                  <Select
                    value={formData.universityType}
                    onValueChange={(value) => handleChange("universityType", value)}
                    disabled={!isEditMode && !!university}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Public">Public</SelectItem>
                      <SelectItem value="Private">Private</SelectItem>
                      <SelectItem value="Semi-Government">Semi-Government</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Registration Number</Label>
                  <Input
                    value={formData.registrationNumber}
                    onChange={(e) => handleChange("registrationNumber", e.target.value)}
                    placeholder="e.g., HEC-12345"
                    className="mt-1.5"
                    disabled={!isEditMode && !!university}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Official Email *</Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      value={formData.officialEmail}
                      onChange={(e) => handleChange("officialEmail", e.target.value)}
                      placeholder="info@university.edu.pk"
                      required
                      disabled={!isEditMode && !!university}
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label>Phone Number *</Label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      value={formData.phoneNumber}
                      onChange={(e) => handleChange("phoneNumber", e.target.value)}
                      placeholder="+92-42-35608000"
                      required
                      disabled={!isEditMode && !!university}
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label>Website</Label>
                  <div className="relative mt-1.5">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      value={formData.website}
                      onChange={(e) => handleChange("website", e.target.value)}
                      placeholder="https://www.university.edu.pk"
                      disabled={!isEditMode && !!university}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Country *</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) => handleChange("country", value)}
                    disabled={!isEditMode && !!university}
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
                  <Label>Province *</Label>
                  <Select
                    value={formData.province}
                    onValueChange={(value) => handleChange("province", value)}
                    disabled={!isEditMode && !!university}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Punjab">Punjab</SelectItem>
                      <SelectItem value="Sindh">Sindh</SelectItem>
                      <SelectItem value="KPK">KPK</SelectItem>
                      <SelectItem value="Balochistan">Balochistan</SelectItem>
                      <SelectItem value="Islamabad">Islamabad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>City *</Label>
                  <Select
                    value={formData.city}
                    onValueChange={(value) => handleChange("city", value)}
                    disabled={!isEditMode && !!university}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lahore">Lahore</SelectItem>
                      <SelectItem value="Karachi">Karachi</SelectItem>
                      <SelectItem value="Islamabad">Islamabad</SelectItem>
                      <SelectItem value="Rawalpindi">Rawalpindi</SelectItem>
                      <SelectItem value="Peshawar">Peshawar</SelectItem>
                      <SelectItem value="Quetta">Quetta</SelectItem>
                      <SelectItem value="Multan">Multan</SelectItem>
                      <SelectItem value="Faisalabad">Faisalabad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3">
                  <Label>Address *</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    placeholder="Opposite Sector U, DHA Phase 5, Lahore 54792"
                    className="mt-1.5"
                    required
                    disabled={!isEditMode && !!university}
                  />
                </div>
              </div>
            </div>

            {/* Academic Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Academic Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Academic System</Label>
                  <Select
                    value={formData.academicSystem}
                    onValueChange={(value) => handleChange("academicSystem", value)}
                    disabled={!isEditMode && !!university}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Semester">Semester</SelectItem>
                      <SelectItem value="Quarter">Quarter</SelectItem>
                      <SelectItem value="Annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Grading System</Label>
                  <Select
                    value={formData.gradingSystem}
                    onValueChange={(value) => handleChange("gradingSystem", value)}
                    disabled={!isEditMode && !!university}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GPA">GPA</SelectItem>
                      <SelectItem value="Percentage">Percentage</SelectItem>
                      <SelectItem value="Letter Grade">Letter Grade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Maximum GPA</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.maxGPA}
                    onChange={(e) => handleChange("maxGPA", parseFloat(e.target.value))}
                    className="mt-1.5"
                    disabled={!isEditMode && !!university}
                  />
                </div>
                <div>
                  <Label>Passing GPA</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.passingGPA}
                    onChange={(e) => handleChange("passingGPA", parseFloat(e.target.value))}
                    className="mt-1.5"
                    disabled={!isEditMode && !!university}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            {university && !isEditMode ? (
              <Button
                type="button"
                onClick={() => setIsEditMode(true)}
                className="w-full h-12 gradient-brand text-white border-0 text-base font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all"
              >
                <Pencil className="h-5 w-5 mr-2" />
                Edit University
              </Button>
            ) : (
              <div className="flex gap-3">
                {university && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditMode(false);
                      populateForm(university);
                    }}
                    className="h-12 px-6"
                  >
                    Cancel
                  </Button>
                )}
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
                      {university ? <Save className="h-5 w-5 mr-2" /> : <Building2 className="h-5 w-5 mr-2" />}
                      {university ? "Update University" : "Create University"}
                    </>
                  )}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
  );
}

export default UniversityProfilePage;
