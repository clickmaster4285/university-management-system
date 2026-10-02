// Admin profile, password, and preferences
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  RefreshCw,
  AlertCircle,
  Save,
  UserCog,
  Key,
  ChevronLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import { APP_ROUTES } from "@/lib/appRoutes";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { settingsAPI, Settings } from "@/features/settings";
import { authAPI } from "@/features/auth";

export function SettingsProfilePage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [preferences, setPreferences] = useState({
    darkMode: false,
    emailDigests: true,
    publicPortal: false,
    aiInsights: true,
    faceRecognitionAttendance: false,
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const [settingsResult, profileResult] = await Promise.allSettled([
        settingsAPI.getAll(),
        authAPI.getProfile(),
      ]);

      if (settingsResult.status === "fulfilled" && settingsResult.value.success) {
        const data = settingsResult.value.data;
        setSettings(data);
        setPreferences({
          darkMode: data.preferences?.darkMode || false,
          emailDigests: data.preferences?.emailDigests || true,
          publicPortal: data.preferences?.publicPortal || false,
          aiInsights: data.preferences?.aiInsights || true,
          faceRecognitionAttendance: data.preferences?.faceRecognitionAttendance || false,
        });
      } else if (settingsResult.status === "rejected") {
        throw settingsResult.reason;
      }

      if (profileResult.status === "fulfilled" && profileResult.value.success) {
        const admin = profileResult.value.data;
        setAdminForm({
          name: admin.name || `${admin.firstName || ""} ${admin.lastName || ""}`.trim() || "",
          email: admin.email || "",
          phone: admin.phoneNumber || admin.phone || "",
          bio: admin.bio || "",
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load data";
      setError(message);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleAdminInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAdminForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePreferenceToggle = (key: keyof typeof preferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const saveAdminProfile = async () => {
    try {
      setSaving(true);
      const response = await authAPI.updateProfile(adminForm);
      if (response.success) {
        toast.success("Profile updated successfully!");
        await fetchSettings();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (!passwordForm.currentPassword) {
      toast.error("Current password is required");
      return;
    }

    try {
      setSaving(true);
      const response = await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      if (response.success) {
        toast.success("Password changed successfully!");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to change password";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const response = await settingsAPI.updatePreferences(preferences);
      if (response.success) {
        toast.success("Preferences updated successfully!");
        await fetchSettings();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update preferences";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "A";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg p-8">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h3 className="text-xl font-semibold mb-2">Failed to load data</h3>
        <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">{error}</p>
        <Button onClick={fetchSettings}>
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-3 -ml-2" asChild>
          <Link to={APP_ROUTES.settings.index}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to settings
          </Link>
        </Button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UserCog className="h-6 w-6 text-primary" />
          Admin profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your account details, password, and system preferences.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="glass lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg gradient-brand text-white">
                  {getInitials(adminForm.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Manage your personal information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Full name *</Label>
                <Input name="name" value={adminForm.name} onChange={handleAdminInput} />
              </div>
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input name="email" type="email" value={adminForm.email} disabled />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input name="phone" value={adminForm.phone} onChange={handleAdminInput} />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label>Bio</Label>
                <textarea
                  name="bio"
                  value={adminForm.bio}
                  onChange={handleAdminInput}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button className="gradient-brand text-white border-0" onClick={saveAdminProfile} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Update profile
              </Button>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Key className="h-4 w-4 text-primary" />
                Change password
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Current password</Label>
                  <Input
                    name="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordInput}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>New password</Label>
                  <Input
                    name="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordInput}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirm password</Label>
                  <Input
                    name="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordInput}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <Button
                  variant="outline"
                  onClick={changePassword}
                  disabled={saving || !passwordForm.currentPassword || !passwordForm.newPassword}
                >
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Key className="h-4 w-4 mr-2" />}
                  Change password
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Configure system preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: "darkMode", label: "Enable dark mode", desc: "Auto-syncs with system" },
              { key: "emailDigests", label: "Email digests", desc: "Weekly summary to admins" },
              { key: "publicPortal", label: "Public portal", desc: "Alumni & recruiters" },
              { key: "aiInsights", label: "AI insights", desc: "At-risk detection & auto-reports" },
              {
                key: "faceRecognitionAttendance",
                label: "Face recognition attendance",
                desc: "Requires camera hardware",
              },
            ].map((p) => (
              <div key={p.key} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{p.label}</div>
                  <div className="text-xs text-muted-foreground">{p.desc}</div>
                </div>
                <Switch
                  checked={preferences[p.key as keyof typeof preferences]}
                  onCheckedChange={() => handlePreferenceToggle(p.key as keyof typeof preferences)}
                />
              </div>
            ))}
            <Button className="w-full gradient-brand text-white border-0" onClick={savePreferences} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save preferences
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default SettingsProfilePage;
