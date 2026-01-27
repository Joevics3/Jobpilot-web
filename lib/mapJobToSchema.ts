// lib/mapJobToSchema.ts
// FINAL unified, fixed, cleaned, enhanced Google JobPosting schema generator

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.jobmeter.app";

export function mapJobToSchema(job: any) {
  // -----------------------------
  // CLEAN DESCRIPTION (fixes your issue!)
  // -----------------------------
  const getCleanDescription = () => {
    let desc =
      job.description_html ||
      job.description ||
      "Job description not available";

    // Remove application links completely
    desc = desc.replace(/<a[^>]*>.*?<\/a>/gi, "");
    desc = desc.replace(/https?:\/\/\S+/gi, "");
    desc = desc.replace(/To apply[^<]*/gi, "");

    // Fix dangling closing tags like </a>
    desc = desc.replace(/<\/a>/gi, "");

    return desc;
  };

  // -----------------------------
  // Helper: Company Name
  // -----------------------------
  const getCompanyName = () => {
    // For schema, use location instead of "Confidential Employer" to avoid showing in search results
    if (!job.company) return getLocationAsCompany();
    if (typeof job.company === "string") return job.company;
    if (job.company.name) return job.company.name;
    return getLocationAsCompany();
  };

  // Helper: Get location string to use as company name when confidential
  const getLocationAsCompany = () => {
    if (job.location?.remote) return "Remote";
    if (typeof job.location === "string") return job.location;
    const parts = [job.location?.city, job.location?.state, job.location?.country].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Location";
  };

  // -----------------------------
  // Helper: Employment Type
  // -----------------------------
  const getEmploymentType = () => {
    const t = (job.employment_type || "").toLowerCase();

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
  // Experience → Months
  // -----------------------------
  const getExperienceMonths = (level = "") => {
    const l = level.toLowerCase();

    const map: Record<string, number> = {
      "entry-level": 0,
      "entry level": 0,
      junior: 12,
      "mid-level": 36,
      "mid level": 36,
      senior: 60,
      lead: 84,
      executive: 120,
    };

    return map[l] || 36;
  };

  // -----------------------------
  // Job Location
  // -----------------------------
  const getJobLocation = () => {
    if (job.location?.remote) return undefined;

    return {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        streetAddress:
          job.location?.streetAddress || job.location?.street_address || "",
        addressLocality: job.location?.city || "Not specified",
        addressRegion:
          job.location?.state || job.location?.city || "Not specified",
        postalCode:
          job.location?.postalCode || job.location?.postal_code || "",
        addressCountry: job.location?.country || "NG",
      },
    };
  };

  // -----------------------------
  // validThrough
  // -----------------------------
  const getValidThrough = () => {
    if (job.deadline) return job.deadline;

    const base = new Date(job.posted_date || job.created_at || Date.now());
    base.setDate(base.getDate() + 30);

    return base.toISOString().split("T")[0];
  };

  // -----------------------------
  // Base Salary (required)
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

    return {
      "@type": "MonetaryAmount",
      currency,
      value: {
        "@type": "QuantitativeValue",
        minValue: min || undefined,
        maxValue: max || undefined,
        value: min || max || undefined,
        unitText: period.toUpperCase(),
      },
    };
  };

  // -----------------------------
  // FINAL SCHEMA
  // -----------------------------
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "JobPosting",

    title: job.title || "Untitled Job",
    description: getCleanDescription(),

    datePosted:
      job.created_at ||
      job.posted_date ||
      new Date().toISOString().split("T")[0],

    validThrough: getValidThrough(),

    employmentType: getEmploymentType(),

    hiringOrganization: {
      "@type": "Organization",
      name: getCompanyName(),
      industry: job.company?.industry || job.sector || undefined,
    },

    employmentUnit: {
      "@type": "Organization",
      name: getCompanyName(),
    },

    jobLocation: getJobLocation(),

    jobLocationType: job.location?.remote ? "TELECOMMUTE" : undefined,

    applicantLocationRequirements: {
      "@type": "Country",
      name: job.location?.country || "Nigeria",
    },

    baseSalary: getBaseSalary(),

    experienceRequirements: job.experience_level
      ? {
          "@type": "OccupationalExperienceRequirements",
          monthsOfExperience: getExperienceMonths(job.experience_level),
        }
      : undefined,

    responsibilities:
      job.responsibilities?.join("; ") || undefined,

    qualifications:
      job.qualifications?.join("; ") || undefined,

    skills:
      job.skills_required?.join(", ") || undefined,

    jobBenefits:
      job.benefits?.join(", ") || undefined,

    identifier: {
      "@type": "PropertyValue",
      name: getCompanyName(),
      value: job.id,
    },

    workHours: job.employment_type === "Full-time" ? "40 hours per week" : undefined,

    applicationContact:
      job.application?.url || job.application_url
        ? {
            "@type": "ContactPoint",
            url: job.application?.url || job.application_url,
          }
        : undefined,

    directApply: true,
    url: `${siteUrl}/jobs/${job.slug || job.id}`,
  };

  // Remove undefined
  Object.keys(schema).forEach((k) => schema[k] === undefined && delete schema[k]);

  return schema;
}
