import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Loader2, Star } from "lucide-react";
import {
  Building2,
  Layers,
  BookMarked,
  BookOpen,
  Users,
  GraduationCap,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Hash,
  School,
} from "lucide-react";
import { campusAPI, type Campus } from "@/features/campus";

export default function CampusDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campus, setCampus] = useState<Campus | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchCampus = async () => {
      try {
        setLoading(true);
        const res = await campusAPI.getById(id!);
        if (res?.data && !Array.isArray(res.data)) {
          setCampus(res.data as Campus);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchCampus();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !campus) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="mb-4">The campus you are looking for does not exist.</p>
        <Button variant="outline" onClick={() => navigate("/campuses")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Campuses
        </Button>
      </div>
    );
  }

  const statusBadge = (status: string) => {
    if (status === "Active")
      return <Badge className="bg-green-100 text-green-800 border-0">{status}</Badge>;
    if (status === "Inactive")
      return <Badge variant="secondary">{status}</Badge>;
    return (
      <Badge variant="outline" className="text-yellow-600 border-yellow-300">
        {status}
      </Badge>
    );
  };

  const infoFields = [
    { label: "Campus ID", value: campus.campusId, icon: Hash },
    { label: "Name", value: campus.name, icon: School },
    { label: "Code", value: campus.campusCode, icon: Hash },
    { label: "Type", value: campus.type, icon: Building2 },
    { label: "Status", value: null, icon: null },
    { label: "Established Year", value: campus.establishedYear?.toString() || "—", icon: Calendar },
  ];

  const contactFields = [
    { label: "Email", value: campus.email || "—", icon: Mail },
    { label: "Phone", value: campus.phone || "—", icon: Phone },
  ];

  const addressFields = [
    { label: "Street", value: campus.address?.street || "—" },
    { label: "City", value: campus.address?.city || "—" },
    { label: "Province", value: campus.address?.province || "—" },
    { label: "Country", value: campus.address?.country || "—" },
    { label: "Postal Code", value: campus.address?.postalCode || "—" },
  ];

  const statCards = campus.stats
    ? [
        { label: "Faculties", value: campus.stats.totalFaculties, icon: Building2, to: `/faculties`, filter: { campusId: campus._id } },
        { label: "Departments", value: campus.stats.totalDepartments, icon: Layers, to: `/departments`, filter: { campusId: campus._id } },
        { label: "Programs", value: campus.stats.totalPrograms, icon: BookMarked, to: `/programs` },
        { label: "Subjects", value: campus.stats.totalSubjects, icon: BookOpen, to: `/subjects` },
        { label: "Teachers", value: campus.stats.totalTeachers, icon: Users, to: `/staff` },
        { label: "Students", value: campus.stats.totalStudents, icon: GraduationCap, to: `/students` },
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
            onClick={() => navigate("/campuses")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{campus.name}</h1>
              {campus.isMainCampus && (
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              )}
            </div>
            <p className="text-sm text-muted-foreground font-mono">
              {campus.campusId} · {campus.campusCode}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {statusBadge(campus.status)}
          <Badge variant="outline">{campus.type}</Badge>
          {campus.isMainCampus && (
            <Badge className="bg-yellow-100 text-yellow-800 border-0">Main Campus</Badge>
          )}
          <Button
            size="sm"
            className="gradient-brand text-white border-0"
            onClick={() => navigate(`/campuses/edit/${campus._id}`)}
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mt-6">
        {/* Left column — Info + Contact + Address (2 cols wide) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Info Section */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Campus Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {infoFields.map((field) => (
                  <div key={field.label} className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {field.label}
                    </p>
                    {field.label === "Status" ? (
                      <div>{statusBadge(campus.status)}</div>
                    ) : (
                      <p className="text-sm font-medium">{field.value}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contact Section */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {contactFields.map((field) => (
                  <div key={field.label} className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {field.label}
                    </p>
                    <p className="text-sm font-medium">{field.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Address Section */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4" /> Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {addressFields.map((field) => (
                  <div key={field.label} className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {field.label}
                    </p>
                    <p className="text-sm font-medium">{field.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {campus.description && (
            <Card className="glass">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {campus.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column — Academic Overview */}
        <div className="space-y-4">
          {statCards.length > 0 && (
            <Card className="glass">
              <CardHeader>
                <CardTitle>Academic Overview</CardTitle>
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
