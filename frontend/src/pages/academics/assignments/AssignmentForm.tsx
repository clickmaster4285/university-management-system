import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { assignmentAPI, type Assignment } from "@/features/assignment";
import { offeringAPI, type CourseOffering } from "@/features/offerings";
import { type Subject } from "@/features/subjects";
import {
  Plus,
  Pencil,
  X,
  Save,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";

const assignmentTypes = ['Homework', 'Quiz', 'Project', 'Lab Report', 'Research Paper', 'Presentation', 'Case Study', 'Other'];
const submissionTypes = ['File Upload', 'Text Entry', 'Link', 'Multiple'];
const statusOptions = ['Draft', 'Published', 'Open', 'Closed', 'Grading', 'Graded', 'Archived'];
const fileTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'zip', 'rar', 'jpg', 'png', 'txt', 'md'];
const programs = ['BSCS', 'BSSE', 'BBA', 'MBA', 'BEE', 'BME', 'BSAI', 'BSDS', 'BSEE', 'MSDS', 'BS Physics', 'BS Math', 'LLB'];

export type AssignmentFormData = {
  title: string;
  description: string;
  offeringId: string;
  course: string;
  courseCode: string;
  department: string;
  program: string;
  semester: number;
  academicYear: string;
  instructor: string;
  instructorEmail: string;
  type: string;
  maxScore: number;
  passingScore: number;
  weightage: number;
  dueDate: string;
  submissionDeadline: string;
  lateSubmissionDeadline: string;
  allowLateSubmissions: boolean;
  lateSubmissionPenalty: number;
  maxAttempts: number;
  submissionType: string;
  allowedFileTypes: string[];
  maxFileSize: number;
  status: string;
  instructions: string;
  gradingCriteria: string;
  rubric: Array<{ criterion: string; description: string; maxPoints: number }>;
};

const getAssignmentRecordId = (assignment: Assignment) => assignment._id || "";

const emptyForm = (user?: { name?: string; email?: string } | null): AssignmentFormData => ({
  title: '',
  description: '',
  offeringId: '',
  course: '',
  courseCode: '',
  department: '',
  program: '',
  semester: 1,
  academicYear: new Date().getFullYear().toString(),
  instructor: user?.name || '',
  instructorEmail: user?.email || '',
  type: 'Homework',
  maxScore: 100,
  passingScore: 60,
  weightage: 10,
  dueDate: '',
  submissionDeadline: '',
  lateSubmissionDeadline: '',
  allowLateSubmissions: false,
  lateSubmissionPenalty: 10,
  maxAttempts: 1,
  submissionType: 'File Upload',
  allowedFileTypes: ['pdf', 'doc', 'docx'],
  maxFileSize: 10485760,
  status: 'Draft',
  instructions: '',
  gradingCriteria: '',
  rubric: [{ criterion: '', description: '', maxPoints: 0 }],
});

const toFormData = (assignment: Assignment): AssignmentFormData => ({
  title: assignment.title || '',
  description: assignment.description || '',
  offeringId: typeof assignment.offeringId === 'string' ? assignment.offeringId : (assignment.offeringId as { _id?: string } | null)?._id || '',
  course: assignment.course || '',
  courseCode: assignment.courseCode || '',
  department: assignment.department || '',
  program: assignment.program || '',
  semester: assignment.semester || 1,
  academicYear: assignment.academicYear || new Date().getFullYear().toString(),
  instructor: assignment.instructor || '',
  instructorEmail: assignment.instructorEmail || '',
  type: assignment.type || 'Homework',
  maxScore: assignment.maxScore || 100,
  passingScore: assignment.passingScore || 60,
  weightage: assignment.weightage || 10,
  dueDate: assignment.dueDate ? new Date(assignment.dueDate).toISOString().split('T')[0] : '',
  submissionDeadline: assignment.submissionDeadline ? new Date(assignment.submissionDeadline).toISOString().split('T')[0] : '',
  lateSubmissionDeadline: assignment.lateSubmissionDeadline ? new Date(assignment.lateSubmissionDeadline).toISOString().split('T')[0] : '',
  allowLateSubmissions: assignment.allowLateSubmissions || false,
  lateSubmissionPenalty: assignment.lateSubmissionPenalty || 10,
  maxAttempts: assignment.maxAttempts || 1,
  submissionType: assignment.submissionType || 'File Upload',
  allowedFileTypes: assignment.allowedFileTypes || ['pdf', 'doc', 'docx'],
  maxFileSize: assignment.maxFileSize || 10485760,
  status: assignment.status || 'Draft',
  instructions: assignment.instructions || '',
  gradingCriteria: assignment.gradingCriteria || '',
  rubric: assignment.rubric || [{ criterion: '', description: '', maxPoints: 0 }],
});

const getOfferingSubject = (offering: CourseOffering) =>
  typeof offering.subjectId === 'object' ? (offering.subjectId as Subject) : null;

const getOfferingLabel = (offering: CourseOffering) => {
  const subject = getOfferingSubject(offering);
  return `${offering.offeringId || ''} — ${subject?.code || ''} ${subject?.name || ''}`.trim();
};

interface AssignmentFormProps {
  mode: "create" | "edit";
  assignment?: Assignment | null;
}

export function AssignmentForm({ mode, assignment }: AssignmentFormProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState<AssignmentFormData>(emptyForm(user));
  const [offerings, setOfferings] = useState<CourseOffering[]>([]);
  const [offeringsLoading, setOfferingsLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchOfferings = async () => {
      try {
        setOfferingsLoading(true);
        const response = await offeringAPI.getAll({ status: 'Active', limit: 500 });
        let list: CourseOffering[] = [];
        if (response && response.success) {
          list = response.data || [];
        }

        // Ensure edit rehydrate works if linked offering is no longer Active
        const linkedId =
          mode === 'edit' && assignment?.offeringId
            ? typeof assignment.offeringId === 'string'
              ? assignment.offeringId
              : (assignment.offeringId as { _id?: string })?._id
            : '';
        if (linkedId && !list.some((o) => o._id === linkedId)) {
          try {
            const one = await offeringAPI.getById(linkedId);
            if (one?.success && one.data) {
              list = [one.data, ...list];
            }
          } catch {
            // ignore — select will show empty until user picks again
          }
        }

        setOfferings(list);
      } catch (error) {
        console.error('Failed to fetch offerings:', error);
        toast.error('Failed to load offerings');
      } finally {
        setOfferingsLoading(false);
        setLoadingOptions(false);
      }
    };
    fetchOfferings();
  }, [mode, assignment?.offeringId]);

  useEffect(() => {
    if (mode === "create") {
      setFormData(emptyForm(user));
    }
  }, [mode, user]);

  useEffect(() => {
    if (mode === "edit" && assignment && !loadingOptions) {
      setFormData(toFormData(assignment));
    }
  }, [mode, assignment, loadingOptions]);

  const handleOfferingSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selected = offerings.find((o) => o._id === selectedId);

    if (selected) {
      const subject = getOfferingSubject(selected);
      const program = typeof selected.programId === 'object' ? selected.programId : null;
      const instructor = typeof selected.instructorId === 'object' ? selected.instructorId : null;
      const dept =
        subject && typeof subject.departmentId === 'object' ? subject.departmentId : null;

      setFormData({
        ...formData,
        offeringId: selected._id || '',
        course: subject?.name || '',
        courseCode: subject?.code || '',
        department: dept?.name || formData.department,
        program: program?.code || program?.name || formData.program,
        semester: selected.semester,
        instructor: instructor?.name || formData.instructor,
        instructorEmail: formData.instructorEmail,
      });
      toast.success(`Offering selected: ${subject?.code} — ${subject?.name}`);
    } else {
      setFormData({
        ...formData,
        offeringId: '',
        course: '',
        courseCode: '',
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name === 'allowedFileTypes') {
      const selected = Array.from((e.target as HTMLSelectElement).selectedOptions, option => option.value);
      setFormData(prev => ({
        ...prev,
        [name]: selected
      }));
    } else if (name.includes('rubric.')) {
      const index = parseInt(name.split('.')[1]);
      const field = name.split('.')[2];
      setFormData(prev => {
        const newRubric = [...prev.rubric];
        newRubric[index] = {
          ...newRubric[index],
          [field]: field === 'maxPoints' ? parseFloat(value) || 0 : value
        };
        return { ...prev, rubric: newRubric };
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'semester' || name === 'maxScore' || name === 'passingScore' ||
                name === 'weightage' || name === 'lateSubmissionPenalty' ||
                name === 'maxAttempts' || name === 'maxFileSize'
          ? parseFloat(value) || 0
          : value
      }));
    }
  };

  const addRubricRow = () => {
    setFormData(prev => ({
      ...prev,
      rubric: [...prev.rubric, { criterion: '', description: '', maxPoints: 0 }]
    }));
  };

  const removeRubricRow = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rubric: prev.rubric.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      const requiredFields = ['title', 'description', 'offeringId', 'dueDate', 'submissionDeadline'];
      const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData]);

      if (missingFields.length > 0) {
        toast.error(`Please fill all required fields: ${missingFields.join(', ')}`);
        setIsSubmitting(false);
        return;
      }

      const sanitizedRubric = formData.rubric
        .filter((r) => (r.criterion?.trim() || r.description?.trim() || Number(r.maxPoints) > 0))
        .map((r) => ({
          criterion: r.criterion?.trim() || '',
          description: r.description?.trim() || '',
          maxPoints: Number(r.maxPoints) || 0
        }));

      const assignmentData = {
        offeringId: formData.offeringId,
        title: formData.title,
        description: formData.description,
        course: formData.course,
        courseCode: formData.courseCode,
        department: formData.department,
        program: formData.program,
        semester: Number(formData.semester),
        academicYear: formData.academicYear,
        instructor: formData.instructor,
        instructorEmail: formData.instructorEmail?.trim() || undefined,
        type: formData.type,
        maxScore: Number(formData.maxScore),
        passingScore: Number(formData.passingScore),
        weightage: Number(formData.weightage),
        dueDate: formData.dueDate || undefined,
        submissionDeadline: formData.submissionDeadline || undefined,
        lateSubmissionDeadline: formData.lateSubmissionDeadline || undefined,
        allowLateSubmissions: formData.allowLateSubmissions,
        lateSubmissionPenalty: Number(formData.lateSubmissionPenalty),
        maxAttempts: Number(formData.maxAttempts),
        submissionType: formData.submissionType,
        allowedFileTypes: formData.allowedFileTypes,
        maxFileSize: Number(formData.maxFileSize),
        status: formData.status,
        instructions: formData.instructions?.trim() || undefined,
        gradingCriteria: formData.gradingCriteria?.trim() || undefined,
        rubric: sanitizedRubric
      };

      if (mode === "edit") {
        const id = assignment ? getAssignmentRecordId(assignment) : "";
        if (!id) {
          toast.error("Cannot update assignment: missing ID");
          setIsSubmitting(false);
          return;
        }
        const response = await assignmentAPI.update(id, assignmentData);
        if (response && response.success) {
          toast.success(`Assignment updated successfully!`);
        } else {
          toast.error(response?.message || 'Failed to update assignment');
          setIsSubmitting(false);
          return;
        }
      } else {
        const response = await assignmentAPI.create(assignmentData);
        if (response && response.success) {
          toast.success(`Assignment created successfully! ID: ${response.data?.assignmentId || 'generated'}`);
        } else {
          toast.error(response?.message || 'Failed to create assignment');
          setIsSubmitting(false);
          return;
        }
      }

      navigate("/assignments");
    } catch (error: unknown) {
      console.error('❌ Failed to save assignment:', error);

      let errorMsg = mode === "edit" ? 'Failed to update assignment' : 'Failed to create assignment';

      const err = error as { response?: { data?: { message?: string } }; message?: string };
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message?.includes('NetworkError') || err.message?.includes('Failed to fetch')) {
        errorMsg = 'Network error. Please check if backend server is running.';
      }

      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingOptions) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-6 md:p-8">
        <div className="mb-6">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mb-3 -ml-2"
            onClick={() => navigate("/assignments")}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to assignments
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {mode === "edit" ? (
              <>
                <Pencil className="h-5 w-5 text-primary" />
                Edit Assignment
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 text-primary" />
                New Assignment
              </>
            )}
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <h3 className="font-semibold text-sm text-muted-foreground mb-3">Basic Information</h3>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Title *</Label>
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
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="courseSelect">Select Offering *</Label>
              <select
                id="courseSelect"
                name="courseSelect"
                onChange={handleOfferingSelect}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                value={formData.offeringId}
                required
              >
                <option value="">Select an offering</option>
                {offeringsLoading ? (
                  <option value="" disabled>Loading offerings...</option>
                ) : offerings.length === 0 ? (
                  <option value="" disabled>No offerings available</option>
                ) : (
                  offerings.map((offering) => (
                    <option key={offering._id} value={offering._id}>
                      {getOfferingLabel(offering)}
                    </option>
                  ))
                )}
              </select>
              {!offeringsLoading && offerings.length === 0 && (
                <p className="text-xs text-yellow-600">No offerings found. Create one under Academics → Offerings.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="course">Course Name *</Label>
              <Input
                id="course"
                name="course"
                value={formData.course}
                onChange={handleInputChange}
                className="bg-gray-50"
                required
                readOnly={!!formData.course}
              />
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
                {programs.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester">Semester *</Label>
              <Input
                id="semester"
                name="semester"
                type="number"
                value={formData.semester}
                onChange={handleInputChange}
                className="bg-gray-50"
                required
                readOnly={!!formData.course}
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
              <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Instructor Information</h3>
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
              <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Assignment Details</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {assignmentTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
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
                {statusOptions.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxScore">Max Score *</Label>
              <Input
                id="maxScore"
                name="maxScore"
                type="number"
                min="0"
                value={formData.maxScore}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passingScore">Passing Score</Label>
              <Input
                id="passingScore"
                name="passingScore"
                type="number"
                min="0"
                value={formData.passingScore}
                onChange={handleInputChange}
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

            <div className="space-y-2">
              <Label htmlFor="maxAttempts">Max Attempts</Label>
              <Input
                id="maxAttempts"
                name="maxAttempts"
                type="number"
                min="1"
                max="5"
                value={formData.maxAttempts}
                onChange={handleInputChange}
              />
            </div>

            <div className="md:col-span-2">
              <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Dates</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="submissionDeadline">Submission Deadline *</Label>
              <Input
                id="submissionDeadline"
                name="submissionDeadline"
                type="date"
                value={formData.submissionDeadline}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lateSubmissionDeadline">Late Submission Deadline</Label>
              <Input
                id="lateSubmissionDeadline"
                name="lateSubmissionDeadline"
                type="date"
                value={formData.lateSubmissionDeadline}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2 flex items-center gap-2">
              <input
                id="allowLateSubmissions"
                name="allowLateSubmissions"
                type="checkbox"
                checked={formData.allowLateSubmissions}
                onChange={handleInputChange}
                className="h-4 w-4"
              />
              <Label htmlFor="allowLateSubmissions">Allow Late Submissions</Label>
            </div>

            {formData.allowLateSubmissions && (
              <div className="space-y-2">
                <Label htmlFor="lateSubmissionPenalty">Late Submission Penalty (%)</Label>
                <Input
                  id="lateSubmissionPenalty"
                  name="lateSubmissionPenalty"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.lateSubmissionPenalty}
                  onChange={handleInputChange}
                />
              </div>
            )}

            <div className="md:col-span-2">
              <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Submission Settings</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="submissionType">Submission Type</Label>
              <select
                id="submissionType"
                name="submissionType"
                value={formData.submissionType}
                onChange={handleInputChange}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {submissionTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxFileSize">Max File Size (bytes)</Label>
              <Input
                id="maxFileSize"
                name="maxFileSize"
                type="number"
                value={formData.maxFileSize}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="allowedFileTypes">Allowed File Types</Label>
              <select
                id="allowedFileTypes"
                name="allowedFileTypes"
                multiple
                value={formData.allowedFileTypes}
                onChange={handleInputChange}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary h-24"
              >
                {fileTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Hold Ctrl/Cmd to select multiple</p>
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mt-4 mb-3">
                <h3 className="font-semibold text-sm text-muted-foreground">Rubric</h3>
                <Button type="button" variant="outline" size="sm" onClick={addRubricRow}>
                  <Plus className="h-3 w-3 mr-1" /> Add Criterion
                </Button>
              </div>

              {formData.rubric.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-end border-b pb-2">
                  <div className="col-span-5 space-y-1">
                    <Label className="text-xs">Criterion</Label>
                    <Input
                      name={`rubric.${index}.criterion`}
                      value={item.criterion}
                      onChange={handleInputChange}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="col-span-5 space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Input
                      name={`rubric.${index}.description`}
                      value={item.description}
                      onChange={handleInputChange}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <Label className="text-xs">Points</Label>
                    <Input
                      name={`rubric.${index}.maxPoints`}
                      type="number"
                      value={item.maxPoints}
                      onChange={handleInputChange}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRubricRow(index)}
                      className="h-8 w-8 p-0"
                      disabled={formData.rubric.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="md:col-span-2">
              <h3 className="font-semibold text-sm text-muted-foreground mt-4 mb-3">Instructions</h3>
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

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="gradingCriteria">Grading Criteria</Label>
              <textarea
                id="gradingCriteria"
                name="gradingCriteria"
                value={formData.gradingCriteria}
                onChange={handleInputChange}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/assignments")}
            >
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
                  {mode === "edit" ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {mode === "edit" ? 'Update Assignment' : 'Create Assignment'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
