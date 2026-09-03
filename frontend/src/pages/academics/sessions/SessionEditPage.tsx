import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { academicSessionAPI, type AcademicSession } from "@/features/academicSession";
import { SessionForm } from "./SessionForm";

export default function SessionEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<AcademicSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      try {
        const res = await academicSessionAPI.getById(id);
        if (res?.data) setSession(res.data);
        else setNotFound(true);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [id]);

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
        <p className="mb-4">The session you are looking for does not exist.</p>
        <Button variant="outline" onClick={() => navigate("/academic-sessions")}>
          Back to Sessions
        </Button>
      </div>
    );
  }

  return <SessionForm mode="edit" session={session} />;
}
