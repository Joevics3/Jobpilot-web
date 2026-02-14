"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, Shield, AlertTriangle, CheckCircle, XCircle, Flag, Loader2, Info, ExternalLink, Phone, Mail, Globe } from 'lucide-react';
import { theme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

interface Entity {
  id: string;
  entity_type: string;
  company_name: string;
  aliases: string[];
  website: string | null;
  report_count: number;
  verification_status: string;
  is_published: boolean;
  created_at: string;
}

interface Report {
  id: string;
  report_type: string;
  description: string;
  evidence_url: string | null;
  user_email: string | null;
  status: string;
  created_at: string;
}

const REPORT_TYPES = [
  { value: 'interview_scam', label: 'Interview Scam', description: 'Fake interview process, impersonation' },
  { value: 'upfront_payment', label: 'Upfront Payment', description: 'Requested money for equipment, training, visa' },
  { value: 'fake_offer', label: 'Fake Job Offer', description: 'Non-existent job, cloned company website' },
  { value: 'phishing', label: 'Phishing', description: 'Stealing personal information, credentials' },
  { value: 'misleading', label: 'Misleading Information', description: 'False salary, unrealistic promises' },
  { value: 'other', label: 'Other', description: 'Other suspicious activity' }
];

export default function ScamCheckerPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Entity[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [entityReports, setEntityReports] = useState<Report[]>([]);
  const [showReportForm, setShowReportForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    company_name: '',
    entity_type: 'company',
    website: '',
    emails: '',
    phone_numbers: '',
    report_type: '',
    description: '',
    evidence_url: '',
    user_email: ''
  });

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      // Direct Supabase query - no function needed
      const { data, error } = await supabase
        .from('reported_entities')
        .select('*')
        .ilike('company_name', `%${query}%`)
        .order('report_count', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Filter results - only return published or confirmed/under_review entities
      const results = data?.filter(entity => 
        entity.is_published || ['confirmed', 'under_review'].includes(entity.verification_status)
      ) || [];
      
      setSearchResults(results);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Failed to search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      handleSearch(value);
    }, 500);
  };

  const selectEntity = async (entity: Entity) => {
    setSelectedEntity(entity);
    setSearchQuery(entity.company_name);
    setSearchResults([]);
    
    // Fetch reports for this entity directly from Supabase
    try {
      const { data, error } = await supabase
        .from('scam_reports')
        .select('*')
        .eq('entity_id', entity.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setEntityReports(data);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const emailsArray = formData.emails.split(',').map(e => e.trim()).filter(Boolean);
      const phonesArray = formData.phone_numbers.split(',').map(p => p.trim()).filter(Boolean);

      // Check if entity already exists
      const { data: existingEntity } = await supabase
        .from('reported_entities')
        .select('id, report_count')
        .ilike('company_name', formData.company_name)
        .single();

      let entityId: string;

      if (existingEntity) {
        // Update existing entity
        const { data: updatedEntity, error: updateError } = await supabase
          .from('reported_entities')
          .update({ 
            report_count: existingEntity.report_count + 1,
            verification_status: 'under_review'
          })
          .eq('id', existingEntity.id)
          .select('id')
          .single();

        if (updateError) throw updateError;
        entityId = updatedEntity.id;
      } else {
        // Create new entity
        const { data: newEntity, error: insertError } = await supabase
          .from('reported_entities')
          .insert({
            entity_type: formData.entity_type,
            company_name: formData.company_name,
            aliases: [],
            website: formData.website || null,
            emails: emailsArray,
            phone_numbers: phonesArray,
            address: null,
            report_count: 1,
            verification_status: 'under_review',
            is_published: false
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        entityId = newEntity.id;
      }

      // Create the report
      const { error: reportError } = await supabase
        .from('scam_reports')
        .insert({
          entity_id: entityId,
          report_type: formData.report_type,
          description: formData.description,
          evidence_url: formData.evidence_url || null,
          user_email: formData.user_email || null,
          status: 'pending'
        });

      if (reportError) throw reportError;

      setSubmitSuccess(true);
      setFormData({
        company_name: '',
        entity_type: 'company',
        website: '',
        emails: '',
        phone_numbers: '',
        report_type: '',
        description: '',
        evidence_url: '',
        user_email: ''
      });
      
      // Refresh search if we have a search query
      if (searchQuery) {
        handleSearch(searchQuery);
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Confirmed Scam' };
      case 'under_review':
        return { color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle, label: 'Under Review' };
      case 'cleared':
        return { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Cleared' };
      default:
        return { color: 'bg-gray-100 text-gray-700', icon: Info, label: 'Reported' };
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.muted }}>
      {/* Header */}
      <div
        className="pt-12 pb-8 px-6"
        style={{ backgroundColor: theme.colors.primary.DEFAULT }}
      >
        <div className="max-w-4xl mx-auto">
          <a href="/tools" className="text-sm text-white/80 hover:text-white transition-colors self-start inline-block mb-2">
            ← Back to Tools
          </a>
          <h1 className="text-2xl font-bold" style={{ color: theme.colors.text.light }}>
            Job & Company Scam Checker
          </h1>
          <p className="text-sm mt-1" style={{ color: theme.colors.text.light }}>
            Search reported scams or report a suspicious job posting
          </p>
        </div>
      </div>

      <div className="px-6 py-6 max-w-4xl mx-auto">
        {/* Warning Banner */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-red-800">
            <p className="font-medium mb-1">Protect Yourself from Job Scams</p>
            <p className="text-red-700">
              Never pay money for job opportunities. Legitimate employers never ask for payment 
              for interviews, training, or equipment. Research companies before applying.
            </p>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Search size={20} className="text-blue-600" />
            Check a Company or Recruiter
          </h2>
          
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Enter company name, recruiter name, or website..."
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="animate-spin text-gray-400" size={20} />
              </div>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="mt-2 border rounded-xl overflow-hidden">
              {searchResults.map((result) => {
                const status = getStatusBadge(result.verification_status);
                const StatusIcon = status.icon;
                
                return (
                  <button
                    key={result.id}
                    onClick={() => selectEntity(result)}
                    className="w-full p-4 text-left hover:bg-gray-50 border-b last:border-b-0 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{result.company_name}</p>
                      <p className="text-sm text-gray-500 capitalize">{result.entity_type} • {result.report_count} report{result.report_count > 1 ? 's' : ''}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
                      <StatusIcon size={12} />
                      {status.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
            <p className="mt-2 text-sm text-gray-500">No results found. Be the first to report this company!</p>
          )}
        </div>

        {/* Selected Entity Details */}
        {selectedEntity && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedEntity.company_name}</h2>
                <p className="text-sm text-gray-500 capitalize">{selectedEntity.entity_type}</p>
              </div>
              {(() => {
                const status = getStatusBadge(selectedEntity.verification_status);
                const StatusIcon = status.icon;
                return (
                  <span className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 ${status.color}`}>
                    <StatusIcon size={16} />
                    {status.label}
                  </span>
                );
              })()}
            </div>

            {selectedEntity.website && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                <Globe size={16} />
                <a href={selectedEntity.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {selectedEntity.website}
                </a>
              </div>
            )}

            <div className="bg-red-50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 text-red-700 font-medium mb-1">
                <AlertTriangle size={18} />
                {selectedEntity.report_count} Report{selectedEntity.report_count > 1 ? 's' : ''}
              </div>
              <p className="text-sm text-red-600">
                This entity has been reported by job seekers. Proceed with caution.
              </p>
            </div>

            {/* Reported Issues */}
            {entityReports.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Reported Issues</h3>
                <div className="space-y-3">
                  {entityReports.map((report) => (
                    <div key={report.id} className="border rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Flag size={14} className="text-red-500" />
                        <span className="text-sm font-medium text-gray-700">
                          {REPORT_TYPES.find(t => t.value === report.report_type)?.label || report.report_type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{report.description}</p>
                      {report.evidence_url && (
                        <a 
                          href={report.evidence_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-2"
                        >
                          View Evidence <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => {
                setFormData({ ...formData, company_name: selectedEntity.company_name, website: selectedEntity.website || '' });
                setShowReportForm(true);
              }}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <Flag size={16} />
              Report Additional Issue
            </button>
          </div>
        )}

        {/* Report Form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Flag size={20} className="text-red-600" />
              Report a Scam
            </h2>
            {!showReportForm && (
              <button
                onClick={() => setShowReportForm(true)}
                className="text-sm text-blue-600 hover:underline"
              >
                Report now
              </button>
            )}
          </div>

          {submitSuccess ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <CheckCircle className="mx-auto text-green-600 mb-3" size={40} />
              <h3 className="text-lg font-medium text-green-800 mb-2">Report Submitted!</h3>
              <p className="text-sm text-green-700 mb-4">
                Thank you for helping protect job seekers. Our team will review your report.
              </p>
              <button
                onClick={() => {
                  setSubmitSuccess(false);
                  setShowReportForm(false);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Submit Another Report
              </button>
            </div>
          ) : showReportForm && (
            <form onSubmit={handleSubmitReport} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company/Recruiter Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Name as it appears"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
                  <select
                    value={formData.entity_type}
                    onChange={(e) => setFormData({ ...formData, entity_type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="company">Company</option>
                    <option value="recruiter">Recruiter</option>
                    <option value="agency">Agency</option>
                    <option value="individual">Individual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email(s)</label>
                  <input
                    type="text"
                    value={formData.emails}
                    onChange={(e) => setFormData({ ...formData, emails: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="email1@example.com, email2@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number(s)</label>
                <input
                  type="text"
                  value={formData.phone_numbers}
                  onChange={(e) => setFormData({ ...formData, phone_numbers: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+2348012345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type of Scam <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.report_type}
                  onChange={(e) => setFormData({ ...formData, report_type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select type of scam</option>
                  {REPORT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label} - {type.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe what happened in detail. Include any relevant conversation, emails, or events..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Evidence URL</label>
                <input
                  type="url"
                  value={formData.evidence_url}
                  onChange={(e) => setFormData({ ...formData, evidence_url: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Link to screenshot, email, or any evidence"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Email (optional)</label>
                <input
                  type="email"
                  value={formData.user_email}
                  onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="For follow-up on your report"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                <strong>Note:</strong> User-reported. Not independently verified. This database 
                contains reports from job seekers and has not been verified by our team.
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-6 bg-red-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Submitting Report...
                  </>
                ) : (
                  <>
                    <Flag size={20} />
                    Submit Report
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* SEO Content - Improved */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Stay Safe from Job Scams</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Our community-driven database helps protect job seekers from fraudulent employers and recruiters in Nigeria.</p>
          </div>

          {/* Warning Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-5 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center mb-3">
                <AlertTriangle className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Report Scams</h3>
              <p className="text-sm text-gray-700">Help the community by reporting suspicious companies and recruiters.</p>
            </div>
            <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-3">
                <Shield className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Verify Companies</h3>
              <p className="text-sm text-gray-700">Search our database before applying to verify company legitimacy.</p>
            </div>
            <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-3">
                <CheckCircle className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Community Safety</h3>
              <p className="text-sm text-gray-700">Together we create a safer job market for everyone in Nigeria.</p>
            </div>
          </div>

          {/* Main SEO Content */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center text-white text-sm">1</span>
                How Our Scam Database Works
              </h3>
              <div className="text-gray-700 space-y-3">
                <p>We maintain a community-driven database of reported scam entities. When you search for a company or recruiter, you'll see their verification status, number of reports, and detailed information about reported scams.</p>
                <p>Our moderation team reviews all submissions before publishing. Entities can have different statuses: "Reported," "Under Review," "Confirmed Scam," or "Cleared." This ensures accuracy while protecting job seekers.</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white text-sm">2</span>
                Common Job Scams in Nigeria
              </h3>
              <div className="text-gray-700 space-y-3">
                <p>Understanding common scam types helps you recognize and avoid them:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div className="bg-red-50 rounded-lg p-3">
                    <h4 className="font-semibold text-red-900">Upfront Payment</h4>
                    <p className="text-sm text-red-800">Requesting money for visa, training, or equipment</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <h4 className="font-semibold text-red-900">Fake Job Offers</h4>
                    <p className="text-sm text-red-800">Non-existent positions with cloned company websites</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <h4 className="font-semibold text-red-900">Interview Scams</h4>
                    <p className="text-sm text-red-800">Fake interviews requesting personal info or money</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <h4 className="font-semibold text-red-900">Phishing</h4>
                    <p className="text-sm text-red-800">Emails stealing credentials and personal data</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center text-white text-sm">3</span>
                Warning Signs to Watch
              </h3>
              <div className="text-gray-700 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {['Requests for payment', 'Poor grammar/spelling', 'Unrealistic salaries', 'No company address', 'Urgency tactics', 'Personal docs before interview'].map(sign => (
                    <div key={sign} className="flex items-center gap-2">
                      <XCircle className="text-red-500 flex-shrink-0" size={16} />
                      <span className="text-sm">{sign}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4">Protect Yourself and Others</h3>
              <p className="text-white/90 mb-4">Report suspicious companies to help protect fellow job seekers. Together we can create a safer job market in Nigeria.</p>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Free Database</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Community Driven</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Nigeria Focused</span>
              </div>
            </div>
          </div>

          {/* JSON-LD Schema */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebApplication",
                "name": "Job Scam Checker",
                "description": "Search and report job scams. Database of fraudulent companies and recruiters in Nigeria.",
                "url": "https://jobmeter.com/tools/scam-checker",
                "applicationCategory": "Career",
                "offers": { "@type": "Offer", "price": "0", "priceCurrency": "NGN" }
              })
            }}
          />
        </div>
      </div>
    </div>
  );
}
