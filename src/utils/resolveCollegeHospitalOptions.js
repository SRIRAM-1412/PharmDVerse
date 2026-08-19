/**
 * Dynamic Hospital Options Resolver.
 * Resolves all configured, primary, and affiliated hospital names for a given college/student record.
 */
export const resolveCollegeHospitalOptions = (collegeData, studentData) => {
  const rawList = [];

  const addIfValid = (val) => {
    if (!val) return;
    const str = String(val).trim();
    if (!str || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined') return;

    // Handle comma-separated or newline-separated hospital entries
    str.split(/[,;\n]/).forEach((subStr) => {
      const clean = subStr.trim();
      if (clean && clean.toLowerCase() !== 'null' && clean.toLowerCase() !== 'undefined') {
        rawList.push(clean);
      }
    });
  };

  // 1. Check all potential hospital database fields on college object
  addIfValid(collegeData?.hospital_name);
  addIfValid(collegeData?.hospitalName);
  addIfValid(collegeData?.primary_hospital_name);
  addIfValid(collegeData?.affiliated_hospitals);
  addIfValid(collegeData?.teaching_hospital);

  // 2. Check all potential hospital database fields on student's nested college object
  addIfValid(studentData?.colleges?.hospital_name);
  addIfValid(studentData?.colleges?.hospitalName);
  addIfValid(studentData?.colleges?.primary_hospital_name);
  addIfValid(studentData?.colleges?.affiliated_hospitals);
  addIfValid(studentData?.colleges?.teaching_hospital);

  // 3. Normalize & Deduplicate case-insensitively while preserving original capitalizations
  const seen = new Set();
  const uniqueHospitals = [];

  rawList.forEach((h) => {
    const normalized = h
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/superspecialities/g, 'super specialities')
      .replace(/super specialty/g, 'super specialities')
      .replace(/superspecialty/g, 'super specialities');

    if (!seen.has(normalized)) {
      seen.add(normalized);
      uniqueHospitals.push(h.trim());
    }
  });

  // 4. Fallback if no database hospital record exists for this college
  if (uniqueHospitals.length === 0) {
    const collegeName = collegeData?.college_name || studentData?.colleges?.college_name || 'Pharmacy College';
    uniqueHospitals.push(`${collegeName} Teaching Hospital`);
    uniqueHospitals.push(`${collegeName} Associated General Hospital`);
    uniqueHospitals.push(`Government General Hospital (GGH)`);
  }

  return uniqueHospitals;
};
