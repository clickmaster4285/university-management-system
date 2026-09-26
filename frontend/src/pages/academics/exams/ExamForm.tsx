import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Save, Loader2, ChevronLeft, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { examAPI, type Exam } from "@/features/exam";
import { offeringAPI, type CourseOffering } from "@/features/offerings";
import { type Subject } from "@/features/subjects";

const examTypes = [
  "Midterm",
  "Final",
  "Quiz",
  "Lab Assessment",
  "Project Defense",
  "Case Study",
  "Written Exam",
  "Practical",
  "Viva",
  "Other",
];
const examStatuses = ["Scheduled", "In Progress", "Completed", "Cancelled", "Postponed"];
const programs = [
  "BSCS",
  "BSSE",
  "BBA",
  "MBA",
  "BEE",
  "BME",
  "BSAI",
  "BSDS",
  "BSEE",
  "MSDS",
  "BS Physics",
  "BS Math",
  "LLB",
];

export type ExamFormData = {
  title: string;
  type: string;
  course: string;
  courseCode: string;
  department: string;
  program: string;
  semester: number;
  academicYear: string;
  instructor: string;
  instructorEmail: string;
  totalMarks: number;
  passingMarks: number;
  weightage: number;
  examDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  hall: string;
  building: string;
  invigilators: Array<{ name: string; email: string }>;
  status: string;
  instructions: string;
};

const emptyForm = (instructor = "", instructorEmail = ""): ExamFormData => ({
  title: "",
  type: "Midterm",
  course: "",
  courseCode: "",
  department: "",
  program: "",
  semester: 1,
  academicYear: new Date().getFullYear().toString(),
  instructor,
  instructorEmail,
  totalMarks: 100,
  passingMarks: 40,
  weightage: 20,
  examDate: "",
  startTime: "",
  endTime: "",
  duration: 60,
  hall: "",
  building: "",
  invigilators: [{ name: "", email: "" }],
  status: "Scheduled",
  instructions: "",
});

const toFormData = (exam: Exam): ExamFormData => ({
  title: exam.title || "",
  type: exam.type || "Midterm",
  course: exam.course || "",
  courseCode: exam.courseCode || "",
  department: exam.department || "",
  program: exam.program || "",
  semester: exam.semester || 1,
  academicYear: exam.academicYear || new Date().getFullYear().toString(),
  instructor: exam.instructor || "",
  instructorEmail: exam.instructorEmail || "",
  totalMarks: exam.totalMarks || 100,
  passingMarks: exam.passingMarks || 40,
  weightage: exam.weightage || 20,
  examDate: exam.examDate ? new Date(exam.examDate).toISOString().split("T")[0] : "",
  startTime: exam.startTime || "",
  endTime: exam.endTime || "",
  duration: exam.duration || 60,
  hall: exam.hall || "",
  building: exam.building || "",
  invigilators: exam.invigilators || [{ name: "", email: "" }],
  status: exam.status || "Scheduled",
  instructions: exam.instructions || "",
});

const getOfferingSubject = (offering: CourseOffering) =>
  typeof offering.subjectId === "object" ? (offering.subjectId as Subject) : null;

const getOfferingLabel = (offering: CourseOffering) => {
  const subject = getOfferingSubject(offering);
  return `${offering.offeringId || ""} — ${subject?.code || ""} ${subject?.name || ""}`.trim();
};

interface ExamFormProps {
  mode: "create" | "edit";
  exam?: Exam | null;
}

export function ExamForm({ mode, exam }: ExamFormProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState<ExamFormData>(
    mode === "create" ? emptyForm(user?.name || "", user?.email || "") : emptyForm()
  );
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [offeringsLoading, setOfferingsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        setOfferingsLoading(true);
        const response = await offeringAPI.getAll({ status: "Active", limit: 500 });
        if (response && response.success) {
          setOfferings(response.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch offerings:", error);
        toast.error("Failed to load offerings");
      } finally {
        setOfferingsLoading(false);
      }
    };
    fetchOfferings();
  }, []);

  useEffect(() => {
    if (mode === "edit" && exam) {
      setFormData(toFormData(exam));
    }
  }, [mode, exam]);

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
    } else if (name === "invigilators") {
      const invigilators = value.split(",").map((v) => ({ name: v.trim(), email: "" }));
      setFormData((prev) => ({
        ...prev,
        invigilators: invigilators.length > 0 ? invigilators : [{ name: "", email: "" }],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          name === "semester" ||
          name === "totalMarks" ||
          name === "passingMarks" ||
          name === "weightage" ||
          name === "duration"
            ? parseFloat(value) || 0
            : value,
      }));
    }
  };

  const handleOfferingSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selected = offerings.find((o) => o._id === selectedId);

    if (selected) {
      const subject = getOfferingSubject(selected);
      const program = typeof selected.programId === "object" ? selected.programId : null;
      const instructor = typeof selected.instructorId === "object" ? selected.instructorId : null;
      const dept =
        subject && typeof subject.departmentId === "object" ? subject.departmentId : null;

      setFormData((prev) => ({
        ...prev,
        course: subject?.name || "",
        courseCode: subject?.code || "",
        department: dept?.name || prev.department,
        program: program?.code || program?.name || prev.program,
        semester: selected.semester,
        instructor: instructor?.name || prev.instructor,
      }));
      toast.success(`Offering selected: ${subject?.code} — ${subject?.name}`);
    } else {
      setFormData((prev) => ({
        ...prev,
        course: "",
        courseCode: "",
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const requiredFields = [
        "title",
        "type",
        "course",
        "courseCode",
        "department",
        "program",
        "semester",
        "instructor",
        "examDate",
        "startTime",
        "endTime",
        "duration",
        "hall",
        "totalMarks",
        "passingMarks",
      ];
      const missingFields = requiredFields.filter(
        (field) => !formData[field as keyof typeof formData]
      );

      if (missingFields.length > 0) {
        toast.error(`Please fill all required fields: ${missingFields.join(", ")}`);
        setIsSubmitting(false);
        return;
      }

      const examData = {
        title: formData.title.trim(),
        type: formData.type,
        course: formData.course.trim(),
        courseCode: formData.courseCode.trim(),
        department: formData.department.trim(),
        program: formData.program.trim(),
        semester: Number(formData.semester),
        academicYear: formData.academicYear || new Date().getFullYear().toString(),
        instructor: formData.instructor.trim(),
        instructorEmail: formData.instructorEmail || "",
        totalMarks: Number(formData.totalMarks),
        passingMarks: Number(formData.passingMarks),
        weightage: Number(formData.weightage) || 0,
        examDate: formData.examDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        duration: Number(formData.duration),
        hall: formData.hall.trim(),
        building: formData.building || "",
        invigilators: formData.invigilators.filter((i) => i.name.trim() !== ""),
        status: formData.status || "Scheduled",
        instructions: formData.instructions || "",
      };

      if (mode === "edit" && exam?._id) {
        const response = await examAPI.update(exam._id, examData);
        if (response && response.success) {
          toast.success("Exam updated successfully!");
          navigate("/exams");
        } else {
          toast.error(response?.message || "Failed to update exam");
        }
      } else {
        const response = await examAPI.create(examData);
        if (response && response.success) {
          toast.success(`Exam created successfully! ID: ${response.data?.examId || "generated"}`);
          navigate("/exams");
        } else {
          toast.error(response?.message || "Failed to create exam");
        }
      }
    } catch (error: unknown) {
      console.error("❌ Failed to save exam:", error);

      let errorMsg = mode === "edit" ? "Failed to update exam" : "Failed to create exam";
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
      setIsSubmitting(false);
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
            onClick={() => navigate("/exams")}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to exams
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {mode === "edit" ? (
              <>
                <Pencil className="h-5 w-5 text-primary" />
                Edit Exam
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 text-primary" />
                New Exam
              </>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "edit" ? "Update exam details and schedule" : "Schedule a new exam"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <h3 className="font-semibold text-sm text-muted-foreground mb-3">Basic Information</h3>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Exam Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Exam Type *</Label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                {examTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
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
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {examStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="courseSelect">Select Offering *</Label>
              <select
                id="courseSelect"
                name="courseSelect"
                onChange={handleOfferingSelect}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                value={
                  formData.courseCode
                    ? offerings.find((o) => getOfferingSubject(o)?.code === formData.courseCode)
                        ?._id || ""
                    : ""
                }
                required
              >
                <option value="">Select an offering</option>
                {offeringsLoading ? (
                  <option value="" disabled>
                    Loading offerings...
                  </option>
                ) : offerings.length === 0 ? (
                  <option value="" disabled>
                    No offerings available
                  </option>
                ) : (
                  offerings.map((offering) => (
                    <option key={offering._id} value={offering._id}>
                      {getOfferingLabel(offering)}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="courseCode">Course Code *</Label>
              <Input
                id="courseCode"
                name="courseCode"
                value={formData.courseCode}
                onChange={handleInputChange}
                className="bg-gray-50"
                required
                readOnly={!!formData.course}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Input
                id="department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="bg-gray-50"
                required
                readOnly={!!formData.course}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="program">Program *</Label>
              <select
                id="program"
                name="program"
                value={formData.program}
                onChange={handleInputChange}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select Program</option>
                {programs.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester">Semester *</Label>
              <Input
                id="semester"
                name="semester"
                type="number"
                min="1"
                max="8"
                value={formData.semester}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="academicYear">Academic Year</Label>
              <Input
                id="academicYear"
                name="academicYear"
                value={formData.academicYear}
                onChange={handleInputChange}
              />
            </div>

            <div className="md:col-span-2">
              <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">
                Instructor Information
              </h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructor">Instructor Name *</Label>
              <Input
                id="instructor"
                name="instructor"
                value={formData.instructor}
                onChange={handleInputChange}
                className="bg-gray-50"
                required
                readOnly={!!formData.course}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructorEmail">Instructor Email</Label>
              <Input
                id="instructorEmail"
                name="instructorEmail"
                type="email"
                value={formData.instructorEmail}
                onChange={handleInputChange}
              />
            </div>

            <div className="md:col-span-2">
              <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Exam Details</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalMarks">Total Marks *</Label>
              <Input
                id="totalMarks"
                name="totalMarks"
                type="number"
                min="0"
                value={formData.totalMarks}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passingMarks">Passing Marks *</Label>
              <Input
                id="passingMarks"
                name="passingMarks"
                type="number"
                min="0"
                value={formData.passingMarks}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weightage">Weightage (%)</Label>
              <Input
                id="weightage"
                name="weightage"
                type="number"
                min="0"
                max="100"
                value={formData.weightage}
                onChange={handleInputChange}
              />
            </div>

            <div className="md:col-span-2">
              <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">
                Schedule & Location
              </h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="examDate">Exam Date *</Label>
              <Input
                id="examDate"
                name="examDate"
                type="date"
                value={formData.examDate}
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

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                min="15"
                value={formData.duration}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hall">Hall *</Label>
              <Input
                id="hall"
                name="hall"
                value={formData.hall}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="building">Building</Label>
              <Input
                id="building"
                name="building"
                value={formData.building}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="invigilators">Invigilators (comma separated)</Label>
              <Input
                id="invigilators"
                name="invigilators"
                value={formData.invigilators.map((i) => i.name).join(", ")}
                onChange={handleInputChange}
                placeholder="Dr. Ali, Dr. Sara, Dr. Bilal"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="instructions">Instructions</Label>
              <textarea
                id="instructions"
                name="instructions"
                value={formData.instructions}
                onChange={handleInputChange}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => navigate("/exams")}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="gradient-brand text-white border-0"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {mode === "edit" ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {mode === "edit" ? "Update Exam" : "Create Exam"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default ExamForm;
