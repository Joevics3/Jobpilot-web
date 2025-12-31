"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, User, Code, Briefcase, MapPin, DollarSign, Save, X, Plus } from 'lucide-react';
import { theme } from '@/lib/theme';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const EXPERIENCE_LEVELS = ['Entry-level', 'Junior', 'Mid-Level', 'Senior', 'Lead', 'Executive'];
const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', 'any'];
const REMOTE_PREFERENCES = ['Remote', 'Hybrid', 'On-site-only', 'Any'];
const SECTORS = [
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
  'E-commerce',
  'Energy & Utilities (Oil, Gas, Renewable Energy)',
  'Legal & Compliance',
  'Government & Public Administration',
  'Retail',
  'Hospitality & Tourism',
  'Science & Research',
  'Security & Defense',
  'Telecommunications',
  'Nonprofit & NGO',
  'Environment & Sustainability',
  'Product Management & Operations',
  'Data & Analytics'
];

interface ProfileFormData {
  // Personal Information
  cv_name: string;
  cv_email: string;
  cv_phone: string;
  cv_location: string;
  cv_summary: string;

  // Professional Information
  target_roles: string[];
  cv_skills: string[];
  work_experience: string[];
  education: string[];
  projects: string[];
  accomplishments: string[];
  awards: string[];
  certifications: string[];
  languages: string[];
  interests: string[];

  // Links
  cv_linkedin: string;
  cv_github: string;
  cv_portfolio: string;
  publications: string[];
  volunteer_work: string[];
  additional_sections: string[];

  // Job Preferences
  preferred_locations: string[];
  salary_min: string;
  salary_max: string;
  experience_level: string;
  job_type: string;
  remote_preference: string;
  sector: string;
}

export default function EditProfilePage() {
  // Profile edit page component
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    cv_name: '',
    cv_email: '',
    cv_phone: '',
    cv_location: '',
    cv_summary: '',
    target_roles: [],
    cv_skills: [],
    work_experience: [],
    education: [],
    projects: [],
    accomplishments: [],
    awards: [],
    certifications: [],
    languages: [],
    interests: [],
    cv_linkedin: '',
    cv_github: '',
    cv_portfolio: '',
    publications: [],
    volunteer_work: [],
    additional_sections: [],
    preferred_locations: [],
    salary_min: '',
    salary_max: '',
    experience_level: '',
    job_type: '',
    remote_preference: '',
    sector: '',
  });

  // Tag input states
  const [targetRoleInput, setTargetRoleInput] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [accomplishmentInput, setAccomplishmentInput] = useState('');
  const [languageInput, setLanguageInput] = useState('');
  const [interestInput, setInterestInput] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/');
      return;
    }
    setUser(session.user);
  };

  const loadProfileData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch from onboarding_data table
      const { data, error } = await supabase
        .from('onboarding_data')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        // Parse work experience and education
        let workExpEntries: string[] = [];
        if (data.cv_work_experience) {
          if (Array.isArray(data.cv_work_experience)) {
            workExpEntries = data.cv_work_experience.map((exp: any) =>
              typeof exp === 'object'
                ? `${exp.title || ''} at ${exp.company || ''} (${exp.duration || ''}) - ${exp.description || ''}`
                : String(exp)
            );
          } else if (typeof data.cv_work_experience === 'string') {
            try {
              const parsed = JSON.parse(data.cv_work_experience);
              if (Array.isArray(parsed)) {
                workExpEntries = parsed.map((exp: any) =>
                  typeof exp === 'object'
                    ? `${exp.title || ''} at ${exp.company || ''} (${exp.duration || ''}) - ${exp.description || ''}`
                    : String(exp)
                );
              } else {
                workExpEntries = [data.cv_work_experience];
              }
            } catch (e) {
              workExpEntries = data.cv_work_experience.split('\n\n').filter(Boolean);
            }
          }
        }

        let educationEntries: string[] = [];
        if (data.cv_education) {
          if (Array.isArray(data.cv_education)) {
            educationEntries = data.cv_education.map((edu: any) =>
              typeof edu === 'object' ? `${edu.degree || ''} - ${edu.institution || ''} (${edu.year || ''})` : String(edu)
            );
          } else if (typeof data.cv_education === 'string') {
            try {
              const parsed = JSON.parse(data.cv_education);
              if (Array.isArray(parsed)) {
                educationEntries = parsed.map((edu: any) =>
                  typeof edu === 'object' ? `${edu.degree || ''} - ${edu.institution || ''} (${edu.year || ''})` : String(edu)
                );
              } else {
                educationEntries = [data.cv_education];
              }
            } catch (e) {
              educationEntries = data.cv_education.split('\n\n').filter(Boolean);
            }
          }
        }

        // Sanitize array fields - handle various formats
        const sanitizeArray = (field: any, defaultVal: any[] = []): string[] => {
          if (!field) return defaultVal;
          if (Array.isArray(field)) return field.map(String);
          if (typeof field === 'string') {
            try {
              const parsed = JSON.parse(field);
              return Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
            } catch (e) {
              return field.split(',').map((s: string) => s.trim()).filter(Boolean);
            }
          }
          return [String(field)];
        };

        // Sanitize accomplishments, awards, certifications, languages, interests, publications
        const accomplishmentsArray = sanitizeArray(data.cv_accomplishments, []);
        const awardsArray = sanitizeArray(data.cv_awards, []);
        const certificationsArray = sanitizeArray(data.cv_certifications, []);
        const languagesArray = sanitizeArray(data.cv_languages, []);
        const interestsArray = sanitizeArray(data.cv_interests, []);
        const publicationsArray = sanitizeArray(data.cv_publications, []);

        // Sanitize projects
        let projectsArray: string[] = [];
        if (data.cv_projects) {
          if (Array.isArray(data.cv_projects)) {
            projectsArray = data.cv_projects.map((project: any) => {
              if (typeof project === 'object') {
                const tech = project.technologies ? `(${project.technologies.join(', ')})` : '';
                return `${project.name || ''} - ${project.description || ''} ${tech}`;
              }
              return String(project);
            });
          } else if (typeof data.cv_projects === 'string') {
            try {
              const parsed = JSON.parse(data.cv_projects);
              if (Array.isArray(parsed)) {
                projectsArray = parsed.map((project: any) => {
                  if (typeof project === 'object') {
                    const tech = project.technologies ? `(${project.technologies.join(', ')})` : '';
                    return `${project.name || ''} - ${project.description || ''} ${tech}`;
                  }
                  return String(project);
                });
              } else {
                projectsArray = [data.cv_projects];
              }
            } catch (e) {
              projectsArray = data.cv_projects.split('\n\n').map((s: string) => s.trim()).filter(Boolean);
            }
          }
        }

        // Sanitize volunteer_work and additional_sections
        let volunteerWorkArray: string[] = [];
        if (data.cv_volunteer_work) {
          if (Array.isArray(data.cv_volunteer_work)) {
            volunteerWorkArray = data.cv_volunteer_work.map(String);
          } else if (typeof data.cv_volunteer_work === 'string') {
            try {
              const parsed = JSON.parse(data.cv_volunteer_work);
              volunteerWorkArray = Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
            } catch (e) {
              volunteerWorkArray = data.cv_volunteer_work.split('\n\n').map((s: string) => s.trim()).filter(Boolean);
            }
          }
        }

        let additionalSectionsArray: string[] = [];
        if (data.cv_additional_sections) {
          if (Array.isArray(data.cv_additional_sections)) {
            additionalSectionsArray = data.cv_additional_sections.map(String);
          } else if (typeof data.cv_additional_sections === 'string') {
            try {
              const parsed = JSON.parse(data.cv_additional_sections);
              additionalSectionsArray = Array.isArray(parsed) ? parsed.map(String) : [String(parsed)];
            } catch (e) {
              additionalSectionsArray = data.cv_additional_sections.split('\n\n').map((s: string) => s.trim()).filter(Boolean);
            }
          }
        }

        // Sanitize target_roles, cv_skills, preferred_locations
        const targetRoles = sanitizeArray(data.target_roles, []);
        const cvSkills = sanitizeArray(data.cv_skills, []);
        const preferredLocations = sanitizeArray(data.preferred_locations, []);

        setFormData({
          cv_name: data.cv_name || '',
          cv_email: data.cv_email || '',
          cv_phone: data.cv_phone || '',
          cv_location: data.cv_location || '',
          cv_summary: data.cv_summary || '',
          target_roles: targetRoles,
          cv_skills: cvSkills,
          work_experience: workExpEntries,
          education: educationEntries,
          projects: projectsArray,
          accomplishments: accomplishmentsArray,
          awards: awardsArray,
          certifications: certificationsArray,
          languages: languagesArray,
          interests: interestsArray,
          cv_linkedin: data.cv_linkedin || '',
          cv_github: data.cv_github || '',
          cv_portfolio: data.cv_portfolio || '',
          publications: publicationsArray,
          volunteer_work: volunteerWorkArray,
          additional_sections: additionalSectionsArray,
          preferred_locations: preferredLocations,
          salary_min: data.salary_min?.toString() || '',
          salary_max: data.salary_max?.toString() || '',
          experience_level: data.experience_level || '',
          job_type: data.job_type || '',
          remote_preference: data.remote_preference || '',
          sector: data.sector || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    try {
      // Update profiles table
      await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: formData.cv_email || user.email,
          full_name: formData.cv_name || null,
          phone: formData.cv_phone || null,
          location: formData.cv_location || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        });

      // Update onboarding_data table
      const { error } = await supabase
        .from('onboarding_data')
        .upsert({
          user_id: user.id,
          cv_name: formData.cv_name || null,
          cv_email: formData.cv_email || null,
          cv_phone: formData.cv_phone || null,
          cv_location: formData.cv_location || null,
          cv_summary: formData.cv_summary || null,
          target_roles: formData.target_roles || [],
          cv_skills: formData.cv_skills || [],
          cv_work_experience: formData.work_experience.length > 0 ? formData.work_experience : null,
          cv_education: formData.education.length > 0 ? formData.education : null,
          cv_projects: formData.projects.length > 0 ? formData.projects : null,
          cv_accomplishments: formData.accomplishments || [],
          cv_awards: formData.awards || [],
          cv_certifications: formData.certifications || [],
          cv_languages: formData.languages || [],
          cv_interests: formData.interests || [],
          cv_linkedin: formData.cv_linkedin || null,
          cv_github: formData.cv_github || null,
          cv_portfolio: formData.cv_portfolio || null,
          cv_publications: formData.publications || [],
          cv_volunteer_work: formData.volunteer_work.length > 0 ? formData.volunteer_work : null,
          cv_additional_sections: formData.additional_sections.length > 0 ? formData.additional_sections : null,
          preferred_locations: formData.preferred_locations || [],
          salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
          salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
          experience_level: formData.experience_level || null,
          job_type: formData.job_type || null,
          remote_preference: formData.remote_preference || null,
          sector: formData.sector || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      // Update auth email if changed
      if (formData.cv_email && formData.cv_email !== user.email) {
        await supabase.auth.updateUser({ email: formData.cv_email });
      }

      alert('Profile updated successfully!');
      router.back();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      alert(error.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleTagSubmit = (field: 'target_roles' | 'cv_skills' | 'preferred_locations' | 'accomplishments' | 'languages' | 'interests', value: string) => {
    if (!value.trim()) return;

    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], value.trim()],
    }));

    if (field === 'target_roles') setTargetRoleInput('');
    if (field === 'cv_skills') setSkillInput('');
    if (field === 'preferred_locations') setLocationInput('');
    if (field === 'accomplishments') setAccomplishmentInput('');
    if (field === 'languages') setLanguageInput('');
    if (field === 'interests') setInterestInput('');
  };

  const removeTag = (field: 'target_roles' | 'cv_skills' | 'preferred_locations' | 'accomplishments' | 'awards' | 'certifications' | 'languages' | 'interests' | 'publications', index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleArrayFieldChange = (field: 'work_experience' | 'education' | 'projects' | 'awards' | 'certifications' | 'publications' | 'volunteer_work' | 'additional_sections', index: number, value: string) => {
    setFormData((prev) => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const addArrayField = (field: 'work_experience' | 'education' | 'projects' | 'awards' | 'certifications' | 'publications' | 'volunteer_work' | 'additional_sections') => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const removeArrayField = (field: 'work_experience' | 'education' | 'projects' | 'awards' | 'certifications' | 'publications' | 'volunteer_work' | 'additional_sections', index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.colors.background.muted }}>
        <p style={{ color: theme.colors.text.secondary }}>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.muted }}>
      {/* Header */}
      <div
        className="pt-12 pb-6 px-6 sticky top-0 z-10"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.primary.DEFAULT} 0%, ${theme.colors.primary.dark} 100%)`,
        }}
      >
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h1 className="text-2xl font-bold text-white flex-1">Edit Profile</h1>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-white text-primary hover:bg-gray-100"
            style={{ color: theme.colors.primary.DEFAULT }}
          >
            {saving ? (
              <>
                <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 py-6 pb-32 max-w-4xl mx-auto">
        {/* Personal Details */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Personal Details</h2>
          <div className="bg-white rounded-xl p-4 sm:p-6 space-y-4 shadow-sm border border-gray-100">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">Full Name *</label>
              <Input
                value={formData.cv_name}
                onChange={(e) => setFormData({ ...formData, cv_name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">Email *</label>
              <Input
                type="email"
                value={formData.cv_email}
                onChange={(e) => setFormData({ ...formData, cv_email: e.target.value })}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">Phone</label>
              <Input
                type="tel"
                value={formData.cv_phone}
                onChange={(e) => setFormData({ ...formData, cv_phone: e.target.value })}
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">Location</label>
              <Input
                value={formData.cv_location}
                onChange={(e) => setFormData({ ...formData, cv_location: e.target.value })}
                placeholder="City, State/Country"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">Professional Summary</label>
              <Textarea
                value={formData.cv_summary}
                onChange={(e) => setFormData({ ...formData, cv_summary: e.target.value })}
                placeholder="Brief summary of your professional background"
                className="min-h-[100px]"
              />
            </div>
          </div>
        </section>

        {/* Professional Details */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Professional Details</h2>
          <div className="bg-white rounded-xl p-4 sm:p-6 space-y-6 shadow-sm border border-gray-100">
            {/* Target Roles */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900 flex items-center gap-2">
                <Briefcase size={16} style={{ color: theme.colors.primary.DEFAULT }} />
                Target Roles
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.target_roles.map((role, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700"
                  >
                    {role}
                    <button
                      onClick={() => removeTag('target_roles', index)}
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={targetRoleInput}
                  onChange={(e) => setTargetRoleInput(e.target.value)}
                  placeholder="Add target role..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleTagSubmit('target_roles', targetRoleInput);
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => handleTagSubmit('target_roles', targetRoleInput)}
                  className="px-4"
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900 flex items-center gap-2">
                <Code size={16} style={{ color: theme.colors.accent.gold }} />
                Skills
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.cv_skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-green-100 text-green-700"
                  >
                    {skill}
                    <button
                      onClick={() => removeTag('cv_skills', index)}
                      className="hover:bg-green-200 rounded-full p-0.5"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="Add skill..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleTagSubmit('cv_skills', skillInput);
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => handleTagSubmit('cv_skills', skillInput)}
                  className="px-4"
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>

            {/* Work Experience */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">Work Experience</label>
              {formData.work_experience.map((exp, index) => (
                <div key={index} className="mb-3">
                  <div className="flex gap-2">
                    <Textarea
                      value={exp}
                      onChange={(e) => handleArrayFieldChange('work_experience', index, e.target.value)}
                      placeholder="e.g., Senior Software Engineer at TechCorp, Lagos, Jan 2020 - Present. Led development..."
                      className="flex-1 min-h-[80px]"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeArrayField('work_experience', index)}
                      className="px-3"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => addArrayField('work_experience')}
                className="w-full"
              >
                <Plus size={16} className="mr-2" />
                Add Work Experience
              </Button>
            </div>

            {/* Education */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">Education</label>
              {formData.education.map((edu, index) => (
                <div key={index} className="mb-3">
                  <div className="flex gap-2">
                    <Input
                      value={edu}
                      onChange={(e) => handleArrayFieldChange('education', index, e.target.value)}
                      placeholder="e.g., B.Sc Computer Science, University of Lagos, 2018"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeArrayField('education', index)}
                      className="px-3"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => addArrayField('education')}
                className="w-full"
              >
                <Plus size={16} className="mr-2" />
                Add Education
              </Button>
            </div>

            {/* Projects */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">Projects</label>
              {formData.projects.map((project, index) => (
                <div key={index} className="mb-3">
                  <div className="flex gap-2">
                    <Textarea
                      value={project}
                      onChange={(e) => handleArrayFieldChange('projects', index, e.target.value)}
                      placeholder="Project description..."
                      className="flex-1 min-h-[60px]"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeArrayField('projects', index)}
                      className="px-3"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => addArrayField('projects')}
                className="w-full"
              >
                <Plus size={16} className="mr-2" />
                Add Project
              </Button>
            </div>

            {/* Accomplishments */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">Accomplishments</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.accomplishments.map((accomplishment, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700"
                  >
                    {accomplishment}
                    <button
                      onClick={() => removeTag('accomplishments', index)}
                      className="hover:bg-yellow-200 rounded-full p-0.5"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={accomplishmentInput}
                  onChange={(e) => setAccomplishmentInput(e.target.value)}
                  placeholder="Add accomplishment..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleTagSubmit('accomplishments', accomplishmentInput);
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => handleTagSubmit('accomplishments', accomplishmentInput)}
                  className="px-4"
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>

            {/* Awards */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">Awards</label>
              {formData.awards.map((award, index) => (
                <div key={index} className="mb-2 flex gap-2">
                  <Input
                    value={award}
                    onChange={(e) => handleArrayFieldChange('awards', index, e.target.value)}
                    placeholder="Award name..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeArrayField('awards', index)}
                    className="px-3"
                  >
                    <X size={16} />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => addArrayField('awards')}
                className="w-full"
              >
                <Plus size={16} className="mr-2" />
                Add Award
              </Button>
            </div>

            {/* Certifications */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">Certifications</label>
              {formData.certifications.map((cert, index) => (
                <div key={index} className="mb-2 flex gap-2">
                  <Input
                    value={cert}
                    onChange={(e) => handleArrayFieldChange('certifications', index, e.target.value)}
                    placeholder="Certification name..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeArrayField('certifications', index)}
                    className="px-3"
                  >
                    <X size={16} />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => addArrayField('certifications')}
                className="w-full"
              >
                <Plus size={16} className="mr-2" />
                Add Certification
              </Button>
            </div>

            {/* Languages */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">Languages</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.languages.map((lang, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-700"
                  >
                    {lang}
                    <button
                      onClick={() => removeTag('languages', index)}
                      className="hover:bg-indigo-200 rounded-full p-0.5"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={languageInput}
                  onChange={(e) => setLanguageInput(e.target.value)}
                  placeholder="Add language..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleTagSubmit('languages', languageInput);
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => handleTagSubmit('languages', languageInput)}
                  className="px-4"
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>

            {/* Interests */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">Interests</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.interests.map((interest, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-pink-100 text-pink-700"
                  >
                    {interest}
                    <button
                      onClick={() => removeTag('interests', index)}
                      className="hover:bg-pink-200 rounded-full p-0.5"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  placeholder="Add interest..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleTagSubmit('interests', interestInput);
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => handleTagSubmit('interests', interestInput)}
                  className="px-4"
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Links */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Links</h2>
          <div className="bg-white rounded-xl p-4 sm:p-6 space-y-4 shadow-sm border border-gray-100">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">LinkedIn</label>
              <Input
                type="url"
                value={formData.cv_linkedin}
                onChange={(e) => setFormData({ ...formData, cv_linkedin: e.target.value })}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">GitHub</label>
              <Input
                type="url"
                value={formData.cv_github}
                onChange={(e) => setFormData({ ...formData, cv_github: e.target.value })}
                placeholder="https://github.com/yourusername"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">Portfolio</label>
              <Input
                type="url"
                value={formData.cv_portfolio}
                onChange={(e) => setFormData({ ...formData, cv_portfolio: e.target.value })}
                placeholder="https://yourportfolio.com"
              />
            </div>
          </div>
        </section>

        {/* Additional Information */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Additional Information</h2>
          <div className="bg-white rounded-xl p-4 sm:p-6 space-y-6 shadow-sm border border-gray-100">
            {/* Publications */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">Publications</label>
              {formData.publications.map((pub, index) => (
                <div key={index} className="mb-3">
                  <div className="flex gap-2">
                    <Textarea
                      value={pub}
                      onChange={(e) => handleArrayFieldChange('publications', index, e.target.value)}
                      placeholder="Publication details..."
                      className="flex-1 min-h-[60px]"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeArrayField('publications', index)}
                      className="px-3"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => addArrayField('publications')}
                className="w-full"
              >
                <Plus size={16} className="mr-2" />
                Add Publication
              </Button>
            </div>

            {/* Volunteer Work */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">Volunteer Work</label>
              {formData.volunteer_work.map((vol, index) => (
                <div key={index} className="mb-3">
                  <div className="flex gap-2">
                    <Textarea
                      value={vol}
                      onChange={(e) => handleArrayFieldChange('volunteer_work', index, e.target.value)}
                      placeholder="Volunteer work description..."
                      className="flex-1 min-h-[60px]"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeArrayField('volunteer_work', index)}
                      className="px-3"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => addArrayField('volunteer_work')}
                className="w-full"
              >
                <Plus size={16} className="mr-2" />
                Add Volunteer Work
              </Button>
            </div>

            {/* Additional Sections */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">Additional Sections</label>
              {formData.additional_sections.map((section, index) => (
                <div key={index} className="mb-3">
                  <div className="flex gap-2">
                    <Textarea
                      value={section}
                      onChange={(e) => handleArrayFieldChange('additional_sections', index, e.target.value)}
                      placeholder="Additional information..."
                      className="flex-1 min-h-[60px]"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeArrayField('additional_sections', index)}
                      className="px-3"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => addArrayField('additional_sections')}
                className="w-full"
              >
                <Plus size={16} className="mr-2" />
                Add Section
              </Button>
            </div>
          </div>
        </section>
          </div>
        </section>

        {/* Job Preferences */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Job Preferences</h2>
          <div className="bg-white rounded-xl p-4 sm:p-6 space-y-4 shadow-sm border border-gray-100">
            {/* Preferred Locations */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900 flex items-center gap-2">
                <MapPin size={16} style={{ color: theme.colors.accent.blue }} />
                Preferred Locations
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.preferred_locations.map((location, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700"
                  >
                    {location}
                    <button
                      onClick={() => removeTag('preferred_locations', index)}
                      className="hover:bg-purple-200 rounded-full p-0.5"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="Add preferred location..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleTagSubmit('preferred_locations', locationInput);
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => handleTagSubmit('preferred_locations', locationInput)}
                  className="px-4"
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900">Salary Min</label>
                <Input
                  type="number"
                  value={formData.salary_min}
                  onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                  placeholder="Minimum salary"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900">Salary Max</label>
                <Input
                  type="number"
                  value={formData.salary_max}
                  onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                  placeholder="Maximum salary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">Experience Level</label>
              <Select value={formData.experience_level} onValueChange={(value) => setFormData({ ...formData, experience_level: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_LEVELS.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">Job Type</label>
              <Select value={formData.job_type} onValueChange={(value) => setFormData({ ...formData, job_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  {JOB_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">Remote Preference</label>
              <Select value={formData.remote_preference} onValueChange={(value) => setFormData({ ...formData, remote_preference: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select remote preference" />
                </SelectTrigger>
                <SelectContent>
                  {REMOTE_PREFERENCES.map((pref) => (
                    <SelectItem key={pref} value={pref}>
                      {pref}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">Sector</label>
              <Select value={formData.sector} onValueChange={(value) => setFormData({ ...formData, sector: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sector" />
                </SelectTrigger>
                <SelectContent>
                  {SECTORS.map((sector) => (
                    <SelectItem key={sector} value={sector}>
                      {sector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

