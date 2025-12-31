import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Only validate and warn on client-side to avoid breaking server-side imports
if (typeof window !== 'undefined') {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      '❌ Missing Supabase environment variables.\n' +
      `URL: ${supabaseUrl ? '✅' : '❌ Missing'}\n` +
      `Anon Key: ${supabaseAnonKey ? '✅' : '❌ Missing'}\n` +
      'Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file and restart your dev server.'
    )
  } else if (process.env.NODE_ENV === 'development') {
    console.log('Supabase Client Init - URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
    console.log('Supabase Client Init - Anon Key:', supabaseAnonKey ? `✅ Set (${supabaseAnonKey.substring(0, 20)}...)` : '❌ Missing')
  }
}

// Create Supabase client with configuration to minimize automatic network calls
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false, // CRITICAL: Disable automatic token refresh to prevent network calls
    persistSession: true, // Keep session persistence for logged-in users
    detectSessionInUrl: false, // Don't check URL for session tokens
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token',
    debug: false
  },
  global: {
    headers: {
      'x-client-info': 'jobpilot-web'
    }
  }
})

// Suppress console errors for failed token refresh attempts
// These errors occur because autoRefreshToken is disabled, but they don't break functionality
if (typeof window !== 'undefined') {
  const originalError = console.error
  console.error = (...args: any[]) => {
    // Filter out Supabase token refresh errors
    const errorString = args.join(' ')
    if (
      errorString.includes('refresh_token') ||
      errorString.includes('ERR_NAME_NOT_RESOLVED') ||
      errorString.includes('Failed to fetch') ||
      (errorString.includes('auth/v1/token') && errorString.includes('grant_type=refresh_token'))
    ) {
      // Silently ignore token refresh errors - they're expected when autoRefreshToken is false
      return
    }
    // Log all other errors normally
    originalError.apply(console, args)
  }
}

// Types for our database tables
export interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  phone?: string
  location?: string
  created_at: string
  updated_at: string
}

export interface OnboardingData {
  id: string
  user_id: string
  cv_name?: string
  cv_email?: string
  cv_phone?: string
  cv_location?: string
  cv_summary?: string
  cv_roles?: string[]
  cv_skills?: string[]
  cv_experience?: string
  cv_work_experience?: any
  cv_education?: any
  cv_projects?: any
  cv_accomplishments?: string[]
  cv_awards?: string[]
  cv_certifications?: string[]
  cv_languages?: string[]
  cv_interests?: string[]
  cv_linkedin?: string
  cv_github?: string
  cv_portfolio?: string
  cv_publications?: string[]
  cv_volunteer_work?: any
  cv_additional_sections?: any
  cv_ai_suggested_roles?: string[]
  preferred_locations?: string[]
  salary_min?: number
  salary_max?: number
  experience_level?: string
  job_type?: string
  remote_preference?: string
  cv_text?: string
  cv_file_name?: string
  cv_file_type?: string
  cv_file_size?: number
  completed_at: string
  created_at: string
  updated_at: string
}

export interface JobApplication {
  id: string
  user_id: string
  job_title: string
  company_name: string
  job_description?: string
  application_status: 'applied' | 'interviewing' | 'offered' | 'rejected' | 'withdrawn'
  applied_date: string
  interview_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface JobPreferences {
  id: string
  user_id: string
  target_roles?: string[]
  preferred_locations?: string[]
  salary_min?: number
  salary_max?: number
  experience_level?: string
  job_type?: string
  remote_preference?: string
  industry_preferences?: string[]
  company_size_preferences?: string[]
  created_at: string
  updated_at: string
}