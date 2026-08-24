import mongoose from 'mongoose';
import { handle } from "../utils/asyncHandler.js";

import { Exam } from '../models/index.js';
const normalizeUserRef = (value) => {
  if (!value) return undefined;
  if (mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return undefined;
};

export const getAllExams = handle(async (req, res) => {
  const {
    course,
    status,
    type,
    instructor,
    department,
    fromDate,
    toDate,
    search,
    limit = 50,
    page = 1
  } = req.query;

  const query = { isDeleted: { $ne: true } };
  if (course) query.course = { $regex: course, $options: 'i' };
  if (status) query.status = status;
  if (type) query.type = type;
  if (instructor) query.instructor = { $regex: instructor, $options: 'i' };
  if (department) query.department = department;
  if (fromDate || toDate) {
    query.examDate = {};
    if (fromDate) query.examDate.$gte = new Date(fromDate);
    if (toDate) query.examDate.$lte = new Date(toDate);
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { course: { $regex: search, $options: 'i' } },
      { courseCode: { $regex: search, $options: 'i' } },
      { instructor: { $regex: search, $options: 'i' } },
      { examId: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [exams, total] = await Promise.all([
    Exam.find(query)
      .sort({ examDate: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('createdBy', 'name email'),
    Exam.countDocuments(query)
  ]);

  res.json({
    success: true,
    data: exams || [],
    pagination: {
      total: total || 0,
      page: parseInt(page) || 1,
      pages: Math.ceil((total || 0) / parseInt(limit)) || 0,
      limit: parseInt(limit) || 50
    }
  });
});

export const getExamById = handle(async (req, res) => {
  const exam = await Exam.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

  if (!exam) {
    return res.status(404).json({
      success: false,
      message: 'Exam not found',
      data: null
    });
  }

  res.json({
    success: true,
    data: exam
  });
});

export const createExam = handle(async (req, res) => {
  const requiredFields = ['title', 'type', 'course', 'courseCode', 'department', 'program', 'semester', 'instructor', 'examDate', 'startTime', 'endTime', 'duration', 'hall', 'totalMarks', 'passingMarks'];
  const missingFields = requiredFields.filter(field => !req.body[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Missing required fields: ${missingFields.join(', ')}`,
      data: null
    });
  }

  const exam = new Exam({
    ...req.body,
    createdBy: normalizeUserRef(req.user?.id)
  });

  await exam.save();

  res.status(201).json({
    success: true,
    data: exam,
    message: `Exam created successfully. ID: ${exam.examId}`
  });
});

export const updateExam = handle(async (req, res) => {
  const exam = await Exam.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!exam) {
    return res.status(404).json({
      success: false,
      message: 'Exam not found',
      data: null
    });
  }

  const updateableFields = [
    'title', 'type', 'course', 'courseCode', 'department', 'program',
    'semester', 'academicYear', 'instructor', 'instructorEmail',
    'totalMarks', 'passingMarks', 'weightage',
    'examDate', 'startTime', 'endTime', 'duration',
    'hall', 'building', 'invigilators',
    'status', 'instructions', 'resultsPublished'
  ];

  updateableFields.forEach(field => {
    if (req.body[field] !== undefined) {
      const value = req.body[field];

      if (field === 'totalMarks' || field === 'passingMarks' || field === 'weightage' || field === 'duration') {
        exam[field] = parseFloat(value) || 0;
      } else if (field === 'semester') {
        exam[field] = parseInt(value) || 1;
      } else if (field === 'examDate') {
        if (value === '' || value === null || value === undefined) {
          // Skip
        } else {
          const parsedDate = new Date(value);
          if (!isNaN(parsedDate.getTime())) {
            exam[field] = parsedDate;
          }
        }
      } else if (field === 'invigilators') {
        exam[field] = Array.isArray(value) ? value : [];
      } else {
        exam[field] = value;
      }
    }
  });

  exam.updatedBy = normalizeUserRef(req.user?.id);
  await exam.save();

  res.json({
    success: true,
    data: exam,
    message: 'Exam updated successfully'
  });
});

export const deleteExam = handle(async (req, res) => {
  const exam = await Exam.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!exam) {
    return res.status(404).json({
      success: false,
      message: 'Exam not found'
    });
  }

  await exam.deleteOne();

  res.json({
    success: true,
    message: 'Exam deleted successfully'
  });
});

export const getExamStats = handle(async (req, res) => {
  const total = await Exam.countDocuments({ isDeleted: { $ne: true } }) || 0;
  const scheduled = await Exam.countDocuments({ status: 'Scheduled', isDeleted: { $ne: true } }) || 0;
  const inProgress = await Exam.countDocuments({ status: 'In Progress', isDeleted: { $ne: true } }) || 0;
  const completed = await Exam.countDocuments({ status: 'Completed', isDeleted: { $ne: true } }) || 0;
  const cancelled = await Exam.countDocuments({ status: 'Cancelled', isDeleted: { $ne: true } }) || 0;

  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const upcomingExams = await Exam.find({
    examDate: { $gte: now, $lte: nextWeek },
    status: { $in: ['Scheduled'] },
    isDeleted: { $ne: true }
  }).sort({ examDate: 1 });

  const completedExams = await Exam.find({ status: 'Completed', resultsPublished: true, isDeleted: { $ne: true } });
  let totalGPA = 0;
  let gpaCount = 0;

  completedExams.forEach(exam => {
    if (exam.grades && exam.grades.length > 0) {
      exam.grades.forEach(grade => {
        if (grade.gpa) {
          totalGPA += grade.gpa;
          gpaCount++;
        }
      });
    }
  });

  const avgGPA = gpaCount > 0 ? (totalGPA / gpaCount) : 0;

  res.json({
    success: true,
    data: {
      total,
      scheduled,
      inProgress,
      completed,
      cancelled,
      avgGPA: parseFloat(avgGPA.toFixed(2)),
      upcomingExams: upcomingExams.map(e => ({
        id: e._id,
        title: e.title,
        course: e.course,
        courseCode: e.courseCode,
        examDate: e.examDate,
        hall: e.hall,
        daysLeft: Math.ceil((e.examDate - now) / (1000 * 60 * 60 * 24))
      }))
    }
  });
});

export const addGrades = handle(async (req, res) => {
  const { id } = req.params;
  const { grades } = req.body;

  const exam = await Exam.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!exam) {
    return res.status(404).json({
      success: false,
      message: 'Exam not found'
    });
  }

  if (!Array.isArray(grades) || grades.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Grades must be a non-empty array'
    });
  }

  const gradeToGPA = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D': 1.0, 'F': 0.0, 'I': 0.0, 'W': 0.0
  };

  const processedGrades = grades.map(g => ({
    ...g,
    gpa: gradeToGPA[g.grade] || 0,
    obtainedMarks: parseFloat(g.obtainedMarks) || 0
  }));

  exam.grades = processedGrades;
  exam.resultsPublished = true;
  exam.resultsPublishedDate = new Date();
  exam.status = 'Completed';

  exam.calculateStatistics();
  await exam.save();

  res.json({
    success: true,
    data: exam,
    message: 'Grades added successfully'
  });
});

export const getGrades = handle(async (req, res) => {
  const { id } = req.params;

  const exam = await Exam.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!exam) {
    return res.status(404).json({
      success: false,
      message: 'Exam not found'
    });
  }

  res.json({
    success: true,
    data: {
      exam: {
        id: exam._id,
        title: exam.title,
        course: exam.course,
        courseCode: exam.courseCode,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks
      },
      grades: exam.grades || [],
      statistics: {
        totalStudents: exam.totalStudents,
        passedStudents: exam.passedStudents,
        failedStudents: exam.failedStudents,
        averageMarks: exam.averageMarks,
        highestMarks: exam.highestMarks,
        lowestMarks: exam.lowestMarks
      }
    }
  });
});

export const updateGrade = handle(async (req, res) => {
  const { id, studentId } = req.params;
  const { obtainedMarks, grade, remarks, isPresent } = req.body;

  const exam = await Exam.findOne({ _id: id, isDeleted: { $ne: true } });
  if (!exam) {
    return res.status(404).json({
      success: false,
      message: 'Exam not found'
    });
  }

  const gradeIndex = exam.grades.findIndex(g => g.studentId === studentId);
  if (gradeIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Student grade not found'
    });
  }

  if (obtainedMarks !== undefined) {
    exam.grades[gradeIndex].obtainedMarks = parseFloat(obtainedMarks) || 0;
  }
  if (grade !== undefined) {
    const gradeToGPA = {
      'A+': 4.0, 'A': 4.0, 'A-': 3.7,
      'B+': 3.3, 'B': 3.0, 'B-': 2.7,
      'C+': 2.3, 'C': 2.0, 'C-': 1.7,
      'D': 1.0, 'F': 0.0, 'I': 0.0, 'W': 0.0
    };
    exam.grades[gradeIndex].grade = grade;
    exam.grades[gradeIndex].gpa = gradeToGPA[grade] || 0;
  }
  if (remarks !== undefined) {
    exam.grades[gradeIndex].remarks = remarks;
  }
  if (isPresent !== undefined) {
    exam.grades[gradeIndex].isPresent = isPresent;
  }

  exam.calculateStatistics();
  await exam.save();

  res.json({
    success: true,
    data: exam,
    message: 'Grade updated successfully'
  });
});
