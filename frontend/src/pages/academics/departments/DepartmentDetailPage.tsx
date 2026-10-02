import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  BookOpen,
  Layers,
  Users,
  GraduationCap,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { departmentAPI, type Department } from "@/features/departments";

export default function DepartmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        setLoading(true);
        const response = await departmentAPI.getById(id!);
        setDepartment(response.data);
      } catch {
        toast.error("Failed to load department");
        navigate("/departments");
      } finally {
        setLoading(false);
      }
    };
    fetchDepartment();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!department?._id) return;
    if (!window.confirm("Are you sure you want to delete this department?")) return;
    try {
      await departmentAPI.delete(department._id);
      toast.success("Department deleted successfully");
      navigate("/departments");
    } catch {
      toast.error("Failed to delete department");
    }
  };

  const statusBadge = (status: string) => {
    if (status === "Active")
      return <Badge className="bg-green-100 text-green-800 border-0">{status}</Badge>;
    if (status === "Inactive")
      return <Badge variant="secondary">{status}</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  if (loading) {
    return <div className="flex justify-center py-20">Loading...</div>;
  }

  if (!department) return null;

  const statCards = department.stats
    ? [
        { label: "Programs", value: department.stats.totalPrograms, icon: BookOpen, to: "/programs", filter: { departmentId: department._id } },
        { label: "Subjects", value: department.stats.totalSubjects, icon: Layers, to: "/subjects", filter: { departmentId: department._id } },
        { label: "Teachers", value: department.stats.totalTeachers, icon: Users, to: "/staff" },
        { label: "Batches", value: department.stats.totalBatches, icon: GraduationCap, to: "/batches", filter: { departmentId: department._id } },
        { label: "Offerings", value: department.stats.totalOfferings, icon: Building2, to: "/offerings" },
      ]
    : [];

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => navigate("/departments")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{department.name}</h1>
            <p className="text-sm text-muted-foreground font-mono">{department.code}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="gradient-brand text-white border-0"
            onClick={() => navigate(`/departments/edit/${department._id}`)}
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mt-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Basic Info */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Department Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Department ID</p>
                  <p className="text-sm font-medium">{department.departmentId || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</p>
                  <p className="text-sm font-medium">{department.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Code</p>
                  <p className="text-sm font-medium font-mono">{department.code}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Faculties */}
          {(() => {
            const allFaculties: Array<{ name: string; code: string }> = [];
            for (const f of department.facultyIds || []) {
              if (typeof f === "object" && !allFaculties.some((x) => x.code === f.code)) {
                allFaculties.push({ name: f.name, code: f.code });
              }
            }
            if (allFaculties.length === 0) return null;
            return (
              <Card className="glass">
                <CardHeader>
                  <CardTitle>{allFaculties.length === 1 ? "Faculty" : "Faculties"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {allFaculties.map((fac) => (
                      <div key={fac.code} className="flex items-center gap-3">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{fac.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{fac.code}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Per-Campus Assignments */}
          {(department.campusAssignments || []).length > 0 && (
            <Card className="glass">
              <CardHeader>
                <CardTitle>Campus Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {(department.campusAssignments || []).map((assignment, idx) => {
                    const campusName = typeof assignment.campus === "object" ? assignment.campus.name : "";
                    const campusCode = typeof assignment.campus === "object" ? assignment.campus.campusCode : "";
                    const headName = assignment.headId && typeof assignment.headId === "object"
                      ? `${(assignment.headId as any).firstName || ""} ${(assignment.headId as any).lastName || ""}`.trim() || (assignment.headId as any).name || null
                      : null;
                    const headEmail = assignment.headId && typeof assignment.headId === "object"
                      ? assignment.headId.email
                      : null;

                    return (
                      <div key={idx} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-primary" />
                            <span className="font-semibold">{campusName}</span>
                            <span className="text-xs text-muted-foreground font-mono">{campusCode}</span>
                          </div>
                          {statusBadge(assignment.status || "Active")}
                        </div>

                        {headName && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-medium">{headName}</span>
                            {headEmail && <span className="text-muted-foreground">({headEmail})</span>}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {assignment.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{assignment.email}</span>
                            </div>
                          )}
                          {assignment.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{assignment.phone}</span>
                            </div>
                          )}
                          {assignment.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{assignment.location}</span>
                            </div>
                          )}
                          {assignment.establishedDate && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{new Date(assignment.establishedDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          {department.description && (
            <Card className="glass">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {department.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column — Statistics */}
        <div className="space-y-4">
          {statCards.length > 0 && (
            <Card className="glass">
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {statCards.map((stat) => (
                    <button
                      key={stat.label}
                      type="button"
                      onClick={() => navigate(stat.to, { state: stat.filter })}
                      className="rounded-lg border bg-muted/30 p-3 text-center hover:bg-muted/60 transition-colors"
                    >
                      <stat.icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-lg font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
