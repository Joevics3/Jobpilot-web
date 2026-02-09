// lib/mapJobToSchema.ts
// COMPREHENSIVE NULL-SAFE Google JobPosting schema generator
// Handles ALL potential null values from database

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.jobmeter.app";

export function mapJobToSchema(job: any) {
  // -----------------------------
  // CLEAN DESCRIPTION - NULL SAFE
  // -----------------------------
  const getCleanDescription = () => {
    let desc =
      job.description_html ||
      job.description ||
      job.about_role ||
      "Job description not available";

    // Ensure desc is a string
    if (typeof desc !== 'string') {
      desc = String(desc);
    }

    // Remove application links completely
    desc = desc.replace(/<a[^>]*>.*?<\/a>/gi, "");
    desc = desc.replace(/https?:\/\/\S+/gi, "");
    desc = desc.replace(/To apply[^<]*/gi, "");

    // Fix dangling closing tags like </a>
    desc = desc.replace(/<\/a>/gi, "");

    return desc;
  };

  // -----------------------------
  // Helper: Company Name - NULL SAFE
  // -----------------------------
  const getCompanyName = () => {
    if (!job.company) return "Confidential Employer";
    if (typeof job.company === "string") return job.company;
    if (job.company.name) return job.company.name;
    return "Confidential Employer";
  };

  // -----------------------------
  // Helper: Job Title - NULL SAFE
  // -----------------------------
  const getJobTitle = () => {
    const baseTitle = job.title || job.role || "Untitled Job";
    const companyName = getCompanyName();

    // If company is "Confidential Employer", append location to title
    if (companyName === "Confidential Employer") {
      const location = getLocationString();
      if (location) {
        return `${baseTitle} in ${location}`;
      }
    }

    // Otherwise, return title as-is
    return baseTitle;
  };

  // -----------------------------
  // Helper: Get Location String - NULL SAFE
  // -----------------------------
  const getLocationString = () => {
    // NULL SAFETY: Check if location exists
    if (!job.location) return null;
    
    // Priority: State > City > Country
    if (job.location.state) {
      return job.location.state;
    }
    if (job.location.city) {
      return job.location.city;
    }
    if (job.location.country && job.location.country !== "NG") {
      return job.location.country;
    }
    // If remote, return "Remote"
    if (job.location.remote) {
      return "Remote";
    }
    return null;
  };

  // -----------------------------
  // Helper: Employment Type - NULL SAFE
  // -----------------------------
  const getEmploymentType = () => {
    // NULL SAFETY: Handle null/undefined employment_type
    const t = (job.employment_type || job.job_type || "").toLowerCase();

    const map: Record<string, string> = {
      "full-time": "FULL_TIME",
      "full time": "FULL_TIME",
      fulltime: "FULL_TIME",
      "part-time": "PART_TIME",
      "part time": "PART_TIME",
      parttime: "PART_TIME",
      contract: "CONTRACTOR",
      freelance: "CONTRACTOR",
      temporary: "TEMPORARY",
      internship: "INTERN",
      intern: "INTERN",
      volunteer: "VOLUNTEER",
    };

    return [map[t] || "FULL_TIME"];
  };

  // -----------------------------
  // Experience → Months - NULL SAFE
  // -----------------------------
  const getExperienceMonths = (level = "") => {
    // NULL SAFETY: Handle null/undefined level
    const l = (level || "").toLowerCase();

    const map: Record<string, number> = {
      "entry-level": 0,
      "entry level": 0,
      entry: 0,
      junior: 12,
      "mid-level": 36,
      "mid level": 36,
      mid: 36,
      senior: 60,
      lead: 84,
      executive: 120,
      manager: 72,
    };

    return map[l] || 36;
  };

  // -----------------------------
  // Job Location - NULL SAFE
  // -----------------------------
  const getJobLocation = () => {
    // NULL SAFETY: Check if location exists
    if (!job.location || job.location.remote) return undefined;

    return {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        streetAddress:
          job.location.streetAddress || job.location.street_address || "",
        addressLocality: job.location.city || "Not specified",
        addressRegion:
          job.location.state || job.location.city || "Not specified",
        postalCode:
          job.location.postalCode || job.location.postal_code || "",
        addressCountry: job.location.country || "NG",
      },
    };
  };

  // -----------------------------
  // validThrough - NULL SAFE
  // -----------------------------
  const getValidThrough = () => {
    if (job.deadline) return job.deadline;

    const base = new Date(job.posted_date || job.created_at || Date.now());
    base.setDate(base.getDate() + 30);

    return base.toISOString().split("T")[0];
  };

  // -----------------------------
  // Base Salary - NULL SAFE
  // -----------------------------
  const getBaseSalary = () => {
    if (!job.salary_range) {
      return {
        "@type": "MonetaryAmount",
        currency: "NGN",
        value: {
          "@type": "QuantitativeValue",
          value: 0,
          unitText: "MONTH",
        },
      };
    }

    const { min, max, currency = "NGN", period = "MONTH" } =
      job.salary_range || {};

    // NULL SAFETY: Handle null period
    const normalizedPeriod = period ? period.toUpperCase() : "MONTH";

    return {
      "@type": "MonetaryAmount",
      currency,
      value: {
        "@type": "QuantitativeValue",
        minValue: min || undefined,
        maxValue: max || undefined,
        value: min || max || undefined,
        unitText: normalizedPeriod,
      },
    };
  };

  // -----------------------------
  // Skills Array - NULL SAFE
  // -----------------------------
  const getSkills = () => {
    const skills = job.skills_required || job.ai_enhanced_skills || [];
    // NULL SAFETY: Ensure it's an array and has items
    if (!Array.isArray(skills) || skills.length === 0) return undefined;
    // NULL SAFETY: Filter out null/undefined items
    const validSkills = skills.filter(Boolean);
    return validSkills.length > 0 ? validSkills.join(", ") : undefined;
  };

  // -----------------------------
  // Responsibilities Array - NULL SAFE
  // -----------------------------
  const getResponsibilities = () => {
    const responsibilities = job.responsibilities || [];
    // NULL SAFETY: Ensure it's an array and has items
    if (!Array.isArray(responsibilities) || responsibilities.length === 0) return undefined;
    // NULL SAFETY: Filter out null/undefined items
    const validResponsibilities = responsibilities.filter(Boolean);
    return validResponsibilities.length > 0 ? validResponsibilities.join("; ") : undefined;
  };

  // -----------------------------
  // Qualifications Array - NULL SAFE
  // -----------------------------
  const getQualifications = () => {
    const qualifications = job.qualifications || [];
    // NULL SAFETY: Ensure it's an array and has items
    if (!Array.isArray(qualifications) || qualifications.length === 0) return undefined;
    // NULL SAFETY: Filter out null/undefined items
    const validQualifications = qualifications.filter(Boolean);
    return validQualifications.length > 0 ? validQualifications.join("; ") : undefined;
  };

  // -----------------------------
  // Benefits Array - NULL SAFE
  // -----------------------------
  const getBenefits = () => {
    const benefits = job.benefits || [];
    // NULL SAFETY: Ensure it's an array and has items
    if (!Array.isArray(benefits) || benefits.length === 0) return undefined;
    // NULL SAFETY: Filter out null/undefined items
    const validBenefits = benefits.filter(Boolean);
    return validBenefits.length > 0 ? validBenefits.join(", ") : undefined;
  };

  // -----------------------------
  // Application URL - NULL SAFE
  // -----------------------------
  const getApplicationUrl = () => {
    if (job.application?.url) return job.application.url;
    if (job.application_url) return job.application_url;
    return undefined;
  };

  // -----------------------------
  // Work Hours - NULL SAFE
  // -----------------------------
  const getWorkHours = () => {
    const empType = (job.employment_type || "").toLowerCase();
    if (empType === "full-time" || empType === "full time" || empType === "fulltime") {
      return "40 hours per week";
    }
    return undefined;
  };

  // -----------------------------
  // Industry - NULL SAFE
  // -----------------------------
  const getIndustry = () => {
    return job.company?.industry || job.sector || job.category || undefined;
  };

  // -----------------------------
  // FINAL SCHEMA
  // -----------------------------
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "JobPosting",

    // NULL SAFE: Title
    title: getJobTitle(),

    // NULL SAFE: Description
    description: getCleanDescription(),

    // NULL SAFE: Date Posted
    datePosted:
      job.created_at ||
      job.posted_date ||
      new Date().toISOString().split("T")[0],

    // NULL SAFE: Valid Through
    validThrough: getValidThrough(),

    // NULL SAFE: Employment Type
    employmentType: getEmploymentType(),

    // NULL SAFE: Hiring Organization
    hiringOrganization: {
      "@type": "Organization",
      name: getCompanyName(),
      industry: getIndustry(),
    },

    // NULL SAFE: Employment Unit
    employmentUnit: {
      "@type": "Organization",
      name: getCompanyName(),
    },

    // NULL SAFE: Job Location
    jobLocation: getJobLocation(),

    // NULL SAFE: Job Location Type
    jobLocationType: job.location?.remote ? "TELECOMMUTE" : undefined,

    // NULL SAFE: Applicant Location Requirements
    applicantLocationRequirements: {
      "@type": "Country",
      name: job.location?.country || "Nigeria",
    },

    // NULL SAFE: Base Salary
    baseSalary: getBaseSalary(),

    // NULL SAFE: Experience Requirements
    experienceRequirements: job.experience_level
      ? {
          "@type": "OccupationalExperienceRequirements",
          monthsOfExperience: getExperienceMonths(job.experience_level),
        }
      : undefined,

    // NULL SAFE: Responsibilities
    responsibilities: getResponsibilities(),

    // NULL SAFE: Qualifications
    qualifications: getQualifications(),

    // NULL SAFE: Skills
    skills: getSkills(),

    // NULL SAFE: Job Benefits
    jobBenefits: getBenefits(),

    // NULL SAFE: Identifier
    identifier: {
      "@type": "PropertyValue",
      name: getCompanyName(),
      value: job.id || "unknown",
    },

    // NULL SAFE: Work Hours
    workHours: getWorkHours(),

    // NULL SAFE: Application Contact
    applicationContact: getApplicationUrl()
      ? {
          "@type": "ContactPoint",
          url: getApplicationUrl(),
        }
      : undefined,

    // Direct Apply
    directApply: true,
    
    // NULL SAFE: URL with fallback
    url: `${siteUrl}/jobs/${job.slug || job.id}`,
  };

  // Remove undefined values to keep schema clean
  Object.keys(schema).forEach((k) => {
    if (schema[k] === undefined) {
      delete schema[k];
    }
  });

  return schema;
}
