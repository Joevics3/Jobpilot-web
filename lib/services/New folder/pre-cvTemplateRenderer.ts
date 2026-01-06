// CV Template Renderer - Renders structured CVData to HTML for different templates
// All templates enforce strict 1-page A4 format

import { CVData } from '@/lib/types/cv';

// Base CSS for A4 page (strict 1 page) - optimized for PDF conversion
const baseCss = `
  @page { 
    size: A4;
    margin: 0;
  }
  @media print {
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    html, body { 
      width: 210mm;
      height: 297mm;
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
    padding: 10mm 8mm;
    position: relative;
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

// Template 4: Black Bold (Tech style)
function renderTemplate4(data: CVData): string {
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
        .page { width: 100%; max-width: 210mm; margin: 0 auto;  background: white; margin: 0; padding: 20px 0; position: relative; overflow: hidden; }
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
        @media (min-width: 768px) {
          .page { padding: 15mm 0; }
        }
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
}

// Template 5 Renderer

function renderTemplate5(data: CVData): string {
  // Template 5: Blue Professional - TODO: Full implementation
  return renderTemplate1(data);
}

function renderTemplate6(data: CVData): string {
  // Template 6: Clean Professional - TODO: Full implementation
  return renderTemplate1(data);
}

function renderTemplate7(data: CVData): string {
  // Template 7: Gray Serif - TODO: Full implementation
  return renderTemplate1(data);
}

function renderTemplate8(data: CVData): string {
  // Template 8: Executive Blue - TODO: Full implementation
  return renderTemplate1(data);
}

function renderTemplate9(data: CVData): string {
  // Template 9: Modern Minimal - TODO: Full implementation
  return renderTemplate1(data);
}

function renderTemplate10(data: CVData): string {
  // Template 10: Teal Contemporary - TODO: Full implementation
  return renderTemplate1(data);
}

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
      case 'template-4':
        return renderResponsiveTemplate2(data); // Use modern template for template-4
      case 'template-5':
        return renderResponsiveTemplate1(data); // Use professional template for template-5
      default:
        return renderResponsiveTemplate1(data); // Default fallback
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
    case 'template-4':
      return renderTemplate4(data);
    case 'template-5':
      return renderTemplate5(data);
    case 'template-6':
      return renderTemplate6(data);
    case 'template-7':
      return renderTemplate7(data);
    case 'template-8':
      return renderTemplate8(data);
    case 'template-9':
      return renderTemplate9(data);
    case 'template-10':
      return renderTemplate10(data);
    default:
      return renderTemplate1(data); // Default fallback
  }
}




