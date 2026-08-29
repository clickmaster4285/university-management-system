export function buildSemesterFeeSnapshotFromSchedule(schedule) {
  const lockedAt = new Date();
  const subjectLines = (schedule.subjectLines || []).map((line) => {
    const plain = line.toObject ? line.toObject() : { ...line };
    return {
      subjectId: plain.subjectId,
      code: plain.code,
      name: plain.name,
      credits: plain.credits,
      feePerCredit: plain.feePerCredit,
      feeType: plain.feeType,
      lineTotal: plain.lineTotal,
      isCore: plain.isCore,
      curriculumType: plain.curriculumType,
      subjectFeeHistoryId: plain.subjectFeeHistoryId,
      missingRate: plain.missingRate,
    };
  });

  const additionalFees = (schedule.additionalFees || []).map((fee) => {
    const plain = fee.toObject ? fee.toObject() : { ...fee };
    return {
      name: plain.name,
      type: plain.type,
      amount: plain.amount,
      percentage: plain.percentage,
      description: plain.description,
      isOptional: plain.isOptional,
      appliesTo: plain.appliesTo,
    };
  });

  return {
    scheduleId: schedule._id,
    scheduleCode: schedule.scheduleId,
    studentCategory: schedule.studentCategory || 'Regular',
    subjectLines,
    additionalFees,
    discount: schedule.discount || null,
    totalSubjectFee: schedule.totalSubjectFee || 0,
    totalAdditionalFee: schedule.totalAdditionalFee || 0,
    grossTotal: schedule.grossTotal || 0,
    discountAmount: schedule.discountAmount || 0,
    netPayable: schedule.netPayable || 0,
    lockedAt,
    feePolicy: 'package',
  };
}
