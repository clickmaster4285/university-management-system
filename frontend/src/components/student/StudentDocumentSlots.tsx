import { useRef, useState } from "react";
import { CheckCircle2, Download, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  STUDENT_DOCUMENT_TYPE_LABELS,
  type StudentDocument,
  type StudentDocumentType,
} from "@/features/studentAdmissions";

const DOCUMENT_SLOTS: StudentDocumentType[] = [
  "cnic",
  "photo",
  "matric",
  "intermediate",
  "bachelor",
  "domicile",
  "character_certificate",
  "migration",
  "other",
];

interface StudentDocumentSlotsProps {
  documents: StudentDocument[];
  loading?: boolean;
  onUpload: (type: StudentDocumentType, file: File) => Promise<void>;
  onDownload: (doc: StudentDocument) => Promise<void>;
  onDelete: (doc: StudentDocument) => Promise<void>;
  requiredTypes?: StudentDocumentType[];
}

export function StudentDocumentSlots({
  documents,
  loading = false,
  onUpload,
  onDownload,
  onDelete,
  requiredTypes = [],
}: StudentDocumentSlotsProps) {
  const [uploadingType, setUploadingType] = useState<StudentDocumentType | null>(null);
  const inputRefs = useRef<Partial<Record<StudentDocumentType, HTMLInputElement | null>>>({});

  const docsByType = documents.reduce<Partial<Record<StudentDocumentType, StudentDocument>>>((acc, doc) => {
    if (!acc[doc.documentType]) acc[doc.documentType] = doc;
    return acc;
  }, {});

  const handleFileChange = async (type: StudentDocumentType, file: File | undefined) => {
    if (!file) return;
    setUploadingType(type);
    try {
      await onUpload(type, file);
      toast.success(`${STUDENT_DOCUMENT_TYPE_LABELS[type]} uploaded`);
      const input = inputRefs.current[type];
      if (input) input.value = "";
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to upload document";
      toast.error(message);
    } finally {
      setUploadingType(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {DOCUMENT_SLOTS.map((type) => {
        const doc = docsByType[type];
        const isRequired = requiredTypes.includes(type);
        const isUploading = uploadingType === type;

        return (
          <div
            key={type}
            className="flex flex-col sm:flex-row sm:items-center gap-3 border rounded-lg p-3 bg-background"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {doc ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : (
                  <span className="h-4 w-4 rounded-full border border-muted-foreground/40 shrink-0" />
                )}
                <p className="font-medium">{STUDENT_DOCUMENT_TYPE_LABELS[type]}</p>
                {isRequired && <Badge variant="outline" className="text-xs">Required</Badge>}
              </div>
              {doc ? (
                <p className="text-xs text-muted-foreground mt-1 truncate pl-6">
                  {doc.originalName || doc.fileName}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1 pl-6">No file uploaded</p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
              <input
                ref={(el) => {
                  inputRefs.current[type] = el;
                }}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                onChange={(e) => handleFileChange(type, e.target.files?.[0])}
              />
              <Button
                type="button"
                size="sm"
                variant={doc ? "outline" : "default"}
                disabled={isUploading}
                onClick={() => inputRefs.current[type]?.click()}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {doc ? "Replace" : "Upload"}
              </Button>
              {doc && (
                <>
                  <Button type="button" size="sm" variant="outline" onClick={() => onDownload(doc)}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm(`Remove ${STUDENT_DOCUMENT_TYPE_LABELS[type]}?`)) onDelete(doc);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default StudentDocumentSlots;
