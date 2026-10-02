import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Pencil,
  Loader2,
  Calendar,
  CheckCircle,
  Clock,
  Check,
  XCircle,
  Users,
  Building2,
  BookOpen,
} from "lucide-react";
import { academicSessionAPI, type AcademicSession } from "@/features/academicSession";
import { batchAPI, type Batch } from "@/features/batches";
import { toast } from "sonner";

const statusBadge = (status: string) => {
  const map: Record<string, { className: string; icon: React.ReactNode }> = {
    Active: { className: "bg-green-500/15 text-green-600 border-0", icon: <CheckCircle className="h-3 w-3" /> },
    Upcoming: { className: "bg-blue-500/15 text-blue-600 border-0", icon: <Clock className="h-3 w-3" /> },
    Completed: { className: "bg-gray-500/15 text-gray-600 border-0", icon: <Check className="h-3 w-3" /> },
    Inactive: { className: "bg-red-500/15 text-red-600 border-0", icon: <XCircle className="h-3 w-3" /> },
  };
  const info = map[status] || map.Upcoming;
  return (
    <Badge className={`${info.className} flex items-center gap-1 w-fit`}>
      {info.icon}
      {status}
    </Badge>
  );
};

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<AcademicSession | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await academicSessionAPI.getById(id);
        if (res?.data) {
          setSession(res.data as AcademicSession);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [id]);

  useEffect(() => {
    const fetchBatches = async () => {
      if (!id || !session) return;
      try {
        setBatchesLoading(true);
        const res = await batchAPI.getAll({ admissionSessionId: id });
        setBatches(Array.isArray(res?.data) ? res.data : []);
      } catch {
        toast.error("Failed to load batches");
      } finally {
        setBatchesLoading(false);
      }
    };
    fetchBatches();
  }, [id, session]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !session) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="mb-4">The academic session you are looking for does not exist.</p>
        <Button variant="outline" onClick={() => navigate("/academic-sessions")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Sessions
        </Button>
      </div>
    );
  }

  const sessionId = session.sessionId || session._id?.slice(-8).toUpperCase() || "N/A";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => navigate("/academic-sessions")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{session.name}</h1>
              {session.isCurrent && (
                <Badge className="bg-blue-500/15 text-blue-600 border-0 text-[10px]">Current</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground font-mono">
              {sessionId} · {session.code}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {statusBadge(session.status || "Upcoming")}
          <Button
            size="sm"
            className="gradient-brand text-white border-0"
            onClick={() => navigate(`/academic-sessions/edit/${session._id || session.sessionId}`)}
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Session Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Session ID</p>
                  <p className="text-sm font-medium font-mono">{sessionId}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Code</p>
                  <p className="text-sm font-medium font-mono">{session.code}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="text-sm font-medium">{new Date(session.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">End Date</p>
                  <p className="text-sm font-medium">{new Date(session.endDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="mt-1">{statusBadge(session.status || "Upcoming")}</div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Current Session</p>
                  <p className="text-sm font-medium">{session.isCurrent ? "Yes" : "No"}</p>
                </div>
              </div>
              {session.description && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Description</p>
                  <p className="text-sm whitespace-pre-line">{session.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border bg-muted/30 p-3 text-center">
                  <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-lg font-bold">{batches.length}</p>
                  <p className="text-xs text-muted-foreground">Batches</p>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3 text-center">
                  <Building2 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-lg font-bold">
                    {new Set(batches.map((b) => (typeof b.departmentId === "object" ? b.departmentId?._id : b.departmentId))).size}
                  </p>
                  <p className="text-xs text-muted-foreground">Departments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="glass">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Linked Batches
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Batches whose admission session is <span className="font-medium">{session.name}</span>
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              navigate("/batches", {
                state: { admissionSessionId: session._id },
              })
            }
          >
            View all batches
          </Button>
        </CardHeader>
        <CardContent>
          {batchesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : batches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground rounded-lg border border-dashed">
              <Users className="h-10 w-10 mb-2 opacity-40" />
              <p className="font-medium">No batches linked to this session</p>
              <p className="text-sm">Batches created with this admission session will appear here.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {batches.map((batch) => (
                <button
                  key={batch._id}
                  type="button"
                  onClick={() => navigate("/batches")}
                  className="rounded-lg border bg-muted/30 p-4 text-left hover:bg-muted/60 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{batch.code}</p>
                      <p className="text-xs text-muted-foreground">
                        {typeof batch.departmentId === "object" ? batch.departmentId?.name : batch.department}
                      </p>
                    </div>
                    <Badge variant={batch.status === "Active" ? "default" : "secondary"}>
                      {batch.status || "Upcoming"}
                    </Badge>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground space-y-1">
                    <p>Year: {batch.year}</p>
                    <p>Expected graduation: {batch.expectedGraduation}</p>
                    <p>Admission semester: {batch.admissionSemester}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
