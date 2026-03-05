"use client";

import React, { useState, useMemo } from 'react';
import { Search, X, ChevronDown, Sparkles, Briefcase, Award, TrendingUp, ArrowRight, Loader2 } from 'lucide-react';
import { theme } from '@/lib/theme';
import { SKILLS_CATEGORIES, POPULAR_TOOLS, ALL_SKILLS } from '@/lib/constants/skills';
import { supabase } from '@/lib/supabase';

interface Role {
  role: string;
  seniority: string;
  description: string;
  requiredSkills: string[];
  skillGaps: string[];
  certifications: string[];
  salaryRange: string;
  matchScore: number;
}

interface RoleFinderResult {
  roles: Role[];
  summary: string;
  totalSkillsMatched: number;
}

const EXPERIENCE_LEVELS = [
  { value: 0, label: 'Less than 1 year' },
  { value: 1, label: '1 year' },
  { value: 2, label: '2 years' },
  { value: 3, label: '3 years' },
  { value: 4, label: '4 years' },
  { value: 5, label: '5 years' },
  { value: 6, label: '6 years' },
  { value: 7, label: '7 years' },
  { value: 8, label: '8 years' },
  { value: 9, label: '9 years' },
  { value: 10, label: '10+ years' },
];

export default function RoleFinderPage() {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [customTool, setCustomTool] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<RoleFinderResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showToolDropdown, setShowToolDropdown] = useState(false);

  const displayedCategories = useMemo(() => {
    const categories = Object.entries(SKILLS_CATEGORIES);
    if (showAllCategories) return categories;
    return categories.slice(0, 6);
  }, [showAllCategories]);

  const filteredTools = useMemo(() => {
    if (!customTool) return POPULAR_TOOLS.filter(t => !selectedTools.includes(t));
    return POPULAR_TOOLS.filter(t => 
      t.toLowerCase().includes(customTool.toLowerCase()) && !selectedTools.includes(t)
    );
  }, [customTool, selectedTools]);

  const addSkill = (skill: string) => {
    if (!selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const removeSkill = (skill: string) => {
    setSelectedSkills(selectedSkills.filter(s => s !== skill));
  };

  const addCustomSkill = () => {
    if (customSkill.trim()) {
      const skill = customSkill.trim();
      if (!selectedSkills.includes(skill)) {
        setSelectedSkills([...selectedSkills, skill]);
      }
      setCustomSkill('');
    }
  };

  const addTool = (tool: string) => {
    if (!selectedTools.includes(tool)) {
      setSelectedTools([...selectedTools, tool]);
    }
    setCustomTool('');
    setShowToolDropdown(false);
  };

  const removeTool = (tool: string) => {
    setSelectedTools(selectedTools.filter(t => t !== tool));
  };

  const addCustomTool = () => {
    if (customTool.trim()) {
      const tool = customTool.trim();
      if (!selectedTools.includes(tool)) {
        setSelectedTools([...selectedTools, tool]);
      }
      setCustomTool('');
    }
  };

  const findRoles = async () => {
    if (selectedSkills.length === 0) {
      setError('Please select at least one skill');
      return;
    }

    setIsSearching(true);
    setError(null);
    setResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error: apiError } = await supabase.functions.invoke('role-finder', {
        body: {
          skills: selectedSkills,
          tools: selectedTools,
          yearsOfExperience,
          userId: user?.id || null
        }
      });

      if (apiError) {
        throw new Error(apiError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to find roles');
      }

      setResult(data.data);
    } catch (err: any) {
      console.error('Role finder error:', err);
      setError(err.message || 'Failed to find roles. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getSeniorityColor = (seniority: string) => {
    const s = seniority.toLowerCase();
    if (s.includes('senior') || s.includes('lead') || s.includes('principal')) return 'bg-purple-100 text-purple-700';
    if (s.includes('mid') || s.includes('intermediate')) return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.colors.background.muted }}>
      {/* Header */}
      <div
        className="pt-12 pb-8 px-6"
        style={{ backgroundColor: theme.colors.primary.DEFAULT }}
      >
        <div className="flex flex-col gap-2 max-w-4xl mx-auto">
          <a href="/tools" className="text-sm text-white/80 hover:text-white transition-colors self-start">
            ← Back to Tools
          </a>
          <h1 className="text-2xl font-bold" style={{ color: theme.colors.text.light }}>
            Alternative Role Finder
          </h1>
          <p className="text-sm" style={{ color: theme.colors.text.light }}>
            Discover jobs based on your skills — find alternative career paths and what career suits you
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">1</div>
              <p className="text-sm text-gray-600">Select your skills and tools</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">2</div>
              <p className="text-sm text-gray-600">Add your years of experience</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">3</div>
              <p className="text-sm text-gray-600">Click Find Roles to get recommendations</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">4</div>
              <p className="text-sm text-gray-600">Explore matching roles and skill gaps</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 max-w-4xl mx-auto">
        {/* Input Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6" style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}>
          
          {/* Skills Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select your skills <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-3">Choose from popular skills or add your own</p>
            
            {/* Selected Skills */}
            {selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedSkills.map(skill => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700"
                  >
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="hover:text-blue-900">
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Custom Skill Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomSkill()}
                placeholder="Type a skill and press Enter"
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addCustomSkill}
                disabled={!customSkill.trim()}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Add
              </button>
            </div>

            {/* Skills Categories */}
            <div className="space-y-4">
              {displayedCategories.map(([category, skills]) => (
                <div key={category}>
                  <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">{category}</h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.map(skill => (
                      <button
                        key={skill}
                        onClick={() => addSkill(skill)}
                        disabled={selectedSkills.includes(skill)}
                        className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                          selectedSkills.includes(skill)
                            ? 'bg-blue-100 border-blue-300 text-blue-800 cursor-default'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {!showAllCategories && (
              <button
                onClick={() => setShowAllCategories(true)}
                className="mt-4 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Show all skill categories <ChevronDown size={16} />
              </button>
            )}
          </div>

          {/* Tools Section */}
          <div className="mb-6 pt-6 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tools & Software you use
            </label>
            <p className="text-xs text-gray-500 mb-3">Optional - add tools like Excel, Figma, etc.</p>

            {selectedTools.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedTools.map(tool => (
                  <span
                    key={tool}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-green-50 text-green-700"
                  >
                    {tool}
                    <button onClick={() => removeTool(tool)} className="hover:text-green-900">
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                value={customTool}
                onChange={(e) => {
                  setCustomTool(e.target.value);
                  setShowToolDropdown(true);
                }}
                onFocus={() => setShowToolDropdown(true)}
                placeholder="Type a tool and press Enter"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              
              {showToolDropdown && filteredTools.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredTools.slice(0, 10).map(tool => (
                    <button
                      key={tool}
                      onClick={() => addTool(tool)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                    >
                      {tool}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Experience Level */}
          <div className="mb-6 pt-6 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Years of Experience
            </label>
            <p className="text-xs text-gray-500 mb-3">Optional - helps refine role recommendations</p>
            
            <select
              value={yearsOfExperience ?? ''}
              onChange={(e) => setYearsOfExperience(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select years of experience</option>
              {EXPERIENCE_LEVELS.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Search Button */}
          <button
            onClick={findRoles}
            disabled={isSearching || selectedSkills.length === 0}
            className="w-full py-3 px-6 rounded-xl font-medium text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: theme.colors.primary.DEFAULT }}
          >
            {isSearching ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Finding your ideal roles...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Find Alternative Roles
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
              <h2 className="text-lg font-bold mb-2">Career Summary</h2>
              <p className="text-white/90">{result.summary}</p>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <TrendingUp size={16} />
                <span>{result.roles.length} roles matched based on your {selectedSkills.length} skills</span>
              </div>
            </div>

            {/* Roles Grid */}
            <div className="grid gap-4">
              {result.roles.map((role, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-5 shadow-sm"
                  style={{ border: `1px solid ${theme.colors.border.DEFAULT}` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900">{role.role}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getSeniorityColor(role.seniority)}`}>
                          {role.seniority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{role.description}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-sm font-medium ${getMatchColor(role.matchScore)}`}>
                      {role.matchScore}% Match
                    </div>
                  </div>

                  {/* Salary */}
                  {role.salaryRange && (
                    <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                      <TrendingUp size={14} className="text-green-600" />
                      <span>{role.salaryRange}</span>
                    </div>
                  )}

                  {/* Required Skills */}
                  {role.requiredSkills.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Required Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {role.requiredSkills.map(skill => (
                          <span
                            key={skill}
                            className={`px-2 py-0.5 text-xs rounded ${
                              selectedSkills.some(s => skill.toLowerCase().includes(s.toLowerCase()))
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skill Gaps */}
                  {role.skillGaps.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">Skills to Develop</p>
                      <div className="flex flex-wrap gap-1">
                        {role.skillGaps.map(skill => (
                          <span key={skill} className="px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {role.certifications.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Recommended Certifications</p>
                      <div className="flex flex-wrap gap-1">
                        {role.certifications.map(cert => (
                          <span key={cert} className="px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-700 flex items-center gap-1">
                            <Award size={10} />
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Tools */}
        <div className="mt-16 mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Related Career Tools</h2>
          <p className="text-sm text-gray-500 mb-5">More free AI tools to help you find the right career and land your next role</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'CV Keyword Checker', desc: 'Check keyword match between your CV and job descriptions', href: '/tools/keyword-checker', color: '#10B981', bg: 'bg-emerald-50', border: 'border-emerald-200', tag: 'CV Tools' },
              { title: 'ATS CV Review', desc: 'Optimize your CV for ATS systems to pass automated screening', href: '/tools/ats-review', color: '#8B5CF6', bg: 'bg-purple-50', border: 'border-purple-200', tag: 'CV Tools' },
              { title: 'Interview Practice', desc: 'Practice with AI-generated questions tailored to any job description', href: '/tools/interview', color: '#8B5CF6', bg: 'bg-purple-50', border: 'border-purple-200', tag: 'Career Tools' },
              { title: 'Career Coach', desc: 'Get personalized career guidance and step-by-step advice', href: '/tools/career', color: '#F59E0B', bg: 'bg-amber-50', border: 'border-amber-200', tag: 'Career Tools' },
              { title: 'Job Scam Checker', desc: 'Verify companies and flag fraudulent recruiters before you apply', href: '/tools/scam-checker', color: '#EF4444', bg: 'bg-red-50', border: 'border-red-200', tag: 'Safety Tools' },
              { title: 'Create CV / Cover Letter', desc: 'Build a professional, ATS-ready CV and cover letter in minutes', href: '/cv', color: '#2563EB', bg: 'bg-blue-50', border: 'border-blue-200', tag: 'CV Tools' },
            ].map(tool => (
              <a
                key={tool.href}
                href={tool.href}
                className={`flex flex-col gap-2 p-5 rounded-xl border ${tool.bg} ${tool.border} hover:shadow-md transition-shadow group`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/70 text-gray-500">{tool.tag}</span>
                  <ArrowRight size={16} className="text-gray-400 group-hover:text-gray-700 transition-colors" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">{tool.title}</p>
                <p className="text-xs text-gray-600 leading-relaxed">{tool.desc}</p>
              </a>
            ))}
          </div>
        </div>

        {/* SEO Content */}
        <div className="mt-4">
          <div className="space-y-6">

            {/* Section 1 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Alternative Role Finder: Discover Jobs Based on Your Skills</h2>
              <div className="text-gray-700 space-y-3 text-sm leading-relaxed">
                <p>The <strong>Alternative Role Finder</strong> is a free AI career finder that matches your skills, tools, and experience to new career paths worldwide. Whether you're asking <em>"what jobs match my skills,"</em> exploring <em>career change ideas</em>, or trying to figure out <em>what career suits me</em> — this tool gives you personalized, data-driven answers in under five minutes.</p>
                <p>Unlike a basic career aptitude test or career path quiz, our AI cross-references your input against real hiring trends across tech, finance, marketing, engineering, healthcare, and more. It then delivers 8–12 role recommendations complete with match scores, skill gap analysis, and certification tips — helping you find the right career faster than any manual search.</p>
              </div>
            </div>

            {/* Section 2 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">How to Find Jobs Related to Your Skills (Step-by-Step)</h2>
              <div className="text-gray-700 space-y-4 text-sm leading-relaxed">
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
                  <div><strong>Select your skills</strong> — choose from categories like Technical, Digital, Data, or Soft Skills. You can also type custom skills (e.g., "Figma design," "cold calling," "Agile delivery").</div>
                </div>
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
                  <div><strong>Add tools and software</strong> — optional, but adding tools like Excel, Node.js, HubSpot, or Salesforce refines your matches significantly.</div>
                </div>
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
                  <div><strong>Set years of experience</strong> — from entry level to 10+ years. This calibrates whether results skew junior, mid, or senior.</div>
                </div>
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">4</div>
                  <div><strong>Click "Find Alternative Roles"</strong> — the AI returns your matched roles with percentage fit, skills to develop, and recommended certifications from platforms like Coursera, Google, and Cisco.</div>
                </div>
                <p className="text-gray-500 italic">This process outperforms tools like CareerOneStop Skills Matcher by adding skill gap detail and certification guidance alongside the role list.</p>
              </div>
            </div>

            {/* Section 3 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Alternative Career Paths for Popular Professions</h2>
              <div className="text-gray-700 space-y-3 text-sm leading-relaxed">
                <p>One of the most common questions job seekers ask is: <em>"What career fits my skills if I want to change direction?"</em> Our career recommendation tool surfaces surprising — and highly relevant — pivots across professions:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {[
                    { from: 'Engineers', to: 'Remote Software Developer, Cybersecurity Analyst, Renewable Energy Tech, Technical Project Manager' },
                    { from: 'Marketers', to: 'Digital Strategist, Content Director, CRM Manager, B2B Sales Lead, Brand Consultant' },
                    { from: 'Teachers', to: 'Instructional Designer, EdTech Specialist, Corporate Trainer, Curriculum Developer' },
                    { from: 'Accountants', to: 'Financial Data Analyst, Fintech Auditor, Business Intelligence Analyst, Tax Consultant' },
                    { from: 'Customer Service', to: 'UX Researcher, Account Manager, Community Manager, Success Operations Lead' },
                    { from: 'Admins', to: 'Operations Coordinator, Executive Assistant, Project Coordinator, Workflow Automation Specialist' },
                  ].map(item => (
                    <div key={item.from} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="font-semibold text-gray-800 text-xs mb-1">{item.from} →</p>
                      <p className="text-gray-600 text-xs">{item.to}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-2">These <strong>best careers to switch to</strong> are based on transferable skill overlap — the same analytical reasoning an engineer uses maps directly onto data science; the persuasion skills a marketer builds translate cleanly into relationship management or sales.</p>
              </div>
            </div>

            {/* Section 4 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Jobs Based on Your Skills: Real Examples</h2>
              <div className="text-gray-700 space-y-3 text-sm leading-relaxed">
                <p>Still wondering <em>"what jobs am I qualified for based on my resume?"</em> Here's how real skill combinations map to concrete roles:</p>
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="text-left p-3 font-semibold text-gray-700 border border-gray-200">Your Skills</th>
                        <th className="text-left p-3 font-semibold text-gray-700 border border-gray-200">Matched Roles</th>
                        <th className="text-left p-3 font-semibold text-gray-700 border border-gray-200">Suggested Cert</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { skills: 'Python, Data Analysis, SQL — 5 yrs', roles: 'Senior Data Scientist, BI Analyst, ML Engineer', cert: 'Google Data Analytics, AWS ML' },
                        { skills: 'Excel, Communication — 2 yrs', roles: 'Data Analyst, Operations Coordinator, Sales Analyst', cert: 'Microsoft Excel Expert, SQL Basics' },
                        { skills: 'Digital Marketing, Copywriting — 3 yrs', roles: 'Content Strategist, SEO Manager, Social Media Director', cert: 'HubSpot Content, Google Ads' },
                        { skills: 'JavaScript, React — 4 yrs', roles: 'Frontend Engineer, Full-Stack Dev, UI Engineer', cert: 'AWS Cloud Practitioner, Meta Frontend' },
                        { skills: 'Leadership, Project Management — 7 yrs', roles: 'Program Manager, Operations Director, Agile Coach', cert: 'PMP, PRINCE2, CSM' },
                      ].map((row, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="p-3 border border-gray-200 text-gray-700">{row.skills}</td>
                          <td className="p-3 border border-gray-200 text-gray-700">{row.roles}</td>
                          <td className="p-3 border border-gray-200 text-gray-600">{row.cert}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2">Input your own <strong>list of skills for job application</strong> to get a personalised version of this table — with match percentages and the exact gaps to close.</p>
              </div>
            </div>

            {/* Section 5 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">High-Demand Skills Across Global Job Markets</h2>
              <div className="text-gray-700 space-y-3 text-sm leading-relaxed">
                <p>Our <strong>skills to career matching</strong> engine is trained on global hiring data. These skill categories currently unlock the widest range of roles:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
                  {[
                    { cat: 'Technical', skills: 'Python, SQL, JavaScript, React, AWS' },
                    { cat: 'Data & Analytics', skills: 'Power BI, Tableau, Excel, R, Machine Learning' },
                    { cat: 'Digital & Marketing', skills: 'SEO, Content, Paid Ads, Email, CRM' },
                    { cat: 'Soft Skills', skills: 'Leadership, Communication, Problem Solving, Agile' },
                  ].map(item => (
                    <div key={item.cat} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="font-semibold text-gray-800 text-xs mb-1">{item.cat}</p>
                      <p className="text-gray-500 text-xs leading-relaxed">{item.skills}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-2">Regardless of your background, combining one technical skill with one soft skill (e.g., SQL + Communication) significantly expands the number of roles you qualify for — a pattern our <strong>career finder</strong> is specifically designed to surface.</p>
              </div>
            </div>

            {/* Section 6 – FAQ */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-5">Frequently Asked Questions</h2>
              <div className="space-y-5 text-sm text-gray-700 leading-relaxed">
                {[
                  { q: 'What is an alternative role finder?', a: 'A tool that finds "alternative career paths based on skills" — matching your existing profile to new jobs outside your current field, with skill gap analysis and upskilling guidance.' },
                  { q: 'How does this AI career finder work for "jobs based on my skills"?', a: 'The AI cross-references your selected skills, tools, and experience level against real hiring data, then returns 8–12 role matches with percentage fit, missing skills, and recommended certifications.' },
                  { q: 'Is this career path finder free?', a: 'Yes — fully free, no CV upload required. Just select your skills and click Find Roles.' },
                  { q: 'What career suits me based on my skills?', a: 'That depends on your unique combination of inputs. Excel users frequently match to analyst roles; coders to development and DevOps; marketers to content strategy and growth. The tool shows exact percentage fits for each suggestion.' },
                  { q: 'Can it help with career change ideas for engineers or marketers?', a: 'Yes. Engineers can discover paths in software, cybersecurity, or renewables. Marketers often find strong matches in digital strategy, content, or B2B sales — all surfaced from the same skill inputs.' },
                  { q: 'What job should I do with no degree?', a: 'The tool matches based on skills, not credentials. Web development, digital marketing, data analysis, and customer success are all strong no-degree paths that our career finder surfaces regularly.' },
                  { q: 'How is this different from a career aptitude test?', a: 'Career aptitude tests assess personality types. Our tool maps concrete, marketable skills to real open roles — giving you a list of jobs you can actually apply for today, not just a personality archetype.' },
                  { q: 'What are some "jobs based on my skills" examples?', a: 'Data skills → Data Analyst, BI Analyst; Marketing skills → Social Media Manager, Content Strategist; Engineering + Leadership → Technical Project Manager, Solutions Architect.' },
                ].map((faq, i) => (
                  <div key={i} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                    <p className="font-semibold text-gray-900 mb-1">{faq.q}</p>
                    <p>{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* JSON-LD Schema — enhanced */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify([
                {
                  "@context": "https://schema.org",
                  "@type": "WebApplication",
                  "name": "Alternative Role Finder",
                  "description": "Free AI-powered career path finder. Discover jobs based on your skills, explore alternative career paths, get skill gap analysis and certification tips.",
                  "url": "https://jobmeter.com/tools/role-finder",
                  "applicationCategory": "CareerApplication",
                  "operatingSystem": "Web",
                  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
                  "featureList": [
                    "Jobs based on my skills matching",
                    "Alternative career paths discovery",
                    "Skill gap analysis",
                    "Certification recommendations",
                    "AI career finder",
                    "Career change ideas"
                  ]
                },
                {
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": "What jobs match my skills?",
                      "acceptedAnswer": { "@type": "Answer", "text": "Our AI career finder cross-references your skills and experience against global hiring data to return 8-12 matched roles with percentage fit scores, skill gaps, and certification tips." }
                    },
                    {
                      "@type": "Question",
                      "name": "What career suits me based on my skills?",
                      "acceptedAnswer": { "@type": "Answer", "text": "Select your skills in the Alternative Role Finder tool. The AI analyzes your unique combination and returns the best-fitting career paths, including alternative careers you may not have considered." }
                    },
                    {
                      "@type": "Question",
                      "name": "Is this AI career finder free?",
                      "acceptedAnswer": { "@type": "Answer", "text": "Yes, the Alternative Role Finder is completely free. No CV upload or account required. Simply select your skills and click Find Alternative Roles." }
                    },
                    {
                      "@type": "Question",
                      "name": "How do I find jobs related to my skills without a degree?",
                      "acceptedAnswer": { "@type": "Answer", "text": "The tool matches purely on skills, not qualifications. Common no-degree paths it surfaces include web development, digital marketing, data analysis, customer success, and UX research." }
                    }
                  ]
                },
                {
                  "@context": "https://schema.org",
                  "@type": "HowTo",
                  "name": "How to Find Jobs Based on My Skills",
                  "description": "Use the Alternative Role Finder to discover alternative career paths that match your skills and experience.",
                  "step": [
                    { "@type": "HowToStep", "name": "Select your skills", "text": "Choose from skill categories or add custom skills like Python, SEO, or Leadership." },
                    { "@type": "HowToStep", "name": "Add tools and software", "text": "Optionally add tools like Excel, Figma, or Salesforce to refine matches." },
                    { "@type": "HowToStep", "name": "Set years of experience", "text": "Select your experience level to calibrate seniority of recommendations." },
                    { "@type": "HowToStep", "name": "Find Alternative Roles", "text": "Click the button to get 8-12 personalized role matches with skill gaps and certifications." }
                  ]
                }
              ])
            }}
          />
        </div>
      </div>
    </div>
  );
}