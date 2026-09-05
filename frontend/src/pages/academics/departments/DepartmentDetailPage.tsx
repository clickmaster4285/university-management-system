import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Loader2, Building2, BookOpen, Users, GraduationCap, Layers, Mail, Phone, MapPin, Calendar, Hash, User } from "lucide-react";
import { toast } from "sonner";
import { departmentAPI, type Department } from "@/features/departments";

export default function DepartmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        setLoading(true);
        const res = await departmentAPI.getById(id!);
        if (res?.data && !Array.isArray(res.data)) {
          setDepartment(res.data as Department);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchDepartment();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !department) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="mb-4">The department you are looking for does not exist.</p>
        <Button variant="outline" onClick={() => navigate("/departments")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Departments
        </Button>
      </div>
    );
  }

  const statusBadge = (status: string) => {
    if (status === "Active")
      return <Badge className="bg-green-100 text-green-800 border-0">{status}</Badge>;
    if (status === "Inactive")
      return <Badge variant="secondary">{status}</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  const infoFields = [
    { label: "Department ID", value: department.departmentId || "—" },
    { label: "Name", value: department.name },
    { label: "Code", value: department.code },
    { label: "Status", value: null },
    { label: "Email", value: department.email || "—" },
    { label: "Phone", value: department.phone || "—" },
    { label: "Location", value: department.location || "—" },
    { label: "Established Date", value: department.establishedDate ? new Date(department.establishedDate).toLocaleDateString() : "—" },
  ];

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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{department.name}</h1>
              {statusBadge(department.status || "Active")}
            </div>
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
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mt-6">
        {/* Left column — Info (2 cols wide) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Department Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {infoFields.map((field) => (
                  <div key={field.label} className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {field.label}
                    </p>
                    {field.label === "Status" ? (
                      <div>{statusBadge(department.status || "Active")}</div>
                    ) : (
                      <p className="text-sm font-medium">{field.value}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Head of Department */}
          {department.headId && typeof department.headId === "object" && (
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" /> Head of Department
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</p>
                    <p className="text-sm font-medium">{department.headId.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</p>
                    <p className="text-sm font-medium">{department.headId.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Faculty */}
          {department.facultyId && typeof department.facultyId === "object" && (
            <Card className="glass">
              <CardHeader>
                <CardTitle>Faculty</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</p>
                    <p className="text-sm font-medium">{department.facultyId.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Code</p>
                    <p className="text-sm font-medium font-mono">{department.facultyId.code}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Campus */}
          {department.campusId && typeof department.campusId === "object" && (
            <Card className="glass">
              <CardHeader>
                <CardTitle>Campus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</p>
                  <p className="text-sm font-medium">{department.campusId.name}</p>
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
