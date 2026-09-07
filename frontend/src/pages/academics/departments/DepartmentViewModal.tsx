import { useState, useEffect } from "react";
import { Building2, Mail, Phone, MapPin, User, FileText, Calendar, X, Pencil, BarChart3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { departmentAPI, type Department } from "@/features/departments";

interface DepartmentViewModalProps {
  isOpen: boolean;
  department: Department | null;
  onClose: () => void;
  onEdit: (dept: Department) => void;
}

function getDepartmentId(dept: Department) {
  return dept.departmentId || dept._id?.slice(-8).toUpperCase() || "N/A";
}

export function DepartmentViewModal({ isOpen, department, onClose, onEdit }: DepartmentViewModalProps) {
  const [detail, setDetail] = useState<Department | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!isOpen || !department) {
      setDetail(null);
      return;
    }
    const id = department._id || department.departmentId;
    if (!id) {
      setDetail(department);
      return;
    }
    setLoadingDetail(true);
    departmentAPI.getById(id)
      .then((res) => setDetail(res?.data || department))
      .catch(() => setDetail(department))
      .finally(() => setLoadingDetail(false));
  }, [isOpen, department]);

  if (!isOpen || !department) return null;

  const d = detail || department;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Department Details
            </h2>
            <p className="text-sm text-muted-foreground">Viewing department information</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
              <Building2 className="h-4 w-4" /> Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Department Name</Label>
                <p className="font-medium">{d.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Department Code</Label>
                <Badge variant="secondary" className="mt-1">{d.code}</Badge>
              </div>
              <div>
                <Label className="text-muted-foreground">Faculties</Label>
                <p>{(() => {
                  const names: string[] = [];
                  for (const f of d.facultyIds || []) {
                    if (typeof f === "object" && !names.includes(f.name)) names.push(f.name);
                  }
                  return names.length > 0 ? names.join(", ") : "—";
                })()}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Campuses</Label>
                <p>{(() => {
                  const names: string[] = [];
                  for (const c of d.campusIds || []) {
                    if (typeof c === "object" && !names.includes(c.name)) names.push(c.name);
                  }
                  return names.length > 0 ? names.join(", ") : "—";
                })()}</p>
              </div>
            </div>
          </div>

          {/* Per-Campus Details */}
          {(d.campusAssignments || []).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                <Building2 className="h-4 w-4" /> Campus Details
              </h3>
              <div className="space-y-4">
                {(d.campusAssignments || []).map((assignment, idx) => {
                  const campusName = typeof assignment.campus === "object" ? assignment.campus.name : "";
                  const campusCode = typeof assignment.campus === "object" ? assignment.campus.campusCode : "";
                  const headName = assignment.headId && typeof assignment.headId === "object"
                    ? `${(assignment.headId as any).firstName || ""} ${(assignment.headId as any).lastName || ""}`.trim() || (assignment.headId as any).name || null
                    : null;

                  return (
                    <div key={idx} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary" />
                          <span className="font-semibold">{campusName}</span>
                          <span className="text-xs text-muted-foreground font-mono">{campusCode}</span>
                        </div>
                        <Badge variant={assignment.status === "Active" ? "default" : "outline"}>
                          {assignment.status || "Active"}
                        </Badge>
                      </div>

                      {headName && (
                        <div className="flex items-center gap-2 text-sm">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">HOD: {headName}</span>
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
            </div>
          )}

          {/* Description */}
          {d.description && (
            <div>
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                <FileText className="h-4 w-4" /> Description
              </h3>
              <p className="text-sm bg-gray-50 p-3 rounded-lg border">
                {d.description}
              </p>
            </div>
          )}

          {/* Stats */}
          {detail?.stats && (
            <div>
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4" /> Statistics
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { label: "Programs", value: detail.stats.totalPrograms },
                  { label: "Subjects", value: detail.stats.totalSubjects },
                  { label: "Teachers", value: detail.stats.totalTeachers },
                  { label: "Batches", value: detail.stats.totalBatches },
                  { label: "Offerings", value: detail.stats.totalOfferings },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-lg p-3 text-center border">
                    <p className="text-2xl font-bold">{item.value ?? 0}</p>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Department ID */}
          <div className="bg-gray-50 rounded-lg p-3 border">
            <Label className="text-muted-foreground">Department ID</Label>
            <p className="font-mono text-sm">{getDepartmentId(d)}</p>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button variant="outline" onClick={() => { onClose(); onEdit(d); }}>
              <Pencil className="h-4 w-4 mr-2" /> Edit Department
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
