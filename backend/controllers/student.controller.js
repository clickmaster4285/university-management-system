import { handle } from "../utils/asyncHandler.js";
import { Student, Program, Department, Campus, Batch } from "../models/index.js";
import { ensureStudentPortalAccount } from "../utils/studentPortalAccount.js";
import { generateStudentId } from "../utils/generateStudentId.js";

const notDeleted = { $ne: true };

function populateStudent(query) {
  return query
    .populate("programId", "name code degreeLevel")
    .populate("departmentId", "name code")
    .populate("campusId", "name campusCode")
    .populate("batchId", "name code")
    .populate("admissionId", "admissionId status")
    .populate("userId", "email role status");
}

export const getStudents = handle(async (req, res) => {
  const { programId, departmentId, campusId, status, search, page = 1, limit = 50 } = req.query;

  const filter = { isDeleted: notDeleted };
  if (programId) filter.programId = programId;
  if (departmentId) filter.departmentId = departmentId;
  if (campusId) filter.campusId = campusId;
  if (status) filter.status = status;

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

  res.json({ success: true, data: student });
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

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      existingStudent[key] = req.body[key];
    }
  }

  if (req.body.programId) {
    const program = await Program.findById(req.body.programId);
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
    const department = await Department.findById(req.body.departmentId);
    existingStudent.department = department?.name || existingStudent.department;
  }

  if (req.body.campusId) {
    const campus = await Campus.findById(req.body.campusId);
    existingStudent.campus = campus?.name || existingStudent.campus;
  }

  if (req.body.batchId) {
    await Batch.findById(req.body.batchId);
  }

  if (existingStudent.firstName || existingStudent.lastName) {
    existingStudent.name = `${existingStudent.firstName || ""} ${existingStudent.lastName || ""}`.trim();
  }

  await existingStudent.save();

  const updatedStudent = await populateStudent(Student.findById(existingStudent._id).select("-__v"));

  res.json({
    success: true,
    data: updatedStudent,
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
