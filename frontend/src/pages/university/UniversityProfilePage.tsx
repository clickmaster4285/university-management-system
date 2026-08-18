import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
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
  User, 
  Lock, 
  Sparkles, 
  ShieldCheck,
  GraduationCap,
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft
} from "lucide-react";
import { createUniversity } from "@/lib/api/university";


export function UniversityProfilePage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(true);
  const [showConfirmPassword, setShowConfirmPassword] = useState(true);
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
    firstName: "",
    lastName: "",
    adminEmail: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);
    try {
      const response = await createUniversity(formData);
      toast.success("University created successfully!");
      
      if (response.university && response.university.id) {
        localStorage.setItem('universityId', response.university.id);
      }
      
      if (response.user && setUser) {
        const userData = {
          id: response.user.id,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          email: response.user.email,
          role: response.user.role,
          universityId: response.user.universityId,
          name: `${response.user.firstName} ${response.user.lastName}`,
        };
        setUser(userData);
      }
      
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
      }
      
      navigate({ to: "/app/university" });
    } catch (error: any) {
      toast.error(error?.message || "Failed to create university");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AppShell
      title="Create University"
      subtitle="Register a new university in the ScholarOS ecosystem"
      actions={
        <Button 
          variant="outline" 
          onClick={() => navigate({ to: "/app/university" })}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Universities
        </Button>
      }
    >
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
                      UNI-000001
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Lock className="h-3 w-3" /> System Generated
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This ID will be automatically generated when you create the university
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
                  />
                </div>
                <div>
                  <Label>University Type *</Label>
                  <Select 
                    value={formData.universityType}
                    onValueChange={(value) => handleChange("universityType", value)}
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
                  />
                </div>
              </div>
            </div>

            {/* Administrator Account */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Administrator Account
              </h3>
              <div className="glass p-6 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>First Name *</Label>
                    <Input 
                      value={formData.firstName}
                      onChange={(e) => handleChange("firstName", e.target.value)}
                      placeholder="Ahmed"
                      className="mt-1.5"
                      required
                    />
                  </div>
                  <div>
                    <Label>Last Name *</Label>
                    <Input 
                      value={formData.lastName}
                      onChange={(e) => handleChange("lastName", e.target.value)}
                      placeholder="Khan"
                      className="mt-1.5"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Email *</Label>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        className="pl-9"
                        value={formData.adminEmail}
                        onChange={(e) => handleChange("adminEmail", e.target.value)}
                        placeholder="admin@university.edu.pk"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Password *</Label>
                    <div className="relative mt-1.5">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        className="pl-9 pr-10"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label>Confirm Password *</Label>
                    <div className="relative mt-1.5">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        className="pl-9 pr-10"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => handleChange("confirmPassword", e.target.value)}
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-12 gradient-brand text-white border-0 text-base font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Creating University...
                </>
              ) : (
                <>
                  <Building2 className="h-5 w-5 mr-2" />
                  Create University
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AppShell>
  );
}

export default UniversityProfilePage;
