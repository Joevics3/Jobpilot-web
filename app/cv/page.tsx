"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Plus, FileText, Trash2, ArrowLeft, ChevronDown } from 'lucide-react';
import { theme } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import CreateCVModal from '@/components/cv/CreateCVModal';
import CreateCoverLetterModal from '@/components/cv/CreateCoverLetterModal';
import Link from 'next/link';

interface CVDocument {
  id: string;
  name: string;
  type: 'cv' | 'cover-letter';
  template_id: string;
  structured_data: any;
  content: string;
  created_at: string;
  updated_at: string;
}

export default function CVListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [documents, setDocuments] = useState<CVDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'cv' | 'cover-letter'>('cv');
  const [cvModalOpen, setCvModalOpen] = useState(false);
  const [coverLetterModalOpen, setCoverLetterModalOpen] = useState(false);
  const [seoExpanded, setSeoExpanded] = useState(false);

  // Read tab from URL parameter on mount
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'cv' || tabParam === 'cover-letter') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    checkAuth();
    loadDocuments();
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [activeTab]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
    } else {
      setLoading(false);
    }
  };

  const loadDocuments = () => {
    try {
      setLoading(true);
      const existingDocs = localStorage.getItem('cv_documents');
      if (existingDocs) {
        const docs = JSON.parse(existingDocs);
        const filtered = docs.filter((doc: any) => doc.type === activeTab);
        setDocuments(filtered);
      } else {
        setDocuments([]);
      }
    } catch (error: any) {
      console.error('Error loading documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const existingDocs = localStorage.getItem('cv_documents');
      if (existingDocs) {
        const docs = JSON.parse(existingDocs);
        const filtered = docs.filter((doc: any) => doc.id !== id);
        localStorage.setItem('cv_documents', JSON.stringify(filtered));
        loadDocuments();
      }
    } catch (error: any) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  const handleCVComplete = (cvId: string) => {
    loadDocuments();
    router.push(`/cv/view/${cvId}`);
  };

  const handleCoverLetterComplete = (coverLetterId: string) => {
    loadDocuments();
    router.push(`/cv/view/${coverLetterId}`);
  };

  const filteredDocuments = documents.filter(doc => doc.type === activeTab);

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.muted }}>
      {/* Header */}
       <div
         className="pt-12 pb-8 px-6 relative"
         style={{
           backgroundColor: theme.colors.primary.DEFAULT,
         }}
       >
         <div className="flex justify-between items-center">
           <div>
             <Link href="/jobs" className="text-sm text-white/80 hover:text-white transition-colors self-start mb-2 inline-block">
               ← Back to Jobs
             </Link>
             <h1 className="text-3xl font-bold mb-2 text-white">CV & Cover Letters</h1>
             <p className="text-white/80">Manage your professional documents</p>
           </div>
          <Button
            onClick={() => activeTab === 'cv' ? setCvModalOpen(true) : setCoverLetterModalOpen(true)}
            className="bg-white text-primary hover:bg-gray-100 px-3 py-2 text-sm"
          >
            <Plus size={16} className="mr-1" />
            Create {activeTab === 'cv' ? 'CV' : 'Cover Letter'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 mt-4 flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('cv')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'cv'
              ? 'border-b-2 text-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          style={{
            borderBottomColor: activeTab === 'cv' ? theme.colors.primary.DEFAULT : 'transparent',
            color: activeTab === 'cv' ? theme.colors.primary.DEFAULT : undefined,
          }}
        >
          CVs
        </button>
        <button
          onClick={() => setActiveTab('cover-letter')}
          className={`px-4 py-2 font-medium text-sm transition-colors ${
            activeTab === 'cover-letter'
              ? 'border-b-2 text-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          style={{
            borderBottomColor: activeTab === 'cover-letter' ? theme.colors.primary.DEFAULT : 'transparent',
            color: activeTab === 'cover-letter' ? theme.colors.primary.DEFAULT : undefined,
          }}
        >
          Cover Letters
        </button>
      </div>

      {/* Content */}
      <div className="px-6 py-6 pb-24">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No {activeTab === 'cv' ? 'CVs' : 'cover letters'} yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first {activeTab === 'cv' ? 'CV' : 'cover letter'} to get started
            </p>
            <p className="text-sm text-gray-500">Use the button in the header to create your first document</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc, index) => (
              <React.Fragment key={doc.id}>
              <div
                className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100 cursor-pointer"
                onClick={() => router.push(`/cv/view/${doc.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{doc.name}</h3>
                    <p className="text-xs text-gray-500">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(doc.id);
                    }}
                    className="p-1 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </button>
                </div>
              </div>

              </React.Fragment>
            ))}
          </div>
        )}


        {/* Desktop Create Button */}
        <div className="hidden sm:block mt-6">
          <Button
            onClick={() => activeTab === 'cv' ? setCvModalOpen(true) : setCoverLetterModalOpen(true)}
            style={{ backgroundColor: theme.colors.primary.DEFAULT }}
          >
            <Plus size={16} className="mr-2" />
            Create {activeTab === 'cv' ? 'CV' : 'Cover Letter'}
          </Button>
        </div>
      </div>

      {/* Modals */}
      <CreateCVModal
        isOpen={cvModalOpen}
        onClose={() => setCvModalOpen(false)}
        onComplete={handleCVComplete}
      />
      <CreateCoverLetterModal
        isOpen={coverLetterModalOpen}
        onClose={() => setCoverLetterModalOpen(false)}
        onComplete={handleCoverLetterComplete}
      />

      {/* SEO Content Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setSeoExpanded(!seoExpanded)}
            className="w-full flex items-center justify-between p-6 text-left"
          >
            <h2 className="text-xl font-bold text-gray-900">Learn More About CVs & Cover Letters</h2>
            <ChevronDown
              size={24}
              className={`text-gray-500 transition-transform duration-200 ${seoExpanded ? 'rotate-180' : ''}`}
            />
          </button>
          
          {seoExpanded && (
            <div className="px-6 pb-6 pt-0">
              <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
                <p>
                  Welcome to JobMeter's CV and Cover Letter creation tool, your comprehensive solution for crafting professional documents that get results. In Nigeria's competitive job market, your CV and cover letter are often your first impression with potential employers. Our AI-powered tools help you create compelling documents that showcase your skills, experience, and potential to hiring managers.
                </p>

                <h3 className="text-xl font-semibold text-gray-900">Why a Professional CV Matters</h3>
                <p>
                  Your CV is more than just a document listing your work history; it's your marketing tool in the job market. Recruiters spend an average of 6-7 seconds scanning a CV before deciding whether to move forward. A well-crafted CV highlights your achievements, demonstrates your value, and makes a strong case for why you're the right candidate. In Nigeria, where competition for desirable positions is fierce, having a professional CV can significantly increase your chances of landing interviews.
                </p>

                <h3 className="text-xl font-semibold text-gray-900">How Our CV Builder Works</h3>
                <p>
                  Our CV builder uses artificial intelligence to help you create professional resumes in minutes. Simply input your personal information, work experience, education, and skills, and our system will generate a well-structured, ATS-friendly CV. Choose from a variety of professional templates designed to pass ATS screening while maintaining visual appeal. The builder ensures your CV includes all essential sections and follows best practices for Nigerian and international job applications.
                </p>

                <h3 className="text-xl font-semibold text-gray-900">Key Features of Our CV Builder</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>AI-Powered Suggestions:</strong> Get intelligent recommendations for improving your CV content</li>
                  <li><strong>ATS-Compatible Templates:</strong> Choose from templates designed to pass Applicant Tracking Systems</li>
                  <li><strong>Multiple Format Options:</strong> Export your CV in PDF, DOC, and other formats</li>
                  <li><strong>Cover Letter Integration:</strong> Create matching cover letters that complement your CV</li>
                  <li><strong>Easy Editing:</strong> Update and modify your CV anytime with our intuitive editor</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900">The Importance of Cover Letters</h3>
                <p>
                  While many job seekers neglect cover letters, they remain a crucial component of job applications. A well-written cover letter provides context to your CV, demonstrates your communication skills, and shows genuine interest in the position. It allows you to highlight specific experiences and achievements that make you the ideal candidate. Our cover letter builder helps you create personalized, compelling letters that complement your CV and increase your chances of getting noticed.
                </p>

                <h3 className="text-xl font-semibold text-gray-900">Tips for Writing Effective CVs</h3>
                <p>
                  To maximize your CV's effectiveness, keep these tips in mind: Tailor your CV to each job application by including relevant keywords from the job description, use action verbs to describe your achievements, quantify results where possible (e.g., "increased sales by 25%"), keep your CV concise and focused (1-2 pages for most positions), proofread meticulously for errors, and ensure consistent formatting throughout. Our tool helps you implement all these best practices automatically.
                </p>

                <h3 className="text-xl font-semibold text-gray-900">Tips for Writing Cover Letters</h3>
                <p>
                  A great cover letter should be concise, personalized, and compelling. Start by addressing the hiring manager by name if possible. Open with a strong statement that captures attention and explains your interest in the specific role. Highlight relevant experiences and achievements that directly match the job requirements. Demonstrate knowledge about the company and explain why you'd be a great fit. Close with a call to action and thank the reader for their consideration. Our builder provides templates and guidance for each section.
                </p>

                <h3 className="text-xl font-semibold text-gray-900">Common CV Mistakes to Avoid</h3>
                <p>
                  Avoid these common mistakes that can hurt your chances: Including irrelevant personal information, using unprofessional email addresses, submitting generic CVs instead of tailored ones, using complex formatting that ATS cannot read, listing responsibilities without achievements, including gaps without explanation, and submitting the same CV for every application. Our tools help you avoid these pitfalls and create targeted, professional documents.
                </p>

                <p>
                  Start creating your professional CV and cover letter today with JobMeter. Our intuitive tools and AI-powered suggestions help you craft documents that make lasting impressions and accelerate your job search success.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


