// src/routes/app.settings.tsx
import { AppShell } from "@/layouts";
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
  Camera
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { settingsAPI, Settings } from "@/features/settings";
import { authAPI } from "@/features/auth";


export function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  // Admin Profile form state
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
  });

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    darkMode: false,
    emailDigests: true,
    publicPortal: false,
    aiInsights: true,
    faceRecognitionAttendance: false
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      
      const [settingsResult, profileResult] = await Promise.allSettled([
        settingsAPI.getAll(),
        authAPI.getProfile()
      ]);

      if (settingsResult.status === 'fulfilled' && settingsResult.value.success) {
        const data = settingsResult.value.data;
        setSettings(data);
        
        // Update form states
        setPreferences({
          darkMode: data.preferences?.darkMode || false,
          emailDigests: data.preferences?.emailDigests || true,
          publicPortal: data.preferences?.publicPortal || false,
          aiInsights: data.preferences?.aiInsights || true,
          faceRecognitionAttendance: data.preferences?.faceRecognitionAttendance || false
        });
      } else if (settingsResult.status === 'rejected') {
        throw settingsResult.reason;
      }

      if (profileResult.status === 'fulfilled' && profileResult.value.success) {
        const admin = profileResult.value.data;
        setAdminForm({
          name: admin.name || `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || '',
          email: admin.email || '',
          phone: admin.phoneNumber || admin.phone || '',
          bio: admin.bio || '',
        });
      } else if (profileResult.status === 'rejected') {
        console.warn('Profile refresh failed, continuing with settings view:', profileResult.reason);
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch data:', error);
      setError(error.message || 'Failed to load data');
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Handle admin profile input change
  const handleAdminInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAdminForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle password input change
  const handlePasswordInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle preference toggle
  const handlePreferenceToggle = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Save admin profile
  const saveAdminProfile = async () => {
    try {
      setSaving(true);
      const response = await authAPI.updateProfile(adminForm);
      if (response.success) {
        toast.success('Profile updated successfully!');
        await fetchSettings();
      }
    } catch (error: any) {
      console.error('❌ Error saving profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const changePassword = async () => {
    try {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }

      if (!passwordForm.currentPassword) {
        toast.error('Current password is required');
        return;
      }

      setSaving(true);
      const response = await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      if (response.success) {
        toast.success('Password changed successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error: any) {
      console.error('❌ Error changing password:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  // Save preferences
  const savePreferences = async () => {
    try {
      setSaving(true);
     const response = await settingsAPI.updatePreferences(preferences);
      if (response.success) {
        toast.success('Preferences updated successfully!');
        await fetchSettings();
      }
    } catch (error: any) {
      console.error('❌ Error saving preferences:', error);
      toast.error(error.message || 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <AppShell title="Settings" subtitle="Loading settings...">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Settings" subtitle="Error loading data">
        <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg p-8">
          <AlertCircle className="h-16 w-16 text-destructive mb-4" />
          <h3 className="text-xl font-semibold mb-2">Failed to load data</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">{error}</p>
          <Button onClick={fetchSettings}>
            <RefreshCw className="h-4 w-4 mr-2" /> Retry
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell 
      title="Settings" 
      subtitle="Manage your profile and system settings"
      actions={
        <Button variant="outline" onClick={fetchSettings} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      }
    >
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Admin Profile */}
        <Card className="glass lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg gradient-brand text-white">
                  {getInitials(adminForm.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5 text-primary" />
                  Admin Profile
                </CardTitle>
                <CardDescription>Manage your personal information and account settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Full Name *</Label>
                <Input 
                  name="name"
                  value={adminForm.name} 
                  onChange={handleAdminInput}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input 
                  name="email"
                  type="email"
                  value={adminForm.email} 
                  onChange={handleAdminInput}
                  placeholder="admin@scholaros.edu"
                  disabled
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input 
                  name="phone"
                  value={adminForm.phone} 
                  onChange={handleAdminInput}
                  placeholder="+92 300 1234567"
                />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label>Bio</Label>
                <textarea
                  name="bio"
                  value={adminForm.bio}
                  onChange={handleAdminInput}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button 
                className="gradient-brand text-white border-0" 
                onClick={saveAdminProfile}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Update Profile
              </Button>
            </div>

            <Separator />

            {/* Change Password Section */}
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
                <Key className="h-4 w-4 text-primary" />
                Change Password
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Current Password</Label>
                  <Input 
                    name="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword} 
                    onChange={handlePasswordInput}
                    placeholder="Enter current password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>New Password</Label>
                  <Input 
                    name="newPassword"
                    type="password"
                    value={passwordForm.newPassword} 
                    onChange={handlePasswordInput}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirm Password</Label>
                  <Input 
                    name="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword} 
                    onChange={handlePasswordInput}
                    placeholder="Confirm new password"
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
                  Change Password
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Configure system preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'darkMode', label: "Enable dark mode", desc: "Auto-syncs with system" },
              { key: 'emailDigests', label: "Email digests", desc: "Weekly summary to admins" },
              { key: 'publicPortal', label: "Public portal", desc: "Alumni & recruiters" },
              { key: 'aiInsights', label: "AI insights", desc: "At-risk detection & auto-reports" },
              { key: 'faceRecognitionAttendance', label: "Face recognition attendance", desc: "Requires camera hardware" },
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
            <Button 
              className="w-full gradient-brand text-white border-0" 
              onClick={savePreferences}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Preferences
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

export default SettingsPage;
