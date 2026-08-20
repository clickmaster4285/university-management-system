// backend/src/scripts/seedCourses.js
import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Department from '../models/Department.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Ensure we load the backend .env regardless of current working directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

// All course data from the provided list
const courseData = [
  // 1. Computer Science — BSCS
  // Semester 1
  { code: 'CS-101', name: 'Programming Fundamentals', department: 'Computer Science', program: 'BSCS', semester: 1, credits: 3, feePerCredit: 5000 },
  { code: 'MATH-101', name: 'Calculus & Analytical Geometry', department: 'Computer Science', program: 'BSCS', semester: 1, credits: 3, feePerCredit: 4000 },
  { code: 'ENG-101', name: 'English Composition', department: 'Computer Science', program: 'BSCS', semester: 1, credits: 3, feePerCredit: 3000 },
  { code: 'ICT-101', name: 'Introduction to ICT', department: 'Computer Science', program: 'BSCS', semester: 1, credits: 3, feePerCredit: 4000 },
  { code: 'ISL-101', name: 'Islamic Studies', department: 'Computer Science', program: 'BSCS', semester: 1, credits: 2, feePerCredit: 3000 },
  // Semester 2
  { code: 'CS-102', name: 'Object Oriented Programming', department: 'Computer Science', program: 'BSCS', semester: 2, credits: 3, feePerCredit: 5000 },
  { code: 'MATH-102', name: 'Discrete Mathematics', department: 'Computer Science', program: 'BSCS', semester: 2, credits: 3, feePerCredit: 4000 },
  { code: 'CS-103', name: 'Digital Logic Design', department: 'Computer Science', program: 'BSCS', semester: 2, credits: 3, feePerCredit: 5000 },
  { code: 'ENG-102', name: 'Communication Skills', department: 'Computer Science', program: 'BSCS', semester: 2, credits: 3, feePerCredit: 3000 },
  { code: 'PAK-101', name: 'Pakistan Studies', department: 'Computer Science', program: 'BSCS', semester: 2, credits: 2, feePerCredit: 3000 },
  // Semester 3
  { code: 'CS-201', name: 'Data Structures', department: 'Computer Science', program: 'BSCS', semester: 3, credits: 3, feePerCredit: 5000 },
  { code: 'CS-202', name: 'Computer Organization', department: 'Computer Science', program: 'BSCS', semester: 3, credits: 3, feePerCredit: 5000 },
  { code: 'MATH-201', name: 'Linear Algebra', department: 'Computer Science', program: 'BSCS', semester: 3, credits: 3, feePerCredit: 4000 },
  { code: 'STAT-201', name: 'Probability & Statistics', department: 'Computer Science', program: 'BSCS', semester: 3, credits: 3, feePerCredit: 4000 },
  { code: 'CS-203', name: 'Database Systems', department: 'Computer Science', program: 'BSCS', semester: 3, credits: 3, feePerCredit: 5000 },
  // Semester 4
  { code: 'CS-204', name: 'Algorithms', department: 'Computer Science', program: 'BSCS', semester: 4, credits: 3, feePerCredit: 5000 },
  { code: 'CS-205', name: 'Operating Systems', department: 'Computer Science', program: 'BSCS', semester: 4, credits: 3, feePerCredit: 5000 },
  { code: 'CS-206', name: 'Software Engineering', department: 'Computer Science', program: 'BSCS', semester: 4, credits: 3, feePerCredit: 5000 },
  { code: 'CS-207', name: 'Web Engineering', department: 'Computer Science', program: 'BSCS', semester: 4, credits: 3, feePerCredit: 5000 },
  { code: 'CS-208', name: 'Database Management', department: 'Computer Science', program: 'BSCS', semester: 4, credits: 3, feePerCredit: 5000 },
  // Semester 5
  { code: 'CS-301', name: 'Artificial Intelligence', department: 'Computer Science', program: 'BSCS', semester: 5, credits: 3, feePerCredit: 5500 },
  { code: 'CS-302', name: 'Computer Networks', department: 'Computer Science', program: 'BSCS', semester: 5, credits: 3, feePerCredit: 5500 },
  { code: 'CS-303', name: 'Design & Analysis of Algorithms', department: 'Computer Science', program: 'BSCS', semester: 5, credits: 3, feePerCredit: 5500 },
  { code: 'CS-304', name: 'Theory of Computation', department: 'Computer Science', program: 'BSCS', semester: 5, credits: 3, feePerCredit: 5500 },
  { code: 'CS-305', name: 'Human Computer Interaction', department: 'Computer Science', program: 'BSCS', semester: 5, credits: 3, feePerCredit: 5500 },
  // Semester 6
  { code: 'CS-306', name: 'Machine Learning', department: 'Computer Science', program: 'BSCS', semester: 6, credits: 3, feePerCredit: 5500 },
  { code: 'CS-307', name: 'Information Security', department: 'Computer Science', program: 'BSCS', semester: 6, credits: 3, feePerCredit: 5500 },
  { code: 'CS-308', name: 'Compiler Construction', department: 'Computer Science', program: 'BSCS', semester: 6, credits: 3, feePerCredit: 5500 },
  { code: 'CS-309', name: 'Distributed Systems', department: 'Computer Science', program: 'BSCS', semester: 6, credits: 3, feePerCredit: 5500 },
  { code: 'CS-310', name: 'Mobile Application Development', department: 'Computer Science', program: 'BSCS', semester: 6, credits: 3, feePerCredit: 5500 },
  // Semester 7
  { code: 'CS-401', name: 'Deep Learning', department: 'Computer Science', program: 'BSCS', semester: 7, credits: 3, feePerCredit: 6000 },
  { code: 'CS-402', name: 'Cloud Computing', department: 'Computer Science', program: 'BSCS', semester: 7, credits: 3, feePerCredit: 6000 },
  { code: 'CS-403', name: 'Data Mining', department: 'Computer Science', program: 'BSCS', semester: 7, credits: 3, feePerCredit: 6000 },
  { code: 'CS-404', name: 'Big Data Analytics', department: 'Computer Science', program: 'BSCS', semester: 7, credits: 3, feePerCredit: 6000 },
  { code: 'CS-405', name: 'Final Year Project I', department: 'Computer Science', program: 'BSCS', semester: 7, credits: 3, feePerCredit: 6000 },
  // Semester 8
  { code: 'CS-406', name: 'Natural Language Processing', department: 'Computer Science', program: 'BSCS', semester: 8, credits: 3, feePerCredit: 6000 },
  { code: 'CS-407', name: 'Cyber Security', department: 'Computer Science', program: 'BSCS', semester: 8, credits: 3, feePerCredit: 6000 },
  { code: 'CS-408', name: 'Internet of Things', department: 'Computer Science', program: 'BSCS', semester: 8, credits: 3, feePerCredit: 6000 },
  { code: 'CS-409', name: 'Professional Practices', department: 'Computer Science', program: 'BSCS', semester: 8, credits: 2, feePerCredit: 5000 },
  { code: 'CS-410', name: 'Final Year Project II', department: 'Computer Science', program: 'BSCS', semester: 8, credits: 3, feePerCredit: 6000 },

  // 2. Software Engineering — BSSE
  // Semester 1
  { code: 'SE-101', name: 'Programming Fundamentals', department: 'Software Engineering', program: 'BSSE', semester: 1, credits: 3, feePerCredit: 5000 },
  { code: 'SE-102', name: 'Calculus', department: 'Software Engineering', program: 'BSSE', semester: 1, credits: 3, feePerCredit: 4000 },
  { code: 'SE-103', name: 'English Composition', department: 'Software Engineering', program: 'BSSE', semester: 1, credits: 3, feePerCredit: 3000 },
  { code: 'SE-104', name: 'Introduction to Computing', department: 'Software Engineering', program: 'BSSE', semester: 1, credits: 3, feePerCredit: 4000 },
  { code: 'SE-105', name: 'Islamic Studies', department: 'Software Engineering', program: 'BSSE', semester: 1, credits: 2, feePerCredit: 3000 },
  // Semester 2
  { code: 'SE-106', name: 'Object Oriented Programming', department: 'Software Engineering', program: 'BSSE', semester: 2, credits: 3, feePerCredit: 5000 },
  { code: 'SE-107', name: 'Discrete Structures', department: 'Software Engineering', program: 'BSSE', semester: 2, credits: 3, feePerCredit: 4000 },
  { code: 'SE-108', name: 'Digital Logic Design', department: 'Software Engineering', program: 'BSSE', semester: 2, credits: 3, feePerCredit: 5000 },
  { code: 'SE-109', name: 'Communication Skills', department: 'Software Engineering', program: 'BSSE', semester: 2, credits: 3, feePerCredit: 3000 },
  { code: 'SE-110', name: 'Pakistan Studies', department: 'Software Engineering', program: 'BSSE', semester: 2, credits: 2, feePerCredit: 3000 },
  // Semester 3
  { code: 'SE-201', name: 'Data Structures', department: 'Software Engineering', program: 'BSSE', semester: 3, credits: 3, feePerCredit: 5000 },
  { code: 'SE-202', name: 'Software Requirements Engineering', department: 'Software Engineering', program: 'BSSE', semester: 3, credits: 3, feePerCredit: 5000 },
  { code: 'SE-203', name: 'Database Systems', department: 'Software Engineering', program: 'BSSE', semester: 3, credits: 3, feePerCredit: 5000 },
  { code: 'SE-204', name: 'Linear Algebra', department: 'Software Engineering', program: 'BSSE', semester: 3, credits: 3, feePerCredit: 4000 },
  { code: 'SE-205', name: 'Probability & Statistics', department: 'Software Engineering', program: 'BSSE', semester: 3, credits: 3, feePerCredit: 4000 },
  // Semester 4
  { code: 'SE-206', name: 'Software Design & Architecture', department: 'Software Engineering', program: 'BSSE', semester: 4, credits: 3, feePerCredit: 5000 },
  { code: 'SE-207', name: 'Operating Systems', department: 'Software Engineering', program: 'BSSE', semester: 4, credits: 3, feePerCredit: 5000 },
  { code: 'SE-208', name: 'Web Engineering', department: 'Software Engineering', program: 'BSSE', semester: 4, credits: 3, feePerCredit: 5000 },
  { code: 'SE-209', name: 'Software Construction', department: 'Software Engineering', program: 'BSSE', semester: 4, credits: 3, feePerCredit: 5000 },
  { code: 'SE-210', name: 'Human Computer Interaction', department: 'Software Engineering', program: 'BSSE', semester: 4, credits: 3, feePerCredit: 5000 },
  // Semester 5
  { code: 'SE-301', name: 'Software Quality Engineering', department: 'Software Engineering', program: 'BSSE', semester: 5, credits: 3, feePerCredit: 5500 },
  { code: 'SE-302', name: 'Software Project Management', department: 'Software Engineering', program: 'BSSE', semester: 5, credits: 3, feePerCredit: 5500 },
  { code: 'SE-303', name: 'Computer Networks', department: 'Software Engineering', program: 'BSSE', semester: 5, credits: 3, feePerCredit: 5500 },
  { code: 'SE-304', name: 'Software Testing', department: 'Software Engineering', program: 'BSSE', semester: 5, credits: 3, feePerCredit: 5500 },
  { code: 'SE-305', name: 'Software Architecture', department: 'Software Engineering', program: 'BSSE', semester: 5, credits: 3, feePerCredit: 5500 },
  // Semester 6
  { code: 'SE-306', name: 'Artificial Intelligence', department: 'Software Engineering', program: 'BSSE', semester: 6, credits: 3, feePerCredit: 5500 },
  { code: 'SE-307', name: 'DevOps Engineering', department: 'Software Engineering', program: 'BSSE', semester: 6, credits: 3, feePerCredit: 5500 },
  { code: 'SE-308', name: 'Information Security', department: 'Software Engineering', program: 'BSSE', semester: 6, credits: 3, feePerCredit: 5500 },
  { code: 'SE-309', name: 'Mobile Application Development', department: 'Software Engineering', program: 'BSSE', semester: 6, credits: 3, feePerCredit: 5500 },
  { code: 'SE-310', name: 'Requirements Management', department: 'Software Engineering', program: 'BSSE', semester: 6, credits: 3, feePerCredit: 5500 },
  // Semester 7
  { code: 'SE-401', name: 'Cloud Software Engineering', department: 'Software Engineering', program: 'BSSE', semester: 7, credits: 3, feePerCredit: 6000 },
  { code: 'SE-402', name: 'Agile Software Development', department: 'Software Engineering', program: 'BSSE', semester: 7, credits: 3, feePerCredit: 6000 },
  { code: 'SE-403', name: 'Software Metrics', department: 'Software Engineering', program: 'BSSE', semester: 7, credits: 3, feePerCredit: 6000 },
  { code: 'SE-404', name: 'Software Maintenance', department: 'Software Engineering', program: 'BSSE', semester: 7, credits: 3, feePerCredit: 6000 },
  { code: 'SE-405', name: 'Final Year Project I', department: 'Software Engineering', program: 'BSSE', semester: 7, credits: 3, feePerCredit: 6000 },
  // Semester 8
  { code: 'SE-406', name: 'Software Reengineering', department: 'Software Engineering', program: 'BSSE', semester: 8, credits: 3, feePerCredit: 6000 },
  { code: 'SE-407', name: 'Enterprise Application Development', department: 'Software Engineering', program: 'BSSE', semester: 8, credits: 3, feePerCredit: 6000 },
  { code: 'SE-408', name: 'Software Process Improvement', department: 'Software Engineering', program: 'BSSE', semester: 8, credits: 3, feePerCredit: 6000 },
  { code: 'SE-409', name: 'Professional Practices', department: 'Software Engineering', program: 'BSSE', semester: 8, credits: 2, feePerCredit: 5000 },
  { code: 'SE-410', name: 'Final Year Project II', department: 'Software Engineering', program: 'BSSE', semester: 8, credits: 3, feePerCredit: 6000 },

  // 3. Information Technology — BSIT
  // Semester 1
  { code: 'IT-101', name: 'Introduction to IT', department: 'Information Technology', program: 'BSIT', semester: 1, credits: 3, feePerCredit: 4500 },
  { code: 'IT-102', name: 'Programming Fundamentals', department: 'Information Technology', program: 'BSIT', semester: 1, credits: 3, feePerCredit: 5000 },
  { code: 'IT-103', name: 'Calculus', department: 'Information Technology', program: 'BSIT', semester: 1, credits: 3, feePerCredit: 4000 },
  { code: 'IT-104', name: 'English Composition', department: 'Information Technology', program: 'BSIT', semester: 1, credits: 3, feePerCredit: 3000 },
  { code: 'IT-105', name: 'Islamic Studies', department: 'Information Technology', program: 'BSIT', semester: 1, credits: 2, feePerCredit: 3000 },
  // Semester 2
  { code: 'IT-106', name: 'Object Oriented Programming', department: 'Information Technology', program: 'BSIT', semester: 2, credits: 3, feePerCredit: 5000 },
  { code: 'IT-107', name: 'Database Fundamentals', department: 'Information Technology', program: 'BSIT', semester: 2, credits: 3, feePerCredit: 4500 },
  { code: 'IT-108', name: 'Discrete Mathematics', department: 'Information Technology', program: 'BSIT', semester: 2, credits: 3, feePerCredit: 4000 },
  { code: 'IT-109', name: 'Communication Skills', department: 'Information Technology', program: 'BSIT', semester: 2, credits: 3, feePerCredit: 3000 },
  { code: 'IT-110', name: 'Pakistan Studies', department: 'Information Technology', program: 'BSIT', semester: 2, credits: 2, feePerCredit: 3000 },
  // Semester 3
  { code: 'IT-201', name: 'Data Structures', department: 'Information Technology', program: 'BSIT', semester: 3, credits: 3, feePerCredit: 5000 },
  { code: 'IT-202', name: 'Web Development', department: 'Information Technology', program: 'BSIT', semester: 3, credits: 3, feePerCredit: 4500 },
  { code: 'IT-203', name: 'Computer Organization', department: 'Information Technology', program: 'BSIT', semester: 3, credits: 3, feePerCredit: 5000 },
  { code: 'IT-204', name: 'Statistics', department: 'Information Technology', program: 'BSIT', semester: 3, credits: 3, feePerCredit: 4000 },
  { code: 'IT-205', name: 'Database Management Systems', department: 'Information Technology', program: 'BSIT', semester: 3, credits: 3, feePerCredit: 4500 },
  // Semester 4
  { code: 'IT-206', name: 'Operating Systems', department: 'Information Technology', program: 'BSIT', semester: 4, credits: 3, feePerCredit: 5000 },
  { code: 'IT-207', name: 'Computer Networks', department: 'Information Technology', program: 'BSIT', semester: 4, credits: 3, feePerCredit: 5000 },
  { code: 'IT-208', name: 'System Analysis & Design', department: 'Information Technology', program: 'BSIT', semester: 4, credits: 3, feePerCredit: 4500 },
  { code: 'IT-209', name: 'Web Engineering', department: 'Information Technology', program: 'BSIT', semester: 4, credits: 3, feePerCredit: 5000 },
  { code: 'IT-210', name: 'IT Project Management', department: 'Information Technology', program: 'BSIT', semester: 4, credits: 3, feePerCredit: 4500 },
  // Semester 5
  { code: 'IT-301', name: 'Information Security', department: 'Information Technology', program: 'BSIT', semester: 5, credits: 3, feePerCredit: 5500 },
  { code: 'IT-302', name: 'Cloud Computing', department: 'Information Technology', program: 'BSIT', semester: 5, credits: 3, feePerCredit: 5500 },
  { code: 'IT-303', name: 'Mobile Computing', department: 'Information Technology', program: 'BSIT', semester: 5, credits: 3, feePerCredit: 5500 },
  { code: 'IT-304', name: 'Artificial Intelligence', department: 'Information Technology', program: 'BSIT', semester: 5, credits: 3, feePerCredit: 5500 },
  { code: 'IT-305', name: 'IT Infrastructure', department: 'Information Technology', program: 'BSIT', semester: 5, credits: 3, feePerCredit: 5500 },
  // Semester 6
  { code: 'IT-306', name: 'Data Mining', department: 'Information Technology', program: 'BSIT', semester: 6, credits: 3, feePerCredit: 5500 },
  { code: 'IT-307', name: 'Network Administration', department: 'Information Technology', program: 'BSIT', semester: 6, credits: 3, feePerCredit: 5500 },
  { code: 'IT-308', name: 'E-Commerce', department: 'Information Technology', program: 'BSIT', semester: 6, credits: 3, feePerCredit: 5500 },
  { code: 'IT-309', name: 'Human Computer Interaction', department: 'Information Technology', program: 'BSIT', semester: 6, credits: 3, feePerCredit: 5500 },
  { code: 'IT-310', name: 'IT Service Management', department: 'Information Technology', program: 'BSIT', semester: 6, credits: 3, feePerCredit: 5500 },
  // Semester 7
  { code: 'IT-401', name: 'Big Data Analytics', department: 'Information Technology', program: 'BSIT', semester: 7, credits: 3, feePerCredit: 6000 },
  { code: 'IT-402', name: 'Internet of Things', department: 'Information Technology', program: 'BSIT', semester: 7, credits: 3, feePerCredit: 6000 },
  { code: 'IT-403', name: 'Cyber Security', department: 'Information Technology', program: 'BSIT', semester: 7, credits: 3, feePerCredit: 6000 },
  { code: 'IT-404', name: 'Enterprise Systems', department: 'Information Technology', program: 'BSIT', semester: 7, credits: 3, feePerCredit: 6000 },
  { code: 'IT-405', name: 'Final Year Project I', department: 'Information Technology', program: 'BSIT', semester: 7, credits: 3, feePerCredit: 6000 },
  // Semester 8
  { code: 'IT-406', name: 'Cloud Infrastructure', department: 'Information Technology', program: 'BSIT', semester: 8, credits: 3, feePerCredit: 6000 },
  { code: 'IT-407', name: 'Digital Transformation', department: 'Information Technology', program: 'BSIT', semester: 8, credits: 3, feePerCredit: 6000 },
  { code: 'IT-408', name: 'IT Governance', department: 'Information Technology', program: 'BSIT', semester: 8, credits: 3, feePerCredit: 6000 },
  { code: 'IT-409', name: 'Professional Practices', department: 'Information Technology', program: 'BSIT', semester: 8, credits: 2, feePerCredit: 5000 },
  { code: 'IT-410', name: 'Final Year Project II', department: 'Information Technology', program: 'BSIT', semester: 8, credits: 3, feePerCredit: 6000 },

  // 4. Electrical Engineering — BSEE
  // Semester 1
  { code: 'EE-101', name: 'Engineering Mathematics I', department: 'Electrical Engineering', program: 'BSEE', semester: 1, credits: 3, feePerCredit: 4500 },
  { code: 'EE-102', name: 'Basic Electrical Engineering', department: 'Electrical Engineering', program: 'BSEE', semester: 1, credits: 3, feePerCredit: 5500 },
  { code: 'EE-103', name: 'Engineering Drawing', department: 'Electrical Engineering', program: 'BSEE', semester: 1, credits: 3, feePerCredit: 4500 },
  { code: 'EE-104', name: 'Physics', department: 'Electrical Engineering', program: 'BSEE', semester: 1, credits: 3, feePerCredit: 4500 },
  { code: 'EE-105', name: 'English', department: 'Electrical Engineering', program: 'BSEE', semester: 1, credits: 3, feePerCredit: 3000 },
  // Semester 2
  { code: 'EE-106', name: 'Engineering Mathematics II', department: 'Electrical Engineering', program: 'BSEE', semester: 2, credits: 3, feePerCredit: 4500 },
  { code: 'EE-107', name: 'Circuit Analysis I', department: 'Electrical Engineering', program: 'BSEE', semester: 2, credits: 3, feePerCredit: 5500 },
  { code: 'EE-108', name: 'Digital Logic Design', department: 'Electrical Engineering', program: 'BSEE', semester: 2, credits: 3, feePerCredit: 5500 },
  { code: 'EE-109', name: 'Engineering Mechanics', department: 'Electrical Engineering', program: 'BSEE', semester: 2, credits: 3, feePerCredit: 4500 },
  { code: 'EE-110', name: 'Islamic Studies', department: 'Electrical Engineering', program: 'BSEE', semester: 2, credits: 2, feePerCredit: 3000 },
  // Semester 3
  { code: 'EE-201', name: 'Circuit Analysis II', department: 'Electrical Engineering', program: 'BSEE', semester: 3, credits: 3, feePerCredit: 5500 },
  { code: 'EE-202', name: 'Electronic Devices', department: 'Electrical Engineering', program: 'BSEE', semester: 3, credits: 3, feePerCredit: 5500 },
  { code: 'EE-203', name: 'Signals & Systems', department: 'Electrical Engineering', program: 'BSEE', semester: 3, credits: 3, feePerCredit: 5500 },
  { code: 'EE-204', name: 'Engineering Mathematics III', department: 'Electrical Engineering', program: 'BSEE', semester: 3, credits: 3, feePerCredit: 4500 },
  { code: 'EE-205', name: 'Electromagnetic Fields', department: 'Electrical Engineering', program: 'BSEE', semester: 3, credits: 3, feePerCredit: 5500 },
  // Semester 4
  { code: 'EE-206', name: 'Electronic Circuits', department: 'Electrical Engineering', program: 'BSEE', semester: 4, credits: 3, feePerCredit: 5500 },
  { code: 'EE-207', name: 'Electrical Machines I', department: 'Electrical Engineering', program: 'BSEE', semester: 4, credits: 3, feePerCredit: 5500 },
  { code: 'EE-208', name: 'Microprocessors', department: 'Electrical Engineering', program: 'BSEE', semester: 4, credits: 3, feePerCredit: 5500 },
  { code: 'EE-209', name: 'Control Systems', department: 'Electrical Engineering', program: 'BSEE', semester: 4, credits: 3, feePerCredit: 5500 },
  { code: 'EE-210', name: 'Probability & Statistics', department: 'Electrical Engineering', program: 'BSEE', semester: 4, credits: 3, feePerCredit: 4500 },
  // Semester 5
  { code: 'EE-301', name: 'Electrical Machines II', department: 'Electrical Engineering', program: 'BSEE', semester: 5, credits: 3, feePerCredit: 6000 },
  { code: 'EE-302', name: 'Power Systems I', department: 'Electrical Engineering', program: 'BSEE', semester: 5, credits: 3, feePerCredit: 6000 },
  { code: 'EE-303', name: 'Digital Signal Processing', department: 'Electrical Engineering', program: 'BSEE', semester: 5, credits: 3, feePerCredit: 6000 },
  { code: 'EE-304', name: 'Instrumentation', department: 'Electrical Engineering', program: 'BSEE', semester: 5, credits: 3, feePerCredit: 6000 },
  { code: 'EE-305', name: 'Power Electronics', department: 'Electrical Engineering', program: 'BSEE', semester: 5, credits: 3, feePerCredit: 6000 },
  // Semester 6
  { code: 'EE-306', name: 'Power Systems II', department: 'Electrical Engineering', program: 'BSEE', semester: 6, credits: 3, feePerCredit: 6000 },
  { code: 'EE-307', name: 'Control Systems II', department: 'Electrical Engineering', program: 'BSEE', semester: 6, credits: 3, feePerCredit: 6000 },
  { code: 'EE-308', name: 'Communication Systems', department: 'Electrical Engineering', program: 'BSEE', semester: 6, credits: 3, feePerCredit: 6000 },
  { code: 'EE-309', name: 'Embedded Systems', department: 'Electrical Engineering', program: 'BSEE', semester: 6, credits: 3, feePerCredit: 6000 },
  { code: 'EE-310', name: 'Renewable Energy Systems', department: 'Electrical Engineering', program: 'BSEE', semester: 6, credits: 3, feePerCredit: 6000 },
  // Semester 7
  { code: 'EE-401', name: 'High Voltage Engineering', department: 'Electrical Engineering', program: 'BSEE', semester: 7, credits: 3, feePerCredit: 6500 },
  { code: 'EE-402', name: 'Smart Grid Technology', department: 'Electrical Engineering', program: 'BSEE', semester: 7, credits: 3, feePerCredit: 6500 },
  { code: 'EE-403', name: 'Industrial Electronics', department: 'Electrical Engineering', program: 'BSEE', semester: 7, credits: 3, feePerCredit: 6500 },
  { code: 'EE-404', name: 'Electrical Power Protection', department: 'Electrical Engineering', program: 'BSEE', semester: 7, credits: 3, feePerCredit: 6500 },
  { code: 'EE-405', name: 'Final Year Project I', department: 'Electrical Engineering', program: 'BSEE', semester: 7, credits: 3, feePerCredit: 6500 },
  // Semester 8
  { code: 'EE-406', name: 'Power System Analysis', department: 'Electrical Engineering', program: 'BSEE', semester: 8, credits: 3, feePerCredit: 6500 },
  { code: 'EE-407', name: 'Advanced Control Systems', department: 'Electrical Engineering', program: 'BSEE', semester: 8, credits: 3, feePerCredit: 6500 },
  { code: 'EE-408', name: 'Energy Management', department: 'Electrical Engineering', program: 'BSEE', semester: 8, credits: 3, feePerCredit: 6500 },
  { code: 'EE-409', name: 'Professional Engineering', department: 'Electrical Engineering', program: 'BSEE', semester: 8, credits: 2, feePerCredit: 5000 },
  { code: 'EE-410', name: 'Final Year Project II', department: 'Electrical Engineering', program: 'BSEE', semester: 8, credits: 3, feePerCredit: 6500 },

  // 5. Business Administration — BBA
  // Semester 1
  { code: 'BBA-101', name: 'Principles of Management', department: 'Business Administration', program: 'BBA', semester: 1, credits: 3, feePerCredit: 4500 },
  { code: 'BBA-102', name: 'Financial Accounting', department: 'Business Administration', program: 'BBA', semester: 1, credits: 3, feePerCredit: 4500 },
  { code: 'BBA-103', name: 'Business Mathematics', department: 'Business Administration', program: 'BBA', semester: 1, credits: 3, feePerCredit: 4000 },
  { code: 'BBA-104', name: 'English Composition', department: 'Business Administration', program: 'BBA', semester: 1, credits: 3, feePerCredit: 3000 },
  { code: 'BBA-105', name: 'Islamic Studies', department: 'Business Administration', program: 'BBA', semester: 1, credits: 2, feePerCredit: 3000 },
  // Semester 2
  { code: 'BBA-106', name: 'Marketing Fundamentals', department: 'Business Administration', program: 'BBA', semester: 2, credits: 3, feePerCredit: 4500 },
  { code: 'BBA-107', name: 'Microeconomics', department: 'Business Administration', program: 'BBA', semester: 2, credits: 3, feePerCredit: 4000 },
  { code: 'BBA-108', name: 'Business Statistics', department: 'Business Administration', program: 'BBA', semester: 2, credits: 3, feePerCredit: 4000 },
  { code: 'BBA-109', name: 'Business Communication', department: 'Business Administration', program: 'BBA', semester: 2, credits: 3, feePerCredit: 3000 },
  { code: 'BBA-110', name: 'Pakistan Studies', department: 'Business Administration', program: 'BBA', semester: 2, credits: 2, feePerCredit: 3000 },
  // Semester 3
  { code: 'BBA-201', name: 'Human Resource Management', department: 'Business Administration', program: 'BBA', semester: 3, credits: 3, feePerCredit: 4500 },
  { code: 'BBA-202', name: 'Macroeconomics', department: 'Business Administration', program: 'BBA', semester: 3, credits: 3, feePerCredit: 4000 },
  { code: 'BBA-203', name: 'Cost Accounting', department: 'Business Administration', program: 'BBA', semester: 3, credits: 3, feePerCredit: 4500 },
  { code: 'BBA-204', name: 'Organizational Behavior', department: 'Business Administration', program: 'BBA', semester: 3, credits: 3, feePerCredit: 4500 },
  { code: 'BBA-205', name: 'Business Law', department: 'Business Administration', program: 'BBA', semester: 3, credits: 3, feePerCredit: 4000 },
  // Semester 4
  { code: 'BBA-206', name: 'Financial Management', department: 'Business Administration', program: 'BBA', semester: 4, credits: 3, feePerCredit: 4500 },
  { code: 'BBA-207', name: 'Consumer Behavior', department: 'Business Administration', program: 'BBA', semester: 4, credits: 3, feePerCredit: 4500 },
  { code: 'BBA-208', name: 'Operations Management', department: 'Business Administration', program: 'BBA', semester: 4, credits: 3, feePerCredit: 4500 },
  { code: 'BBA-209', name: 'Management Information Systems', department: 'Business Administration', program: 'BBA', semester: 4, credits: 3, feePerCredit: 4500 },
  { code: 'BBA-210', name: 'Entrepreneurship', department: 'Business Administration', program: 'BBA', semester: 4, credits: 3, feePerCredit: 4500 },
  // Semester 5
  { code: 'BBA-301', name: 'Strategic Management', department: 'Business Administration', program: 'BBA', semester: 5, credits: 3, feePerCredit: 5000 },
  { code: 'BBA-302', name: 'Marketing Management', department: 'Business Administration', program: 'BBA', semester: 5, credits: 3, feePerCredit: 5000 },
  { code: 'BBA-303', name: 'Financial Analysis', department: 'Business Administration', program: 'BBA', semester: 5, credits: 3, feePerCredit: 5000 },
  { code: 'BBA-304', name: 'Human Resource Development', department: 'Business Administration', program: 'BBA', semester: 5, credits: 3, feePerCredit: 5000 },
  { code: 'BBA-305', name: 'Supply Chain Management', department: 'Business Administration', program: 'BBA', semester: 5, credits: 3, feePerCredit: 5000 },
  // Semester 6
  { code: 'BBA-306', name: 'International Business', department: 'Business Administration', program: 'BBA', semester: 6, credits: 3, feePerCredit: 5000 },
  { code: 'BBA-307', name: 'Corporate Finance', department: 'Business Administration', program: 'BBA', semester: 6, credits: 3, feePerCredit: 5000 },
  { code: 'BBA-308', name: 'Digital Marketing', department: 'Business Administration', program: 'BBA', semester: 6, credits: 3, feePerCredit: 5000 },
  { code: 'BBA-309', name: 'Business Analytics', department: 'Business Administration', program: 'BBA', semester: 6, credits: 3, feePerCredit: 5000 },
  { code: 'BBA-310', name: 'Project Management', department: 'Business Administration', program: 'BBA', semester: 6, credits: 3, feePerCredit: 5000 },
  // Semester 7
  { code: 'BBA-401', name: 'Strategic Marketing', department: 'Business Administration', program: 'BBA', semester: 7, credits: 3, feePerCredit: 5500 },
  { code: 'BBA-402', name: 'Investment Management', department: 'Business Administration', program: 'BBA', semester: 7, credits: 3, feePerCredit: 5500 },
  { code: 'BBA-403', name: 'Leadership & Management', department: 'Business Administration', program: 'BBA', semester: 7, credits: 3, feePerCredit: 5500 },
  { code: 'BBA-404', name: 'E-Commerce Management', department: 'Business Administration', program: 'BBA', semester: 7, credits: 3, feePerCredit: 5500 },
  { code: 'BBA-405', name: 'Final Year Project I', department: 'Business Administration', program: 'BBA', semester: 7, credits: 3, feePerCredit: 5500 },
  // Semester 8
  { code: 'BBA-406', name: 'Strategic Human Resource Management', department: 'Business Administration', program: 'BBA', semester: 8, credits: 3, feePerCredit: 5500 },
  { code: 'BBA-407', name: 'Business Intelligence', department: 'Business Administration', program: 'BBA', semester: 8, credits: 3, feePerCredit: 5500 },
  { code: 'BBA-408', name: 'International Marketing', department: 'Business Administration', program: 'BBA', semester: 8, credits: 3, feePerCredit: 5500 },
  { code: 'BBA-409', name: 'Professional Development', department: 'Business Administration', program: 'BBA', semester: 8, credits: 2, feePerCredit: 4500 },
  { code: 'BBA-410', name: 'Final Year Project II', department: 'Business Administration', program: 'BBA', semester: 8, credits: 3, feePerCredit: 5500 },
];

// Add status and other fields
const coursesWithStatus = courseData.map(course => ({
  ...course,
  status: 'Active',
  isActive: true,
  capacity: 30,
  enrolledStudents: 0,
  semesterType: 'Fall',
  year: new Date().getFullYear(),
  description: `${course.name} - ${course.code}`,
  departmentName: course.department
}));

export async function seedCourses() {
  try {
    const existingCourseCount = await Course.countDocuments();
    if (existingCourseCount > 0) {
      console.log(`✅ Courses already exist (${existingCourseCount}); skipping course seed`);
      return;
    }

    // Create departments if they don't exist
    const departments = [...new Set(courseData.map(c => c.department))];
    for (const deptName of departments) {
      const existingDept = await Department.findOne({ name: deptName });
      if (!existingDept) {
        await Department.create({ 
          name: deptName, 
          code: deptName.substring(0, 3).toUpperCase(),
          isActive: true 
        });
      }
    }

    // Prepare courses with unique courseId and totalFee (insertMany bypasses pre-save hooks)
    let startIndex = 1;
    const lastCourse = await Course.findOne().sort({ courseId: -1 });
    if (lastCourse && lastCourse.courseId) {
      const m = lastCourse.courseId.match(/CRS-(\d+)/);
      if (m) startIndex = parseInt(m[1], 10) + 1;
    }

    const preparedCourses = coursesWithStatus.map((c, i) => ({
      ...c,
      courseId: `CRS-${String(startIndex + i).padStart(4, '0')}`,
      totalFee: (c.credits || 0) * (c.feePerCredit || 0),
      lastUpdatedAt: new Date()
    }));

    // Insert using unordered mode so valid docs are saved even if some fail
    let insertedDocs = [];
    try {
      insertedDocs = await Course.insertMany(preparedCourses, { ordered: false });
    } catch (insertErr) {
      const insertedCount = insertErr.result?.insertedCount || (insertErr.insertedDocs && insertErr.insertedDocs.length) || (insertedDocs && insertedDocs.length) || 0;
      console.warn('⚠️ Partial insert during seeding courses:', insertErr.message || insertErr);
     // If some docs were inserted, try to use them for the summary
      if (insertErr.insertedDocs && insertErr.insertedDocs.length) {
        insertedDocs = insertErr.insertedDocs;
      }
    }

    // Display summary
    const summary = await Course.aggregate([
      {
        $group: {
          _id: { program: '$program', semester: '$semester' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.program': 1, '_id.semester': 1 } }
    ]);

 let currentProgram = '';
    summary.forEach(item => {
      if (currentProgram !== item._id.program) {
        currentProgram = item._id.program;
      }
    });

    const totalCount = await Course.countDocuments();

  } catch (error) {
    console.error('❌ Error seeding courses:', error);
    throw error;
  }
}