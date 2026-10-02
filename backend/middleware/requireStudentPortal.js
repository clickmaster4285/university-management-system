import { Student } from '../models/index.js';

const notDeleted = { $ne: true };

/**
 * Requires auth first. Ensures JWT user is role Student and has a linked Student record.
 * Attaches req.student (populated lightly).
 */
export const requireStudentPortal = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (req.user.role !== 'Student') {
      return res.status(403).json({
        success: false,
        message: 'Student portal access only',
      });
    }

    const student = await Student.findOne({
      userId: req.user._id,
      isDeleted: notDeleted,
    })
      .populate('programId', 'name code degreeLevel')
      .populate('departmentId', 'name code')
      .populate('campusId', 'name campusCode')
      .populate('batchId', 'name code');

    if (!student) {
      return res.status(403).json({
        success: false,
        message: 'No student record linked to this account',
      });
    }

    req.student = student;
    next();
  } catch (error) {
    console.error('requireStudentPortal:', error);
    res.status(500).json({ success: false, message: 'Student portal access check failed' });
  }
};
