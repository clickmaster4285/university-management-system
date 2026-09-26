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
  type StudentDocumentType,
} from "@/features/studentAdmissions";
import type { Student } from "@/features/students";

interface StudentDocumentsPanelProps {
  student: Student;
}

export function StudentDocumentsPanel({ student }: StudentDocumentsPanelProps) {
  const studentId = student.studentId || student._id || "";
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await studentAdmissionsAPI.listStudentDocuments(studentId);
      setDocuments(data);
    } catch {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleUpload = async (documentType: StudentDocumentType, file: File) => {
    const baseName = file.name.replace(/\.[^.]+$/, "");
    await studentAdmissionsAPI.uploadStudentDocument(studentId, {
      file,
      documentType,
      documentName: baseName || STUDENT_DOCUMENT_TYPE_LABELS[documentType],
    });
    await loadDocuments();
  };

  const handleFetchFile = async (doc: StudentDocument) => {
    if (!doc._id) throw new Error("Missing document id");
    const res = await api.get(`/students/${studentId}/documents/${doc._id}/download`, {
      responseType: "blob",
    });
    return resolveFileBlob(res.data as Blob, String(res.headers["content-type"] || ""));
  };

  const handleDelete = async (doc: StudentDocument) => {
    if (!doc._id) return;
    await studentAdmissionsAPI.deleteStudentDocument(studentId, doc._id);
    toast.success("Document removed");
    await loadDocuments();
  };

  return (
    <StudentDocumentSlots
      documents={documents}
      loading={loading}
      onUpload={handleUpload}
      onFetchFile={handleFetchFile}
      onDelete={handleDelete}
      title="Student documents"
      description={`Upload each document in its slot under uploads/students/${student.studentId || studentId}/document_type/`}
    />
  );
}

export default StudentDocumentsPanel;
