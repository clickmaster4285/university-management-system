import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, FileText, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { subjectAPI, type Subject } from "@/features/subjects";
import { departmentAPI, type Department } from "@/features/departments";

export type SubjectFormData = {
  name: string;
  code: string;
  departmentId: string;
  credits: number;
  description: string;
  prerequisiteSubjectIds: string[];
  status: "Active" | "Inactive";
};

export const STATUS_OPTIONS = ["Active", "Inactive"] as const;

export const EMPTY_FORM: SubjectFormData = {
  name: "",
  code: "",
  departmentId: "",
  credits: 3,
  description: "",
  prerequisiteSubjectIds: [],
  status: "Active",
};

const resolveRefId = (value: string | { _id: string } | null | undefined) => {
  if (!value) return "";
  if (typeof value === "object") return value._id || "";
  return value;
};

const getSubjectRecordId = (subject: Subject) => subject._id || subject.subjectId || "";

const toFormData = (subject: Subject): SubjectFormData => ({
  name: subject.name || "",
  code: subject.code || "",
  departmentId: resolveRefId(subject.departmentId as string | { _id: string } | null | undefined),
  credits: subject.credits ?? 3,
  description: subject.description || "",
  prerequisiteSubjectIds: (subject.prerequisiteSubjectIds || []).map((p) =>
    typeof p === "object" ? p._id : p
  ),
  status: subject.status || "Active",
});

interface SubjectFormProps {
  mode: "create" | "edit";
  subject?: Subject | null;
}

export function SubjectForm({ mode, subject }: SubjectFormProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SubjectFormData>(EMPTY_FORM);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoadingOptions(true);
        const [deptRes, subjectRes] = await Promise.all([
          departmentAPI.getAll(),
          subjectAPI.getAll({ limit: 500 }),
        ]);
        setDepartments(deptRes?.data || []);
        setSubjects(subjectRes?.data || []);
      } catch {
        toast.error("Failed to load form options");
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    if (mode === "edit" && subject) {
      setFormData(toFormData(subject));
    }
  }, [mode, subject]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "credits" ? Number(value) : value,
    }));
  };

  const togglePrerequisite = (subjectId: string) => {
    setFormData((prev) => {
      const exists = prev.prerequisiteSubjectIds.includes(subjectId);
      return {
        ...prev,
        prerequisiteSubjectIds: exists
          ? prev.prerequisiteSubjectIds.filter((id) => id !== subjectId)
          : [...prev.prerequisiteSubjectIds, subjectId],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim() || !formData.departmentId) {
      toast.error("Name, code and department are required");
      return;
    }

    setSaving(true);
    try {
      if (mode === "create") {
        await subjectAPI.create(formData);
        toast.success("Subject created successfully");
      } else {
        const id = subject ? getSubjectRecordId(subject) : "";
        if (!id) {
          toast.error("Cannot update subject: missing ID");
          return;
        }
        await subjectAPI.update(id, formData);
        toast.success("Subject updated successfully");
      }
      navigate("/subjects");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      toast.error(message || "Failed to save subject");
    } finally {
      setSaving(false);
    }
  };

  const currentId = subject ? getSubjectRecordId(subject) : "";
  const prerequisiteOptions = subjects.filter((s) => {
    const id = s._id || s.subjectId || "";
    return id && id !== currentId;
  });

  if (loadingOptions) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-6 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            {mode === "create" ? "Create Subject" : "Edit Subject"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "create"
              ? "Add a subject to the academic catalog"
              : "Update subject information"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Subject Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Programming Fundamentals"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Subject Code *</Label>
                <Input
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="e.g. CSC101"
                  className="uppercase"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="departmentId">Department *</Label>
                <select
                  id="departmentId"
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="credits">Credit Hours *</Label>
                <Input
                  id="credits"
                  name="credits"
                  type="number"
                  min={1}
                  max={6}
                  value={formData.credits}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Details
            </h3>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Subject overview..."
              />
            </div>
            <div className="space-y-2">
              <Label>Prerequisites</Label>
              <div className="rounded-md border p-3 max-h-48 overflow-y-auto space-y-2">
                {prerequisiteOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No other subjects available yet.</p>
                ) : (
                  prerequisiteOptions.map((s) => {
                    const id = s._id || s.subjectId || "";
                    return (
                      <label key={id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.prerequisiteSubjectIds.includes(id)}
                          onChange={() => togglePrerequisite(id)}
                        />
                        <span className="font-mono">{s.code}</span>
                        <span className="text-muted-foreground">{s.name}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => navigate("/subjects")} className="h-12 px-6">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1 h-12 gradient-brand text-white border-0">
              {saving ? (
                <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Saving...</>
              ) : (
                <><Save className="h-5 w-5 mr-2" /> {mode === "create" ? "Create Subject" : "Update Subject"}</>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default SubjectForm;
