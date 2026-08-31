import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Save, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  platformRoleAPI,
  MODULE_GROUPS,
  type PlatformRole,
} from "@/features/platformRoles";
import { staffMemberAPI, type StaffMember } from "@/features/staffMembers";

interface StaffPortalAccessProps {
  staff: StaffMember;
  onUpdated: (staff: StaffMember) => void;
}

const getStaffRecordId = (staff: StaffMember) => staff._id || staff.staffId || "";

export function StaffPortalAccess({ staff, onUpdated }: StaffPortalAccessProps) {
  const [roles, setRoles] = useState<PlatformRole[]>([]);
  const [moduleLabels, setModuleLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enablingLogin, setEnablingLogin] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [primaryRole, setPrimaryRole] = useState("Faculty");
  const [moduleAccess, setModuleAccess] = useState<Record<string, boolean>>({});

  const hasLogin = Boolean(staff.userId);
  const staffId = getStaffRecordId(staff);

  const loadRoleTemplate = useCallback(async (roleName: string) => {
    try {
      const role = await platformRoleAPI.getById(roleName);
      setModuleAccess(role.moduleAccess || {});
    } catch {
      toast.error("Failed to load role template");
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [roleList, meta] = await Promise.all([
        platformRoleAPI.list(),
        platformRoleAPI.getMeta(),
      ]);
      setRoles(roleList);
      setModuleLabels(meta.moduleLabels || {});

      const user =
        typeof staff.userId === "object" && staff.userId ? staff.userId : null;
      const currentRole = user?.primaryRole || "Faculty";
      setPrimaryRole(currentRole);
      if (user?.moduleAccess && Object.keys(user.moduleAccess).length > 0) {
        setModuleAccess(user.moduleAccess);
      } else {
        const template = roleList.find((r) => r.name === currentRole);
        setModuleAccess(template?.moduleAccess || {});
      }
    } catch {
      toast.error("Failed to load portal access settings");
    } finally {
      setLoading(false);
    }
  }, [staff.userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const enabledCount = useMemo(
    () => Object.values(moduleAccess).filter(Boolean).length,
    [moduleAccess]
  );

  const handleRoleChange = async (roleName: string) => {
    setPrimaryRole(roleName);
    await loadRoleTemplate(roleName);
  };

  const handleEnableLogin = async () => {
    if (!loginPassword || loginPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setEnablingLogin(true);
    try {
      const updated = await staffMemberAPI.enableLogin(staffId, {
        password: loginPassword,
        primaryRole,
        moduleAccess,
      });
      toast.success("Login enabled");
      setLoginPassword("");
      onUpdated(updated);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to enable login";
      toast.error(message);
    } finally {
      setEnablingLogin(false);
    }
  };

  const handleSaveAccess = async () => {
    setSaving(true);
    try {
      const updated = await staffMemberAPI.updateLoginAccess(staffId, {
        primaryRole,
        moduleAccess,
      });
      toast.success("Portal access updated");
      onUpdated(updated);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to update access";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Portal login & module access
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Control platform role and which modules this staff member can access.
        </p>
      </div>

      {!hasLogin ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border rounded-lg p-4 bg-muted/20">
          <div className="space-y-2">
            <Label>Platform role</Label>
            <select
              value={primaryRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {roles.map((role) => (
                <option key={role.name} value={role.name}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Temporary password</Label>
            <div className="flex gap-2">
              <Input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Min 8 characters"
              />
              <Button type="button" onClick={handleEnableLogin} disabled={enablingLogin}>
                {enablingLogin ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enable login"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Login enabled</Badge>
          {typeof staff.userId === "object" && staff.userId?.email && (
            <span className="text-sm text-muted-foreground">{staff.userId.email}</span>
          )}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>Module access</Label>
          <Badge variant="outline">{enabledCount} enabled</Badge>
        </div>
        {hasLogin && (
          <div className="space-y-2 max-w-sm">
            <Label>Platform role</Label>
            <select
              value={primaryRole}
              onChange={(e) => handleRoleChange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {roles.map((role) => (
                <option key={role.name} value={role.name}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="space-y-4 border rounded-lg p-4">
          {MODULE_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                {group.label}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.keys.map((key) => (
                  <label
                    key={key}
                    className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                  >
                    <span className="text-sm">{moduleLabels[key] || key}</span>
                    <Switch
                      checked={Boolean(moduleAccess[key])}
                      onCheckedChange={(checked) =>
                        setModuleAccess((prev) => ({ ...prev, [key]: checked }))
                      }
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        {hasLogin && (
          <Button onClick={handleSaveAccess} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save access
          </Button>
        )}
        {!hasLogin && (
          <Button onClick={handleEnableLogin} disabled={enablingLogin}>
            {enablingLogin ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Enable login with these permissions
          </Button>
        )}
      </div>
    </div>
  );
}

export default StaffPortalAccess;
