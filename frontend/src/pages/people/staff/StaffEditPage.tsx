import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { staffMemberAPI, type StaffMember } from "@/features/staffMembers";
import { StaffContextHeader } from "@/components/staff/StaffContextHeader";
import { StaffModuleLinks } from "@/components/staff/StaffModuleLinks";
import { StaffTeachingPanel } from "./StaffTeachingPanel";
import { StaffForm } from "./StaffForm";

export default function StaffEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchStaff = async () => {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      try {
        const data = await staffMemberAPI.getById(id);
        if (data) setStaff(data);
        else setNotFound(true);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !staff) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="mb-4">Staff member not found.</p>
        <Button variant="outline" onClick={() => navigate("/staff")}>
          Back to staff directory
        </Button>
      </div>
    );
  }

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-6 md:p-8 space-y-8">
        <StaffContextHeader staff={staff} />
        <StaffModuleLinks staff={staff} />
        {staff.isAcademic && <StaffTeachingPanel staff={staff} />}
        <StaffForm mode="edit" staff={staff} onUpdated={setStaff} embedded />
      </CardContent>
    </Card>
  );
}
