import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { studentApplicationsAPI } from "@/features/studentApplications";

export default function ApplicationTrackPage() {
  const [searchParams] = useSearchParams();
  const [applicationId, setApplicationId] = useState(searchParams.get("applicationId") || "");
  const [cnic, setCnic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    applicationId: string;
    fullName: string;
    status: string;
    program?: { name?: string; code?: string };
    campus?: { name?: string };
    submittedAt?: string;
    updatedAt?: string;
  } | null>(null);

  useEffect(() => {
    const id = searchParams.get("applicationId");
    if (id) setApplicationId(id);
  }, [searchParams]);

  const handleTrack = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!applicationId || !cnic) {
      toast.error("Application ID and CNIC are required");
      return;
    }
    setLoading(true);
    try {
      const data = await studentApplicationsAPI.trackPublicApplication(applicationId.trim(), cnic.trim());
      setResult(data);
    } catch (err: unknown) {
      setResult(null);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Application not found";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-center mb-2">Track your application</h1>
        <p className="text-center text-muted-foreground mb-8">
          Enter your application ID and CNIC to view status.
        </p>

        <form onSubmit={handleTrack} className="glass rounded-2xl p-6 space-y-4">
          <div>
            <Label>Application ID</Label>
            <Input value={applicationId} onChange={(e) => setApplicationId(e.target.value)} placeholder="APP-26-0001" />
          </div>
          <div>
            <Label>CNIC</Label>
            <Input value={cnic} onChange={(e) => setCnic(e.target.value)} placeholder="12345-1234567-1" />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Check status
          </Button>
        </form>

        {result && (
          <div className="mt-6 glass rounded-2xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">{result.fullName}</h2>
              <Badge>{result.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground font-mono">{result.applicationId}</p>
            <p className="text-sm">
              Program: <span className="font-medium">{result.program?.name || "—"}</span>
            </p>
            <p className="text-sm">
              Campus: <span className="font-medium">{result.campus?.name || "—"}</span>
            </p>
            {result.submittedAt && (
              <p className="text-xs text-muted-foreground">
                Submitted: {new Date(result.submittedAt).toLocaleString()}
              </p>
            )}
          </div>
        )}
    </div>
  );
}
