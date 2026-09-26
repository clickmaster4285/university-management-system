import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  StudentDocumentSlots,
  type StagedDocumentMap,
} from "@/components/student/StudentDocumentSlots";
import type { StudentDocument, StudentDocumentType } from "@/features/studentAdmissions";

export type DossierFormMode = "apply" | "dossier" | "create";

export interface DossierFormOption {
  value: string;
  label: string;
}

export interface StudentDossierFormValue {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cnic: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  religion: string;
  programId: string;
  campusId: string;
  academicSessionId: string;
  batchId: string;
  guardian: {
    fatherName: string;
    motherName: string;
    guardianName: string;
    guardianPhone: string;
    guardianRelation: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  previousEducation: {
    institution: string;
    degree: string;
    grade: string;
    yearOfCompletion: string;
  };
  remarks: string;
  currentSemester?: string;
  status?: string;
}

export const emptyStudentDossierFormValue = (): StudentDossierFormValue => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  cnic: "",
  dateOfBirth: "",
  gender: "",
  nationality: "Pakistani",
  religion: "",
  programId: "",
  campusId: "",
  academicSessionId: "",
  batchId: "",
  guardian: {
    fatherName: "",
    motherName: "",
    guardianName: "",
    guardianPhone: "",
    guardianRelation: "",
  },
  address: {
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Pakistan",
  },
  previousEducation: {
    institution: "",
    degree: "",
    grade: "",
    yearOfCompletion: "",
  },
  remarks: "",
  currentSemester: "1",
  status: "Active",
});

/** Normalize API dossier / application into form value */
export function dossierToFormValue(source: Record<string, unknown>): StudentDossierFormValue {
  const base = emptyStudentDossierFormValue();
  const refId = (value: unknown) => {
    if (value == null || value === "") return "";
    if (typeof value === "object" && value && "_id" in value) {
      return String((value as { _id?: string })._id || "");
    }
    return String(value);
  };
  const dateStr = (value: unknown) => {
    if (!value) return "";
    const s = String(value);
    return s.slice(0, 10);
  };
  const guardian = (source.guardian as Record<string, string> | undefined) || {};
  const address = (source.address as Record<string, string> | undefined) || {};
  const prevList = source.previousEducation as Array<Record<string, unknown>> | undefined;
  const prev = prevList?.[0] || {};

  return {
    ...base,
    firstName: String(source.firstName || ""),
    lastName: String(source.lastName || ""),
    email: String(source.email || ""),
    phone: String(source.phone || ""),
    cnic: String(source.cnic || ""),
    dateOfBirth: dateStr(source.dateOfBirth),
    gender: String(source.gender || ""),
    nationality: String(source.nationality || base.nationality),
    religion: String(source.religion || ""),
    programId: refId(source.programId),
    campusId: refId(source.campusId),
    academicSessionId: refId(source.academicSessionId),
    batchId: refId(source.batchId),
    guardian: {
      fatherName: String(guardian.fatherName || ""),
      motherName: String(guardian.motherName || ""),
      guardianName: String(guardian.guardianName || ""),
      guardianPhone: String(guardian.guardianPhone || ""),
      guardianRelation: String(guardian.guardianRelation || ""),
    },
    address: {
      street: String(address.street || ""),
      city: String(address.city || ""),
      state: String(address.state || ""),
      postalCode: String(address.postalCode || ""),
      country: String(address.country || base.address.country),
    },
    previousEducation: {
      institution: String(prev.institution || source.previousInstitution || ""),
      degree: String(prev.degree || source.previousDegree || ""),
      grade: String(prev.grade || source.previousMarks || ""),
      yearOfCompletion:
        prev.yearOfCompletion != null && prev.yearOfCompletion !== ""
          ? String(prev.yearOfCompletion)
          : "",
    },
    remarks: String(source.remarks || ""),
    currentSemester: String(source.currentSemester || source.semester || "1"),
    status: String(source.status || "Active"),
  };
}

/** Payload for public apply / promote-compatible APIs */
export function formValueToApplicationPayload(value: StudentDossierFormValue) {
  return {
    firstName: value.firstName.trim(),
    lastName: value.lastName.trim(),
    email: value.email.trim(),
    phone: value.phone.trim(),
    cnic: value.cnic.trim(),
    dateOfBirth: value.dateOfBirth || undefined,
    gender: value.gender || undefined,
    nationality: value.nationality,
    religion: value.religion,
    programId: value.programId,
    campusId: value.campusId,
    academicSessionId: value.academicSessionId || undefined,
    guardian: { ...value.guardian },
    address: { ...value.address },
    previousInstitution: value.previousEducation.institution,
    previousDegree: value.previousEducation.degree,
    previousMarks: value.previousEducation.grade,
    yearOfCompletion: value.previousEducation.yearOfCompletion || undefined,
    previousEducation: [
      {
        institution: value.previousEducation.institution,
        degree: value.previousEducation.degree,
        grade: value.previousEducation.grade,
        yearOfCompletion: value.previousEducation.yearOfCompletion
          ? Number(value.previousEducation.yearOfCompletion)
          : null,
      },
    ],
  };
}

/** Payload for staff dossier update / complete */
export function formValueToDossierPayload(value: StudentDossierFormValue) {
  return {
    ...formValueToApplicationPayload(value),
    batchId: value.batchId || undefined,
    remarks: value.remarks,
  };
}

/** Payload for direct student create */
export function formValueToStudentCreatePayload(value: StudentDossierFormValue) {
  return {
    firstName: value.firstName.trim(),
    lastName: value.lastName.trim(),
    email: value.email.trim(),
    phone: value.phone.trim(),
    cnic: value.cnic.trim(),
    dateOfBirth: value.dateOfBirth,
    gender: value.gender,
    fatherName: value.guardian.fatherName,
    motherName: value.guardian.motherName,
    city: value.address.city,
    programId: value.programId,
    campusId: value.campusId,
    batchId: value.batchId,
    currentSemester: Number(value.currentSemester) || 1,
    status: value.status || "Active",
  };
}

export type DossierFieldKey =
  | "firstName"
  | "lastName"
  | "email"
  | "phone"
  | "cnic"
  | "dateOfBirth"
  | "gender"
  | "programId"
  | "campusId"
  | "batchId"
  | "fatherName"
  | "city";

export const DOSSIER_REQUIRED_CHECKS: Array<{
  key: DossierFieldKey;
  label: string;
  modes: DossierFormMode[];
  check: (v: StudentDossierFormValue) => boolean;
}> = [
  { key: "firstName", label: "First name", modes: ["apply", "dossier", "create"], check: (v) => !!v.firstName },
  { key: "lastName", label: "Last name", modes: ["apply", "dossier", "create"], check: (v) => !!v.lastName },
  { key: "email", label: "Email", modes: ["apply", "dossier", "create"], check: (v) => !!v.email },
  { key: "phone", label: "Phone", modes: ["apply", "dossier", "create"], check: (v) => !!v.phone },
  { key: "cnic", label: "CNIC", modes: ["apply", "dossier", "create"], check: (v) => !!v.cnic },
  { key: "dateOfBirth", label: "Date of birth", modes: ["apply", "dossier", "create"], check: (v) => !!v.dateOfBirth },
  { key: "gender", label: "Gender", modes: ["apply", "dossier", "create"], check: (v) => !!v.gender },
  { key: "programId", label: "Program", modes: ["apply", "dossier", "create"], check: (v) => !!v.programId },
  { key: "campusId", label: "Campus", modes: ["apply", "dossier", "create"], check: (v) => !!v.campusId },
  { key: "batchId", label: "Batch", modes: ["dossier", "create"], check: (v) => !!v.batchId },
  {
    key: "fatherName",
    label: "Father name",
    modes: ["apply", "dossier", "create"],
    check: (v) => !!v.guardian.fatherName,
  },
  { key: "city", label: "City", modes: ["apply", "dossier", "create"], check: (v) => !!v.address.city },
];

export function getMissingDossierFields(value: StudentDossierFormValue, mode: DossierFormMode) {
  return DOSSIER_REQUIRED_CHECKS.filter((f) => f.modes.includes(mode) && !f.check(value));
}

const selectClassName =
  "w-full h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Digits → 12345-1234567-1 */
function formatCnicInput(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 13);
  if (digits.length <= 5) return digits;
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

function Field({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5 min-w-0", className)}>
      <Label className="text-sm">
        {label}
        {required ? <span className="text-destructive ml-0.5">*</span> : null}
      </Label>
      {children}
    </div>
  );
}

interface StudentDossierFormProps {
  mode: DossierFormMode;
  value: StudentDossierFormValue;
  onChange: (value: StudentDossierFormValue) => void;
  programs?: DossierFormOption[];
  campuses?: DossierFormOption[];
  sessions?: DossierFormOption[];
  batches?: DossierFormOption[];
  /** When true, program/campus shown as locked labels (dossier after promote) */
  lockProgramCampus?: boolean;
  programLabel?: string;
  campusLabel?: string;
  disabled?: boolean;
  className?: string;
  /** Lock CNIC after initial submit (track / corrections) */
  lockCnic?: boolean;
  /** Shared document slots — staged for apply/create; omit when parent renders remote panel */
  showDocuments?: boolean;
  stagedDocuments?: StagedDocumentMap;
  onStagedDocumentsChange?: (files: StagedDocumentMap) => void;
  /** Existing server documents (track page) shown alongside staged uploads */
  documents?: StudentDocument[];
  documentsDescription?: string;
}

export function StudentDossierForm({
  mode,
  value,
  onChange,
  programs = [],
  campuses = [],
  sessions = [],
  batches = [],
  lockProgramCampus = false,
  programLabel,
  campusLabel,
  disabled = false,
  className,
  lockCnic = false,
  showDocuments = false,
  stagedDocuments = {},
  onStagedDocumentsChange,
  documents = [],
  documentsDescription = "Upload supporting documents (PDF, images, or Word). Same slots as the admission dossier.",
}: StudentDossierFormProps) {
  const patch = (partial: Partial<StudentDossierFormValue>) => onChange({ ...value, ...partial });
  const patchGuardian = (key: keyof StudentDossierFormValue["guardian"], v: string) =>
    onChange({ ...value, guardian: { ...value.guardian, [key]: v } });
  const patchAddress = (key: keyof StudentDossierFormValue["address"], v: string) =>
    onChange({ ...value, address: { ...value.address, [key]: v } });
  const patchEducation = (key: keyof StudentDossierFormValue["previousEducation"], v: string) =>
    onChange({
      ...value,
      previousEducation: { ...value.previousEducation, [key]: v },
    });

  const showSession = mode === "apply";
  const showBatch = mode === "dossier" || mode === "create";
  const showRemarks = mode === "dossier";
  const showSemester = mode === "create";
  const showStatus = mode === "create";
  const programCampusEditable = !lockProgramCampus && (mode === "apply" || mode === "create");
  const assignmentCols = showSemester
    ? "lg:grid-cols-4"
    : showBatch || showSession
      ? "lg:grid-cols-3"
      : "lg:grid-cols-2";

  return (
    <div className={cn("space-y-4", className)}>
      <section className="space-y-3 border rounded-lg p-4 md:p-5">
        <h3 className="font-semibold">Personal</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
          <Field label="First name" required>
            <Input
              autoComplete="given-name"
              disabled={disabled}
              value={value.firstName}
              onChange={(e) => patch({ firstName: e.target.value })}
            />
          </Field>
          <Field label="Last name" required>
            <Input
              autoComplete="family-name"
              disabled={disabled}
              value={value.lastName}
              onChange={(e) => patch({ lastName: e.target.value })}
            />
          </Field>
          <Field label="Email" required>
            <Input
              type="email"
              autoComplete="email"
              disabled={disabled}
              value={value.email}
              onChange={(e) => patch({ email: e.target.value })}
            />
          </Field>
          <Field label="Phone" required>
            <Input
              type="tel"
              autoComplete="tel"
              disabled={disabled}
              value={value.phone}
              onChange={(e) => patch({ phone: e.target.value })}
            />
          </Field>
          <Field label="CNIC" required>
            <Input
              disabled={disabled || lockCnic}
              value={value.cnic}
              onChange={(e) => patch({ cnic: formatCnicInput(e.target.value) })}
              placeholder="12345-1234567-1"
              inputMode="numeric"
              maxLength={15}
            />
          </Field>
          <Field label="Date of birth" required>
            <Input
              type="date"
              disabled={disabled}
              value={value.dateOfBirth}
              onChange={(e) => patch({ dateOfBirth: e.target.value })}
            />
          </Field>
          <Field label="Gender" required>
            <select
              className={selectClassName}
              disabled={disabled}
              value={value.gender}
              onChange={(e) => patch({ gender: e.target.value })}
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </Field>
          <Field label="Nationality">
            <Input
              disabled={disabled}
              value={value.nationality}
              onChange={(e) => patch({ nationality: e.target.value })}
            />
          </Field>
          <Field label="Religion">
            <Input
              disabled={disabled}
              value={value.religion}
              onChange={(e) => patch({ religion: e.target.value })}
            />
          </Field>
          {showStatus ? (
            <Field label="Status">
              <select
                className={selectClassName}
                disabled={disabled}
                value={value.status || "Active"}
                onChange={(e) => patch({ status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="On Leave">On Leave</option>
                <option value="Graduated">Graduated</option>
                <option value="Suspended">Suspended</option>
                <option value="Dropped">Dropped</option>
              </select>
            </Field>
          ) : null}
        </div>
      </section>

      <section className="space-y-3 border rounded-lg p-4 md:p-5">
        <h3 className="font-semibold">Program assignment</h3>
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3", assignmentCols)}>
          <Field label="Program" required>
            {programCampusEditable ? (
              <select
                className={selectClassName}
                disabled={disabled}
                value={value.programId}
                onChange={(e) => patch({ programId: e.target.value })}
              >
                <option value="">Select program</option>
                {programs.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            ) : (
              <Input disabled value={programLabel || value.programId || ""} />
            )}
          </Field>
          <Field label="Campus" required>
            {programCampusEditable ? (
              <select
                className={selectClassName}
                disabled={disabled}
                value={value.campusId}
                onChange={(e) => patch({ campusId: e.target.value })}
              >
                <option value="">Select campus</option>
                {campuses.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            ) : (
              <Input disabled value={campusLabel || value.campusId || ""} />
            )}
          </Field>
          {showSession ? (
            <Field label="Intake session">
              <select
                className={selectClassName}
                disabled={disabled}
                value={value.academicSessionId}
                onChange={(e) => patch({ academicSessionId: e.target.value })}
              >
                <option value="">Any open session</option>
                {sessions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          {showBatch ? (
            <Field label="Batch" required>
              <select
                className={selectClassName}
                disabled={disabled}
                value={value.batchId}
                onChange={(e) => patch({ batchId: e.target.value })}
              >
                <option value="">Select batch</option>
                {batches.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          {showSemester ? (
            <Field label="Current semester">
              <Input
                type="number"
                min={1}
                disabled={disabled}
                value={value.currentSemester || "1"}
                onChange={(e) => patch({ currentSemester: e.target.value })}
              />
            </Field>
          ) : null}
        </div>
        {showRemarks ? (
          <Field label="Remarks">
            <Textarea
              disabled={disabled}
              value={value.remarks}
              onChange={(e) => patch({ remarks: e.target.value })}
              rows={2}
            />
          </Field>
        ) : null}
      </section>

      <section className="space-y-3 border rounded-lg p-4 md:p-5">
        <h3 className="font-semibold">Guardian</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-4 gap-y-3">
          <Field label="Father name" required>
            <Input
              disabled={disabled}
              value={value.guardian.fatherName}
              onChange={(e) => patchGuardian("fatherName", e.target.value)}
            />
          </Field>
          <Field label="Mother name">
            <Input
              disabled={disabled}
              value={value.guardian.motherName}
              onChange={(e) => patchGuardian("motherName", e.target.value)}
            />
          </Field>
          <Field label="Guardian name">
            <Input
              disabled={disabled}
              value={value.guardian.guardianName}
              onChange={(e) => patchGuardian("guardianName", e.target.value)}
            />
          </Field>
          <Field label="Guardian phone">
            <Input
              type="tel"
              disabled={disabled}
              value={value.guardian.guardianPhone}
              onChange={(e) => patchGuardian("guardianPhone", e.target.value)}
            />
          </Field>
          <Field label="Guardian relation">
            <Input
              disabled={disabled}
              value={value.guardian.guardianRelation}
              onChange={(e) => patchGuardian("guardianRelation", e.target.value)}
              placeholder="Father / Mother / Other"
            />
          </Field>
        </div>
      </section>

      <section className="space-y-3 border rounded-lg p-4 md:p-5">
        <h3 className="font-semibold">Address</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
          <Field label="Street" className="sm:col-span-2">
            <Input
              autoComplete="street-address"
              disabled={disabled}
              value={value.address.street}
              onChange={(e) => patchAddress("street", e.target.value)}
            />
          </Field>
          <Field label="City" required>
            <Input
              autoComplete="address-level2"
              disabled={disabled}
              value={value.address.city}
              onChange={(e) => patchAddress("city", e.target.value)}
            />
          </Field>
          <Field label="State / province">
            <Input
              autoComplete="address-level1"
              disabled={disabled}
              value={value.address.state}
              onChange={(e) => patchAddress("state", e.target.value)}
            />
          </Field>
          <Field label="Postal code">
            <Input
              autoComplete="postal-code"
              disabled={disabled}
              value={value.address.postalCode}
              onChange={(e) => patchAddress("postalCode", e.target.value)}
            />
          </Field>
          <Field label="Country">
            <Input
              autoComplete="country-name"
              disabled={disabled}
              value={value.address.country}
              onChange={(e) => patchAddress("country", e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-3 border rounded-lg p-4 md:p-5">
        <h3 className="font-semibold">Previous education</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3">
          <Field label="Institution">
            <Input
              disabled={disabled}
              value={value.previousEducation.institution}
              onChange={(e) => patchEducation("institution", e.target.value)}
            />
          </Field>
          <Field label="Degree / certificate">
            <Input
              disabled={disabled}
              value={value.previousEducation.degree}
              onChange={(e) => patchEducation("degree", e.target.value)}
            />
          </Field>
          <Field label="Marks / grade">
            <Input
              disabled={disabled}
              value={value.previousEducation.grade}
              onChange={(e) => patchEducation("grade", e.target.value)}
            />
          </Field>
          <Field label="Year of completion">
            <Input
              type="number"
              min={1950}
              max={2100}
              disabled={disabled}
              value={value.previousEducation.yearOfCompletion}
              onChange={(e) => patchEducation("yearOfCompletion", e.target.value)}
              placeholder="YYYY"
            />
          </Field>
        </div>
      </section>

      {showDocuments && onStagedDocumentsChange ? (
        <StudentDocumentSlots
          documents={documents}
          stagedFiles={stagedDocuments}
          onUpload={async (type: StudentDocumentType, file: File) => {
            onStagedDocumentsChange({ ...stagedDocuments, [type]: file });
          }}
          onClearStaged={(type) => {
            const next = { ...stagedDocuments };
            delete next[type];
            onStagedDocumentsChange(next);
          }}
          title="Documents"
          description={documentsDescription}
        />
      ) : null}
    </div>
  );
}

export default StudentDossierForm;
