// Interview Prep Service
// Builds prompts locally and calls Supabase Edge Function (AI proxy only)

import { supabase } from '@/lib/supabase';

export interface InterviewQuestion {
  question: string;
  type: 'behavioral' | 'technical' | 'situational' | 'experience';
  category: string;
  expectedTopics: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface AnswerEvaluation {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  suggestedAnswer: string;
  tips: string[];
}

export interface ChatMessage {
  id: string;
  type: 'question' | 'answer' | 'feedback';
  content: string;
  timestamp: number;
}

export interface InterviewSession {
  id: string;
  timestamp: number;
  jobTitle?: string;
  jobCompany?: string;
  jobDescription: string;
  cvUsed: boolean;
  chat: ChatMessage[];
  completed: boolean;
  currentPhase: 'introduction' | 'questioning' | 'completed';
}

export class InterviewPrepService {
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
        return text.substring(0, 2000); // Limit to 2000 chars for context
      } catch (e) {
        // Not valid JSON, treat as plain text
      }
    }
    
    // If it contains HTML tags, extract text (basic extraction)
    if (cvContent.includes('<')) {
      return cvContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 2000);
    }
    
    // Otherwise return as-is (plain text), limited
    return cvContent.substring(0, 2000);
  }

  /**
   * Parse JSON response from AI (handles markdown code blocks and various formats)
   */
  static parseAIResponse<T>(responseText: string): T {
    let jsonString = responseText.trim();

    console.log('Raw response:', jsonString.substring(0, 500));

    // Extract JSON from response (handle markdown code blocks if present)
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.replace(/^```json\s*/g, '').replace(/```\s*$/g, '');
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```\s*/g, '').replace(/```\s*$/g, '');
    }

    // Try to find JSON object in the response
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }

    console.log('Extracted JSON string:', jsonString.substring(0, 500));

    // Parse JSON response
    try {
      return JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Final JSON string:', jsonString);

      // Try to fix common JSON issues
      let fixedJson = jsonString;

      // Fix trailing commas
      fixedJson = fixedJson.replace(/,(\s*[}\]])/g, '$1');

      // Fix unquoted keys
      fixedJson = fixedJson.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

      try {
        return JSON.parse(fixedJson);
      } catch (secondError) {
        console.error('Failed to parse even with fixes:', secondError);
        throw new Error('Failed to parse AI response. Please try again.');
      }
    }
  }

  /**
   * Build prompt for generating interview questions
   */
  static buildQuestionsPrompt(
    jobDescription: string,
    jobTitle?: string,
    jobCompany?: string,
    cvContent?: string
  ): string {
    const QUESTION_GENERATION_PROMPT = `You are an expert interview coach. Generate personalized interview questions based on a job description and optionally a candidate's CV.

Your response must be valid JSON only, matching this exact structure:

{
  "questions": [
    {
      "question": "The interview question text",
      "type": "behavioral" | "technical" | "situational" | "experience",
      "category": "e.g., Problem Solving, Leadership, Technical Skills",
      "expectedTopics": ["topic1", "topic2"],
      "difficulty": "easy" | "medium" | "hard"
    }
  ]
}

Requirements:
- Generate 8-10 diverse interview questions
- Mix of behavioral, technical, and situational questions
- Questions should be specific to the job role and requirements
- If CV is provided, tailor questions to the candidate's experience
- Include questions about skills mentioned in the job description
- Vary difficulty levels appropriately
- Return ONLY valid JSON with no additional text, no markdown, no code blocks, no explanations`;

    let cvText = '';
    if (cvContent) {
      cvText = this.extractCVText(cvContent);
    }

    // Limit job description to prevent token limits
    const limitedJobDescription = jobDescription.length > 3000 ?
      jobDescription.substring(0, 3000) + '...' : jobDescription;

    return `${QUESTION_GENERATION_PROMPT}

Job Details:
- Title: ${jobTitle || 'Not specified'}
- Company: ${jobCompany || 'Not specified'}
- Description: ${limitedJobDescription}

${cvText ? `Candidate CV Summary:
${cvText}` : 'Note: No CV provided. Generate general questions based on the job description only.'}

Generate interview questions that are relevant, challenging, and help the candidate prepare for this role.`;
  }

  /**
   * Build prompt for evaluating an answer
   */
  static buildEvaluationPrompt(
    question: string,
    answer: string,
    jobDescription?: string,
    jobTitle?: string,
    cvContent?: string,
    questionNumber?: number,
    totalQuestions?: number,
    previousAnswers?: Array<{ question: string; answer: string; feedback: string }>
  ): string {
    const ANSWER_EVALUATION_PROMPT = `You are an expert interview coach evaluating a candidate's answer to an interview question.

Your response must be valid JSON only, matching this exact structure:

{
  "score": 85,
  "feedback": "Overall feedback on the answer",
  "strengths": [
    "Strength 1",
    "Strength 2"
  ],
  "improvements": [
    "Improvement area 1",
    "Improvement area 2"
  ],
  "suggestedAnswer": "A well-structured example answer for reference",
  "tips": [
    "Tip 1 for improving",
    "Tip 2 for improving"
  ]
}

Requirements:
- Score should be 0-100 based on answer quality
- Provide specific, actionable feedback
- Highlight what the candidate did well
- Suggest concrete improvements
- Provide a model answer for learning
- Be encouraging but constructive
- Return ONLY valid JSON, no markdown formatting, no code blocks`;

    let cvText = '';
    if (cvContent) {
      cvText = this.extractCVText(cvContent);
    }

    return `${ANSWER_EVALUATION_PROMPT}

Job Context:
- Title: ${jobTitle || 'Not specified'}
- Company: ${jobDescription ? 'See description below' : 'Not specified'}
${jobDescription ? `- Description: ${jobDescription.substring(0, 1000)}${jobDescription.length > 1000 ? '...' : ''}` : ''}

Interview Question (Question ${questionNumber || '?'} of ${totalQuestions || '?'}):
"${question}"

Candidate's Answer:
"${answer}"

${cvText ? `Candidate Background Context:
${cvText}` : ''}

${previousAnswers && previousAnswers.length > 0 ? `Previous Questions Context:
${previousAnswers.slice(-3).map((qa, i) => `Q${i + 1}: ${qa.question.substring(0, 100)}...`).join('\n')}` : ''}

Evaluate this answer and provide constructive feedback.`;
  }

  /**
   * Parse JSON response from AI (handles markdown code blocks)
   */
  static parseAIResponse<T>(responseText: string): T {
    let jsonString = responseText.trim();
    
    // Extract JSON from response (handle markdown code blocks if present)
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }
    
    try {
      return JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Response text:', responseText);
      throw new Error('Failed to parse AI response');
    }
  }

  /**
   * Generate interview questions
   */
  static async generateQuestions(
    jobDescription: string,
    jobTitle?: string,
    jobCompany?: string,
    cvContent?: string
  ): Promise<InterviewQuestion[]> {
    try {
      console.log('Building interview questions prompt...');
      console.log('Job description length:', jobDescription?.length);
      console.log('Job title:', jobTitle);
      console.log('Job company:', jobCompany);
      console.log('CV content length:', cvContent?.length);

      // Build prompt locally
      const prompt = this.buildQuestionsPrompt(jobDescription, jobTitle, jobCompany, cvContent);
      console.log('Generated prompt length:', prompt.length);

      // Call Supabase function (just passes prompt to Gemini API)
      console.log('Calling Supabase interview-prep function...');
      const { data, error } = await supabase.functions.invoke('interview-prep', {
        body: {
          prompt,
          temperature: 0.7,
          maxTokens: 4096, // Reduce token limit to avoid truncation
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Failed to generate questions: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from interview prep service');
      }

      console.log('Supabase function response:', data);

      if (!data.success) {
        throw new Error(data?.error || 'Failed to generate interview questions');
      }

      // Parse response locally
      console.log('Parsing AI response:', data.data);
      const result = this.parseAIResponse<{ questions: InterviewQuestion[] }>(data.data);

      console.log('Parsed result:', result);

      if (!result.questions || !Array.isArray(result.questions)) {
        console.error('Invalid question generation structure:', result);
        throw new Error('Invalid question generation structure');
      }

      if (result.questions.length === 0) {
        throw new Error('No questions generated. Please try again.');
      }

      return result.questions;
    } catch (error: any) {
      console.error('Error generating questions:', error);

      // Provide more specific error messages
      if (error.message?.includes('non-2xx status code')) {
        throw new Error('AI service is currently unavailable. Please try again in a few moments.');
      } else if (error.message?.includes('API key')) {
        throw new Error('AI service configuration error. Please contact support.');
      } else if (error.message?.includes('parse')) {
        throw new Error('AI response format error. Please try again.');
      }

      throw new Error(error.message || 'Failed to generate interview questions. Please try again.');
    }
  }

  /**
   * Process user answer and get next question (chat-based)
   */
  static async processChatResponse(
    session: InterviewSession,
    userAnswer: string
  ): Promise<{ feedback: string; nextQuestion: string | null }> {
    try {
      const prompt = this.buildChatPrompt(session, userAnswer);

      // Call Supabase function
      const { data, error } = await supabase.functions.invoke('interview-prep', {
        body: {
          prompt,
          temperature: 0.7,
          maxTokens: 1000, // Shorter responses for chat
        },
      });

      if (error) {
        throw new Error(`Failed to process chat response: ${error.message}`);
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Failed to process chat response');
      }

      // Parse response
      const result = this.parseAIResponse<{ feedback: string; nextQuestion: string | null }>(data.data);

      return result;
    } catch (error: any) {
      console.error('Error processing chat response:', error);
      throw new Error(error.message || 'Failed to process your answer. Please try again.');
    }
  }

  /**
   * Build prompt for chat-based interview responses
   */
  static buildChatPrompt(session: InterviewSession, userAnswer: string): string {
    const CHAT_PROMPT = `You are an expert interview coach conducting a conversational interview. The candidate just answered a question. Provide brief feedback and ask the next relevant question.

Your response must be valid JSON only, matching this exact structure:

{
  "feedback": "2-3 sentence brief feedback on their answer",
  "nextQuestion": "The next interview question, or null if interview should end"
}

Guidelines:
- Keep feedback brief and encouraging
- Ask only ONE follow-up question per response
- Make questions specific to the job: ${session.jobTitle} at ${session.jobCompany || 'company'}
- Cover: experience, skills, problem-solving, team work, motivation
- End interview after 8-10 questions total
- Return ONLY valid JSON, no markdown, no explanations`;

    // Build conversation history
    const recentMessages = session.chat.slice(-6); // Last 6 messages for context
    const conversationHistory = recentMessages.map(msg =>
      `${msg.type === 'question' ? 'Interviewer' : 'Candidate'}: ${msg.content}`
    ).join('\n');

    return `${CHAT_PROMPT}

Job Details:
- Title: ${session.jobTitle || 'Not specified'}
- Company: ${session.jobCompany || 'Not specified'}
- Description: ${session.jobDescription.substring(0, 500)}${session.jobDescription.length > 500 ? '...' : ''}

Conversation History:
${conversationHistory}

Candidate's latest answer: "${userAnswer}"

Provide brief feedback and ask the next question, or end the interview if appropriate.`;
  }

  /**
   * Evaluate an answer
   */
  static async evaluateAnswer(
    question: string,
    answer: string,
    jobDescription?: string,
    jobTitle?: string,
    cvContent?: string,
    questionNumber?: number,
    totalQuestions?: number,
    previousAnswers?: Array<{ question: string; answer: string; feedback: string }>
  ): Promise<AnswerEvaluation> {
    try {
      // Build prompt locally
      const prompt = this.buildEvaluationPrompt(
        question,
        answer,
        jobDescription,
        jobTitle,
        cvContent,
        questionNumber,
        totalQuestions,
        previousAnswers
      );

      // Call Supabase function (just passes prompt to Gemini API)
      const { data, error } = await supabase.functions.invoke('interview-prep', {
        body: {
          prompt,
          temperature: 0.7,
          maxTokens: 8192,
        },
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Failed to evaluate answer: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from interview prep service');
      }

      if (!data.success) {
        throw new Error(data?.error || 'Failed to evaluate answer');
      }

      // Parse response locally
      const result = this.parseAIResponse<AnswerEvaluation>(data.data);

      if (typeof result.score !== 'number' || !result.feedback) {
        throw new Error('Invalid evaluation structure');
      }

      return result;
    } catch (error: any) {
      console.error('Error evaluating answer:', error);
      throw new Error(error.message || 'Failed to evaluate answer. Please try again.');
    }
  }

  /**
   * Create a new chat-based interview session
   */
  static createSession(
    jobDescription: string,
    jobTitle?: string,
    jobCompany?: string,
    cvUsed: boolean = false
  ): InterviewSession {
    const session: InterviewSession = {
      id: `interview_${Date.now()}`,
      timestamp: Date.now(),
      jobTitle,
      jobCompany,
      jobDescription,
      cvUsed,
      chat: [],
      completed: false,
      currentPhase: 'introduction',
    };

    // Start with the introduction question
    session.chat.push({
      id: 'intro',
      type: 'question',
      content: "Tell me about yourself. I'd like to know about your background, experience, and what you're looking for in this role.",
      timestamp: Date.now(),
    });

    return session;
  }

  /**
   * Save session to localStorage
   */
  static saveSession(session: InterviewSession): void {
    try {
      // Save current session
      localStorage.setItem('interview_prep_current_session', JSON.stringify(session));

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
      localStorage.setItem('interview_prep_history', JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  /**
   * Get current session
   */
  static getCurrentSession(): InterviewSession | null {
    try {
      const session = localStorage.getItem('interview_prep_current_session');
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error('Error loading session:', error);
      return null;
    }
  }

  /**
   * Get session history
   */
  static getHistory(): InterviewSession[] {
    try {
      const history = localStorage.getItem('interview_prep_history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error reading history:', error);
      return [];
    }
  }

  /**
   * Get session by ID
   */
  static getSessionById(sessionId: string): InterviewSession | null {
    const history = this.getHistory();
    return history.find(s => s.id === sessionId) || null;
  }

  /**
   * Clear current session
   */
  static clearCurrentSession(): void {
    localStorage.removeItem('interview_prep_current_session');
  }
}
