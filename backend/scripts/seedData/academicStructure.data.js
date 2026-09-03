export const SEED_STRUCTURE = {
  university: {
    universityName: 'University Management Demo',
    universityCode: 'UMS',
    shortName: 'UMS',
    universityType: 'Private',
    officialEmail: 'info@ums-demo.edu.pk',
    phoneNumber: '+92-300-0000000',
    website: 'https://ums-demo.edu.pk',
    country: 'Pakistan',
    province: 'Punjab',
    city: 'Lahore',
    address: 'Main Boulevard',
  },
  campus: {
    name: 'Main Campus',
    campusCode: 'MAIN',
    type: 'Main Campus',
    isMainCampus: true,
    phone: '+92-42-0000000',
    email: 'main@ums-demo.edu.pk',
    description: 'Primary campus for academic operations',
  },
  faculties: [
    {
      code: 'FOC',
      name: 'Faculty of Computing',
      departments: [
        { code: 'CS', name: 'Computer Science', programs: ['BSCS'] },
        { code: 'SE', name: 'Software Engineering', programs: ['BSSE'] },
        { code: 'IT', name: 'Information Technology', programs: ['BSIT'] },
      ],
    },
    {
      code: 'FOE',
      name: 'Faculty of Engineering',
      departments: [
        { code: 'EE', name: 'Electrical Engineering', programs: ['BSEE'] },
      ],
    },
    {
      code: 'FOB',
      name: 'Faculty of Business',
      departments: [
        { code: 'BA', name: 'Business Administration', programs: ['BBA'] },
      ],
    },
  ],
  programMeta: {
    BSCS: {
      name: 'Bachelor of Computer Science',
      degreeLevel: 'BS',
      duration: 8,
      totalCredits: 120,
    },
    BSSE: {
      name: 'Bachelor of Software Engineering',
      degreeLevel: 'BS',
      duration: 8,
      totalCredits: 120,
    },
    BSIT: {
      name: 'Bachelor of Information Technology',
      degreeLevel: 'BS',
      duration: 8,
      totalCredits: 120,
    },
    BSEE: {
      name: 'Bachelor of Electrical Engineering',
      degreeLevel: 'BS',
      duration: 8,
      totalCredits: 120,
    },
    BBA: {
      name: 'Bachelor of Business Administration',
      degreeLevel: 'BBA',
      duration: 8,
      totalCredits: 120,
    },
  },
  feeEffectiveFrom: '2024-01-01',
  feeSeedReason: 'Academic structure seed',
};
