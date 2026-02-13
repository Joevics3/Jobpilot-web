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
            Discover new career paths based on your skills and experience
          </p>
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

        {/* SEO Content - Improved */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Discover Your Career Potential</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Find alternative job roles that match your skills and experience. Explore new career paths in Nigeria's job market.</p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-3">
                <Sparkles className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">AI-Powered Matching</h3>
              <p className="text-sm text-gray-700">Our AI analyzes your skills to find roles you qualify for that you may never have considered.</p>
            </div>
            <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-3">
                <TrendingUp className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Skill Gap Analysis</h3>
              <p className="text-sm text-gray-700">Know exactly what skills you need to develop to land your dream role.</p>
            </div>
            <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-3">
                <Award className="text-white" size={24} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Certification Tips</h3>
              <p className="text-sm text-gray-700">Get recommendations for certifications that boost your employability.</p>
            </div>
          </div>

          {/* Main SEO Content */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white text-sm">1</span>
                Why Use an Alternative Role Finder?
              </h3>
              <div className="text-gray-700 space-y-3">
                <p>Many job seekers limit themselves by only looking at traditional roles. With our Alternative Role Finder, you can discover career paths you may never have considered. Whether you're looking to pivot careers, explore related roles, or simply understand your market value, this tool provides personalized recommendations.</p>
                <p>The Nigerian job market is evolving rapidly. New roles are emerging in technology, digital marketing, data science, and remote work. Our tool helps you stay ahead by identifying roles that match your existing skills while highlighting skill gaps you can address.</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm">2</span>
                How to Use This Tool Effectively
              </h3>
              <div className="text-gray-700 space-y-3">
                <p>Using our Role Finder is simple. Start by selecting your core skills from the dropdown categories. Don't worry if you can't find everything - you can add custom skills. Add any tools or software you're proficient in, and specify your years of experience for more accurate results.</p>
                <p>The AI will analyze your profile and provide 8-12 relevant job roles. Each result shows a match score, required skills, skill gaps, and recommended certifications. Pay attention to the skill gaps section - these are areas where you can upskill to improve your chances.</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white text-sm">3</span>
                Popular Skills in Nigeria's Job Market
              </h3>
              <div className="text-gray-700 space-y-3">
                <p>The Nigerian job market has specific skills in high demand. Based on current trends, here are skills that can open multiple career doors:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                  {['Python', 'JavaScript', 'Data Analysis', 'Project Management', 'Digital Marketing', 'Excel', 'SQL', 'React', 'Node.js', 'Communication', 'Leadership', 'Problem Solving'].map(skill => (
                    <span key={skill} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">{skill}</span>
                  ))}
                </div>
                <p className="mt-3">Our tool recognizes both technical and soft skills, ensuring comprehensive career matching across various industries.</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4">Ready to Explore New Careers?</h3>
              <p className="text-white/90 mb-4">Use our Alternative Role Finder today to discover career paths that match your skills and experience.</p>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Free Tool</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">AI-Powered</span>
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Nigeria Jobs</span>
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
                "name": "Alternative Role Finder",
                "description": "Discover new career paths based on your skills. AI-powered tool to find jobs you qualify for in Nigeria.",
                "url": "https://jobmeter.com/tools/role-finder",
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
