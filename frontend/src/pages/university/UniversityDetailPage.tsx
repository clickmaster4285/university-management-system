// src/pages/university/UniversityDetailsPage.tsx
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { AppShell } from "@/layouts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  Globe,
  GraduationCap,
  Users,
  School,
  ArrowLeft,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  UserCheck,
  AlertCircle
} from "lucide-react";
import { getUniversityById, deleteUniversity, University } from "@/features/university";
import { useAuth } from "@/lib/auth";

// Status badge component
const StatusBadge = ({ status }: { status?: string }) => {
  const statusMap: Record<string, { color: string; icon: React.ReactNode }> = {
    'Active': { color: 'bg-green-100 text-green-700', icon: <CheckCircle className="h-3 w-3" /> },
    'Inactive': { color: 'bg-red-100 text-red-700', icon: <XCircle className="h-3 w-3" /> },
    'Pending': { color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="h-3 w-3" /> },
    'Suspended': { color: 'bg-orange-100 text-orange-700', icon: <Clock className="h-3 w-3" /> },
  };

  const defaultStatus = statusMap[status || 'Pending'] || statusMap['Pending'];
  
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${defaultStatus.color}`}>
      {defaultStatus.icon}
      {status || 'Pending'}
    </span>
  );
};

// University Type Badge
const TypeBadge = ({ type }: { type?: string }) => {
  const typeMap: Record<string, string> = {
    'Public': 'bg-blue-100 text-blue-700',
    'Private': 'bg-purple-100 text-purple-700',
    'Semi-Government': 'bg-indigo-100 text-indigo-700',
  };

  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${typeMap[type || ''] || 'bg-gray-100 text-gray-700'}`}>
      {type || 'N/A'}
    </span>
  );
};

export function UniversityDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [university, setUniversity] = useState<University | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUniversity = async () => {
    if (!id) {
      setError("University ID is required");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await getUniversityById(id);
      console.log("📊 University Details Response:", response);
      
      if (response?.data) {
        setUniversity(response.data);
      } else {
        setError("University not found");
      }
    } catch (error: any) {
      console.error("❌ Failed to fetch university:", error);
      const errorMessage = error?.message || "Failed to load university details";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUniversity();
  }, [id]);

  const handleDelete = async () => {
    if (!university) return;
    
    if (!confirm(`Are you sure you want to delete "${university.universityName}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    try {
      await deleteUniversity(university._id || university.universityId);
      toast.success(`University "${university.universityName}" deleted successfully`);
      navigate("/universities");
    } catch (error: any) {
      console.error("Failed to delete university:", error);
      toast.error(error?.message || "Failed to delete university");
    } finally {
      setDeleting(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <AppShell title="University Details" subtitle="Loading...">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading university details...</span>
        </div>
      </AppShell>
    );
  }

  // Show error state
  if (error || !university) {
    return (
      <AppShell title="University Details" subtitle="Error loading data">
        <Card className="border-2 border-destructive/20 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-16 w-16 text-destructive mb-4" />
            <h3 className="text-lg font-semibold text-destructive">Failed to Load University</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md text-center">
              {error || "University not found"}
            </p>
            <div className="flex gap-3 mt-4">
              <Button 
                variant="outline"
                onClick={() => navigate("/universities")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Universities
              </Button>
              <Button 
                onClick={fetchUniversity}
              >
                <Loader2 className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const universityId = university._id || university.universityId;

  return (
    <AppShell
      title={university.universityName}
      subtitle={`${university.universityCode} • ${university.universityType}`}
      actions={
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate("/universities")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate(`/university/${universityId}/edit`)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Status and Quick Info */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <StatusBadge status={university.status} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <School className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Campuses</p>
                  <p className="font-semibold">{university.campuses?.length || university.campusCount || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Students</p>
                  <p className="font-semibold">{university.userCount || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Joined</p>
                  <p className="font-semibold text-sm">
                    {university.createdAt ? new Date(university.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* University Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">University Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">University Name</p>
                  <p className="text-base font-semibold">{university.universityName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">University Code</p>
                  <p className="text-base font-semibold">{university.universityCode}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Short Name</p>
                  <p className="text-base font-semibold">{university.shortName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <TypeBadge type={university.universityType} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Registration Number</p>
                  <p className="text-base">{university.registrationNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">University ID</p>
                  <p className="text-base font-mono text-sm">{university.universityId || university._id}</p>
                </div>
              </div>

              {/* Address */}
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">Address</p>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p>{university.address?.street || 'N/A'}</p>
                    <p>
                      {university.address?.city || university.city || 'N/A'}, 
                      {university.address?.province || university.province || 'N/A'}, 
                      {university.address?.country || university.country || 'Pakistan'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact & Academic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact & Academic Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Contact */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Contact</p>
                {university.officialEmail && (
                  <div className="flex items-center gap-2 text-sm mb-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${university.officialEmail}`} className="hover:text-primary">
                      {university.officialEmail}
                    </a>
                  </div>
                )}
                {university.phoneNumber && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${university.phoneNumber}`} className="hover:text-primary">
                      {university.phoneNumber}
                    </a>
                  </div>
                )}
                {university.website && (
                  <div className="flex items-center gap-2 text-sm mt-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a href={university.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                      {university.website}
                    </a>
                  </div>
                )}
              </div>

              {/* Academic Settings */}
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground mb-2">Academic Settings</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">System</span>
                    <span className="font-medium">{university.academicSettings?.academicSystem || university.academicSystem || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Grading</span>
                    <span className="font-medium">{university.academicSettings?.gradingSystem || university.gradingSystem || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max GPA</span>
                    <span className="font-medium">{university.academicSettings?.maxGPA || university.maxGPA || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Passing GPA</span>
                    <span className="font-medium">{university.academicSettings?.passingGPA || university.passingGPA || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Administrator */}
              {university.administrator && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Administrator</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {university.administrator.firstName} {university.administrator.lastName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{university.administrator.email}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Campuses List */}
        {university.campuses && university.campuses.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Campuses</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/university/${universityId}/campuses`)}
                >
                  <School className="h-4 w-4 mr-2" />
                  View All Campuses
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {university.campuses.map((campus) => (
                  <div key={campus._id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <School className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{campus.name}</p>
                      <p className="text-xs text-muted-foreground">{campus.campusCode}</p>
                      <p className="text-xs text-muted-foreground">{campus.address?.city}</p>
                      {campus.isMainCampus && (
                        <Badge variant="default" className="mt-1 text-[10px]">Main Campus</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

export default UniversityDetailsPage;