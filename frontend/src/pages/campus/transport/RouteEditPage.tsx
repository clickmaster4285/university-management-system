import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { transportAPI, type Route as TransportRoute } from "@/features/transport";
import { RouteForm } from "./RouteForm";
import { transportListPath } from "./transportUtils";

export default function RouteEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [route, setRoute] = useState<TransportRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await transportAPI.getRoutes({ limit: 100 });
        const found = (res?.data || []).find(
          (item: TransportRoute) => item._id === id || item.routeId === id
        );
        if (found) {
          setRoute(found);
        } else {
          setNotFound(true);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchRoute();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !route) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="mb-4">The route you are looking for does not exist.</p>
        <Button variant="outline" onClick={() => navigate(transportListPath("routes"), { state: { tab: "routes" } })}>
          Back to Transport
        </Button>
      </div>
    );
  }

  return <RouteForm mode="edit" route={route} />;
}
