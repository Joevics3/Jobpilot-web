// ATS CV Review Service
// Builds prompts locally and calls Supabase Edge Function (AI proxy only)

import { supabase } from '@/lib/supabase';

export interface ATSReviewResult {
  overallScore: number;
  overallExplanation?: string;
  scoreBreakdown?: {
    keywordMatch: { score: number; details: string; examples: string; recommendation: string };
    experienceMatch: { score: number; details: string; examples: string; recommendation: string };
    skillsAlignment: { score: number; details: string; examples: string; recommendation: string };
    atsCompatibility: { score: number; details: string; examples: string; recommendation: string };
    formattingConsistency: { score: number; details: string; examples: string; recommendation: string };
    profileSummaryStrength: { score: number; details: string; examples: string; recommendation: string };
    structureFlow: { score: number; details: string; examples: string; recommendation: string };
    visualBalanceReadability: { score: number; details: string; examples: string; recommendation: string };
  };
  summary?: string;
  finalRecommendations?: string[];
}

export interface ATSReviewRequest {
  cvContent: string;
  jobDescription?: string;
  jobTitle?: string;
  jobCompany?: string;
  reviewType: 'cv-only' | 'cv-job';
}

export interface ATSReviewSession {
  id: string;
  timestamp: number;
  cvName: string;
  jobTitle?: string;
  jobCompany?: string;
  overallScore: number;
  reviewType: 'cv-only' | 'cv-job';
  lastMessage: string;
  fullAnalysis: ATSReviewResult;
}

export class ATSReviewService {
  /**
   * Extract text from HTML CV content
   */
  static extractTextFromHTML(html: string): string {
    if (!html || typeof html !== 'string') return '';
    
    // Remove HTML tags
    const textWithoutTags = html.replace(/<[^>]*>/g, ' ');
    
    // Remove CSS styles and JavaScript
    const textWithoutStyles = textWithoutTags
      .replace(/\{[^}]*\}/g, '') // Remove CSS rules
      .replace(/@[^;]*;/g, '') // Remove CSS at-rules
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove CSS comments
      .replace(/\/\/.*$/gm, '') // Remove JS single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove JS multi-line comments

    // Clean up whitespace
    const cleanText = textWithoutStyles
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();

    return cleanText;
  }

  /**
   * Extract text from CV content (handles JSON or HTML)
   */
  static extractCVText(cvContent: string): string {
    // If it's JSON (structured data), try to parse and extract text
    if (cvContent.trim().startsWith('{')) {
      try {
        const structuredData = JSON.parse(cvContent);
        // Extract text from structured CV data
        let text = '';
        if (structuredData.personalDetails?.name) text += `Name: ${structuredData.personalDetails.name}\n`;
        if (structuredData.personalDetails?.title) text += `Title: ${structuredData.personalDetails.title}\n`;
        if (structuredData.personalDetails?.email) text += `Email: ${structuredData.personalDetails.email}\n`;
        if (structuredData.personalDetails?.phone) text += `Phone: ${structuredData.personalDetails.phone}\n`;
        if (structuredData.personalDetails?.location) text += `Location: ${structuredData.personalDetails.location}\n`;
        if (structuredData.summary) text += `\nSummary: ${structuredData.summary}\n`;
        if (structuredData.skills?.length) text += `\nSkills: ${structuredData.skills.join(', ')}\n`;
        if (structuredData.experience?.length) {
          text += '\nExperience:\n';
          structuredData.experience.forEach((exp: any) => {
            text += `${exp.role} at ${exp.company} (${exp.years})\n`;
            if (exp.bullets?.length) {
              exp.bullets.forEach((bullet: string) => text += `- ${bullet}\n`);
            }
          });
        }
        if (structuredData.education?.length) {
          text += '\nEducation:\n';
          structuredData.education.forEach((edu: any) => {
            text += `${edu.degree} from ${edu.institution} (${edu.years})\n`;
          });
        }
        return text;
      } catch (e) {
        // Not valid JSON, treat as plain text
      }
    }
    
    // If it contains HTML tags, extract text
    if (cvContent.includes('<')) {
      return this.extractTextFromHTML(cvContent);
    }
    
    // Otherwise return as-is (plain text)
    return cvContent;
  }

  /**
   * Build prompt for ATS CV Review
   */
  static buildPrompt(request: ATSReviewRequest): string {
    const cvTextContent = this.extractCVText(request.cvContent);
    
    // Build job context if provided
    const hasJobInfo = request.reviewType === 'cv-job' && (request.jobDescription || request.jobTitle);
    let jobContext = '';
    
    if (hasJobInfo) {
      jobContext = `
TARGET JOB INFORMATION:
${request.jobTitle ? `Job Title: ${request.jobTitle}` : ''}
${request.jobCompany ? `Company: ${request.jobCompany}` : ''}
${request.jobDescription ? `Job Description:\n${request.jobDescription}` : ''}

Analyze the CV specifically for this target position. Consider how well the CV matches the job requirements, required skills, and experience level.`;
    }

    return `You are an expert ATS (Applicant Tracking System) analyst and career coach. Analyze this CV${hasJobInfo ? ' for the target position' : ''} and return a comprehensive ATS CV Analysis Report in JSON format.

IMPORTANT: Ignore any HTML formatting in the CV content. The CV will be converted and submitted as a PDF, so focus on the actual text content and structure, not HTML tags or styling.

CV CONTENT:
${cvTextContent}

${jobContext ? `${jobContext}\n` : ''}

Return ONLY valid JSON in this exact format (no additional text, no markdown, no asterisks):

{
  "overallScore": 82,
  "overallExplanation": "Brief explanation of overall performance and key strengths/weaknesses",
  "scoreBreakdown": {
    "keywordMatch": {
      "score": 73,
      "details": "Detailed analysis with percentage of keywords detected",
      "examples": "List of found keywords and missing ones as a single string",
      "recommendation": "Add these specific keywords: [list exact keywords to include]. Replace generic terms like 'experienced' with specific skills like 'Python, React, AWS'."
    },
    "experienceMatch": {
      "score": 68,
      "details": "Analysis of experience relevance and years",
      "examples": "Specific feedback on roles and achievements",
      "recommendation": "Quantify achievements with numbers: 'Increased sales by 25%' instead of 'Improved sales'. Add specific technologies used in each role."
    },
    "skillsAlignment": {
      "score": 78,
      "details": "Skills detected and missing skills analysis",
      "examples": "List of detected and missing skills",
      "recommendation": "Add these missing skills: [list specific skills]. Group skills by category (Technical, Soft Skills, Certifications)."
    },
    "atsCompatibility": {
      "score": 52,
      "details": "Analysis of ATS parsing compatibility and structure",
      "examples": "Specific ATS compatibility issues found",
      "recommendation": "Use standard section headers: 'Experience', 'Education', 'Skills'. Remove tables, graphics, and complex formatting. Use simple bullet points."
    },
    "formattingConsistency": {
      "score": 90,
      "details": "Analysis of font, spacing, and alignment consistency",
      "examples": "Inconsistencies found in formatting",
      "recommendation": "Use consistent font (Arial or Calibri), uniform bullet points, and consistent spacing between sections."
    },
    "profileSummaryStrength": {
      "score": 78,
      "details": "Analysis of opening section clarity and value proposition",
      "examples": "Strengths and weaknesses in summary",
      "recommendation": "Rewrite summary to include: [X] years of experience in [specific field], expertise in [3-4 key skills], and [one key achievement with numbers]."
    },
    "structureFlow": {
      "score": 78,
      "details": "Analysis of section order and recruiter scanning ease",
      "examples": "Issues with section organization",
      "recommendation": "Reorder sections to: Contact Info → Professional Summary → Experience → Education → Skills. Use reverse chronological order for experience."
    },
    "visualBalanceReadability": {
      "score": 55,
      "details": "Analysis of white space, margins, and layout clarity",
      "examples": "Visual balance issues found",
      "recommendation": "Add more white space between sections, use 1-inch margins, and ensure consistent line spacing (1.15 or 1.5)."
    }
  },
  "summary": "Overall summary of CV strengths and areas for improvement",
  "finalRecommendations": [
    "Add these specific keywords: [list exact keywords from job description]",
    "Quantify all achievements with specific numbers and percentages",
    "Remove tables and graphics, use simple bullet points for ATS compatibility",
    "Use consistent formatting: Arial font, uniform spacing, standard section headers",
    "Rewrite professional summary to include years of experience, key skills, and one quantified achievement"
  ]
}

CRITICAL INSTRUCTIONS:
- SCORING: Give STRICT, REALISTIC scores based on actual CV quality. Be harsh but fair - most CVs should score 40-70. Use the full 0-100 range: excellent CVs get 80-95, good CVs get 65-79, average CVs get 45-64, poor CVs get 20-44. Don't be generous - penalize real issues heavily.
- JOB RELEVANCE PENALTY: If the CV is for a completely different field/industry than the target job, apply severe scoring penalties:
  * keywordMatch: Maximum 30% if no relevant keywords match the job requirements
  * experienceMatch: Maximum 40% if experience is in a completely different field
  * skillsAlignment: Maximum 50% if skills don't align with job requirements
  * overallScore: Should be 30-50% for complete field mismatches, regardless of CV quality
- For keywordMatch recommendations: List the EXACT keywords to add, not just general advice
- For all recommendations: Provide specific, actionable steps with exact examples
- For experienceMatch: Include specific numbers and metrics to add
- For skillsAlignment: List the exact missing skills to include
- Make all recommendations immediately actionable with specific examples
- IMPORTANT: All "examples" fields must be STRINGS, not objects. Format as: "Found: keyword1, keyword2. Missing: keyword3, keyword4"
- Do NOT return objects with "found" and "missing" keys in examples field
- SCORE VARIATION: Be REALISTIC and STRICT - most CVs should score 40-70. Excellent, job-perfect CVs: 80-95. Good but needs work: 65-79. Average/mediocre: 45-64. Poor with major issues: 20-44. Completely irrelevant: 10-35. Don't give similar scores - vary widely based on actual quality.

Analyze the actual CV content provided. Make all scores, feedback, examples, and recommendations specific to the CV content. Be detailed and professional. Give realistic, varied scores based on actual CV quality and job relevance.`;
  }

  /**
   * Parse JSON response from AI (handles markdown code blocks)
   */
  static parseAIResponse(responseText: string): ATSReviewResult {
    let jsonString = responseText.trim();
    
    // Extract JSON from response (handle markdown code blocks if present)
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json\s*/g, '').replace(/```\s*$/g, '');
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```\s*/g, '').replace(/```\s*$/g, '');
    }
    
    // Parse JSON response
    let analysisResult: ATSReviewResult;
    try {
      analysisResult = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Response content:', jsonString);
      throw new Error('Failed to parse AI response. Please try again.');
    }

    // Validate response structure
    if (!analysisResult.overallScore || !analysisResult.scoreBreakdown) {
      throw new Error('Invalid analysis result structure from AI');
    }

    return analysisResult;
  }

  /**
   * Generate ATS CV Review by calling Supabase Edge Function (AI proxy)
   */
  static async generateReview(request: ATSReviewRequest): Promise<ATSReviewResult> {
    try {
      // Build prompt locally
      const prompt = this.buildPrompt(request);

      // Call Supabase function (just passes prompt to Gemini API)
      const { data, error } = await supabase.functions.invoke('ats-cv-review', {
        body: {
          prompt,
          temperature: 0.2,
          maxTokens: 8192,
        },
      });

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to generate ATS review');
      }

      // Parse response locally
      const analysisResult = this.parseAIResponse(data.data);

      return analysisResult;
    } catch (error: any) {
      console.error('Error generating ATS review:', error);
      throw new Error(error.message || 'Failed to generate ATS review. Please try again.');
    }
  }

  /**
   * Create a new ATS review session
   */
  static createSession(
    cvName: string,
    result: ATSReviewResult,
    reviewType: 'cv-only' | 'cv-job',
    jobTitle?: string,
    jobCompany?: string
  ): ATSReviewSession {
    return {
      id: `ats_review_${Date.now()}`,
      timestamp: Date.now(),
      cvName,
      jobTitle,
      jobCompany,
      overallScore: result.overallScore,
      reviewType,
      lastMessage: result.overallExplanation || result.summary || 'ATS CV Review completed',
      fullAnalysis: result,
    };
  }

  /**
   * Save session to localStorage
   */
  static saveSession(session: ATSReviewSession): void {
    try {
      // Add to history
      const history = this.getHistory();
      const existingIndex = history.findIndex(s => s.id === session.id);
      
      if (existingIndex >= 0) {
        history[existingIndex] = session;
      } else {
        history.unshift(session);
      }

      // Keep only last 20 sessions
      const limitedHistory = history.slice(0, 20);
      localStorage.setItem('ats_cv_review_history', JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  /**
   * Get session history
   */
  static getHistory(): ATSReviewSession[] {
    try {
      const history = localStorage.getItem('ats_cv_review_history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error reading history:', error);
      return [];
    }
  }

  /**
   * Get session by ID
   */
  static getSessionById(sessionId: string): ATSReviewSession | null {
    const history = this.getHistory();
    return history.find(s => s.id === sessionId) || null;
  }

  /**
   * Delete session from history
   */
  static deleteSession(sessionId: string): void {
    try {
      const history = this.getHistory();
      const filtered = history.filter(s => s.id !== sessionId);
      localStorage.setItem('ats_cv_review_history', JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }
}
