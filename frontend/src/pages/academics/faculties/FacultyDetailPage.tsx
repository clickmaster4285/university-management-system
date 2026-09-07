import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { facultyAPI, type Faculty, type CampusAssignment } from "@/features/faculties";
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

  const getCampusName = (campusId: string | { _id: string } | null | undefined): string => {
    if (!campusId) return "—";
    const id = resolveRefId(campusId);
    const found = campuses.find((c) => c._id === id);
    return found?.name || id || "—";
  };

  const campusAssignments: CampusAssignment[] = useMemo(() => {
    if (!faculty) return [];
    return faculty.campusAssignments || [];
  }, [faculty]);

  const resolveHeadName = (headId: string | { _id: string } | null | undefined) => {
    if (!headId) return "—";
    if (typeof headId === "object") {
      return getStaffDisplayName({
        firstName: (headId as { firstName?: string }).firstName || "",
        lastName: (headId as { lastName?: string }).lastName || "",
        fullName: (headId as { name?: string }).name,
      });
    }
    const found = staffMembers.find((m) => m._id === headId);
    return found ? getStaffDisplayName(found) : headId;
  };

  const resolveHeadEmail = (headId: string | { _id: string } | null | undefined) => {
    if (!headId) return "—";
    if (typeof headId === "object") return (headId as { email?: string }).email || "—";
    const found = staffMembers.find((m) => m._id === headId);
    return found?.email || "—";
  };

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

  const statCards = [
    { label: "Departments", value: stats?.totalDepartments ?? 0, icon: Layers, to: "/departments", filter: { facultyId: faculty._id } },
    { label: "Programs", value: stats?.totalPrograms ?? 0, icon: GraduationCap, to: "/programs" },
    { label: "Subjects", value: stats?.totalSubjects ?? 0, icon: BookOpen, to: "/subjects" },
    { label: "Batches", value: stats?.totalBatches ?? 0, icon: Users, to: "/batches" },
  ];

  const formatDate = (value?: string) => {
    if (!value) return "—";
    const d = new Date(value);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
  };

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
            <div className="flex items-start gap-3">
              <Hash className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Faculty ID</p>
                <p className="font-medium font-mono">{faculty.facultyId || faculty._id || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Campuses</p>
                <p className="font-medium">
                  {campusAssignments.length > 0
                    ? campusAssignments.map((a) => getCampusName(a.campusId)).join(", ")
                    : "—"}
                </p>
              </div>
            </div>
          </div>

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
          <h2 className="text-lg font-semibold mb-4">Campus assignments</h2>
          {campusAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No campuses assigned.</p>
          ) : (
            <div className="space-y-4">
              {campusAssignments.map((assignment) => (
                <div key={resolveRefId(assignment.campusId)} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium">{getCampusName(assignment.campusId)}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {campuses.find((c) => c._id === resolveRefId(assignment.campusId))?.campusCode || ""}
                      </p>
                    </div>
                    {assignment.status && (
                      <Badge variant={assignment.status === "Active" ? "default" : "secondary"}>
                        {assignment.status}
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Users className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Head of Faculty</p>
                        <p className="font-medium">{resolveHeadName(assignment.headId)}</p>
                        <p className="text-xs text-muted-foreground">{resolveHeadEmail(assignment.headId)}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium">{assignment.email || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium">{assignment.phone || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CalendarDays className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Established Date</p>
                        <p className="font-medium">{formatDate(assignment.establishedDate)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold mb-4">Statistics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {statCards.map((stat) => (
              <button
                key={stat.label}
                type="button"
                onClick={() => navigate(stat.to, { state: stat.filter })}
                className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors text-left"
              >
                <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-muted">
                  <stat.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}