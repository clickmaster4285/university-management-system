import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { staffMemberAPI, type StaffMember } from "@/features/staffMembers";
import { StaffContextHeader } from "@/components/staff/StaffContextHeader";
import { StaffPortalAccess } from "@/pages/people/staff/StaffPortalAccess";

export default function StaffAccessPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const data = await staffMemberAPI.getById(id);
        setStaff(data);
      } catch {
        setStaff(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="mb-4">Staff member not found.</p>
        <Button variant="outline" onClick={() => navigate("/access")}>
          Back to portal access
        </Button>
      </div>
    );
  }

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-6 md:p-8">
        <StaffContextHeader
          staff={staff}
          backTo="/access"
          backLabel="Back to portal access"
          title="Portal access"
        />
        <StaffPortalAccess staff={staff} onUpdated={setStaff} />
      </CardContent>
    </Card>
  );
}
