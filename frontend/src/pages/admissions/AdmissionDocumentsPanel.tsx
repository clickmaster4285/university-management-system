import { useCallback, useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import api from "@/features/axios";
import { StudentDocumentSlots } from "@/components/student/StudentDocumentSlots";
import {
  STUDENT_DOCUMENT_TYPE_LABELS,
  studentAdmissionsAPI,
  type StudentDocument,
  type StudentDocumentType,
} from "@/features/studentAdmissions";

interface AdmissionDocumentsPanelProps {
  dossierId: string;
  ownerLabel?: string;
  onDocumentsChange?: () => void;
}

export function AdmissionDocumentsPanel({ dossierId, ownerLabel, onDocumentsChange }: AdmissionDocumentsPanelProps) {
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

  const handleDownload = async (doc: StudentDocument) => {
    if (!doc._id) return;
    const res = await api.get(`/admissions/dossiers/${dossierId}/documents/${doc._id}/download`, {
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(res.data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = doc.originalName || doc.fileName;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDelete = async (doc: StudentDocument) => {
    if (!doc._id) return;
    await studentAdmissionsAPI.deleteDossierDocument(dossierId, doc._id);
    toast.success("Document removed");
    await loadDocuments();
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Admission documents
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Upload each document directly in its slot. Files are stored under{" "}
          <code>uploads/students/{ownerLabel || dossierId}/document_type/</code>
        </p>
      </div>

      <StudentDocumentSlots
        documents={documents}
        loading={loading}
        onUpload={handleUpload}
        onDownload={handleDownload}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default AdmissionDocumentsPanel;
