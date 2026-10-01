import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Download,
  Eye,
  Loader2,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  STUDENT_DOCUMENT_TYPE_LABELS,
  type StudentDocument,
  type StudentDocumentReviewStatus,
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
  "fee_payment_proof",
  "other",
];

export type StagedDocumentMap = Partial<Record<StudentDocumentType, File>>;

type PreviewKind = "image" | "pdf" | "unsupported";

function getPreviewKind(mimeType?: string, fileName?: string): PreviewKind {
  const mime = (mimeType || "").toLowerCase();
  const name = (fileName || "").toLowerCase();
  if (mime.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp)$/i.test(name)) return "image";
  if (mime === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  return "unsupported";
}

/** Resolve axios blob responses that may actually be JSON errors */
export async function resolveFileBlob(blob: Blob, contentTypeHeader?: string): Promise<Blob> {
  const header = (contentTypeHeader || blob.type || "").toLowerCase();
  if (header.includes("application/json")) {
    const text = await blob.text();
    try {
      const json = JSON.parse(text) as { message?: string };
      throw new Error(json.message || "Failed to fetch file");
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new Error("Failed to fetch file");
      }
      throw err;
    }
  }
  return blob;
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName || "document";
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Delay revoke — immediate revoke often cancels the download
  window.setTimeout(() => window.URL.revokeObjectURL(url), 2000);
}

function reviewBadgeVariant(status?: StudentDocumentReviewStatus) {
  if (status === "Approved") return "default" as const;
  if (status === "Rejected") return "destructive" as const;
  return "outline" as const;
}

interface StudentDocumentSlotsProps {
  documents?: StudentDocument[];
  stagedFiles?: StagedDocumentMap;
  loading?: boolean;
  onUpload?: (type: StudentDocumentType, file: File) => Promise<void>;
  onFetchFile?: (doc: StudentDocument) => Promise<Blob>;
  onDownload?: (doc: StudentDocument) => Promise<void>;
  onDelete?: (doc: StudentDocument) => Promise<void>;
  onClearStaged?: (type: StudentDocumentType) => void;
  /** Staff review — approve / reject with optional notes */
  onReview?: (
    doc: StudentDocument,
    reviewStatus: StudentDocumentReviewStatus,
    reviewNotes?: string
  ) => Promise<void>;
  /** When false, hide Upload/Replace (review-only surfaces) */
  allowUpload?: boolean;
  /** When false, only list slots that have a file */
  showEmptySlots?: boolean;
  requiredTypes?: StudentDocumentType[];
  title?: string;
  description?: string;
}

export function StudentDocumentSlots({
  documents = [],
  stagedFiles = {},
  loading = false,
  onUpload,
  onFetchFile,
  onDownload,
  onDelete,
  onClearStaged,
  onReview,
  allowUpload = true,
  showEmptySlots = true,
  requiredTypes = [],
  title,
  description,
}: StudentDocumentSlotsProps) {
  const [uploadingType, setUploadingType] = useState<StudentDocumentType | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    title: string;
    url: string;
    kind: PreviewKind;
    fileName: string;
  } | null>(null);
  const inputRefs = useRef<Partial<Record<StudentDocumentType, HTMLInputElement | null>>>({});
  const previewUrlRef = useRef<string | null>(null);

  const clearPreviewUrl = () => {
    if (previewUrlRef.current) {
      window.URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  };

  useEffect(() => () => clearPreviewUrl(), []);

  const docsByType = documents.reduce<Partial<Record<StudentDocumentType, StudentDocument>>>((acc, doc) => {
    if (!acc[doc.documentType]) acc[doc.documentType] = doc;
    return acc;
  }, {});

  const handleFileChange = async (type: StudentDocumentType, file: File | undefined) => {
    if (!file || !onUpload) return;
    setUploadingType(type);
    try {
      await onUpload(type, file);
      toast.success(`${STUDENT_DOCUMENT_TYPE_LABELS[type]} ready`);
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

  const openPreview = (label: string, blob: Blob, fileName: string, mimeType?: string) => {
    clearPreviewUrl();
    const url = window.URL.createObjectURL(blob);
    previewUrlRef.current = url;
    setPreview({
      title: label,
      url,
      kind: getPreviewKind(mimeType || blob.type, fileName),
      fileName,
    });
  };

  const handleView = async (type: StudentDocumentType, doc?: StudentDocument, staged?: File) => {
    const label = STUDENT_DOCUMENT_TYPE_LABELS[type];
    const key = `view-${type}`;
    try {
      setBusyKey(key);
      if (staged && !doc) {
        openPreview(label, staged, staged.name, staged.type);
        return;
      }
      if (doc && onFetchFile) {
        const blob = await onFetchFile(doc);
        openPreview(label, blob, doc.originalName || doc.fileName, doc.mimeType || blob.type);
        return;
      }
      toast.error("Preview is not available for this file");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to open document");
    } finally {
      setBusyKey(null);
    }
  };

  const handleDownloadClick = async (type: StudentDocumentType, doc?: StudentDocument, staged?: File) => {
    const key = `dl-${type}`;
    try {
      setBusyKey(key);
      if (staged && !doc) {
        triggerDownload(staged, staged.name);
        return;
      }
      if (doc && onFetchFile) {
        const blob = await onFetchFile(doc);
        triggerDownload(blob, doc.originalName || doc.fileName || "document");
        toast.success("Download started");
        return;
      }
      if (doc && onDownload) {
        await onDownload(doc);
        return;
      }
      toast.error("Download is not available");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to download document");
    } finally {
      setBusyKey(null);
    }
  };

  const handleReview = async (doc: StudentDocument, status: StudentDocumentReviewStatus) => {
    if (!onReview || !doc._id) return;
    let reviewNotes = "";
    if (status === "Rejected") {
      const reason = window.prompt(
        "Reason for rejection (shown to the applicant):",
        doc.reviewNotes || "Document is unclear or incomplete. Please re-upload."
      );
      if (reason == null) return;
      reviewNotes = reason.trim();
      if (!reviewNotes) {
        toast.error("Rejection reason is required");
        return;
      }
    }
    const key = `review-${doc._id}`;
    try {
      setBusyKey(key);
      await onReview(doc, status, reviewNotes);
      toast.success(status === "Approved" ? "Document approved" : "Document rejected");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to update review";
      toast.error(message);
    } finally {
      setBusyKey(null);
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
    <div className={cn(title || description ? "space-y-3 border rounded-lg p-4 md:p-5" : "space-y-2")}>
      {title || description ? (
        <div>
          {title ? <h3 className="font-semibold flex items-center gap-2">{title}</h3> : null}
          {description ? <p className="text-sm text-muted-foreground mt-1">{description}</p> : null}
        </div>
      ) : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {DOCUMENT_SLOTS.filter((type) => {
          if (showEmptySlots) return true;
          return Boolean(docsByType[type] || stagedFiles[type]);
        }).map((type) => {
          const doc = docsByType[type];
          const staged = stagedFiles[type];
          const hasFile = Boolean(doc || staged);
          const isRequired = requiredTypes.includes(type);
          const isUploading = uploadingType === type;
          const fileLabel = doc?.originalName || doc?.fileName || staged?.name;
          const showView = hasFile && (Boolean(doc && onFetchFile) || Boolean(staged));
          const reviewStatus = doc?.reviewStatus || (hasFile && doc ? "Pending" : undefined);

          return (
            <div
              key={type}
              className="flex flex-col gap-2 border rounded-lg p-3 bg-background min-w-0"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {hasFile ? (
                    reviewStatus === "Rejected" ? (
                      <XCircle className="h-4 w-4 text-destructive shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    )
                  ) : (
                    <span className="h-4 w-4 rounded-full border border-muted-foreground/40 shrink-0" />
                  )}
                  <p className="font-medium text-sm truncate">{STUDENT_DOCUMENT_TYPE_LABELS[type]}</p>
                  {isRequired && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      Required
                    </Badge>
                  )}
                  {doc && reviewStatus ? (
                    <Badge variant={reviewBadgeVariant(reviewStatus)} className="text-xs shrink-0">
                      {reviewStatus}
                    </Badge>
                  ) : null}
                </div>
                {hasFile ? (
                  <p className="text-xs text-muted-foreground mt-1 truncate pl-6">
                    {fileLabel}
                    {staged && !doc ? " (on submit)" : ""}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1 pl-6">No file</p>
                )}
                {doc?.reviewStatus === "Rejected" && doc.reviewNotes ? (
                  <p className="text-xs text-destructive mt-1 pl-6">{doc.reviewNotes}</p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-auto">
                {allowUpload && onUpload ? (
                  <>
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
                      variant={hasFile ? "outline" : "default"}
                      disabled={isUploading}
                      onClick={() => inputRefs.current[type]?.click()}
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {hasFile ? "Replace" : "Upload"}
                    </Button>
                  </>
                ) : null}
                {showView ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busyKey !== null}
                    onClick={() => handleView(type, doc, staged)}
                    title="View in browser"
                  >
                    {busyKey === `view-${type}` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                    View
                  </Button>
                ) : null}
                {hasFile && (onFetchFile || onDownload || staged) ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busyKey !== null}
                    onClick={() => handleDownloadClick(type, doc, staged)}
                    title="Download"
                  >
                    {busyKey === `dl-${type}` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                ) : null}
                {doc && onReview ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busyKey !== null || reviewStatus === "Approved"}
                      onClick={() => handleReview(doc, "Approved")}
                      title="Approve document"
                    >
                      {busyKey === `review-${doc._id}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ThumbsUp className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busyKey !== null}
                      onClick={() => handleReview(doc, "Rejected")}
                      title="Reject document"
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </>
                ) : null}
                {allowUpload && doc && onDelete ? (
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
                ) : null}
                {allowUpload && staged && !doc && onClearStaged ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm(`Remove ${STUDENT_DOCUMENT_TYPE_LABELS[type]}?`)) onClearStaged(type);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {!showEmptySlots &&
      DOCUMENT_SLOTS.every((type) => !docsByType[type] && !stagedFiles[type]) ? (
        <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
      ) : null}

      <Dialog
        open={Boolean(preview)}
        onOpenChange={(open) => {
          if (!open) {
            clearPreviewUrl();
            setPreview(null);
          }
        }}
      >
        <DialogContent className="max-w-5xl w-[95vw] max-h-[92vh] flex flex-col gap-3">
          <DialogHeader>
            <DialogTitle>{preview?.title || "Document"}</DialogTitle>
            <DialogDescription className="truncate">{preview?.fileName}</DialogDescription>
          </DialogHeader>
          {preview?.kind === "image" ? (
            <div className="flex-1 overflow-auto rounded-md border bg-muted/30 p-2 min-h-[50vh]">
              <img
                src={preview.url}
                alt={preview.fileName}
                className="mx-auto max-h-[70vh] w-auto object-contain"
              />
            </div>
          ) : null}
          {preview?.kind === "pdf" ? (
            <iframe
              title={preview.fileName}
              src={preview.url}
              className="w-full flex-1 min-h-[70vh] rounded-md border bg-background"
            />
          ) : null}
          {preview?.kind === "unsupported" ? (
            <div className="rounded-md border bg-muted/20 p-6 text-sm text-muted-foreground space-y-3">
              <p>This file type can’t be previewed in the browser (e.g. Word). Download it instead.</p>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (!preview) return;
                  const a = document.createElement("a");
                  a.href = preview.url;
                  a.download = preview.fileName;
                  a.click();
                }}
              >
                <Download className="h-4 w-4" />
                Download file
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default StudentDocumentSlots;
