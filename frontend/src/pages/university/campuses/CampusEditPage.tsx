import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
  const [hasMainCampus, setHasMainCampus] = useState(false);

  useEffect(() => {
    const fetchCampus = async () => {
      try {
        setLoading(true);
        const [campusRes, allRes] = await Promise.all([
          campusAPI.getById(id!),
          campusAPI.getAll(),
        ]);

        if (campusRes?.data && !Array.isArray(campusRes.data)) {
          setCampus(campusRes.data as Campus);
        } else {
          setNotFound(true);
          return;
        }

        // Check if any OTHER campus is already main
        const campuses = Array.isArray(allRes?.data) ? allRes.data : [];
        const mainExists = campuses.some(
          (c: Campus) => c.isMainCampus && c._id !== id
        );
        setHasMainCampus(mainExists);
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
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !campus) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="mb-4">The campus you are looking for does not exist.</p>
        <Button variant="outline" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return <CampusForm mode="edit" campus={campus} hasMainCampus={hasMainCampus} />;
}
