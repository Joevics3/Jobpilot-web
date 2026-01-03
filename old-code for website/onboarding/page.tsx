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
  const [preferences, setPreferences] = useState({
    locations: [] as string[],
    salaryMin: '80000',
    salaryMax: '120000',
    experienceLevel: '3-5 years',
    jobType: 'Full-time',
    remotePreference: 'Remote OK',
    sector: '' // Added to match mobile app and Supabase table
  });

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
    try {
      
      const res = await fetch('/api/onboarding/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (!res.ok) {
        throw new Error(`Parsing failed: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data?.parsed) {
        // Extract roles from work experience (actual CV roles)
        const cvRoles = data.parsed.workExperience?.map((exp: any) => exp.title) || [];
        
        const profile = {
          name: data.parsed.fullName || 'Name not found',
          email: data.parsed.email || 'Email not found',
          phone: data.parsed.phone || 'Phone not found',
          location: data.parsed.location || 'Location not found',
          summary: data.parsed.summary || 'Summary not found',
          roles: cvRoles, // Roles found in the CV (work experience)
          skills: data.parsed.skills || [],
          experience: 'Experience level to be determined',
          workExperience: data.parsed.workExperience || [],
          education: data.parsed.education || [],
          projects: data.parsed.projects || [],
          accomplishments: data.parsed.accomplishments || [],
          awards: data.parsed.awards || [],
          certifications: data.parsed.certifications || [],
          languages: data.parsed.languages || [],
          interests: data.parsed.interests || [],
          linkedin: data.parsed.linkedin || '',
          github: data.parsed.github || '',
          portfolio: data.parsed.portfolio || '',
          publications: data.parsed.publications || [],
          volunteerWork: data.parsed.volunteerWork || [],
          additionalSections: data.parsed.additionalSections || [],
          cvAiSuggestedRoles: data.parsed.suggestedRoles || [] // AI-generated additional roles
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

  // Load saved preferences on component mount
  React.useEffect(() => {
    try {
      // Try new key first, fallback to legacy key
      const savedPreferences = localStorage.getItem('onboarding_job_preferences') 
        || localStorage.getItem('onboardingPreferences');
      if (savedPreferences) {
        const parsedPreferences = JSON.parse(savedPreferences);
        setPreferences(parsedPreferences);
      }
    } catch (storageError) {
      console.warn('Failed to load preferences from localStorage:', storageError);
    }
  }, []); // Empty dependency array - only run once on mount

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    // Clear message after 5 seconds for success, 8 seconds for errors
    setTimeout(() => setMessage(''), type === 'success' ? 5000 : 8000);
  };

  const validateSignUpForm = () => {
    if (!signUpData.fullName.trim()) {
      showMessage('Full name is required', 'error');
      return false;
    }
    
    if (!signUpData.email.trim()) {
      showMessage('Email is required', 'error');
      return false;
    }
    
    if (!signUpData.email.includes('@')) {
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
        // User is now authenticated, save onboarding data
        try {
          setIsRedirecting(true);
          await saveOnboardingDataToSupabase(data.user);
          
          showMessage('Signed in successfully! Redirecting to dashboard...', 'success');
          
          // Redirect to dashboard using Next.js router
          setTimeout(() => {
            console.log('Attempting to redirect to dashboard...');
            try {
              router.push('/dashboard');
            } catch (redirectError) {
              console.error('Router redirect failed:', redirectError);
              // Fallback to window.location
              window.location.href = '/dashboard';
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
      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: signUpData.email.trim(),
        password: signUpData.password,
        options: {
          data: {
            full_name: signUpData.fullName.trim(),
          }
        }
      });

      if (error) {
        showMessage(error.message, 'error');
        return;
      }

      if (data.user && !data.session) {
        // Email confirmation required - don't try to save data yet
        setEmailConfirmationSent(true);
        showMessage('Account created! Please check your email to confirm your account before signing in.', 'success');
        
        // Clear the form
        setSignUpData({
          fullName: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        
        // Switch to sign in tab
        const tabsElement = document.querySelector('[data-value="signin"]') as HTMLElement;
        if (tabsElement) {
          tabsElement.click();
        }
        
        // Show instructions
        setMessage('Please check your email and click the confirmation link, then return here to sign in.', 'success');
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
      // Save profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: extractedData.name || signUpData.fullName,
          phone: extractedData.phone,
          location: extractedData.location,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error('Error saving profile:', profileError);
        throw new Error('Failed to save profile');
      }

      // Save onboarding data
      const { error: onboardingError } = await supabase
        .from('onboarding_data')
        .insert({
          user_id: user.id,
          cv_name: extractedData.name,
          cv_email: extractedData.email,
          cv_phone: extractedData.phone,
          cv_location: extractedData.location,
          cv_summary: extractedData.summary,
          cv_roles: extractedData.roles,
          cv_skills: extractedData.skills,
          cv_experience: extractedData.experience,
          cv_work_experience: extractedData.workExperience,
          cv_education: extractedData.education,
          cv_projects: extractedData.projects,
          cv_accomplishments: extractedData.accomplishments,
          cv_awards: extractedData.awards,
          cv_certifications: extractedData.certifications,
          cv_languages: extractedData.languages,
          cv_interests: extractedData.interests,
          cv_linkedin: extractedData.linkedin,
          cv_github: extractedData.github,
          cv_portfolio: extractedData.portfolio,
          cv_publications: extractedData.publications,
          cv_volunteer_work: extractedData.volunteerWork,
          cv_additional_sections: extractedData.additionalSections,
          target_roles: selectedRoles, // Selected roles (target_roles in table)
          cv_ai_suggested_roles: extractedData.cvAiSuggestedRoles, // AI suggested roles
          preferred_locations: preferences.locations,
          salary_min: parseInt(preferences.salaryMin),
          salary_max: parseInt(preferences.salaryMax),
          experience_level: preferences.experienceLevel,
          job_type: preferences.jobType,
          remote_preference: preferences.remotePreference,
          sector: preferences.sector || null, // Added to match mobile app and Supabase table
          cv_text: cvText,
          cv_file_name: selectedFile?.name || null,
          cv_file_type: selectedFile?.type || null,
          cv_file_size: selectedFile?.size || null,
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (onboardingError) {
        console.error('Error saving onboarding data:', onboardingError);
        throw new Error('Failed to save onboarding data');
      }

      // Save job preferences
      const { error: preferencesError } = await supabase
        .from('job_preferences')
        .insert({
          user_id: user.id,
          target_roles: selectedRoles,
          preferred_locations: preferences.locations,
          salary_min: parseInt(preferences.salaryMin),
          salary_max: parseInt(preferences.salaryMax),
          experience_level: preferences.experienceLevel,
          job_type: preferences.jobType,
          remote_preference: preferences.remotePreference,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (preferencesError) {
        console.error('Error saving job preferences:', preferencesError);
        throw new Error('Failed to save job preferences');
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
      // For now, we'll just redirect to dashboard
      window.location.href = '/dashboard';
      
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
              <CardTitle className="text-xl">Upload & Analyze Your CV</CardTitle>
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
              
              {/* Show Restart button only after CV has been parsed */}
              {extractedData.name && (
                <div className="flex justify-between pt-6">
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
              )}
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-full w-12 h-12 mx-auto mb-2">
                <Briefcase className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl">Select Your Target Roles</CardTitle>
              <CardDescription>
                Choose the job roles you're interested in. We've pre-selected roles based on your CV analysis.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-slate-900 mb-3">Based on your CV analysis</h3>
                <div className="flex flex-wrap gap-2">
                  {extractedData.roles && extractedData.roles.length > 0 ? (
                    extractedData.roles.map((role) => (
                      <Badge 
                        key={role}
                        variant={selectedRoles.includes(role) ? "default" : "outline"}
                        className={`cursor-pointer px-3 py-2 ${
                          selectedRoles.includes(role) 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'hover:bg-blue-50 hover:border-blue-300'
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
              
              <div>
                <h3 className="font-medium text-slate-900 mb-3">AI Suggested Roles</h3>
                <div className="flex flex-wrap gap-2">
                  {extractedData.cvAiSuggestedRoles && extractedData.cvAiSuggestedRoles.length > 0 ? (
                    extractedData.cvAiSuggestedRoles.map((role) => (
                      <Badge 
                        key={role}
                        variant={selectedRoles.includes(role) ? "default" : "outline"}
                        className={`cursor-pointer px-3 py-2 ${
                          selectedRoles.includes(role) 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'hover:bg-blue-50 hover:border-blue-300'
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
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>{selectedRoles.length}</strong> roles selected. 
                  This helps us find the most relevant job opportunities for you.
                </p>
              </div>

              {/* Next Button inside container */}
              <div className="flex justify-between pt-6">
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
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-2 rounded-full w-12 h-12 mx-auto mb-2">
                <MapPin className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl">Set Your Preferences</CardTitle>
              <CardDescription>
                Tell us about your ideal job to personalize your recommendations.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Preferred Locations</Label>
                <Input 
                  placeholder="e.g. Lagos, Abuja, Port Harcourt, Remote"
                  value={preferences.locations.join(', ')}
                  onChange={(e) => setPreferences({
                    ...preferences,
                    locations: e.target.value.split(', ').filter(l => l.trim())
                  })}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Minimum Salary (USD)</Label>
                  <Input 
                    type="number"
                    placeholder="80000"
                    value={preferences.salaryMin}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      salaryMin: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maximum Salary (USD)</Label>
                  <Input 
                    type="number"
                    placeholder="120000"
                    value={preferences.salaryMax}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      salaryMax: e.target.value
                    })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Experience Level</Label>
                  <Select value={preferences.experienceLevel} onValueChange={(value) => 
                    setPreferences({...preferences, experienceLevel: value})
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0-1 years">Entry Level (0-1 years)</SelectItem>
                      <SelectItem value="1-3 years">Junior (1-3 years)</SelectItem>
                      <SelectItem value="3-5 years">Mid-level (3-5 years)</SelectItem>
                      <SelectItem value="5-8 years">Senior (5-8 years)</SelectItem>
                      <SelectItem value="8+ years">Executive (8+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Job Type</Label>
                  <Select value={preferences.jobType} onValueChange={(value) => 
                    setPreferences({...preferences, jobType: value})
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Freelance">Freelance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Remote Work Preference</Label>
                <Select value={preferences.remotePreference} onValueChange={(value) => 
                  setPreferences({...preferences, remotePreference: value})
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Remote only">Remote only</SelectItem>
                    <SelectItem value="Remote OK">Remote OK</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                    <SelectItem value="On-site only">On-site only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Industry Sector</Label>
                <Select value={preferences.sector} onValueChange={(value) => 
                  setPreferences({...preferences, sector: value})
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Information Technology & Software">Information Technology & Software</SelectItem>
                    <SelectItem value="Engineering & Manufacturing">Engineering & Manufacturing</SelectItem>
                    <SelectItem value="Finance & Banking">Finance & Banking</SelectItem>
                    <SelectItem value="Healthcare & Medical">Healthcare & Medical</SelectItem>
                    <SelectItem value="Education & Training">Education & Training</SelectItem>
                    <SelectItem value="Sales & Marketing">Sales & Marketing</SelectItem>
                    <SelectItem value="Human Resources & Recruitment">Human Resources & Recruitment</SelectItem>
                    <SelectItem value="Customer Service & Support">Customer Service & Support</SelectItem>
                    <SelectItem value="Media, Advertising & Communications">Media, Advertising & Communications</SelectItem>
                    <SelectItem value="Design, Arts & Creative">Design, Arts & Creative</SelectItem>
                    <SelectItem value="Construction & Real Estate">Construction & Real Estate</SelectItem>
                    <SelectItem value="Logistics, Transport & Supply Chain">Logistics, Transport & Supply Chain</SelectItem>
                    <SelectItem value="Agriculture & Agribusiness">Agriculture & Agribusiness</SelectItem>
                    <SelectItem value="Energy & Utilities (Oil, Gas, Renewable Energy)">Energy & Utilities (Oil, Gas, Renewable Energy)</SelectItem>
                    <SelectItem value="Legal & Compliance">Legal & Compliance</SelectItem>
                    <SelectItem value="Government & Public Administration">Government & Public Administration</SelectItem>
                    <SelectItem value="Retail & E-commerce">Retail & E-commerce</SelectItem>
                    <SelectItem value="Hospitality & Tourism">Hospitality & Tourism</SelectItem>
                    <SelectItem value="Science & Research">Science & Research</SelectItem>
                    <SelectItem value="Security & Defense">Security & Defense</SelectItem>
                    <SelectItem value="Telecommunications">Telecommunications</SelectItem>
                    <SelectItem value="Nonprofit & NGO">Nonprofit & NGO</SelectItem>
                    <SelectItem value="Environment & Sustainability">Environment & Sustainability</SelectItem>
                    <SelectItem value="Product Management & Operations">Product Management & Operations</SelectItem>
                    <SelectItem value="Data & Analytics">Data & Analytics</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Complete Button inside container */}
              <div className="flex justify-between pt-6">
                <Button 
                  variant="outline" 
                  onClick={prevStep}
                  className="px-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <Button 
                  onClick={() => {
                    // Navigate to step 4 (auth) instead of saving to localStorage
                    setCurrentStep(4);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Complete
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
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
              <CardTitle className="text-xl">Create Your Account</CardTitle>
              <CardDescription>
                Sign up or sign in to complete your onboarding and save your profile
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
                    Redirecting you to your dashboard...
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
                        We've sent a confirmation email to your inbox. Please check your email and click the confirmation link, 
                        then return here to sign in and complete your onboarding.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Tabs defaultValue="signup" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signup" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    Sign Up
                  </TabsTrigger>
                  <TabsTrigger value="signin" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    Sign In
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="signup" className="space-y-4">
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
                          Redirecting to Dashboard...
                        </>
                      ) : (
                        'Create Account & Complete Onboarding'
                      )}
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="signin" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        value={signInData.email}
                        onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="signin-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="signin-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={signInData.password}
                          onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
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
                    
                    {emailConfirmationSent && (
                      <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm">
                        <p>💡 <strong>Tip:</strong> After confirming your email, you can sign in here to complete your onboarding.</p>
                      </div>
                    )}
                    
                    <Button 
                      onClick={handleSignIn}
                      disabled={isLoading || isSavingData || isRedirecting}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Signing In...
                        </>
                      ) : isSavingData ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Loading Your Data...
                        </>
                      ) : isRedirecting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Redirecting to Dashboard...
                        </>
                      ) : (
                        'Sign In & Complete Onboarding'
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
              
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
            <span className="text-sm text-slate-600">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-slate-600">{Math.round(progressPercentage)}% Complete</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span className={`${isStep1Completed ? 'text-green-600 font-medium' : ''}`}>
              {isStep1Completed ? '✓' : '1'} Upload & Analyze CV
            </span>
            <span className={`${isStep2Completed ? 'text-green-600 font-medium' : ''}`}>
              {isStep2Completed ? '✓' : '2'} Select Target Roles
            </span>
            <span className={`${isStep3Completed ? 'text-green-600 font-medium' : ''}`}>
              {isStep3Completed ? '✓' : '3'} Set Preferences
            </span>
            <span className={`${isStep4Completed ? 'text-green-600 font-medium' : ''}`}>
              {isStep4Completed ? '✓' : '4'} Create Account
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
  const [uploadMethod, setUploadMethod] = useState<'upload' | 'manual'>('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState('');
  const [extractedProfile, setExtractedProfile] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
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
    try {
      setError("");
      
      const form = new FormData();
      form.append('file', file);
      
      const res = await fetch('/api/onboarding/ocr', { method: 'POST', body: form });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('OCR API error:', res.status, errorText);
        throw new Error(`OCR failed: ${res.status} ${errorText}`);
      }
      
      const data = await res.json();
      
      if (data?.text) {
        setCvText(data.text as string);
        onExtracted(data.text as string);
        
        // Parse the CV text immediately after extraction
        await parseCVText(data.text as string);
      } else {
        console.error('No text in OCR response:', data);
        throw new Error('No text extracted from file');
      }
    } catch (error) {
      console.error('File processing error:', error);
      throw error; // Let the caller handle state resets
    }
  };

  const parseCVText = async (text: string) => {
    try {
      setError("");
      
      const res = await fetch('/api/onboarding/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (!res.ok) {
        throw new Error(`Parsing failed: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data?.parsed) {
        // Extract roles from work experience (actual CV roles)
        const cvRoles = data.parsed.workExperience?.map((exp: any) => exp.title) || [];
        
        const profile = {
          name: data.parsed.fullName || 'Name not found',
          email: data.parsed.email || 'Email not found',
          phone: data.parsed.phone || 'Phone not found',
          location: data.parsed.location || 'Location not found',
          summary: data.parsed.summary || 'Summary not found',
          roles: cvRoles, // Roles found in the CV (work experience)
          skills: data.parsed.skills || [],
          experience: 'Experience level to be determined',
          workExperience: data.parsed.workExperience || [],
          education: data.parsed.education || [],
          projects: data.parsed.projects || [],
          accomplishments: data.parsed.accomplishments || [],
          awards: data.parsed.awards || [],
          certifications: data.parsed.certifications || [],
          languages: data.parsed.languages || [],
          interests: data.parsed.interests || [],
          linkedin: data.parsed.linkedin || '',
          github: data.parsed.github || '',
          portfolio: data.parsed.portfolio || '',
          publications: data.parsed.publications || [],
          volunteerWork: data.parsed.volunteerWork || [],
          additionalSections: data.parsed.additionalSections || [],
          cvAiSuggestedRoles: data.parsed.suggestedRoles || [] // AI-generated additional roles
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
      }
    } catch (error) {
      console.error('CV parsing error:', error);
      setError("Failed to parse CV text. Please try again.");
      // Reset states on error
      setExtractedProfile(null);
      throw error; // Let the caller handle state resets
    }
  };

  const handleChoose = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Prevent processing if already processing
    if (isProcessing) {
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
    if (!manualData.fullName || !manualData.email) {
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

             // Set the text
       setCvText(manualText);
      
      // Parse the manual data using Gemini
      await parseCVText(manualText);
    } catch (error) {
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

  // Load saved profile on component mount (updated to match mobile app cache keys)
  React.useEffect(() => {
    try {
      // Try new keys first, fallback to legacy keys
      const savedProfile = localStorage.getItem('onboarding_cv_data') 
        || localStorage.getItem('extractedProfile');
      const savedFileData = localStorage.getItem('onboarding_cv_file');
      const savedText = savedFileData 
        ? JSON.parse(savedFileData).text 
        : localStorage.getItem('cvText');
      
      if (savedProfile && savedText) {
        try {
          const profile = JSON.parse(savedProfile);
          setExtractedProfile(profile);
          setCvText(savedText);
          onProfileExtracted(profile);
          onExtracted(savedText);
        } catch (parseError) {
          console.error('Error parsing saved profile:', parseError);
          // Clear corrupted data
          try {
            localStorage.removeItem('onboarding_cv_data');
            localStorage.removeItem('onboarding_cv_file');
            localStorage.removeItem('extractedProfile');
            localStorage.removeItem('cvText');
          } catch (storageError) {
            console.warn('Failed to clear corrupted localStorage data:', storageError);
          }
        }
      }
    } catch (storageError) {
      console.warn('localStorage not available:', storageError);
      // Continue without localStorage - not critical for functionality
    }

    // Cleanup function to remove localStorage data when component unmounts
    return () => {
      // Only remove if user has completed the onboarding
      if (extractedProfile) {
        try {
          localStorage.removeItem('onboarding_cv_data');
          localStorage.removeItem('onboarding_cv_file');
          // Legacy keys
          localStorage.removeItem('extractedProfile');
          localStorage.removeItem('cvText');
        } catch (storageError) {
          console.warn('Failed to clear localStorage on cleanup:', storageError);
        }
      }
    };
  }, [extractedProfile, onProfileExtracted, onExtracted]);

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
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? 'border-blue-400 bg-blue-50' : 'border-slate-300 hover:border-slate-400'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleChoose}
              className="hidden"
              id="cv-upload"
            />
            <Upload className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-700 mb-2">
              Drop your CV here or click to browse
            </p>
            <p className="text-sm text-slate-500 mb-4">
              Supports PDF, DOC, DOCX, JPG, PNG files up to 10MB
            </p>
            <Button 
              onClick={() => document.getElementById('cv-upload')?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
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
                className="mt-2 bg-blue-600 hover:bg-blue-700"
              >
                <Brain className="mr-2 h-4 w-4" />
                Analyze Text with AI
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
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2 text-green-800 font-medium">
            <CheckCircle className="h-5 w-5" />
            Profile Analysis Complete
          </div>
          
                    {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-slate-700">Name:</p>
              <p className="text-slate-600">{extractedProfile.name}</p>
            </div>
            <div>
              <p className="font-medium text-slate-700">Email:</p>
              <p className="text-slate-600">{extractedProfile.email}</p>
            </div>
            <div>
              <p className="font-medium text-slate-700">Phone:</p>
              <p className="text-slate-600">{extractedProfile.phone || 'Not specified'}</p>
            </div>
            <div>
              <p className="font-medium text-slate-700">Location:</p>
              <p className="text-slate-600">{extractedProfile.location}</p>
            </div>
          </div>

          {/* Education */}
          {extractedProfile.education?.length > 0 && (
            <div>
              <p className="font-medium text-slate-700 mb-2">Education:</p>
              <div className="space-y-2">
                {extractedProfile.education.slice(0, 2).map((edu: any, index: number) => (
                  <div key={index} className="bg-white p-3 rounded border text-sm">
                    <p className="font-medium text-slate-700">{edu.degree} in {edu.field}</p>
                    <p className="text-slate-600 text-xs">{edu.institution}, {edu.year}</p>
                  </div>
                ))}
              </div>
            </div>
          )}


        </div>
      )}

      <div className="flex justify-end pt-6">
        <Button 
          onClick={handleNext}
          disabled={!extractedProfile}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}