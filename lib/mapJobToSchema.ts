export function mapJobToSchema(job: any) {
  // Helper functions
  const getCompanyName = () => {
    if (!job.company) return 'Confidential Employer';
    if (typeof job.company === 'string') return job.company;
    if (typeof job.company === 'object' && job.company.name) return job.company.name;
    return 'Confidential Employer';
  };

  const getEmploymentType = () => {
    const type = job.employment_type || job.type || 'full-time';
    const normalizedType = type.toLowerCase();
    
    // Map to Google Jobs expected values
    const typeMap: Record<string, string> = {
      'full-time': 'FULL_TIME',
      'part-time': 'PART_TIME',
      'contract': 'CONTRACTOR',
      'temporary': 'TEMPORARY',
      'internship': 'INTERN',
      'freelance': 'CONTRACTOR'
    };
    
    return [typeMap[normalizedType] || 'FULL_TIME'];
  };

  const getExperienceMonths = (level: string) => {
    const levels: Record<string, number> = {
      'Entry Level': 0,
      'Junior': 12,
      'Mid-level': 36,
      'Senior': 60,
      'Lead': 84,
      'Executive': 120
    };
    return levels[level] || 36; // Default to mid-level
  };

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": job.title || 'Job Position',
    "description": job.description_html || job.description || 'Job description not available',
    "datePosted": job.created_at || job.posted_date,
    "validThrough": job.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    "employmentType": getEmploymentType(),
    "hiringOrganization": {
      "@type": "Organization",
      "name": getCompanyName(),
    },
    "jobLocation": job.location?.remote ? undefined : {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        ...(job.location?.city && { "addressLocality": job.location.city }),
        ...(job.location?.state && { "addressRegion": job.location.state }),
        ...(job.location?.country && { "addressCountry": job.location.country }),
      }
    },
    "jobLocationType": job.location?.remote ? "TELECOMMUTE" : undefined,
    "baseSalary": job.salary_range ? {
      "@type": "MonetaryAmount",
      "currency": job.salary_range.currency || 'USD',
      "value": {
        "@type": "QuantitativeValue",
        "minValue": job.salary_range.min,
        "maxValue": job.salary_range.max,
        "unitText": (job.salary_range.period || 'YEAR').toUpperCase()
      }
    } : undefined,
    "experienceRequirements": job.experience_level ? {
      "@type": "OccupationalExperienceRequirements",
      "monthsOfExperience": getExperienceMonths(job.experience_level)
    } : undefined,
    "directApply": true,
    "identifier": {
      "@type": "PropertyValue",
      "name": "JobMeter",
      "value": job.id
    },
    // Use stored slug if available, otherwise generate one
    "url": `https://www.jobmeter.app/jobs/${job.slug || job.id}`
  };
}