// Deterministic pseudo-random for stable SSR + client renders
let seed = 42;
function rand() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}
export function reset() { seed = 42; }
export function pick<T>(arr: T[]): T { return arr[Math.floor(rand() * arr.length)]; }
export function num(min: number, max: number) { return Math.floor(rand() * (max - min + 1)) + min; }

const firstNames = ["Aisha","Ali","Hamza","Fatima","Zainab","Ahmed","Omar","Sara","Bilal","Ayesha","Usman","Maryam","Hassan","Khadija","Ibrahim","Amna","Yusuf","Nida","Zayd","Hira","Farhan","Mahnoor","Talha","Rida","Saad","Iqra","Danish","Anum","Kashif","Sana"];
const lastNames = ["Khan","Ahmed","Ali","Malik","Sheikh","Raza","Shah","Iqbal","Hussain","Chaudhry","Butt","Siddiqui","Qureshi","Baig","Farooq","Aslam","Rehman","Javed","Nawaz","Tariq"];
const departments = ["Computer Science","Electrical Engineering","Mechanical Engineering","Civil Engineering","Business Administration","Economics","Mathematics","Physics","Chemistry","Biology","English Literature","Psychology","Law","Medicine","Pharmacy","Architecture","Design","Fine Arts","Media Studies","Data Science"];
const programs = ["BSCS","BSSE","BEE","BME","BBA","MBA","MSCS","PhD CS","BSAI","BSDS","BSEE","MSDS","BS Physics","BS Math","LLB"];
const cities = ["Islamabad","Lahore","Karachi","Peshawar","Quetta","Multan","Faisalabad","Rawalpindi","Sialkot","Hyderabad"];
const campuses = ["Main Campus - Islamabad","North Campus - Lahore","South Campus - Karachi","East Campus - Peshawar"];

export function fullName() { return `${pick(firstNames)} ${pick(lastNames)}`; }

// ================================================================
// 🚫 STUDENT AND TEACHER DATA - COMMENTED OUT
// These are now using real data from the database via API
// ================================================================

/*
export interface Student {
  id: string; name: string; program: string; department: string;
  semester: number; cgpa: number; attendance: number;
  fee: "Paid" | "Pending" | "Partial"; city: string; campus: string;
  status: "Active" | "On Leave" | "Graduated"; email: string; phone: string;
}
export interface Teacher {
  id: string; name: string; department: string; designation: string;
  experience: number; courses: number; rating: number; salary: number;
  email: string; status: "Active" | "On Leave";
}

export function generateStudents(n = 60): Student[] {
  reset();
  return Array.from({ length: n }, (_, i) => {
    const name = fullName();
    return {
      id: `STU-${(2024000 + i).toString()}`,
      name,
      program: pick(programs),
      department: pick(departments),
      semester: num(1, 8),
      cgpa: +(rand() * 1.8 + 2.2).toFixed(2),
      attendance: num(55, 99),
      fee: pick(["Paid","Paid","Paid","Pending","Partial"]) as Student["fee"],
      city: pick(cities),
      campus: pick(campuses),
      status: pick(["Active","Active","Active","Active","On Leave","Graduated"]) as Student["status"],
      email: name.toLowerCase().replace(" ", ".") + "@uni.edu.pk",
      phone: `+92 3${num(0,4)}${num(10,99)} ${num(1000000,9999999)}`,
    };
  });
}

export function generateTeachers(n = 30): Teacher[] {
  reset();
  const designations = ["Professor","Associate Professor","Assistant Professor","Lecturer","Visiting Faculty"];
  return Array.from({ length: n }, (_, i) => {
    const name = fullName();
    return {
      id: `FAC-${(1000 + i).toString()}`,
      name,
      department: pick(departments),
      designation: pick(designations),
      experience: num(1, 30),
      courses: num(1, 6),
      rating: +(rand() * 1.5 + 3.5).toFixed(1),
      salary: num(120000, 550000),
      email: name.toLowerCase().replace(" ", ".") + "@uni.edu.pk",
      status: pick(["Active","Active","Active","On Leave"]) as Teacher["status"],
    };
  });
}
*/

// ================================================================
// ✅ KEEP THESE - They are still used by the dashboard
// ================================================================

export const KPIS = {
  totalStudents: 10248, totalTeachers: 812, departments: 52, courses: 316,
  attendanceToday: 87.4, classesToday: 148, feesCollected: 48250000, pendingFees: 6820000,
  assignmentsPending: 214, onlineClasses: 26, libraryIssued: 1842, hostelStudents: 2140,
  transportStudents: 1580, activeUsers: 4392, revenue: 62500000, expenses: 41200000,
  admissionsThisMonth: 384, graduated: 1620,
};

export function admissionsTrend() {
  return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => ({
    month: m, applications: 200 + Math.round(Math.sin(i / 2) * 90 + i * 25 + Math.random() * 40),
    enrolled: 150 + Math.round(Math.sin(i / 2) * 60 + i * 18 + Math.random() * 30),
  }));
}

export function revenueSeries() {
  return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => ({
    month: m,
    revenue: 3.8 + Math.sin(i / 2) * 0.8 + i * 0.12 + Math.random() * 0.4,
    expenses: 2.6 + Math.cos(i / 2) * 0.5 + i * 0.08 + Math.random() * 0.3,
  }));
}

export function attendanceWeek() {
  return ["Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => ({
    day: d, present: 78 + Math.round(Math.random() * 18), absent: 4 + Math.round(Math.random() * 10),
  }));
}

export function departmentAnalytics() {
  return departments.slice(0, 8).map((d) => ({
    name: d.split(" ")[0], students: 400 + Math.round(Math.random() * 1200),
    teachers: 20 + Math.round(Math.random() * 60),
  }));
}

export function performanceDistribution() {
  return [
    { grade: "A", count: 1240 }, { grade: "A-", count: 1620 }, { grade: "B+", count: 2140 },
    { grade: "B", count: 1980 }, { grade: "B-", count: 1360 }, { grade: "C", count: 890 }, { grade: "F", count: 118 },
  ];
}

// ✅ Keep these exports - they are used elsewhere
export { departments, programs, campuses };