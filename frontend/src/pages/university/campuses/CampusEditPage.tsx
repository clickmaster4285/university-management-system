import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AppShell } from "@/layouts";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { campusAPI, type Campus } from "@/features/campus";
import { CampusForm } from "./CampusForm";

export default function CampusEditPage() {
  const { id } = useParams<{ id: string }>();
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
      } catch (err) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchCampus();
  }, [id]);

  if (loading) {
    return (
      <AppShell title="Edit Campus" subtitle="Loading...">
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (notFound || !campus) {
    return (
      <AppShell title="Edit Campus" subtitle="Campus not found">
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="mb-4">The campus you are looking for does not exist.</p>
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </AppShell>
    );
  }

  return <CampusForm mode="edit" campus={campus} />;
}
