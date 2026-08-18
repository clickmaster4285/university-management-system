import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { AppShell } from "@/layouts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Plus, 
  Pencil, 
  Trash2,
  Loader2,
  X,
  Save,
  School,
  Star,
  StarOff
} from "lucide-react";
import { campusAPI, Campus, CampusData } from "@/features/campus";
import { getUniversities } from "@/features/university";
import { useAuth } from "@/lib/auth";


// Define provinces outside the component
const PROVINCES = [
  { value: "Punjab", label: "Punjab" },
  { value: "Sindh", label: "Sindh" },
  { value: "KPK", label: "KPK" },
  { value: "Balochistan", label: "Balochistan" },
  { value: "Islamabad", label: "Islamabad" },
  { value: "Gilgit-Baltistan", label: "Gilgit-Baltistan" },
  { value: "Azad Kashmir", label: "Azad Kashmir" },
];

const CITIES: Record<string, string[]> = {
  Punjab: ["Lahore", "Faisalabad", "Rawalpindi", "Multan", "Gujranwala", "Sialkot", "Bahawalpur"],
  Sindh: ["Karachi", "Hyderabad", "Sukkur", "Larkana", "Nawabshah"],
  KPK: ["Peshawar", "Mardan", "Swat", "Abbottabad", "Dera Ismail Khan"],
  Balochistan: ["Quetta", "Gwadar", "Turbat", "Khuzdar"],
  Islamabad: ["Islamabad"],
  "Gilgit-Baltistan": ["Gilgit", "Skardu"],
  "Azad Kashmir": ["Muzaffarabad", "Mirpur"],
};

const CAMPUS_TYPES = [
  { value: "Main Campus", label: "Main Campus" },
  { value: "Branch", label: "Branch" },
  { value: "City Campus", label: "City Campus" },
  { value: "Regional Campus", label: "Regional Campus" },
];

const STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
  { value: "Under Construction", label: "Under Construction" },
];

export function CampusesPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [hasFetched, setHasFetched] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    campusCode: "",
    type: "Branch",
    street: "",
    city: "",
    province: "",
    country: "Pakistan",
    postalCode: "",
    phone: "",
    email: "",
    establishedYear: "",
    description: "",
    status: "Active",
  });

  // Get university ID from user or localStorage fallback
  const universityId = localStorage.getItem('universityId') ||
                      (user as any)?.universityId ||
                      (user as any)?.university?._id ||
                      (user as any)?.university?.id;

  const fetchCampuses = async () => {
    let resolvedUniversityId = localStorage.getItem('universityId') ||
      (user as any)?.universityId ||
      (user as any)?.university?._id ||
      (user as any)?.university?.id;

    if (!resolvedUniversityId) {
      try {
        const universityResponse = await getUniversities();
        const universityList = universityResponse?.data || [];

        if (universityList.length > 0) {
          resolvedUniversityId = universityList[0]._id;
          localStorage.setItem('universityId', resolvedUniversityId);

          if (user) {
            const updatedUser = {
              ...(user as any),
              universityId: resolvedUniversityId,
              university: {
                ...((user as any)?.university || {}),
                id: resolvedUniversityId,
                universityName: universityList[0].universityName,
                universityCode: universityList[0].universityCode,
              },
            };
            setUser(updatedUser as any);
          }
        }
      } catch (error) {
        console.warn("⚠️ No university found in database yet:", error);
      }
    }

    if (!resolvedUniversityId) {
      console.warn("⚠️ No universityId found, skipping fetch");
      setLoading(false);
      setHasFetched(true);
      return;
    }

    try {
      setLoading(true);
 
      const response = await campusAPI.getAll(resolvedUniversityId);
      
      if (response.success && response.data) {
        const campusData = Array.isArray(response.data) ? response.data : [];
        setCampuses(campusData);
      } else {
        setCampuses([]);
      }
    } catch (error) {
      console.error("❌ Failed to fetch campuses:", error);
      toast.error("Failed to load campuses");
      setCampuses([]);
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  };

  useEffect(() => {
    // Only fetch once when component mounts or when universityId changes
    if (!hasFetched) {
      fetchCampuses();
    }
  }, [universityId, hasFetched]);

  // Update cities when province changes
  useEffect(() => {
    if (formData.province) {
      const cities = CITIES[formData.province] || [];
      setAvailableCities(cities);
      if (formData.city && !cities.includes(formData.city)) {
        setFormData(prev => ({ ...prev, city: "" }));
      }
    } else {
      setAvailableCities([]);
      setFormData(prev => ({ ...prev, city: "" }));
    }
  }, [formData.province]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({
      name: "",
      campusCode: "",
      type: "Branch",
      street: "",
      city: "",
      province: "",
      country: "Pakistan",
      postalCode: "",
      phone: "",
      email: "",
      establishedYear: "",
      description: "",
      status: "Active",
    });
    setAvailableCities([]);
    setIsModalOpen(true);
  };

  const openEditModal = (campus: Campus) => {
    setIsEditMode(true);
    setEditingId(campus._id);
    setFormData({
      name: campus.name,
      campusCode: campus.campusCode,
      type: campus.type || "Branch",
      street: campus.address.street,
      city: campus.address.city,
      province: campus.address.province,
      country: campus.address.country || "Pakistan",
      postalCode: campus.address.postalCode || "",
      phone: campus.phone || "",
      email: campus.email || "",
      establishedYear: campus.establishedYear?.toString() || "",
      description: campus.description || "",
      status: campus.status || "Active",
    });
    if (campus.address.province) {
      const cities = CITIES[campus.address.province] || [];
      setAvailableCities(cities);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditingId(null);
    setAvailableCities([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.campusCode || !formData.city || !formData.province) {
      toast.error("Name, Code, City, and Province are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const data: CampusData = {
        universityId: universityId || "",
        name: formData.name,
        campusCode: formData.campusCode,
        type: formData.type || "Branch",
        street: formData.street,
        city: formData.city,
        province: formData.province,
        country: formData.country || "Pakistan",
        postalCode: formData.postalCode || "",
        phone: formData.phone || "",
        email: formData.email || "",
        establishedYear: formData.establishedYear ? parseInt(formData.establishedYear) : undefined,
        description: formData.description || "",
        status: formData.status || "Active",
      };

      let response;
      if (isEditMode && editingId) {
        response = await campusAPI.update(editingId, data);
        toast.success("Campus updated successfully!");
      } else {
        response = await campusAPI.create(data);
        toast.success("Campus created successfully!");
      }

      closeModal();
      setHasFetched(false); // Trigger refetch
      await fetchCampuses();
    } catch (error: any) {
      console.error("Failed to save campus:", error);
      toast.error(error?.message || "Failed to save campus");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    
    try {
      await campusAPI.delete(id);
      toast.success(`Campus ${name} deleted successfully`);
      setHasFetched(false);
      await fetchCampuses();
    } catch (error) {
      console.error("Failed to delete campus:", error);
      toast.error("Failed to delete campus");
    }
  };

  const handleSetMain = async (id: string) => {
    try {
      await campusAPI.setMain(id);
      toast.success("Main campus updated successfully");
      setHasFetched(false);
      await fetchCampuses();
    } catch (error: any) {
      console.error("Failed to set main campus:", error);
      toast.error(error?.message || "Failed to set main campus");
    }
  };

  // Show loading state while fetching
  if (loading) {
    return (
      <AppShell title="Campuses" subtitle="Loading campuses...">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-muted-foreground">Loading campuses...</span>
        </div>
      </AppShell>
    );
  }

  // Show message if no university ID found
  if (!universityId) {
    return (
      <AppShell title="Campuses" subtitle="No university found">
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <School className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No University Found</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Please create a university first before adding campuses.
            </p>
            <Button className="mt-4" onClick={() => navigate("/university" )}>
              <Plus className="h-4 w-4 mr-2" />
              Create University
            </Button>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Campuses"
      subtitle={`${campuses.length} campuses found`}
      actions={
        <Button 
          onClick={openAddModal}
          className="gradient-brand text-white border-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Campus
        </Button>
      }
    >
      {campuses.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <School className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Campuses Found</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Create your first campus to get started
            </p>
            <Button className="mt-4" onClick={openAddModal}>
              <Plus className="h-4 w-4 mr-2" />
              Add Campus
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campuses.map((campus) => (
            <Card key={campus._id} className={`hover:shadow-lg transition-shadow ${campus.isMainCampus ? 'border-primary border-2' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg gradient-brand flex items-center justify-center text-white">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {campus.name}
                        {campus.isMainCampus && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">{campus.campusCode}</p>
                        <Badge variant="outline" className="text-[10px]">
                          {campus.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {!campus.isMainCampus && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleSetMain(campus._id)}
                        title="Set as Main Campus"
                      >
                        <StarOff className="h-3 w-3" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => openEditModal(campus)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDelete(campus._id, campus.name)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{campus.address.city}, {campus.address.province}</span>
                </div>
                {campus.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{campus.phone}</span>
                  </div>
                )}
                {campus.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span>{campus.email}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    campus.status === 'Active' 
                      ? 'bg-green-100 text-green-700' 
                      : campus.status === 'Inactive'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {campus.status}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      ID: {campus.campusId}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-visible">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <School className="h-5 w-5 text-primary" />
                {isEditMode ? "Edit Campus" : "Add New Campus"}
              </h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={closeModal}
                className="h-8 w-8 p-0 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Form fields remain the same */}
                <div className="md:col-span-2">
                  <Label htmlFor="name">Campus Name *</Label>
                  <Input 
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Main Campus"
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="campusCode">Campus Code *</Label>
                  <Input 
                    id="campusCode"
                    value={formData.campusCode}
                    onChange={(e) => handleChange("campusCode", e.target.value.toUpperCase())}
                    placeholder="MAIN"
                    className="mt-1.5 uppercase"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">Unique code for this campus</p>
                </div>
                <div>
                  <Label htmlFor="type">Campus Type</Label>
                  <Select 
                    value={formData.type}
                    onValueChange={(value) => handleChange("type", value)}
                  >
                    <SelectTrigger id="type" className="mt-1.5">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CAMPUS_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mt-2 mb-3">Address</h3>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="street">Street Address *</Label>
                  <Input 
                    id="street"
                    value={formData.street}
                    onChange={(e) => handleChange("street", e.target.value)}
                    placeholder="123 University Road"
                    className="mt-1.5"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="province">Province *</Label>
                  <Select 
                    value={formData.province}
                    onValueChange={(value) => {
                      handleChange("province", value);
                      handleChange("city", "");
                    }}
                  >
                    <SelectTrigger id="province" className="mt-1.5">
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVINCES.map((province) => (
                        <SelectItem key={province.value} value={province.value}>
                          {province.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Select 
                    value={formData.city}
                    onValueChange={(value) => handleChange("city", value)}
                  >
                    <SelectTrigger id="city" className="mt-1.5">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCities.length === 0 ? (
                        <SelectItem value="no-city" disabled>
                          {formData.province ? "No cities available" : "Select province first"}
                        </SelectItem>
                      ) : (
                        availableCities.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input 
                    id="country"
                    value={formData.country}
                    onChange={(e) => handleChange("country", e.target.value)}
                    placeholder="Pakistan"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input 
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => handleChange("postalCode", e.target.value)}
                    placeholder="54000"
                    className="mt-1.5"
                  />
                </div>

                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mt-2 mb-3">Contact Information</h3>
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="phone"
                      className="pl-9"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder="+92-42-1234567"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email"
                      className="pl-9"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="campus@university.edu.pk"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-muted-foreground mt-2 mb-3">Additional Information</h3>
                </div>
                <div>
                  <Label htmlFor="establishedYear">Established Year</Label>
                  <Input 
                    id="establishedYear"
                    type="number"
                    value={formData.establishedYear}
                    onChange={(e) => handleChange("establishedYear", e.target.value)}
                    placeholder="2020"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status}
                    onValueChange={(value) => handleChange("status", value)}
                  >
                    <SelectTrigger id="status" className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Input 
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    placeholder="Brief description of the campus"
                    className="mt-1.5"
                  />
                </div>
              </div>

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
                      {isEditMode ? 'Update Campus' : 'Create Campus'}
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

export default CampusesPage;
