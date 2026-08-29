import { ProgramCurriculum } from '../models/index.js';
import { resolveSubjectFeeAtDate } from './resolveSubjectFee.js';

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function computeScheduleTotals({
  subjectLines = [],
  additionalFees = [],
  discount = null,
}) {
  const totalSubjectFee = subjectLines.reduce((sum, line) => sum + (line.lineTotal || 0), 0);

  const totalAdditionalFee = (additionalFees || []).reduce((sum, fee) => {
    if (fee.type === 'Percentage') {
      return sum + (totalSubjectFee * (fee.percentage || 0)) / 100;
    }
    return sum + (fee.amount || 0);
  }, 0);

  const grossTotal = totalSubjectFee + totalAdditionalFee;

  let discountAmount = 0;
  if (discount?.value > 0) {
    const base = discount.applicableTo === 'Total Fee' ? grossTotal : totalSubjectFee;
    discountAmount =
      discount.type === 'Percentage'
        ? (base * discount.value) / 100
        : discount.value;
  }

  const netPayable = Math.max(0, grossTotal - discountAmount);

  return {
    totalSubjectFee,
    totalAdditionalFee,
    grossTotal,
    discountAmount,
    netPayable,
  };
}

export async function buildSubjectLinesForSemester(programId, semester, atDate = new Date()) {
  const date = startOfDay(atDate);

  const entries = await ProgramCurriculum.find({
    programId,
    semester,
    status: 'Active',
    isDeleted: { $ne: true },
  })
    .populate('subjectId', 'code name credits status')
    .sort({ order: 1 });

  const subjectLines = [];
  const warnings = [];

  for (const entry of entries) {
    const subject = entry.subjectId;
    if (!subject || subject.status === 'Inactive') continue;

    const rate = await resolveSubjectFeeAtDate(subject._id, programId, date);
    const credits = subject.credits || 0;
    const feePerCredit = rate?.feePerCredit ?? 0;

    if (!rate) {
      warnings.push({
        subjectId: subject._id,
        code: subject.code,
        message: `No fee rate configured for ${subject.code}`,
      });
    }

    subjectLines.push({
      subjectId: subject._id,
      code: subject.code,
      name: subject.name,
      credits,
      feePerCredit,
      feeType: rate?.feeType || 'Tuition',
      lineTotal: feePerCredit * credits,
      isCore: entry.type === 'Core',
      curriculumType: entry.type,
      subjectFeeHistoryId: rate?._id || null,
      missingRate: !rate,
    });
  }

  return { subjectLines, warnings };
}
