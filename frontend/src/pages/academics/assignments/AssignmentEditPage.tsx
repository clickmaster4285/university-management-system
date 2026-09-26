import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { assignmentAPI, type Assignment } from "@/features/assignment";
import { AssignmentForm } from "./AssignmentForm";

export default function AssignmentEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchAssignment = async () => {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await assignmentAPI.getById(id);
        if (res?.data) {
          setAssignment(res.data);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignment();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !assignment) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="mb-4">The assignment you are looking for does not exist.</p>
        <Button variant="outline" onClick={() => navigate("/assignments")}>
          Back to Assignments
        </Button>
      </div>
    );
  }

  return <AssignmentForm mode="edit" assignment={assignment} />;
}
