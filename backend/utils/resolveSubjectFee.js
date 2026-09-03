import { SubjectFeeHistory } from '../models/index.js';
import { parseLocalDate, startOfDay } from './parseLocalDate.js';

function activeAtDateFilter(atDate) {
  return {
    effectiveFrom: { $lte: atDate },
    $or: [{ effectiveTo: null }, { effectiveTo: { $gte: atDate } }],
  };
}

export async function resolveSubjectFeeAtDate(subjectId, programId, atDate = new Date()) {
  const date = atDate instanceof Date ? startOfDay(atDate) : parseLocalDate(atDate);
  const dateFilter = activeAtDateFilter(date);

  if (programId) {
    const programSpecific = await SubjectFeeHistory.findOne({
      subjectId,
      programId,
      ...dateFilter,
    }).sort({ effectiveFrom: -1 });

    if (programSpecific) return programSpecific;
  }

  return SubjectFeeHistory.findOne({
    subjectId,
    programId: null,
    ...dateFilter,
  }).sort({ effectiveFrom: -1 });
}

export async function buildEnrollmentFeeSnapshot({
  subjectId,
  programId,
  academicSessionId,
  credits,
  atDate = new Date(),
  feePolicy = 'current_rate',
}) {
  const rate = await resolveSubjectFeeAtDate(subjectId, programId, atDate);

  if (!rate) {
    return {
      error: 'No fee rate configured for this subject and program',
    };
  }

  const feePerCredit = rate.feePerCredit;
  const lockedAt = startOfDay(atDate);

  return {
    snapshot: {
      subjectFeeHistoryId: rate._id,
      feePolicy,
      credits,
      feePerCredit,
      totalFee: feePerCredit * credits,
      feeType: rate.feeType,
      academicSessionId,
      lockedAt,
    },
  };
}
