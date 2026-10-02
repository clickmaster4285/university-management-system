import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/features/axios";
import {
  StudentDocumentSlots,
  resolveFileBlob,
} from "@/components/student/StudentDocumentSlots";
import {
  type StudentDocument,
  type StudentDocumentReviewStatus,
} from "@/features/studentAdmissions";
import { studentApplicationsAPI } from "@/features/studentApplications";

interface ApplicationDocumentsPanelProps {
  applicationId: string;
  ownerLabel?: string;
}

export function ApplicationDocumentsPanel({
  applicationId,
  ownerLabel,
}: ApplicationDocumentsPanelProps) {
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await studentApplicationsAPI.listDocuments(applicationId);
      setDocuments(data);
    } catch {
      toast.error("Failed to load application documents");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleFetchFile = async (doc: StudentDocument) => {
    if (!doc._id) throw new Error("Missing document id");
    const res = await api.get(
      `/admissions/applications/${applicationId}/documents/${doc._id}/download`,
      { responseType: "blob" }
    );
    return resolveFileBlob(res.data as Blob, String(res.headers["content-type"] || ""));
  };

  const handleReview = async (
    doc: StudentDocument,
    reviewStatus: StudentDocumentReviewStatus,
    reviewNotes?: string
  ) => {
    if (!doc._id) return;
    await studentApplicationsAPI.reviewDocument(applicationId, doc._id, {
      reviewStatus,
      reviewNotes,
    });
    await loadDocuments();
  };

  return (
    <StudentDocumentSlots
      documents={documents}
      loading={loading}
      onFetchFile={handleFetchFile}
      onReview={handleReview}
      allowUpload={false}
      showEmptySlots={false}
      title="Applicant documents"
      description={`View, download, approve, or reject files for ${
        ownerLabel || "this application"
      }. Rejection reasons show when the applicant tracks their application.`}
    />
  );
}

export default ApplicationDocumentsPanel;
