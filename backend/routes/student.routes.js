import { Router } from "express";
import { auth } from "../middleware/auth.js";
import {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkCreateStudents,
  getStudentStats
} from "../controllers/student.controller.js";
import { listStudentSemesterRegistrations } from "../controllers/semesterRegistration.controller.js";
import {
  deleteStudentDocument,
  downloadStudentDocument,
  listStudentDocuments,
  resolveStudentForUpload,
  uploadStudentDocument,
} from "../controllers/studentDocument.controller.js";
import { studentDocumentUpload } from "../middleware/upload.js";

const router = Router();

router.use(auth);

router.get("/", getStudents);
router.get("/stats", getStudentStats);
router.get("/:id/semester-registrations", listStudentSemesterRegistrations);
router.get("/:id/documents", listStudentDocuments);
router.post(
  "/:id/documents",
  resolveStudentForUpload,
  studentDocumentUpload.single("file"),
  uploadStudentDocument
);
router.get("/:id/documents/:documentId/download", downloadStudentDocument);
router.delete("/:id/documents/:documentId", deleteStudentDocument);
router.get("/:id", getStudentById);
router.post("/", createStudent);
router.post("/bulk", bulkCreateStudents);
router.put("/:id", updateStudent);
router.delete("/:id", deleteStudent);

export default router;