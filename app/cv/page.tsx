"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Plus, FileText, Trash2, ArrowLeft } from 'lucide-react';
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
    </div>
  );
}


