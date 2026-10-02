import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

/** Documents live on the student profile page now. */
export default function StudentDocumentsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) navigate(`/students/${id}`, { replace: true });
    else navigate("/students", { replace: true });
  }, [id, navigate]);

  return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
