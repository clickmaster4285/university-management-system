import { Fee, Program, University, Campus } from '../models/index.js';

const notDeleted = { $ne: true };

export function getAdmissionBankDetails() {
  return {
    bankName: process.env.ADMISSION_FEE_BANK_NAME || 'HBL',
    accountTitle:
      process.env.ADMISSION_FEE_ACCOUNT_TITLE || 'University Admissions Account',
    accountNumber: process.env.ADMISSION_FEE_ACCOUNT_NUMBER || 'XXXX-XXXX-XXXX-XXXX',
    branch: process.env.ADMISSION_FEE_BANK_BRANCH || 'Main Campus Branch',
  };
}

/**
 * Printable admission challan payload (student / bank / university copies).
 */
export async function buildAdmissionChallanPrintView(fee, application, options = {}) {
  if (!fee || !application) return null;

  const [university, campus, program] = await Promise.all([
    options.university ||
      University.findOne({ isDeleted: notDeleted, status: 'Active' }).select(
        'universityName shortName universityCode officialEmail phoneNumber address website'
      ),
    options.campus ||
      (application.campusId
        ? Campus.findById(
            typeof application.campusId === 'object'
              ? application.campusId._id
              : application.campusId
          ).select('name campusCode address')
        : null),
    options.program ||
      (application.programId && typeof application.programId === 'object'
        ? application.programId
        : Program.findById(application.programId).select('name code degreeLevel')),
  ]);

  const bank = {
    ...getAdmissionBankDetails(),
    ...(fee.challanSnapshot?.bank || {}),
  };

  const amount = Number(fee.amount) || 0;
  const programName =
    program && typeof program === 'object' ? program.name || program.code : fee.program;
  const programCode =
    program && typeof program === 'object' ? program.code || '' : fee.program || '';

  return {
    feeId: fee.feeId,
    feeType: 'Admission Fee',
    source: 'admission',
    amount,
    amountInWords: amountInWordsPkr(amount),
    paidAmount: fee.paidAmount || 0,
    remainingAmount: fee.remainingAmount ?? amount,
    paymentStatus: fee.paymentStatus || 'Pending',
    proofStatus: fee.proofStatus || 'None',
    dueDate: fee.dueDate || null,
    issuedAt: fee.invoiceGeneratedDate || fee.createdAt || new Date(),
    description: fee.description || '',
    university: university
      ? {
          name: university.universityName,
          shortName: university.shortName,
          code: university.universityCode,
          email: university.officialEmail,
          phone: university.phoneNumber,
          website: university.website || '',
          city: university.address?.city || '',
          address: [
            university.address?.street,
            university.address?.city,
            university.address?.province,
            university.address?.country,
          ]
            .filter(Boolean)
            .join(', '),
        }
      : {
          name: 'University',
          shortName: '',
          code: '',
          email: '',
          phone: '',
          website: '',
          city: '',
          address: '',
        },
    applicant: {
      applicationId: application.applicationId,
      fullName: `${application.firstName || ''} ${application.lastName || ''}`.trim(),
      firstName: application.firstName,
      lastName: application.lastName,
      fatherName: application.guardian?.fatherName || '',
      cnic: application.cnic,
      email: application.email,
      phone: application.phone,
    },
    program: {
      name: programName,
      code: programCode,
      degreeLevel: program?.degreeLevel || '',
    },
    campus: campus
      ? {
          name: campus.name,
          code: campus.campusCode || '',
          city: campus.address?.city || '',
        }
      : { name: '', code: '', city: '' },
    department: fee.department || '',
    bank,
    lineItems: [
      {
        label: 'Admission / seat confirmation fee',
        amount,
      },
    ],
    copies: ['Student Copy', 'Bank Copy', 'University Copy'],
    instructions: [
      'Deposit the exact amount in the bank account listed on this challan.',
      'Keep the Student Copy and Bank Copy stamped by the bank.',
      'Upload a clear photo/PDF of the paid challan (or transfer receipt) on the application track page.',
      'Admission office verifies payment before enrollment is completed.',
    ],
  };
}

function amountInWordsPkr(amount) {
  const n = Math.floor(Number(amount) || 0);
  if (n <= 0) return 'Zero only';
  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];
  const twoDigits = (num) => {
    if (num < 20) return ones[num];
    return `${tens[Math.floor(num / 10)]}${num % 10 ? ` ${ones[num % 10]}` : ''}`.trim();
  };
  const threeDigits = (num) => {
    if (num < 100) return twoDigits(num);
    return `${ones[Math.floor(num / 100)]} Hundred${
      num % 100 ? ` ${twoDigits(num % 100)}` : ''
    }`.trim();
  };

  let remaining = n;
  const crore = Math.floor(remaining / 10000000);
  remaining %= 10000000;
  const lakh = Math.floor(remaining / 100000);
  remaining %= 100000;
  const thousand = Math.floor(remaining / 1000);
  remaining %= 1000;
  const parts = [];
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
  if (remaining) parts.push(threeDigits(remaining));
  return `${parts.join(' ')} Rupees Only`;
}

/**
 * Create or reuse an admission-fee challan for a StudentApplication.
 * Amount comes from Program.admissionFee. Skips create when amount is 0
 * (returns { skipped: true }).
 */
export async function ensureAdmissionFeeChallan(application, options = {}) {
  const existing = await Fee.findOne({
    studentApplicationId: application._id,
    source: 'admission',
    isDeleted: notDeleted,
  });
  if (existing) {
    if (options.dossierId && !existing.studentAdmissionId) {
      existing.studentAdmissionId = options.dossierId;
      await existing.save();
    }
    return { fee: existing, created: false };
  }

  const program = await Program.findById(application.programId).populate(
    'departmentId',
    'name code'
  );
  if (!program) {
    const err = new Error('Program not found for admission fee');
    err.status = 400;
    throw err;
  }

  const amount = Number(program.admissionFee) || 0;
  if (amount <= 0) {
    return { fee: null, created: false, skipped: true, reason: 'admissionFee is 0' };
  }

  const dept =
    program.departmentId && typeof program.departmentId === 'object'
      ? program.departmentId.name || program.departmentId.code
      : 'General';

  const dueDate =
    options.dueDate || new Date(Date.now() + (options.dueDays ?? 14) * 24 * 60 * 60 * 1000);

  const bank = getAdmissionBankDetails();

  const fee = await Fee.create({
    studentId: `APP:${application.applicationId}`,
    studentName: `${application.firstName} ${application.lastName}`.trim(),
    studentEmail: application.email,
    studentRegistrationNo: application.applicationId,
    department: dept || 'General',
    program: program.code || program.name,
    semester: 1,
    studentCategory: 'Regular',
    feeType: 'Other',
    amount,
    paidAmount: 0,
    remainingAmount: amount,
    dueDate,
    paymentStatus: 'Pending',
    source: 'admission',
    studentApplicationId: application._id,
    studentAdmissionId: options.dossierId || null,
    proofStatus: 'None',
    feeBreakdown: {
      courseFees: {},
      additionalFees: { 'Admission Fee': amount },
      discountApplied: 0,
      lateFeeApplied: 0,
    },
    challanSnapshot: {
      type: 'admission',
      applicationId: application.applicationId,
      programId: String(program._id),
      programCode: program.code,
      programName: program.name,
      admissionFee: amount,
      bank,
    },
    description: `Admission fee — ${program.code || program.name} (${application.applicationId})`,
    invoiceGenerated: true,
    invoiceGeneratedDate: new Date(),
  });

  return { fee, created: true };
}

export async function getAdmissionFeeForApplication(applicationId) {
  return Fee.findOne({
    studentApplicationId: applicationId,
    source: 'admission',
    isDeleted: notDeleted,
  });
}

export async function getAdmissionFeeForDossier(dossierId, applicationId = null) {
  let fee = await Fee.findOne({
    studentAdmissionId: dossierId,
    source: 'admission',
    isDeleted: notDeleted,
  });
  if (!fee && applicationId) {
    fee = await getAdmissionFeeForApplication(applicationId);
    if (fee && !fee.studentAdmissionId) {
      fee.studentAdmissionId = dossierId;
      await fee.save();
    }
  }
  return fee;
}

export function isAdmissionFeeSatisfied(fee, programAdmissionFee = null) {
  if (programAdmissionFee != null && Number(programAdmissionFee) <= 0) return true;
  if (!fee) return Number(programAdmissionFee) <= 0;
  if (['Paid', 'Waived', 'Scholarship'].includes(fee.paymentStatus)) return true;
  if (fee.proofStatus === 'Verified') return true;
  return false;
}
