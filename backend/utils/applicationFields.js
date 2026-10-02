/**
 * Shared personal/guardian/address fields for StudentApplication payloads.
 */

export function normalizeGuardian(raw = {}) {
  const g = raw && typeof raw === 'object' ? raw : {};
  return {
    fatherName: String(g.fatherName || '').trim(),
    motherName: String(g.motherName || '').trim(),
    guardianName: String(g.guardianName || '').trim(),
    guardianPhone: String(g.guardianPhone || '').trim(),
    guardianRelation: String(g.guardianRelation || '').trim(),
  };
}

export function normalizeAddress(raw = {}) {
  const a = raw && typeof raw === 'object' ? raw : {};
  return {
    street: String(a.street || '').trim(),
    city: String(a.city || '').trim(),
    state: String(a.state || '').trim(),
    postalCode: String(a.postalCode || '').trim(),
    country: String(a.country || 'Pakistan').trim() || 'Pakistan',
  };
}

export function parseApplicationExtendedFields(body = {}) {
  const dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
  const gender = ['Male', 'Female', 'Other'].includes(body.gender) ? body.gender : '';
  const nationality = String(body.nationality || 'Pakistani').trim() || 'Pakistani';
  const religion = String(body.religion || '').trim();
  const previousDegree = String(body.previousDegree || '').trim();
  const previousMarks = String(body.previousMarks || '').trim();
  const previousInstitution = String(body.previousInstitution || '').trim();

  let previousEducation = Array.isArray(body.previousEducation) ? body.previousEducation : [];
  if (!previousEducation.length && (previousDegree || previousMarks || previousInstitution)) {
    previousEducation = [
      {
        institution: previousInstitution,
        degree: previousDegree,
        grade: previousMarks,
        yearOfCompletion: body.yearOfCompletion ? Number(body.yearOfCompletion) : null,
        percentage: body.percentage != null && body.percentage !== '' ? Number(body.percentage) : null,
      },
    ];
  }

  return {
    dateOfBirth: dateOfBirth && !Number.isNaN(dateOfBirth.getTime()) ? dateOfBirth : null,
    gender,
    nationality,
    religion,
    guardian: normalizeGuardian(body.guardian),
    address: normalizeAddress(body.address),
    previousDegree,
    previousMarks,
    previousEducation,
  };
}
