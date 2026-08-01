// src/routes/app.settings.tsx
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Trash2
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { settingsAPI, Settings, Campus } from "@/lib/api/settings";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — ScholarOS" },
      { name: "description", content: "University profile, campuses, grading, permissions, themes, and integrations." },
      { property: "og:title", content: "Settings — ScholarOS" },
      { property: "og:description", content: "Configure your ERP." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [isCampusModalOpen, setIsCampusModalOpen] = useState<boolean>(false);
  const [editingCampus, setEditingCampus] = useState<Campus | null>(null);
  
  // Campus form state
  const [campusForm, setCampusForm] = useState({
    name: '',
    location: '',
    students: 0,
    staff: 0
  });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    universityName: '',
    shortCode: '',
    contactEmail: '',
    phone: '',
    currency: 'PKR',
    language: 'en',
    address: '',
    website: ''
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
      
      const response = await settingsAPI.getAll();
      if (response.success) {
        setSettings(response.data);
        
        // Update form states
        const data = response.data;
        setProfileForm({
          universityName: data.universityName || '',
          shortCode: data.shortCode || '',
          contactEmail: data.contactEmail || '',
          phone: data.phone || '',
          currency: data.currency || 'PKR',
          language: data.language || 'en',
          address: data.address || '',
          website: data.website || ''
        });
        
        setPreferences({
          darkMode: data.preferences?.darkMode || false,
          emailDigests: data.preferences?.emailDigests || true,
          publicPortal: data.preferences?.publicPortal || false,
          aiInsights: data.preferences?.aiInsights || true,
          faceRecognitionAttendance: data.preferences?.faceRecognitionAttendance || false
        });
      }
    } catch (error: any) {
      console.error('Failed to fetch settings:', error);
      setError(error.message || 'Failed to load settings');
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Handle profile input change
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle profile select change
  const handleProfileSelectChange = (name: string, value: string) => {
    setProfileForm(prev => ({ ...prev, [name]: value }));
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

  // Save profile
  const saveProfile = async () => {
    try {
      setSaving(true);
      const response = await settingsAPI.updateProfile(profileForm);
      if (response.success) {
        toast.success('Profile updated successfully!');
        await fetchSettings();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
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
      toast.error(error.message || 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  // Add/Update campus
  const handleCampusSubmit = async () => {
    try {
      if (!campusForm.name) {
        toast.error('Campus name is required');
        return;
      }

      setSaving(true);
      let response;
      
      if (editingCampus) {
        response = await settingsAPI.updateCampus(editingCampus._id!, campusForm);
      } else {
        response = await settingsAPI.addCampus(campusForm);
      }
      
      if (response.success) {
        toast.success(editingCampus ? 'Campus updated successfully!' : 'Campus added successfully!');
        setIsCampusModalOpen(false);
        setEditingCampus(null);
        setCampusForm({ name: '', location: '', students: 0, staff: 0 });
        await fetchSettings();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save campus');
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
        toast.success('Campus deleted successfully!');
        await fetchSettings();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete campus');
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

  // ✅ Get campuses with fallback to empty array
  const campuses = settings?.campuses || [];

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
      subtitle="Configure your university operating system"
      actions={
        <Button variant="outline" onClick={fetchSettings} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      }
    >
      <div className="grid lg:grid-cols-3 gap-4">
        {/* University Profile */}
        <Card className="glass lg:col-span-2">
          <CardHeader>
            <CardTitle>University profile</CardTitle>
            <CardDescription>Basic information shown across all portals</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>University name</Label>
              <Input 
                name="universityName"
                value={profileForm.universityName} 
                onChange={handleProfileChange}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Short code</Label>
              <Input 
                name="shortCode"
                value={profileForm.shortCode} 
                onChange={handleProfileChange}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Contact email</Label>
              <Input 
                name="contactEmail"
                type="email"
                value={profileForm.contactEmail} 
                onChange={handleProfileChange}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input 
                name="phone"
                value={profileForm.phone} 
                onChange={handleProfileChange}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input 
                name="address"
                value={profileForm.address} 
                onChange={handleProfileChange}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input 
                name="website"
                value={profileForm.website} 
                onChange={handleProfileChange}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select 
                value={profileForm.currency} 
                onValueChange={(val) => handleProfileSelectChange('currency', val)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PKR">PKR — Pakistani Rupee</SelectItem>
                  <SelectItem value="USD">USD — US Dollar</SelectItem>
                  <SelectItem value="GBP">GBP — Pound Sterling</SelectItem>
                  <SelectItem value="EUR">EUR — Euro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Language</Label>
              <Select 
                value={profileForm.language} 
                onValueChange={(val) => handleProfileSelectChange('language', val)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ur">اردو (Urdu)</SelectItem>
                  <SelectItem value="ar">العربية (Arabic)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button 
                className="gradient-brand text-white border-0" 
                onClick={saveProfile}
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save changes
              </Button>
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
              <div key={campus._id} className="rounded-xl border p-4 bg-card/50 card-hover relative group">
                <div className="h-10 w-10 rounded-xl gradient-brand flex items-center justify-center mb-3">
                  <Globe className="h-5 w-5 text-white" />
                </div>
                <div className="font-semibold text-sm">{campus.name}</div>
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