import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, FileText, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { programAPI, type Program } from "@/features/programs";
import { departmentAPI, type Department } from "@/features/departments";

export type ProgramFormData = {
  name: string;
  code: string;
  departmentId: string;
  degreeLevel: Program["degreeLevel"];
  duration: number;
  totalCredits: number;
  description: string;
  status: "Active" | "Inactive";
};

export const DEGREE_LEVELS: Program["degreeLevel"][] = ["BS", "MS", "PhD", "BBA", "MBA", "LLB", "Other"];
export const STATUS_OPTIONS = ["Active", "Inactive"] as const;

export const EMPTY_FORM: ProgramFormData = {
  name: "",
  code: "",
  departmentId: "",
  degreeLevel: "BS",
  duration: 8,
  totalCredits: 0,
  description: "",
  status: "Active",
};

const resolveRefId = (value: string | { _id: string } | null | undefined) => {
  if (!value) return "";
  if (typeof value === "object") return value._id || "";
  return value;
};

const getProgramRecordId = (program: Program) => program._id || program.programId || "";

const toFormData = (program: Program): ProgramFormData => ({
  name: program.name || "",
  code: program.code || "",
  departmentId: resolveRefId(program.departmentId as string | { _id: string } | null | undefined),
  degreeLevel: program.degreeLevel || "BS",
  duration: program.duration ?? 8,
  totalCredits: program.totalCredits ?? 0,
  description: program.description || "",
  status: program.status || "Active",
});

interface ProgramFormProps {
  mode: "create" | "edit";
  program?: Program | null;
}

export function ProgramForm({ mode, program }: ProgramFormProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ProgramFormData>(EMPTY_FORM);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoadingOptions(true);
        const res = await departmentAPI.getAll();
        setDepartments(res?.data || []);
      } catch {
        toast.error("Failed to load departments");
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (mode === "edit" && program) {
      setFormData(toFormData(program));
    }
  }, [mode, program]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "duration" || name === "totalCredits" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim() || !formData.departmentId || !formData.degreeLevel) {
      toast.error("Name, code, department and degree level are required");
      return;
    }

    setSaving(true);
    try {
      if (mode === "create") {
        await programAPI.create(formData);
        toast.success("Program created successfully");
      } else {
        const id = program ? getProgramRecordId(program) : "";
        if (!id) {
          toast.error("Cannot update program: missing ID");
          return;
        }
        await programAPI.update(id, formData);
        toast.success("Program updated successfully");
      }
      navigate("/programs");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save program");
    } finally {
      setSaving(false);
    }
  };

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
            {mode === "create" ? "Create Program" : "Edit Program"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "create"
              ? "Add a degree program under an academic department"
              : "Update program information"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Program Name *</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. BS Computer Science" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Program Code *</Label>
                <Input id="code" name="code" value={formData.code} onChange={handleChange} placeholder="e.g. BSCS" className="uppercase" required />
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
                <Label htmlFor="degreeLevel">Degree Level *</Label>
                <select
                  id="degreeLevel"
                  name="degreeLevel"
                  value={formData.degreeLevel}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  {DEGREE_LEVELS.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Program Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (semesters)</Label>
                <Input id="duration" name="duration" type="number" min={1} value={formData.duration} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalCredits">Total Credits</Label>
                <Input id="totalCredits" name="totalCredits" type="number" min={0} value={formData.totalCredits} onChange={handleChange} />
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
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Program description..." />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => navigate("/programs")} className="h-12 px-6">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1 h-12 gradient-brand text-white border-0">
              {saving ? (
                <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Saving...</>
              ) : (
                <><Save className="h-5 w-5 mr-2" /> {mode === "create" ? "Create Program" : "Update Program"}</>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default ProgramForm;
