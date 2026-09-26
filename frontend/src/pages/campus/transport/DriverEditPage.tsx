import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { transportAPI, type Driver } from "@/features/transport";
import { DriverForm } from "./DriverForm";
import { transportListPath } from "./transportUtils";

export default function DriverEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchDriver = async () => {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await transportAPI.getDrivers({ limit: 100 });
        const found = (res?.data || []).find(
          (item: Driver) => item._id === id || item.driverId === id
        );
        if (found) {
          setDriver(found);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchDriver();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !driver) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="mb-4">The driver you are looking for does not exist.</p>
        <Button variant="outline" onClick={() => navigate(transportListPath("drivers"), { state: { tab: "drivers" } })}>
          Back to Transport
        </Button>
      </div>
    );
  }

  return <DriverForm mode="edit" driver={driver} />;
}
