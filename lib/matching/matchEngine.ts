import { normalizeString, normalizeArrayStrings, toNumeric } from './normalize';

export type JobRow = {
  role?: string; // jobs.role
  related_roles?: string[] | string | null; // jobs.related_roles
  ai_enhanced_roles?: string[] | string | null; // jobs.ai_enhanced_roles
  skills_required?: string[] | string | null; // jobs.skills_required
  ai_enhanced_skills?: string[] | string | null; // jobs.ai_enhanced_skills
  location?: { city?: string | null; state?: string | null; country?: string | null; remote?: boolean } | string | null; // jobs.location
  experience_level?: string | null; // jobs.experience_level
  salary_range?: { min?: number; max?: number; period?: string | null; currency?: string | null } | null; // jobs.salary_range
  employment_type?: string | null; // jobs.employment_type
  sector?: string | null; // jobs.sector
};

export type UserOnboardingData = {
  target_roles?: string[] | null; // from onboarding_data.target_roles
  cv_skills?: string[] | null; // from onboarding_data.cv_skills
  preferred_locations?: string[] | null; // from onboarding_data.preferred_locations
  experience_level?: string | null; // from onboarding_data.experience_level
  salary_min?: number | string | null; // from onboarding_data.salary_min
  salary_max?: number | string | null; // from onboarding_data.salary_max
  job_type?: string | null; // from onboarding_data.job_type
  sector?: string | null; // from onboarding_data.sector
};

export type MatchBreakdown = {
  rolesScore: number;
  rolesReason: string;
  skillsScore: number;
  skillsReason: string;
  sectorScore: number;
  sectorReason: string;
  locationScore: number;
  experienceScore: number;
  salaryScore: number;
  typeScore: number;
};

export type MatchResult = {
  score: number;
  breakdown: MatchBreakdown;
  computedAt: string;
};

export function scoreJob(job: JobRow, userData: UserOnboardingData): MatchResult {
  // Extract user preferences from onboarding_data table
  const targetRoles = normalizeArrayStrings(userData.target_roles || []);
  const cvSkills = normalizeArrayStrings(userData.cv_skills || []);
  const preferredLocations = normalizeArrayStrings(userData.preferred_locations || []);
  const expLevel = normalizeString(userData.experience_level || '');
  const jobType = normalizeString(userData.job_type || '');
  const salaryMin = toNumeric(userData.salary_min ?? undefined);
  const salaryMax = toNumeric(userData.salary_max ?? undefined);
  const userSector = normalizeString(userData.sector || '');

  // Extract job data from jobs table
  const jobRole = normalizeString(job.role || '');
  // Split comma-separated job roles into array
  const jobRolesArray = jobRole ? jobRole.split(',').map(r => r.trim()).filter(r => r) : [];
  const relatedRoles = normalizeArrayStrings(job.related_roles as any);
  const aiRoles = normalizeArrayStrings(job.ai_enhanced_roles as any);
  const requiredSkills = normalizeArrayStrings(job.skills_required as any);
  const aiSkills = normalizeArrayStrings(job.ai_enhanced_skills as any);
  const jobCity = typeof job.location === 'string'
    ? normalizeString(job.location as string)
    : normalizeString(job.location?.city || '');

  // Extract all location fields for matching (handle object structure)
  const jobLocationFields: string[] = [];
  if (typeof job.location === 'object' && job.location) {
    // Handle job location object structure: { city, state, country, remote }
    if (job.location.city) {
      jobLocationFields.push(normalizeString(job.location.city));
    }
    if (job.location.state) {
      jobLocationFields.push(normalizeString(job.location.state));
    }
    if (job.location.country) {
      jobLocationFields.push(normalizeString(job.location.country));
    }
    if (job.location.remote) {
      jobLocationFields.push('remote');
    }
  } else if (typeof job.location === 'string') {
    // Fallback for string location data
    jobLocationFields.push(normalizeString(job.location));
  }
  const jobExp = normalizeString(job.experience_level || '');
  const jobTypeVal = normalizeString(job.employment_type || '');
  const sal = job.salary_range || undefined;
  const jobSalMin = toNumeric(sal?.min ?? undefined);
  const jobSalMax = toNumeric(sal?.max ?? undefined);
  const jobSalPeriod = normalizeString(sal?.period || '');
  const jobSalCurrency = normalizeString(sal?.currency || '');
  const jobSector = normalizeString(job.sector || '');

  // Roles scoring
  let rolesScore = 0;
  let rolesReason = 'no role match';
  if (jobRolesArray.length && jobRolesArray.some(r => targetRoles.includes(r))) {
    rolesScore = 50;
    rolesReason = 'role exact';
  } else if (relatedRoles.length && relatedRoles.some(r => targetRoles.includes(r))) {
    rolesScore = 25;
    rolesReason = 'role related';
  } else if (aiRoles.length && aiRoles.some(r => targetRoles.includes(r))) {
    rolesScore = 15;
    rolesReason = 'role ai';
  }

  // Skills scoring - Updated logic: 6 points for required skills, 3 points for AI skills, capped at 30 total
  let skillsScore = 0;
  let skillsReason = 'no skills match';
  let requiredMatches = 0;
  let aiMatches = 0;

  // First, check required skills (6 points each)
  if (requiredSkills.length > 0) {
    requiredMatches = requiredSkills.filter(reqSkill =>
      cvSkills.some(cvSkill => cvSkill.toLowerCase() === reqSkill.toLowerCase())
    ).length;
    const requiredScore = requiredMatches * 6; // 6 points per required skill match
    skillsScore += requiredScore;
  }

  // If we haven't reached the cap, check AI skills (3 points each)
  if (skillsScore < 30 && aiSkills.length > 0) {
    aiMatches = aiSkills.filter(aiSkill =>
      cvSkills.some(cvSkill => cvSkill.toLowerCase() === aiSkill.toLowerCase())
    ).length;

    // Calculate how many AI skill points we can add without exceeding 30
    const remainingCapacity = 30 - skillsScore;
    const maxAiMatches = Math.floor(remainingCapacity / 3);
    const actualAiMatches = Math.min(aiMatches, maxAiMatches);
    const aiScore = actualAiMatches * 3; // 3 points per AI skill match

    skillsScore += aiScore;
  }

  // Cap at 30 total
  skillsScore = Math.min(30, skillsScore);

  // Build reason string
  if (requiredMatches > 0 || aiMatches > 0) {
    const parts: string[] = [];
    if (requiredMatches > 0) parts.push(`${requiredMatches} required`);
    if (aiMatches > 0) parts.push(`${aiMatches} ai`);
    skillsReason = `${parts.join(' + ')} skills matched`;
  }

  // Sector scoring - check if user sector matches job sector
  let sectorScore = 0;
  let sectorReason = 'no sector match';
  if (userSector && jobSector && userSector === jobSector) {
    sectorScore = 30;
    sectorReason = 'sector match';
  }

  // Location scoring - check if any job location field matches any preferred location
  const locationScore = jobLocationFields.length > 0 && preferredLocations.length > 0 &&
    jobLocationFields.some(jobLoc => preferredLocations.some(prefLoc => prefLoc === jobLoc)) ? 10 : 0;

  // Experience scoring
  const experienceScore = jobExp && expLevel && jobExp === expLevel ? 5 : 0;

  // Salary scoring - check if job salary max >= user salary min
  let salaryScore = 0;
  if (jobSalMax !== undefined && salaryMin !== undefined) {
    // Job max salary should be >= user minimum salary expectation
    // User expects: salaryMin (e.g., 180,000)
    // Job offers: jobSalMax (e.g., 200,000)
    // Match if: jobSalMax >= salaryMin
    salaryScore = jobSalMax >= (salaryMin as number) ? 5 : 0;
  }

  // Employment type scoring
  const typeScore = (jobTypeVal === 'any' || (jobTypeVal && jobType && jobTypeVal === jobType)) ? 5 : 0;

  // Enforce Roles+Skills+Sector cap at 80
  const rsCapped = Math.min(80, rolesScore + skillsScore + sectorScore);
  const total = rsCapped + locationScore + experienceScore + salaryScore + typeScore;

  const breakdown: MatchBreakdown = {
    rolesScore,
    rolesReason,
    skillsScore,
    skillsReason,
    sectorScore,
    sectorReason,
    locationScore,
    experienceScore,
    salaryScore,
    typeScore,
  };

  return {
    score: Math.max(0, Math.min(100, total)),
    breakdown,
    computedAt: new Date().toISOString(),
  };
}













