import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/features/axios";
import {
  StudentDocumentSlots,
  resolveFileBlob,
} from "@/components/student/StudentDocumentSlots";
import {
  STUDENT_DOCUMENT_TYPE_LABELS,
  studentAdmissionsAPI,
  type StudentDocument,
  type StudentDocumentReviewStatus,
  type StudentDocumentType,
} from "@/features/studentAdmissions";

interface AdmissionDocumentsPanelProps {
  dossierId: string;
  ownerLabel?: string;
  onDocumentsChange?: () => void;
}

export function AdmissionDocumentsPanel({
  dossierId,
  ownerLabel,
  onDocumentsChange,
}: AdmissionDocumentsPanelProps) {
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await studentAdmissionsAPI.listDossierDocuments(dossierId);
      setDocuments(data);
      onDocumentsChange?.();
    } catch {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [dossierId, onDocumentsChange]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleUpload = async (documentType: StudentDocumentType, file: File) => {
    const baseName = file.name.replace(/\.[^.]+$/, "");
    await studentAdmissionsAPI.uploadDossierDocument(dossierId, {
      file,
      documentType,
      documentName: baseName || STUDENT_DOCUMENT_TYPE_LABELS[documentType],
    });
    await loadDocuments();
  };

  const handleFetchFile = async (doc: StudentDocument) => {
    if (!doc._id) throw new Error("Missing document id");
    const res = await api.get(`/admissions/dossiers/${dossierId}/documents/${doc._id}/download`, {
      responseType: "blob",
    });
    return resolveFileBlob(res.data as Blob, String(res.headers["content-type"] || ""));
  };

  const handleReview = async (
    doc: StudentDocument,
    reviewStatus: StudentDocumentReviewStatus,
    reviewNotes?: string
  ) => {
    if (!doc._id) return;
    await studentAdmissionsAPI.reviewDossierDocument(dossierId, doc._id, {
      reviewStatus,
      reviewNotes,
    });
    await loadDocuments();
  };

  const handleDelete = async (doc: StudentDocument) => {
    if (!doc._id) return;
    await studentAdmissionsAPI.deleteDossierDocument(dossierId, doc._id);
    toast.success("Document removed");
    await loadDocuments();
  };

  return (
    <div className="space-y-4">
      <StudentDocumentSlots
        documents={documents}
        loading={loading}
        onUpload={handleUpload}
        onFetchFile={handleFetchFile}
        onReview={handleReview}
        onDelete={handleDelete}
        title="Admission documents"
        description={`Upload, view, approve, or reject documents for ${
          ownerLabel || dossierId
        }.`}
      />
    </div>
  );
}

export default AdmissionDocumentsPanel;
