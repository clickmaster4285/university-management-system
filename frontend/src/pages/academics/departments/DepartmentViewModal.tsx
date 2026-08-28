import { Building2, Mail, Phone, MapPin, User, FileText, Calendar, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import type { Department } from "@/features/departments";

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
  if (!isOpen || !department) return null;

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
                <p className="font-medium">{department.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Department Code</Label>
                <Badge variant="secondary" className="mt-1">{department.code}</Badge>
              </div>
              <div>
                <Label className="text-muted-foreground">Faculty / School</Label>
                <p>{typeof department.facultyId === "object" ? department.facultyId?.name : "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Head of Department</Label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{typeof department.headId === "object" ? department.headId?.name || "—" : "—"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
              <Mail className="h-4 w-4" /> Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p>{department.email || "—"}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Phone</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p>{department.phone || "—"}</p>
                </div>
              </div>
              <div className="md:col-span-2">
                <Label className="text-muted-foreground">Office Location</Label>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p>{department.location || "—"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4" /> Additional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Established Date</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p>{department.establishedDate ? new Date(department.establishedDate).toLocaleDateString() : "—"}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div className="mt-1">
                  <Badge variant={department.status === "Active" ? "default" : "outline"}>
                    {department.status || "Active"}
                  </Badge>
                </div>
              </div>
              <div className="md:col-span-2">
                <Label className="text-muted-foreground">Description</Label>
                <p className="mt-1 text-sm bg-gray-50 p-3 rounded-lg border">
                  {department.description || "No description provided."}
                </p>
              </div>
            </div>
          </div>

          {/* Department ID */}
          <div className="bg-gray-50 rounded-lg p-3 border">
            <Label className="text-muted-foreground">Department ID</Label>
            <p className="font-mono text-sm">{getDepartmentId(department)}</p>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button variant="outline" onClick={() => { onClose(); onEdit(department); }}>
              <Pencil className="h-4 w-4 mr-2" /> Edit Department
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
