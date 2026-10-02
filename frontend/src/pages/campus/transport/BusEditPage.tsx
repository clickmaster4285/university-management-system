import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { transportAPI, type Bus } from "@/features/transport";
import { BusForm } from "./BusForm";
import { transportListPath } from "./transportUtils";

export default function BusEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [bus, setBus] = useState<Bus | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchBus = async () => {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await transportAPI.getBusById(id);
        if (res?.data) {
          setBus(res.data);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchBus();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !bus) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="mb-4">The bus you are looking for does not exist.</p>
        <Button variant="outline" onClick={() => navigate(transportListPath("buses"), { state: { tab: "buses" } })}>
          Back to Transport
        </Button>
      </div>
    );
  }

  return <BusForm mode="edit" bus={bus} />;
}
