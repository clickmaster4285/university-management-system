import { handle } from "../utils/asyncHandler.js";
import { Student, Program, Department, Campus, Batch } from "../models/index.js";

const notDeleted = { $ne: true };

function populateStudent(query) {
  return query
    .populate("programId", "name code degreeLevel")
    .populate("departmentId", "name code")
    .populate("campusId", "name campusCode")
    .populate("batchId", "name code")
    .populate("admissionId", "admissionId status");
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
  return res.status(400).json({
    success: false,
    message: "Students must be created by completing an admission dossier",
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
