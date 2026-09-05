import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { getUniversity, type University } from "@/features/university";
import { toast } from "sonner";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  GraduationCap,
  Loader2,
  Pencil,
  School,
  Layers,
  BookMarked,
  Users,
  Briefcase,
  ShieldCheck,
  Lock,
  Plus,
  Sparkles,
} from "lucide-react";

export function UniversityViewPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [university, setUniversity] = useState<University | null>(null);

  useEffect(() => {
    fetchUniversity();
  }, []);

  const fetchUniversity = async () => {
    try {
      setLoading(true);
      const res = await getUniversity();
      if (res?.data) {
        setUniversity(res.data);
        localStorage.setItem("universityId", res.data._id);
      }
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        toast.error("Failed to load university");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!university) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
          <Building2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold">No University Found</h2>
        <p className="text-muted-foreground text-sm text-center max-w-md">
          Register your university to get started with ScholarOS.
        </p>
        <Button
          onClick={() => navigate("/university/create")}
          className="gradient-brand text-white border-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create University
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border shadow-sm">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-brand-2/20 flex items-center justify-center">
                <GraduationCap className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{university.universityName}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">{university.universityCode}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">{university.shortName}</span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => navigate("/university/edit")}
              className="gradient-brand text-white border-0 shadow-lg shadow-primary/30"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* University Info */}
      <Card className="border shadow-sm">
        <CardContent className="p-6 md:p-8 space-y-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            University Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoField label="University ID" value={university.universityId} icon={<Lock className="h-3.5 w-3.5" />} />
            <InfoField label="Name" value={university.universityName} />
            <InfoField label="Code" value={university.universityCode} />
            <InfoField label="Short Name" value={university.shortName} />
            <InfoField label="Type" value={university.universityType} />
            <InfoField label="Registration Number" value={university.registrationNumber || "—"} />
          </div>
        </CardContent>
      </Card>

      {/* Contact */}
      <Card className="border shadow-sm">
        <CardContent className="p-6 md:p-8 space-y-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoField label="Email" value={university.officialEmail} icon={<Mail className="h-3.5 w-3.5" />} />
            <InfoField label="Phone" value={university.phoneNumber} icon={<Phone className="h-3.5 w-3.5" />} />
            <InfoField label="Website" value={university.website || "—"} icon={<Globe className="h-3.5 w-3.5" />} />
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card className="border shadow-sm">
        <CardContent className="p-6 md:p-8 space-y-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Location
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoField label="City" value={university.address?.city || "—"} />
            <InfoField label="Province" value={university.address?.province || "—"} />
            <InfoField label="Country" value={university.address?.country || "—"} />
          </div>
          {university.address?.street && (
            <div className="pt-2">
              <InfoField label="Address" value={university.address.street} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Academic Settings */}
      <Card className="border shadow-sm">
        <CardContent className="p-6 md:p-8 space-y-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Academic Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <InfoField label="Academic System" value={university.academicSettings?.academicSystem || "—"} />
            <InfoField label="Grading System" value={university.academicSettings?.gradingSystem || "—"} />
            <InfoField label="Maximum GPA" value={university.academicSettings?.maxGPA?.toString() || "—"} />
            <InfoField label="Passing GPA" value={university.academicSettings?.passingGPA?.toString() || "—"} />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {university.stats && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Overview
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Campuses" value={university.stats.totalCampuses} icon={School} onClick={() => navigate("/campuses")} />
            <KpiCard label="Faculties" value={university.stats.totalFaculties} icon={Building2} onClick={() => navigate("/faculties")} />
            <KpiCard label="Departments" value={university.stats.totalDepartments} icon={Layers} onClick={() => navigate("/departments")} />
            <KpiCard label="Programs" value={university.stats.totalPrograms} icon={BookMarked} onClick={() => navigate("/programs")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Students" value={university.stats.totalStudents} icon={GraduationCap} onClick={() => navigate("/students")} />
            <KpiCard label="Teachers" value={university.stats.totalTeachers} icon={Users} onClick={() => navigate("/staff")} />
            <KpiCard label="Staff" value={university.stats.totalStaff} icon={Briefcase} onClick={() => navigate("/staff")} />
            <KpiCard label="Admins" value={university.stats.totalAdmins} icon={ShieldCheck} onClick={() => navigate("/access")} />
          </div>
        </div>
      )}
    </div>
  );
}

function InfoField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className="flex items-center gap-2">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export default UniversityViewPage;
