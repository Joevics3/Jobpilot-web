// CV Template Renderer - Renders structured CVData to HTML for different templates
// All templates enforce strict 1-page A4 format

import { CVData } from '@/lib/types/cv';

// Base CSS for A4 page (strict 1 page) - optimized for PDF conversion and responsive viewing
const baseCss = `
  @page { 
    size: A4;
    margin: 0;
  }
  @media print {
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    html, body { 
      width: 210mm;
      min-height: 297mm;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }
    body { margin: 0; padding: 0; }
    .page { 
      width: 210mm;
      min-height: 297mm;
      max-height: 297mm;
      page-break-after: avoid;
      page-break-inside: avoid;
    }
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { 
    width: 100%;
    margin: 0;
    padding: 0;
    background: #ffffff;
    font-family: Arial, Helvetica, sans-serif;
  }
  .page { 
    width: 100%;
    max-width: 210mm;
    margin: 0 auto;
    background: #ffffff;
    padding: 20px;
    position: relative;
  }
  @media (min-width: 768px) {
    .page {
      padding: 50px;
    }
  }
`;

// Helper to escape HTML
function htmlEscape(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper to format bullets
function formatBullets(bullets: string[]): string {
  return bullets.filter(Boolean).map(b => `<li style="margin-bottom: 2mm; line-height: 1.4;">${htmlEscape(b)}</li>`).join('');
}

// Estimate section height in mm
function estimateSectionHeight(sectionType: string, data: CVData, sectionKey?: string): number {
  const BASE_SECTION_HEIGHT = 8; // Title + padding
  const LINE_HEIGHT_MM = 4; // Average line height in mm
  const BULLET_HEIGHT = 4; // Per bullet point
  const ENTRY_HEIGHT = 12; // Per work/education entry
  
  switch (sectionType) {
    case 'summary':
      const summaryLines = Math.max(3, Math.ceil((data.summary?.length || 0) / 60));
      return BASE_SECTION_HEIGHT + (summaryLines * LINE_HEIGHT_MM);
    
    case 'experience':
      let expHeight = BASE_SECTION_HEIGHT;
      (data.experience || []).forEach(exp => {
        expHeight += ENTRY_HEIGHT;
        expHeight += (exp.bullets?.length || 0) * BULLET_HEIGHT;
      });
      return expHeight;
    
    case 'education':
      return BASE_SECTION_HEIGHT + ((data.education?.length || 0) * ENTRY_HEIGHT);
    
    case 'skills':
      const skillLines = Math.ceil((data.skills?.length || 0) / 8);
      return BASE_SECTION_HEIGHT + Math.max(1, skillLines) * LINE_HEIGHT_MM;
    
    case 'projects':
      return BASE_SECTION_HEIGHT + ((data.projects?.length || 0) * 8);
    
    case 'accomplishments':
      return BASE_SECTION_HEIGHT + ((data.accomplishments?.length || 0) * 4);
    
    case 'awards':
      return BASE_SECTION_HEIGHT + ((data.awards?.length || 0) * 6);
    
    case 'certifications':
      return BASE_SECTION_HEIGHT + ((data.certifications?.length || 0) * 6);
    
    case 'languages':
      return BASE_SECTION_HEIGHT + LINE_HEIGHT_MM;
    
    case 'interests':
      return BASE_SECTION_HEIGHT + LINE_HEIGHT_MM;
    
    case 'publications':
      return BASE_SECTION_HEIGHT + ((data.publications?.length || 0) * 6);
    
    case 'volunteerWork':
      return BASE_SECTION_HEIGHT + ((data.volunteerWork?.length || 0) * 10);
    
    case 'additionalSections':
      const additionalSection = data.additionalSections?.find(s => s.sectionName === sectionKey);
      if (additionalSection) {
        const lines = Math.ceil((additionalSection.content?.length || 0) / 60);
        return BASE_SECTION_HEIGHT + (lines * LINE_HEIGHT_MM);
      }
      return BASE_SECTION_HEIGHT;
    
    case 'roles':
      return BASE_SECTION_HEIGHT + ((data.roles?.length || 0) * 4);
    
    default:
      return BASE_SECTION_HEIGHT + LINE_HEIGHT_MM * 2;
  }
}

// Calculate smart spacing based on actual content height
function calculateSpacing(data: CVData): { spacing: number; useDistribution: boolean } {
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
  if (data.roles && data.roles.length > 0) {
    totalContentHeight += estimateSectionHeight('roles', data);
    sectionOrder.push({ type: 'roles' });
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
}

// Template 1: Purple Classic
function renderTemplate1(data: CVData): string {
  // Calculate smart spacing based on actual content height
  const { spacing, useDistribution } = calculateSpacing(data);
  const contentJustify = useDistribution ? 'justify-content: space-between;' : 'justify-content: flex-start;';
  
  const css = `
    ${baseCss}
    .page { padding: 12mm 10mm; }
    .header { text-align: center; border-bottom: 2px solid #7c3aed; padding-bottom: 8mm; margin-bottom: 8mm; }
    .name { font-size: 28pt; font-weight: bold; color: #7c3aed; margin-bottom: 4mm; }
    .title { font-size: 14pt; color: #666; margin-bottom: 3mm; }
    .contact { font-size: 10pt; color: #555; }
    .content {
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
    .section-title { font-size: 14pt; font-weight: bold; color: #7c3aed; border-bottom: 1px solid #e5e7eb; padding-bottom: 2mm; margin-bottom: 4mm; }
    .experience-item, .education-item { margin-bottom: 4mm; }
    .item-header { font-weight: bold; font-size: 11pt; color: #333; margin-bottom: 1mm; }
    .item-subheader { font-size: 10pt; color: #666; margin-bottom: 2mm; }
    ul { margin-left: 5mm; margin-top: 2mm; }
    li { font-size: 10pt; line-height: 1.4; margin-bottom: 1mm; }
    .skills { display: flex; flex-wrap: wrap; gap: 2mm; }
    .skill { background: #f3f4f6; padding: 2mm 4mm; border-radius: 3mm; font-size: 10pt; }
  `;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${css}</style></head><body>
    <div class="page">
      <div class="header">
        <div class="name">${htmlEscape(data.personalDetails.name)}</div>
        <div class="title">${htmlEscape(data.personalDetails.title)}</div>
        <div class="contact">${[data.personalDetails.email, data.personalDetails.phone, data.personalDetails.location].filter(Boolean).map(htmlEscape).join(' | ')}</div>
      </div>
      
      <div class="content">
        ${data.summary ? `<div class="section"><div class="section-title">Professional Summary</div><div style="font-size: 10pt; line-height: 1.5; text-align: justify;">${htmlEscape(data.summary)}</div></div>` : ''}
      
      ${data.roles && data.roles.length > 0 ? `<div class="section">
        <div class="section-title">Professional Roles</div>
        <div style="font-size: 10pt; line-height: 1.6;">
          ${data.roles.map(role => `<div style="margin-bottom: 2mm;">• ${htmlEscape(role)}</div>`).join('')}
        </div>
      </div>` : ''}
      
      ${data.experience && data.experience.length > 0 ? `<div class="section">
        <div class="section-title">Work Experience</div>
        ${data.experience.map(exp => `
          <div class="experience-item">
            <div class="item-header">${htmlEscape(exp.role)}</div>
            <div class="item-subheader">${htmlEscape(exp.company)} | ${htmlEscape(exp.years)}</div>
            <ul>${formatBullets(exp.bullets)}</ul>
          </div>
        `).join('')}
      </div>` : ''}
      
      ${data.education && data.education.length > 0 ? `<div class="section">
        <div class="section-title">Education</div>
        ${data.education.map(edu => `
          <div class="education-item">
            <div class="item-header">${htmlEscape(edu.degree)}</div>
            <div class="item-subheader">${htmlEscape(edu.institution)} | ${htmlEscape(edu.years)}</div>
          </div>
        `).join('')}
      </div>` : ''}
      
      ${data.projects && data.projects.length > 0 ? `<div class="section">
        <div class="section-title">Projects</div>
        ${data.projects.map(proj => `
          <div class="experience-item">
            <div class="item-header">${htmlEscape(proj.title)}</div>
            <div style="font-size: 10pt; line-height: 1.5; margin-top: 2mm;">${htmlEscape(proj.description)}</div>
          </div>
        `).join('')}
      </div>` : ''}
      
      ${data.accomplishments && data.accomplishments.length > 0 ? `<div class="section">
        <div class="section-title">Key Accomplishments</div>
        <ul style="margin-left: 5mm;">${data.accomplishments.map(acc => `<li style="font-size: 10pt; line-height: 1.5; margin-bottom: 2mm;">${htmlEscape(acc)}</li>`).join('')}</ul>
      </div>` : ''}
      
      ${data.awards && data.awards.length > 0 ? `<div class="section">
        <div class="section-title">Awards</div>
        ${data.awards.map(award => `
          <div class="education-item">
            <div class="item-header">${htmlEscape(award.title)}${award.issuer ? ` - ${htmlEscape(award.issuer)}` : ''}${award.year ? ` (${htmlEscape(award.year)})` : ''}</div>
          </div>
        `).join('')}
      </div>` : ''}
      
      ${data.certifications && data.certifications.length > 0 ? `<div class="section">
        <div class="section-title">Certifications</div>
        ${data.certifications.map(cert => `
          <div class="education-item">
            <div class="item-header">${htmlEscape(cert.name)}${cert.issuer ? ` - ${htmlEscape(cert.issuer)}` : ''}${cert.year ? ` (${htmlEscape(cert.year)})` : ''}</div>
          </div>
        `).join('')}
      </div>` : ''}
      
      ${data.skills && data.skills.length > 0 ? `<div class="section">
        <div class="section-title">Skills</div>
        <div class="skills">${data.skills.slice(0, 15).map(skill => `<span class="skill">${htmlEscape(skill)}</span>`).join('')}</div>
      </div>` : ''}
      
      ${data.languages && data.languages.length > 0 ? `<div class="section">
        <div class="section-title">Languages</div>
        <div class="skills">${data.languages.map(lang => `<span class="skill">${htmlEscape(lang)}</span>`).join('')}</div>
      </div>` : ''}
      
      ${data.interests && data.interests.length > 0 ? `<div class="section">
        <div class="section-title">Interests</div>
        <div class="skills">${data.interests.map(int => `<span class="skill">${htmlEscape(int)}</span>`).join('')}</div>
      </div>` : ''}
      
      ${data.publications && data.publications.length > 0 ? `<div class="section">
        <div class="section-title">Publications</div>
        ${data.publications.map(pub => `
          <div class="education-item">
            <div class="item-header">${htmlEscape(pub.title)}${pub.journal ? ` - ${htmlEscape(pub.journal)}` : ''}${pub.year ? ` (${htmlEscape(pub.year)})` : ''}</div>
          </div>
        `).join('')}
      </div>` : ''}
      
      ${data.volunteerWork && data.volunteerWork.length > 0 ? `<div class="section">
        <div class="section-title">Volunteer Work</div>
        ${data.volunteerWork.map(vol => `
          <div class="experience-item">
            <div class="item-header">${htmlEscape(vol.role || 'Volunteer')}${vol.organization ? ` - ${htmlEscape(vol.organization)}` : ''}</div>
            ${vol.duration ? `<div class="item-subheader">${htmlEscape(vol.duration)}</div>` : ''}
            ${vol.description ? `<div style="font-size: 10pt; line-height: 1.5; margin-top: 2mm;">${htmlEscape(vol.description)}</div>` : ''}
          </div>
        `).join('')}
      </div>` : ''}
      
      ${data.additionalSections && data.additionalSections.length > 0 ? data.additionalSections.map(section => `
        <div class="section">
          <div class="section-title">${htmlEscape(section.sectionName)}</div>
          <div style="font-size: 10pt; line-height: 1.5;">${htmlEscape(section.content)}</div>
        </div>
      `).join('') : ''}
      </div>
    </div>
  </body></html>`;
}

// Template 2: Burgundy Elegant
function renderTemplate2(data: CVData): string {
  // Calculate smart spacing based on actual content height
  const { spacing, useDistribution } = calculateSpacing(data);
  const contentJustify = useDistribution ? 'justify-content: space-between;' : 'justify-content: flex-start;';
  
  const css = `
    ${baseCss}
    .page { padding: 12mm 10mm; }
    .header { border-bottom: 3px solid #800020; padding-bottom: 8mm; margin-bottom: 8mm; }
    .header-left { display: flex; flex-direction: column; }
    .name { font-size: 32pt; font-weight: bold; color: #800020; margin-bottom: 3mm; }
    .title { font-size: 13pt; color: #666; margin-bottom: 4mm; font-style: italic; }
    .contact { font-size: 9.5pt; color: #555; display: flex; flex-wrap: wrap; gap: 4mm; }
    .content {
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
    .section-title { font-size: 15pt; font-weight: bold; color: #800020; border-bottom: 2px solid #800020; padding-bottom: 2mm; margin-bottom: 4mm; text-transform: uppercase; letter-spacing: 0.5pt; }
    .experience-item, .education-item { margin-bottom: 4mm; padding-left: 3mm; border-left: 2px solid #e5e7eb; padding-left: 5mm; }
    .item-header { font-weight: bold; font-size: 11.5pt; color: #333; margin-bottom: 1mm; }
    .item-subheader { font-size: 10pt; color: #666; margin-bottom: 2mm; font-style: italic; }
    ul { margin-left: 5mm; margin-top: 2mm; }
    li { font-size: 10pt; line-height: 1.4; margin-bottom: 1mm; }
    .skills { display: flex; flex-wrap: wrap; gap: 2mm; }
    .skill { background: #f9fafb; border: 1px solid #800020; padding: 2mm 4mm; border-radius: 3mm; font-size: 9.5pt; color: #800020; }
  `;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${css}</style></head><body>
    <div class="page">
      <div class="header">
        <div class="header-left">
          <div class="name">${htmlEscape(data.personalDetails.name)}</div>
          <div class="title">${htmlEscape(data.personalDetails.title)}</div>
          <div class="contact">${[data.personalDetails.email, data.personalDetails.phone, data.personalDetails.location].filter(Boolean).map(htmlEscape).join(' • ')}</div>
        </div>
      </div>
      
      <div class="content">
        ${data.summary ? `<div class="section"><div class="section-title">Professional Summary</div><div style="font-size: 10pt; line-height: 1.5; text-align: justify;">${htmlEscape(data.summary)}</div></div>` : ''}
      
      ${data.roles && data.roles.length > 0 ? `<div class="section">
        <div class="section-title">Professional Roles</div>
        <div style="font-size: 10pt; line-height: 1.6;">
          ${data.roles.map(role => `<div style="margin-bottom: 2mm;">• ${htmlEscape(role)}</div>`).join('')}
        </div>
      </div>` : ''}
      
      ${data.experience && data.experience.length > 0 ? `<div class="section">
        <div class="section-title">Work Experience</div>
        ${data.experience.map(exp => `
          <div class="experience-item">
            <div class="item-header">${htmlEscape(exp.role)}</div>
            <div class="item-subheader">${htmlEscape(exp.company)} | ${htmlEscape(exp.years)}</div>
            <ul>${formatBullets(exp.bullets)}</ul>
          </div>
        `).join('')}
      </div>` : ''}
      
      ${data.education && data.education.length > 0 ? `<div class="section">
        <div class="section-title">Education</div>
        ${data.education.map(edu => `
          <div class="education-item">
            <div class="item-header">${htmlEscape(edu.degree)}</div>
            <div class="item-subheader">${htmlEscape(edu.institution)} | ${htmlEscape(edu.years)}</div>
          </div>
        `).join('')}
      </div>` : ''}
      
      ${data.projects && data.projects.length > 0 ? `<div class="section">
        <div class="section-title">Projects</div>
        ${data.projects.map(proj => `
          <div class="experience-item">
            <div class="item-header">${htmlEscape(proj.title)}</div>
            <div style="font-size: 10pt; line-height: 1.5; margin-top: 2mm;">${htmlEscape(proj.description)}</div>
          </div>
        `).join('')}
      </div>` : ''}
      
      ${data.accomplishments && data.accomplishments.length > 0 ? `<div class="section">
        <div class="section-title">Key Accomplishments</div>
        <ul style="margin-left: 5mm;">${data.accomplishments.map(acc => `<li style="font-size: 10pt; line-height: 1.5; margin-bottom: 2mm;">${htmlEscape(acc)}</li>`).join('')}</ul>
      </div>` : ''}
      
      ${data.awards && data.awards.length > 0 ? `<div class="section">
        <div class="section-title">Awards</div>
        ${data.awards.map(award => `
          <div class="education-item">
            <div class="item-header">${htmlEscape(award.title)}${award.issuer ? ` - ${htmlEscape(award.issuer)}` : ''}${award.year ? ` (${htmlEscape(award.year)})` : ''}</div>
          </div>
        `).join('')}
      </div>` : ''}
      
      ${data.certifications && data.certifications.length > 0 ? `<div class="section">
        <div class="section-title">Certifications</div>
        ${data.certifications.map(cert => `
          <div class="education-item">
            <div class="item-header">${htmlEscape(cert.name)}${cert.issuer ? ` - ${htmlEscape(cert.issuer)}` : ''}${cert.year ? ` (${htmlEscape(cert.year)})` : ''}</div>
          </div>
        `).join('')}
      </div>` : ''}
      
      ${data.skills && data.skills.length > 0 ? `<div class="section">
        <div class="section-title">Skills</div>
        <div class="skills">${data.skills.slice(0, 15).map(skill => `<span class="skill">${htmlEscape(skill)}</span>`).join('')}</div>
      </div>` : ''}
      
      ${data.languages && data.languages.length > 0 ? `<div class="section">
        <div class="section-title">Languages</div>
        <div class="skills">${data.languages.map(lang => `<span class="skill">${htmlEscape(lang)}</span>`).join('')}</div>
      </div>` : ''}
      
      ${data.interests && data.interests.length > 0 ? `<div class="section">
        <div class="section-title">Interests</div>
        <div class="skills">${data.interests.map(int => `<span class="skill">${htmlEscape(int)}</span>`).join('')}</div>
      </div>` : ''}
      
      ${data.publications && data.publications.length > 0 ? `<div class="section">
        <div class="section-title">Publications</div>
        ${data.publications.map(pub => `
          <div class="education-item">
            <div class="item-header">${htmlEscape(pub.title)}${pub.journal ? ` - ${htmlEscape(pub.journal)}` : ''}${pub.year ? ` (${htmlEscape(pub.year)})` : ''}</div>
          </div>
        `).join('')}
      </div>` : ''}
      
      ${data.volunteerWork && data.volunteerWork.length > 0 ? `<div class="section">
        <div class="section-title">Volunteer Work</div>
        ${data.volunteerWork.map(vol => `
          <div class="experience-item">
            <div class="item-header">${htmlEscape(vol.role || 'Volunteer')}${vol.organization ? ` - ${htmlEscape(vol.organization)}` : ''}</div>
            ${vol.duration ? `<div class="item-subheader">${htmlEscape(vol.duration)}</div>` : ''}
            ${vol.description ? `<div style="font-size: 10pt; line-height: 1.5; margin-top: 2mm;">${htmlEscape(vol.description)}</div>` : ''}
          </div>
        `).join('')}
      </div>` : ''}
      
      ${data.additionalSections && data.additionalSections.length > 0 ? data.additionalSections.map(section => `
        <div class="section">
          <div class="section-title">${htmlEscape(section.sectionName)}</div>
          <div style="font-size: 10pt; line-height: 1.5;">${htmlEscape(section.content)}</div>
        </div>
      `).join('') : ''}
      </div>
    </div>
  </body></html>`;
}

// Template 3: Purple Modern (Minimal)
function renderTemplate3(data: CVData): string {
  // Calculate smart spacing based on actual content height
  const { spacing, useDistribution } = calculateSpacing(data);
  const contentJustify = useDistribution ? 'justify-content: space-between;' : 'justify-content: flex-start;';
  
  const css = `
    ${baseCss}
    .page { padding: 15mm 12mm; }
    .header { text-align: left; margin-bottom: 10mm; }
    .name { font-size: 30pt; font-weight: 300; color: #6b21a8; margin-bottom: 2mm; letter-spacing: 1pt; }
    .title { font-size: 12pt; color: #9ca3af; margin-bottom: 3mm; font-weight: 300; }
    .contact { font-size: 9pt; color: #6b7280; line-height: 1.8; }
    .content {
      --section-spacing: ${spacing}mm;
      height: 197mm;
      max-height: 197mm;
      display: flex;
      flex-direction: column;
      ${contentJustify}
      overflow: hidden;
    }
    .section { margin-bottom: var(--section-spacing); page-break-inside: avoid; }
    .section:last-child { margin-bottom: 0; }
    .section-title { font-size: 11pt; font-weight: 600; color: #6b21a8; text-transform: uppercase; letter-spacing: 2pt; margin-bottom: 4mm; border-bottom: 1px solid #e5e7eb; padding-bottom: 1mm; }
    .experience-item, .education-item { margin-bottom: 5mm; }
    .item-header { font-weight: 600; font-size: 10.5pt; color: #111827; margin-bottom: 1mm; }
    .item-subheader { font-size: 9.5pt; color: #6b7280; margin-bottom: 2mm; }
    ul { margin-left: 4mm; margin-top: 2mm; }
    li { font-size: 9.5pt; line-height: 1.5; margin-bottom: 1mm; color: #374151; }
    .skills { display: flex; flex-wrap: wrap; gap: 2mm; }
    .skill { background: transparent; border: 1px solid #d1d5db; padding: 1.5mm 3.5mm; border-radius: 2mm; font-size: 9pt; color: #4b5563; }
  `;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${css}</style></head><body>
    <div class="page">
      <div class="header">
        <div class="name">${htmlEscape(data.personalDetails.name)}</div>
        <div class="title">${htmlEscape(data.personalDetails.title)}</div>
        <div class="contact">${[data.personalDetails.email, data.personalDetails.phone, data.personalDetails.location].filter(Boolean).map(htmlEscape).join(' / ')}</div>
      </div>
      
      <div class="content">
        ${data.summary ? `<div class="section"><div class="section-title">Summary</div><div style="font-size: 9.5pt; line-height: 1.6; text-align: left; color: #374151;">${htmlEscape(data.summary)}</div></div>` : ''}
      
      ${data.roles && data.roles.length > 0 ? `<div class="section">
        <div class="section-title">Roles</div>
        <div style="font-size: 9.5pt; line-height: 1.8; color: #374151;">
          ${data.roles.map(role => `<div style="margin-bottom: 1.5mm;">${htmlEscape(role)}</div>`).join('')}
        </div>
      </div>` : ''}
      
      ${data.experience && data.experience.length > 0 ? `<div class="section">
        <div class="section-title">Experience</div>
        ${data.experience.map(exp => `
          <div class="experience-item">
            <div class="item-header">${htmlEscape(exp.role)}</div>
            <div class="item-subheader">${htmlEscape(exp.company)} • ${htmlEscape(exp.years)}</div>
            <ul>${formatBullets(exp.bullets)}</ul>
          </div>
        `).join('')}
      </div>` : ''}
      
      ${data.education && data.education.length > 0 ? `<div class="section">
        <div class="section-title">Education</div>
        ${data.education.map(edu => `
          <div class="education-item">
            <div class="item-header">${htmlEscape(edu.degree)}</div>
            <div class="item-subheader">${htmlEscape(edu.institution)} • ${htmlEscape(edu.years)}</div>
          </div>
        `).join('')}
      </div>` : ''}
      
      ${data.projects && data.projects.length > 0 ? `<div class="section">
        <div class="section-title">Projects</div>
        ${data.projects.map(proj => `
          <div class="experience-item">
            <div class="item-header">${htmlEscape(proj.title)}</div>
            <div style="font-size: 9.5pt; line-height: 1.6; margin-top: 1.5mm; color: #374151;">${htmlEscape(proj.description)}</div>
          </div>
        `).join('')}
      </div>` : ''}
      
      ${data.accomplishments && data.accomplishments.length > 0 ? `<div class="section">
        <div class="section-title">Accomplishments</div>
        <ul style="margin-left: 4mm;">${data.accomplishments.map(acc => `<li style="font-size: 9.5pt; line-height: 1.6; margin-bottom: 1.5mm; color: #374151;">${htmlEscape(acc)}</li>`).join('')}</ul>
      </div>` : ''}
      
      ${data.awards && data.awards.length > 0 ? `<div class="section">
        <div class="section-title">Awards</div>
        ${data.awards.map(award => `
          <div class="education-item">
            <div class="item-header">${htmlEscape(award.title)}${award.issuer ? ` • ${htmlEscape(award.issuer)}` : ''}${award.year ? ` (${htmlEscape(award.year)})` : ''}</div>
          </div>
        `).join('')}
      </div>` : ''}
      
      ${data.certifications && data.certifications.length > 0 ? `<div class="section">
        <div class="section-title">Certifications</div>
        ${data.certifications.map(cert => `
          <div class="education-item">
            <div class="item-header">${htmlEscape(cert.name)}${cert.issuer ? ` • ${htmlEscape(cert.issuer)}` : ''}${cert.year ? ` (${htmlEscape(cert.year)})` : ''}</div>
          </div>
        `).join('')}
      </div>` : ''}
      
      ${data.skills && data.skills.length > 0 ? `<div class="section">
        <div class="section-title">Skills</div>
        <div class="skills">${data.skills.slice(0, 15).map(skill => `<span class="skill">${htmlEscape(skill)}</span>`).join('')}</div>
      </div>` : ''}
      
      ${data.languages && data.languages.length > 0 ? `<div class="section">
        <div class="section-title">Languages</div>
        <div class="skills">${data.languages.map(lang => `<span class="skill">${htmlEscape(lang)}</span>`).join('')}</div>
      </div>` : ''}
      
      ${data.interests && data.interests.length > 0 ? `<div class="section">
        <div class="section-title">Interests</div>
        <div class="skills">${data.interests.map(int => `<span class="skill">${htmlEscape(int)}</span>`).join('')}</div>
      </div>` : ''}
      
      ${data.publications && data.publications.length > 0 ? `<div class="section">
        <div class="section-title">Publications</div>
        ${data.publications.map(pub => `
          <div class="education-item">
            <div class="item-header">${htmlEscape(pub.title)}${pub.journal ? ` • ${htmlEscape(pub.journal)}` : ''}${pub.year ? ` (${htmlEscape(pub.year)})` : ''}</div>
          </div>
        `).join('')}
      </div>` : ''}
      
      ${data.volunteerWork && data.volunteerWork.length > 0 ? `<div class="section">
        <div class="section-title">Volunteer Work</div>
        ${data.volunteerWork.map(vol => `
          <div class="experience-item">
            <div class="item-header">${htmlEscape(vol.role || 'Volunteer')}${vol.organization ? ` • ${htmlEscape(vol.organization)}` : ''}</div>
            ${vol.duration ? `<div class="item-subheader">${htmlEscape(vol.duration)}</div>` : ''}
            ${vol.description ? `<div style="font-size: 9.5pt; line-height: 1.6; margin-top: 1.5mm; color: #374151;">${htmlEscape(vol.description)}</div>` : ''}
          </div>
        `).join('')}
      </div>` : ''}
      
      ${data.additionalSections && data.additionalSections.length > 0 ? data.additionalSections.map(section => `
        <div class="section">
          <div class="section-title">${htmlEscape(section.sectionName)}</div>
          <div style="font-size: 9.5pt; line-height: 1.6; color: #374151;">${htmlEscape(section.content)}</div>
        </div>
      `).join('') : ''}
      </div>
    </div>
  </body></html>`;
}


function renderTemplate5(data: CVData): string {
  // Template 5: Academic Single Column
  const {
    personalDetails,
    education,
    experience,
    projects,
    skills,
    accomplishments,
    certifications,
    awards,
    publications,
    volunteerWork,
    languages,
    interests,
    additionalSections
  } = data;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Professional CV</title>
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
            font-family: 'Computer Modern', 'Latin Modern Roman', serif;
            color: #000;
            background: white;
            line-height: 1.4;
        }

        .page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background: white;
            padding: 20mm 18mm;
        }

        .header {
            text-align: center;
            margin-bottom: 8px;
        }

        .header h1 {
            font-size: 32px;
            font-weight: 400;
            letter-spacing: 2px;
            margin-bottom: 6px;
        }

        .header .contact-info {
            font-size: 10px;
            color: #333;
        }

        .header .contact-info a {
            color: #333;
            text-decoration: none;
        }

        .section {
            margin-bottom: 16px;
        }

        .section-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            border-bottom: 1px solid #000;
            padding-bottom: 2px;
            margin-bottom: 8px;
        }

        .entry {
            margin-bottom: 12px;
        }

        .entry-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            margin-bottom: 2px;
        }

        .entry-title {
            font-weight: 700;
            font-size: 11px;
        }

        .entry-date {
            font-size: 10px;
            font-style: italic;
            white-space: nowrap;
        }

        .entry-subtitle {
            font-style: italic;
            font-size: 10px;
            margin-bottom: 4px;
        }

        .entry-description {
            font-size: 10px;
            line-height: 1.4;
            margin-bottom: 2px;
        }

        .entry-list {
            list-style: none;
            padding-left: 0;
            margin-top: 4px;
        }

        .entry-list li {
            font-size: 10px;
            line-height: 1.4;
            margin-bottom: 3px;
            padding-left: 12px;
            position: relative;
        }

        .entry-list li::before {
            content: '–';
            position: absolute;
            left: 0;
        }

        .skills-grid {
            display: grid;
            grid-template-columns: auto 1fr;
            gap: 4px 8px;
            font-size: 10px;
        }

        .skill-category {
            font-weight: 700;
        }

        .skill-items {
            line-height: 1.4;
        }

        .achievements-list {
            list-style: none;
            padding-left: 0;
        }

        .achievements-list li {
            font-size: 10px;
            line-height: 1.4;
            margin-bottom: 4px;
            padding-left: 12px;
            position: relative;
        }

        .achievements-list li::before {
            content: '•';
            position: absolute;
            left: 0;
            font-weight: bold;
        }

        .achievements-list strong {
            font-weight: 700;
        }

        @media print {
            body {
                margin: 0;
                padding: 0;
            }
            .page {
                margin: 0;
                page-break-after: always;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        <!-- Header -->
        <div class="header">
            <h1>${personalDetails.name || ''}</h1>
            <div class="contact-info">
                ${personalDetails.email ? `<a href="mailto:${personalDetails.email}">${personalDetails.email}</a>` : ''}
                ${personalDetails.phone ? ` | ${personalDetails.phone}` : ''}
                ${personalDetails.location ? ` | ${personalDetails.location}` : ''}
                ${personalDetails.github ? ` | <a href="${personalDetails.github}">GitHub</a>` : ''}
                ${personalDetails.linkedin ? ` | <a href="${personalDetails.linkedin}">LinkedIn</a>` : ''}
                ${personalDetails.portfolio ? ` | <a href="${personalDetails.portfolio}">Portfolio</a>` : ''}
            </div>
        </div>

        <!-- Education -->
        ${education && education.length > 0 ? `
        <div class="section">
            <div class="section-title">Education</div>
            ${education.map(edu => `
                <div class="entry">
                    <div class="entry-header">
                        <div class="entry-title">${edu.institution || ''}</div>
                        <div class="entry-date">${edu.years || ''}</div>
                    </div>
                    <div class="entry-subtitle">${edu.degree || ''}</div>
                </div>
            `).join('')}
        </div>
        ` : ''}

        <!-- Experience -->
        ${experience && experience.length > 0 ? `
        <div class="section">
            <div class="section-title">Experience</div>
            ${experience.map(exp => `
                <div class="entry">
                    <div class="entry-header">
                        <div class="entry-title">${exp.role || ''}</div>
                        <div class="entry-date">${exp.years || ''}</div>
                    </div>
                    <div class="entry-subtitle">${exp.company || ''}</div>
                    ${exp.bullets && exp.bullets.length > 0 ? `
                        <ul class="entry-list">
                            ${exp.bullets.map(bullet => `<li>${bullet}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        <!-- Projects -->
        ${projects && projects.length > 0 ? `
        <div class="section">
            <div class="section-title">Projects</div>
            ${projects.map(project => `
                <div class="entry">
                    <div class="entry-title">${project.title || ''}</div>
                    ${project.description ? `<div class="entry-subtitle">${project.description}</div>` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        <!-- Technical Skills -->
        ${technicalSkills && Object.keys(technicalSkills).length > 0 ? `
        <div class="section">
            <div class="section-title">Technical Skills</div>
            <div class="skills-grid">
                ${Object.entries(technicalSkills).map(([category, skills]) => `
                    <div class="skill-category">${category}:</div>
                    <div class="skill-items">${skills}</div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <!-- Achievements -->
        ${achievements && achievements.length > 0 ? `
        <div class="section">
            <div class="section-title">Achievements</div>
            <ul class="achievements-list">
                ${achievements.map(achievement => {
                    const formattedAchievement = achievement
                        .replace(/(\d+\+?)/g, '<strong>$1</strong>')
                        .replace(/(LeetCode|Codeforces|CodeChef|AtCoder|ICPC|Meta Hacker Cup|Smart India Hackathon|SIH)/g, '<strong>$1</strong>');
                    return `<li>${formattedAchievement}</li>`;
                }).join('')}
            </ul>
        </div>
        ` : ''}

        <!-- Certifications -->
        ${certifications && certifications.length > 0 ? `
        <div class="section">
            <div class="section-title">Certifications</div>
            <ul class="achievements-list">
                ${certifications.map(cert => typeof cert === 'string' ? `<li>${cert}</li>` : `
                    <li><strong>${cert.name || cert.title || ''}</strong>${cert.issuer ? ` - ${cert.issuer}` : ''}${cert.date ? ` (${cert.date})` : ''}</li>
                `).join('')}
            </ul>
        </div>
        ` : ''}

        <!-- Awards -->
        ${awards && awards.length > 0 ? `
        <div class="section">
            <div class="section-title">Awards & Accomplishments</div>
            ${awards.map(award => `
                <div class="entry">
                    <div class="entry-title">${award.title || ''}</div>
                    <div class="entry-subtitle">${award.organization || ''}</div>
                    ${award.description ? `<div class="entry-description">${award.description}</div>` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        <!-- Publications -->
        ${publications && publications.length > 0 ? `
        <div class="section">
            <div class="section-title">Publications</div>
            ${publications.map(pub => `
                <div class="entry">
                    <div class="entry-title">${pub.title || ''}</div>
                    <div class="entry-subtitle">${pub.organization || pub.publisher || ''}</div>
                    ${pub.description ? `<div class="entry-description">${pub.description}</div>` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        <!-- Volunteer Work -->
        ${volunteerWork && volunteerWork.length > 0 ? `
        <div class="section">
            <div class="section-title">Volunteer Work</div>
            ${volunteerWork.map(vol => `
                <div class="entry">
                    <div class="entry-title">${vol.title || vol.role || ''}</div>
                    <div class="entry-subtitle">${vol.organization || ''}</div>
                    ${vol.responsibilities && vol.responsibilities.length > 0 ? `
                        <ul class="entry-list">
                            ${vol.responsibilities.map(resp => `<li>${resp}</li>`).join('')}
                        </ul>
                    ` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}

        <!-- Languages -->
        ${languages && languages.length > 0 ? `
        <div class="section">
            <div class="section-title">Languages</div>
            <div class="entry-description">
                ${languages.map(lang => typeof lang === 'string' ? lang : `${lang.language || ''} (${lang.proficiency || ''})`).join(', ')}
            </div>
        </div>
        ` : ''}

        <!-- Interests -->
        ${interests && interests.length > 0 ? `
        <div class="section">
            <div class="section-title">Interests</div>
            <div class="entry-description">
                ${interests.join(', ')}
            </div>
        </div>
        ` : ''}

        <!-- Additional Information -->
        ${additionalSections && additionalSections.length > 0 ? `
        <div class="section">
            <div class="section-title">Additional Information</div>
            <ul class="achievements-list">
                ${additionalSections.map(section => `<li><strong>${section.sectionName}:</strong> ${section.content}</li>`).join('')}
            </ul>
        </div>
        ` : ''}

        <!-- References -->
        ${references ? `
        <div class="section">
            <div class="section-title">References</div>
            <div class="entry-description">${references}</div>
        </div>
        ` : ''}
    </div>
</body>
</html>`;
};


function renderTemplate6(data: CVData): string {
  // Template 6: Two-Column Modern Layout
  const { 
    personalDetails, 
    about,
    education, 
    experience, 
    projects, 
    skills,
    certifications, 
    awards, 
    publications, 
    volunteerWork, 
    languages, 
    interests, 
    additionalInfo, 
    references 
  } = data;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Professional CV</title>
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
            font-family: 'Georgia', serif;
            color: #333;
            background: white;
            line-height: 1.6;
        }

        .page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background: white;
            padding: 15mm 12mm;
        }

        .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
            margin-bottom: 25px;
        }

        .header h1 {
            font-size: 38px;
            letter-spacing: 8px;
            font-weight: 400;
            color: #2c2c2c;
        }

        .content {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 25px;
        }

        .left-column, .right-column {
            font-size: 11px;
        }

        .section {
            margin-bottom: 22px;
        }

        .section-title {
            font-size: 15px;
            letter-spacing: 4px;
            font-weight: 600;
            margin-bottom: 12px;
            color: #2c2c2c;
        }

        .contact-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 10px;
            font-size: 11px;
        }

        .contact-item::before {
            content: '';
            display: inline-block;
            width: 16px;
            height: 16px;
            margin-right: 8px;
            flex-shrink: 0;
        }

        .contact-item.phone::before {
            content: '📞';
        }

        .contact-item.location::before {
            content: '📍';
        }

        .contact-item.email::before {
            content: '✉';
        }

        .education-item {
            margin-bottom: 15px;
        }

        .education-title {
            font-weight: 600;
            font-size: 12px;
            margin-bottom: 3px;
        }

        .education-details {
            font-size: 10.5px;
            color: #555;
            line-height: 1.5;
        }

        .skills-list, .cert-list, .lang-list {
            list-style: none;
            padding-left: 0;
        }

        .skills-list li, .cert-list li, .lang-list li {
            margin-bottom: 8px;
            padding-left: 15px;
            position: relative;
            font-size: 10.5px;
            line-height: 1.5;
        }

        .skills-list li::before, .cert-list li::before {
            content: '•';
            position: absolute;
            left: 0;
            font-weight: bold;
        }

        .about-text {
            font-size: 10.5px;
            text-align: justify;
            line-height: 1.6;
            color: #444;
        }

        .work-item, .project-item, .volunteer-item, .award-item, .publication-item {
            margin-bottom: 18px;
        }

        .work-title {
            font-weight: 600;
            font-size: 12px;
            margin-bottom: 2px;
        }

        .work-company {
            font-size: 10.5px;
            color: #555;
            margin-bottom: 6px;
        }

        .work-list {
            list-style: none;
            padding-left: 0;
        }

        .work-list li {
            margin-bottom: 6px;
            padding-left: 15px;
            position: relative;
            font-size: 10.5px;
            line-height: 1.5;
        }

        .work-list li::before {
            content: '•';
            position: absolute;
            left: 0;
        }

        .interests-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .interest-tag {
            background: #f0f0f0;
            padding: 4px 10px;
            border-radius: 3px;
            font-size: 10px;
        }

        .additional-info {
            font-size: 10.5px;
            line-height: 1.6;
        }

        .reference-item {
            margin-bottom: 12px;
        }

        .reference-name {
            font-weight: 600;
            font-size: 11px;
        }

        .reference-details {
            font-size: 10px;
            color: #555;
            line-height: 1.5;
        }

        @media print {
            body {
                margin: 0;
                padding: 0;
            }
            .page {
                margin: 0;
                page-break-after: always;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        <!-- Header -->
        <div class="header">
            <h1>${personalDetails.name || ''}</h1>
        </div>

        <!-- Main Content -->
        <div class="content">
            <!-- Left Column -->
            <div class="left-column">
                <!-- Contact -->
                <div class="section">
                    <h2 class="section-title">CONTACT</h2>
                    ${personalDetails.phone ? `<div class="contact-item phone">${personalDetails.phone}</div>` : ''}
                    ${personalDetails.location ? `<div class="contact-item location">${personalDetails.location}</div>` : ''}
                    ${personalDetails.email ? `<div class="contact-item email">${personalDetails.email}</div>` : ''}
                </div>

                <!-- Education -->
                ${education && education.length > 0 ? `
                <div class="section">
                    <h2 class="section-title">EDUCATION</h2>
                    ${education.map(edu => `
                        <div class="education-item">
                            <div class="education-title">${edu.institution || ''}</div>
                            <div class="education-details">
                                ${edu.degree || ''}<br>
                                ${edu.years || ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                <!-- Skills -->
                ${skills && skills.length > 0 ? `
                <div class="section">
                    <h2 class="section-title">SKILLS</h2>
                    <ul class="skills-list">
                        ${skills.map(skill => `<li>${skill}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}

                <!-- Certifications -->
                ${certifications && certifications.length > 0 ? `
                <div class="section">
                    <h2 class="section-title">CERTIFICATION</h2>
                    <ul class="cert-list">
                        ${certifications.map(cert => typeof cert === 'string' ? `<li>${cert}</li>` : `<li>${cert.name || cert.title || ''}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}

                <!-- Languages -->
                ${languages && languages.length > 0 ? `
                <div class="section">
                    <h2 class="section-title">LANGUAGES</h2>
                    <ul class="lang-list">
                        ${languages.map(lang => typeof lang === 'string' ? `<li>${lang}</li>` : `<li>${lang.language || ''} - ${lang.proficiency || ''}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}

                <!-- Interests -->
                ${interests && interests.length > 0 ? `
                <div class="section">
                    <h2 class="section-title">INTERESTS</h2>
                    <div class="interests-list">
                        ${interests.map(interest => `<span class="interest-tag">${interest}</span>`).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Volunteer Work -->
                ${volunteerWork && volunteerWork.length > 0 ? `
                <div class="section">
                    <h2 class="section-title">VOLUNTEER WORK</h2>
                    ${volunteerWork.map(vol => `
                        <div class="volunteer-item">
                            <div class="work-title">${vol.title || vol.role || ''}</div>
                            <div class="work-company">${vol.organization || ''}</div>
                            ${vol.responsibilities && vol.responsibilities.length > 0 ? `
                                <ul class="work-list">
                                    ${vol.responsibilities.map(resp => `<li>${resp}</li>`).join('')}
                                </ul>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                <!-- Additional Information -->
                ${additionalSections && additionalSections.length > 0 ? `
                <div class="section">
                    <h2 class="section-title">ADDITIONAL INFORMATION</h2>
                    <div class="additional-info">
                        ${additionalSections.map(section => `<p>• <strong>${section.sectionName}:</strong> ${section.content}</p>`).join('')}
                    </div>
                </div>
                ` : ''}
            </div>

            <!-- Right Column -->
            <div class="right-column">
                <!-- About Me -->
                ${about ? `
                <div class="section">
                    <h2 class="section-title">ABOUT ME</h2>
                    <p class="about-text">${about}</p>
                </div>
                ` : ''}

                <!-- Work Experience -->
                ${experience && experience.length > 0 ? `
                <div class="section">
                    <h2 class="section-title">WORK EXPERIENCE</h2>
                    ${experience.map(work => `
                        <div class="work-item">
                            <div class="work-title">${work.title || work.role || ''}</div>
                            <div class="work-company">${work.company || ''} ${work.years ? `(${work.years})` : ''}</div>
                            ${work.responsibilities && work.responsibilities.length > 0 ? `
                                <ul class="work-list">
                                    ${work.responsibilities.map(resp => `<li>${resp}</li>`).join('')}
                                </ul>
                            ` : work.bullets && work.bullets.length > 0 ? `
                                <ul class="work-list">
                                    ${work.bullets.map(bullet => `<li>${bullet}</li>`).join('')}
                                </ul>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                <!-- Projects -->
                ${projects && projects.length > 0 ? `
                <div class="section">
                    <h2 class="section-title">PROJECTS</h2>
                    ${projects.map(project => `
                        <div class="project-item">
                            <div class="work-title">${project.title || ''}</div>
                            <div class="work-company">${project.description || ''}</div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                <!-- Awards & Accomplishments -->
                ${awards && awards.length > 0 ? `
                <div class="section">
                    <h2 class="section-title">AWARDS & ACCOMPLISHMENTS</h2>
                    ${awards.map(award => `
                        <div class="award-item">
                            <div class="work-title">${award.title || ''}</div>
                            <div class="work-company">${award.organization || ''}</div>
                            ${award.description ? `<p style="font-size: 10.5px; margin-top: 4px;">${award.description}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                <!-- Publications -->
                ${publications && publications.length > 0 ? `
                <div class="section">
                    <h2 class="section-title">PUBLICATIONS</h2>
                    ${publications.map(pub => `
                        <div class="publication-item">
                            <div class="work-title">${pub.title || ''}</div>
                            <div class="work-company">${pub.organization || pub.publisher || ''}</div>
                            ${pub.description ? `<p style="font-size: 10.5px; margin-top: 4px;">${pub.description}</p>` : ''}
                        </div>
                    `).join('')}
                </div>
                ` : ''}

                <!-- References -->
                ${references ? `
                <div class="section">
                    <h2 class="section-title">REFERENCES</h2>
                    <div class="reference-item">
                        <div class="reference-name">${references}</div>
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    </div>
</body>
</html>`;
};


// Responsive Tailwind templates for view mode
function renderResponsiveTemplate1(data: CVData): string {
  const formatBullets = (bullets: string[]) => bullets.filter(Boolean).map(b => `<li class="list-disc ml-5 mb-1">${htmlEscape(b)}</li>`).join('');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body>
    <div class="flex flex-col md:flex-row h-full">
        <!-- Left Column (Sidebar) -->
        <div class="md:w-1/3 bg-gray-700 text-white p-6 rounded-l-lg md:rounded-l-xl md:rounded-tr-none rounded-t-xl md:rounded-tr-none">
            <h2 class="text-3xl font-bold mb-1">${htmlEscape(data.personalDetails.name)}</h2>
            <p class="text-lg font-light mb-4 text-gray-300">${htmlEscape(data.personalDetails.title)}</p>
            <div class="space-y-4">
                <section>
                    <h3 class="uppercase text-sm font-semibold border-b border-gray-500 pb-1 mb-2 text-blue-400">Contact</h3>
                    <p class="text-sm">Email: <a href="mailto:${htmlEscape(data.personalDetails.email)}" class="text-white hover:text-blue-400">${htmlEscape(data.personalDetails.email)}</a></p>
                    <p class="text-sm">Phone: ${htmlEscape(data.personalDetails.phone)}</p>
                    <p class="text-sm">Location: ${htmlEscape(data.personalDetails.location)}</p>
                    ${data.personalDetails.linkedin ? `<p class="text-sm">LinkedIn: <a href="${htmlEscape(data.personalDetails.linkedin)}" target="_blank" class="text-white hover:text-blue-400">${htmlEscape(data.personalDetails.linkedin)}</a></p>` : ''}
                </section>
                ${data.skills && data.skills.length > 0 ? `
                <section>
                    <h3 class="uppercase text-sm font-semibold border-b border-gray-500 pb-1 mb-2 text-blue-400">Skills</h3>
                    <ul class="text-sm flex flex-wrap gap-2">
                        ${data.skills.map(skill => `<li class="px-2 py-0.5 bg-gray-600 rounded-full">${htmlEscape(skill)}</li>`).join('')}
                    </ul>
                </section>
                ` : ''}
                ${data.education && data.education.length > 0 ? `
                <section>
                    <h3 class="uppercase text-sm font-semibold border-b border-gray-500 pb-1 mb-2 text-blue-400">Education</h3>
                    ${data.education.map(edu => `
                        <div class="mb-2">
                            <p class="font-medium text-white">${htmlEscape(edu.degree)}</p>
                            <p class="text-sm text-gray-400">${htmlEscape(edu.institution)}</p>
                            <p class="text-xs text-gray-500">${htmlEscape(edu.years)}</p>
                        </div>
                    `).join('')}
                </section>
                ` : ''}
            </div>
        </div>
        <!-- Right Column (Main Content) -->
        <div class="md:w-2/3 p-6 space-y-6 md:rounded-r-xl bg-white rounded-b-xl md:rounded-bl-none">
            ${data.summary ? `
            <section>
                <h3 class="uppercase text-lg font-bold text-gray-700 border-b-2 border-blue-500 pb-1 mb-2">Summary</h3>
                <p class="text-gray-700">${htmlEscape(data.summary)}</p>
            </section>
            ` : ''}
            ${data.experience && data.experience.length > 0 ? `
            <section>
                <h3 class="uppercase text-lg font-bold text-gray-700 border-b-2 border-blue-500 pb-1 mb-3">Experience</h3>
                ${data.experience.map(exp => `
                    <div class="mb-4">
                        <div class="flex justify-between items-start">
                            <h4 class="font-bold text-gray-800">${htmlEscape(exp.role)} at ${htmlEscape(exp.company)}</h4>
                            <span class="text-sm text-gray-500 whitespace-nowrap">${htmlEscape(exp.years)}</span>
                        </div>
                        <ul class="text-sm text-gray-700 mt-2">
                            ${formatBullets(exp.bullets)}
                        </ul>
                    </div>
                `).join('')}
            </section>
            ` : ''}
            ${data.projects && data.projects.length > 0 ? `
            <section>
                <h3 class="uppercase text-lg font-bold text-gray-700 border-b-2 border-blue-500 pb-1 mb-3">Projects</h3>
                ${data.projects.map(proj => `
                    <div class="mb-4">
                        <h4 class="font-bold text-gray-800">${htmlEscape(proj.title)}</h4>
                        <p class="text-sm text-gray-700 mt-1">${htmlEscape(proj.description)}</p>
                    </div>
                `).join('')}
            </section>
            ` : ''}
            ${data.certifications && data.certifications.length > 0 ? `
            <section>
                <h3 class="uppercase text-lg font-bold text-gray-700 border-b-2 border-blue-500 pb-1 mb-3">Certifications</h3>
                ${data.certifications.map(cert => `
                    <div class="mb-2">
                        <p class="text-sm text-gray-700">${htmlEscape(cert.name)}${cert.issuer ? ` - ${htmlEscape(cert.issuer)}` : ''}${cert.year ? ` (${htmlEscape(cert.year)})` : ''}</p>
                    </div>
                `).join('')}
            </section>
            ` : ''}

            ${data.awards && data.awards.length > 0 ? `
            <section>
                <h3 class="uppercase text-lg font-bold text-gray-700 border-b-2 border-blue-500 pb-1 mb-3">Awards</h3>
                ${data.awards.map(award => `
                    <div class="mb-2">
                        <p class="text-sm text-gray-700">${htmlEscape(award.title)}${award.issuer ? ` - ${htmlEscape(award.issuer)}` : ''}${award.year ? ` (${htmlEscape(award.year)})` : ''}</p>
                    </div>
                `).join('')}
            </section>
            ` : ''}

            ${data.publications && data.publications.length > 0 ? `
            <section>
                <h3 class="uppercase text-lg font-bold text-gray-700 border-b-2 border-blue-500 pb-1 mb-3">Publications</h3>
                ${data.publications.map(pub => `
                    <div class="mb-2">
                        <p class="text-sm text-gray-700">${htmlEscape(pub.title)}${pub.journal ? ` - ${htmlEscape(pub.journal)}` : ''}${pub.year ? ` (${htmlEscape(pub.year)})` : ''}</p>
                    </div>
                `).join('')}
            </section>
            ` : ''}

            ${data.accomplishments && data.accomplishments.length > 0 ? `
            <section>
                <h3 class="uppercase text-lg font-bold text-gray-700 border-b-2 border-blue-500 pb-1 mb-3">Accomplishments</h3>
                <ul class="text-sm text-gray-700">
                    ${data.accomplishments.map(acc => `<li class="mb-1">• ${htmlEscape(acc)}</li>`).join('')}
                </ul>
            </section>
            ` : ''}

            ${data.languages && data.languages.length > 0 ? `
            <section>
                <h3 class="uppercase text-lg font-bold text-gray-700 border-b-2 border-blue-500 pb-1 mb-3">Languages</h3>
                <div class="text-sm text-gray-700">${data.languages.map(lang => htmlEscape(lang)).join(' • ')}</div>
            </section>
            ` : ''}

            ${data.interests && data.interests.length > 0 ? `
            <section>
                <h3 class="uppercase text-lg font-bold text-gray-700 border-b-2 border-blue-500 pb-1 mb-3">Interests</h3>
                <div class="text-sm text-gray-700">${data.interests.map(interest => htmlEscape(interest)).join(' • ')}</div>
            </section>
            ` : ''}

            ${data.volunteerWork && data.volunteerWork.length > 0 ? `
            <section>
                <h3 class="uppercase text-lg font-bold text-gray-700 border-b-2 border-blue-500 pb-1 mb-3">Volunteer Work</h3>
                ${data.volunteerWork.map(vol => `
                    <div class="mb-3">
                        <p class="text-sm text-gray-700">${htmlEscape(vol.role || 'Volunteer')}${vol.organization ? ` - ${htmlEscape(vol.organization)}` : ''}</p>
                        ${vol.description ? `<p class="text-xs text-gray-600 mt-1">${htmlEscape(vol.description)}</p>` : ''}
                    </div>
                `).join('')}
            </section>
            ` : ''}

            ${data.additionalSections && data.additionalSections.length > 0 ? data.additionalSections.map(section => `
            <section>
                <h3 class="uppercase text-lg font-bold text-gray-700 border-b-2 border-blue-500 pb-1 mb-3">${htmlEscape(section.sectionName)}</h3>
                <p class="text-sm text-gray-700">${htmlEscape(section.content)}</p>
            </section>
            `).join('') : ''}
        </div>
    </div>
</body>
</html>`;
}

function renderResponsiveTemplate2(data: CVData): string {
  const formatBullets = (bullets: string[]) => bullets.filter(Boolean).map(b => `<li class="list-disc ml-5 mb-1">${htmlEscape(b)}</li>`).join('');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body>
    <div class="p-8 space-y-6 bg-white rounded-xl shadow-lg border-t-4 border-blue-500">
        <header class="text-center pb-4 border-b border-gray-200">
            <h1 class="text-4xl font-extrabold text-gray-800">${htmlEscape(data.personalDetails.name)}</h1>
            <p class="text-xl font-medium text-blue-500 mt-1">${htmlEscape(data.personalDetails.title)}</p>
            <div class="flex justify-center flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                <span>${htmlEscape(data.personalDetails.location)}</span>
                <span class="font-bold">•</span>
                <a href="mailto:${htmlEscape(data.personalDetails.email)}" class="hover:underline">${htmlEscape(data.personalDetails.email)}</a>
                <span class="font-bold">•</span>
                <span>${htmlEscape(data.personalDetails.phone)}</span>
                ${data.personalDetails.linkedin ? `<span class="font-bold">•</span><a href="${htmlEscape(data.personalDetails.linkedin)}" target="_blank" class="hover:underline">LinkedIn</a>` : ''}
            </div>
        </header>
        ${data.summary ? `
        <section>
            <h3 class="text-xl font-bold text-gray-700 border-b border-gray-300 pb-1 mb-3">Profile Summary</h3>
            <p class="text-gray-700 leading-relaxed">${htmlEscape(data.summary)}</p>
        </section>
        ` : ''}
        ${data.experience && data.experience.length > 0 ? `
        <section>
            <h3 class="text-xl font-bold text-gray-700 border-b border-gray-300 pb-1 mb-4">Professional Experience</h3>
            ${data.experience.map(exp => `
                <div class="mb-6">
                    <div class="flex justify-between items-start">
                        <h4 class="font-bold text-lg text-gray-800">${htmlEscape(exp.role)} <span class="font-normal text-blue-500">| ${htmlEscape(exp.company)}</span></h4>
                        <span class="text-sm text-gray-500 font-semibold">${htmlEscape(exp.years)}</span>
                    </div>
                    <ul class="text-gray-700 mt-2 text-sm">
                        ${formatBullets(exp.bullets)}
                    </ul>
                </div>
            `).join('')}
        </section>
        ` : ''}
        ${data.projects && data.projects.length > 0 ? `
        <section>
            <h3 class="text-xl font-bold text-gray-700 border-b border-gray-300 pb-1 mb-4">Projects</h3>
            ${data.projects.map(proj => `
                <div class="mb-4">
                    <h4 class="font-bold text-gray-800">${htmlEscape(proj.title)}</h4>
                    <p class="text-sm text-gray-700 mt-1">${htmlEscape(proj.description)}</p>
                </div>
            `).join('')}
        </section>
        ` : ''}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
            ${data.skills && data.skills.length > 0 ? `
            <section>
                <h3 class="text-xl font-bold text-gray-700 border-b border-gray-300 pb-1 mb-3">Technical Skills</h3>
                <div class="flex flex-wrap gap-2 text-sm">
                    ${data.skills.map(skill => `<span class="px-3 py-1 bg-gray-100 rounded-full border border-gray-300">${htmlEscape(skill)}</span>`).join('')}
                </div>
            </section>
            ` : ''}
            ${data.education && data.education.length > 0 ? `
            <section>
                <h3 class="text-xl font-bold text-gray-700 border-b border-gray-300 pb-1 mb-3">Education</h3>
                ${data.education.map(edu => `
                    <div class="mb-3">
                        <p class="font-semibold text-gray-800">${htmlEscape(edu.degree)}</p>
                        <p class="text-sm text-gray-600">${htmlEscape(edu.institution)}</p>
                        <p class="text-xs text-gray-500">${htmlEscape(edu.years)}</p>
                    </div>
                `).join('')}
            </section>
            ` : ''}
        </div>
    </div>
</body>
</html>`;
}

function renderResponsiveTemplate3(data: CVData): string {
  const formatBullets = (bullets: string[]) => bullets.filter(Boolean).map(b => `<li class="list-disc ml-5 mb-1">${htmlEscape(b)}</li>`).join('');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body>
    <div class="p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <header class="text-center">
            <h1 class="text-4xl font-extrabold text-gray-900">${htmlEscape(data.personalDetails.name)}</h1>
            <p class="text-lg font-medium text-gray-700 mt-1">${htmlEscape(data.personalDetails.title)}</p>
            <p class="text-sm text-gray-500 mt-2">${htmlEscape(data.personalDetails.phone)} | ${htmlEscape(data.personalDetails.email)}${data.personalDetails.linkedin ? ` | ${htmlEscape(data.personalDetails.linkedin)}` : ''}</p>
        </header>
        ${data.summary ? `
        <section class="border-t border-gray-300 pt-4">
            <h3 class="text-xl font-bold text-gray-800 mb-2 uppercase tracking-wider">Summary</h3>
            <p class="text-gray-700">${htmlEscape(data.summary)}</p>
        </section>
        ` : ''}
        ${data.experience && data.experience.length > 0 ? `
        <section class="border-t border-gray-300 pt-4">
            <h3 class="text-xl font-bold text-gray-800 mb-4 uppercase tracking-wider">Experience</h3>
            ${data.experience.map(exp => `
                <div class="mb-5">
                    <div class="flex justify-between items-start">
                        <h4 class="font-semibold text-gray-800">${htmlEscape(exp.role)} - ${htmlEscape(exp.company)}</h4>
                        <span class="text-sm text-gray-500">${htmlEscape(exp.years)}</span>
                    </div>
                    <ul class="text-sm text-gray-700 mt-1">
                        ${formatBullets(exp.bullets)}
                    </ul>
                </div>
            `).join('')}
        </section>
        ` : ''}
        ${data.projects && data.projects.length > 0 ? `
        <section class="border-t border-gray-300 pt-4">
            <h3 class="text-xl font-bold text-gray-800 mb-4 uppercase tracking-wider">Projects</h3>
            ${data.projects.map(proj => `
                <div class="mb-4">
                    <h4 class="font-semibold text-gray-800">${htmlEscape(proj.title)}</h4>
                    <p class="text-sm text-gray-700 mt-1">${htmlEscape(proj.description)}</p>
                </div>
            `).join('')}
        </section>
        ` : ''}
        ${data.skills && data.skills.length > 0 ? `
        <section class="border-t border-gray-300 pt-4">
            <h3 class="text-xl font-bold text-gray-800 mb-4 uppercase tracking-wider">Skills</h3>
            <p class="text-gray-700 text-sm">${data.skills.map(s => htmlEscape(s)).join(' • ')}</p>
        </section>
        ` : ''}
        ${data.certifications && data.certifications.length > 0 ? `
        <section class="border-t border-gray-300 pt-4">
            <h3 class="text-xl font-bold text-gray-800 mb-4 uppercase tracking-wider">Certifications</h3>
            ${data.certifications.map(cert => `
                <div class="mb-2">
                    <p class="text-sm text-gray-700">${htmlEscape(cert.name)}${cert.issuer ? ` - ${htmlEscape(cert.issuer)}` : ''}${cert.year ? ` (${htmlEscape(cert.year)})` : ''}</p>
                </div>
            `).join('')}
        </section>
        ` : ''}
        ${data.education && data.education.length > 0 ? `
        <section class="border-t border-gray-300 pt-4">
            <h3 class="text-xl font-bold text-gray-800 mb-4 uppercase tracking-wider">Education</h3>
            ${data.education.map(edu => `
                <div class="mb-3 flex justify-between items-start">
                    <div>
                        <p class="font-semibold text-gray-800">${htmlEscape(edu.degree)}</p>
                        <p class="text-sm text-gray-600">${htmlEscape(edu.institution)}</p>
                    </div>
                    <span class="text-xs text-gray-500">${htmlEscape(edu.years)}</span>
                </div>
            `).join('')}
        </section>
        ` : ''}
    </div>
</body>
</html>`;
}

function renderResponsiveTemplate5(data: CVData): string {
  // Academic Single Column - Responsive Version
  const formatBullets = (bullets: string[]) => bullets.filter(Boolean).map(b => `<li class="list-disc ml-5 mb-1">${htmlEscape(b)}</li>`).join('');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Computer+Modern:wght@400;700&display=swap');
    body { font-family: 'Computer Modern', serif; }
  </style>
</head>
<body class="bg-white">
  <div class="max-w-4xl mx-auto p-8">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-4xl font-normal tracking-wider mb-2">${htmlEscape(data.personalDetails.name)}</h1>
      <div class="text-sm text-gray-600 space-x-2">
        ${data.personalDetails.email ? `<a href="mailto:${htmlEscape(data.personalDetails.email)}" class="hover:text-blue-600">${htmlEscape(data.personalDetails.email)}</a>` : ''}
        ${data.personalDetails.phone ? `<span>| ${htmlEscape(data.personalDetails.phone)}</span>` : ''}
        ${data.personalDetails.location ? `<span>| ${htmlEscape(data.personalDetails.location)}</span>` : ''}
      </div>
    </div>

    <!-- Content Sections -->
    <div class="space-y-6">
      ${data.education && data.education.length > 0 ? `
      <section>
        <h2 class="text-lg font-bold uppercase tracking-wider border-b border-black pb-1 mb-4">Education</h2>
        ${data.education.map(edu => `
          <div class="mb-4">
            <div class="flex justify-between items-baseline mb-1">
              <h3 class="font-bold text-base">${htmlEscape(edu.institution)}</h3>
              <span class="text-sm italic">${htmlEscape(edu.years)}</span>
            </div>
            <p class="italic text-sm mb-2">${htmlEscape(edu.degree)}</p>
          </div>
        `).join('')}
      </section>
      ` : ''}

      ${data.experience && data.experience.length > 0 ? `
      <section>
        <h2 class="text-lg font-bold uppercase tracking-wider border-b border-black pb-1 mb-4">Experience</h2>
        ${data.experience.map(exp => `
          <div class="mb-6">
            <div class="flex justify-between items-baseline mb-1">
              <h3 class="font-bold text-base">${htmlEscape(exp.role)}</h3>
              <span class="text-sm italic">${htmlEscape(exp.years)}</span>
            </div>
            <p class="italic text-sm mb-3">${htmlEscape(exp.company)}</p>
            ${exp.bullets && exp.bullets.length > 0 ?
              `<ul class="text-sm leading-relaxed">${formatBullets(exp.bullets)}</ul>` : ''}
          </div>
        `).join('')}
      </section>
      ` : ''}

      ${data.projects && data.projects.length > 0 ? `
      <section>
        <h2 class="text-lg font-bold uppercase tracking-wider border-b border-black pb-1 mb-4">Projects</h2>
        ${data.projects.map(project => `
          <div class="mb-6">
            <div class="flex justify-between items-baseline mb-1">
              <h3 class="font-bold text-base">${htmlEscape(project.title)}</h3>
            </div>
            ${project.description ? `<p class="text-sm mb-3">${htmlEscape(project.description)}</p>` : ''}
          </div>
        `).join('')}
      </section>
      ` : ''}

      ${data.skills && data.skills.length > 0 ? `
      <section>
        <h2 class="text-lg font-bold uppercase tracking-wider border-b border-black pb-1 mb-4">Skills</h2>
        <div class="text-sm leading-relaxed">${data.skills.map(s => htmlEscape(s)).join(' • ')}</div>
      </section>
      ` : ''}

      ${data.certifications && data.certifications.length > 0 ? `
      <section>
        <h2 class="text-lg font-bold uppercase tracking-wider border-b border-black pb-1 mb-4">Certifications</h2>
        ${data.certifications.map(cert => `
          <div class="mb-2">
            <p class="text-sm">${htmlEscape(typeof cert === 'string' ? cert : (cert.name || cert.title || ''))}</p>
          </div>
        `).join('')}
      </section>
      ` : ''}

      ${data.accomplishments && data.accomplishments.length > 0 ? `
      <section>
        <h2 class="text-lg font-bold uppercase tracking-wider border-b border-black pb-1 mb-4">Achievements</h2>
        <ul class="text-sm leading-relaxed">
          ${data.accomplishments.map(acc => `<li class="list-disc ml-5 mb-1">${htmlEscape(acc)}</li>`).join('')}
        </ul>
      </section>
      ` : ''}

      ${data.awards && data.awards.length > 0 ? `
      <section>
        <h2 class="text-lg font-bold uppercase tracking-wider border-b border-black pb-1 mb-4">Awards</h2>
        ${data.awards.map(award => `
          <div class="mb-3">
            <p class="text-sm leading-relaxed">${htmlEscape(award.title)}${award.issuer ? ` - ${htmlEscape(award.issuer)}` : ''}${award.year ? ` (${htmlEscape(award.year)})` : ''}</p>
            ${award.organization ? `<p class="text-sm text-gray-600">${htmlEscape(award.organization)}</p>` : ''}
          </div>
        `).join('')}
      </section>
      ` : ''}

      ${data.publications && data.publications.length > 0 ? `
      <section>
        <h2 class="text-lg font-bold uppercase tracking-wider border-b border-black pb-1 mb-4">Publications</h2>
        ${data.publications.map(pub => `
          <div class="mb-3">
            <p class="text-sm leading-relaxed">${htmlEscape(pub.title)}${pub.journal ? ` - ${htmlEscape(pub.journal)}` : ''}${pub.year ? ` (${htmlEscape(pub.year)})` : ''}</p>
            ${pub.organization ? `<p class="text-sm text-gray-600">${htmlEscape(pub.organization)}</p>` : ''}
          </div>
        `).join('')}
      </section>
      ` : ''}

      ${data.languages && data.languages.length > 0 ? `
      <section>
        <h2 class="text-lg font-bold uppercase tracking-wider border-b border-black pb-1 mb-4">Languages</h2>
        <div class="text-sm leading-relaxed">
          ${data.languages.map(lang => typeof lang === 'string' ? lang : `${lang.language || ''} (${lang.proficiency || ''})`).join(', ')}
        </div>
      </section>
      ` : ''}

      ${data.interests && data.interests.length > 0 ? `
      <section>
        <h2 class="text-lg font-bold uppercase tracking-wider border-b border-black pb-1 mb-4">Interests</h2>
        <div class="text-sm leading-relaxed">
          ${data.interests.join(', ')}
        </div>
      </section>
      ` : ''}

      ${data.volunteerWork && data.volunteerWork.length > 0 ? `
      <section>
        <h2 class="text-lg font-bold uppercase tracking-wider border-b border-black pb-1 mb-4">Volunteer Work</h2>
        ${data.volunteerWork.map(vol => `
          <div class="mb-6">
            <div class="flex justify-between items-baseline mb-1">
              <h3 class="font-bold text-base">${htmlEscape(vol.title || vol.role || 'Volunteer')}</h3>
              ${vol.duration ? `<span class="text-sm italic">${htmlEscape(vol.duration)}</span>` : ''}
            </div>
            <p class="italic text-sm mb-3">${htmlEscape(vol.organization)}</p>
            ${vol.description ? `<p class="text-sm mb-3">${htmlEscape(vol.description)}</p>` : ''}
            ${vol.responsibilities && vol.responsibilities.length > 0 ? `
              <ul class="text-sm leading-relaxed">${formatBullets(vol.responsibilities)}</ul>` : ''}
          </div>
        `).join('')}
      </section>
      ` : ''}

      ${data.additionalSections && data.additionalSections.length > 0 ? data.additionalSections.map(section => `
        <section>
          <h2 class="text-lg font-bold uppercase tracking-wider border-b border-black pb-1 mb-4">${htmlEscape(section.sectionName)}</h2>
          <p class="text-sm leading-relaxed">${htmlEscape(section.content)}</p>
        </section>
      `).join('') : ''}
    </div>
  </div>
</body>
</html>`;
}

function renderResponsiveTemplate6(data: CVData): string {
  // Two-Column Modern Layout - Responsive Version
  const formatBullets = (bullets: string[]) => bullets.filter(Boolean).map(b => `<li class="list-disc ml-5 mb-1">${htmlEscape(b)}</li>`).join('');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Georgia:wght@400;700&display=swap');
    body { font-family: Georgia, serif; }
  </style>
</head>
<body class="bg-white">
  <div class="max-w-6xl mx-auto p-8">
    <!-- Header -->
    <div class="text-center mb-8 border-b-2 border-gray-800 pb-6">
      <h1 class="text-5xl tracking-widest font-normal text-gray-900">${htmlEscape(data.personalDetails.name)}</h1>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <!-- Left Column -->
      <div class="md:col-span-1 space-y-6">
        ${data.personalDetails.phone || data.personalDetails.location || data.personalDetails.email ? `
        <section>
          <h2 class="text-xl tracking-widest font-semibold mb-4 text-gray-900 uppercase">Contact</h2>
          <div class="space-y-2 text-sm">
            ${data.personalDetails.phone ? `<div class="flex items-start"><span class="mr-2">📞</span> ${htmlEscape(data.personalDetails.phone)}</div>` : ''}
            ${data.personalDetails.location ? `<div class="flex items-start"><span class="mr-2">📍</span> ${htmlEscape(data.personalDetails.location)}</div>` : ''}
            ${data.personalDetails.email ? `<div class="flex items-start"><span class="mr-2">✉</span> ${htmlEscape(data.personalDetails.email)}</div>` : ''}
          </div>
        </section>
        ` : ''}

        ${data.education && data.education.length > 0 ? `
        <section>
          <h2 class="text-xl tracking-widest font-semibold mb-4 text-gray-900 uppercase">Education</h2>
          ${data.education.map(edu => `
            <div class="mb-4">
              <h3 class="font-semibold text-base mb-1">${htmlEscape(edu.institution)}</h3>
              <p class="text-sm text-gray-600">${htmlEscape(edu.degree)} - ${htmlEscape(edu.years)}</p>
            </div>
          `).join('')}
        </section>
        ` : ''}

        ${data.skills && data.skills.length > 0 ? `
        <section>
          <h2 class="text-xl tracking-widest font-semibold mb-4 text-gray-900 uppercase">Skills</h2>
          <ul class="text-sm space-y-1">
            ${data.skills.map(skill => `<li class="flex items-start"><span class="mr-2">•</span> ${htmlEscape(skill)}</li>`).join('')}
          </ul>
        </section>
        ` : ''}

        ${data.certifications && data.certifications.length > 0 ? `
        <section>
          <h2 class="text-xl tracking-widest font-semibold mb-4 text-gray-900 uppercase">Certification</h2>
          <ul class="text-sm space-y-1">
            ${data.certifications.map(cert => `<li class="flex items-start"><span class="mr-2">•</span> ${htmlEscape(typeof cert === 'string' ? cert : (cert.name || cert.title || ''))}</li>`).join('')}
          </ul>
        </section>
        ` : ''}

        ${data.languages && data.languages.length > 0 ? `
        <section>
          <h2 class="text-xl tracking-widest font-semibold mb-4 text-gray-900 uppercase">Languages</h2>
          <ul class="text-sm space-y-1">
            ${data.languages.map(lang => `<li class="flex items-start"><span class="mr-2">•</span> ${typeof lang === 'string' ? lang : `${lang.language || ''} - ${lang.proficiency || ''}`}</li>`).join('')}
          </ul>
        </section>
        ` : ''}

        ${data.interests && data.interests.length > 0 ? `
        <section>
          <h2 class="text-xl tracking-widest font-semibold mb-4 text-gray-900 uppercase">Interests</h2>
          <div class="text-sm leading-relaxed">
            ${data.interests.join(', ')}
          </div>
        </section>
        ` : ''}

        ${data.volunteerWork && data.volunteerWork.length > 0 ? `
        <section>
          <h2 class="text-xl tracking-widest font-semibold mb-4 text-gray-900 uppercase">Volunteer Work</h2>
          ${data.volunteerWork.map(vol => `
            <div class="mb-4">
              <h3 class="font-semibold text-base mb-1">${htmlEscape(vol.title || vol.role || 'Volunteer')}</h3>
              <p class="text-sm text-gray-600 mb-2">${htmlEscape(vol.organization)}</p>
              ${vol.description ? `<p class="text-sm leading-relaxed">${htmlEscape(vol.description)}</p>` : ''}
            </div>
          `).join('')}
        </section>
        ` : ''}

        ${data.additionalSections && data.additionalSections.length > 0 ? `
        <section>
          <h2 class="text-xl tracking-widest font-semibold mb-4 text-gray-900 uppercase">Additional Information</h2>
          <ul class="text-sm space-y-1">
            ${data.additionalSections.map(section => `<li class="flex items-start"><span class="mr-2">•</span><strong>${htmlEscape(section.sectionName)}:</strong> ${htmlEscape(section.content)}</li>`).join('')}
          </ul>
        </section>
        ` : ''}
      </div>

      <!-- Right Column -->
      <div class="md:col-span-2 space-y-6">
        ${data.summary ? `
        <section>
          <h2 class="text-xl tracking-widest font-semibold mb-4 text-gray-900 uppercase">About Me</h2>
          <p class="text-sm leading-relaxed text-gray-700">${htmlEscape(data.summary)}</p>
        </section>
        ` : ''}

        ${data.experience && data.experience.length > 0 ? `
        <section>
          <h2 class="text-xl tracking-widest font-semibold mb-4 text-gray-900 uppercase">Work Experience</h2>
          ${data.experience.map(exp => `
            <div class="mb-6">
              <h3 class="font-semibold text-base mb-1">${htmlEscape(exp.role)}</h3>
              <p class="text-sm text-gray-600 mb-3">${htmlEscape(exp.company)} ${exp.years ? `(${htmlEscape(exp.years)})` : ''}</p>
              ${exp.bullets && exp.bullets.length > 0 ?
                `<ul class="text-sm leading-relaxed">${formatBullets(exp.bullets)}</ul>` : ''}
            </div>
          `).join('')}
        </section>
        ` : ''}

        ${data.projects && data.projects.length > 0 ? `
        <section>
          <h2 class="text-xl tracking-widest font-semibold mb-4 text-gray-900 uppercase">Projects</h2>
          ${data.projects.map(project => `
            <div class="mb-6">
              <h3 class="font-semibold text-base mb-1">${htmlEscape(project.title)}</h3>
              ${project.description ? `<p class="text-sm leading-relaxed mb-2">${htmlEscape(project.description)}</p>` : ''}
            </div>
          `).join('')}
        </section>
        ` : ''}

        ${data.accomplishments && data.accomplishments.length > 0 ? `
        <section>
          <h2 class="text-xl tracking-widest font-semibold mb-4 text-gray-900 uppercase">Achievements</h2>
          <ul class="text-sm space-y-1">
            ${data.accomplishments.map(acc => `<li class="flex items-start"><span class="mr-2">•</span> ${htmlEscape(acc)}</li>`).join('')}
          </ul>
        </section>
        ` : ''}

        ${data.awards && data.awards.length > 0 ? `
        <section>
          <h2 class="text-xl tracking-widest font-semibold mb-4 text-gray-900 uppercase">Awards</h2>
          ${data.awards.map(award => `
            <div class="mb-3">
              <p class="text-sm leading-relaxed">${htmlEscape(award.title)}${award.issuer ? ` - ${htmlEscape(award.issuer)}` : ''}${award.year ? ` (${htmlEscape(award.year)})` : ''}</p>
              ${award.organization ? `<p class="text-sm text-gray-600">${htmlEscape(award.organization)}</p>` : ''}
            </div>
          `).join('')}
        </section>
        ` : ''}

        ${data.publications && data.publications.length > 0 ? `
        <section>
          <h2 class="text-xl tracking-widest font-semibold mb-4 text-gray-900 uppercase">Publications</h2>
          ${data.publications.map(pub => `
            <div class="mb-3">
              <p class="text-sm leading-relaxed">${htmlEscape(pub.title)}${pub.journal ? ` - ${htmlEscape(pub.journal)}` : ''}${pub.year ? ` (${htmlEscape(pub.year)})` : ''}</p>
              ${pub.organization ? `<p class="text-sm text-gray-600">${htmlEscape(pub.organization)}</p>` : ''}
            </div>
          `).join('')}
        </section>
        ` : ''}

      </div>
    </div>
  </div>
</body>
</html>`;
}

// Main renderer function - supports both PDF mode (default) and view mode
export function renderCVTemplate(templateId: string, data: CVData, mode: 'view' | 'pdf' = 'pdf'): string {
  // Use responsive templates for view mode
if (mode === 'view') {
  switch (templateId) {
    case 'template-1':
      return renderResponsiveTemplate1(data);
    case 'template-2':
      return renderResponsiveTemplate2(data);
    case 'template-3':
      return renderResponsiveTemplate3(data);
    case 'template-5':
      return renderResponsiveTemplate5(data);
    case 'template-6':
      return renderResponsiveTemplate6(data);
    default:
      return renderResponsiveTemplate1(data);
  }
}
  
  // Use PDF-optimized templates for PDF mode (default)
  switch (templateId) {
    case 'template-1':
      return renderTemplate1(data);
    case 'template-2':
      return renderTemplate2(data);
    case 'template-3':
      return renderTemplate3(data);
    case 'template-5':
      return renderTemplate5(data);
    case 'template-6':
      return renderTemplate6(data);
    default:
      return renderTemplate1(data); // Default fallback
  }
}