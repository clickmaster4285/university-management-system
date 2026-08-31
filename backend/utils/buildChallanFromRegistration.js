export function buildChallanFromRegistration(registration, student, options = {}) {
  const snapshot = registration.semesterFeeSnapshot;
  const dueDate =
    options.dueDate ||
    new Date(Date.now() + (options.dueDays ?? 30) * 24 * 60 * 60 * 1000);

  const courseFees = {};
  (snapshot.subjectLines || []).forEach((line) => {
    const key = line.code || String(line.subjectId);
    courseFees[key] = line.lineTotal || 0;
  });

  const additionalFees = {};
  (snapshot.additionalFees || []).forEach((fee) => {
    additionalFees[fee.name] = fee.amount || 0;
  });

  const programLabel =
    typeof registration.programId === 'object'
      ? registration.programId.code || registration.programId.name
      : student.program;

  return {
    studentId: String(student._id),
    studentName: student.name,
    studentEmail: student.email,
    studentRegistrationNo: registration.registrationId || '',
    department: student.department,
    program: programLabel || student.program,
    semester: registration.programSemester,
    studentCategory: registration.studentCategory || snapshot.studentCategory || 'Regular',
    feeType: 'Tuition',
    amount: snapshot.netPayable || 0,
    paidAmount: 0,
    remainingAmount: snapshot.netPayable || 0,
    dueDate,
    paymentStatus: 'Pending',
    discountApplied: snapshot.discountAmount || 0,
    feeBreakdown: {
      courseFees,
      additionalFees,
      discountApplied: snapshot.discountAmount || 0,
      lateFeeApplied: 0,
    },
    semesterRegistrationId: registration._id,
    registrationId: registration.registrationId,
    source: 'semester_package',
    challanSnapshot: {
      registrationId: registration.registrationId,
      scheduleCode: snapshot.scheduleCode,
      totalSubjectFee: snapshot.totalSubjectFee,
      totalAdditionalFee: snapshot.totalAdditionalFee,
      grossTotal: snapshot.grossTotal,
      discountAmount: snapshot.discountAmount,
      netPayable: snapshot.netPayable,
      lockedAt: snapshot.lockedAt,
      subjectLines: snapshot.subjectLines,
      additionalFees: snapshot.additionalFees,
    },
    description: `Semester ${registration.programSemester} package — ${registration.registrationId}`,
    notes: options.notes || '',
    invoiceGenerated: true,
    invoiceGeneratedDate: new Date(),
  };
}

export function syncRegistrationStatusFromPayment(registration, fee) {
  if (fee.paymentStatus === 'Paid') {
    registration.status = 'Paid';
  } else if (fee.paymentStatus === 'Partial') {
    registration.status = 'Partial';
  } else if (registration.status !== 'Dropped') {
    registration.status = 'Registered';
  }
}
