"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, FileText, Clipboard, Plus } from 'lucide-react';
import { theme } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'];
const EXPERIENCE_LEVELS = ['Entry Level', 'Junior', 'Mid-level', 'Senior', 'Lead', 'Executive'];

export default function SubmitJobPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'form' | 'paste'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pastedContent, setPastedContent] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [jobData, setJobData] = useState({
    title: '',
    sector: '',
    companyName: '',
    companyWebsite: '',
    city: '',
    state: '',
    remote: false,
    employmentType: '',
    skills: '',
    experienceLevel: '',
    salaryMin: '',
    salaryMax: '',
    currency: 'NGN',
    period: 'annually',
    description: '',
    responsibilities: '',
    qualifications: '',
    benefits: '',
    applicationUrl: '',
    applicationEmail: '',
    applicationPhone: '',
    deadline: ''
  });

  useEffect(() => {
    // No auth check needed - page is public
  }, []);

  // Generate hash for duplicate checking
  const generateHash = (input: string): string => {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).substring(0, 7);
  };

  // Check for duplicates
  const checkForDuplicates = async (title: string, companyName: string, city: string, state: string): Promise<boolean> => {
    try {
      const duplicateCheck = {
        hash: generateHash(JSON.stringify({
          title: title,
          company: companyName,
          location: `${city}_${state}`,
        })),
        fingerprint: `${title}_${companyName}_${city}`,
      };

      const [submittedJobs, existingJobs] = await Promise.all([
        supabase
          .from('user_submitted_jobs')
          .select('id, title, company, duplicate_check')
          .not('duplicate_check', 'is', null),
        supabase
          .from('jobs')
          .select('id, title, company, duplicate_check')
          .not('duplicate_check', 'is', null)
      ]);

      const isSubmittedDuplicate = submittedJobs.data?.some(job =>
        job.duplicate_check?.hash === duplicateCheck.hash
      );

      const isExistingDuplicate = existingJobs.data?.some(job =>
        job.duplicate_check?.hash === duplicateCheck.hash
      );

      return isSubmittedDuplicate || isExistingDuplicate || false;
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      return false;
    }
  };

  const handleFormSubmit = async () => {
    // Validation
    if (!jobData.title.trim() || !jobData.sector.trim() ||
        !jobData.description.trim() ||
        !jobData.city.trim() || !jobData.state.trim()) {
      alert('Please fill in all required fields (Title, Sector, Description, and Location).');
      return;
    }

    if (!jobData.applicationUrl.trim() && !jobData.applicationEmail.trim() && !jobData.applicationPhone.trim()) {
      alert('Please provide at least one application method (Email, URL, or Phone).');
      return;
    }

    setIsLoading(true);

    try {
      // Check for duplicates
      const isDuplicate = await checkForDuplicates(
        jobData.title.trim(),
        jobData.companyName.trim(),
        jobData.city.trim(),
        jobData.state.trim()
      );

      if (isDuplicate) {
        alert(`A job with the title "${jobData.title}" at ${jobData.companyName} already exists in our system.`);
        setIsLoading(false);
        return;
      }

      const duplicateCheck = {
        hash: generateHash(JSON.stringify({
          title: jobData.title.trim(),
          company: jobData.companyName.trim(),
          location: `${jobData.city.trim()}_${jobData.state.trim()}`,
        })),
        fingerprint: `${jobData.title.trim()}_${jobData.companyName.trim()}_${jobData.city.trim()}`,
      };

      // Create formatted text for AI processing
      const formattedJobText = `Job Title: ${jobData.title.trim()}
Company: ${jobData.companyName.trim()}
Company Website: ${jobData.companyWebsite.trim() || 'Not specified'}
Location: ${jobData.city.trim()}, ${jobData.state.trim()}
Remote: ${jobData.remote ? 'Yes' : 'No'}
Employment Type: ${jobData.employmentType || 'Not specified'}
Experience Level: ${jobData.experienceLevel || 'Not specified'}
Sector: ${jobData.sector}
Skills Required: ${jobData.skills.trim()}
Salary Range: ${jobData.salaryMin && jobData.salaryMax ? `${jobData.currency} ${jobData.salaryMin} - ${jobData.salaryMax} ${jobData.period}` : 'Not specified'}
Description: ${jobData.description.trim()}
Responsibilities: ${jobData.responsibilities.trim() || 'Not specified'}
Qualifications: ${jobData.qualifications.trim() || 'Not specified'}
Benefits: ${jobData.benefits.trim() || 'Not specified'}
Application Email: ${jobData.applicationEmail.trim() || 'Not specified'}
Application URL: ${jobData.applicationUrl.trim() || 'Not specified'}
Application Phone: ${jobData.applicationPhone.trim() || 'Not specified'}
Deadline: ${jobData.deadline || 'Not specified'}
Posted Date: ${new Date().toISOString().split('T')[0]}`;

      const { data: { user } } = await supabase.auth.getUser();

      const jobPayload = {
        user_id: user?.id,
        submission_method: 'form',
        submission_notes: submissionNotes.trim() || null,
        raw_pasted_content: formattedJobText,
        duplicate_check: duplicateCheck,
        status: 'pending',
        title: jobData.title.trim(),
        role: jobData.title.trim(),
        sector: jobData.sector,
        company: { name: jobData.companyName.trim() },
        location: {
          city: jobData.city.trim(),
          state: jobData.state.trim(),
          country: 'Nigeria',
          remote: jobData.remote
        },
        employment_type: jobData.employmentType || 'Full-time',
        skills_required: jobData.skills.trim() ? jobData.skills.trim().split(',').map(s => s.trim()).filter(Boolean) : [],
        experience_level: jobData.experienceLevel || 'Mid-level',
        description: jobData.description.trim(),
        responsibilities: jobData.responsibilities.trim() ? [jobData.responsibilities.trim()] : [],
        qualifications: jobData.qualifications.trim() ? [jobData.qualifications.trim()] : [],
        benefits: jobData.benefits.trim() ? [jobData.benefits.trim()] : [],
        application: {
          email: jobData.applicationEmail.trim() || undefined,
          url: jobData.applicationUrl.trim() || undefined,
          phone: jobData.applicationPhone.trim() || undefined,
        },
        posted_date: new Date().toISOString().split('T')[0],
        deadline: jobData.deadline || null,
      };

      const { data, error } = await supabase
        .from('user_submitted_jobs')
        .insert([jobPayload])
        .select()
        .single();

      if (error) throw error;

      // Trigger background processing (fire-and-forget)
      fetch('/api/jobs/process-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: data.id }),
      }).catch(err => {
        console.error('Failed to trigger background processing:', err);
        // Don't show error to user - processing will happen eventually
      });

      setShowSuccessModal(true);

    } catch (error: any) {
      console.error('Job submission error:', error);
      alert(error.message || 'Failed to submit job. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteSubmit = async () => {
    if (!pastedContent.trim()) {
      alert('Please paste a job description.');
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const submissionPayload = {
        user_id: user?.id,
        submission_method: 'paste',
        raw_pasted_content: pastedContent.trim(),
        submission_notes: submissionNotes.trim() || null,
        title: 'Processing...',
        role: 'Processing...',
        sector: 'Processing...',
        company: { name: 'Processing...' },
        location: { city: '', state: '', country: '', remote: false },
        employment_type: 'Full-time',
        skills_required: [],
        experience_level: 'Mid-level',
        description: 'Processing...',
        responsibilities: [],
        qualifications: [],
        benefits: [],
        posted_date: new Date().toISOString().split('T')[0],
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('user_submitted_jobs')
        .insert([submissionPayload])
        .select()
        .single();

      if (error) throw error;

      // Trigger background processing (fire-and-forget)
      fetch('/api/jobs/process-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId: data.id }),
      }).catch(err => {
        console.error('Failed to trigger background processing:', err);
        // Don't show error to user - processing will happen eventually
      });

      setShowSuccessModal(true);

    } catch (error: any) {
      console.error('Job submission error:', error);
      alert(error.message || 'Failed to submit job. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (activeTab === 'form') {
      await handleFormSubmit();
    } else {
      await handlePasteSubmit();
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.muted }}>
      {/* Header */}
      <div
        className="pt-12 pb-8 px-6"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.primary.DEFAULT} 0%, ${theme.colors.primary.light} 100%)`,
        }}
      >
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors"
          >
            <ArrowLeft size={24} className="text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">Submit a Job</h1>
            <p className="text-white/80 mt-1">
              Post a job opportunity to help others find their dream role
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 bg-white/20 rounded-lg p-1 mt-4">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md font-medium transition-colors ${
              activeTab === 'form'
                ? 'bg-white text-gray-900'
                : 'text-white/80'
            }`}
          >
            <FileText size={20} />
            <span>Fill Form</span>
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-md font-medium transition-colors ${
              activeTab === 'paste'
                ? 'bg-white text-gray-900'
                : 'text-white/80'
            }`}
          >
            <Clipboard size={20} />
            <span>Paste Job</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 pb-32">
        {activeTab === 'form' ? (
          <div className="space-y-6">
            {/* Job Details */}
            <section className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Job Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900">Job Title *</label>
                  <Input
                    placeholder="e.g., Senior React Developer"
                    value={jobData.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJobData({...jobData, title: e.target.value})}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900">Sector *</label>
                  <select
                    value={jobData.sector}
                    onChange={(e) => setJobData({...jobData, sector: e.target.value})}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    style={{
                      borderColor: theme.colors.border.DEFAULT,
                      color: theme.colors.text.primary,
                    }}
                  >
                    <option value="">Select a sector</option>
                    {SECTORS.map((sector) => (
                      <option key={sector} value={sector}>
                        {sector}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900">Employment Type</label>
                  <div className="flex flex-wrap gap-2">
                    {EMPLOYMENT_TYPES.map((type) => (
                      <button
                        key={type}
                        onClick={() => setJobData({...jobData, employmentType: jobData.employmentType === type ? '' : type})}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          jobData.employmentType === type
                            ? 'text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        style={jobData.employmentType === type ? { backgroundColor: theme.colors.primary.DEFAULT } : {}}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900">Experience Level</label>
                  <div className="flex flex-wrap gap-2">
                    {EXPERIENCE_LEVELS.map((level) => (
                      <button
                        key={level}
                        onClick={() => setJobData({...jobData, experienceLevel: jobData.experienceLevel === level ? '' : level})}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          jobData.experienceLevel === level
                            ? 'text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        style={jobData.experienceLevel === level ? { backgroundColor: theme.colors.primary.DEFAULT } : {}}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Company Information */}
            <section className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Company Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900">Company Name</label>
                  <Input
                    placeholder="e.g., TechCorp Inc"
                    value={jobData.companyName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJobData({...jobData, companyName: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900">Company Website</label>
                  <Input
                    placeholder="https://company.com"
                    type="url"
                    value={jobData.companyWebsite}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJobData({...jobData, companyWebsite: e.target.value})}
                  />
                </div>
              </div>
            </section>

            {/* Location */}
            <section className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Location *</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-900">City *</label>
                    <Input
                      placeholder="e.g., Lagos"
                      value={jobData.city}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJobData({...jobData, city: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-900">State/Country *</label>
                    <Input
                      placeholder="e.g., Lagos State, Nigeria"
                      value={jobData.state}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJobData({...jobData, state: e.target.value})}
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={jobData.remote}
                    onChange={(e) => setJobData({...jobData, remote: e.target.checked})}
                    className="w-4 h-4 rounded"
                    style={{ accentColor: theme.colors.primary.DEFAULT }}
                  />
                  <span className="text-sm text-gray-900">Remote work available</span>
                </label>
              </div>
            </section>

            {/* Compensation & Requirements */}
            <section className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Compensation & Requirements</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900">Required Skills</label>
                  <Input
                    placeholder="e.g., React, JavaScript, TypeScript, Node.js"
                    value={jobData.skills}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJobData({...jobData, skills: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-900">Min Salary</label>
                    <Input
                      placeholder="500000"
                      type="number"
                      value={jobData.salaryMin}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJobData({...jobData, salaryMin: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-900">Max Salary</label>
                    <Input
                      placeholder="800000"
                      type="number"
                      value={jobData.salaryMax}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJobData({...jobData, salaryMax: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Job Description */}
            <section className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Job Description</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900">Description *</label>
                  <Textarea
                    placeholder="Describe the role, company culture, and what makes this opportunity special..."
                    value={jobData.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJobData({...jobData, description: e.target.value})}
                    className="min-h-[100px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900">Responsibilities</label>
                  <Input
                    placeholder="e.g., Develop features, Code reviews, Team collaboration"
                    value={jobData.responsibilities}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJobData({...jobData, responsibilities: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900">Qualifications</label>
                  <Input
                    placeholder="e.g., 3+ years experience, Bachelor's degree, Portfolio required"
                    value={jobData.qualifications}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJobData({...jobData, qualifications: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900">Benefits</label>
                  <Input
                    placeholder="e.g., Health insurance, Pension, Flexible hours, Remote work"
                    value={jobData.benefits}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJobData({...jobData, benefits: e.target.value})}
                  />
                </div>
              </div>
            </section>

            {/* Application Details */}
            <section className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-2 text-gray-900">Application Details *</h2>
              <p className="text-sm text-gray-600 mb-4">Provide at least one application method</p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-900">Email</label>
                    <Input
                      placeholder="jobs@company.com"
                      type="email"
                      value={jobData.applicationEmail}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJobData({...jobData, applicationEmail: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-900">URL</label>
                    <Input
                      placeholder="https://company.com/apply"
                      type="url"
                      value={jobData.applicationUrl}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJobData({...jobData, applicationUrl: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-900">Phone</label>
                    <Input
                      placeholder="+234 801 234 5678"
                      type="tel"
                      value={jobData.applicationPhone}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJobData({...jobData, applicationPhone: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-900">Application Deadline</label>
                  <Input
                    placeholder="YYYY-MM-DD (optional)"
                    value={jobData.deadline}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJobData({...jobData, deadline: e.target.value})}
                  />
                </div>
              </div>
            </section>

            {/* Additional Notes */}
            <section className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Additional Notes</h2>
              <Textarea
                placeholder="Any additional information about this job posting..."
                value={submissionNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSubmissionNotes(e.target.value)}
                className="min-h-[80px]"
              />
            </section>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-2 text-gray-900">Paste Job Description</h2>
              <p className="text-sm text-gray-600 mb-4">
                Paste the complete job description from any job board or company website.
                JobMeter will automatically extract and structure the information.
              </p>
              
              <Textarea
                placeholder="Paste the complete job description here..."
                value={pastedContent}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPastedContent(e.target.value)}
                className="min-h-[200px]"
              />
            </section>

            <section className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4 text-gray-900">Additional Notes</h2>
              <Textarea
                placeholder="Any additional information about this job posting..."
                value={submissionNotes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSubmissionNotes(e.target.value)}
                className="min-h-[80px]"
              />
            </section>
          </div>
        )}
      </div>

      {/* Footer Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-6 py-4 border-t bg-white" style={{ paddingBottom: 'calc(1rem + 64px)' }}>
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full py-3 text-lg font-semibold"
          style={{
            backgroundColor: isLoading ? theme.colors.text.secondary : theme.colors.primary.DEFAULT,
            color: theme.colors.primary.foreground,
          }}
        >
          {isLoading ? (
            <span>Submitting...</span>
          ) : (
            <>
              <Plus size={20} className="mr-2" />
              Submit Job
            </>
          )}
        </Button>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent style={{ backgroundColor: theme.colors.card.DEFAULT, borderColor: theme.colors.border.DEFAULT }}>
          <DialogHeader>
            <div className="text-center mb-4">
              <div className="text-5xl mb-4">✅</div>
              <DialogTitle className="text-2xl font-bold" style={{ color: theme.colors.text.primary }}>
                Job Submitted
              </DialogTitle>
              <DialogDescription className="mt-2" style={{ color: theme.colors.text.secondary }}>
                Your job posting has been submitted for approval.
              </DialogDescription>
            </div>
          </DialogHeader>
          <Button
            onClick={() => {
              setShowSuccessModal(false);
              router.push('/jobs');
            }}
            className="w-full mt-4"
            style={{
              backgroundColor: theme.colors.primary.DEFAULT,
              color: theme.colors.primary.foreground,
            }}
          >
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

