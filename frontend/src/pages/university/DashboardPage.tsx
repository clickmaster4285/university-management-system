// src/pages/university/UniversityDashboardPage.tsx
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { AppShell } from "@/layouts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  Plus, 
  Pencil, 
  Trash2,
  Loader2,
  GraduationCap,
  Users,
  School,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { getUniversities, deleteUniversity, University, UniversitiesListResponse } from "@/features/university";
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

export function UniversityDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Helper function to extract universities from response with proper typing
  const extractUniversities = (response: UniversitiesListResponse | any): University[] => {
    console.log("📊 Extracting universities from response:", response);
    
    // If response is null or undefined
    if (!response) return [];
    
    // If response is already an array
    if (Array.isArray(response)) {
      console.log("✅ Response is an array with", response.length, "items");
      return response;
    }
    
    // If response has data property
    if (response.data) {
      if (Array.isArray(response.data)) {
        console.log("✅ Response.data is an array with", response.data.length, "items");
        return response.data;
      }
      // If response.data has universities property
      if (response.data.universities && Array.isArray(response.data.universities)) {
        console.log("✅ Response.data.universities is an array with", response.data.universities.length, "items");
        return response.data.universities;
      }
      // If response.data has data property (nested)
      if (response.data.data && Array.isArray(response.data.data)) {
        console.log("✅ Response.data.data is an array with", response.data.data.length, "items");
        return response.data.data;
      }
    }
    
    // If response has universities property
    if (response.universities && Array.isArray(response.universities)) {
      console.log("✅ Response.universities is an array with", response.universities.length, "items");
      return response.universities;
    }
    
    // If response has results property
    if (response.results && Array.isArray(response.results)) {
      console.log("✅ Response.results is an array with", response.results.length, "items");
      return response.results;
    }
    
    // If response has items property
    if (response.items && Array.isArray(response.items)) {
      console.log("✅ Response.items is an array with", response.items.length, "items");
      return response.items;
    }
    
    // ✅ Fix: Check for any array property with proper type guard
    const keys = Object.keys(response) as (keyof typeof response)[];
    for (const key of keys) {
      const value = response[key];
      if (Array.isArray(value) && value.length > 0) {
        const firstItem = value[0];
        // Check if it looks like a university object
        if (firstItem && (firstItem.universityName || firstItem.universityCode || firstItem._id)) {
          console.log(`✅ Found universities in response.${String(key)} with`, value.length, "items");
          return value;
        }
      }
    }
    
    console.warn("⚠️ No universities found in response");
    return [];
  };

  const fetchUniversities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getUniversities();
      console.log("📊 Full API Response:", response);
      
      // ✅ Extract universities using the helper function
      const universityData = extractUniversities(response);
      
      console.log("✅ Processed universities:", universityData);
      setUniversities(universityData);
      
      if (universityData.length === 0) {
        toast.info("No universities found in the system");
      }
      
    } catch (error: any) {
      console.error("❌ Failed to fetch universities:", error);
      const errorMessage = error?.message || "Failed to load universities";
      setError(errorMessage);
      toast.error(errorMessage);
      setUniversities([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUniversities();
    toast.success("Universities refreshed");
  };

  useEffect(() => {
    fetchUniversities();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteUniversity(id);
      toast.success(`University "${name}" deleted successfully`);
      await fetchUniversities();
    } catch (error: any) {
      console.error("Failed to delete university:", error);
      toast.error(error?.message || "Failed to delete university");
    } finally {
      setDeletingId(null);
    }
  };

  const getCampusCount = (university: University): number => {
    return university.campuses?.length || university.campusCount || 0;
  };

  const getStudentCount = (university: University): number => {
    if (!university.campuses) return university.userCount || 0;
    return university.campuses.reduce((total, campus) => {
      return total + (campus.students?.length || 0);
    }, 0);
  };

  // Show loading state
  if (loading) {
    return (
      <AppShell title="Universities" subtitle="Loading universities...">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading universities...</span>
        </div>
      </AppShell>
    );
  }

  // Show error state
  if (error) {
    return (
      <AppShell 
        title="Universities" 
        subtitle="Error loading data"
        actions={
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        }
      >
        <Card className="border-2 border-destructive/20 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-16 w-16 text-destructive mb-4" />
            <h3 className="text-lg font-semibold text-destructive">Failed to Load Universities</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md text-center">
              {error}
            </p>
            <div className="flex gap-3 mt-4">
              <Button 
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Retry
              </Button>
              <Button 
                onClick={() => navigate("/university/create")}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create University
              </Button>
            </div>
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="University Dashboard"
      subtitle={`${universities.length} universities registered`}
      actions={
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => navigate("/university/create")}
            className="gradient-brand text-white border-0 shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add University
          </Button>
        </div>
      }
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Universities</p>
                <p className="text-2xl font-bold mt-1">{universities.length}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Campuses</p>
                <p className="text-2xl font-bold mt-1">
                  {universities.reduce((acc, uni) => acc + getCampusCount(uni), 0)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <School className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold mt-1">
                  {universities.reduce((acc, uni) => acc + getStudentCount(uni), 0)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Universities</p>
                <p className="text-2xl font-bold mt-1">
                  {universities.filter(u => u.status === 'Active').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* University Cards Grid */}
      {universities.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <GraduationCap className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No Universities Found</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Create your first university to get started with the system
            </p>
            <Button className="mt-4" onClick={() => navigate("/university/create")}>
              <Plus className="h-4 w-4 mr-2" />
              Create University
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {universities.map((university) => {
            // ✅ Safe ID handling
            const universityId = university._id || university.universityId;
            
            return (
              <Card 
                key={universityId} 
                className="border shadow-sm hover:shadow-md transition-all duration-200 group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-xl gradient-brand flex items-center justify-center text-white shadow-lg shadow-primary/20 flex-shrink-0">
                        <GraduationCap className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-semibold line-clamp-1">
                          {university.universityName || 'Unnamed University'}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            {university.universityCode || 'N/A'}
                          </span>
                          <TypeBadge type={university.universityType} />
                          <StatusBadge status={university.status} />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="line-clamp-1">
                      {university.address?.city || university.city || 'N/A'}, 
                      {university.address?.province || university.province || 'N/A'}
                    </span>
                  </div>

                  {/* Contact */}
                  {university.officialEmail && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="line-clamp-1">{university.officialEmail}</span>
                    </div>
                  )}

                  {university.phoneNumber && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{university.phoneNumber}</span>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <School className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium">
                          {getCampusCount(university)} Campuses
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium">
                          {getStudentCount(university)} Students
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        ID: {university.universityId || university._id?.slice(0, 8) || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/university/${universityId}`)}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1.5" />
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/university/${universityId}/campuses`)}
                    >
                      <School className="h-3.5 w-3.5 mr-1.5" />
                      Campuses
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0"
                      onClick={() => navigate(`/university/${universityId}/edit`)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(universityId, university.universityName)}
                      disabled={deletingId === universityId}
                    >
                      {deletingId === universityId ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

export default UniversityDashboardPage;