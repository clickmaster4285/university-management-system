import { Building2, Mail, FileText, X, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Department } from "@/features/departments";
import type { Campus } from "@/features/campus";
import type { Teacher } from "@/features/teachers";
import type { Faculty } from "@/features/faculties";

export type DepartmentFormData = {
  name: string;
  code: string;
  description: string;
  campusId: string;
  headId: string;
  facultyId: string;
  status: "Active" | "Inactive";
  location: string;
  email: string;
  phone: string;
  establishedDate: string;
};

export const EMPTY_FORM: DepartmentFormData = {
  name: "", code: "", description: "", campusId: "", headId: "",
  facultyId: "", status: "Active", location: "", email: "", phone: "",
  establishedDate: "",
};

export const STATUS_OPTIONS = ["Active", "Inactive"];

interface DepartmentFormModalProps {
  isOpen: boolean;
  isEditMode: boolean;
  formData: DepartmentFormData;
  isSubmitting: boolean;
  campuses: Campus[];
  teachers: Teacher[];
  faculties: Faculty[];
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function DepartmentFormModal({
  isOpen,
  isEditMode,
  formData,
  isSubmitting,
  campuses,
  teachers,
  faculties,
  onChange,
  onSubmit,
  onClose,
}: DepartmentFormModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{isEditMode ? "Edit Department" : "Create Department"}</h2>
            <p className="text-sm text-muted-foreground">
              {isEditMode ? "Update department information" : "Add a new academic department"}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
              <Building2 className="h-4 w-4" /> Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Department Name *</Label>
                <Input id="name" name="name" value={formData.name} onChange={onChange} placeholder="Department of Computer Science" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Department Code *</Label>
                <Input id="code" name="code" value={formData.code} onChange={onChange} placeholder="CS" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="campusId">Campus *</Label>
                <select id="campusId" name="campusId" value={formData.campusId} onChange={onChange}
                  className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary" required>
                  <option value="">Select Campus</option>
                  {campuses.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="facultyId">Faculty / School</Label>
                <select id="facultyId" name="facultyId" value={formData.facultyId} onChange={onChange}
                  className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Select Faculty</option>
                  {faculties.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="headId">Head of Department</Label>
                <select id="headId" name="headId" value={formData.headId} onChange={onChange}
                  className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Select HOD</option>
                  {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
              <Mail className="h-4 w-4" /> Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Department Email</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={onChange} placeholder="cs@university.edu.pk" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" name="phone" value={formData.phone} onChange={onChange} placeholder="051-1234567" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="location">Office Location</Label>
                <Input id="location" name="location" value={formData.location} onChange={onChange} placeholder="Block A - Room 201" />
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-sm font-semibold text-primary flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4" /> Additional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="establishedDate">Established Date</Label>
                <Input id="establishedDate" name="establishedDate" type="date" value={formData.establishedDate} onChange={onChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <select id="status" name="status" value={formData.status} onChange={onChange}
                  className="w-full border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary" required>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={onChange} placeholder="Department description..." className="min-h-[80px]" />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="gradient-brand text-white border-0" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" /> {isEditMode ? "Update Department" : "Create Department"}</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
