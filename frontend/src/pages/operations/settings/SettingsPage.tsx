// src/routes/app.settings.tsx
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  QrCode, 
  Download, 
  Printer, 
  Palette, 
  Globe, 
  School, 
  Loader2, 
  RefreshCw, 
  AlertCircle,
  Plus,
  X,
  Save,
  Pencil,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Building2,
  UserCog,
  Shield,
  Key,
  Camera,
  User as UserIcon
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { settingsAPI, Settings, Campus, AddCampusData, UpdateCampusData } from "@/lib/api/settings";
import { authAPI, User } from "@/lib/api/auth";


export function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [adminProfile, setAdminProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [isCampusModalOpen, setIsCampusModalOpen] = useState<boolean>(false);
  const [editingCampus, setEditingCampus] = useState<Campus | null>(null);
  
  // Campus form state
  const [campusForm, setCampusForm] = useState<AddCampusData>({
    name: '',
    location: '',
    students: 0,
    staff: 0
  });

  // Admin Profile form state
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    bio: '',
    location: '',
    profileImage: ''
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

  const syncCampuses = (campuses: Campus[]) => {
    setSettings((prev) => prev ? { ...prev, campuses } : prev);
  };

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
        setAdminProfile(profileResult.value.data);
        const admin = profileResult.value.data;
        setAdminForm({
          name: admin.name || '',
          email: admin.email || '',
          phone: admin.phone || '',
          department: admin.department || '',
          designation: admin.designation || '',
          bio: admin.bio || '',
          location: admin.location || '',
          profileImage: admin.profileImage || ''
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

  // Handle profile select change
  const handleProfileSelectChange = (name: string, value: string) => {
    setAdminForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle preference toggle
  const handlePreferenceToggle = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Handle campus form input
  const handleCampusInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCampusForm(prev => ({
      ...prev,
      [name]: name === 'students' || name === 'staff' ? parseInt(value) || 0 : value
    }));
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

  // ✅ FIXED: Add/Update campus with proper data handling
  const handleCampusSubmit = async () => {
    try {
      // Validate required fields
      if (!campusForm.name || campusForm.name.trim() === '') {
        toast.error('Campus name is required');
        return;
      }

      // Prepare the data
      const campusData: AddCampusData = {
        name: campusForm.name.trim(),
        location: campusForm.location?.trim() || '',
        students: Number(campusForm.students) || 0,
        staff: Number(campusForm.staff) || 0
      };

      setSaving(true);
      
      let response;
      
      if (editingCampus) {
        // Update existing campus
       response = await settingsAPI.updateCampus(editingCampus._id!, campusData);
      } else {
        // Add new campus
        response = await settingsAPI.addCampus(campusData);
      }
       
      if (response.success) {
        const nextCampuses = response.data?.campuses || [];
        syncCampuses(nextCampuses);
        toast.success(editingCampus ? 'Campus updated successfully!' : 'Campus added successfully!');
        setIsCampusModalOpen(false);
        setEditingCampus(null);
        setCampusForm({ name: '', location: '', students: 0, staff: 0 });
        // Refresh the data in the background
        await fetchSettings();
      } else {
        toast.error(response.message || 'Failed to save campus');
      }
    } catch (error: any) {
      console.error('❌ Error saving campus:', error);
      
      // Handle specific error cases
      if (error.response?.status === 409) {
        toast.error(error.response?.data?.message || 'Campus name already exists');
      } else if (error.response?.status === 400) {
        const errors = error.response?.data?.errors;
        if (errors && Array.isArray(errors)) {
          const errorMessages = errors.map((err: any) => err.message).join(', ');
          toast.error(`Validation error: ${errorMessages}`);
        } else {
          toast.error(error.response?.data?.message || 'Invalid data provided');
        }
      } else {
        toast.error(error.message || 'Failed to save campus');
      }
    } finally {
      setSaving(false);
    }
  };

  // Delete campus
  const deleteCampus = async (campusId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    
    try {
      const response = await settingsAPI.deleteCampus(campusId);
      if (response.success) {
        const nextCampuses = response.data?.campuses || [];
        syncCampuses(nextCampuses);
        toast.success('Campus deleted successfully!');
        await fetchSettings();
      }
    } catch (error: any) {
      console.error('❌ Error deleting campus:', error);
      toast.error(error.message || 'Failed to delete campus');
    }
  };

  // Toggle campus status
  const toggleCampusStatus = async (campusId: string, currentStatus: boolean) => {
    try {
      const response = await settingsAPI.toggleCampusStatus(campusId);
      if (response.success) {
        const nextCampuses = response.data?.campuses || [];
        syncCampuses(nextCampuses);
        toast.success(`Campus ${currentStatus ? 'deactivated' : 'activated'} successfully!`);
        await fetchSettings();
      }
    } catch (error: any) {
      console.error('❌ Error toggling campus status:', error);
      toast.error(error.message || 'Failed to toggle campus status');
    }
  };

  // Open edit campus modal
  const openEditCampus = (campus: Campus) => {
    setEditingCampus(campus);
    setCampusForm({
      name: campus.name,
      location: campus.location || '',
      students: campus.students || 0,
      staff: campus.staff || 0
    });
    setIsCampusModalOpen(true);
  };

  // Open add campus modal
  const openAddCampus = () => {
    setEditingCampus(null);
    setCampusForm({ name: '', location: '', students: 0, staff: 0 });
    setIsCampusModalOpen(true);
  };

  // Get campuses with fallback to empty array
  const campuses = settings?.campuses || [];

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
                <AvatarImage src={adminForm.profileImage} />
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
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Input 
                  name="department"
                  value={adminForm.department} 
                  onChange={handleAdminInput}
                  placeholder="e.g., Administration"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Designation</Label>
                <Input 
                  name="designation"
                  value={adminForm.designation} 
                  onChange={handleAdminInput}
                  placeholder="e.g., System Administrator"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input 
                  name="location"
                  value={adminForm.location} 
                  onChange={handleAdminInput}
                  placeholder="e.g., Islamabad, Pakistan"
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

      {/* Multi-campus */}
      <Card className="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <School className="h-4 w-4" /> Multi-campus
              </CardTitle>
              <CardDescription>Each campus keeps its own students, faculty, finance, and analytics</CardDescription>
            </div>
            <Button onClick={openAddCampus} className="gradient-brand text-white border-0">
              <Plus className="h-4 w-4 mr-2" /> Add Campus
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {campuses.length > 0 ? (
            campuses.map((campus) => (
              <div 
                key={campus._id} 
                className={`rounded-xl border p-4 bg-card/50 card-hover relative group ${
                  !campus.isActive ? 'opacity-60' : ''
                }`}
              >
                <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center mb-3">
                  <Globe className="h-5 w-5 text-white" />
                </div>
                <div className="font-semibold text-sm flex items-center gap-2">
                  {campus.name}
                  {!campus.isActive && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                      Inactive
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {campus.students} students · {campus.staff} staff
                </div>
                {campus.location && (
                  <div className="text-xs text-muted-foreground">{campus.location}</div>
                )}
                <div className="flex gap-2 mt-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => openEditCampus(campus)}
                  >
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    className="flex-1"
                    onClick={() => deleteCampus(campus._id!, campus.name)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                  </Button>
                </div>
                <div className="mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => toggleCampusStatus(campus._id!, campus.isActive)}
                  >
                    {campus.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No campuses added yet. Click "Add Campus" to create one.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campus Modal */}
      {isCampusModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsCampusModalOpen(false);
              setEditingCampus(null);
              setCampusForm({ name: '', location: '', students: 0, staff: 0 });
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <School className="h-5 w-5 text-primary" />
                {editingCampus ? 'Edit Campus' : 'Add New Campus'}
              </h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setIsCampusModalOpen(false);
                  setEditingCampus(null);
                  setCampusForm({ name: '', location: '', students: 0, staff: 0 });
                }} 
                className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="campusName">Campus Name *</Label>
                <Input
                  id="campusName"
                  name="name"
                  value={campusForm.name}
                  onChange={handleCampusInput}
                  placeholder="Enter campus name..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="campusLocation">Location</Label>
                <Input
                  id="campusLocation"
                  name="location"
                  value={campusForm.location}
                  onChange={handleCampusInput}
                  placeholder="City, Country..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="students">Students</Label>
                  <Input
                    id="students"
                    name="students"
                    type="number"
                    min="0"
                    value={campusForm.students}
                    onChange={handleCampusInput}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff">Staff</Label>
                  <Input
                    id="staff"
                    name="staff"
                    type="number"
                    min="0"
                    value={campusForm.staff}
                    onChange={handleCampusInput}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsCampusModalOpen(false);
                    setEditingCampus(null);
                    setCampusForm({ name: '', location: '', students: 0, staff: 0 });
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="gradient-brand text-white border-0" 
                  onClick={handleCampusSubmit}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingCampus ? 'Update Campus' : 'Add Campus'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default SettingsPage;
