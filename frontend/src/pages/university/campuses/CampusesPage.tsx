import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KpiCard } from "@/components/dashboard/kpi-card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  School,
  Plus,
  Search,
  Filter,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Star,
  MapPin,
  Phone,
  Mail,
  Building2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { campusAPI, type Campus } from "@/features/campus";

const CAMPUS_TYPES = ["Main Campus", "Branch", "City Campus", "Regional Campus"] as const;
const STATUS_OPTIONS = ["Active", "Inactive", "Under Construction"] as const;

export function CampusesPage() {
  const navigate = useNavigate();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const fetchCampuses = async () => {
    try {
      setLoading(true);
      const res = await campusAPI.getAll();
      setCampuses(Array.isArray(res?.data) ? res.data : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load campuses";
      toast.error(message);
      setCampuses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampuses();
  }, []);

  const stats = useMemo(() => {
    const active = campuses.filter((c) => (c.status || "Active") === "Active").length;
    const inactive = campuses.length - active;
    const mainCampus = campuses.filter((c) => c.isMainCampus).length;
    return { total: campuses.length, active, inactive, mainCampus };
  }, [campuses]);

  const filtered = useMemo(() => {
    return campuses.filter((c) => {
      if (statusFilter !== "all" && (c.status || "Active") !== statusFilter) return false;
      if (typeFilter !== "all" && c.type !== typeFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        c.name?.toLowerCase().includes(q) ||
        c.campusCode?.toLowerCase().includes(q) ||
        c.campusId?.toLowerCase().includes(q) ||
        c.address?.city?.toLowerCase().includes(q)
      );
    });
  }, [campuses, search, statusFilter, typeFilter]);

  const clearFilters = () => {
    setStatusFilter("all");
    setTypeFilter("all");
  };

  const handleDelete = async (campus: Campus) => {
    if (
      !confirm(
        `Delete "${campus.name}"? Departments under this campus will also be deleted.`
      )
    ) {
      return;
    }
    try {
      await campusAPI.delete(campus._id);
      toast.success("Campus deleted");
      fetchCampuses();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete campus";
      toast.error(message);
    }
  };

  const handleSetMain = async (campus: Campus) => {
    try {
      await campusAPI.update(campus._id, { isMainCampus: true });
      toast.success(`"${campus.name}" is now the main campus`);
      fetchCampuses();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to set main campus";
      toast.error(message);
    }
  };

  const statusBadge = (status: string) => {
    if (status === "Active") {
      return <Badge className="bg-green-100 text-green-800 border-0">{status}</Badge>;
    }
    if (status === "Inactive") {
      return <Badge variant="secondary">{status}</Badge>;
    }
    return <Badge variant="outline" className="text-yellow-600 border-yellow-300">{status}</Badge>;
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Total Campuses" value={stats.total} icon={Building2} />
        <KpiCard label="Active" value={stats.active} icon={CheckCircle} tone="success" />
        <KpiCard label="Inactive" value={stats.inactive} icon={XCircle} tone="warning" />
      </div>

      <Card className="glass mt-4">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>All Campuses</CardTitle>
            <CardDescription>
              {filtered.length} of {campuses.length} campus{campuses.length === 1 ? "" : "es"} shown
              {stats.mainCampus > 0 ? ` · ${stats.mainCampus} main` : ""}
            </CardDescription>
          </div>
          <Button
            size="sm"
            className="gradient-brand text-white border-0 shrink-0"
            onClick={() => navigate("/campuses/create")}
          >
            <Plus className="h-3.5 w-3.5" /> Add campus
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search campuses…"
                className="pl-9"
              />
            </div>
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters((open) => !open)}
            >
              <Filter className="h-3.5 w-3.5" /> Filter
            </Button>
            <Badge variant="secondary" className="ml-auto">
              {filtered.length} records
            </Badge>
          </div>

          {showFilters && (
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="campus-status-filter">Status</Label>
                  <select
                    id="campus-status-filter"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All statuses</option>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campus-type-filter">Campus type</Label>
                  <select
                    id="campus-type-filter"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <option value="all">All types</option>
                    {CAMPUS_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={clearFilters}
                    disabled={statusFilter === "all" && typeFilter === "all"}
                  >
                    Clear filters
                  </Button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground rounded-lg border border-dashed">
              <School className="h-12 w-12 mb-3 opacity-40" />
              <p className="font-medium">
                {search || statusFilter !== "all" || typeFilter !== "all"
                  ? "No campuses match your filters"
                  : "No campuses yet"}
              </p>
              {!search && statusFilter === "all" && typeFilter === "all" && (
                <Button
                  className="mt-4 gradient-brand text-white border-0"
                  onClick={() => navigate("/campuses/create")}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add campus
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((campus) => (
                <Card
                  key={campus._id}
                  className="group hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/campuses/edit/${campus._id}`)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-11 w-11 rounded-xl gradient-brand flex items-center justify-center shrink-0">
                          <School className="h-5 w-5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold truncate flex items-center gap-1.5">
                            {campus.isMainCampus && (
                              <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500 shrink-0" />
                            )}
                            {campus.name}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {campus.campusId} · {campus.campusCode}
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/campuses/edit/${campus._id}`);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          {!campus.isMainCampus && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetMain(campus);
                              }}
                            >
                              <Star className="h-4 w-4 mr-2" /> Set as Main
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(campus);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {[campus.address?.city, campus.address?.province].filter(Boolean).join(", ") || "—"}
                        </span>
                      </div>
                      {campus.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{campus.phone}</span>
                        </div>
                      )}
                      {campus.email && (
                        <div className="flex items-center gap-2 min-w-0">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{campus.email}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {statusBadge(campus.status)}
                      <Badge variant="outline">{campus.type}</Badge>
                      {campus.isMainCampus && (
                        <Badge className="bg-yellow-100 text-yellow-800 border-0">Main</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default CampusesPage;
