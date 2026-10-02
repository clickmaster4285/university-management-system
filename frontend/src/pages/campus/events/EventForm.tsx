import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Loader2, ChevronLeft, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { eventAPI, type Event } from "@/features/event";

const eventTypes = [
  "Seminar",
  "Workshop",
  "Conference",
  "Sports",
  "Cultural",
  "Academic",
  "Career Fair",
  "Hackathon",
  "Convocation",
  "Other",
];
const eventCategories = ["Academic", "Sports", "Cultural", "Social", "Career", "Technical", "Other"];
const eventStatuses = ["Upcoming", "Ongoing", "Completed", "Cancelled", "Postponed"];
const campuses = [
  "Main Campus - Islamabad",
  "North Campus - Lahore",
  "South Campus - Karachi",
  "East Campus - Peshawar",
];
const targetAudienceOptions = ["Students", "Faculty", "Staff", "Public", "Industry", "Alumni"];

export type EventFormData = {
  title: string;
  description: string;
  type: string;
  category: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  address: string;
  campus: string;
  organizer: string;
  organizerEmail: string;
  organizerPhone: string;
  capacity: number;
  registrationFee: number;
  isRegistrationRequired: boolean;
  registrationDeadline: string;
  status: string;
  isFeatured: boolean;
  isPublished: boolean;
  imageUrl: string;
  tags: string;
  targetAudience: string[];
  prerequisites: string;
  dressCode: string;
  parkingInfo: string;
};

const emptyForm = (): EventFormData => ({
  title: "",
  description: "",
  type: "Seminar",
  category: "Academic",
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  venue: "",
  address: "",
  campus: "Main Campus - Islamabad",
  organizer: "",
  organizerEmail: "",
  organizerPhone: "",
  capacity: 50,
  registrationFee: 0,
  isRegistrationRequired: true,
  registrationDeadline: "",
  status: "Upcoming",
  isFeatured: false,
  isPublished: true,
  imageUrl: "",
  tags: "",
  targetAudience: [],
  prerequisites: "",
  dressCode: "",
  parkingInfo: "",
});

const toFormData = (event: Event): EventFormData => ({
  title: event.title || "",
  description: event.description || "",
  type: event.type || "Seminar",
  category: event.category || "Academic",
  startDate: event.startDate ? new Date(event.startDate).toISOString().split("T")[0] : "",
  endDate: event.endDate ? new Date(event.endDate).toISOString().split("T")[0] : "",
  startTime: event.startTime || "",
  endTime: event.endTime || "",
  venue: event.venue || "",
  address: event.address || "",
  campus: event.campus || "Main Campus - Islamabad",
  organizer: event.organizer || "",
  organizerEmail: event.organizerEmail || "",
  organizerPhone: event.organizerPhone || "",
  capacity: event.capacity || 50,
  registrationFee: event.registrationFee || 0,
  isRegistrationRequired:
    event.isRegistrationRequired !== undefined ? event.isRegistrationRequired : true,
  registrationDeadline: event.registrationDeadline
    ? new Date(event.registrationDeadline).toISOString().split("T")[0]
    : "",
  status: event.status || "Upcoming",
  isFeatured: event.isFeatured || false,
  isPublished: event.isPublished !== undefined ? event.isPublished : true,
  imageUrl: event.imageUrl || "",
  tags: event.tags?.join(", ") || "",
  targetAudience: event.targetAudience || [],
  prerequisites: event.prerequisites || "",
  dressCode: event.dressCode || "",
  parkingInfo: event.parkingInfo || "",
});

const getEventRecordId = (event: Event) => event._id || "";

interface EventFormProps {
  mode: "create" | "edit";
  event?: Event | null;
}

export function EventForm({ mode, event }: EventFormProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<EventFormData>(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (mode === "edit" && event) {
      setFormData(toFormData(event));
    } else if (mode === "create") {
      setFormData(emptyForm());
    }
  }, [mode, event]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else if (name === "targetAudience") {
      const select = e.target as HTMLSelectElement;
      const selectedValues = Array.from(select.selectedOptions).map((option) => option.value);
      setFormData((prev) => ({
        ...prev,
        targetAudience: selectedValues,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          name === "capacity" || name === "registrationFee" ? parseFloat(value) || 0 : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const requiredFields = [
        "title",
        "description",
        "type",
        "category",
        "startDate",
        "endDate",
        "startTime",
        "endTime",
        "venue",
        "campus",
        "organizer",
        "capacity",
      ];
      const missingFields = requiredFields.filter(
        (field) => !formData[field as keyof EventFormData]
      );

      if (missingFields.length > 0) {
        toast.error(`Please fill all required fields: ${missingFields.join(", ")}`);
        setSaving(false);
        return;
      }

      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        category: formData.category,
        startDate: formData.startDate,
        endDate: formData.endDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        venue: formData.venue.trim(),
        address: formData.address.trim(),
        campus: formData.campus,
        organizer: formData.organizer.trim(),
        organizerEmail: formData.organizerEmail.trim(),
        organizerPhone: formData.organizerPhone.trim(),
        capacity: Number(formData.capacity),
        registrationFee: Number(formData.registrationFee),
        isRegistrationRequired: formData.isRegistrationRequired,
        registrationDeadline: formData.registrationDeadline || undefined,
        status: formData.status,
        isFeatured: formData.isFeatured,
        isPublished: formData.isPublished,
        imageUrl: formData.imageUrl.trim(),
        tags: formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        targetAudience: formData.targetAudience,
        prerequisites: formData.prerequisites.trim(),
        dressCode: formData.dressCode.trim(),
        parkingInfo: formData.parkingInfo.trim(),
      };

      if (mode === "edit") {
        const id = event ? getEventRecordId(event) : "";
        if (!id) {
          toast.error("Cannot update event: missing ID");
          setSaving(false);
          return;
        }
        const response = await eventAPI.update(id, eventData);
        if (response && response.success) {
          toast.success("Event updated successfully!");
        } else {
          toast.error(response?.message || "Failed to update event");
          setSaving(false);
          return;
        }
      } else {
        const response = await eventAPI.create(eventData);
        if (response && response.success) {
          toast.success(
            `Event created successfully! ID: ${response.data?.eventId || "generated"}`
          );
        } else {
          toast.error(response?.message || "Failed to create event");
          setSaving(false);
          return;
        }
      }

      navigate("/events");
    } catch (error: unknown) {
      console.error("Failed to save event:", error);
      let errorMsg = mode === "edit" ? "Failed to update event" : "Failed to create event";
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (
        err.message?.includes("NetworkError") ||
        err.message?.includes("Failed to fetch")
      ) {
        errorMsg = "Network error. Please check if backend server is running.";
      }
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-6 md:p-8">
        <div className="mb-6">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mb-3 -ml-2"
            onClick={() => navigate("/events")}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to events
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {mode === "edit" ? (
              <>
                <Pencil className="h-6 w-6 text-primary" />
                Edit Event
              </>
            ) : (
              <>
                <Plus className="h-6 w-6 text-primary" />
                New Event
              </>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "edit"
              ? "Update event details, schedule, and registration settings"
              : "Create a new campus event with schedule and registration details"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <h3 className="font-semibold text-sm text-muted-foreground mb-3">
                Basic Information
              </h3>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description *</Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Event Type *</Label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                {eventTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                {eventCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {eventStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 flex items-center gap-2">
              <input
                id="isFeatured"
                name="isFeatured"
                type="checkbox"
                checked={formData.isFeatured}
                onChange={handleInputChange}
                className="h-4 w-4"
              />
              <Label htmlFor="isFeatured">Featured Event</Label>
            </div>

            <div className="md:col-span-2">
              <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">
                Date & Time
              </h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                name="endTime"
                type="time"
                value={formData.endTime}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="md:col-span-2">
              <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Location</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue">Venue *</Label>
              <Input
                id="venue"
                name="venue"
                value={formData.venue}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campus">Campus *</Label>
              <select
                id="campus"
                name="campus"
                value={formData.campus}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                {campuses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">
                Organizer Information
              </h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizer">Organizer *</Label>
              <Input
                id="organizer"
                name="organizer"
                value={formData.organizer}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizerEmail">Organizer Email</Label>
              <Input
                id="organizerEmail"
                name="organizerEmail"
                type="email"
                value={formData.organizerEmail}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizerPhone">Organizer Phone</Label>
              <Input
                id="organizerPhone"
                name="organizerPhone"
                value={formData.organizerPhone}
                onChange={handleInputChange}
              />
            </div>

            <div className="md:col-span-2">
              <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">
                Capacity & Registration
              </h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity *</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="registrationFee">Registration Fee (PKR)</Label>
              <Input
                id="registrationFee"
                name="registrationFee"
                type="number"
                min="0"
                value={formData.registrationFee}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2 flex items-center gap-2">
              <input
                id="isRegistrationRequired"
                name="isRegistrationRequired"
                type="checkbox"
                checked={formData.isRegistrationRequired}
                onChange={handleInputChange}
                className="h-4 w-4"
              />
              <Label htmlFor="isRegistrationRequired">Registration Required</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="registrationDeadline">Registration Deadline</Label>
              <Input
                id="registrationDeadline"
                name="registrationDeadline"
                type="date"
                value={formData.registrationDeadline}
                onChange={handleInputChange}
              />
            </div>

            <div className="md:col-span-2">
              <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">
                Additional Information
              </h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                placeholder="AI, Technology, Future"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetAudience">Target Audience</Label>
              <select
                id="targetAudience"
                name="targetAudience"
                multiple
                value={formData.targetAudience}
                onChange={handleInputChange}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-24"
              >
                {targetAudienceOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Hold Ctrl/Cmd to select multiple</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prerequisites">Prerequisites</Label>
              <Input
                id="prerequisites"
                name="prerequisites"
                value={formData.prerequisites}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dressCode">Dress Code</Label>
              <Input
                id="dressCode"
                name="dressCode"
                value={formData.dressCode}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="parkingInfo">Parking Information</Label>
              <Input
                id="parkingInfo"
                name="parkingInfo"
                value={formData.parkingInfo}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => navigate("/events")}>
              Cancel
            </Button>
            <Button type="submit" className="gradient-brand text-white border-0" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {mode === "edit" ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {mode === "edit" ? "Update Event" : "Create Event"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default EventForm;
