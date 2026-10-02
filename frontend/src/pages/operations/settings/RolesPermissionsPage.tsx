import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { APP_ROUTES } from "@/lib/appRoutes";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  platformRoleAPI,
  ROLE_PERMISSION_SECTIONS,
  type PlatformRole,
} from "@/features/platformRoles";

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState<PlatformRole[]>([]);
  const [moduleLabels, setModuleLabels] = useState<Record<string, string>>({});
  const [selectedRole, setSelectedRole] = useState<PlatformRole | null>(null);
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [moduleAccess, setModuleAccess] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [reseeding, setReseeding] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [roleList, meta] = await Promise.all([
        platformRoleAPI.list(),
        platformRoleAPI.getMeta(),
      ]);
      setRoles(roleList);
      setModuleLabels(meta.moduleLabels || {});
      if (roleList.length > 0) {
        const current = selectedRole
          ? roleList.find((r) => r.name === selectedRole.name) || roleList[0]
          : roleList[0];
        setSelectedRole(current);
        setRoleName(current.name);
        setRoleDescription(current.description || "");
        setModuleAccess(current.moduleAccess || {});
      }
    } catch {
      toast.error("Failed to load roles and permissions");
    } finally {
      setLoading(false);
    }
  }, [selectedRole?.name]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectRole = (role: PlatformRole) => {
    setSelectedRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || "");
    setModuleAccess(role.moduleAccess || {});
    setShowCreate(false);
  };

  const handleToggleModule = (key: string, enabled: boolean) => {
    setModuleAccess((prev) => ({ ...prev, [key]: enabled }));
  };

  const enabledCount = useMemo(
    () => Object.values(moduleAccess).filter(Boolean).length,
    [moduleAccess]
  );

  const handleSave = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      const updated = await platformRoleAPI.update(selectedRole.name, {
        name: roleName.trim(),
        description: roleDescription.trim(),
        moduleAccess,
      });
      toast.success(`Saved ${updated.name}`);
      await loadData();
      setSelectedRole(updated);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to save role";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!newRoleName.trim()) {
      toast.error("Role name is required");
      return;
    }
    setSaving(true);
    try {
      const created = await platformRoleAPI.create({
        name: newRoleName.trim(),
        description: newRoleDescription.trim(),
        moduleAccess: { dashboard: true },
      });
      toast.success(`Role "${created.name}" created`);
      setShowCreate(false);
      setNewRoleName("");
      setNewRoleDescription("");
      setRoles((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      handleSelectRole(created);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to create role";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRole) return;
    if (!confirm(`Delete role "${selectedRole.name}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await platformRoleAPI.delete(selectedRole.name);
      toast.success(`Role "${selectedRole.name}" deleted`);
      const remaining = roles.filter((r) => r.name !== selectedRole.name);
      setRoles(remaining);
      if (remaining.length > 0) handleSelectRole(remaining[0]);
      else setSelectedRole(null);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to delete role";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleApplyToUsers = async () => {
    if (!selectedRole) return;
    if (
      !confirm(
        `Apply current permissions to all users with role "${selectedRole.name}"? This overwrites their module access.`
      )
    ) {
      return;
    }
    setApplying(true);
    try {
      const result = await platformRoleAPI.applyToUsers(selectedRole.name);
      toast.success(result.message);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to apply permissions";
      toast.error(message);
    } finally {
      setApplying(false);
    }
  };

  const handleReseed = async (mode: "missing" | "reset") => {
    const message =
      mode === "reset"
        ? "Reset ALL system roles to factory defaults? Custom roles are kept."
        : "Add any missing system roles from defaults?";
    if (!confirm(message)) return;

    setReseeding(true);
    try {
      const result = await platformRoleAPI.reseed(mode);
      toast.success(result.message);
      await loadData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to reseed roles";
      toast.error(msg);
    } finally {
      setReseeding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="mb-3 -ml-2" asChild>
          <Link to={APP_ROUTES.settings.index}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to settings & configuration
          </Link>
        </Button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Roles & Permissions
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage platform roles and which modules each role can access. Staff inherit these
              when assigned a role at login.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={APP_ROUTES.settings.permissionAudit}>Audit log</Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleReseed("missing")} disabled={reseeding}>
              <RefreshCw className={`h-4 w-4 mr-2 ${reseeding ? "animate-spin" : ""}`} />
              Seed missing roles
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleReseed("reset")} disabled={reseeding}>
              Restore system defaults
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Platform roles</h2>
              <Button size="sm" variant="secondary" onClick={() => setShowCreate((v) => !v)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {showCreate && (
              <div className="mb-4 space-y-3 border rounded-lg p-3 bg-muted/30">
                <div className="space-y-2">
                  <Label>Role name</Label>
                  <Input
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="e.g. Lab Supervisor"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newRoleDescription}
                    onChange={(e) => setNewRoleDescription(e.target.value)}
                    className="min-h-[60px]"
                  />
                </div>
                <Button size="sm" onClick={handleCreate} disabled={saving}>
                  Create role
                </Button>
              </div>
            )}

            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {roles.map((role) => (
                <button
                  key={role.name}
                  type="button"
                  onClick={() => handleSelectRole(role)}
                  className={`w-full text-left rounded-lg border px-3 py-3 transition-colors ${
                    selectedRole?.name === role.name
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{role.name}</span>
                    {role.isSystem ? (
                      <Badge variant="outline" className="text-[10px]">
                        System
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        Custom
                      </Badge>
                    )}
                  </div>
                  {role.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {role.description}
                    </p>
                  )}
                  <div className="mt-2">
                    <Badge variant="outline" className="text-[10px]">
                      {Object.values(role.moduleAccess || {}).filter(Boolean).length} modules
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            {selectedRole ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-3 flex-1 min-w-[240px]">
                    <div className="space-y-2">
                      <Label>Role name</Label>
                      <Input
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        disabled={selectedRole.isSystem}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={roleDescription}
                        onChange={(e) => setRoleDescription(e.target.value)}
                        className="min-h-[70px]"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {enabledCount} module{enabledCount === 1 ? "" : "s"} enabled
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save role
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleApplyToUsers}
                      disabled={applying}
                    >
                      {applying ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Users className="h-4 w-4 mr-2" />
                      )}
                      Apply to all users
                    </Button>
                    {!selectedRole.isSystem && (
                      <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete role
                      </Button>
                    )}
                  </div>
                </div>

                {ROLE_PERMISSION_SECTIONS.map((section) => (
                  <div key={section.label} className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      {section.label}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {section.items.map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center justify-between rounded-lg border px-3 py-2"
                        >
                          <div className="min-w-0 pr-3">
                            <Label htmlFor={`module-${item.key}`} className="cursor-pointer">
                              {item.label}
                            </Label>
                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                              {moduleLabels[item.moduleKey] || item.moduleKey}
                            </p>
                          </div>
                          <Switch
                            id={`module-${item.key}`}
                            checked={Boolean(moduleAccess[item.moduleKey])}
                            onCheckedChange={(checked) =>
                              handleToggleModule(item.moduleKey, checked)
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <p className="text-xs text-muted-foreground border-t pt-4">
                  <strong>Save role</strong> updates the template for future logins. Use{" "}
                  <strong>Apply to all users</strong> to push these permissions to everyone
                  already assigned this role (including admin accounts).
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">
                No roles found. Click &quot;Seed missing roles&quot; to initialize defaults.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
