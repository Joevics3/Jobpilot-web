"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Upload,
  FileText,
  User,
  Briefcase,
  MapPin,
  DollarSign,
  GraduationCap,
  Target,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Plus,
  Brain,
  Building,
  Clock,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Trash2,
  Star,
  Trophy,
  Award,
  BookOpen,
  Sparkles,
  Banknote,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function OnboardingPage() {
  const router = useRouter();
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  
  // CV upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    roles: [],
    skills: [],
    experience: '',
    workExperience: [],
    education: [],
    projects: [],
    accomplishments: [],
    awards: [],
    certifications: [],
    languages: [],
    interests: [],
    linkedin: '',
    github: '',
    portfolio: '',
    publications: [],
    volunteerWork: [],
    additionalSections: [],
    cvAiSuggestedRoles: [] // Changed from geminiSuggestedRoles to match mobile app
  });
  const [error, setError] = useState('');
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [newRole, setNewRole] = useState('');
  const [preferences, setPreferences] = useState({
    locations: [] as string[],
    salaryMin: '',
    salaryMax: '',
    experienceLevel: '',
    jobType: '',
    remotePreference: '',
    sector: '' // Added to match mobile app and Supabase table
  });
  const [locationInput, setLocationInput] = useState('');

  // Auth states for step 4
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [isSavingData, setIsSavingData] = useState(false);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Helper function to check if user can complete onboarding
  const canCompleteOnboarding = extractedData.name && selectedRoles.length > 0;

  // Function to clear all onboarding data
  const clearAllData = () => {
    // Clear CV data
    setSelectedFile(null);
    setCvText('');
    setExtractedData({
      name: '',
      email: '',
      phone: '',
      location: '',
      summary: '',
      roles: [],
      skills: [],
      experience: '',
      workExperience: [],
      education: [],
      projects: [],
      accomplishments: [],
      awards: [],
      certifications: [],
      languages: [],
      interests: [],
      linkedin: '',
      github: '',
      portfolio: '',
      publications: [],
      volunteerWork: [],
      additionalSections: [],
      cvAiSuggestedRoles: []
    });
    
    // Clear role selection
    setSelectedRoles([]);
    
    // Clear preferences
    setPreferences({
      locations: [],
      salaryMin: '80000',
      salaryMax: '120000',
      experienceLevel: '3-5 years',
      jobType: 'Full-time',
      remotePreference: 'Remote OK',
      sector: ''
    });
    
    // Clear any error states
    setError('');
    setIsProcessing(false);
    setShowLoadingOverlay(false);
    setIsCompleting(false);
    
    // Clear form states
    setSignInData({
      email: '',
      password: ''
    });
    
    setSignUpData({
      fullName: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    
    // Clear message states
    setMessage('');
    setMessageType('success');
    setEmailConfirmationSent(false);
    setIsRedirecting(false);
    setIsSavingData(false);
    
    // Reset to step 1
    setCurrentStep(1);
    
    // Clear localStorage data (updated to match mobile app cache keys)
    try {
      localStorage.removeItem('onboarding_cv_data');
      localStorage.removeItem('onboarding_cv_file');
      localStorage.removeItem('onboarding_job_preferences');
      localStorage.removeItem('onboarding_target_roles');
      localStorage.removeItem('tempUploadedCV');
      localStorage.removeItem('completedOnboarding');
      // Legacy keys for backward compatibility
      localStorage.removeItem('extractedProfile');
      localStorage.removeItem('cvText');
      localStorage.removeItem('onboardingPreferences');
    } catch (storageError) {
      console.warn('Failed to clear localStorage:', storageError);
    }
    
    // Force a page refresh to ensure all components reset to initial state
    window.location.reload();
  };

  // Form states for step 4
  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  const [signUpData, setSignUpData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Auto-fill signup form with extracted CV data (similar to mobile app)
  React.useEffect(() => {
    if (extractedData.name && !signUpData.fullName) {
      setSignUpData(prev => ({ ...prev, fullName: extractedData.name }));
    }
    if (extractedData.email && !signUpData.email) {
      setSignUpData(prev => ({ ...prev, email: extractedData.email }));
    }
  }, [extractedData.name, extractedData.email]); // Only run when extracted data changes

  // Check for temporarily stored CV file on component mount
  // REMOVED: No network calls on mount - user can re-upload if needed
  // The temp CV check was making unnecessary fetch calls

  // Function to process the temporary CV file
  const processTempCVFile = async (file: File) => {
    
    // Validate file type
    const isPDF = file.type === "application/pdf";
    const isImage = file.type.includes("image");
    const isDocument = file.type.includes("document") || file.name.endsWith('.doc') || file.name.endsWith('.docx');
    
    if (!isPDF && !isImage && !isDocument) {
      throw new Error("Please upload a PDF, Word document (DOC/DOCX), or image file");
    }
    
    try {
      // Extract text from file
      const form = new FormData();
      form.append('file', file);
      
      const res = await fetch('/api/onboarding/ocr', { method: 'POST', body: form });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`OCR failed: ${res.status} ${errorText}`);
      }
      
      const data = await res.json();
      
      if (data?.text) {
        setCvText(data.text as string);
        
        // Parse the CV text immediately
        await parseTempCVText(data.text as string);
      } else {
        throw new Error('No text extracted from file');
      }
    } catch (error) {
      console.error('Temp CV processing error:', error);
      throw error;
    }
  };

  // Function to parse the temporary CV text
  const parseTempCVText = async (text: string) => {
    if (process.env.NODE_ENV === 'development') console.log('🔄 Starting temp CV parsing, text length:', text.length);

    try {
      const res = await fetch('/api/onboarding/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (process.env.NODE_ENV === 'development') console.log('📡 Parse API response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        if (process.env.NODE_ENV === 'development') console.log('❌ Parse API error response:', errorText);
        const errorData = await res.json().catch(() => ({ error: `Parsing failed: ${res.status}`, details: errorText }));
        throw new Error(errorData.error || `Parsing failed: ${res.status}`);
      }

      const data = await res.json();
      if (process.env.NODE_ENV === 'development') console.log('📄 Parse API response data:', data);

      if (!data?.parsed) {
        if (process.env.NODE_ENV === 'development') console.log('❌ Missing parsed data in response');
        throw new Error('Invalid response: missing parsed data');
      }

      if (process.env.NODE_ENV === 'development') console.log('✅ Parse successful, profile data:', data.parsed);
      
      // Extract roles from work experience (actual CV roles)
      const cvRoles = data.parsed.workExperience?.map((exp: any) => exp.title) || [];
      
      const profile = {
        name: data.parsed.fullName || 'Name not found',
        email: data.parsed.email || 'Email not found',
        phone: data.parsed.phone || 'Phone not found',
        location: data.parsed.location || 'Location not found',
        summary: data.parsed.summary || 'Summary not found',
        roles: cvRoles, // Roles found in the CV (work experience)
        skills: Array.isArray(data.parsed.skills) ? data.parsed.skills : [],
        experience: 'Experience level to be determined',
        workExperience: Array.isArray(data.parsed.workExperience) ? data.parsed.workExperience : [],
        education: Array.isArray(data.parsed.education) ? data.parsed.education : [],
        projects: Array.isArray(data.parsed.projects) ? data.parsed.projects : [],
        accomplishments: Array.isArray(data.parsed.accomplishments) ? data.parsed.accomplishments : [],
        awards: Array.isArray(data.parsed.awards) ? data.parsed.awards : [],
        certifications: Array.isArray(data.parsed.certifications) ? data.parsed.certifications : [],
        languages: Array.isArray(data.parsed.languages) ? data.parsed.languages : [],
        interests: Array.isArray(data.parsed.interests) ? data.parsed.interests : [],
        linkedin: data.parsed.linkedin || '',
        github: data.parsed.github || '',
        portfolio: data.parsed.portfolio || '',
        publications: Array.isArray(data.parsed.publications) ? data.parsed.publications : [],
        volunteerWork: Array.isArray(data.parsed.volunteerWork) ? data.parsed.volunteerWork : [],
        additionalSections: Array.isArray(data.parsed.additionalSections) ? data.parsed.additionalSections : [],
        cvAiSuggestedRoles: Array.isArray(data.parsed.suggestedRoles) ? data.parsed.suggestedRoles : [] // AI-generated additional roles
      };
      
      // Set the extracted profile immediately
      setExtractedData(profile);
      
      // Store locally (updated to match mobile app cache keys)
      try {
        localStorage.setItem('onboarding_cv_data', JSON.stringify(profile));
        localStorage.setItem('onboarding_cv_file', JSON.stringify({ text }));
        // Legacy keys for backward compatibility
        localStorage.setItem('extractedProfile', JSON.stringify(profile));
        localStorage.setItem('cvText', text);
      } catch (storageError) {
        console.warn('Failed to save to localStorage:', storageError);
      }
    } catch (error) {
      console.error('Temp CV parsing error:', error);
      throw error;
    }
  };

  // Save preferences to localStorage whenever they change (updated to match mobile app)
  React.useEffect(() => {
    try {
      localStorage.setItem('onboarding_job_preferences', JSON.stringify(preferences));
      // Legacy key for backward compatibility
      localStorage.setItem('onboardingPreferences', JSON.stringify(preferences));
    } catch (storageError) {
      console.warn('Failed to save preferences to localStorage:', storageError);
    }
  }, [preferences]);

  // REMOVED: Preloading preferences on mount - only load when user reaches step 3

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    // Clear message after 5 seconds for success, 8 seconds for errors
    setTimeout(() => setMessage(''), type === 'success' ? 5000 : 8000);
  };

  const validateSignUpForm = () => {
    // Check full name - use extractedData as fallback
    const fullName = signUpData.fullName.trim() || extractedData.name?.trim() || '';
    if (!fullName) {
      showMessage('Full name is required', 'error');
      return false;
    }
    
    // Check email - use extractedData as fallback
    const email = signUpData.email.trim() || extractedData.email?.trim() || '';
    if (!email) {
      showMessage('Email is required', 'error');
      return false;
    }
    
    // Better email validation using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessage('Please enter a valid email address', 'error');
      return false;
    }
    
    if (signUpData.password.length < 6) {
      showMessage('Password must be at least 6 characters long', 'error');
      return false;
    }
    
    if (signUpData.password !== signUpData.confirmPassword) {
      showMessage('Passwords do not match', 'error');
      return false;
    }
    
    return true;
  };

  const validateSignInForm = () => {
    if (!signInData.email.trim()) {
      showMessage('Email is required', 'error');
      return false;
    }
    
    if (!signInData.password.trim()) {
      showMessage('Password is required', 'error');
      return false;
    }
    
    return true;
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    setMessage('');

    // Check if onboarding data is complete
    if (!canCompleteOnboarding) {
      showMessage('Please complete all previous steps before signing in', 'error');
      setIsLoading(false);
      return;
    }

    // Validate form data
    if (!validateSignInForm()) {
      setIsLoading(false);
      return;
    }

    try {
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInData.email.trim(),
        password: signInData.password,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          showMessage('Please check your email and confirm your account before signing in.', 'error');
        } else {
          showMessage(error.message, 'error');
        }
        return;
      }

      if (data.user && data.session) {
        // User is now authenticated, save onboarding data (will use cached data if available)
        try {
          setIsRedirecting(true);
          await saveOnboardingDataToSupabase(data.user);
          
          // Clear cached data since it's now saved
          localStorage.removeItem('pending_onboarding_data');
          
          showMessage('Signed in successfully! Redirecting...', 'success');
          
          // Redirect to dashboard using Next.js router
          setTimeout(() => {
            console.log('Attempting to redirect to dashboard...');
            try {
              router.push('/');
            } catch (redirectError) {
              console.error('Router redirect failed:', redirectError);
              // Fallback to window.location
              window.location.href = '/';
            }
          }, 1500);
        } catch (saveError: any) {
          console.error('Error saving onboarding data:', saveError);
          setIsRedirecting(false);
          showMessage('Signed in successfully, but there was an issue saving your data. You can update it later in your dashboard.', 'success');
          
          // Still redirect to dashboard even if data saving fails
          setTimeout(() => {
            console.log('Attempting to redirect to dashboard (fallback)...');
            try {
              router.push('/dashboard');
            } catch (redirectError) {
              console.error('Router redirect failed (fallback):', redirectError);
              // Fallback to window.location
              window.location.href = '/dashboard';
            }
          }, 2000);
        }
      }

    } catch (error: any) {
      showMessage(error.message || 'Failed to sign in', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    setIsLoading(true);
    setMessage('');

    // Check if onboarding data is complete
    if (!canCompleteOnboarding) {
      showMessage('Please complete all previous steps before creating an account', 'error');
      setIsLoading(false);
      return;
    }

    // Validation
    if (!validateSignUpForm()) {
      setIsLoading(false);
      return;
    }

    try {
      // Get the actual values to use (prefer signUpData, fallback to extractedData)
      const fullName = signUpData.fullName.trim() || extractedData.name?.trim() || '';
      const email = signUpData.email.trim() || extractedData.email?.trim() || '';

      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: signUpData.password.trim(),
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) {
        // Handle specific Supabase auth errors (similar to mobile app)
        const errorMsg = error.message.toLowerCase();
        let errorMessage = error.message;

        if (errorMsg.includes('user already registered') || errorMsg.includes('already registered')) {
          errorMessage = 'This email address is already registered. Please try signing in instead or use a different email address.';
        } else if (errorMsg.includes('invalid email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (errorMsg.includes('password should be at least') || errorMsg.includes('password')) {
          errorMessage = 'Password must be at least 6 characters long.';
        }

        showMessage(errorMessage, 'error');
        return;
      }

      if (data.user) {
        if (!data.session) {
          // Email confirmation required - cache onboarding data for when user confirms email
          setEmailConfirmationSent(true);
          
          // Cache onboarding data with user ID so we can save it after email confirmation
          try {
            const onboardingDataToCache = {
              userId: data.user.id,
              userEmail: data.user.email,
              cvData: extractedData,
              selectedRoles,
              preferences,
              cvText,
              cvFileName: selectedFile?.name,
              cvFileType: selectedFile?.type,
              cvFileSize: selectedFile?.size,
              cachedAt: new Date().toISOString()
            };
            localStorage.setItem('pending_onboarding_data', JSON.stringify(onboardingDataToCache));
            console.log('Onboarding data cached for user:', data.user.id);
          } catch (cacheError) {
            console.error('Error caching onboarding data:', cacheError);
          }
          
          showMessage('Account created! Please check your email to confirm your account before signing in.', 'success');
          
          // Clear the form
          setSignUpData({
            fullName: '',
            email: '',
            password: '',
            confirmPassword: ''
          });
          
          // Show instructions
          showMessage('Please check your email and click the confirmation link, then return here to sign in.', 'success');
        } else {
          // User has session (email confirmation not required) - save data immediately
          try {
            setIsSavingData(true);
            await saveOnboardingDataToSupabase(data.user);
            showMessage('Account created and onboarding data saved! Redirecting...', 'success');
            
            // Clear cached data since it's now saved
            localStorage.removeItem('pending_onboarding_data');
            
            // Redirect to homepage
            setTimeout(() => {
              router.push('/');
            }, 1500);
          } catch (saveError: any) {
            console.error('Error saving onboarding data:', saveError);
            showMessage('Account created successfully, but there was an issue saving your onboarding data. Please contact support.', 'error');
          } finally {
            setIsSavingData(false);
          }
        }
      }

    } catch (error: any) {
      showMessage(error.message || 'Failed to create account', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const saveOnboardingDataToSupabase = async (user: any) => {
    setIsSavingData(true);
    try {
      // Save profile data (only during signup, not signin)
      const fullName = signUpData.fullName.trim() || extractedData.name?.trim() || null;
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: fullName,
          phone: extractedData.phone || null,
          location: extractedData.location || null,
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error('Error saving profile:', profileError);
        throw new Error('Failed to save profile');
      }

      // Check for cached onboarding data (in case user confirmed email after signup)
      let dataToSave = {
        cvData: extractedData,
        selectedRoles,
        preferences,
        cvText,
        cvFileName: selectedFile?.name,
        cvFileType: selectedFile?.type,
        cvFileSize: selectedFile?.size,
      };
      
      try {
        const cachedData = localStorage.getItem('pending_onboarding_data');
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          // Use cached data if available and matches current user
          if (parsed.userId === user.id) {
            dataToSave = {
              cvData: parsed.cvData || extractedData,
              selectedRoles: parsed.selectedRoles || selectedRoles,
              preferences: parsed.preferences || preferences,
              cvText: parsed.cvText || cvText,
              cvFileName: parsed.cvFileName || selectedFile?.name,
              cvFileType: parsed.cvFileType || selectedFile?.type,
              cvFileSize: parsed.cvFileSize || selectedFile?.size,
            };
            console.log('Using cached onboarding data for user:', user.id);
          }
        }
      } catch (cacheError) {
        console.warn('Error reading cached onboarding data, using current state:', cacheError);
      }

      // Save onboarding data - using upsert in case user_id already exists
      const { error: onboardingError } = await supabase
        .from('onboarding_data')
        .upsert({
          user_id: user.id,
          cv_name: dataToSave.cvData.name || null,
          cv_email: dataToSave.cvData.email || null,
          cv_phone: dataToSave.cvData.phone || null,
          cv_location: dataToSave.cvData.location || null,
          cv_summary: dataToSave.cvData.summary || null,
          cv_roles: dataToSave.cvData.roles || [],
          cv_skills: dataToSave.cvData.skills || [],
          cv_experience: dataToSave.cvData.experience || null,
          cv_work_experience: dataToSave.cvData.workExperience || null,
          cv_education: dataToSave.cvData.education || null,
          cv_projects: dataToSave.cvData.projects || null,
          cv_accomplishments: dataToSave.cvData.accomplishments || [],
          cv_awards: dataToSave.cvData.awards || [],
          cv_certifications: dataToSave.cvData.certifications || [],
          cv_languages: dataToSave.cvData.languages || [],
          cv_interests: dataToSave.cvData.interests || [],
          cv_linkedin: dataToSave.cvData.linkedin || null,
          cv_github: dataToSave.cvData.github || null,
          cv_portfolio: dataToSave.cvData.portfolio || null,
          cv_publications: dataToSave.cvData.publications || [],
          cv_volunteer_work: dataToSave.cvData.volunteerWork || null,
          cv_additional_sections: dataToSave.cvData.additionalSections || null,
          target_roles: dataToSave.selectedRoles || [],
          preferred_locations: dataToSave.preferences.locations || [],
          salary_min: dataToSave.preferences.salaryMin ? parseInt(dataToSave.preferences.salaryMin) : null,
          salary_max: dataToSave.preferences.salaryMax ? parseInt(dataToSave.preferences.salaryMax) : null,
          experience_level: dataToSave.preferences.experienceLevel || null,
          job_type: dataToSave.preferences.jobType || null,
          remote_preference: dataToSave.preferences.remotePreference || null,
          sector: dataToSave.preferences.sector || null,
          cv_text: dataToSave.cvText || null,
          cv_file_name: dataToSave.cvFileName || null,
          cv_file_type: dataToSave.cvFileType || null,
          cv_file_size: dataToSave.cvFileSize || null,
          completed_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (onboardingError) {
        console.error('Error saving onboarding data:', onboardingError);
        throw new Error('Failed to save onboarding data');
      }

      console.log('All onboarding data saved successfully to Supabase');
      
    } catch (error) {
      console.error('Error saving onboarding data to Supabase:', error);
      throw error;
    } finally {
      setIsSavingData(false);
    }
  };

  const totalSteps = 4;
  const progressPercentage = (currentStep / totalSteps) * 100;

  // Check if each step is completed
  const isStep1Completed = extractedData.name && extractedData.email;
  const isStep2Completed = selectedRoles.length > 0;
  const isStep3Completed = preferences.locations.length > 0;
  const isStep4Completed = false; // Will be completed after auth

  // Check if onboarding can be completed - removed duplicate declaration
  // const canCompleteOnboarding = isStep1Completed && isStep2Completed && isStep3Completed;

  const suggestedRoles = [
    'Full Stack Developer',
    'Software Engineer',
    'UI/UX Designer',
    'Product Manager',
    'DevOps Engineer',
    'Frontend Developer',
    'Backend Developer',
    'Data Analyst'
  ];

  const handleRoleToggle = React.useCallback((role: string) => {
    setSelectedRoles(prev => {
      const updated = prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role];
      
      // Auto-save to localStorage (updated to match mobile app cache keys)
      try {
        localStorage.setItem('onboarding_target_roles', JSON.stringify(updated));
      } catch (storageError) {
        console.warn('Failed to save target roles to localStorage:', storageError);
      }
      
      return updated;
    });
  }, []);

  // Save selectedRoles to localStorage whenever they change
  React.useEffect(() => {
    try {
      localStorage.setItem('onboarding_target_roles', JSON.stringify(selectedRoles));
    } catch (storageError) {
      console.warn('Failed to save target roles to localStorage:', storageError);
    }
  }, [selectedRoles]);

  // Pre-select CV roles when they're extracted
  React.useEffect(() => {
    if (extractedData.roles && extractedData.roles.length > 0) {
      // Pre-select CV roles by default
      setSelectedRoles(extractedData.roles);
      
      // Also try to load saved target roles from localStorage
      try {
        const savedTargetRoles = localStorage.getItem('onboarding_target_roles');
        if (savedTargetRoles) {
          const parsed = JSON.parse(savedTargetRoles);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSelectedRoles(parsed);
          }
        }
      } catch (storageError) {
        console.warn('Failed to load target roles from localStorage:', storageError);
      }
    }
  }, [extractedData.roles]);

  // Debug logging for selected roles - removed to prevent performance issues
  // React.useEffect(() => {
  //   console.log('selectedRoles changed:', selectedRoles);
  // }, [selectedRoles]);

  const nextStep = React.useCallback(() => {
    if (currentStep < totalSteps) {
      // Save current step data before moving to next
      if (currentStep === 1 && extractedData.name) {
        // Step 1 completed - CV data extracted
      } else if (currentStep === 2 && selectedRoles.length > 0) {
        // Step 2 completed - roles selected
      }
      
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, totalSteps, extractedData.name, selectedRoles.length]);

  const prevStep = React.useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // Don't reset extractedProfile when going back to screen 1
      // This ensures parsing details persist
    }
  }, [currentStep]);

  const completeOnboarding = async () => {
    try {
      setIsCompleting(true);
      console.log('Completing onboarding with data:', {
        cvData: extractedData,
        selectedRoles,
        preferences
      });

      // Save all onboarding data to localStorage
      const onboardingData = {
        cvData: extractedData,
        selectedRoles,
        preferences,
        completedAt: new Date().toISOString()
      };

      localStorage.setItem('completedOnboarding', JSON.stringify(onboardingData));
      console.log('Onboarding data saved to localStorage');

      // Clear temporary onboarding data
      localStorage.removeItem('extractedProfile');
      localStorage.removeItem('cvText');
      localStorage.removeItem('onboardingPreferences');

      // TODO: Here you would typically send data to Supabase
      // For now, we'll just redirect to homepage
      window.location.href = '/';
      
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Handle error appropriately
    } finally {
      setIsCompleting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Upload</CardTitle>
              <CardDescription>
                Upload your CV, paste text, or enter details manually. Our AI will analyze your experience and skills.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <CVUploadStep
                onExtracted={setCvText}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
                onProfileExtracted={setExtractedData}
                onNext={nextStep}
                setShowLoadingOverlay={setShowLoadingOverlay}
                initialProfile={extractedData}
              />
              
              {/* Show Restart button only after CV has been parsed - Sticky Footer */}
              {extractedData.name && (
                <div className="sticky bottom-0 bg-white border-t border-slate-200 pt-4 pb-4 mt-6 -mx-6 px-6 shadow-lg z-10">
                  <div className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={clearAllData}
                      className="px-4 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Restart
                    </Button>
                    <Button 
                      onClick={nextStep}
                      disabled={!extractedData.name}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 2:
        const addCustomRole = () => {
          if (newRole.trim() && !selectedRoles.includes(newRole.trim())) {
            const roleToAdd = newRole.trim();
            setSelectedRoles([...selectedRoles, roleToAdd]);
            setNewRole('');
          }
        };

        return (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-full w-12 h-12 mx-auto mb-2">
                <Briefcase className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl">Roles</CardTitle>
              <CardDescription>
                Choose the job roles you&apos;re interested in. We&apos;ve pre-selected roles based on your CV analysis.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Roles Extracted from CV */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-green-600" />
                  <h3 className="font-medium text-slate-900">Roles Extracted from your CV</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {extractedData.roles && extractedData.roles.length > 0 ? (
                    extractedData.roles.map((role) => (
                      <Badge 
                        key={role}
                        variant={selectedRoles.includes(role) ? "default" : "outline"}
                        className={`cursor-pointer px-3 py-2 transition-all ${
                          selectedRoles.includes(role) 
                            ? 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600' 
                            : 'bg-blue-50 hover:bg-blue-100 hover:border-blue-300 border-blue-200'
                        }`}
                        onClick={() => handleRoleToggle(role)}
                      >
                        {role}
                        {selectedRoles.includes(role) ? (
                          <Check className="h-3 w-3 ml-1" />
                        ) : (
                          <Plus className="h-3 w-3 ml-1" />
                        )}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No roles found in CV analysis</p>
                  )}
                </div>
              </div>
              
              {/* AI Suggested Roles */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="h-5 w-5 text-green-600" />
                  <h3 className="font-medium text-slate-900">Select from Recommended Roles</h3>
                  <div className="flex items-center gap-1 bg-green-50 border border-green-200 rounded px-2 py-1">
                    <Star className="h-3 w-3 text-green-600" />
                    <span className="text-xs font-medium text-green-600">Smart Match</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {extractedData.cvAiSuggestedRoles && extractedData.cvAiSuggestedRoles.length > 0 ? (
                    extractedData.cvAiSuggestedRoles.map((role) => (
                      <Badge 
                        key={role}
                        variant={selectedRoles.includes(role) ? "default" : "outline"}
                        className={`cursor-pointer px-3 py-2 transition-all ${
                          selectedRoles.includes(role) 
                            ? 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600' 
                            : 'bg-green-50 hover:bg-green-100 hover:border-green-300 border-green-200'
                        }`}
                        onClick={() => handleRoleToggle(role)}
                      >
                        {role}
                        {selectedRoles.includes(role) ? (
                          <Check className="h-3 w-3 ml-1" />
                        ) : (
                          <Plus className="h-3 w-3 ml-1" />
                        )}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No AI suggested roles available</p>
                  )}
                </div>
              </div>

              {/* Add Custom Role */}
              <div>
                <h3 className="font-medium text-slate-900 mb-2">Add Custom Role</h3>
                <p className="text-sm text-slate-600 mb-3">Don&apos;t see your target role? Add it manually</p>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter a job role..."
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomRole();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button 
                    onClick={addCustomRole}
                    disabled={!newRole.trim() || selectedRoles.includes(newRole.trim())}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Selected Roles Summary */}
              {selectedRoles.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <h3 className="font-medium text-slate-900 mb-3">
                    Selected Roles ({selectedRoles.length})
                  </h3>
                  <p className="text-sm text-slate-600 mb-3">
                    These roles will be used to find relevant job opportunities
                  </p>
                  <div className="space-y-2">
                    {selectedRoles.map((role) => (
                      <div key={role} className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded px-3 py-2">
                        <span className="text-sm font-medium text-slate-800">{role}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRoleToggle(role)}
                          className="h-6 w-6 p-0 hover:bg-red-100"
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Summary Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>{selectedRoles.length}</strong> {selectedRoles.length === 1 ? 'role' : 'roles'} selected. 
                  This helps us find the most relevant job opportunities for you.
                </p>
              </div>

              {/* Navigation Buttons - Sticky */}
              <div className="sticky bottom-0 bg-white border-t border-slate-200 pt-4 pb-4 mt-6 -mx-6 px-6 shadow-lg z-10">
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={prevStep}
                    className="px-4"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button 
                    onClick={nextStep}
                    disabled={selectedRoles.length === 0}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        const experienceLevels = ['Entry-Level', 'Junior', 'Mid-Level', 'Senior', 'Lead', 'Executive'];
        const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', 'Any'];
        const remotePreferences = ['Remote Only', 'Hybrid', 'On-site Only', 'Any'];
        const sectors = [
          'Information Technology & Software',
          'Engineering & Manufacturing',
          'Finance & Banking',
          'Healthcare & Medical',
          'Education & Training',
          'Sales & Marketing',
          'Human Resources & Recruitment',
          'Customer Service & Support',
          'Media, Advertising & Communications',
          'Design, Arts & Creative',
          'Construction & Real Estate',
          'Logistics, Transport & Supply Chain',
          'Agriculture & Agribusiness',
          'Energy & Utilities (Oil, Gas, Renewable Energy)',
          'Legal & Compliance',
          'Government & Public Administration',
          'Retail & E-commerce',
          'Hospitality & Tourism',
          'Science & Research',
          'Security & Defense',
          'Telecommunications',
          'Nonprofit & NGO',
          'Environment & Sustainability',
          'Product Management & Operations',
          'Data & Analytics'
        ];

        const addLocation = () => {
          if (locationInput.trim() && !preferences.locations.includes(locationInput.trim())) {
            setPreferences({
              ...preferences,
              locations: [...preferences.locations, locationInput.trim()]
            });
            setLocationInput('');
          }
        };

        const removeLocation = (location: string) => {
          setPreferences({
            ...preferences,
            locations: preferences.locations.filter(loc => loc !== location)
          });
        };

        const handleFinish = () => {
          nextStep();
        };

        return (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-2 rounded-full w-12 h-12 mx-auto mb-2">
                <MapPin className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl">Preferences</CardTitle>
              <CardDescription>
                Tell us about your ideal job to personalize your recommendations.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Preferred Locations */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-red-600" />
                  <Label className="text-base font-semibold">Preferred Locations</Label>
                </div>
                <p className="text-sm text-slate-600 mb-3">Add multiple locations where you&apos;d like to work</p>
                <div className="flex gap-2 mb-3">
                  <Input 
                    placeholder="Lagos, Abuja, New York"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addLocation();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button onClick={addLocation} className="bg-blue-600 hover:bg-blue-700">
                    Add
                  </Button>
                </div>
                {preferences.locations.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {preferences.locations.map((location, index) => (
                      <div key={index} className="flex items-center gap-1 bg-green-50 border border-green-500 rounded-full px-3 py-1">
                        <span className="text-sm font-medium text-green-700">{location}</span>
                        <button 
                          onClick={() => removeLocation(location)}
                          className="text-red-600 font-bold hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Work Preference */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-red-600" />
                  <Label className="text-base font-semibold">Work Preference</Label>
                </div>
                <p className="text-sm text-slate-600 mb-3">What type of work arrangement do you prefer?</p>
                <div className="flex flex-wrap gap-2">
                  {remotePreferences.map((preference) => (
                    <button
                      key={preference}
                      onClick={() => setPreferences({
                        ...preferences,
                        remotePreference: preferences.remotePreference === preference ? '' : preference
                      })}
                      className={`px-4 py-2 rounded-md border transition-all ${
                        preferences.remotePreference === preference
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-blue-200 hover:bg-blue-50'
                      }`}
                    >
                      {preference}
                    </button>
                  ))}
                </div>
              </div>

              {/* Salary Range */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Banknote className="h-5 w-5 text-red-600" />
                  <Label className="text-base font-semibold">Salary Range</Label>
                </div>
                <p className="text-sm text-slate-600 mb-3">Annual salary expectations (NGN)</p>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Minimum</Label>
                  <Input 
                    placeholder="e.g., 800000"
                    value={preferences.salaryMin}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      salaryMin: e.target.value.replace(/[^0-9]/g, '')
                    })}
                    type="text"
                    inputMode="numeric"
                  />
                </div>
              </div>

              {/* Experience Level */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-5 w-5 text-red-600" />
                  <Label className="text-base font-semibold">Experience Level</Label>
                </div>
                <p className="text-sm text-slate-600 mb-3">Select the level that best matches your experience</p>
                <div className="flex flex-wrap gap-2">
                  {experienceLevels.map((level) => (
                    <button
                      key={level}
                      onClick={() => setPreferences({
                        ...preferences,
                        experienceLevel: preferences.experienceLevel === level ? '' : level
                      })}
                      className={`px-4 py-2 rounded-md border transition-all ${
                        preferences.experienceLevel === level
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-blue-200 hover:bg-blue-50'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Job Type */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-red-600" />
                  <Label className="text-base font-semibold">Job Type</Label>
                </div>
                <p className="text-sm text-slate-600 mb-3">What type of employment are you looking for?</p>
                <div className="flex flex-wrap gap-2">
                  {jobTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setPreferences({
                        ...preferences,
                        jobType: preferences.jobType === type ? '' : type
                      })}
                      className={`px-4 py-2 rounded-md border transition-all ${
                        preferences.jobType === type
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-700 border-blue-200 hover:bg-blue-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Industry Sector */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-5 w-5 text-red-600" />
                  <Label className="text-base font-semibold">Industry Sector</Label>
                </div>
                <p className="text-sm text-slate-600 mb-3">Select the industry sector you want to work in</p>
                <Select
                  value={preferences.sector}
                  onValueChange={(value) => setPreferences({
                    ...preferences,
                    sector: value
                  })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select an industry sector" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {sectors.map((sectorOption) => (
                      <SelectItem key={sectorOption} value={sectorOption}>
                        {sectorOption}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Summary */}
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-4">Your Preferences</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Locations:</span>
                    <span className="text-slate-900 font-semibold">
                      {preferences.locations.length > 0 ? preferences.locations.join(', ') : 'Not specified'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Remote Preference:</span>
                    <span className="text-slate-900 font-semibold">{preferences.remotePreference || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Salary:</span>
                    <span className="text-slate-900 font-semibold">
                      ₦{preferences.salaryMin || 'Not specified'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Experience:</span>
                    <span className="text-slate-900 font-semibold">{preferences.experienceLevel || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Job Type:</span>
                    <span className="text-slate-900 font-semibold">{preferences.jobType || 'Any'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 font-medium">Sector:</span>
                    <span className="text-slate-900 font-semibold">{preferences.sector || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              {/* Navigation Buttons - Sticky */}
              <div className="sticky bottom-0 bg-white border-t border-slate-200 pt-4 pb-4 mt-6 -mx-6 px-6 shadow-lg z-10">
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={prevStep}
                    className="px-4"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button 
                    onClick={handleFinish}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Start Job Hunting
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="bg-gradient-to-r from-emerald-500 to-green-500 p-2 rounded-full w-12 h-12 mx-auto mb-2">
                <CheckCircle className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl">Account</CardTitle>
              <CardDescription>
                Create your account to complete your onboarding and save your profile
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Message Display */}
              {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${
                  messageType === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-800' 
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  {messageType === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-red-600 border-t-transparent animate-spin" />
                  )}
                  <span className="text-sm font-medium">{message}</span>
                </div>
              )}

              {/* Data Saving Status */}
              {isSavingData && (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                  <span className="text-sm font-medium">
                    Saving your onboarding data to your profile...
                  </span>
                </div>
              )}

              {/* Redirecting Status */}
              {isRedirecting && (
                <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
                  <span className="text-sm font-medium">
                    Redirecting you to the homepage...
                  </span>
                </div>
              )}

              {/* Email Confirmation Instructions */}
              {emailConfirmationSent && (
                <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800">
                  <div className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full border-2 border-yellow-600 border-t-transparent animate-spin mt-0.5" />
                    <div>
                      <h4 className="font-medium mb-1">Email Confirmation Required</h4>
                      <p className="text-sm">
                        We&apos;ve sent a confirmation email to your inbox. Please check your email and click the confirmation link to complete your account setup.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sign Up Form - No Tabs */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="signup-fullname">Full Name</Label>
                  <Input
                    id="signup-fullname"
                    type="text"
                    placeholder="Enter your full name"
                    value={signUpData.fullName}
                    onChange={(e) => setSignUpData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full"
                  />
                </div>
                    <div>
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a password (min. 6 characters)"
                          value={signUpData.password}
                          onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                      <div className="relative">
                        <Input
                          id="signup-confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={signUpData.confirmPassword}
                          onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    
                    {emailConfirmationSent && (
                      <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
                        <p>✅ <strong>Account Created!</strong> Check your email for the confirmation link.</p>
                      </div>
                    )}
                    
                    <Button 
                      onClick={handleSignUp}
                      disabled={isLoading || isSavingData || isRedirecting}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating Account...
                        </>
                      ) : isSavingData ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving Your Data...
                        </>
                      ) : isRedirecting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Redirecting...
                        </>
                      ) : (
                        'Create Account & Complete Onboarding'
                      )}
                    </Button>
              </div>
              
              {/* Navigation buttons for step 4 */}
              <div className="flex justify-between pt-6">
                <Button 
                  variant="outline" 
                  onClick={prevStep}
                  className="px-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <div className="text-sm text-slate-500 flex items-center">
                  Complete onboarding to continue
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <div className="max-w-2xl mx-auto">


        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-600">{Math.round(progressPercentage)}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span className={`${isStep1Completed ? 'text-green-600 font-medium' : ''}`}>
              {isStep1Completed ? '✓' : ''} Upload
            </span>
            <span className={`${isStep2Completed ? 'text-green-600 font-medium' : ''}`}>
              {isStep2Completed ? '✓' : ''} Roles
            </span>
            <span className={`${isStep3Completed ? 'text-green-600 font-medium' : ''}`}>
              {isStep3Completed ? '✓' : ''} Preferences
            </span>
            <span className={`${isStep4Completed ? 'text-green-600 font-medium' : ''}`}>
              {isStep4Completed ? '✓' : ''} Account
            </span>
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-6 text-sm">
          {renderStepContent()}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-800">Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Data Collection Summary on Final Step - HIDDEN */}
        {/* {currentStep === totalSteps && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-blue-800 mb-3">Data Collection Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-blue-700">CV Data:</p>
                <p className="text-blue-600">
                  {isStep1Completed ? `✓ ${extractedData.name} - ${extractedData.email}` : '❌ Not completed'}
                </p>
              </div>
              <div>
                <p className="font-medium text-blue-700">Selected Roles:</p>
                <p className="text-blue-600">
                  {isStep2Completed ? `✓ ${selectedRoles.length} roles selected` : '❌ No roles selected'}
                </p>
              </div>
              <div>
                <p className="font-medium text-blue-700">Preferences:</p>
                <p className="text-blue-600">
                  {isStep3Completed ? `✓ ${preferences.locations.join(', ')}` : '❌ Not set'}
                </p>
              </div>
            </div>
          </div>
        )} */}

        {/* Navigation */}
        <div className="flex justify-between">
          {currentStep === 1 ? (
            // No navigation buttons for first screen - uses continue button inside container
            <div></div>
          ) : (
            // No Previous button here - it's already inside the containers for steps 2, 3, and 4
            <div></div>
          )}
          
          {/* No Next/Complete buttons for screens 2, 3, and 4 - they're now inside the containers */}
            <div></div>
        </div>
      </div>

      {/* Signup Loading Overlay */}
      {(isLoading || isSavingData || isRedirecting) && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-4 shadow-xl">
            <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
            <p className="text-slate-700 font-medium">
              {isLoading ? 'Creating Account...' : isSavingData ? 'Saving Your Data...' : 'Redirecting...'}
            </p>
          </div>
        </div>
      )}

      {/* Loading Overlay Popup */}
      {showLoadingOverlay && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
          style={{
            position: 'fixed',
            top: '0px',
            left: '0px',
            right: '0px',
            bottom: '0px',
            width: '100vw',
            height: '100vh',
            margin: 0,
            padding: 0,
            transform: 'none',
            zIndex: 9999,
            minWidth: '100vw',
            minHeight: '100vh',
            maxWidth: '100vw',
            maxHeight: '100vh'
          }}
        >
          <div className="bg-white rounded-lg p-8 text-center max-w-md mx-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Analyzing Your CV</h3>
            <p className="text-gray-600 mb-4">This may take a minute...</p>
            <div className="text-sm text-gray-500">
              <p>Please wait while our AI processes your information</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CVUploadStep({ onExtracted, isProcessing, setIsProcessing, onProfileExtracted, onNext, setShowLoadingOverlay, initialProfile }: { 
  onExtracted: (t: string) => void; 
  isProcessing: boolean; 
  setIsProcessing: (v: boolean) => void;
  onProfileExtracted: (data: any) => void;
  onNext: () => void;
  setShowLoadingOverlay: (v: boolean) => void;
  initialProfile?: any;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadMethod, setUploadMethod] = useState<'upload' | 'manual'>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState('');
  const [extractedProfile, setExtractedProfile] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [isParsingCV, setIsParsingCV] = useState(false);
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);
  const [manualData, setManualData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    summary: '',
    workExperience: '',
    education: '',
    skills: ''
  });

  // Initialize extractedProfile with initialProfile if available (for persistence when going back)
  React.useEffect(() => {
    if (initialProfile && initialProfile.name && !extractedProfile) {
      setExtractedProfile(initialProfile);
    }
  }, [initialProfile, extractedProfile]);

  const processFile = async (file: File) => {
    
    // Validate file type
    const isPDF = file.type === "application/pdf";
    const isImage = file.type.includes("image");
    const isDocument = file.type.includes("document") || file.name.endsWith('.doc') || file.name.endsWith('.docx');
    
    if (isPDF || isImage || isDocument) {
      setError("");
      // Clear any previous state before processing new file
      setExtractedProfile(null);
      setCvText('');
      setUploadedFile(file); // Set the uploaded file first
      
      // Set processing state immediately to prevent double uploads
      setIsProcessing(true);
      setShowLoadingOverlay(true);
      
      try {
        await extractFromFile(file);
        // Success - processing state will be reset by the calling function
      } catch (error) {
        console.error('File processing failed:', error);
        // Reset states on error
        setUploadedFile(null);
        setCvText('');
        setExtractedProfile(null);
        setIsProcessing(false);
        setShowLoadingOverlay(false);
        throw error; // Re-throw to be handled by caller
      } finally {
        // Always reset processing state when done
        setIsProcessing(false);
        setShowLoadingOverlay(false);
      }
    } else {
      setError("Please upload a PDF, Word document (DOC/DOCX), or image file");
      return;
    }
  };

  const extractFromFile = async (file: File) => {
    if (process.env.NODE_ENV === 'development') console.log('🔄 Starting file extraction for:', file.name);

    try {
      setError("");

      const form = new FormData();
      form.append('file', file);

      const res = await fetch('/api/onboarding/ocr', { method: 'POST', body: form });

      if (process.env.NODE_ENV === 'development') console.log('📡 OCR API response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        if (process.env.NODE_ENV === 'development') console.log('❌ OCR API error response:', errorText);
        
        // Check if it's an extraction failure (all methods failed)
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error === 'EXTRACTION_FAILED') {
            // Show retry error message
            setError('Text extraction failed. All methods (Gemini and OCR) failed. Please try again or upload a different file.');
            setIsProcessing(false);
            setShowLoadingOverlay(false);
            return; // Don't throw, just show error
          }
        } catch (e) {
          // Not JSON, continue with normal error
        }
        
        throw new Error(`OCR failed: ${res.status} ${errorText}`);
      }

      const data = await res.json();
      if (process.env.NODE_ENV === 'development') console.log('📄 OCR API response data:', data);

      if (data?.text) {
        if (process.env.NODE_ENV === 'development') console.log('✅ Text extracted, length:', data.text.length);
        setCvText(data.text as string);
        onExtracted(data.text as string);

        // Parse the CV text immediately after extraction
        await parseCVText(data.text as string);
      } else {
        if (process.env.NODE_ENV === 'development') console.log('❌ No text in OCR response');
        throw new Error('No text extracted from file');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.log('💥 File extraction error:', error);
      console.error('File processing error:', error);
      throw error; // Let the caller handle state resets
    }
  };

  const parseCVText = async (text: string) => {
    if (process.env.NODE_ENV === 'development') console.log('🔄 Starting manual CV parsing, text length:', text.length);

    setIsParsingCV(true);
    try {
      setError("");

      const res = await fetch('/api/onboarding/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (process.env.NODE_ENV === 'development') console.log('📡 Parse API response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        if (process.env.NODE_ENV === 'development') console.log('❌ Parse API error response:', errorText);
        const errorData = await res.json().catch(() => ({ error: `Parsing failed: ${res.status}`, details: errorText }));
        throw new Error(errorData.error || `Parsing failed: ${res.status}`);
      }
      
      const data = await res.json();
      if (process.env.NODE_ENV === 'development') console.log('📄 Parse API response data:', data);

      if (!data?.parsed) {
        if (process.env.NODE_ENV === 'development') console.log('❌ Missing parsed data in response');
        throw new Error('Invalid response: missing parsed data');
      }

      if (process.env.NODE_ENV === 'development') console.log('✅ Parse successful, profile data:', data.parsed);
      
      // Extract roles from work experience (actual CV roles)
      const cvRoles = data.parsed.workExperience?.map((exp: any) => exp.title) || [];
      
      const profile = {
        name: data.parsed.fullName || 'Name not found',
        email: data.parsed.email || 'Email not found',
        phone: data.parsed.phone || 'Phone not found',
        location: data.parsed.location || 'Location not found',
        summary: data.parsed.summary || 'Summary not found',
        roles: cvRoles, // Roles found in the CV (work experience)
        skills: Array.isArray(data.parsed.skills) ? data.parsed.skills : [],
        experience: 'Experience level to be determined',
        workExperience: Array.isArray(data.parsed.workExperience) ? data.parsed.workExperience : [],
        education: Array.isArray(data.parsed.education) ? data.parsed.education : [],
        projects: Array.isArray(data.parsed.projects) ? data.parsed.projects : [],
        accomplishments: Array.isArray(data.parsed.accomplishments) ? data.parsed.accomplishments : [],
        awards: Array.isArray(data.parsed.awards) ? data.parsed.awards : [],
        certifications: Array.isArray(data.parsed.certifications) ? data.parsed.certifications : [],
        languages: Array.isArray(data.parsed.languages) ? data.parsed.languages : [],
        interests: Array.isArray(data.parsed.interests) ? data.parsed.interests : [],
        linkedin: data.parsed.linkedin || '',
        github: data.parsed.github || '',
        portfolio: data.parsed.portfolio || '',
        publications: Array.isArray(data.parsed.publications) ? data.parsed.publications : [],
        volunteerWork: Array.isArray(data.parsed.volunteerWork) ? data.parsed.volunteerWork : [],
        additionalSections: Array.isArray(data.parsed.additionalSections) ? data.parsed.additionalSections : [],
        cvAiSuggestedRoles: Array.isArray(data.parsed.suggestedRoles) ? data.parsed.suggestedRoles : [] // AI-generated additional roles
      };
      
      // Set the extracted profile immediately
      setExtractedProfile(profile);
      onProfileExtracted(profile);
      
      // Store locally until submitted (updated to match mobile app cache keys)
      try {
        localStorage.setItem('onboarding_cv_data', JSON.stringify(profile));
        localStorage.setItem('onboarding_cv_file', JSON.stringify({ text }));
        // Legacy keys for backward compatibility
        localStorage.setItem('extractedProfile', JSON.stringify(profile));
        localStorage.setItem('cvText', text);
      } catch (storageError) {
        console.warn('Failed to save to localStorage:', storageError);
        // Continue without localStorage - not critical for functionality
      }
    } catch (error) {
      console.error('CV parsing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse CV text. Please try again.';
      setError(errorMessage);
      // Don't reset extractedProfile to null - keep previous state if available
      // This prevents React rendering errors
      // Only clear extractedProfile if it was never successfully set
      if (!extractedProfile) {
        setExtractedProfile(null);
      }
      throw error; // Let the caller handle state resets
    } finally {
      setIsParsingCV(false);
    }
  };

  const handleChoose = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) {
        // Reset input if no file selected
        e.target.value = '';
        return;
      }
      
      // Prevent processing if already processing
      if (isProcessing) {
        e.target.value = '';
        return;
      }
      
      // Store the file input element for later reset
      const fileInput = e.target;
      
      try {
        await processFile(file);
        // Only reset the input value after successful processing
        if (fileInput) {
          fileInput.value = '';
        }
      } catch (error) {
        console.error('File processing failed:', error);
        // Reset input value on error too
        if (fileInput) {
          fileInput.value = '';
        }
        // Re-throw to show error to user
        throw error;
      }
    } catch (error) {
      console.error('Error in handleChoose:', error);
      // Ensure input is reset even if there's an unexpected error
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    // Prevent processing if already processing
    if (isProcessing) {
      return;
    }
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleManualInputChange = (field: string, value: string) => {
    setManualData(prev => ({ ...prev, [field]: value }));
  };

  const analyzeManualData = async () => {
    if (process.env.NODE_ENV === 'development') console.log('🔄 Starting manual data analysis');

    if (!manualData.fullName || !manualData.email) {
      if (process.env.NODE_ENV === 'development') console.log('❌ Missing required fields');
      setError("Please fill in at least your name and email");
      return;
    }

    setIsProcessing(true);
    setShowLoadingOverlay(true);
    setError("");

    try {
      // Create a text representation of the manual data
      const manualText = `Name: ${manualData.fullName}
Email: ${manualData.email}
Phone: ${manualData.phone}
Location: ${manualData.location}
Summary: ${manualData.summary}
Work Experience: ${manualData.workExperience}
Education: ${manualData.education}
Skills: ${manualData.skills}`.trim();

      if (process.env.NODE_ENV === 'development') console.log('📝 Generated manual text, length:', manualText.length);

      // Set the text
      setCvText(manualText);

      // Parse the manual data using Gemini
      await parseCVText(manualText);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.log('💥 Manual data parsing error:', error);
      console.error('Manual data parsing error:', error);
      setError("Failed to analyze the profile. Please try again.");
    } finally {
      setIsProcessing(false);
      setShowLoadingOverlay(false);
    }
  };

  const handleNext = () => {
    if (extractedProfile) {
      // Clear localStorage data as user is completing onboarding (updated cache keys)
      try {
        localStorage.removeItem('onboarding_cv_data');
        localStorage.removeItem('onboarding_cv_file');
        // Legacy keys
        localStorage.removeItem('extractedProfile');
        localStorage.removeItem('cvText');
      } catch (storageError) {
        console.warn('Failed to clear localStorage on completion:', storageError);
        // Continue with onboarding - not critical for functionality
      }
      onNext();
    } else {
      setError("Please complete your CV information and analysis");
    }
  };

  // REMOVED: Preloading saved profile on mount - only load when user actually uploads/interacts

  return (
    <div className="space-y-6">
      {/* Only show upload/manual entry if no profile has been extracted yet */}
      {!extractedProfile && (
        <Tabs value={uploadMethod} onValueChange={(value) => setUploadMethod(value as 'upload' | 'manual')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload CV
          </TabsTrigger>
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Manual Entry
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          {uploadedFile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium text-blue-800">{uploadedFile.name}</p>
                  <p className="text-sm text-blue-600">
                    {isProcessing ? 'Processing...' : 'Ready for analysis'}
                  </p>
                </div>
                {!isProcessing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setUploadedFile(null);
                      setExtractedProfile(null);
                      setCvText('');
                      setError('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
          
          <div 
            className={`border-2 border-dashed rounded-lg p-4 md:p-8 text-center transition-colors ${
              isDragging ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-slate-400'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/jpg,image/png"
              onChange={handleChoose}
              className="hidden"
              id="cv-upload"
              disabled={isProcessing}
            />
            <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-700 mb-2">
              Drop your CV here or click to browse
            </p>
            <p className="text-sm text-slate-500 mb-4">
              Supports PDF, DOC, DOCX, JPG, PNG files up to 10MB
            </p>
            <Button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                  if (fileInputRef.current && !isProcessing) {
                    fileInputRef.current.click();
                  }
                } catch (error) {
                  console.error('Error opening file dialog:', error);
                }
              }}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="mr-2 h-4 w-4" />
              Choose File
            </Button>
          </div>

          {uploadedFile && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-sm text-slate-700">
                <strong>File:</strong> {uploadedFile.name}
              </p>
            </div>
          )}



          {/* Paste Text Box under Upload */}
          <div className="border-t pt-4">
            <Label htmlFor="cv-text" className="text-sm font-medium text-slate-700 mb-2 block">
              Or paste your CV text here:
            </Label>
            <Textarea
              id="cv-text"
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              placeholder="Paste your CV content here for analysis..."
              rows={6}
              className="w-full"
            />
            {cvText.trim() && !extractedProfile && !isProcessing && (
              <Button 
                onClick={() => parseCVText(cvText)}
                disabled={isParsingCV}
                className="mt-2 bg-blue-600 hover:bg-blue-700"
              >
                {isParsingCV ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Analyze Text with AI
                  </>
                )}
              </Button>
            )}
            

          </div>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="manual-name">Full Name *</Label>
              <Input 
                id="manual-name" 
                placeholder="Enter your full name" 
                value={manualData.fullName}
                onChange={(e) => handleManualInputChange("fullName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-email">Email *</Label>
              <Input 
                id="manual-email" 
                type="email" 
                placeholder="Enter your email" 
                value={manualData.email}
                onChange={(e) => handleManualInputChange("email", e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="manual-phone">Phone</Label>
              <Input 
                id="manual-phone" 
                placeholder="Enter your phone number" 
                value={manualData.phone}
                onChange={(e) => handleManualInputChange("phone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-location">Location</Label>
              <Input 
                id="manual-location" 
                placeholder="Enter your location" 
                value={manualData.location}
                onChange={(e) => handleManualInputChange("location", e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="manual-summary">Professional Summary</Label>
            <Textarea
              id="manual-summary"
              value={manualData.summary}
              onChange={(e) => handleManualInputChange("summary", e.target.value)}
              placeholder="Brief description of your professional background and goals..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="workExperience">Work Experience</Label>
            <Textarea
              id="workExperience"
              value={manualData.workExperience}
              onChange={(e) => handleManualInputChange("workExperience", e.target.value)}
              placeholder="List your work experience, including job titles, companies, and dates..."
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="education">Education</Label>
            <Textarea
              id="education"
              value={manualData.education}
              onChange={(e) => handleManualInputChange("education", e.target.value)}
              placeholder="List your educational background, degrees, and institutions..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="skills">Skills (comma-separated)</Label>
            <Textarea
              id="skills"
              value={manualData.skills}
              onChange={(e) => handleManualInputChange("skills", e.target.value)}
              placeholder="JavaScript, React, Node.js, Python..."
              rows={4}
            />
          </div>

          <div className="flex justify-center">
            <Button 
              onClick={analyzeManualData}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-800">Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {extractedProfile && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-6">
          <div className="flex items-center gap-2 text-green-800 font-medium text-lg">
            <CheckCircle className="h-5 w-5" />
            Profile Analysis Complete
          </div>
          
          {/* Profile Section */}
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="font-medium text-slate-600">Full Name:</p>
                <p className="text-slate-800">{extractedProfile.name}</p>
              </div>
              <div>
                <p className="font-medium text-slate-600">Email:</p>
                <p className="text-slate-800">{extractedProfile.email}</p>
              </div>
              <div>
                <p className="font-medium text-slate-600">Phone:</p>
                <p className="text-slate-800">{extractedProfile.phone || '—'}</p>
              </div>
              <div>
                <p className="font-medium text-slate-600">Location:</p>
                <p className="text-slate-800">{extractedProfile.location || '—'}</p>
              </div>
            </div>
          </div>

          {/* Summary */}
          {extractedProfile.summary && (
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-3">Summary</h3>
              <p className="text-slate-700 text-sm leading-relaxed">{extractedProfile.summary}</p>
            </div>
          )}

          {/* Roles */}
          {extractedProfile.roles?.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-3">Roles</h3>
              <div className="flex flex-wrap gap-2">
                {extractedProfile.roles.map((role: string, idx: number) => (
                  <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {extractedProfile.skills?.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {extractedProfile.skills.map((skill: string, idx: number) => (
                  <span key={idx} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Work Experience */}
          {extractedProfile.workExperience?.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Work Experience
              </h3>
              <div className="space-y-4">
                {extractedProfile.workExperience.map((exp: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-blue-500 pl-4 pb-4 last:pb-0">
                    <p className="font-semibold text-slate-800">{exp.title || '—'}</p>
                    <p className="text-blue-600 font-medium text-sm">{exp.company || '—'}</p>
                    {exp.duration && <p className="text-slate-500 text-xs mt-1">{exp.duration}</p>}
                    {exp.description && <p className="text-slate-700 text-sm mt-2 leading-relaxed">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {extractedProfile.education?.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Education
              </h3>
              <div className="space-y-3">
                {extractedProfile.education.map((ed: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-green-500 pl-4">
                    <p className="font-semibold text-slate-800">{ed.degree || '—'}</p>
                    <p className="text-green-600 font-medium text-sm">{ed.institution || '—'}</p>
                    {ed.year && <p className="text-slate-500 text-xs mt-1">{ed.year}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {extractedProfile.projects?.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Projects
              </h3>
              <div className="space-y-3">
                {extractedProfile.projects.map((p: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-purple-500 pl-4">
                    <p className="font-semibold text-slate-800">{p.name || '—'}</p>
                    {p.description && <p className="text-slate-700 text-sm mt-1 leading-relaxed">{p.description}</p>}
                    {p.technologies && p.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.technologies.map((tech: string, techIdx: number) => (
                          <span key={techIdx} className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                    {p.url && (
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm mt-1 hover:underline block">
                        View Project →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accomplishments */}
          {extractedProfile.accomplishments?.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Star className="h-5 w-5" />
                Accomplishments
              </h3>
              <ul className="list-disc list-inside space-y-1 text-slate-700 text-sm">
                {extractedProfile.accomplishments.map((acc: string, idx: number) => (
                  <li key={idx}>{acc}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Awards */}
          {extractedProfile.awards?.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Awards
              </h3>
              <div className="space-y-3">
                {extractedProfile.awards.map((award: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-yellow-500 pl-4">
                    <p className="font-semibold text-slate-800">{award.title || '—'}</p>
                    <p className="text-yellow-600 font-medium text-sm">{award.issuer || '—'}</p>
                    {award.year && <p className="text-slate-500 text-xs mt-1">Year: {award.year}</p>}
                    {award.description && <p className="text-slate-700 text-sm mt-2 leading-relaxed">{award.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {extractedProfile.certifications?.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Award className="h-5 w-5" />
                Certifications
              </h3>
              <div className="space-y-3">
                {extractedProfile.certifications.map((cert: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-orange-500 pl-4">
                    <p className="font-semibold text-slate-800">{cert.name || cert.title || '—'}</p>
                    <p className="text-orange-600 font-medium text-sm">{cert.issuer || '—'}</p>
                    <p className="text-slate-500 text-xs mt-1">
                      {cert.year && `Year: ${cert.year}`}
                      {cert.year && cert.expiryDate && ' • '}
                      {cert.expiryDate && `Expires: ${cert.expiryDate}`}
                    </p>
                    {cert.description && <p className="text-slate-700 text-sm mt-2 leading-relaxed">{cert.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {extractedProfile.languages?.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-3">Languages</h3>
              <div className="flex flex-wrap gap-2">
                {extractedProfile.languages.map((lang: string, idx: number) => (
                  <span key={idx} className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm font-medium">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {extractedProfile.interests?.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-3">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {extractedProfile.interests.map((interest: string, idx: number) => (
                  <span key={idx} className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm font-medium">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          {(extractedProfile.linkedin || extractedProfile.github || extractedProfile.portfolio) && (
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-3">Links</h3>
              <div className="space-y-2 text-sm">
                {extractedProfile.linkedin && (
                  <div>
                    <span className="font-medium text-slate-600">LinkedIn: </span>
                    <a href={extractedProfile.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {extractedProfile.linkedin}
                    </a>
                  </div>
                )}
                {extractedProfile.github && (
                  <div>
                    <span className="font-medium text-slate-600">GitHub: </span>
                    <a href={extractedProfile.github} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {extractedProfile.github}
                    </a>
                  </div>
                )}
                {extractedProfile.portfolio && (
                  <div>
                    <span className="font-medium text-slate-600">Portfolio: </span>
                    <a href={extractedProfile.portfolio} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {extractedProfile.portfolio}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Publications */}
          {extractedProfile.publications?.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Publications
              </h3>
              <div className="space-y-3">
                {extractedProfile.publications.map((pub: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-indigo-500 pl-4">
                    <p className="font-semibold text-slate-800">{pub.title || '—'}</p>
                    <p className="text-indigo-600 font-medium text-sm">{pub.journal || '—'}</p>
                    {pub.year && <p className="text-slate-500 text-xs mt-1">Year: {pub.year}</p>}
                    {pub.url && (
                      <a href={pub.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm mt-1 hover:underline block">
                        View Publication →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Volunteer Work */}
          {extractedProfile.volunteerWork?.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-3">Volunteer Work</h3>
              <div className="space-y-3">
                {extractedProfile.volunteerWork.map((v: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-green-500 pl-4">
                    <p className="font-semibold text-slate-800">{v.organization || '—'}</p>
                    <p className="text-green-600 font-medium text-sm">{v.role || '—'}</p>
                    {v.duration && <p className="text-slate-500 text-xs mt-1">{v.duration}</p>}
                    {v.description && <p className="text-slate-700 text-sm mt-2 leading-relaxed">{v.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Sections */}
          {extractedProfile.additionalSections?.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-3">Additional Sections</h3>
              <div className="space-y-3">
                {extractedProfile.additionalSections.map((s: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-slate-400 pl-4">
                    <p className="font-semibold text-slate-800">{s.sectionName || '—'}</p>
                    {s.content && <p className="text-slate-700 text-sm mt-2 leading-relaxed">{s.content}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}