import { useCallback, useEffect, useState } from "react";
import { Download, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import api from "@/features/axios";
import {
  workforceAPI,
  DOCUMENT_TYPE_LABELS,
  type StaffDocument,
  type StaffDocumentType,
} from "@/features/workforce";
import type { StaffMember } from "@/features/staffMembers";
import { getStaffRecordId } from "@/lib/staffUtils";

const DOCUMENT_TYPES = Object.keys(DOCUMENT_TYPE_LABELS) as StaffDocumentType[];

interface StaffDocumentsPanelProps {
  staff: StaffMember;
}

export function StaffDocumentsPanel({ staff }: StaffDocumentsPanelProps) {
  const staffId = getStaffRecordId(staff);
  const [documents, setDocuments] = useState<StaffDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    documentType: "cnic" as StaffDocumentType,
    documentName: "",
    notes: "",
    file: null as File | null,
  });

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await workforceAPI.listDocuments(staffId);
      setDocuments(data);
    } catch {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleUpload = async () => {
    if (!form.file || !form.documentName.trim()) {
      toast.error("File and document name are required");
      return;
    }
    setUploading(true);
    try {
      await workforceAPI.uploadDocument(staffId, {
        file: form.file,
        documentType: form.documentType,
        documentName: form.documentName.trim(),
        notes: form.notes,
      });
      toast.success("Document uploaded");
      setForm({ documentType: "cnic", documentName: "", notes: "", file: null });
      await loadDocuments();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to upload document";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: StaffDocument) => {
    if (!doc._id) return;
    try {
      const res = await api.get(`/staff/${staffId}/documents/${doc._id}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(res.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = doc.originalName || doc.fileName;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download document");
    }
  };

  const handleDelete = async (doc: StaffDocument) => {
    if (!doc._id || !confirm(`Delete ${doc.documentName}?`)) return;
    try {
      await workforceAPI.deleteDocument(staffId, doc._id);
      toast.success("Document deleted");
      await loadDocuments();
    } catch {
      toast.error("Failed to delete document");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          HR documents
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Files stored under <code>uploads/hr/{staff.staffId}/document_type/</code>
        </p>
      </div>

      <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
        <h4 className="font-medium">Upload document</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Document type</Label>
            <select
              value={form.documentType}
              onChange={(e) =>
                setForm((p) => ({ ...p, documentType: e.target.value as StaffDocumentType }))
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {DOCUMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {DOCUMENT_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Document name</Label>
            <Input
              value={form.documentName}
              onChange={(e) => setForm((p) => ({ ...p, documentName: e.target.value }))}
              placeholder="e.g. CNIC front, Employment contract"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>File (PDF, JPG, PNG, DOC)</Label>
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
              onChange={(e) => setForm((p) => ({ ...p, file: e.target.files?.[0] || null }))}
            />
          </div>
        </div>
        <Button onClick={handleUpload} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
          Upload
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : documents.length === 0 ? (
        <p className="text-sm text-muted-foreground border rounded-lg p-6 text-center">
          No documents uploaded yet.
        </p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc._id}
              className="flex flex-wrap items-center justify-between gap-3 border rounded-lg p-3"
            >
              <div>
                <p className="font-medium">{doc.documentName}</p>
                <p className="text-xs text-muted-foreground">
                  {DOCUMENT_TYPE_LABELS[doc.documentType]} · {doc.fileName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{doc.documentId}</Badge>
                <Button size="sm" variant="ghost" onClick={() => handleDownload(doc)}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(doc)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StaffDocumentsPanel;
