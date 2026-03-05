"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, Shield, AlertTriangle, CheckCircle, XCircle, Flag, Loader2, Info, ExternalLink, Phone, Mail, Globe, FileText, Briefcase, Star } from 'lucide-react';
import { theme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

interface Entity {
  id: string;
  entity_type: string;
  company_name: string;
  aliases: string[];
  address: string | null;
  phone_numbers: string[];
  emails: string[];
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

const RELATED_TOOLS = [
  {
    icon: FileText,
    title: 'CV / Resume Checker',
    description: 'Scan your CV for issues and ATS compatibility',
    href: '/tools/cv-checker',
    color: 'blue'
  },
  {
    icon: Briefcase,
    title: 'Salary Checker',
    description: 'Find out what your role should pay in Nigeria',
    href: '/tools/salary-checker',
    color: 'green'
  },
  {
    icon: Star,
    title: 'Company Reviews',
    description: 'Read real employee reviews before you apply',
    href: '/tools/company-reviews',
    color: 'yellow'
  }
];

export default function ScamCheckerPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Entity[]>([]);
  const [allEntities, setAllEntities] = useState<Entity[]>([]);
  const [tableSearch, setTableSearch] = useState('');
  const [tablePage, setTablePage] = useState(1);
  const TABLE_PAGE_SIZE = 100;
  const [isSearching, setIsSearching] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [entityReports, setEntityReports] = useState<Report[]>([]);
  const [showReportForm, setShowReportForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    const fetchAllEntities = async () => {
      const pageSize = 1000;
      let allData: Entity[] = [];
      let from = 0;
      while (true) {
        const { data, error } = await supabase
          .from('reported_entities')
          .select('*')
          .eq('is_published', true)
          .order('report_count', { ascending: false })
          .range(from, from + pageSize - 1);
        if (error || !data || data.length === 0) break;
        allData = [...allData, ...data];
        if (data.length < pageSize) break;
        from += pageSize;
      }
      setAllEntities(allData);
    };
    fetchAllEntities();
  }, []);

  const handleSearch = async (query: string) => {
    if (query.length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('reported_entities')
        .select('*')
        .ilike('company_name', `%${query}%`)
        .order('report_count', { ascending: false })
        .limit(20);
      if (error) throw error;
      const results = data?.filter(entity =>
        entity.is_published || ['confirmed', 'under_review'].includes(entity.verification_status)
      ) || [];
      setSearchResults(results);
    } catch (err: any) {
      setError(err.message || 'Failed to search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => handleSearch(value), 500);
  };

  const selectEntity = async (entity: Entity) => {
    setSelectedEntity(entity);
    setSearchQuery(entity.company_name);
    setSearchResults([]);
    try {
      const { data, error } = await supabase
        .from('scam_reports')
        .select('*')
        .eq('entity_id', entity.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(10);
      if (!error && data) setEntityReports(data);
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
      const { data: existingEntity } = await supabase
        .from('reported_entities')
        .select('id, report_count')
        .ilike('company_name', formData.company_name)
        .single();

      let entityId: string;
      if (existingEntity) {
        const { data: updatedEntity, error: updateError } = await supabase
          .from('reported_entities')
          .update({ report_count: existingEntity.report_count + 1, verification_status: 'under_review' })
          .eq('id', existingEntity.id)
          .select('id')
          .single();
        if (updateError) throw updateError;
        entityId = updatedEntity.id;
      } else {
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
      setFormData({ company_name: '', entity_type: 'company', website: '', emails: '', phone_numbers: '', report_type: '', description: '', evidence_url: '', user_email: '' });
      if (searchQuery) handleSearch(searchQuery);
    } catch (err: any) {
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Confirmed Scam' };
      case 'under_review': return { color: 'bg-yellow-100 text-yellow-700', icon: AlertTriangle, label: 'Under Review' };
      case 'cleared': return { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Cleared' };
      default: return { color: 'bg-gray-100 text-gray-700', icon: Info, label: 'Reported' };
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.muted }}>
      {/* Header */}
      <div className="pt-12 pb-8 px-6" style={{ backgroundColor: theme.colors.primary.DEFAULT }}>
        <div className="max-w-4xl mx-auto">
          <a href="/tools" className="text-sm text-white/80 hover:text-white transition-colors self-start inline-block mb-2">
            ← Back to Tools
          </a>
          <h1 className="text-2xl font-bold" style={{ color: theme.colors.text.light }}>
            Job Scammer Checker
          </h1>
          <p className="text-sm mt-1" style={{ color: theme.colors.text.light }}>
            Free scam jobs check tool — search reported scams or report a suspicious job posting
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: 1, text: 'Search for a company or recruiter name' },
              { step: 2, text: 'View reported scams and warnings' },
              { step: 3, text: 'Check verification status' },
              { step: 4, text: 'Report suspicious companies to warn others' }
            ].map(({ step, text }) => (
              <div key={step} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-sm flex-shrink-0">{step}</div>
                <p className="text-sm text-gray-600">{text}</p>
              </div>
            ))}
          </div>
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
          {searchResults.length > 0 && (
            <div className="mt-2 border rounded-xl overflow-hidden">
              {searchResults.map((result) => {
                const status = getStatusBadge(result.verification_status);
                const StatusIcon = status.icon;
                return (
                  <button key={result.id} onClick={() => selectEntity(result)}
                    className="w-full p-4 text-left hover:bg-gray-50 border-b last:border-b-0 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{result.company_name}</p>
                      <p className="text-sm text-gray-500 capitalize">{result.entity_type} • {result.report_count} report{result.report_count > 1 ? 's' : ''}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
                      <StatusIcon size={12} />{status.label}
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

        {/* Full Scammer List Table */}
        {allEntities.length > 0 && (() => {
          const q = tableSearch.trim().toLowerCase();
          const filtered = q
            ? allEntities.filter(e =>
                (e.company_name || '').toLowerCase().includes(q) ||
                (e.address || '').toLowerCase().includes(q) ||
                (e.entity_type || '').toLowerCase().includes(q) ||
                (e.website || '').toLowerCase().includes(q) ||
                (Array.isArray(e.emails) ? e.emails : []).some(em => em.toLowerCase().includes(q)) ||
                (Array.isArray(e.phone_numbers) ? e.phone_numbers : []).some(p => p.toLowerCase().includes(q))
              )
            : allEntities;
          const totalPages = Math.max(1, Math.ceil(filtered.length / TABLE_PAGE_SIZE));
          const safePage = Math.min(tablePage, totalPages);
          const pageEntities = filtered.slice((safePage - 1) * TABLE_PAGE_SIZE, safePage * TABLE_PAGE_SIZE);

          return (
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-6" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Shield size={20} className="text-red-600" />
                  Job Scammer List ({filtered.length}{q ? ` of ${allEntities.length}` : ''} reported)
                </h2>
                <div className="relative w-full sm:w-64">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={e => { setTableSearch(e.target.value); setTablePage(1); }}
                    placeholder="Filter list..."
                    className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-3 px-3 font-medium text-gray-600 whitespace-nowrap">Company / Recruiter</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-600 whitespace-nowrap">Type</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-600 whitespace-nowrap">Address</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-600 whitespace-nowrap">Phone(s)</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-600 whitespace-nowrap">Email(s)</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-600 whitespace-nowrap">Website</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-600 whitespace-nowrap">Reports</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-600 whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageEntities.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-gray-400 text-sm">No results match your filter.</td>
                      </tr>
                    ) : pageEntities.map((entity) => {
                      const status = getStatusBadge(entity.verification_status);
                      const StatusIcon = status.icon;
                      const phones = Array.isArray(entity.phone_numbers) ? entity.phone_numbers : [];
                      const emails = Array.isArray(entity.emails) ? entity.emails : [];
                      return (
                        <tr key={entity.id} className="border-b hover:bg-gray-50 cursor-pointer align-top" onClick={() => setSelectedEntity(entity)}>
                          <td className="py-3 px-3 font-medium text-gray-900 whitespace-nowrap">{entity.company_name || '—'}</td>
                          <td className="py-3 px-3 text-gray-600 capitalize whitespace-nowrap">{entity.entity_type}</td>
                          <td className="py-3 px-3 text-gray-600 max-w-[200px]">
                            {entity.address ? (
                              <span className="text-xs leading-snug">{entity.address}</span>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="py-3 px-3 text-gray-600">
                            {phones.length > 0 ? (
                              <div className="flex flex-col gap-0.5">
                                {phones.map((p, i) => (
                                  <a key={i} href={`tel:${p}`} onClick={e => e.stopPropagation()}
                                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 whitespace-nowrap">
                                    <Phone size={10} />{p}
                                  </a>
                                ))}
                              </div>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="py-3 px-3 text-gray-600">
                            {emails.length > 0 ? (
                              <div className="flex flex-col gap-0.5">
                                {emails.map((em, i) => (
                                  <a key={i} href={`mailto:${em}`} onClick={e => e.stopPropagation()}
                                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 whitespace-nowrap">
                                    <Mail size={10} />{em}
                                  </a>
                                ))}
                              </div>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="py-3 px-3 text-gray-600">
                            {entity.website ? (
                              <a href={entity.website} target="_blank" rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1 whitespace-nowrap">
                                <Globe size={10} />
                                {entity.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                              </a>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="py-3 px-3 text-gray-700 font-medium text-center whitespace-nowrap">{entity.report_count}</td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${status.color}`}>
                              <StatusIcon size={11} />{status.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Showing {(safePage - 1) * TABLE_PAGE_SIZE + 1}–{Math.min(safePage * TABLE_PAGE_SIZE, filtered.length)} of {filtered.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setTablePage(p => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >← Prev</button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let page: number;
                      if (totalPages <= 7) {
                        page = i + 1;
                      } else if (safePage <= 4) {
                        page = i + 1;
                      } else if (safePage >= totalPages - 3) {
                        page = totalPages - 6 + i;
                      } else {
                        page = safePage - 3 + i;
                      }
                      return (
                        <button key={page}
                          onClick={() => setTablePage(page)}
                          className={`w-9 h-9 text-sm rounded-lg border transition-colors ${safePage === page ? 'bg-red-600 text-white border-red-600' : 'hover:bg-gray-50'}`}
                        >{page}</button>
                      );
                    })}
                    <button
                      onClick={() => setTablePage(p => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages}
                      className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                    >Next →</button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

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
                    <StatusIcon size={16} />{status.label}
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
              <p className="text-sm text-red-600">This entity has been reported by job seekers. Proceed with caution.</p>
            </div>
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
                        <a href={report.evidence_url} target="_blank" rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-2">
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
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
              <Flag size={16} />Report Additional Issue
            </button>
          </div>
        )}

        {/* Report Form */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Flag size={20} className="text-red-600" />
              Report a Job Scam
            </h2>
            {!showReportForm && (
              <button onClick={() => setShowReportForm(true)} className="text-sm text-blue-600 hover:underline">
                Report now
              </button>
            )}
          </div>

          {submitSuccess ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <CheckCircle className="mx-auto text-green-600 mb-3" size={40} />
              <h3 className="text-lg font-medium text-green-800 mb-2">Report Submitted!</h3>
              <p className="text-sm text-green-700 mb-4">Thank you for helping protect job seekers. Our team will review your report.</p>
              <button onClick={() => { setSubmitSuccess(false); setShowReportForm(false); }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Submit Another Report
              </button>
            </div>
          ) : showReportForm && (
            <form onSubmit={handleSubmitReport} className="space-y-4">
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company/Recruiter Name <span className="text-red-500">*</span></label>
                  <input type="text" required value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Name as it appears" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
                  <select value={formData.entity_type} onChange={(e) => setFormData({ ...formData, entity_type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
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
                  <input type="url" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email(s)</label>
                  <input type="text" value={formData.emails} onChange={(e) => setFormData({ ...formData, emails: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="email1@example.com, email2@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number(s)</label>
                <input type="text" value={formData.phone_numbers} onChange={(e) => setFormData({ ...formData, phone_numbers: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+2348012345678" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type of Scam <span className="text-red-500">*</span></label>
                <select required value={formData.report_type} onChange={(e) => setFormData({ ...formData, report_type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select type of scam</option>
                  {REPORT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label} - {type.description}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                <textarea required rows={4} value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe what happened in detail. Include any relevant conversation, emails, or events..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Evidence URL</label>
                <input type="url" value={formData.evidence_url} onChange={(e) => setFormData({ ...formData, evidence_url: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Link to screenshot, email, or any evidence" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Email (optional)</label>
                <input type="email" value={formData.user_email} onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="For follow-up on your report" />
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                <strong>Note:</strong> User-reported. Not independently verified. This database contains reports from job seekers and has not been verified by our team.
              </div>
              <button type="submit" disabled={isSubmitting}
                className="w-full py-3 px-6 bg-red-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-red-700 disabled:opacity-50">
                {isSubmitting ? (<><Loader2 className="animate-spin" size={20} />Submitting Report...</>) : (<><Flag size={20} />Submit Report</>)}
              </button>
            </form>
          )}
        </div>

        {/* Related Tools */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Related Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {RELATED_TOOLS.map((tool) => {
              const Icon = tool.icon;
              const colorMap: Record<string, string> = {
                blue: 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100',
                green: 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100',
                yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600 hover:bg-yellow-100'
              };
              const iconBg: Record<string, string> = {
                blue: 'bg-blue-100 text-blue-600',
                green: 'bg-green-100 text-green-600',
                yellow: 'bg-yellow-100 text-yellow-600'
              };
              return (
                <a key={tool.href} href={tool.href}
                  className={`flex flex-col gap-3 p-4 rounded-xl border transition-colors ${colorMap[tool.color]}`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg[tool.color]}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{tool.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{tool.description}</p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        {/* Article / SEO Content */}
        <div className="mt-10 space-y-8">

          {/* Intro */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-3">What is a Job Scammer Checker?</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              A <strong>job scammer checker</strong> is a free online tool that helps you quickly determine whether a job, recruiter, or WhatsApp offer is a scam — before you share personal data, pay any money, or waste time on fake interviews. Our <strong>scam jobs check</strong> tool scans job texts, emails, WhatsApp messages, and links against known red flags, scammer patterns, and public scam reports so you can decide confidently whether a job is legit.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Job scams are rising globally. Scammers increasingly use AI, social media, and messaging apps to target job seekers in Nigeria, Canada, Australia, UAE (Dubai), and Malaysia. Fake jobs can cost you money, personal data, and even expose you to identity theft or criminal activity. A <strong>scam jobs check app</strong> acts as a second pair of eyes, helping you see patterns that are easy to miss when you are under pressure to find a job.
            </p>
          </div>

          {/* How it works detail */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">How to Identify Fake Job Offers</h2>
            <p className="text-gray-700 mb-4">Our tool uses a combination of AI pattern recognition, rule-based checks, and public records to analyze job-related content. It focuses on language signals, technical details, and behavioral patterns that are hard for scammers to fake consistently. Here is what a <strong>scam jobs check online</strong> looks for:</p>
            <div className="space-y-4">
              <div className="border-l-4 border-red-400 pl-4">
                <h3 className="font-semibold text-gray-900 mb-1">Language Red Flags</h3>
                <p className="text-sm text-gray-700">Too-good-to-be-true promises, guaranteed jobs, unrealistic salaries, vague job descriptions full of buzzwords, and poor grammar or spelling errors are all common in scam postings. A <strong>free fake job text message</strong> often follows a recognizable template that our tool can detect.</p>
              </div>
              <div className="border-l-4 border-orange-400 pl-4">
                <h3 className="font-semibold text-gray-900 mb-1">Money and Payment Requests</h3>
                <p className="text-sm text-gray-700">Any demand for fees — registration, processing, training, visa, or equipment payments — is a major red flag. Requests to use crypto, gift cards, or payment apps as a condition of hiring are classic signs of a scam. If you receive a <strong>Job scam WhatsApp</strong> message asking for payment, do not proceed.</p>
              </div>
              <div className="border-l-4 border-yellow-400 pl-4">
                <h3 className="font-semibold text-gray-900 mb-1">Company Legitimacy Checks</h3>
                <p className="text-sm text-gray-700">Does the company have an official website? Does the job appear on a trusted site like LinkedIn or Glassdoor? Is the domain very new, suspiciously similar to a real brand, or using free email providers (Gmail, Yahoo) instead of a corporate address? These checks are central to spotting <strong>fake job websites</strong>.</p>
              </div>
              <div className="border-l-4 border-blue-400 pl-4">
                <h3 className="font-semibold text-gray-900 mb-1">Contact and Identity Verification</h3>
                <p className="text-sm text-gray-700">We check whether the recruiter email, phone, or WhatsApp number appears in public scam complaints. Communication restricted entirely to WhatsApp or Telegram — with no professional channels — is a significant warning sign. This is especially important for <strong>scam jobs check in Nigeria</strong>, where WhatsApp-only scams are common.</p>
              </div>
            </div>
          </div>

          {/* Types of scams */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Types of Job Scams We Help Detect</h2>

            <div className="space-y-5">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">1. Fake Online Jobs List Scams</h3>
                <p className="text-sm text-gray-700">These scams offer remote data entry, typing jobs, survey work, or "secret shopper" roles that either never pay or charge upfront fees. They often appear on a <strong>fake online jobs list</strong> promising quick approval and very high hourly rates with minimal experience required.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">2. WhatsApp and SMS Job Scams</h3>
                <p className="text-sm text-gray-700">Scammers send unsolicited <strong>WhatsApp job offers</strong> claiming they found your contact from LinkedIn or job boards. They ask you to join a group where "admins" guide you into tasks involving money transfers, pay for onboarding materials, or click phishing links. <strong>Is a WhatsApp job offer a scam?</strong> Not always, but these red flags make it very likely.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">3. Impersonation of Real Companies</h3>
                <p className="text-sm text-gray-700">Some fake offers copy the name and logo of real companies but use lookalike domains or free email addresses, setting up <strong>fake job websites</strong> that mimic legitimate career pages. Always verify that the domain exactly matches the official company site and that the job appears on the real careers page.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">4. Check Scams and Overpayment Schemes</h3>
                <p className="text-sm text-gray-700">Scammers send a fake check, ask you to buy equipment, then ask you to send back part of the money. When the check bounces, your own money is gone. Common phrases include: "We will send you a check to purchase your laptop" or "Keep part of the money as commission and send the rest."</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">5. Visa and Relocation Scams</h3>
                <p className="text-sm text-gray-700">International job offers requiring upfront visa, processing, or travel payments are a major red flag. This is especially prevalent in searches for a <strong>job scammer list Dubai</strong> and <strong>job scammer list Malaysia</strong>, where overseas work scams and domestic staff role scams are widespread.</p>
              </div>
            </div>
          </div>

          {/* Country-specific */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Country & Region–Specific Job Scammer Lists</h2>
            <p className="text-gray-700 mb-4">Our tool can be combined with local <strong>job scammer list</strong> resources for stronger protection. While not every country publishes a public <strong>job scammer list PDF</strong>, there are official warnings and scam alerts available by region.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">🇳🇬 Scam Jobs Check in Nigeria</h3>
                <p className="text-sm text-gray-700">Fake jobs in Nigeria are often sent via SMS and WhatsApp, asking applicants to pay registration fees or attend briefings at suspicious locations. Red flags include no credible online presence, Gmail/Yahoo sender addresses, and requests for payment before or after interviews.</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">🇨🇦 Job Scammer List Canada</h3>
                <p className="text-sm text-gray-700">Canadian job seekers can cross-check offers against federal agency guidance. While a single unified <strong>job scammer list Canada</strong> is rare, authorities publish alerts on work-from-home scams, fake government jobs, and CRA impersonation schemes.</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">🇦🇺 Job Scammer List Australia</h3>
                <p className="text-sm text-gray-700">Australian regulators warn about employment scams involving visa sponsorship, migration agents, and fake recruitment agencies. Use our tool alongside ACCC Scamwatch alerts. Searching for a <strong>job scammer list Australia PDF</strong> can surface periodic government reports you can cross-reference.</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">🇲🇾 Job Scammer List Malaysia (WhatsApp)</h3>
                <p className="text-sm text-gray-700">In Malaysia, scammers coordinate through WhatsApp and Telegram, leading to searches like <strong>"job scammer list Malaysia WhatsApp"</strong>. Scams focus on overseas work, fee-based placement, and visa processing fraud. Always verify whether the agency is licensed in the destination country.</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">🇦🇪 Job Scammer List Dubai</h3>
                <p className="text-sm text-gray-700">Dubai scams often target domestic staff and overseas workers with upfront visa and processing fees handled through unofficial "agents." Verify any recruiter against official UAE labour ministry records before paying anything.</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">🌐 Job Scammer List Remote</h3>
                <p className="text-sm text-gray-700">Remote scams show unclear company details, fully anonymous employers, communication only through messaging apps, and unrealistic pay for basic tasks. A <strong>job scammer list remote</strong> check is increasingly essential as remote work grows globally.</p>
              </div>
            </div>
          </div>

          {/* Step-by-step guide */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">How to Check if a Job is Legit (Step-by-Step)</h2>
            <div className="space-y-4">
              {[
                { step: 1, title: 'Run a scam jobs check online', desc: 'Paste the full job text, email, or WhatsApp message into our checker and review the risk score and red flags.' },
                { step: 2, title: 'Research the company independently', desc: 'Search the company name with "scam" or "fraud". Verify the job is listed on their official website, LinkedIn, or Glassdoor with real employees and reviews.' },
                { step: 3, title: 'Verify contact details', desc: 'Compare email domains and phone numbers against those on the official company site. Be suspicious if the recruiter insists on WhatsApp or personal email only.' },
                { step: 4, title: 'Look for common scam signs', desc: 'Watch for requests for upfront payment or sharing ID/bank details early, immediate job offers without formal interviews, vague roles, and pressure to act quickly.' },
                { step: 5, title: 'How to spot fake job postings on Indeed', desc: 'Fake postings on large platforms use very short descriptions, unusually high salaries, and try to move you off-platform to WhatsApp or Telegram quickly. Copy the job text and run a scam check here.' },
                { step: 6, title: 'When in doubt, walk away', desc: 'Real employers will never punish you for wanting to verify an offer. If multiple red flags appear, do not continue — and report it to protect others.' }
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-4">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-sm flex-shrink-0 mt-0.5">{step}</div>
                  <div>
                    <p className="font-semibold text-gray-900">{title}</p>
                    <p className="text-sm text-gray-700 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Frequently Asked Questions</h2>
            <div className="space-y-5 divide-y divide-gray-100">
              {[
                {
                  q: 'How can I check if a job is legit?',
                  a: 'Search the company name in our database, then research on their official website and LinkedIn to ensure the job is listed there and contact details match. Run a scam jobs check online to flag any patterns.'
                },
                {
                  q: 'How to check fake jobs?',
                  a: 'Look for requests for money, vague roles, no online presence, or pressure to respond quickly. Run a free scam jobs check here before you reply or send any documents.'
                },
                {
                  q: 'How do I verify a scammer?',
                  a: 'Search their email, phone, or WhatsApp number along with words like "scam", "fraud", or "complaint". Paste their messages into our job scammer checker to see if the patterns match known scams.'
                },
                {
                  q: 'Is a WhatsApp job offer a scam?',
                  a: 'Not every WhatsApp job offer is fake, but unsolicited offers, group "tasks" that involve payments, and requests for fees or banking details are major red flags that should be checked immediately.'
                },
                {
                  q: 'How do you verify if a job offer is real?',
                  a: 'Confirm that the offer comes from an official company domain, that the role exists on the company\'s career page, and that the interview process matches the company\'s standard procedure.'
                },
                {
                  q: 'How do you know if a job is scamming you?',
                  a: 'If the job suddenly introduces payment requests, asks you to handle money or crypto for others, or keeps changing conditions after you "accept" the role, it is very likely a scam. Stop and report it.'
                },
                {
                  q: 'How to catch a job scammer?',
                  a: 'Save all messages, take screenshots of key requests (especially for money or sensitive data), and submit them to our database and to your national cybercrime unit so the scammer\'s accounts can be investigated and blocked.'
                },
                {
                  q: 'How to report a job scammer?',
                  a: 'Report the posting on the job platform (Indeed, LinkedIn, local job board), report to your national consumer protection or fraud agency, and submit the details using the form above so other job seekers are warned.'
                }
              ].map(({ q, a }) => (
                <div key={q} className="pt-4 first:pt-0">
                  <p className="font-semibold text-gray-900 mb-1">{q}</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
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
            "name": "Job Scammer Checker",
            "description": "Free scam jobs check tool. Search and report fraudulent companies, recruiters and job postings. Covers Nigeria, Canada, Australia, Dubai, Malaysia and remote jobs.",
            "url": "https://jobmeter.com/tools/scam-checker",
            "applicationCategory": "Career",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "NGN" },
            "mainEntity": {
              "@type": "FAQPage",
              "mainEntity": [
                { "@type": "Question", "name": "How can I check if a job is legit?", "acceptedAnswer": { "@type": "Answer", "text": "Search the company in our database, verify on their official website and LinkedIn, then run a scam jobs check online to flag red flag patterns." } },
                { "@type": "Question", "name": "Is a WhatsApp job offer a scam?", "acceptedAnswer": { "@type": "Answer", "text": "Unsolicited offers, group tasks involving payments, and requests for fees or banking details are major red flags. Always check before responding." } },
                { "@type": "Question", "name": "How to report a job scammer?", "acceptedAnswer": { "@type": "Answer", "text": "Report on the job platform, to your national fraud agency, and submit details using the form on this page to warn other job seekers." } }
              ]
            }
          })
        }}
      />
    </div>
  );
}