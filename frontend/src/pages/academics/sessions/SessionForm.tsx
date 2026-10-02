import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, ChevronLeft, Clock, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { academicSessionAPI, type AcademicSession } from "@/features/academicSession";

export type SessionFormData = {
  name: string;
  code: string;
  startDate: string;
  endDate: string;
  status: "Active" | "Inactive" | "Upcoming" | "Completed";
  isCurrent: boolean;
  description: string;
};

const STATUS_OPTIONS = ["Active", "Upcoming", "Completed", "Inactive"] as const;

const suggestSessionName = (startDate: string, endDate: string) => {
  if (!startDate || !endDate) return "";
  const startYear = new Date(startDate).getFullYear();
  const endYear = new Date(endDate).getFullYear();
  return startYear === endYear ? `${startYear}` : `${startYear}-${String(endYear).slice(-2)}`;
};

const suggestSessionCode = (startDate: string, endDate: string) => {
  const name = suggestSessionName(startDate, endDate);
  return name ? name.replace(/\s/g, "") : "";
};

const getSessionRecordId = (session: AcademicSession) => session._id || session.sessionId || "";

const toFormData = (session: AcademicSession): SessionFormData => ({
  name: session.name || "",
  code: session.code || "",
  startDate: session.startDate ? new Date(session.startDate).toISOString().split("T")[0] : "",
  endDate: session.endDate ? new Date(session.endDate).toISOString().split("T")[0] : "",
  status: session.status || "Upcoming",
  isCurrent: session.isCurrent || false,
  description: session.description || "",
});

const emptyForm = (): SessionFormData => ({
  name: "",
  code: "",
  startDate: "",
  endDate: "",
  status: "Upcoming",
  isCurrent: false,
  description: "",
});

interface SessionFormProps {
  mode: "create" | "edit";
  session?: AcademicSession | null;
}

export function SessionForm({ mode, session }: SessionFormProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SessionFormData>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);
  const [nameManuallyEdited, setNameManuallyEdited] = useState(false);

  useEffect(() => {
    if (mode === "edit" && session) {
      setFormData(toFormData(session));
      setCodeManuallyEdited(true);
      setNameManuallyEdited(true);
    }
  }, [mode, session]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "code") setCodeManuallyEdited(true);
    if (name === "name") setNameManuallyEdited(true);
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "startDate" || name === "endDate") {
        if (!nameManuallyEdited && (name === "startDate" || name === "endDate")) {
          next.name = suggestSessionName(
            name === "startDate" ? value : prev.startDate,
            name === "endDate" ? value : prev.endDate
          );
        }
        if (!codeManuallyEdited) {
          next.code = suggestSessionCode(
            name === "startDate" ? value : prev.startDate,
            name === "endDate" ? value : prev.endDate
          );
        }
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.startDate || !formData.endDate) {
      toast.error("Name, code, start date, and end date are required");
      return;
    }
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast.error("End date must be after start date");
      return;
    }

    const submitData = {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: formData.status,
      isCurrent: formData.isCurrent,
      description: formData.description || "",
    };

    setSaving(true);
    try {
      if (mode === "create") {
        const response = await academicSessionAPI.create(submitData);
        if (response?.success === false) {
          toast.error(response?.message || "Failed to create session");
          return;
        }
        toast.success(`Session "${submitData.name}" created`);
      } else {
        const id = session ? getSessionRecordId(session) : "";
        if (!id) {
          toast.error("Cannot update session: missing ID");
          return;
        }
        const response = await academicSessionAPI.update(id, submitData);
        if (response?.success === false) {
          toast.error(response?.message || "Failed to update session");
          return;
        }
        toast.success(`Session "${submitData.name}" updated`);
      }
      navigate("/academic-sessions");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (mode === "create" ? "Failed to create session" : "Failed to update session");
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-6 md:p-8">
        <div className="mb-6">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mb-3 -ml-2"
            onClick={() => navigate("/academic-sessions")}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to sessions
          </Button>
          <h1 className="text-2xl font-bold">
            {mode === "create" ? "Create Academic Session" : "Edit Academic Session"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "create"
              ? "Define the academic year or term used for batches, offerings, and fee packages"
              : "Update session dates and status"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Session details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Session name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="2025-26"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Session code *</Label>
                <Input
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="2025-26"
                  required
                  className="uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Start date *</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End date *</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/40 w-full">
                  <Switch
                    id="isCurrent"
                    checked={formData.isCurrent}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, isCurrent: checked }))
                    }
                  />
                  <Label htmlFor="isCurrent" className="text-sm font-medium cursor-pointer">
                    Set as current session
                  </Label>
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Optional notes about this academic session..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => navigate("/academic-sessions")}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="gradient-brand text-white border-0">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {mode === "create" ? "Create Session" : "Update Session"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default SessionForm;
