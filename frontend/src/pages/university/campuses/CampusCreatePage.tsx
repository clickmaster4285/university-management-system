import { useEffect, useState } from "react";
import { CampusForm } from "./CampusForm";
import { campusAPI, type Campus } from "@/features/campus";

export default function CampusCreatePage() {
  const [hasMainCampus, setHasMainCampus] = useState(false);

  useEffect(() => {
    const checkMain = async () => {
      try {
        const res = await campusAPI.getAll();
        const campuses = Array.isArray(res?.data) ? res.data : [];
        setHasMainCampus(campuses.some((c: Campus) => c.isMainCampus));
      } catch {
        // ignore — form will handle backend error if user tries to set main
      }
    };
    checkMain();
  }, []);

  return <CampusForm mode="create" hasMainCampus={hasMainCampus} />;
}
