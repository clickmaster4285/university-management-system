import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { facultyAPI, type Faculty } from "@/features/faculties";
import { campusAPI, type Campus } from "@/features/campus";
import { staffMemberAPI, getStaffDisplayName, type StaffMember } from "@/features/staffMembers";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2, Layers, BookOpen, Users, GraduationCap,
  ArrowLeft, Pencil, Loader2, Mail, Phone, CalendarDays, Hash
} from "lucide-react";
import { toast } from "sonner";

const getFacultyId = (faculty: Faculty) => faculty._id || faculty.facultyId || "";

const resolveRefId = (value: string | { _id: string } | null | undefined): string => {
  if (!value) return "";
  if (typeof value === "object") return value._id || "";
  return value;
};

export default function FacultyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [stats, setStats] = useState<{
    totalDepartments?: number;
    totalPrograms?: number;
    totalSubjects?: number;
    totalBatches?: number;
  } | null>(null);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchFaculty = async () => {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [res, campRes, staffRes] = await Promise.all([
          facultyAPI.getById(id),
          campusAPI.getAll(),
          staffMemberAPI.listAcademic(),
        ]);
        if (res?.data) {
          setFaculty(res.data);
          if (res.data.stats) setStats(res.data.stats);
        } else {
          setNotFound(true);
        }
        setCampuses(Array.isArray(campRes?.data) ? campRes.data : []);
        setStaffMembers(staffRes);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchFaculty();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !faculty) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="mb-4">The faculty you are looking for does not exist.</p>
        <Button variant="outline" onClick={() => navigate("/faculties")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Faculties
        </Button>
      </div>
    );
  }

  const getCampusName = (campus: Faculty["campusId"]) => {
    if (!campus) return "—";
    if (typeof campus === "object") return campus.name;
    const found = campuses.find(c => c._id === campus);
    return found?.name || campus;
  };

  const getHeadName = (head: Faculty["headId"]) => {
    if (!head) return "—";
    if (typeof head === "object") {
      return getStaffDisplayName({
        firstName: (head as { firstName?: string }).firstName || "",
        lastName: (head as { lastName?: string }).lastName || "",
        fullName: (head as { name?: string }).name,
      });
    }
    const found = staffMembers.find(m => m._id === head);
    return found ? getStaffDisplayName(found) : head;
  };

  const getHeadEmail = (head: Faculty["headId"]) => {
    if (!head) return "—";
    if (typeof head === "object") return (head as { email?: string }).email || "—";
    const found = staffMembers.find(m => m._id === head);
    return found?.email || "—";
  };

  const statCards = [
    { label: "Departments", value: stats?.totalDepartments ?? 0, icon: Layers, tone: "brand" as const },
    { label: "Programs", value: stats?.totalPrograms ?? 0, icon: GraduationCap, tone: "info" as const },
    { label: "Subjects", value: stats?.totalSubjects ?? 0, icon: BookOpen, tone: "success" as const },
    { label: "Batches", value: stats?.totalBatches ?? 0, icon: Users, tone: "warning" as const },
  ];

  const infoFields: Array<{ label: string; value: string | null; icon: typeof Hash; className?: string; isBadge?: boolean }> = [
    { label: "Faculty ID", value: faculty.facultyId || faculty._id || "—", icon: Hash },
    { label: "Name", value: faculty.name, icon: Building2 },
    { label: "Code", value: faculty.code, icon: Hash, className: "font-mono font-semibold" },
    { label: "Status", value: null, icon: Building2, isBadge: true },
    { label: "Email", value: faculty.email || "—", icon: Mail },
    { label: "Phone", value: faculty.phone || "—", icon: Phone },
    { label: "Established Date", value: faculty.establishedDate ? new Date(faculty.establishedDate).toLocaleDateString() : "—", icon: CalendarDays },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/faculties")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{faculty.name}</h1>
              <Badge variant={faculty.status === "Active" ? "default" : "secondary"}>
                {faculty.status || "Active"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground font-mono">{faculty.code}</p>
          </div>
        </div>
        <Button onClick={() => navigate(`/faculties/edit/${getFacultyId(faculty)}`)}>
          <Pencil className="h-4 w-4 mr-2" /> Edit
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {infoFields.map((field) => (
              <div key={field.label} className="flex items-start gap-3">
                <field.icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{field.label}</p>
                  {field.isBadge ? (
                    <Badge variant={faculty.status === "Active" ? "default" : "secondary"} className="mt-1">
                      {faculty.status || "Active"}
                    </Badge>
                  ) : (
                    <p className={`font-medium ${field.className || ""}`}>{field.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {(faculty.headId || faculty.campusId) && (
            <div className="mt-6 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-4">
              {faculty.headId && (
                <div className="flex items-start gap-3">
                  <Users className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Head of Faculty</p>
                    <p className="font-medium">{getHeadName(faculty.headId)}</p>
                    <p className="text-xs text-muted-foreground">{getHeadEmail(faculty.headId)}</p>
                  </div>
                </div>
              )}
              {faculty.campusId && (
                <div className="flex items-start gap-3">
                  <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Campus</p>
                    <p className="font-medium">{getCampusName(faculty.campusId)}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {faculty.description && (
            <div className="mt-6 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{faculty.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Statistics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {statCards.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-muted">
                  <stat.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
