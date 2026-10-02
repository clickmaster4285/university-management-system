import { handle } from "../utils/asyncHandler.js";
import { Student, Program, Department, Campus, Batch, StudentAdmission } from "../models/index.js";
import { ensureStudentPortalAccount } from "../utils/studentPortalAccount.js";
import { generateStudentId } from "../utils/generateStudentId.js";

const notDeleted = { $ne: true };

function populateStudent(query) {
  return query
    .populate("programId", "name code degreeLevel")
    .populate("departmentId", "name code")
    .populate("campusId", "name campusCode")
    .populate("batchId", "name code year admissionSemester")
    .populate("admissionId", "admissionId status")
    .populate("userId", "email role status");
}

function refId(value) {
  if (value == null || value === "") return value;
  if (typeof value === "object") return value._id || value.id || null;
  return value;
}

async function enrichStudentFromAdmission(student) {
  const plain = student.toObject ? student.toObject() : { ...student };
  plain.fullName = plain.name || `${plain.firstName || ''} ${plain.lastName || ''}`.trim();
  const admissionRef = plain.admissionId;
  const admissionMongoId =
    admissionRef && typeof admissionRef === "object" ? admissionRef._id : admissionRef;

  if (!admissionMongoId) {
    return {
      ...plain,
      guardian: {
        fatherName: plain.fatherName || "",
        motherName: plain.motherName || "",
      },
      address: {
        city: plain.city || "",
      },
    };
  }

  const dossier = await StudentAdmission.findById(admissionMongoId).select(
    "admissionId dateOfBirth gender nationality religion guardian address previousEducation academicSessionId status"
  );
  if (!dossier) {
    return {
      ...plain,
      guardian: {
        fatherName: plain.fatherName || "",
        motherName: plain.motherName || "",
      },
      address: {
        city: plain.city || "",
      },
    };
  }

  // Backfill student personal fields when enrollment predated schema fields
  let dirty = false;
  if (!plain.dateOfBirth && dossier.dateOfBirth) {
    plain.dateOfBirth = dossier.dateOfBirth;
    student.dateOfBirth = dossier.dateOfBirth;
    dirty = true;
  }
  if (!plain.gender && dossier.gender) {
    plain.gender = dossier.gender;
    student.gender = dossier.gender;
    dirty = true;
  }
  if (!plain.nationality && dossier.nationality) {
    plain.nationality = dossier.nationality;
    student.nationality = dossier.nationality;
    dirty = true;
  }
  if (!plain.religion && dossier.religion) {
    plain.religion = dossier.religion;
    student.religion = dossier.religion;
    dirty = true;
  }
  if (!plain.fatherName && dossier.guardian?.fatherName) {
    plain.fatherName = dossier.guardian.fatherName;
    student.fatherName = dossier.guardian.fatherName;
    dirty = true;
  }
  if (!plain.motherName && dossier.guardian?.motherName) {
    plain.motherName = dossier.guardian.motherName;
    student.motherName = dossier.guardian.motherName;
    dirty = true;
  }
  if (!plain.city && dossier.address?.city) {
    plain.city = dossier.address.city;
    student.city = dossier.address.city;
    dirty = true;
  }
  if (dirty) {
    try {
      await student.save();
    } catch {
      /* enrichment is best-effort */
    }
  }

  return {
    ...plain,
    admissionNumber:
      (typeof admissionRef === "object" && admissionRef.admissionId) || dossier.admissionId,
    guardian: {
      fatherName: plain.fatherName || dossier.guardian?.fatherName || "",
      motherName: plain.motherName || dossier.guardian?.motherName || "",
      guardianName: dossier.guardian?.guardianName || "",
      guardianPhone: dossier.guardian?.guardianPhone || "",
      guardianRelation: dossier.guardian?.guardianRelation || "",
    },
    address: {
      street: dossier.address?.street || "",
      city: plain.city || dossier.address?.city || "",
      state: dossier.address?.state || "",
      postalCode: dossier.address?.postalCode || "",
      country: dossier.address?.country || "Pakistan",
    },
    previousEducation: dossier.previousEducation || [],
    dateOfBirth: plain.dateOfBirth || dossier.dateOfBirth || null,
    gender: plain.gender || dossier.gender || "",
    nationality: plain.nationality || dossier.nationality || "Pakistani",
    religion: plain.religion || dossier.religion || "",
  };
}

export const getStudents = handle(async (req, res) => {
  const {
    programId,
    departmentId,
    campusId,
    batchId,
    year,
    status,
    search,
    page = 1,
    limit = 50,
  } = req.query;

  const filter = { isDeleted: notDeleted };
  if (programId) filter.programId = programId;
  if (departmentId) filter.departmentId = departmentId;
  if (campusId) filter.campusId = campusId;
  if (batchId) filter.batchId = batchId;
  if (status) filter.status = status;

  if (year) {
    const yearNum = parseInt(year, 10);
    if (!Number.isNaN(yearNum)) {
      const batches = await Batch.find({
        year: yearNum,
        isDeleted: notDeleted,
      }).select('_id');
      const ids = batches.map((b) => b._id);
      filter.batchId = batchId
        ? batchId
        : { $in: ids.length ? ids : [null] };
    }
  }

  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { studentId: { $regex: search, $options: "i" } },
      { cnic: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const [students, totalCount] = await Promise.all([
    populateStudent(
      Student.find(filter).skip(skip).limit(parseInt(limit, 10)).sort({ createdAt: -1 }).select("-__v")
    ),
    Student.countDocuments(filter),
  ]);

  res.json({
    success: true,
    count: students.length,
    total: totalCount,
    page: parseInt(page, 10),
    totalPages: Math.ceil(totalCount / parseInt(limit, 10)),
    data: students,
  });
});

export const getStudentById = handle(async (req, res) => {
  const query = [{ studentId: req.params.id }];
  if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    query.unshift({ _id: req.params.id });
  }

  const student = await populateStudent(
    Student.findOne({ $or: query, isDeleted: notDeleted }).select("-__v")
  );

  if (!student) {
    return res.status(404).json({
      success: false,
      message: `Student ${req.params.id} not found`,
    });
  }

  const data = await enrichStudentFromAdmission(student);
  res.json({ success: true, data });
});

export const createStudent = handle(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    cnic,
    programId,
    campusId,
    batchId,
    fatherName,
    motherName,
    dateOfBirth,
    gender,
    city,
    currentSemester,
    status,
  } = req.body;

  if (!firstName || !lastName || !email || !phone || !cnic || !programId || !campusId || !batchId) {
    return res.status(400).json({
      success: false,
      message:
        "firstName, lastName, email, phone, cnic, programId, campusId, and batchId are required",
    });
  }

  if (!fatherName || !String(fatherName).trim()) {
    return res.status(400).json({ success: false, message: "fatherName is required" });
  }
  if (!city || !String(city).trim()) {
    return res.status(400).json({ success: false, message: "city is required" });
  }
  if (!gender || !["Male", "Female", "Other"].includes(gender)) {
    return res.status(400).json({ success: false, message: "gender is required" });
  }
  if (!dateOfBirth) {
    return res.status(400).json({ success: false, message: "dateOfBirth is required" });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const normalizedCnic = String(cnic).trim();

  const duplicate = await Student.findOne({
    isDeleted: notDeleted,
    $or: [{ email: normalizedEmail }, { cnic: normalizedCnic }],
  });
  if (duplicate) {
    return res.status(409).json({
      success: false,
      message: "A student with this email or CNIC already exists",
    });
  }

  const [program, campus, batch] = await Promise.all([
    Program.findById(programId),
    Campus.findById(campusId),
    Batch.findById(batchId),
  ]);

  if (!program) {
    return res.status(400).json({ success: false, message: "Invalid program" });
  }
  if (!campus) {
    return res.status(400).json({ success: false, message: "Invalid campus" });
  }
  if (!batch) {
    return res.status(400).json({ success: false, message: "Invalid batch" });
  }

  let departmentId = program.departmentId || null;
  let departmentName = "";
  if (departmentId) {
    const department = await Department.findById(departmentId);
    departmentName = department?.name || "";
  }

  const studentId = await generateStudentId();
  const student = await Student.create({
    studentId,
    firstName: String(firstName).trim(),
    lastName: String(lastName).trim(),
    name: `${String(firstName).trim()} ${String(lastName).trim()}`.trim(),
    fatherName: String(fatherName).trim(),
    motherName: motherName ? String(motherName).trim() : "",
    cnic: normalizedCnic,
    email: normalizedEmail,
    phone: String(phone).trim(),
    programId,
    departmentId,
    campusId,
    batchId,
    program: program.name || "",
    department: departmentName,
    campus: campus.name || "",
    city: String(city).trim(),
    status: status || "Active",
    enrollmentDate: new Date(),
    currentSemester: currentSemester ? Number(currentSemester) : 1,
    semester: currentSemester ? Number(currentSemester) : 1,
  });

  // dateOfBirth/gender stored only on admission today — keep on student if schema supports later
  void dateOfBirth;
  void gender;

  const portalResult = await ensureStudentPortalAccount(student);
  const populated = await populateStudent(Student.findById(student._id).select("-__v"));

  res.status(201).json({
    success: true,
    data: populated,
    portalLogin: portalResult.portalLogin,
    message: portalResult.portalLogin?.temporaryPassword
      ? `Student ${studentId} created. Portal password shown once — save it now.`
      : `Student ${studentId} created successfully`,
  });
});

export const updateStudent = handle(async (req, res) => {
  const query = [{ studentId: req.params.id }];
  if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    query.unshift({ _id: req.params.id });
  }

  const existingStudent = await Student.findOne({ $or: query, isDeleted: notDeleted });
  if (!existingStudent) {
    return res.status(404).json({
      success: false,
      message: `Student ${req.params.id} not found`,
    });
  }

  if (req.body.email) {
    const duplicateEmail = await Student.findOne({
      email: req.body.email,
      _id: { $ne: existingStudent._id },
      isDeleted: notDeleted,
    });
    if (duplicateEmail) {
      return res.status(400).json({
        success: false,
        message: `Student with email ${req.body.email} already exists`,
      });
    }
  }

  if (req.body.cnic) {
    const duplicateCnic = await Student.findOne({
      cnic: req.body.cnic,
      _id: { $ne: existingStudent._id },
      isDeleted: notDeleted,
    });
    if (duplicateCnic) {
      return res.status(400).json({
        success: false,
        message: `Student with CNIC ${req.body.cnic} already exists`,
      });
    }
  }

  const allowed = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "cnic",
    "fatherName",
    "motherName",
    "dateOfBirth",
    "gender",
    "nationality",
    "religion",
    "programId",
    "departmentId",
    "campusId",
    "batchId",
    "currentSemester",
    "semester",
    "gpa",
    "cgpa",
    "attendance",
    "fee",
    "city",
    "status",
    "photo",
    "profileImage",
  ];

  const objectIdFields = new Set(["programId", "departmentId", "campusId", "batchId"]);

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      let value = req.body[key];
      if (objectIdFields.has(key)) {
        value = refId(value);
      }
      existingStudent[key] = value;
    }
  }

  if (req.body.guardian?.fatherName !== undefined) {
    existingStudent.fatherName = String(req.body.guardian.fatherName || "").trim();
  }
  if (req.body.guardian?.motherName !== undefined) {
    existingStudent.motherName = String(req.body.guardian.motherName || "").trim();
  }
  if (req.body.address?.city !== undefined) {
    existingStudent.city = String(req.body.address.city || "").trim();
  }

  if (req.body.programId) {
    const program = await Program.findById(refId(req.body.programId));
    if (program) {
      existingStudent.program = program.name;
      if (program.departmentId) {
        existingStudent.departmentId = program.departmentId;
        const department = await Department.findById(program.departmentId);
        existingStudent.department = department?.name || "";
      }
    }
  }

  if (req.body.departmentId) {
    const department = await Department.findById(refId(req.body.departmentId));
    existingStudent.department = department?.name || existingStudent.department;
  }

  if (req.body.campusId) {
    const campus = await Campus.findById(refId(req.body.campusId));
    existingStudent.campus = campus?.name || existingStudent.campus;
  }

  if (req.body.batchId) {
    await Batch.findById(refId(req.body.batchId));
  }

  if (existingStudent.firstName || existingStudent.lastName) {
    existingStudent.name = `${existingStudent.firstName || ""} ${existingStudent.lastName || ""}`.trim();
  }

  await existingStudent.save();

  const updatedStudent = await populateStudent(Student.findById(existingStudent._id).select("-__v"));
  const data = await enrichStudentFromAdmission(updatedStudent);

  res.json({
    success: true,
    data,
  });
});

export const deleteStudent = handle(async (req, res) => {
  const query = [{ studentId: req.params.id }];
  if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
    query.unshift({ _id: req.params.id });
  }

  const student = await Student.findOne({ $or: query, isDeleted: notDeleted });
  if (!student) {
    return res.status(404).json({
      success: false,
      message: `Student ${req.params.id} not found`,
    });
  }

  student.isDeleted = true;
  student.deletedAt = new Date();
  student.deletedBy = req.user?._id || null;
  await student.save();

  res.json({
    success: true,
    message: "Student deleted successfully",
    data: student,
  });
});

export const bulkCreateStudents = handle(async (_req, res) => {
  return res.status(400).json({
    success: false,
    message: "Bulk student creation is disabled. Complete admission dossiers instead.",
  });
});

async function findStudentByIdentifier(identifier) {
  const query = [{ studentId: identifier }];
  if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
    query.unshift({ _id: identifier });
  }
  return Student.findOne({ $or: query, isDeleted: notDeleted });
}

export const enableStudentPortalLogin = handle(async (req, res) => {
  const student = await findStudentByIdentifier(req.params.id);
  if (!student) {
    return res.status(404).json({ success: false, message: `Student ${req.params.id} not found` });
  }

  if (student.userId) {
    return res.status(409).json({
      success: false,
      message: "Portal login already enabled for this student",
    });
  }

  const { password } = req.body || {};
  if (password && String(password).length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters",
    });
  }

  const result = await ensureStudentPortalAccount(student, { password });
  if (result.error) {
    return res.status(400).json({ success: false, message: result.error });
  }

  const populated = await populateStudent(Student.findById(student._id).select("-__v"));

  res.status(201).json({
    success: true,
    data: populated,
    portalLogin: result.portalLogin,
    message: result.portalLogin?.temporaryPassword
      ? "Portal login enabled. Temporary password shown once — save it now."
      : "Portal login linked to existing student account",
  });
});

export const getStudentStats = handle(async (_req, res) => {
  const match = { isDeleted: notDeleted };
  const [totalStudents, activeStudents, graduatedStudents] = await Promise.all([
    Student.countDocuments(match),
    Student.countDocuments({ ...match, status: "Active" }),
    Student.countDocuments({ ...match, status: "Graduated" }),
  ]);

  const programStats = await Student.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$programId",
        count: { $sum: 1 },
        avgGpa: { $avg: "$gpa" },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  const statusStats = await Student.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  res.json({
    success: true,
    data: {
      totalStudents,
      activeStudents,
      graduatedStudents,
      byProgram: programStats,
      byStatus: statusStats,
    },
  });
});
