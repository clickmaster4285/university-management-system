import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { subjectAPI, type Subject } from "@/features/subjects";
import { SubjectForm } from "./SubjectForm";

export default function SubjectEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchSubject = async () => {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await subjectAPI.getById(id);
        if (res?.data) {
          setSubject(res.data);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchSubject();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !subject) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="mb-4">The subject you are looking for does not exist.</p>
        <Button variant="outline" onClick={() => navigate("/subjects")}>
          Back to Subjects
        </Button>
      </div>
    );
  }

  return <SubjectForm mode="edit" subject={subject} />;
}
