import { useEffect, useState } from "react";
import {
  studentApplicationsAPI,
  type PublicCatalogTree,
} from "@/features/studentApplications";

let cachedCatalog: PublicCatalogTree | null = null;
let catalogPromise: Promise<PublicCatalogTree> | null = null;

export async function loadPublicCatalog(force = false): Promise<PublicCatalogTree> {
  if (!force && cachedCatalog) return cachedCatalog;
  if (!force && catalogPromise) return catalogPromise;

  catalogPromise = studentApplicationsAPI
    .getPublicCatalog()
    .then((data) => {
      cachedCatalog = data;
      return data;
    })
    .finally(() => {
      catalogPromise = null;
    });

  return catalogPromise;
}

export function usePublicCatalog() {
  const [catalog, setCatalog] = useState<PublicCatalogTree | null>(cachedCatalog);
  const [loading, setLoading] = useState(!cachedCatalog);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadPublicCatalog()
      .then((data) => {
        if (cancelled) return;
        setCatalog(data);
        setError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Failed to load university catalog");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { catalog, loading, error };
}

export function universityDisplayName(catalog: PublicCatalogTree | null | undefined) {
  return catalog?.university?.universityName || "University";
}
