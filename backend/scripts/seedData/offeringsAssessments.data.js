/**
 * Declarative seed plan for Phase 6:
 * CourseOfferings → Enrollments → Assignments / Exams / Attendance
 *
 * Subject codes must exist in academicCatalog (seed:academic).
 * Batch codes / student semesters must match seedStaffAndStudents.
 */
export const OFFERING_SEED_SESSION = {
  name: 'Fall 2025',
  code: 'F25',
  startDate: '2025-08-15',
  endDate: '2025-12-31',
};

/**
 * One row = one class (offering) for a batch + semester.
 * Keep this curated (not full catalog) so demos stay readable.
 */
export const OFFERING_SEED_PLAN = [
  {
    programCode: 'BSCS',
    batchCode: 'BSCS-2025',
    semester: 1,
    subjectCodes: ['CS-101', 'MATH-101', 'ENG-101'],
  },
  {
    programCode: 'BSCS',
    batchCode: 'BSCS-2024',
    semester: 3,
    subjectCodes: ['CS-201', 'CS-203', 'MATH-201'],
  },
  {
    programCode: 'BSSE',
    batchCode: 'BSSE-2025',
    semester: 1,
    subjectCodes: ['SE-101', 'SE-102', 'SE-103'],
  },
  {
    programCode: 'BSSE',
    batchCode: 'BSSE-2023',
    semester: 5,
    subjectCodes: ['SE-301', 'SE-302', 'SE-303'],
  },
];

/** Sample assessments created per offering (idempotent by title + offeringId). */
export const ASSESSMENT_TEMPLATES = {
  assignment: {
    titleSuffix: 'Homework 1',
    description: 'Complete the assigned exercises and submit before the deadline.',
    type: 'Homework',
    maxScore: 100,
    passingScore: 60,
    weightage: 10,
    status: 'Open',
    daysUntilDue: 14,
  },
  exam: {
    titleSuffix: 'Quiz 1',
    type: 'Quiz',
    totalMarks: 20,
    passingMarks: 8,
    weightage: 5,
    duration: 45,
    hall: 'Lab-1',
    status: 'Scheduled',
    daysUntilExam: 21,
    startTime: '10:00',
    endTime: '10:45',
  },
};
