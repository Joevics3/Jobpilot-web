// Template renderer functions for old CV templates
// These functions take structured CV data and return HTML

export interface CVData {
  personalDetails: {
    name: string;
    title: string;
    email: string;
    phone: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
    location: string;
  };
  summary: string;
  experience: Array<{
    role: string;
    company: string;
    years: string;
    bullets: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    years: string;
  }>;
  skills: string[];
  projects?: Array<{
    title: string;
    description: string;
  }>;
  accomplishments?: string[];
  awards?: Array<{
    title: string;
    issuer?: string;
    year?: string;
  }>;
  certifications?: Array<{
    name: string;
    issuer?: string;
    year?: string;
  }>;
  languages?: string[];
  interests?: string[];
  publications?: Array<{
    title: string;
    journal?: string;
    year?: string;
  }>;
  volunteerWork?: Array<{
    organization: string;
    role?: string;
    duration?: string;
    description?: string;
  }>;
  additionalSections?: Array<{
    sectionName: string;
    content: string;
  }>;
}

const formatBullets = (bullets: string[]): string => {
  return bullets.map(b => `<li class="list-disc ml-5 mb-1">${b}</li>`).join('');
};

// Helper function to count active sections
const countActiveSections = (data: CVData): number => {
  let count = 0;
  if (data.summary) count++;
  if (data.experience && data.experience.length > 0) count++;
  if (data.education && data.education.length > 0) count++;
  if (data.skills && data.skills.length > 0) count++;
  if (data.projects && data.projects.length > 0) count++;
  if (data.accomplishments && data.accomplishments.length > 0) count++;
  if (data.awards && data.awards.length > 0) count++;
  if (data.certifications && data.certifications.length > 0) count++;
  if (data.languages && data.languages.length > 0) count++;
  if (data.interests && data.interests.length > 0) count++;
  if (data.publications && data.publications.length > 0) count++;
  if (data.volunteerWork && data.volunteerWork.length > 0) count++;
  if (data.additionalSections && data.additionalSections.length > 0) count++;
  return count;
};

// Helper function to estimate content height for a section
const estimateSectionHeight = (sectionType: string, data: CVData, sectionKey?: string): number => {
  // Base height in mm (approximate)
  const BASE_SECTION_HEIGHT = 8; // Title + padding
  const LINE_HEIGHT_MM = 4; // Average line height in mm (9-10px font with 1.4 line-height)
  const BULLET_HEIGHT = 4; // Per bullet point
  const ENTRY_HEIGHT = 12; // Per work/education entry
  
  switch (sectionType) {
    case 'summary':
      // Estimate based on summary length (roughly 3-5 lines)
      const summaryLines = Math.max(3, Math.ceil((data.summary?.length || 0) / 60));
      return BASE_SECTION_HEIGHT + (summaryLines * LINE_HEIGHT_MM);
    
    case 'experience':
      // Each experience entry: header (6mm) + bullets (4mm each)
      let expHeight = BASE_SECTION_HEIGHT;
      (data.experience || []).forEach(exp => {
        expHeight += ENTRY_HEIGHT;
        expHeight += (exp.bullets?.length || 0) * BULLET_HEIGHT;
      });
      return expHeight;
    
    case 'education':
      // Each education entry: ~10mm
      return BASE_SECTION_HEIGHT + ((data.education?.length || 0) * ENTRY_HEIGHT);
    
    case 'skills':
      // Skills: depends on count, usually 1-2 lines
      const skillLines = Math.ceil((data.skills?.length || 0) / 8);
      return BASE_SECTION_HEIGHT + Math.max(1, skillLines) * LINE_HEIGHT_MM;
    
    case 'projects':
      // Each project: ~8mm
      return BASE_SECTION_HEIGHT + ((data.projects?.length || 0) * 8);
    
    case 'accomplishments':
      // Each accomplishment: ~4mm
      return BASE_SECTION_HEIGHT + ((data.accomplishments?.length || 0) * 4);
    
    case 'awards':
      // Each award: ~6mm
      return BASE_SECTION_HEIGHT + ((data.awards?.length || 0) * 6);
    
    case 'certifications':
      // Each cert: ~6mm
      return BASE_SECTION_HEIGHT + ((data.certifications?.length || 0) * 6);
    
    case 'languages':
      // Usually 1 line
      return BASE_SECTION_HEIGHT + LINE_HEIGHT_MM;
    
    case 'interests':
      // Usually 1 line
      return BASE_SECTION_HEIGHT + LINE_HEIGHT_MM;
    
    case 'publications':
      // Each publication: ~6mm
      return BASE_SECTION_HEIGHT + ((data.publications?.length || 0) * 6);
    
    case 'volunteerWork':
      // Each volunteer entry: ~10mm
      return BASE_SECTION_HEIGHT + ((data.volunteerWork?.length || 0) * 10);
    
    case 'additionalSections':
      // Estimate based on content length
      const additionalSection = data.additionalSections?.find(s => s.sectionName === sectionKey);
      if (additionalSection) {
        const lines = Math.ceil((additionalSection.content?.length || 0) / 60);
        return BASE_SECTION_HEIGHT + (lines * LINE_HEIGHT_MM);
      }
      return BASE_SECTION_HEIGHT;
    
    default:
      return BASE_SECTION_HEIGHT + LINE_HEIGHT_MM * 2;
  }
};

// Helper function to calculate smart spacing based on actual content height
const calculateSpacing = (data: CVData): { spacing: number; useDistribution: boolean } => {
  const A4_HEIGHT = 297; // mm
  const HEADER_HEIGHT = 80; // mm (header + name + top padding)
  const BOTTOM_SPACE = 10; // mm
  const AVAILABLE_HEIGHT = A4_HEIGHT - HEADER_HEIGHT - BOTTOM_SPACE; // ~207mm
  
  // Estimate total content height
  let totalContentHeight = 0;
  const sectionOrder: Array<{ type: string; key?: string }> = [];
  
  if (data.summary) {
    totalContentHeight += estimateSectionHeight('summary', data);
    sectionOrder.push({ type: 'summary' });
  }
  if (data.experience && data.experience.length > 0) {
    totalContentHeight += estimateSectionHeight('experience', data);
    sectionOrder.push({ type: 'experience' });
  }
  if (data.education && data.education.length > 0) {
    totalContentHeight += estimateSectionHeight('education', data);
    sectionOrder.push({ type: 'education' });
  }
  if (data.skills && data.skills.length > 0) {
    totalContentHeight += estimateSectionHeight('skills', data);
    sectionOrder.push({ type: 'skills' });
  }
  if (data.projects && data.projects.length > 0) {
    totalContentHeight += estimateSectionHeight('projects', data);
    sectionOrder.push({ type: 'projects' });
  }
  if (data.accomplishments && data.accomplishments.length > 0) {
    totalContentHeight += estimateSectionHeight('accomplishments', data);
    sectionOrder.push({ type: 'accomplishments' });
  }
  if (data.awards && data.awards.length > 0) {
    totalContentHeight += estimateSectionHeight('awards', data);
    sectionOrder.push({ type: 'awards' });
  }
  if (data.certifications && data.certifications.length > 0) {
    totalContentHeight += estimateSectionHeight('certifications', data);
    sectionOrder.push({ type: 'certifications' });
  }
  if (data.languages && data.languages.length > 0) {
    totalContentHeight += estimateSectionHeight('languages', data);
    sectionOrder.push({ type: 'languages' });
  }
  if (data.interests && data.interests.length > 0) {
    totalContentHeight += estimateSectionHeight('interests', data);
    sectionOrder.push({ type: 'interests' });
  }
  if (data.publications && data.publications.length > 0) {
    totalContentHeight += estimateSectionHeight('publications', data);
    sectionOrder.push({ type: 'publications' });
  }
  if (data.volunteerWork && data.volunteerWork.length > 0) {
    totalContentHeight += estimateSectionHeight('volunteerWork', data);
    sectionOrder.push({ type: 'volunteerWork' });
  }
  if (data.additionalSections && data.additionalSections.length > 0) {
    data.additionalSections.forEach(section => {
      totalContentHeight += estimateSectionHeight('additionalSections', data, section.sectionName);
      sectionOrder.push({ type: 'additionalSections', key: section.sectionName });
    });
  }
  
  const activeSections = sectionOrder.length;
  const gapsBetweenSections = Math.max(1, activeSections - 1);
  
  // Calculate remaining space
  const extraSpace = AVAILABLE_HEIGHT - totalContentHeight;
  
  // Calculate spacing based on remaining space
  let spacing = 15; // default minimum spacing
  let useDistribution = false;
  
  if (extraSpace < 0) {
    // Content exceeds available space - use tight spacing
    spacing = 10; // Very tight
    useDistribution = false;
  } else if (extraSpace > 100 && activeSections < 6) {
    // Lots of space and few sections - distribute evenly
    useDistribution = true;
    spacing = Math.max(15, Math.min(40, extraSpace / gapsBetweenSections));
  } else if (extraSpace > 50) {
    // Moderate extra space
    spacing = Math.max(15, Math.min(25, extraSpace / gapsBetweenSections));
  } else if (extraSpace > 20) {
    // Limited extra space
    spacing = Math.max(12, extraSpace / gapsBetweenSections);
  } else {
    // Very limited space - tight spacing
    spacing = 12;
  }
  
  return { spacing: Math.round(spacing), useDistribution };
};

// Template 1 Renderer
export const renderTemplate1 = (data: CVData): string => {
  const { personalDetails, summary, experience, education, skills, projects, accomplishments, awards, certifications, languages, interests, publications, volunteerWork, additionalSections } = data;
  
  // Calculate smart spacing based on actual content height
  const { spacing, useDistribution } = calculateSpacing(data);
  
  // Build CSS content justification property
  const contentJustify = useDistribution ? 'justify-content: space-between;' : 'justify-content: flex-start;';
  
  // Build contact info with optional fields
  const contactInfo = [
    personalDetails.location,
    personalDetails.phone,
    personalDetails.email,
    personalDetails.linkedin,
    personalDetails.github,
    personalDetails.portfolio
  ].filter(Boolean).join(' | ');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV Template - Nigerian Format</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        @page {
            size: A4;
            margin: 0;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            background: white;
            margin: 0;
            padding: 0;
        }
        .page {
            width: 210mm;
            height: 297mm;
            max-height: 297mm;
            background: white;
            margin: 0;
            position: relative;
            padding: 15mm 0; /* No horizontal padding for full-width content */
            overflow: hidden;
        }
        .header {
            background: #e6d9f0;
            padding: 10px 15px;
            text-align: center;
            font-size: 8px;
            border-bottom: 2px solid #d4c5e0;
            margin: -15mm -10mm 15px -10mm; /* Extend to page edges, accounting for content padding */
        }
        .header-contact {
            display: flex;
            justify-content: center;
            gap: 15px;
            flex-wrap: wrap;
        }
        .header-contact span {
            display: inline-block;
        }
        .name {
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 2px;
            text-align: center;
            padding: 15px 0 12px 0;
            text-transform: uppercase;
        }
        .content {
            padding: 0;
            --section-spacing: ${spacing}mm;
            height: 207mm;
            max-height: 207mm;
            display: flex;
            flex-direction: column;
            ${contentJustify}
            overflow: hidden;
        }
        .section {
            margin-bottom: var(--section-spacing);
            page-break-inside: avoid;
        }
        .section:last-child {
            margin-bottom: 0;
        }
        .section-header {
            display: flex;
            align-items: center;
            margin-bottom: 8px;
            padding-bottom: 3px;
            border-bottom: 2px solid #333;
        }
        .section-title {
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            white-space: nowrap;
        }
        .section-content {
            font-size: 9px;
            line-height: 1.4;
        }
        .section-content p {
            margin-bottom: 8px;
            text-align: justify;
        }
        .two-column-list {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px 15px;
            margin-top: 6px;
        }
        .two-column-list li {
            list-style-position: inside;
            font-size: 9px;
            line-height: 1.3;
        }
        .work-entry {
            margin-bottom: 12px;
        }
        .work-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 3px;
        }
        .job-title {
            font-weight: bold;
            font-size: 9px;
            text-transform: uppercase;
        }
        .job-dates {
            font-size: 8px;
            font-style: italic;
            white-space: nowrap;
        }
        .company-name {
            font-size: 9px;
            margin-bottom: 4px;
        }
        .work-entry ul {
            margin-left: 18px;
        }
        .work-entry li {
            margin-bottom: 4px;
            font-size: 9px;
            line-height: 1.3;
        }
        .education-entry {
            margin-bottom: 12px;
        }
        .education-header {
            font-weight: bold;
            font-size: 9px;
        }
        .education-details {
            font-size: 9px;
            margin-top: 2px;
        }
        .project-entry, .cert-entry, .award-entry {
            margin-bottom: 8px;
            font-size: 9px;
            line-height: 1.3;
        }
        .project-title, .cert-name, .award-title {
            font-weight: bold;
        }
        .list-item {
            margin-bottom: 5px;
            font-size: 9px;
            line-height: 1.3;
        }
        .volunteer-entry {
            margin-bottom: 10px;
            font-size: 9px;
        }
        .volunteer-header {
            font-weight: bold;
            margin-bottom: 2px;
        }
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .page {
                width: 210mm;
                height: 297mm;
                max-height: 297mm;
                box-shadow: none;
                margin: 0;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">
            <div class="header-contact">
                <span>${contactInfo}</span>
            </div>
        </div>

        <div class="name">${personalDetails.name.toUpperCase()}</div>

        <div class="content">
            <div class="section">
                <div class="section-header">
                    <div class="section-title">CAREER OBJECTIVE</div>
                </div>
                <div class="section-content">
                    <p>${summary}</p>
                </div>
            </div>

            <div class="section">
                <div class="section-header">
                    <div class="section-title">CORE QUALIFICATIONS</div>
                </div>
                <div class="section-content">
                    <ul class="two-column-list">
                        ${skills.map(skill => `<li>${skill}</li>`).join('')}
                    </ul>
                </div>
            </div>

            <div class="section">
                <div class="section-header">
                    <div class="section-title">EDUCATION</div>
                </div>
                <div class="section-content">
                    ${education.map(edu => `
                        <div class="education-entry">
                            <div class="education-header">${edu.institution}</div>
                            <div class="education-details">${edu.degree}, ${edu.years}</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="section">
                <div class="section-header">
                    <div class="section-title">WORK EXPERIENCE</div>
                </div>
                <div class="section-content">
                    ${experience.map(exp => `
                        <div class="work-entry">
                            <div class="work-header">
                                <div class="job-title">${exp.role.toUpperCase()}</div>
                                <div class="job-dates">${exp.years}</div>
                            </div>
                            <div class="company-name">${exp.company}</div>
                            <ul>
                                ${exp.bullets.map(bullet => `<li>${bullet}</li>`).join('')}
                            </ul>
                        </div>
                    `).join('')}
                </div>
            </div>

            ${projects && projects.length > 0 ? `
            <div class="section">
                <div class="section-header">
                    <div class="section-title">PROJECTS</div>
                </div>
                <div class="section-content">
                    ${projects.map(proj => `
                        <div class="project-entry">
                            <span class="project-title">${proj.title}</span> – ${proj.description}
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${accomplishments && accomplishments.length > 0 ? `
            <div class="section">
                <div class="section-header">
                    <div class="section-title">ACCOMPLISHMENTS</div>
                </div>
                <div class="section-content">
                    ${accomplishments.map(acc => `<div class="list-item">• ${acc}</div>`).join('')}
                </div>
            </div>
            ` : ''}

            ${certifications && certifications.length > 0 ? `
            <div class="section">
                <div class="section-header">
                    <div class="section-title">CERTIFICATIONS</div>
                </div>
                <div class="section-content">
                    ${certifications.map(cert => `
                        <div class="cert-entry">
                            <span class="cert-name">${cert.name}</span>${cert.issuer ? ` – ${cert.issuer}` : ''}${cert.year ? ` (${cert.year})` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${awards && awards.length > 0 ? `
            <div class="section">
                <div class="section-header">
                    <div class="section-title">AWARDS</div>
                </div>
                <div class="section-content">
                    ${awards.map(award => `
                        <div class="award-entry">
                            <span class="award-title">${award.title}</span>${award.issuer ? ` – ${award.issuer}` : ''}${award.year ? ` (${award.year})` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${languages && languages.length > 0 ? `
            <div class="section">
                <div class="section-header">
                    <div class="section-title">LANGUAGES</div>
                </div>
                <div class="section-content">
                    ${languages.join(' • ')}
                </div>
            </div>
            ` : ''}

            ${publications && publications.length > 0 ? `
            <div class="section">
                <div class="section-header">
                    <div class="section-title">PUBLICATIONS</div>
                </div>
                <div class="section-content">
                    ${publications.map(pub => `
                        <div class="list-item">${pub.title}${pub.journal ? ` – ${pub.journal}` : ''}${pub.year ? ` (${pub.year})` : ''}</div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${volunteerWork && volunteerWork.length > 0 ? `
            <div class="section">
                <div class="section-header">
                    <div class="section-title">VOLUNTEER WORK</div>
                </div>
                <div class="section-content">
                    ${volunteerWork.map(vol => `
                        <div class="volunteer-entry">
                            <div class="volunteer-header">${vol.organization}${vol.role ? ` – ${vol.role}` : ''}${vol.duration ? ` (${vol.duration})` : ''}</div>
                            ${vol.description ? `<div style="margin-top: 2px;">${vol.description}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${interests && interests.length > 0 ? `
            <div class="section">
                <div class="section-header">
                    <div class="section-title">INTERESTS</div>
                </div>
                <div class="section-content">
                    ${interests.join(' • ')}
                </div>
            </div>
            ` : ''}

            ${additionalSections && additionalSections.length > 0 ? additionalSections.map(section => `
            <div class="section">
                <div class="section-header">
                    <div class="section-title">${section.sectionName.toUpperCase()}</div>
                </div>
                <div class="section-content">
                    ${section.content.split('\n').map(line => `<div class="list-item">${line}</div>`).join('')}
                </div>
            </div>
            `).join('') : ''}
        </div>
    </div>
</body>
</html>`;
};

// Template 2 Renderer
export const renderTemplate2 = (data: CVData): string => {
  const { personalDetails, summary, experience, education, skills, projects, accomplishments, awards, certifications, languages, interests, publications, volunteerWork, additionalSections } = data;
  
  // Calculate smart spacing based on actual content height
  const { spacing, useDistribution } = calculateSpacing(data);
  
  // Build CSS content justification property
  const contentJustify = useDistribution ? 'justify-content: space-between;' : 'justify-content: flex-start;';
  
  // Build contact info with optional fields
  const contactItems = [
    personalDetails.location,
    personalDetails.phone,
    personalDetails.email,
    personalDetails.linkedin,
    personalDetails.github,
    personalDetails.portfolio
  ].filter(Boolean).join(' | ');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV Template</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: A4; margin: 0; }
        body { font-family: 'Calibri', Arial, sans-serif; background: white; margin: 0; padding: 0; }
        .page { width: 210mm; height: 297mm; max-height: 297mm; background: white; margin: 0; position: relative; padding: 15mm 0; overflow: hidden; }
        .header { text-align: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #8b5a6b; }
        .name { font-size: 18px; font-weight: bold; color: #8b5a6b; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 5px; }
        .contact-info { font-size: 9px; color: #333; line-height: 1.3; }
        .content {
            padding: 0 10mm;
            --section-spacing: ${spacing}mm;
            height: 207mm;
            max-height: 207mm;
            display: flex;
            flex-direction: column;
            ${contentJustify}
            overflow: hidden;
        }
        .section { margin-bottom: var(--section-spacing); page-break-inside: avoid; }
        .section:last-child { margin-bottom: 0; }
        .section-title { font-size: 10px; font-weight: bold; color: #8b5a6b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; padding-bottom: 2px; border-bottom: 1px solid #8b5a6b; }
        .section-content { font-size: 10px; line-height: 1.4; color: #333; }
        .work-entry { margin-bottom: 12px; }
        .work-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px; }
        .job-title { font-weight: bold; font-size: 10px; color: #000; }
        .job-dates { font-size: 9px; font-style: italic; color: #666; white-space: nowrap; }
        .company-name { font-size: 10px; margin-bottom: 4px; color: #000; }
        .work-entry ul { margin-left: 18px; margin-top: 4px; }
        .work-entry li { margin-bottom: 4px; font-size: 10px; line-height: 1.3; }
        .education-entry { margin-bottom: 12px; }
        .education-header { font-weight: bold; font-size: 10px; margin-bottom: 2px; }
        .education-subheader { font-size: 10px; font-style: italic; margin-bottom: 2px; }
        .education-location { font-size: 9px; color: #666; }
        .project-entry, .cert-entry, .award-entry { margin-bottom: 7px; font-size: 10px; line-height: 1.3; }
        .project-title, .cert-name, .award-title { font-weight: bold; }
        .list-item { margin-bottom: 4px; font-size: 10px; line-height: 1.3; }
        .volunteer-entry { margin-bottom: 9px; font-size: 10px; }
        .volunteer-header { font-weight: bold; margin-bottom: 2px; }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">
            <div class="name">${personalDetails.name.toUpperCase()}</div>
            <div class="contact-info">${contactItems}</div>
        </div>

        <div class="content">
            <div class="section">
                <div class="section-title">Summary</div>
                <div class="section-content">${summary}</div>
            </div>

        <div class="section">
            <div class="section-title">Experience</div>
            <div class="section-content">
                ${experience.map(exp => `
                    <div class="work-entry">
                        <div class="work-header">
                            <div class="job-title">${exp.role}</div>
                            <div class="job-dates">${exp.years}</div>
                        </div>
                        <div class="company-name">${exp.company}</div>
                        <ul>
                            ${exp.bullets.map(bullet => `<li>${bullet}</li>`).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <div class="section-title">Education</div>
            <div class="section-content">
                ${education.map(edu => `
                    <div class="education-entry">
                        <div class="education-header">${edu.degree}</div>
                        <div class="education-subheader">${edu.institution}</div>
                        <div class="education-location">${edu.years}</div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <div class="section-title">Skills</div>
            <div class="section-content">
                ${skills.join(' • ')}
            </div>
        </div>

        ${projects && projects.length > 0 ? `
        <div class="section">
            <div class="section-title">Projects</div>
            <div class="section-content">
                ${projects.map(proj => `
                    <div class="project-entry">
                        <span class="project-title">${proj.title}</span> – ${proj.description}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${accomplishments && accomplishments.length > 0 ? `
        <div class="section">
            <div class="section-title">Accomplishments</div>
            <div class="section-content">
                ${accomplishments.map(acc => `<div class="list-item">• ${acc}</div>`).join('')}
            </div>
        </div>
        ` : ''}

        ${certifications && certifications.length > 0 ? `
        <div class="section">
            <div class="section-title">Certifications</div>
            <div class="section-content">
                ${certifications.map(cert => `
                    <div class="cert-entry">
                        <span class="cert-name">${cert.name}</span>${cert.issuer ? ` – ${cert.issuer}` : ''}${cert.year ? ` (${cert.year})` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${awards && awards.length > 0 ? `
        <div class="section">
            <div class="section-title">Awards</div>
            <div class="section-content">
                ${awards.map(award => `
                    <div class="award-entry">
                        <span class="award-title">${award.title}</span>${award.issuer ? ` – ${award.issuer}` : ''}${award.year ? ` (${award.year})` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${languages && languages.length > 0 ? `
        <div class="section">
            <div class="section-title">Languages</div>
            <div class="section-content">
                ${languages.join(' • ')}
            </div>
        </div>
        ` : ''}

        ${publications && publications.length > 0 ? `
        <div class="section">
            <div class="section-title">Publications</div>
            <div class="section-content">
                ${publications.map(pub => `
                    <div class="list-item">${pub.title}${pub.journal ? ` – ${pub.journal}` : ''}${pub.year ? ` (${pub.year})` : ''}</div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${volunteerWork && volunteerWork.length > 0 ? `
        <div class="section">
            <div class="section-title">Volunteer Work</div>
            <div class="section-content">
                ${volunteerWork.map(vol => `
                    <div class="volunteer-entry">
                        <div class="volunteer-header">${vol.organization}${vol.role ? ` – ${vol.role}` : ''}${vol.duration ? ` (${vol.duration})` : ''}</div>
                        ${vol.description ? `<div style="margin-top: 2px; font-size: 9px;">${vol.description}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${interests && interests.length > 0 ? `
        <div class="section">
            <div class="section-title">Interests</div>
            <div class="section-content">
                ${interests.join(' • ')}
            </div>
        </div>
        ` : ''}

        ${additionalSections && additionalSections.length > 0 ? additionalSections.map(section => `
        <div class="section">
            <div class="section-title">${section.sectionName}</div>
            <div class="section-content">
                ${section.content.split('\n').map(line => `<div class="list-item">${line}</div>`).join('')}
            </div>
        </div>
        `).join('') : ''}
        </div>
    </div>
</body>
</html>`;
};

// Template 3 Renderer
export const renderTemplate3 = (data: CVData): string => {
  const { personalDetails, summary, experience, education, skills, projects, accomplishments, awards, certifications, languages, interests, publications, volunteerWork, additionalSections } = data;
  
  // Calculate smart spacing based on actual content height
  const { spacing, useDistribution } = calculateSpacing(data);
  
  // Build CSS content justification property
  const contentJustify = useDistribution ? 'justify-content: space-between;' : 'justify-content: flex-start;';
  
  // Build contact info with optional fields
  const contactItems = [
    personalDetails.location,
    personalDetails.phone,
    personalDetails.email,
    personalDetails.linkedin,
    personalDetails.github,
    personalDetails.portfolio
  ].filter(Boolean).join(' • ');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV Template</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: A4; margin: 0; }
        body { font-family: 'Segoe UI', 'Calibri', Arial, sans-serif; background: white; margin: 0; padding: 0; }
        .page { width: 210mm; height: 297mm; max-height: 297mm; background: white; margin: 0; padding: 15mm 0; position: relative; overflow: hidden; }
        .header { text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #7b68a6; }
        .name { font-size: 36px; font-weight: bold; color: #7b68a6; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 10px; }
        .contact-info { font-size: 10px; color: #333; line-height: 1.5; }
        .content {
            padding: 0 10mm;
            --section-spacing: ${spacing}mm;
            height: 207mm;
            max-height: 207mm;
            display: flex;
            flex-direction: column;
            ${contentJustify}
            overflow: hidden;
        }
        .section { margin-bottom: var(--section-spacing); page-break-inside: avoid; }
        .section:last-child { margin-bottom: 0; }
        .section-title { font-size: 12px; font-weight: bold; color: #7b68a6; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px; padding-bottom: 4px; border-bottom: 2px solid #7b68a6; }
        .section-content { font-size: 10px; line-height: 1.5; color: #333; }
        .work-entry { margin-bottom: 14px; }
        .work-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
        .job-title { font-weight: bold; font-size: 10px; color: #000; }
        .work-dates { font-size: 10px; font-weight: bold; color: #000; white-space: nowrap; margin-left: 15px; }
        .company-name { font-size: 10px; margin-bottom: 6px; color: #333; }
        .work-entry ul { margin-left: 18px; margin-top: 4px; }
        .work-entry li { margin-bottom: 5px; font-size: 10px; line-height: 1.4; }
        .education-entry { margin-bottom: 14px; }
        .education-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
        .education-degree { font-weight: bold; font-size: 10px; color: #000; }
        .education-dates { font-size: 10px; font-weight: bold; color: #000; white-space: nowrap; margin-left: 15px; }
        .education-school { font-size: 10px; margin-bottom: 4px; color: #333; }
        .project-entry, .cert-entry, .award-entry { margin-bottom: 7px; font-size: 10px; line-height: 1.3; }
        .project-title, .cert-name, .award-title { font-weight: bold; }
        .list-item { margin-bottom: 4px; font-size: 10px; line-height: 1.3; }
        .volunteer-entry { margin-bottom: 9px; font-size: 10px; }
        .volunteer-header { font-weight: bold; margin-bottom: 2px; }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">
            <div class="name">${personalDetails.name.toUpperCase()}</div>
            <div class="contact-info">${contactItems}</div>
        </div>

        <div class="content">
            <div class="section">
                <div class="section-title">SUMMARY</div>
                <div class="section-content">${summary}</div>
            </div>

        <div class="section">
            <div class="section-title">WORK EXPERIENCE</div>
            <div class="section-content">
                ${experience.map(exp => `
                    <div class="work-entry">
                        <div class="work-header">
                            <div class="job-title">${exp.role}</div>
                            <div class="work-dates">${exp.years}</div>
                        </div>
                        <div class="company-name">${exp.company}</div>
                        <ul>
                            ${exp.bullets.map(bullet => `<li>${bullet}</li>`).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <div class="section-title">EDUCATION</div>
            <div class="section-content">
                ${education.map(edu => `
                    <div class="education-entry">
                        <div class="education-header">
                            <div class="education-degree">${edu.degree}</div>
                            <div class="education-dates">${edu.years}</div>
                        </div>
                        <div class="education-school">${edu.institution}</div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <div class="section-title">SKILLS</div>
            <div class="section-content">${skills.join(' • ')}</div>
        </div>

        ${projects && projects.length > 0 ? `
        <div class="section">
            <div class="section-title">PROJECTS</div>
            <div class="section-content">
                ${projects.map(proj => `
                    <div class="project-entry">
                        <span class="project-title">${proj.title}</span> – ${proj.description}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${accomplishments && accomplishments.length > 0 ? `
        <div class="section">
            <div class="section-title">ACCOMPLISHMENTS</div>
            <div class="section-content">
                ${accomplishments.map(acc => `<div class="list-item">• ${acc}</div>`).join('')}
            </div>
        </div>
        ` : ''}

        ${certifications && certifications.length > 0 ? `
        <div class="section">
            <div class="section-title">CERTIFICATIONS</div>
            <div class="section-content">
                ${certifications.map(cert => `
                    <div class="cert-entry">
                        <span class="cert-name">${cert.name}</span>${cert.issuer ? ` – ${cert.issuer}` : ''}${cert.year ? ` (${cert.year})` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${awards && awards.length > 0 ? `
        <div class="section">
            <div class="section-title">AWARDS</div>
            <div class="section-content">
                ${awards.map(award => `
                    <div class="award-entry">
                        <span class="award-title">${award.title}</span>${award.issuer ? ` – ${award.issuer}` : ''}${award.year ? ` (${award.year})` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${languages && languages.length > 0 ? `
        <div class="section">
            <div class="section-title">LANGUAGES</div>
            <div class="section-content">
                ${languages.join(' • ')}
            </div>
        </div>
        ` : ''}

        ${publications && publications.length > 0 ? `
        <div class="section">
            <div class="section-title">PUBLICATIONS</div>
            <div class="section-content">
                ${publications.map(pub => `
                    <div class="list-item">${pub.title}${pub.journal ? ` – ${pub.journal}` : ''}${pub.year ? ` (${pub.year})` : ''}</div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${volunteerWork && volunteerWork.length > 0 ? `
        <div class="section">
            <div class="section-title">VOLUNTEER WORK</div>
            <div class="section-content">
                ${volunteerWork.map(vol => `
                    <div class="volunteer-entry">
                        <div class="volunteer-header">${vol.organization}${vol.role ? ` – ${vol.role}` : ''}${vol.duration ? ` (${vol.duration})` : ''}</div>
                        ${vol.description ? `<div style="margin-top: 2px; font-size: 9px;">${vol.description}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${interests && interests.length > 0 ? `
        <div class="section">
            <div class="section-title">INTERESTS</div>
            <div class="section-content">
                ${interests.join(' • ')}
            </div>
        </div>
        ` : ''}

        ${additionalSections && additionalSections.length > 0 ? additionalSections.map(section => `
        <div class="section">
            <div class="section-title">${section.sectionName.toUpperCase()}</div>
            <div class="section-content">
                ${section.content.split('\n').map(line => `<div class="list-item">${line}</div>`).join('')}
            </div>
        </div>
        `).join('') : ''}
        </div>
    </div>
</body>
</html>`;
};

// Template 4 Renderer
export const renderTemplate4 = (data: CVData): string => {
  const { personalDetails, summary, experience, education, skills, projects, accomplishments, awards, certifications, languages, interests, publications, volunteerWork, additionalSections } = data;
  
  // Calculate smart spacing based on actual content height
  const { spacing, useDistribution } = calculateSpacing(data);
  
  // Build CSS content justification property
  const contentJustify = useDistribution ? 'justify-content: space-between;' : 'justify-content: flex-start;';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV Template</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: A4; margin: 0; }
        body { font-family: 'Arial', 'Helvetica', sans-serif; background: white; margin: 0; padding: 0; }
        .page { width: 210mm; height: 297mm; max-height: 297mm; background: white; margin: 0; padding: 15mm 0; position: relative; overflow: hidden; }
        .header { text-align: center; margin-bottom: 15px; padding-bottom: 12px; border-bottom: 3px solid #000; }
        .name { font-size: 32px; font-weight: bold; color: #000; letter-spacing: 6px; text-transform: uppercase; margin-bottom: 6px; }
        .job-title { font-size: 12px; color: #000; text-transform: uppercase; letter-spacing: 1.5px; }
        .about-contact-section { display: grid; grid-template-columns: 1fr auto; gap: 30px; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 3px solid #000; align-items: start; }
        .about-me { flex: 1; }
        .contact-info { display: flex; flex-direction: column; gap: 8px; }
        .contact-item { display: flex; align-items: center; gap: 8px; font-size: 10px; }
        .main-section-title { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px; }
        .about-content { font-size: 10px; line-height: 1.5; text-align: justify; color: #333; }
        .two-column-layout { display: grid; grid-template-columns: 1fr 2px 2fr; gap: 20px; margin-bottom: 15px; }
        .divider { background: #000; width: 2px; }
        .left-column { padding-right: 8px; }
        .right-column { padding-left: 8px; }
        .left-column, .right-column {
            --section-spacing: ${spacing}mm;
            height: 207mm;
            max-height: 207mm;
            display: flex;
            flex-direction: column;
            ${contentJustify}
            overflow: hidden;
        }
        .section { margin-bottom: var(--section-spacing); page-break-inside: avoid; }
        .section:last-child { margin-bottom: 0; }
        .section-title { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 2px solid #000; }
        .section-content { font-size: 10px; line-height: 1.4; color: #333; }
        .work-entry { margin-bottom: 14px; }
        .work-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px; }
        .company-name { font-weight: bold; font-size: 10px; text-transform: uppercase; }
        .work-location-date { font-size: 9px; text-align: right; white-space: nowrap; margin-left: 12px; }
        .work-position { font-size: 10px; font-style: italic; margin-bottom: 6px; }
        .work-entry ul { margin-left: 16px; }
        .work-entry li { margin-bottom: 4px; font-size: 10px; line-height: 1.4; }
        .education-entry { margin-bottom: 14px; }
        .education-degree { font-weight: bold; font-size: 10px; margin-bottom: 4px; }
        .education-dates { font-size: 9px; margin-bottom: 6px; }
        .skills-list { list-style: none; padding: 0; }
        .skills-list li { padding-left: 12px; position: relative; margin-bottom: 6px; font-size: 10px; }
        .skills-list li:before { content: "•"; position: absolute; left: 0; font-weight: bold; }
        .project-entry, .cert-entry, .award-entry { margin-bottom: 6px; font-size: 10px; line-height: 1.3; }
        .project-title, .cert-name, .award-title { font-weight: bold; }
        .list-item { margin-bottom: 4px; font-size: 10px; line-height: 1.3; }
        .volunteer-entry { margin-bottom: 8px; font-size: 10px; }
        .volunteer-header { font-weight: bold; margin-bottom: 2px; }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">
            <div class="name">${personalDetails.name.toUpperCase()}</div>
            <div class="job-title">${personalDetails.title.toUpperCase()}</div>
        </div>

        <div class="about-contact-section">
            <div class="about-me">
                <div class="main-section-title">ABOUT ME</div>
                <div class="about-content">${summary}</div>
            </div>
            <div class="contact-info">
                <div class="contact-item">
                    <div>📞</div>
                    <div>${personalDetails.phone}</div>
                </div>
                <div class="contact-item">
                    <div>✉</div>
                    <div>${personalDetails.email}</div>
                </div>
                <div class="contact-item">
                    <div>📍</div>
                    <div>${personalDetails.location}</div>
                </div>
                ${personalDetails.linkedin ? `<div class="contact-item"><div>💼</div><div>${personalDetails.linkedin}</div></div>` : ''}
                ${personalDetails.github ? `<div class="contact-item"><div>🔗</div><div>${personalDetails.github}</div></div>` : ''}
                ${personalDetails.portfolio ? `<div class="contact-item"><div>🌐</div><div>${personalDetails.portfolio}</div></div>` : ''}
            </div>
        </div>

        <div class="two-column-layout">
            <div class="left-column">
                <div class="section">
                    <div class="section-title">EDUCATION</div>
                    <div class="section-content">
                        ${education.map(edu => `
                            <div class="education-entry">
                                <div class="education-degree">${edu.degree}</div>
                                <div class="education-dates">${edu.years}</div>
                                <div>${edu.institution}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">SKILLS</div>
                    <div class="section-content">
                        <ul class="skills-list">
                            ${skills.map(skill => `<li>${skill}</li>`).join('')}
                        </ul>
                    </div>
                </div>

                ${certifications && certifications.length > 0 ? `
                <div class="section">
                    <div class="section-title">CERTIFICATIONS</div>
                    <div class="section-content">
                        ${certifications.map(cert => `
                            <div class="cert-entry">
                                <span class="cert-name">${cert.name}</span>${cert.issuer ? ` – ${cert.issuer}` : ''}${cert.year ? ` (${cert.year})` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                ${languages && languages.length > 0 ? `
                <div class="section">
                    <div class="section-title">LANGUAGES</div>
                    <div class="section-content">
                        ${languages.join(' • ')}
                    </div>
                </div>
                ` : ''}

                ${interests && interests.length > 0 ? `
                <div class="section">
                    <div class="section-title">INTERESTS</div>
                    <div class="section-content">
                        ${interests.join(' • ')}
                    </div>
                </div>
                ` : ''}
            </div>

            <div class="divider"></div>

            <div class="right-column">
                <div class="section">
                    <div class="section-title">WORK EXPERIENCE</div>
                    <div class="section-content">
                        ${experience.map(exp => `
                            <div class="work-entry">
                                <div class="work-header">
                                    <div class="company-name">${exp.company}</div>
                                    <div class="work-location-date">${personalDetails.location}<br>${exp.years}</div>
                                </div>
                                <div class="work-position">${exp.role}</div>
                                <ul>
                                    ${exp.bullets.map(bullet => `<li>${bullet}</li>`).join('')}
                                </ul>
                            </div>
                        `).join('')}
                    </div>
                </div>

                ${projects && projects.length > 0 ? `
                <div class="section">
                    <div class="section-title">PROJECTS</div>
                    <div class="section-content">
                        ${projects.map(proj => `
                            <div class="project-entry">
                                <span class="project-title">${proj.title}</span> – ${proj.description}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                ${accomplishments && accomplishments.length > 0 ? `
                <div class="section">
                    <div class="section-title">ACCOMPLISHMENTS</div>
                    <div class="section-content">
                        ${accomplishments.map(acc => `<div class="list-item">• ${acc}</div>`).join('')}
                    </div>
                </div>
                ` : ''}

                ${awards && awards.length > 0 ? `
                <div class="section">
                    <div class="section-title">AWARDS</div>
                    <div class="section-content">
                        ${awards.map(award => `
                            <div class="award-entry">
                                <span class="award-title">${award.title}</span>${award.issuer ? ` – ${award.issuer}` : ''}${award.year ? ` (${award.year})` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                ${publications && publications.length > 0 ? `
                <div class="section">
                    <div class="section-title">PUBLICATIONS</div>
                    <div class="section-content">
                        ${publications.map(pub => `
                            <div class="list-item">${pub.title}${pub.journal ? ` – ${pub.journal}` : ''}${pub.year ? ` (${pub.year})` : ''}</div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                ${volunteerWork && volunteerWork.length > 0 ? `
                <div class="section">
                    <div class="section-title">VOLUNTEER WORK</div>
                    <div class="section-content">
                        ${volunteerWork.map(vol => `
                            <div class="volunteer-entry">
                                <div class="volunteer-header">${vol.organization}${vol.role ? ` – ${vol.role}` : ''}${vol.duration ? ` (${vol.duration})` : ''}</div>
                                ${vol.description ? `<div style="margin-top: 2px; font-size: 9px;">${vol.description}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                ${additionalSections && additionalSections.length > 0 ? additionalSections.map(section => `
                <div class="section">
                    <div class="section-title">${section.sectionName.toUpperCase()}</div>
                    <div class="section-content">
                        ${section.content.split('\n').map(line => `<div class="list-item">${line}</div>`).join('')}
                    </div>
                </div>
                `).join('') : ''}
            </div>
        </div>
    </div>
</body>
</html>`;
};

// Template 5 Renderer
export const renderTemplate5 = (data: CVData): string => {
  const { personalDetails, summary, experience, education, skills, projects, accomplishments, awards, certifications, languages, interests, publications, volunteerWork, additionalSections } = data;
  
  // Calculate smart spacing based on actual content height
  const { spacing, useDistribution } = calculateSpacing(data);
  
  // Build CSS content justification property
  const contentJustify = useDistribution ? 'justify-content: space-between;' : 'justify-content: flex-start;';
  
  // Build contact info with optional fields
  const contactItems = [
    personalDetails.location,
    personalDetails.phone,
    personalDetails.email,
    personalDetails.linkedin,
    personalDetails.github,
    personalDetails.portfolio
  ].filter(Boolean).join(' | ');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV Template</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: A4; margin: 0; }
        body { font-family: 'Calibri', Arial, sans-serif; background: white; margin: 0; padding: 0; }
        .page { width: 210mm; height: 297mm; max-height: 297mm; background: white; margin: 0; padding: 15mm 0; position: relative; overflow: hidden; }
        .header { text-align: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 3px solid #2c5f8d; }
        .name { font-size: 20px; font-weight: bold; color: #2c5f8d; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px; }
        .contact-info { font-size: 9px; color: #333; line-height: 1.5; }
        .content {
            padding: 0 10mm;
            --section-spacing: ${spacing}mm;
            height: 207mm;
            max-height: 207mm;
            display: flex;
            flex-direction: column;
            ${contentJustify}
            overflow: hidden;
        }
        .section { margin-bottom: var(--section-spacing); page-break-inside: avoid; }
        .section:last-child { margin-bottom: 0; }
        .section-title { font-size: 11px; font-weight: bold; color: #2c5f8d; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; padding-bottom: 3px; border-bottom: 2px solid #2c5f8d; }
        .section-content { font-size: 10px; line-height: 1.4; color: #333; }
        .work-entry { margin-bottom: 12px; }
        .work-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px; }
        .job-title { font-weight: bold; font-size: 10px; color: #000; }
        .job-dates { font-size: 9px; font-style: italic; color: #666; white-space: nowrap; }
        .company-name { font-size: 10px; font-weight: bold; margin-bottom: 4px; color: #000; }
        .work-entry ul { margin-left: 18px; margin-top: 4px; }
        .work-entry li { margin-bottom: 4px; font-size: 10px; line-height: 1.3; }
        .education-entry { margin-bottom: 12px; }
        .education-header { font-weight: bold; font-size: 10px; margin-bottom: 2px; }
        .education-subheader { font-size: 10px; font-style: italic; margin-bottom: 2px; }
        .education-location { font-size: 9px; color: #666; }
        .two-column-container { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-top: 6px; }
        .column-list { margin: 0; padding: 0; list-style: none; }
        .column-list li { padding-left: 12px; position: relative; margin-bottom: 4px; font-size: 10px; line-height: 1.3; }
        .column-list li:before { content: "•"; position: absolute; left: 0; color: #2c5f8d; font-weight: bold; }
        .project-entry, .cert-entry, .award-entry { margin-bottom: 6px; font-size: 10px; line-height: 1.3; }
        .project-title, .cert-name, .award-title { font-weight: bold; }
        .list-item { margin-bottom: 4px; font-size: 10px; line-height: 1.3; }
        .volunteer-entry { margin-bottom: 8px; font-size: 10px; }
        .volunteer-header { font-weight: bold; margin-bottom: 2px; }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">
            <div class="name">${personalDetails.name.toUpperCase()}</div>
            <div class="contact-info">${contactItems}</div>
        </div>

        <div class="content">
            <div class="section">
                <div class="section-title">Professional Summary</div>
                <div class="section-content">${summary}</div>
            </div>

        <div class="section">
            <div class="section-title">Work History</div>
            <div class="section-content">
                ${experience.map(exp => `
                    <div class="work-entry">
                        <div class="work-header">
                            <div class="job-title">${exp.role}</div>
                            <div class="job-dates">${exp.years}</div>
                        </div>
                        <div class="company-name">${exp.company}</div>
                        <ul>
                            ${exp.bullets.map(bullet => `<li>${bullet}</li>`).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <div class="section-title">Skills</div>
            <div class="section-content">
                <div class="two-column-container">
                    <ul class="column-list">
                        ${skills.slice(0, Math.ceil(skills.length / 2)).map(skill => `<li>${skill}</li>`).join('')}
                    </ul>
                    <ul class="column-list">
                        ${skills.slice(Math.ceil(skills.length / 2)).map(skill => `<li>${skill}</li>`).join('')}
                    </ul>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Education</div>
            <div class="section-content">
                ${education.map(edu => `
                    <div class="education-entry">
                        <div class="education-header">${edu.degree}</div>
                        <div class="education-subheader">${edu.institution}</div>
                        <div class="education-location">${edu.years}</div>
                    </div>
                `).join('')}
            </div>
        </div>

        ${projects && projects.length > 0 ? `
        <div class="section">
            <div class="section-title">Projects</div>
            <div class="section-content">
                ${projects.map(proj => `
                    <div class="project-entry">
                        <span class="project-title">${proj.title}</span> – ${proj.description}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${accomplishments && accomplishments.length > 0 ? `
        <div class="section">
            <div class="section-title">Accomplishments</div>
            <div class="section-content">
                ${accomplishments.map(acc => `<div class="list-item">• ${acc}</div>`).join('')}
            </div>
        </div>
        ` : ''}

        ${certifications && certifications.length > 0 ? `
        <div class="section">
            <div class="section-title">Certifications</div>
            <div class="section-content">
                ${certifications.map(cert => `
                    <div class="cert-entry">
                        <span class="cert-name">${cert.name}</span>${cert.issuer ? ` – ${cert.issuer}` : ''}${cert.year ? ` (${cert.year})` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${awards && awards.length > 0 ? `
        <div class="section">
            <div class="section-title">Awards</div>
            <div class="section-content">
                ${awards.map(award => `
                    <div class="award-entry">
                        <span class="award-title">${award.title}</span>${award.issuer ? ` – ${award.issuer}` : ''}${award.year ? ` (${award.year})` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${languages && languages.length > 0 ? `
        <div class="section">
            <div class="section-title">Languages</div>
            <div class="section-content">
                ${languages.join(' • ')}
            </div>
        </div>
        ` : ''}

        ${publications && publications.length > 0 ? `
        <div class="section">
            <div class="section-title">Publications</div>
            <div class="section-content">
                ${publications.map(pub => `
                    <div class="list-item">${pub.title}${pub.journal ? ` – ${pub.journal}` : ''}${pub.year ? ` (${pub.year})` : ''}</div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${volunteerWork && volunteerWork.length > 0 ? `
        <div class="section">
            <div class="section-title">Volunteer Work</div>
            <div class="section-content">
                ${volunteerWork.map(vol => `
                    <div class="volunteer-entry">
                        <div class="volunteer-header">${vol.organization}${vol.role ? ` – ${vol.role}` : ''}${vol.duration ? ` (${vol.duration})` : ''}</div>
                        ${vol.description ? `<div style="margin-top: 2px; font-size: 9px;">${vol.description}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${interests && interests.length > 0 ? `
        <div class="section">
            <div class="section-title">Interests</div>
            <div class="section-content">
                ${interests.join(' • ')}
            </div>
        </div>
        ` : ''}

        ${additionalSections && additionalSections.length > 0 ? additionalSections.map(section => `
        <div class="section">
            <div class="section-title">${section.sectionName}</div>
            <div class="section-content">
                ${section.content.split('\n').map(line => `<div class="list-item">${line}</div>`).join('')}
            </div>
        </div>
        `).join('') : ''}
        </div>
    </div>
</body>
</html>`;
};

// Template 7 Renderer (Gray Serif - two-column with vertical divider)
export const renderTemplate7 = (data: CVData): string => {
  const { personalDetails, summary, experience, education, skills, projects, accomplishments, awards, certifications, languages, interests, publications, volunteerWork } = data;
  
  const nameParts = (personalDetails.name || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  
  const contactInfo = [
    personalDetails.phone,
    personalDetails.email,
    personalDetails.location,
    personalDetails.linkedin,
    personalDetails.github
  ].filter(Boolean);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV Template</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: A4; margin: 0; }
        body {
            font-family: 'Georgia', 'Times New Roman', serif;
            background: white;
            margin: 0;
            padding: 0;
        }
        .page {
            width: 210mm;
            height: 297mm;
            max-height: 297mm;
            background: white;
            margin: 0;
            padding: 15mm 0;
            overflow: hidden;
            position: relative;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
            padding-bottom: 12px;
        }
        .name-title { flex: 1; }
        .name { font-size: 32px; font-weight: normal; color: #4a4a4a; margin-bottom: 5px; }
        .first-name { font-weight: 300; color: #7a7a7a; }
        .last-name { font-weight: bold; color: #4a4a4a; }
        .name-underline { width: 200px; height: 2px; background: #4a4a4a; margin-bottom: 12px; }
        .job-title { font-size: 16px; color: #4a4a4a; font-weight: 300; font-style: italic; }
        .contact-info { display: flex; flex-direction: column; gap: 8px; align-items: flex-end; }
        .contact-item { display: flex; align-items: center; gap: 10px; font-size: 11px; color: #4a4a4a; }
        .horizontal-divider { width: 100%; height: 2px; background: #5a5a5a; margin-bottom: 15px; }
        .summary-section { margin-bottom: 20px; text-align: center; }
        .summary-title { font-size: 13px; font-weight: normal; text-transform: uppercase; letter-spacing: 2px; color: #4a4a4a; margin-bottom: 10px; }
        .summary-content { font-size: 10px; line-height: 1.5; color: #4a4a4a; text-align: justify; }
        .content-wrapper {
            height: calc(297mm - 140px);
            max-height: calc(297mm - 140px);
            overflow: hidden;
            padding: 0 10mm;
        }
        .two-column-layout { 
            display: grid; 
            grid-template-columns: 1fr 3px 2fr; 
            gap: 20px;
            height: 100%;
            max-height: 100%;
        }
        .left-column, .right-column {
            overflow: hidden;
            height: 100%;
        }
        .vertical-divider { background: #5a5a5a; width: 3px; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 13px; font-weight: normal; text-transform: uppercase; letter-spacing: 2px; color: #4a4a4a; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #5a5a5a; }
        .section-content { font-size: 11px; line-height: 1.6; color: #4a4a4a; }
        .work-entry, .education-entry { margin-bottom: 12px; }
        .work-role { font-weight: bold; font-size: 11px; margin-bottom: 2px; }
        .work-company { font-size: 11px; margin-bottom: 2px; }
        .work-dates { font-size: 10px; font-style: italic; color: #666; margin-bottom: 4px; }
        .work-bullets { margin-left: 15px; font-size: 10px; line-height: 1.4; }
        .work-bullets li { margin-bottom: 3px; }
        .education-school { font-weight: bold; font-size: 11px; margin-bottom: 2px; }
        .education-degree { font-size: 11px; margin-bottom: 2px; }
        .education-dates { font-size: 10px; font-style: italic; color: #666; }
        .skills-list { display: flex; flex-wrap: wrap; gap: 8px; }
        .skill-item { font-size: 10px; padding: 4px 8px; background: #e0e0e0; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">
            <div class="name-title">
                <div class="name">
                    <span class="first-name">${firstName}</span> <span class="last-name">${lastName}</span>
                </div>
                <div class="name-underline"></div>
                <div class="job-title">${personalDetails.title || ''}</div>
            </div>
            <div class="contact-info">
                ${contactInfo.map(info => `<div class="contact-item">${info}</div>`).join('')}
            </div>
        </div>
        <div class="horizontal-divider"></div>
        ${summary ? `
        <div class="summary-section">
            <div class="summary-title">Professional Summary</div>
            <div class="summary-content">${summary}</div>
        </div>
        ` : ''}
        <div class="content-wrapper">
        <div class="two-column-layout">
            <div class="left-column">
                ${education && education.length > 0 ? `
                <div class="section">
                    <div class="section-title">Education</div>
                    <div class="section-content">
                        ${education.map(edu => `
                            <div class="education-entry">
                                <div class="education-school">${edu.institution}</div>
                                <div class="education-degree">${edu.degree}</div>
                                <div class="education-dates">${edu.years}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                ${skills && skills.length > 0 ? `
                <div class="section">
                    <div class="section-title">Skills</div>
                    <div class="section-content">
                        <div class="skills-list">
                            ${skills.map(skill => `<span class="skill-item">${skill}</span>`).join('')}
                        </div>
                    </div>
                </div>
                ` : ''}
                ${languages && languages.length > 0 ? `
                <div class="section">
                    <div class="section-title">Languages</div>
                    <div class="section-content">${languages.join(' • ')}</div>
                </div>
                ` : ''}
            </div>
            <div class="vertical-divider"></div>
            <div class="right-column">
                ${experience && experience.length > 0 ? `
                <div class="section">
                    <div class="section-title">Experience</div>
                    <div class="section-content">
                        ${experience.map(exp => `
                            <div class="work-entry">
                                <div class="work-role">${exp.role}</div>
                                <div class="work-company">${exp.company}</div>
                                <div class="work-dates">${exp.years}</div>
                                ${exp.bullets && exp.bullets.length > 0 ? `
                                    <ul class="work-bullets">
                                        ${exp.bullets.map(bullet => `<li>${bullet}</li>`).join('')}
                                    </ul>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                ${projects && projects.length > 0 ? `
                <div class="section">
                    <div class="section-title">Projects</div>
                    <div class="section-content">
                        ${projects.map(proj => `
                            <div class="work-entry">
                                <div class="work-role">${proj.title}</div>
                                <div class="work-company">${proj.description}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
        </div>
    </div>
</body>
</html>`;
};

// Template 9 Renderer (Modern Minimal - clean minimal with rounded section headers)
export const renderTemplate9 = (data: CVData): string => {
  const { personalDetails, summary, experience, education, skills, projects, accomplishments, awards, certifications, languages } = data;
  
  const contactInfo = [
    personalDetails.location,
    personalDetails.phone,
    personalDetails.email,
    personalDetails.linkedin,
    personalDetails.github
  ].filter(Boolean).join(' | ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV Template</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: A4; margin: 0; }
        body {
            font-family: 'Helvetica Neue', Arial, sans-serif;
            background: white;
            margin: 0;
            padding: 0;
        }
        .page {
            width: 210mm;
            height: 297mm;
            max-height: 297mm;
            background: white;
            margin: 0;
            padding: 15mm 0;
            overflow: hidden;
            position: relative;
        }
        .header { margin-bottom: 15px; }
        .name { font-size: 34px; font-weight: bold; color: #2d2d2d; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px; }
        .job-title { font-size: 18px; font-weight: bold; color: #2d2d2d; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
        .contact-info { font-size: 10px; color: #2d2d2d; line-height: 1.5; margin-bottom: 15px; }
        .content-wrapper {
            height: calc(297mm - 160px);
            max-height: calc(297mm - 160px);
            overflow-y: auto;
            overflow-x: hidden;
            padding: 0 10mm;
        }
        .section { margin-bottom: 20px; }
        .section-title-container { background: #d4d4d4; padding: 8px 15px; margin-bottom: 12px; border-radius: 20px; }
        .section-title { font-size: 12px; font-weight: bold; color: #2d2d2d; text-transform: uppercase; font-style: italic; letter-spacing: 1px; }
        .section-content { font-size: 11px; line-height: 1.5; color: #2d2d2d; }
        .work-entry, .education-entry { margin-bottom: 10px; }
        .work-role { font-weight: bold; font-size: 11px; margin-bottom: 2px; }
        .work-company { font-size: 11px; margin-bottom: 2px; }
        .work-dates { font-size: 10px; color: #666; margin-bottom: 4px; }
        .work-bullets { margin-left: 15px; font-size: 10px; line-height: 1.4; }
        .work-bullets li { margin-bottom: 3px; }
        .education-school { font-weight: bold; font-size: 11px; margin-bottom: 2px; }
        .education-degree { font-size: 11px; margin-bottom: 2px; }
        .education-dates { font-size: 10px; color: #666; }
        .skills-list { display: flex; flex-wrap: wrap; gap: 8px; }
        .skill-item { font-size: 10px; padding: 4px 10px; background: #f0f0f0; border-radius: 15px; }
    </style>
</head>
<body>
    <div class="page">
        <div class="header">
            <div class="name">${personalDetails.name || ''}</div>
            <div class="job-title">${personalDetails.title || ''}</div>
            <div class="contact-info">${contactInfo}</div>
        </div>
        <div class="content-wrapper">
        ${summary ? `
        <div class="section">
            <div class="section-title-container">
                <div class="section-title">Professional Summary</div>
            </div>
            <div class="section-content">${summary}</div>
        </div>
        ` : ''}
        ${experience && experience.length > 0 ? `
        <div class="section">
            <div class="section-title-container">
                <div class="section-title">Experience</div>
            </div>
            <div class="section-content">
                ${experience.map(exp => `
                    <div class="work-entry">
                        <div class="work-role">${exp.role}</div>
                        <div class="work-company">${exp.company}</div>
                        <div class="work-dates">${exp.years}</div>
                        ${exp.bullets && exp.bullets.length > 0 ? `
                            <ul class="work-bullets">
                                ${exp.bullets.map(bullet => `<li>${bullet}</li>`).join('')}
                            </ul>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        ${education && education.length > 0 ? `
        <div class="section">
            <div class="section-title-container">
                <div class="section-title">Education</div>
            </div>
            <div class="section-content">
                ${education.map(edu => `
                    <div class="education-entry">
                        <div class="education-school">${edu.institution}</div>
                        <div class="education-degree">${edu.degree}</div>
                        <div class="education-dates">${edu.years}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        ${skills && skills.length > 0 ? `
        <div class="section">
            <div class="section-title-container">
                <div class="section-title">Skills</div>
            </div>
            <div class="section-content">
                <div class="skills-list">
                    ${skills.map(skill => `<span class="skill-item">${skill}</span>`).join('')}
                </div>
            </div>
        </div>
        ` : ''}
        </div>
    </div>
</body>
</html>`;
};

// Template 10 Renderer (Color Sidebar - grid layout with colored sidebar)
export const renderTemplate10 = (data: CVData): string => {
  const { personalDetails, summary, experience, education, skills, projects, certifications, languages } = data;
  
  const nameInitials = (personalDetails.name || '').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV Template</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: A4; margin: 0; }
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background: white;
            margin: 0;
            padding: 0;
        }
        .page {
            width: 210mm;
            height: 297mm;
            max-height: 297mm;
            background: white;
            margin: 0;
            padding: 15mm 10mm;
            display: grid;
            grid-template-columns: 280px 1fr;
            position: relative;
            overflow: hidden;
        }
        .top-decoration {
            position: absolute;
            top: 0;
            right: 0;
            width: 60%;
            height: 130px;
            display: flex;
        }
        .stripe { height: 100%; transform: skewX(-20deg); }
        .stripe1 { width: 35%; background: #a8b4c4; margin-left: -50px; }
        .stripe2 { width: 30%; background: #b5a589; }
        .stripe3 { width: 35%; background: #4a5f73; }
        .sidebar {
            background: white;
            padding: 80px 30px 30px 30px;
            position: relative;
            z-index: 1;
        }
        .profile-photo {
            width: 220px;
            height: 280px;
            background: linear-gradient(135deg, #4a5f73 0%, #2c5f73 100%);
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 80px;
            color: white;
            font-weight: bold;
        }
        .sidebar-section { margin-bottom: 25px; }
        .sidebar-title {
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 12px;
            color: #2d3e4a;
            letter-spacing: 1px;
        }
        .sidebar-content-text { font-size: 10px; line-height: 1.5; color: #4a4a4a; }
        .sidebar { overflow-y: auto; overflow-x: hidden; height: 100%; }
        .main-content {
            padding: 80px 40px 40px 40px;
            position: relative;
            z-index: 1;
            height: 100%;
            overflow-y: auto;
            overflow-x: hidden;
        }
        .main-content-wrapper {
            height: calc(297mm - 140px);
            max-height: calc(297mm - 140px);
            overflow-y: auto;
            overflow-x: hidden;
        }
        .name { font-size: 36px; font-weight: bold; color: #2d3e4a; margin-bottom: 8px; }
        .job-title { font-size: 16px; color: #4a5f73; margin-bottom: 15px; }
        .section { margin-bottom: 20px; }
        .section-title {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            color: #2d3e4a;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #4a5f73;
        }
        .section-content { font-size: 11px; line-height: 1.6; color: #4a4a4a; }
        .work-entry, .education-entry { margin-bottom: 12px; }
        .work-role { font-weight: bold; font-size: 11px; margin-bottom: 2px; }
        .work-company { font-size: 11px; margin-bottom: 2px; }
        .work-dates { font-size: 10px; color: #666; margin-bottom: 4px; }
        .work-bullets { margin-left: 15px; font-size: 10px; line-height: 1.4; }
        .work-bullets li { margin-bottom: 3px; }
        .skill-item { display: block; margin-bottom: 4px; font-size: 10px; }
    </style>
</head>
<body>
    <div class="page">
        <div class="top-decoration">
            <div class="stripe stripe1"></div>
            <div class="stripe stripe2"></div>
            <div class="stripe stripe3"></div>
        </div>
        <div class="sidebar">
            <div class="profile-photo">${nameInitials}</div>
            <div class="sidebar-section">
                <div class="sidebar-title">Contact</div>
                <div class="sidebar-content-text">
                    ${personalDetails.phone ? `<div style="margin-bottom: 5px;">${personalDetails.phone}</div>` : ''}
                    ${personalDetails.email ? `<div style="margin-bottom: 5px;">${personalDetails.email}</div>` : ''}
                    ${personalDetails.location ? `<div style="margin-bottom: 5px;">${personalDetails.location}</div>` : ''}
                    ${personalDetails.linkedin ? `<div style="margin-bottom: 5px;">${personalDetails.linkedin}</div>` : ''}
                </div>
            </div>
            ${education && education.length > 0 ? `
            <div class="sidebar-section">
                <div class="sidebar-title">Education</div>
                <div class="sidebar-content-text">
                    ${education.map(edu => `
                        <div style="margin-bottom: 12px;">
                            <div style="font-weight: bold;">${edu.degree}</div>
                            <div>${edu.institution}</div>
                            <div style="font-size: 9px; color: #666;">${edu.years}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            ${skills && skills.length > 0 ? `
            <div class="sidebar-section">
                <div class="sidebar-title">Skills</div>
                <div class="sidebar-content-text">
                    ${skills.map(skill => `<div class="skill-item">${skill}</div>`).join('')}
                </div>
            </div>
            ` : ''}
        </div>
        <div class="main-content">
            <div class="main-content-wrapper">
            <div class="name">${personalDetails.name || ''}</div>
            <div class="job-title">${personalDetails.title || ''}</div>
            ${summary ? `
            <div class="section">
                <div class="section-title">Professional Summary</div>
                <div class="section-content">${summary}</div>
            </div>
            ` : ''}
            ${experience && experience.length > 0 ? `
            <div class="section">
                <div class="section-title">Experience</div>
                <div class="section-content">
                    ${experience.map(exp => `
                        <div class="work-entry">
                            <div class="work-role">${exp.role}</div>
                            <div class="work-company">${exp.company}</div>
                            <div class="work-dates">${exp.years}</div>
                            ${exp.bullets && exp.bullets.length > 0 ? `
                                <ul class="work-bullets">
                                    ${exp.bullets.map(bullet => `<li>${bullet}</li>`).join('')}
                                </ul>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            ${projects && projects.length > 0 ? `
            <div class="section">
                <div class="section-title">Projects</div>
                <div class="section-content">
                    ${projects.map(proj => `
                        <div class="work-entry">
                            <div class="work-role">${proj.title}</div>
                            <div class="work-company">${proj.description}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            </div>
        </div>
    </div>
</body>
</html>`;
};

// Template 12 Renderer (Creative Layout - grid with dark blue sidebar)
export const renderTemplate12 = (data: CVData): string => {
  const { personalDetails, summary, experience, education, skills, projects, certifications, languages } = data;
  
  const nameInitials = (personalDetails.name || '').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV Template</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: A4; margin: 0; }
        body {
            font-family: 'Segoe UI', 'Open Sans', Arial, sans-serif;
            background: white;
            margin: 0;
            padding: 0;
        }
        .page {
            width: 210mm;
            height: 297mm;
            max-height: 297mm;
            background: white;
            margin: 0;
            padding: 15mm 0;
            display: grid;
            grid-template-columns: 315px 1fr;
            overflow: hidden;
            position: relative;
        }
        .sidebar {
            background: #1e3d52;
            color: white;
            padding: 0 10mm;
        }
        .profile-section {
            padding: 50px 40px 30px 40px;
            text-align: center;
        }
        .profile-photo {
            width: 200px;
            height: 200px;
            border-radius: 50%;
            background: linear-gradient(135deg, #4a90a4 0%, #2c5f73 100%);
            margin: 0 auto 30px auto;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 70px;
            color: white;
            font-weight: bold;
            border: 8px solid white;
        }
        .name { font-size: 28px; font-weight: bold; color: white; margin-bottom: 8px; }
        .job-title { font-size: 14px; color: #a0c4d0; margin-bottom: 20px; }
        .sidebar-content { padding: 0 40px 40px 40px; overflow-y: auto; overflow-x: hidden; height: calc(297mm - 280px); max-height: calc(297mm - 280px); }
        .sidebar-section { margin-bottom: 25px; }
        .sidebar-title {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 12px;
            letter-spacing: 2px;
            padding-bottom: 8px;
            border-bottom: 2px solid rgba(255,255,255,0.3);
        }
        .sidebar-content-text { font-size: 11px; line-height: 1.5; }
        .sidebar { overflow-y: auto; overflow-x: hidden; height: 100%; }
        .main-content {
            padding: 50px 40px 40px 40px;
            height: 100%;
            overflow-y: auto;
            overflow-x: hidden;
        }
        .main-content-wrapper {
            height: calc(297mm - 90px);
            max-height: calc(297mm - 90px);
            overflow-y: auto;
            overflow-x: hidden;
        }
        .section { margin-bottom: 20px; }
        .section-title {
            font-size: 16px;
            font-weight: bold;
            text-transform: uppercase;
            color: #1e3d52;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #1e3d52;
        }
        .section-content { font-size: 11px; line-height: 1.6; color: #4a4a4a; }
        .work-entry, .education-entry { margin-bottom: 12px; }
        .work-role { font-weight: bold; font-size: 11px; margin-bottom: 2px; }
        .work-company { font-size: 11px; margin-bottom: 2px; }
        .work-dates { font-size: 10px; color: #666; margin-bottom: 4px; }
        .work-bullets { margin-left: 15px; font-size: 10px; line-height: 1.4; }
        .work-bullets li { margin-bottom: 3px; }
        .contact-item { margin-bottom: 6px; font-size: 11px; }
    </style>
</head>
<body>
    <div class="page">
        <div class="sidebar">
            <div class="profile-section">
                <div class="profile-photo">${nameInitials}</div>
                <div class="name">${personalDetails.name || ''}</div>
                <div class="job-title">${personalDetails.title || ''}</div>
            </div>
            <div class="sidebar-content">
                <div class="sidebar-section">
                    <div class="sidebar-title">Contact</div>
                    <div class="sidebar-content-text">
                        ${personalDetails.phone ? `<div class="contact-item">${personalDetails.phone}</div>` : ''}
                        ${personalDetails.email ? `<div class="contact-item">${personalDetails.email}</div>` : ''}
                        ${personalDetails.location ? `<div class="contact-item">${personalDetails.location}</div>` : ''}
                        ${personalDetails.linkedin ? `<div class="contact-item">${personalDetails.linkedin}</div>` : ''}
                    </div>
                </div>
                ${education && education.length > 0 ? `
                <div class="sidebar-section">
                    <div class="sidebar-title">Education</div>
                    <div class="sidebar-content-text">
                        ${education.map(edu => `
                            <div style="margin-bottom: 12px;">
                                <div style="font-weight: bold;">${edu.degree}</div>
                                <div>${edu.institution}</div>
                                <div style="font-size: 10px; opacity: 0.8;">${edu.years}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                ${skills && skills.length > 0 ? `
                <div class="sidebar-section">
                    <div class="sidebar-title">Skills</div>
                    <div class="sidebar-content-text">
                        ${skills.map(skill => `<div style="margin-bottom: 5px;">${skill}</div>`).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
        <div class="main-content">
            <div class="main-content-wrapper">
            ${summary ? `
            <div class="section">
                <div class="section-title">Professional Summary</div>
                <div class="section-content">${summary}</div>
            </div>
            ` : ''}
            ${experience && experience.length > 0 ? `
            <div class="section">
                <div class="section-title">Experience</div>
                <div class="section-content">
                    ${experience.map(exp => `
                        <div class="work-entry">
                            <div class="work-role">${exp.role}</div>
                            <div class="work-company">${exp.company}</div>
                            <div class="work-dates">${exp.years}</div>
                            ${exp.bullets && exp.bullets.length > 0 ? `
                                <ul class="work-bullets">
                                    ${exp.bullets.map(bullet => `<li>${bullet}</li>`).join('')}
                                </ul>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            ${projects && projects.length > 0 ? `
            <div class="section">
                <div class="section-title">Projects</div>
                <div class="section-content">
                    ${projects.map(proj => `
                        <div class="work-entry">
                            <div class="work-role">${proj.title}</div>
                            <div class="work-company">${proj.description}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            </div>
        </div>
    </div>
</body>
</html>`;
};

// Template 14 Renderer (Startup Bold - two-column with initials background)
export const renderTemplate14 = (data: CVData): string => {
  const { personalDetails, summary, experience, education, skills, projects, certifications, languages } = data;
  
  const nameInitials = (personalDetails.name || '').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CV Template</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: A4; margin: 0; }
        body {
            font-family: 'Calibri', 'Arial', sans-serif;
            background: white;
            margin: 0;
            padding: 0;
        }
        .cv-container {
            width: 210mm;
            height: 297mm;
            max-height: 297mm;
            background: white;
            margin: 0;
            padding: 15mm 0;
            overflow: hidden;
            position: relative;
        }
        .header {
            text-align: center;
            padding-bottom: 25px;
            margin-bottom: 30px;
            border-bottom: 2px solid #666;
            border-top: 2px solid #666;
            padding-top: 15px;
            position: relative;
        }
        .initials-bg {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 180px;
            font-weight: bold;
            color: rgba(230, 230, 230, 0.3);
            font-style: italic;
            z-index: 0;
            letter-spacing: 10px;
        }
        .header-content { position: relative; z-index: 1; }
        .name {
            font-size: 36px;
            font-weight: 500;
            color: #4a4a4a;
            text-transform: uppercase;
            letter-spacing: 12px;
            margin-bottom: 8px;
        }
        .job-title {
            font-size: 13px;
            color: #666;
            font-weight: 400;
            letter-spacing: 3px;
            text-transform: uppercase;
        }
        .content-wrapper {
            display: grid;
            grid-template-columns: 0.7fr 1.3fr;
            gap: 25px;
            height: calc(297mm - 150px);
            max-height: calc(297mm - 150px);
            overflow: hidden;
            padding: 0 10mm;
        }
        .left-column { 
            padding-right: 20px; 
            overflow-y: auto;
            overflow-x: hidden;
            height: 100%;
        }
        .right-column { 
            overflow-y: auto;
            overflow-x: hidden;
            height: 100%;
        }
        .section { margin-bottom: 18px; }
        .section-title {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            color: #4a4a4a;
            margin-bottom: 12px;
            padding-bottom: 6px;
            border-bottom: 1px solid #ccc;
        }
        .section-content { font-size: 11px; line-height: 1.6; color: #4a4a4a; }
        .work-entry, .education-entry { margin-bottom: 12px; }
        .work-role { font-weight: bold; font-size: 11px; margin-bottom: 2px; }
        .work-company { font-size: 11px; margin-bottom: 2px; }
        .work-dates { font-size: 10px; color: #666; margin-bottom: 4px; }
        .work-bullets { margin-left: 15px; font-size: 10px; line-height: 1.4; }
        .work-bullets li { margin-bottom: 3px; }
        .skill-item { display: block; margin-bottom: 4px; font-size: 11px; }
        .contact-item { margin-bottom: 6px; font-size: 11px; }
    </style>
</head>
<body>
    <div class="cv-container">
        <div class="header">
            <div class="initials-bg">${nameInitials}</div>
            <div class="header-content">
                <div class="name">${personalDetails.name || ''}</div>
                <div class="job-title">${personalDetails.title || ''}</div>
            </div>
        </div>
        <div class="content-wrapper">
            <div class="left-column">
                ${summary ? `
                <div class="section">
                    <div class="section-title">Summary</div>
                    <div class="section-content">${summary}</div>
                </div>
                ` : ''}
                <div class="section">
                    <div class="section-title">Contact</div>
                    <div class="section-content">
                        ${personalDetails.phone ? `<div class="contact-item">${personalDetails.phone}</div>` : ''}
                        ${personalDetails.email ? `<div class="contact-item">${personalDetails.email}</div>` : ''}
                        ${personalDetails.location ? `<div class="contact-item">${personalDetails.location}</div>` : ''}
                        ${personalDetails.linkedin ? `<div class="contact-item">${personalDetails.linkedin}</div>` : ''}
                    </div>
                </div>
                ${education && education.length > 0 ? `
                <div class="section">
                    <div class="section-title">Education</div>
                    <div class="section-content">
                        ${education.map(edu => `
                            <div class="education-entry">
                                <div style="font-weight: bold;">${edu.degree}</div>
                                <div>${edu.institution}</div>
                                <div style="font-size: 10px; color: #666;">${edu.years}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                ${skills && skills.length > 0 ? `
                <div class="section">
                    <div class="section-title">Skills</div>
                    <div class="section-content">
                        ${skills.map(skill => `<div class="skill-item">${skill}</div>`).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
            <div class="right-column">
                ${experience && experience.length > 0 ? `
                <div class="section">
                    <div class="section-title">Experience</div>
                    <div class="section-content">
                        ${experience.map(exp => `
                            <div class="work-entry">
                                <div class="work-role">${exp.role}</div>
                                <div class="work-company">${exp.company}</div>
                                <div class="work-dates">${exp.years}</div>
                                ${exp.bullets && exp.bullets.length > 0 ? `
                                    <ul class="work-bullets">
                                        ${exp.bullets.map(bullet => `<li>${bullet}</li>`).join('')}
                                    </ul>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                ${projects && projects.length > 0 ? `
                <div class="section">
                    <div class="section-title">Projects</div>
                    <div class="section-content">
                        ${projects.map(proj => `
                            <div class="work-entry">
                                <div class="work-role">${proj.title}</div>
                                <div class="work-company">${proj.description}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    </div>
</body>
</html>`;
};

// Template registry
export const templateRenderers: Record<string, (data: CVData) => string> = {
  'template-1': renderTemplate1,
  'template-2': renderTemplate2,
  'template-3': renderTemplate3,
  'template-4': renderTemplate4,
  'template-5': renderTemplate5,
  'template-6': renderTemplate7,  // Old template-7 → New template-6
  'template-7': renderTemplate9,  // Old template-9 → New template-7
  'template-8': renderTemplate10, // Old template-10 → New template-8
  'template-9': renderTemplate12, // Old template-12 → New template-9
  'template-10': renderTemplate14, // Old template-14 → New template-10
};

export const renderCVTemplate = (templateId: string, data: CVData): string => {
  const renderer = templateRenderers[templateId];
  if (!renderer) {
    return templateRenderers['template-1'](data); // Fallback to template 1
  }
  return renderer(data);
};


